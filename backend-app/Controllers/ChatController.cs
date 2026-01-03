using backend_app.Services;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly GeminiService _geminiService;
        private readonly backend_app.Data.AppDbContext _context;

        public ChatController(GeminiService geminiService, backend_app.Data.AppDbContext context)
        {
            _geminiService = geminiService;
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Chat([FromBody] ChatRequest request)
        {
            if (string.IsNullOrEmpty(request.Message))
            {
                return BadRequest("Message is required.");
            }

            try
            {
                // Extract Email from Token and find User
                var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value 
                            ?? User.FindFirst("email")?.Value;

                int userId = 0;
                string userRole = "guest";
                if (!string.IsNullOrEmpty(email))
                {
                    var user = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
                        _context.Users, u => u.Email == email);
                    if (user != null)
                    {
                        userId = user.Id;
                        userRole = user.Role ?? "user";
                    }
                }

                // Fetch Inventory Data for AI Context
                var filaments = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(_context.Filaments);
                var materials = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(_context.Materials);

                var inventoryContext = "[INVENTORY DATA]\n";
                if (filaments.Any())
                {
                    inventoryContext += "Available Filaments:\n" + string.Join("\n", filaments.Select(f => $"- {f.Name} (Color: {f.Color}, Material: {f.MaterialType}, Dia: {f.Diameter}mm)"));
                }
                else
                {
                    inventoryContext += "No filaments currently in stock.\n";
                }

                if (materials.Any())
                {
                    inventoryContext += "\nAvailable Materials for Cutting:\n" + string.Join("\n", materials.Select(m => $"- {m.Name} (Thickness: {m.Thickness}mm)"));
                }
                else
                {
                    inventoryContext += "\nNo cutting materials currently in stock.\n";
                }

                var response = await _geminiService.GetChatResponseAsync(request.Message, userId, userRole, inventoryContext);
                return Ok(new { response });
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"CONTROLLER ERROR: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }

    public class ChatRequest
    {
        public string Message { get; set; }
    }
}