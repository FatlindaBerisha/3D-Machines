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
    public class MaterialController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public MaterialController(AppDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // GET: api/material
        [HttpGet]
        public async Task<IActionResult> GetMaterials()
        {
            var materials = await _context.Materials.ToListAsync();
            return Ok(materials);
        }

        // GET: api/material/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetMaterial(int id)
        {
            var material = await _context.Materials.FindAsync(id);
            if (material == null) return NotFound();
            return Ok(material);
        }

        // POST: api/material
        [HttpPost]
        public async Task<IActionResult> CreateMaterial([FromBody] Material material)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            _context.Materials.Add(material);
            await _context.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("ReceiveMessage", "System", $"Material '{material.Name}' was added!");

            return CreatedAtAction(nameof(GetMaterial), new { id = material.Id }, material);
        }

        // PUT: api/material/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMaterial(int id, [FromBody] Material material)
        {
            if (id != material.Id) return BadRequest("ID mismatch");
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var existing = await _context.Materials.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Name = material.Name;
            existing.Color = material.Color;
            existing.MaterialType = material.MaterialType;
            existing.Thickness = material.Thickness;
            existing.Description = material.Description;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/material/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMaterial(int id)
        {
            var material = await _context.Materials.FindAsync(id);
            if (material == null) return NotFound();

            var hasTasks = await _context.CutJobs.AnyAsync(t => t.MaterialId == id);
            if (hasTasks)
            {
                return BadRequest("This material cannot be deleted because it has linked tasks.");
            }

            _context.Materials.Remove(material);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/material/{id}/check-tasks
        [HttpGet("{id}/check-tasks")]
        public async Task<IActionResult> CheckMaterialTasks(int id)
        {
            var hasTasks = await _context.CutJobs.AnyAsync(t => t.MaterialId == id);
            return Ok(new { hasTasks });
        }
    }
}
