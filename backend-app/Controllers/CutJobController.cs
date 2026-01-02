using backend_app.Data;
using backend_app.Hubs;
using backend_app.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CutJobController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public CutJobController(AppDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // GET: api/cutjob (ADMIN)
        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAllCutJobs()
        {
            var cutJobs = await _context.CutJobs
                .Include(p => p.User)
                .Include(p => p.Material)
                .ToListAsync();

            return Ok(cutJobs);
        }

        // GET: api/cutjob/my (USER)
        [HttpGet("my")]
        public async Task<IActionResult> GetMyCutJobs()
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email))
                return Unauthorized();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                return Unauthorized();

            var cutJobs = await _context.CutJobs
                .Where(p => p.UserId == user.Id)
                .Include(p => p.Material)
                .ToListAsync();

            return Ok(cutJobs);
        }

        // GET: api/cutjob/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCutJobById(int id)
        {
            var cutJob = await _context.CutJobs
                .Include(p => p.User)
                .Include(p => p.Material)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (cutJob == null)
                return NotFound();

            return Ok(cutJob);
        }

        // POST: api/cutjob
        [HttpPost]
        public async Task<IActionResult> CreateCutJob([FromBody] CutJobCreateRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var email = User.FindFirstValue(ClaimTypes.Email);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                return Unauthorized();

            var material = await _context.Materials.FindAsync(request.MaterialId);
            if (material == null)
                return BadRequest(new { error = "Invalid MaterialId" });

            var cutJob = new CutJob
            {
                JobName = request.JobName,
                CreatedAt = DateTime.UtcNow,
                UserId = user.Id,
                MaterialId = material.Id,
                Duration = request.Duration,
                Status = string.IsNullOrWhiteSpace(request.Status) ? "Pending" : request.Status
            };

            _context.CutJobs.Add(cutJob);
            await _context.SaveChangesAsync();

            // Notify user
            await _hubContext.Clients.User(user.Id.ToString())
                .SendAsync("ReceiveMessage", "System", $"Cut job '{cutJob.JobName}' was registered and is pending.");

            // Notify admin group
            await _hubContext.Clients.Group("admin")
                .SendAsync("ReceiveMessage", "System", $"A new cut job was created by {user.FullName}.");

            return CreatedAtAction(nameof(GetCutJobById), new { id = cutJob.Id }, cutJob);
        }

        // PUT: api/cutjob/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCutJob(int id, [FromBody] CutJobUpdateRequest request)
        {
            if (id != request.Id)
                return BadRequest("ID mismatch");

            var job = await _context.CutJobs.FindAsync(id);
            if (job == null)
                return NotFound();

            var user = await _context.Users.FindAsync(job.UserId);
            if (user == null)
                return Unauthorized();

            job.JobName = request.JobName;
            job.MaterialId = request.MaterialId;
            job.Status = request.Status;
            job.Duration = request.Duration;

            await _context.SaveChangesAsync();

            // Notification logic
            string userMsg = null;

            switch (request.Status)
            {
                case "Completed":
                    userMsg = $"Cut job '{job.JobName}' was completed successfully.";
                    break;
                case "In Progress":
                    userMsg = $"Cut job '{job.JobName}' is being cut now.";
                    break;
                case "Cancelled":
                case "Failed":
                    userMsg = $"Cut job '{job.JobName}' failed or was cancelled. Please check.";
                    break;
            }

            if (!string.IsNullOrWhiteSpace(userMsg))
                await _hubContext.Clients.User(user.Id.ToString()).SendAsync("ReceiveMessage", "System", userMsg);

            return Ok(job);
        }

        // DELETE: api/cutjob/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCutJob(int id)
        {
            var job = await _context.CutJobs.FindAsync(id);
            if (job == null)
                return NotFound();

            _context.CutJobs.Remove(job);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class CutJobCreateRequest
    {
        [Required]
        public string JobName { get; set; }

        [Required]
        public int MaterialId { get; set; }

        public TimeSpan? Duration { get; set; }
        public string? Status { get; set; }
    }

    public class CutJobUpdateRequest
    {
        public int Id { get; set; }

        [Required]
        public string JobName { get; set; }

        [Required]
        public int MaterialId { get; set; }

        [Required]
        [RegularExpression(@"^(Pending|In Progress|Completed|Cancelled|Failed)$")]
        public string Status { get; set; }

        public TimeSpan? Duration { get; set; }
    }
}
