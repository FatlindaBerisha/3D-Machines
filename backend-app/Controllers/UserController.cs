using Microsoft.AspNetCore.Mvc;
using backend_app.Data;
using backend_app.Models;
using backend_app.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Security.Cryptography;
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
        private readonly EmailService _emailService;

        public UserController(AppDbContext context, EmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // GET PROFILE
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email))
                return Unauthorized(new { message = "Email claim missing from token." });

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
                return NotFound(new { message = "User not found." });

            // Auto-clear expired email change tokens
            if (user.EmailChangeTokenExpiry.HasValue && user.EmailChangeTokenExpiry.Value < DateTime.UtcNow)
            {
                user.PendingEmail = null;
                user.EmailChangeToken = null;
                user.EmailChangeTokenExpiry = null;
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                user.FullName,
                user.Email,
                user.Phone,
                user.Profession,
                user.Gender,
                user.Role,
                user.PendingEmail,
                user.PreferredLanguage
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
            public string? PreferredLanguage { get; set; }
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
            if (!string.IsNullOrEmpty(request.PreferredLanguage)) user.PreferredLanguage = request.PreferredLanguage;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                user.FullName,
                user.Email,
                user.Phone,
                user.Profession,
                user.Gender,
                user.Role,
                user.PreferredLanguage
            });
        }

        // GET ALL USERS (Authenticated Users)
        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                // .Where(u => u.Role != "admin") // Allow seeing admins for collaboration
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
        public class DeleteAccountRequest
        {
            [Required]
            public string Password { get; set; }
        }

        [HttpDelete("delete")]
        public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email))
                return Unauthorized(new { message = "Email claim missing from token." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                return NotFound(new { message = "User not found." });

            // Verify password
            bool verified = BCrypt.Net.BCrypt.Verify(request.Password, user.Password);
            if (!verified)
                return BadRequest(new { message = "Incorrect password." });

            // Manually delete related data to avoid FK constraints if CASCADE is not applied in DB
            var printJobs = await _context.PrintJobs.Where(p => p.UserId == user.Id).ToListAsync();
            _context.PrintJobs.RemoveRange(printJobs);

            var cutJobs = await _context.CutJobs.Where(c => c.UserId == user.Id).ToListAsync();
            _context.CutJobs.RemoveRange(cutJobs);

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

        // REQUEST EMAIL CHANGE
        public class RequestEmailChangeRequest
        {
            [Required, EmailAddress]
            public string NewEmail { get; set; }

            [Required]
            public string CurrentPassword { get; set; }

            public string? Language { get; set; }
        }

        [HttpPost("request-email-change")]
        public async Task<IActionResult> RequestEmailChange([FromBody] RequestEmailChangeRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email))
                return Unauthorized(new { message = "Email claim missing from token." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                return NotFound(new { message = "User not found." });

            // Verify current password
            bool verified = BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.Password);
            if (!verified)
                return BadRequest(new { message = "Incorrect password." });

            // Check if new email is the same as current
            if (user.Email.Equals(request.NewEmail, StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "New email must be different from current email." });

            // Check if new email is already taken
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.NewEmail);
            if (existingUser != null)
                return BadRequest(new { message = "This email is already in use." });

            // Generate token
            var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

            // Store pending email change
            user.PendingEmail = request.NewEmail;
            user.EmailChangeToken = token;
            user.EmailChangeTokenExpiry = DateTime.UtcNow.AddHours(24);

            // Update PreferredLanguage if provided and different
            if (!string.IsNullOrEmpty(request.Language) && user.PreferredLanguage != request.Language)
            {
                user.PreferredLanguage = request.Language;
            }

            await _context.SaveChangesAsync();

            // Send verification email to new address
            string sendLang = request.Language ?? user.PreferredLanguage ?? "en";
            
            _emailService.SendEmailChangeVerification(user, sendLang);
            _emailService.SendEmailChangeNotification(user, sendLang);

            return Ok(new { message = "Verification email sent to your new email address." });
        }
    }
}