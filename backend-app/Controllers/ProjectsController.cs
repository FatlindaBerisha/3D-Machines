using backend_app.Models;
using backend_app.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectsController : ControllerBase
    {
        private readonly MongoService _mongo;
        public ProjectsController(MongoService mongo) => _mongo = mongo;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var projects = await _mongo.Projects.Find(_ => true).ToListAsync();
                return Ok(projects);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, stack = ex.StackTrace });
            }
        }


        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] CreateProjectRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ModuleName) || request.File is null || request.File.Length == 0)
                return BadRequest(new { message = "ModuleName and File are required" });

            using var stream = request.File.OpenReadStream();
            var (fileId, fileName) = await _mongo.UploadFileAsync(stream, request.File.FileName);

            var doc = new ProjectDoc
            {
                ModuleName = request.ModuleName.Trim(),
                FileName = fileName,
                FileId = fileId,
                CreatedAt = DateTime.UtcNow
            };

            await _mongo.Projects.InsertOneAsync(doc);
            return Ok(new { project = doc });
        }

        [HttpPost("{id}/update")]
        public async Task<IActionResult> Update(string id, [FromForm] UpdateProjectRequest request)
        {
            var project = await _mongo.Projects.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (project == null) return NotFound(new { message = "Project not found" });

            bool moduleChanged = !string.IsNullOrWhiteSpace(request.ModuleName) && project.ModuleName != request.ModuleName;
            bool fileChanged = request.File != null && request.File.Length > 0;

            if (!moduleChanged && !fileChanged)
                return Ok(new { message = "Project is already up to date", project });

            if (fileChanged)
            {
                await _mongo.DeleteFileAsync(project.FileId);

                using var stream = request.File!.OpenReadStream();
                var (newFileId, newFileName) = await _mongo.UploadFileAsync(stream, request.File.FileName);
                project.FileId = newFileId;
                project.FileName = newFileName;
            }

            if (moduleChanged)
                project.ModuleName = request.ModuleName!.Trim();

            project.UpdatedAt = DateTime.UtcNow;
            await _mongo.Projects.ReplaceOneAsync(x => x.Id == id, project);

            return Ok(new { message = "Project updated successfully", project });
        }

        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadFile(string id)
        {
            var project = await _mongo.Projects.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (project == null) return NotFound(new { message = "Project not found" });
            if (string.IsNullOrEmpty(project.FileId)) return NotFound(new { message = "File not found" });

            var (stream, fileName) = await _mongo.DownloadProjectFileAsync(project.FileId);

            // Merr userId nga JWT (sub claim)
            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value
                         ?? User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;

            MongoUser user = null;
            if (!string.IsNullOrEmpty(userId) && int.TryParse(userId, out int parsedUserId))
            {
                user = await _mongo.MongoUsers.Find(u => u.Id == parsedUserId).FirstOrDefaultAsync();
            }

            // Shkruan FullName te download log
            project.DownloadCount++;
            project.Downloads.Add(new ProjectDownloadLog
            {
                UserFullName = user?.FullName ?? "Anonymous",
                DownloadedAt = DateTime.UtcNow
            });

            await _mongo.Projects.ReplaceOneAsync(x => x.Id == id, project);

            return File(stream, "application/octet-stream", fileName);
        }

        [HttpGet("{id}/downloads")]
        public async Task<IActionResult> GetRecentDownloads(string id)
        {
            var project = await _mongo.Projects.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (project == null) return NotFound(new { message = "Project not found" });

            var since = DateTime.UtcNow.AddHours(-24);
            var recentDownloads = project.Downloads
                .Where(d => d.DownloadedAt >= since)
                .OrderByDescending(d => d.DownloadedAt)
                .Select(d => new {
                    FullName = d.UserFullName,   // <-- Shfaq vetëm emrin
                    DownloadedAt = d.DownloadedAt
                })
                .ToList();

            return Ok(recentDownloads);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            await _mongo.DeleteProjectAsync(id);
            return Ok(new { message = "Project deleted" });
        }
    }

    public class CreateProjectRequest
    {
        [FromForm] public string ModuleName { get; set; }
        [FromForm] public IFormFile File { get; set; }
    }

    public class UpdateProjectRequest
    {
        [FromForm] public string? ModuleName { get; set; }
        [FromForm] public IFormFile? File { get; set; }
    }
}