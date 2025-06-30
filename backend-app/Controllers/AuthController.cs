using backend_app.Data;
using backend_app.Models;
using backend_app.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using BCrypt.Net;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly EmailService _emailService;
        private readonly string _jwtSecretKey;

        public AuthController(AppDbContext context, EmailService emailService, IConfiguration configuration)
        {
            _context = context;
            _emailService = emailService;
            _jwtSecretKey = configuration["JwtSettings:SecretKey"];
        }

        public class RegisterRequest
        {
            public string FullName { get; set; }
            public string Profession { get; set; }
            public string Phone { get; set; }
            public string Email { get; set; }
            public string Password { get; set; }
            public string Gender { get; set; }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                if (request == null)
                    return BadRequest("Request body is required.");

                if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                    return BadRequest("Email and password are required.");

                if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                    return BadRequest("Email already in use.");

                if (string.IsNullOrWhiteSpace(request.Profession))
                    return BadRequest("Profession is required.");

                if (string.IsNullOrWhiteSpace(request.Gender))
                    return BadRequest("Gender is required.");

                var user = new User
                {
                    FullName = request.FullName,
                    Profession = request.Profession,
                    Phone = request.Phone,
                    Email = request.Email,
                    Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    Gender = request.Gender,
                    Role = request.Email.ToLower() == "fatlindab2019@gmail.com" ? "admin" : "user"
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                _emailService.SendRegistrationEmail(user);

                return Ok(new
                {
                    message = "Registration successful."
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Register error: " + ex.Message);
                return StatusCode(500, "An error occurred: " + ex.Message);
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                    return BadRequest("Email and password are required.");

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

                if (user == null || string.IsNullOrWhiteSpace(user.Password))
                    return Unauthorized("Invalid email or password.");

                bool verified = BCrypt.Net.BCrypt.Verify(request.Password, user.Password);
                if (!verified)
                    return Unauthorized("Invalid email or password.");

                if (user.Role == "admin" && user.Email.ToLower() != "fatlindab2019@gmail.com")
                    return Unauthorized("Access denied for this admin email.");

                var token = GenerateJwtToken(user);

                return Ok(new
                {
                    token,
                    role = user.Role,
                    fullName = user.FullName,
                    profession = user.Profession,
                    gender = user.Gender
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Login error: " + ex.Message);
                return StatusCode(500, "An error occurred: " + ex.Message);
            }
        }

        private string GenerateJwtToken(User user)
        {
            if (string.IsNullOrWhiteSpace(_jwtSecretKey) || Encoding.UTF8.GetBytes(_jwtSecretKey).Length < 32)
                throw new InvalidOperationException("JWT SecretKey must be at least 32 bytes (256 bits) long.");

            var sessionId = Guid.NewGuid().ToString();

            var claims = new[]
            {
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("FullName", user.FullName),
                new Claim(JwtRegisteredClaimNames.Jti, sessionId)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                expires: DateTime.UtcNow.AddHours(1),
                claims: claims,
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public class LoginRequest
        {
            public string Email { get; set; }
            public string Password { get; set; }

        }
    }
}
