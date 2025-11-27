using backend_app.Data;
using backend_app.Hubs;
using backend_app.Models;
using backend_app.Services;
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
    public class PrintJobController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public PrintJobController(AppDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // GET: api/printjob (ADMIN)
        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAllPrintJobs()
        {
            var printJobs = await _context.PrintJobs
                .Include(p => p.User)
                .Include(p => p.Filament)
                .ToListAsync();

            return Ok(printJobs);
        }

        // GET: api/printjob/my (USER)
        [HttpGet("my")]
        public async Task<IActionResult> GetMyPrintJobs()
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email))
                return Unauthorized();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                return Unauthorized();

            var printJobs = await _context.PrintJobs
                .Where(p => p.UserId == user.Id)
                .Include(p => p.Filament)
                .ToListAsync();

            return Ok(printJobs);
        }

        // GET: api/printjob/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPrintJobById(int id)
        {
            var printJob = await _context.PrintJobs
                .Include(p => p.User)
                .Include(p => p.Filament)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (printJob == null)
                return NotFound();

            return Ok(printJob);
        }

        // POST: api/printjob
        [HttpPost]
        public async Task<IActionResult> CreatePrintJob([FromBody] PrintJobCreateRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var email = User.FindFirstValue(ClaimTypes.Email);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                return Unauthorized();

            var filament = await _context.Filaments.FindAsync(request.FilamentId);
            if (filament == null)
                return BadRequest(new { error = "Invalid FilamentId" });

            var printJob = new PrintJob
            {
                JobName = request.JobName,
                CreatedAt = DateTime.UtcNow,
                UserId = user.Id,
                FilamentId = filament.Id,
                Duration = request.Duration,
                Status = string.IsNullOrWhiteSpace(request.Status) ? "Pending" : request.Status
            };

            _context.PrintJobs.Add(printJob);
            await _context.SaveChangesAsync();

            // Notify user
            await _hubContext.Clients.User(user.Id.ToString())
                .SendAsync("ReceiveMessage", "Sistemi", $"Print job-i '{printJob.JobName}' u regjistrua dhe është në pritje.");

            // Notify admin group
            await _hubContext.Clients.Group("admin")
                .SendAsync("ReceiveMessage", "Sistemi", $"Një print job i ri u krijua nga {user.FullName}.");

            return CreatedAtAction(nameof(GetPrintJobById), new { id = printJob.Id }, printJob);
        }

        // PUT: api/printjob/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePrintJob(int id, [FromBody] PrintJobUpdateRequest request)
        {
            if (id != request.Id)
                return BadRequest("ID mismatch");

            var job = await _context.PrintJobs.FindAsync(id);
            if (job == null)
                return NotFound();

            var user = await _context.Users.FindAsync(job.UserId);
            if (user == null)
                return Unauthorized();

            job.JobName = request.JobName;
            job.FilamentId = request.FilamentId;
            job.Status = request.Status;
            job.Duration = request.Duration;

            await _context.SaveChangesAsync();

            // Notification logic
            string userMsg = null, adminMsg = null;

            switch (request.Status)
            {
                case "Completed":
                    userMsg = $"Print job-i '{job.JobName}' u përfundua me sukses.";
                    break;
                case "In Progress":
                    userMsg = $"Print job-i '{job.JobName}' është duke u printuar tani.";
                    break;
                case "Cancelled":
                case "Failed":
                    userMsg = $"Print job-i '{job.JobName}' u anulua/dështoi. Ju lutem kontrolloni.";
                    adminMsg = $"Print job-i '{job.JobName}' u anulua nga {user.FullName}.";
                    break;
            }

            if (!string.IsNullOrWhiteSpace(userMsg))
                await _hubContext.Clients.User(user.Id.ToString()).SendAsync("ReceiveMessage", "Sistemi", userMsg);

            if (!string.IsNullOrWhiteSpace(adminMsg))
                await _hubContext.Clients.Group("admin").SendAsync("ReceiveMessage", "Sistemi", adminMsg);

            return Ok(job);
        }

        // DELETE: api/printjob/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePrintJob(int id)
        {
            var job = await _context.PrintJobs.FindAsync(id);
            if (job == null)
                return NotFound();

            _context.PrintJobs.Remove(job);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    // DTOs

    public class PrintJobCreateRequest
    {
        [Required]
        public string JobName { get; set; }

        [Required]
        public int FilamentId { get; set; }

        public TimeSpan? Duration { get; set; }
        public string? Status { get; set; }
    }

    public class PrintJobUpdateRequest
    {
        public int Id { get; set; }

        [Required]
        public string JobName { get; set; }

        [Required]
        public int FilamentId { get; set; }

        [Required]
        [RegularExpression(@"^(Pending|In Progress|Completed|Cancelled|Failed)$")]
        public string Status { get; set; }

        public TimeSpan? Duration { get; set; }
    }
}