using backend_app.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "user,admin")]
    public class MaterialsUserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MaterialsUserController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/materialsuser
        [HttpGet]
        public async Task<IActionResult> GetMaterials()
        {
            var materials = await _context.Materials.ToListAsync();
            return Ok(materials);
        }
    }
}
