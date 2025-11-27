using Microsoft.AspNetCore.Mvc;
using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using System.Linq;

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

        // GET PROFILE
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

        // UPDATE PROFILE
        public class UpdateProfileRequest
        {
            [Required(ErrorMessage = "Full Name is required")]
            [MinLength(3, ErrorMessage = "Full Name must be at least 3 characters long")]
            public string FullName { get; set; }

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

        // GET ALL USERS (ADMIN ONLY)
        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Where(u => u.Role != "admin")
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.Phone,
                    u.Profession,
                    u.Gender,
                    u.Role
                })
                .ToListAsync();

            return Ok(users);
        }

        // CHANGE PASSWORD
        public class ChangePasswordRequest
        {
            [Required]
            public string OldPassword { get; set; }

            [Required]
            [MinLength(6)]
            public string NewPassword { get; set; }
        }

        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email))
                return Unauthorized(new { message = "Email claim missing from token." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                return NotFound(new { message = "User not found." });

            bool verified = BCrypt.Net.BCrypt.Verify(request.OldPassword, user.Password);
            if (!verified)
                return BadRequest("Incorrect old password.");

            user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully." });
        }

        // DELETE ACCOUNT
        [HttpDelete("delete")]
        public async Task<IActionResult> DeleteAccount()
        {
            var email = User.FindFirstValue(ClaimTypes.Email);

            if (string.IsNullOrEmpty(email))
                return Unauthorized(new { message = "Email claim missing from token." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
                return NotFound(new { message = "User not found." });

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Account deleted successfully." });
        }

        // DELETE USER BY ADMIN
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteUserByAdmin(int id)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
                return NotFound(new { message = "User not found." });

            if (user.Role == "admin")
                return BadRequest(new { message = "Cannot delete an admin account." });

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User deleted successfully." });
        }
    }
}