using backend_app.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "user,admin")] // mund edhe me e ba AllowAnonymous, nëse dëshiron
    public class FilamentsUserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FilamentsUserController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/filamentsuser
        [HttpGet]
        public async Task<IActionResult> GetFilaments()
        {
            var filaments = await _context.Filaments.ToListAsync();
            return Ok(filaments);
        }
    }
}