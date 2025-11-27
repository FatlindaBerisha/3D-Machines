using backend_app.Data;
using backend_app.Models;
using backend_app.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin")]
    public class FilamentController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public FilamentController(AppDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // GET: api/filament
        [HttpGet]
        public async Task<IActionResult> GetFilaments()
        {
            var filaments = await _context.Filaments.ToListAsync();
            return Ok(filaments);
        }

        // GET: api/filament/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetFilament(int id)
        {
            var filament = await _context.Filaments.FindAsync(id);
            if (filament == null) return NotFound();
            return Ok(filament);
        }

        // POST: api/filament
        [HttpPost]
        public async Task<IActionResult> CreateFilament([FromBody] Filament filament)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            _context.Filaments.Add(filament);
            await _context.SaveChangesAsync();

            // Dërgo njoftim te të gjithë klientët
            await _hubContext.Clients.All.SendAsync("ReceiveMessage", "System", $"Filament '{filament.Name}' u shtua!");

            return CreatedAtAction(nameof(GetFilament), new { id = filament.Id }, filament);
        }

        // PUT: api/filament/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFilament(int id, [FromBody] Filament filament)
        {
            if (id != filament.Id) return BadRequest("ID mismatch");
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var existing = await _context.Filaments.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Name = filament.Name;
            existing.Color = filament.Color;
            existing.MaterialType = filament.MaterialType;
            existing.Diameter = filament.Diameter;
            existing.Description = filament.Description;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/filament/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFilament(int id)
        {
            var filament = await _context.Filaments.FindAsync(id);
            if (filament == null) return NotFound();

            // Kontrollojmë nëse ka print jobs të lidhura
            var hasTasks = await _context.PrintJobs.AnyAsync(t => t.FilamentId == id);
            if (hasTasks)
            {
                return BadRequest("This filament cannot be deleted because it has linked tasks.");
            }

            _context.Filaments.Remove(filament);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/filament/{id}/check-tasks
        [HttpGet("{id}/check-tasks")]
        public async Task<IActionResult> CheckFilamentTasks(int id)
        {
            var hasTasks = await _context.PrintJobs.AnyAsync(t => t.FilamentId == id);
            return Ok(new { hasTasks });
        }
    }
}