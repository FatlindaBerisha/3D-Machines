using Microsoft.AspNetCore.Mvc;
using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email))
                return Unauthorized(new { message = "Email claim missing from token." });

            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
                return NotFound(new { message = "User not found." });

            return Ok(new
            {
                user.FullName,
                user.Email,
                user.Phone,
                user.Profession,
                user.Gender,
                user.Role
            });
        }

        public class UpdateProfileRequest
        {
            [Required(ErrorMessage = "Full Name is required")]
            [MinLength(3, ErrorMessage = "Full Name must be at least 3 characters long")]
            public string   FullName { get; set; }

            [Phone(ErrorMessage = "Invalid phone number format")]
            public string? Phone { get; set; }

            public string? Profession { get; set; }

            public string? Gender { get; set; }
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email))
                return Unauthorized(new { message = "Email claim missing from token." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                return NotFound(new { message = "User not found." });

            user.FullName = request.FullName;
            if (!string.IsNullOrEmpty(request.Phone)) user.Phone = request.Phone;
            if (!string.IsNullOrEmpty(request.Profession)) user.Profession = request.Profession;
            if (!string.IsNullOrEmpty(request.Gender)) user.Gender = request.Gender;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                user.FullName,
                user.Email,
                user.Phone,
                user.Profession,
                user.Gender,
                user.Role
            });
        }
    }
}
