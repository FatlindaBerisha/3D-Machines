using backend_app.Data;
using backend_app.Models;
using backend_app.Services;
using BCrypt.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Mail;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

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

                var verificationToken = Guid.NewGuid().ToString();

                var user = new User
                {
                    FullName = request.FullName,
                    Profession = request.Profession,
                    Phone = request.Phone,
                    Email = request.Email,
                    Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    Gender = request.Gender,
                    Role = request.Email.ToLower() == "fatlindab2019@gmail.com" ? "admin" : "user",

                    VerificationToken = verificationToken,
                    VerificationTokenExpiry = DateTime.UtcNow.AddMinutes(15),
                    IsEmailVerified = false
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Send verification email to user
                _emailService.SendVerificationEmail(user);
                
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

                if (user == null)
                    return NotFound("Email not registered.");

                if (string.IsNullOrWhiteSpace(user.Password))
                    return BadRequest("Password is not set for this account.");

                bool verified = BCrypt.Net.BCrypt.Verify(request.Password, user.Password);
                if (!verified)
                    return BadRequest("Incorrect password.");

                if (user.Role == "admin" && user.Email.ToLower() != "fatlindab2019@gmail.com")
                    return Forbid("Access denied for this admin email.");

                if (!user.IsEmailVerified)
                    return BadRequest("Email not verified. Please check your inbox.");

                var token = GenerateJwtToken(user);

                // generate refresh token, save to user, and return it
                var refreshToken = GenerateRefreshToken();
                user.RefreshToken = refreshToken;
                user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7); // adjust lifetime as needed
                user.RefreshTokenCreated = DateTime.UtcNow;
                user.RefreshTokenRevoked = null;

                await _context.SaveChangesAsync();

                // Debug log to confirm saved refresh token (length only — avoid printing full token in prod)
                Console.WriteLine($"Login: saved refresh token len={refreshToken?.Length} for userId={user.Id}");

                return Ok(new
                {
                    token,
                    refreshToken,
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

        [AllowAnonymous]
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            // debug incoming request
            Console.WriteLine("RefreshToken called. hasToken=" + !(request == null || string.IsNullOrWhiteSpace(request?.RefreshToken)));

            if (request == null || string.IsNullOrWhiteSpace(request.RefreshToken))
                return BadRequest(new { message = "Refresh token is required." });

            Console.WriteLine($"RefreshToken: incoming token len={request.RefreshToken.Length}");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken);
            if (user == null)
            {
                Console.WriteLine("RefreshToken: no matching user found for token.");
                var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
                var incomingPrefix = request.RefreshToken != null && request.RefreshToken.Length >= 8 ? request.RefreshToken.Substring(0, 8) : request.RefreshToken;
                if (env.Equals("Development", StringComparison.OrdinalIgnoreCase))
                    return Unauthorized(new { message = "Invalid refresh token.", incomingRefreshPrefix = incomingPrefix });
                return Unauthorized(new { message = "Invalid refresh token." });
            }

            Console.WriteLine($"RefreshToken: found userId={user.Id} refreshExpiry={user.RefreshTokenExpiry}");

            if (!user.RefreshTokenExpiry.HasValue || user.RefreshTokenExpiry.Value < DateTime.UtcNow)
            {
                Console.WriteLine("RefreshToken: token expired for userId=" + user.Id);
                var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
                var incomingPrefix = request.RefreshToken != null && request.RefreshToken.Length >= 8 ? request.RefreshToken.Substring(0, 8) : request.RefreshToken;
                if (env.Equals("Development", StringComparison.OrdinalIgnoreCase))
                    return Unauthorized(new { message = "Refresh token has expired.", incomingRefreshPrefix = incomingPrefix, refreshTokenExpiry = user.RefreshTokenExpiry });
                return Unauthorized(new { message = "Refresh token has expired." });
            }

            // rotate refresh token
            var newRefreshToken = GenerateRefreshToken();
            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            user.RefreshTokenCreated = DateTime.UtcNow;
            user.RefreshTokenRevoked = null;

            await _context.SaveChangesAsync();

            var newJwt = GenerateJwtToken(user);

            Console.WriteLine("RefreshToken: success for userId=" + user.Id + " newRefreshLen=" + newRefreshToken.Length);

            var envOut = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
            if (envOut.Equals("Development", StringComparison.OrdinalIgnoreCase))
            {
                var incomingPrefix = request.RefreshToken != null && request.RefreshToken.Length >= 8 ? request.RefreshToken.Substring(0, 8) : request.RefreshToken;
                return Ok(new
                {
                    token = newJwt,
                    refreshToken = newRefreshToken,
                    role = user.Role,
                    fullName = user.FullName,
                    profession = user.Profession,
                    gender = user.Gender,
                    incomingRefreshPrefix = incomingPrefix
                });
            }

            return Ok(new
            {
                token = newJwt,
                refreshToken = newRefreshToken,
                role = user.Role,
                fullName = user.FullName,
                profession = user.Profession,
                gender = user.Gender
            });
        }

        [AllowAnonymous]
        [HttpPost("revoke-token")]
        public async Task<IActionResult> RevokeToken([FromBody] RevokeTokenRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.RefreshToken))
                return BadRequest("Refresh token is required.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken);
            if (user == null)
                return NotFound("Refresh token not found.");

            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            user.RefreshTokenRevoked = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Refresh token revoked." });
        }

        [AllowAnonymous]
        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return BadRequest("Token is missing.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.VerificationToken == token);
            if (user == null)
                return BadRequest("Invalid token.");

            if (user.VerificationTokenExpiry < DateTime.UtcNow)
                return BadRequest("Verification token expired.");

            user.IsEmailVerified = true;
            user.VerificationToken = null;
            user.VerificationTokenExpiry = null;

            await _context.SaveChangesAsync();

            // Notify admin
            _emailService.SendVerifiedUserEmail(user);

            // Send welcome email to the user
            _emailService.SendWelcomeEmail(user);

            return Ok(new { message = "Email verified successfully." });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Email))
                    return BadRequest("Email is required.");

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                if (user == null)
                    return NotFound("Email not registered.");

                string resetToken = Guid.NewGuid().ToString();

                user.ResetToken = resetToken;
                user.ResetTokenExpiry = DateTime.UtcNow.AddMinutes(15);
                await _context.SaveChangesAsync();

                try
                {
                    _emailService.SendPasswordResetEmail(user.Email, resetToken, user.FullName);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("SMTP ERROR => " + ex.ToString());
                    return StatusCode(500, "SMTP error: " + ex.Message);
                }

                return Ok(new { message = "Password reset email sent." });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Forgot Password ERROR => " + ex.ToString());
                return StatusCode(500, "Server error: " + ex.Message);
            }
        }


        public class ForgotPasswordRequest
        {
            public string Email { get; set; }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.Token) ||
                string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest("Invalid request.");
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.ResetToken == request.Token);

            if (user == null)
                return BadRequest("Invalid or expired token.");

            if (user.ResetTokenExpiry < DateTime.UtcNow)
                return BadRequest("Reset token has expired.");

            user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.ResetToken = null;
            user.ResetTokenExpiry = null;

            await _context.SaveChangesAsync();

            return Ok("Password reset successful.");
        }

        public class ResetPasswordRequest
        {
            public string Token { get; set; }
            public string NewPassword { get; set; }
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
                new Claim(JwtRegisteredClaimNames.Jti, sessionId),
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                expires: DateTime.UtcNow.AddMinutes(15), // <--- increased from 60 seconds to 15 minutes
                claims: claims,
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            // Base64 URL safe
            var token = Convert.ToBase64String(randomNumber)
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
            return token;
        }

        public class LoginRequest
        {
            public string Email { get; set; }
            public string Password { get; set; }
        }

        public class RefreshTokenRequest
        {
            public string RefreshToken { get; set; }
        }

        public class RevokeTokenRequest
        {
            public string RefreshToken { get; set; }
        }

        [HttpGet("debug-refresh-token")]
        public async Task<IActionResult> DebugRefreshToken([FromQuery] string email)
        {
            // DEV ONLY: returns stored refresh token and expiry for given email.
            // Remove this endpoint after testing.
            var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
            if (!env.Equals("Development", StringComparison.OrdinalIgnoreCase))
                return Forbid();

            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { message = "email query parameter is required." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
            if (user == null)
                return NotFound(new { message = "User not found." });

            return Ok(new
            {
                email = user.Email,
                refreshToken = user.RefreshToken,
                refreshTokenExpiry = user.RefreshTokenExpiry
            });
        }

        [AllowAnonymous]
        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new { message = "Email is required." });

            var user = await _context.Users.FirstOrDefaultAsync(
                u => u.Email.ToLower() == request.Email.ToLower()
            );

            if (user == null)
                return NotFound(new { message = "Email not registered." });

            if (user.IsEmailVerified)
                return BadRequest(new { message = "Email is already verified." });

            user.VerificationToken = Guid.NewGuid().ToString();
            user.VerificationTokenExpiry = DateTime.UtcNow.AddHours(24);
            await _context.SaveChangesAsync();

            _emailService.SendVerificationEmail(user);

            return Ok(new { message = "A new verification email has been sent." });
        }

        public class ResendVerificationRequest
        {
            public string Email { get; set; }
        }
    }
}