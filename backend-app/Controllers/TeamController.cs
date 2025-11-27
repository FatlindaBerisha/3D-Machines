using backend_app.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin")]
    public class TeamController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TeamController(AppDbContext context)
        {
            _context = context;
        }

        // ➤ GET: api/team
        [HttpGet]
        public async Task<IActionResult> GetTeamMembers()
        {
            var teamMembers = await _context.Users
                .Where(u => u.Role == "user") // only normal users
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.Profession,
                    u.Phone,
                    u.Gender
                })
                .ToListAsync();

            return Ok(teamMembers);
        }

        // ➤ DELETE: api/team/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTeamMember(string id)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id.ToString() == id && u.Role == "user");

            if (user == null)
            {
                return NotFound(new { message = "User not found or not deletable" });
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User deleted successfully" });
        }
    }
}
