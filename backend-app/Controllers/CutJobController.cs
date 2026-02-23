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
using System.Text.Json;

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
                .Include(p => p.Comments).ThenInclude(c => c.User)
                .Include(p => p.Participants).ThenInclude(pp => pp.User)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return Ok(cutJobs);
        }

        // GET: api/cutjob/my (USER - Own + Participating)
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
                .Where(p => p.UserId == user.Id || p.Participants.Any(pp => pp.UserId == user.Id))
                .Include(p => p.User)
                .Include(p => p.Material)
                .Include(p => p.Comments).ThenInclude(c => c.User)
                .Include(p => p.Participants).ThenInclude(pp => pp.User)
                .OrderByDescending(p => p.CreatedAt)
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
                .Include(p => p.Comments).ThenInclude(c => c.User)
                .Include(p => p.Participants).ThenInclude(pp => pp.User)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (cutJob == null)
                return NotFound();

            // Check access: Admin, Owner, or Participant
            var email = User.FindFirstValue(ClaimTypes.Email);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            
            if (User.IsInRole("admin") || cutJob.UserId == user.Id || cutJob.Participants.Any(pp => pp.UserId == user.Id))
            {
               return Ok(cutJob);
            }

            return Forbid();
        }

        // POST: api/cutjob
        [HttpPost]
        public async Task<IActionResult> CreateCutJob([FromBody] CutJobCreateRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var email = User.FindFirstValue(ClaimTypes.Email);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return Unauthorized();

            var material = await _context.Materials.FindAsync(request.MaterialId);
            if (material == null) return BadRequest(new { error = "Invalid MaterialId" });

            var cutJob = new CutJob
            {
                JobName = request.JobName,
                CreatedAt = DateTime.UtcNow,
                UserId = user.Id,
                MaterialId = material.Id,
                Duration = null,
                Status = "Pending",
                Description = request.Description,
                Machine = request.Machine,
                Speed = request.Speed,
                Power = request.Power,
                TimeEstimate = request.TimeEstimate,
                Thickness = request.Thickness,
                OperationType = request.OperationType,
                Passes = request.Passes,
                CutPhase = request.CutPhase ?? "Preparing"
            };

            try 
            {
                _context.CutJobs.Add(cutJob);
                await _context.SaveChangesAsync();

                await NotifyUserAndAdmin(user, cutJob, "created");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Database Error: " + ex.Message, inner = ex.InnerException?.Message });
            }

            return CreatedAtAction(nameof(GetCutJobById), new { id = cutJob.Id }, cutJob);
        }

        // PUT: api/cutjob/{id} (General Update)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCutJob(int id, [FromBody] CutJobUpdateRequest request)
        {
            if (id != request.Id) return BadRequest("ID mismatch");

            var job = await _context.CutJobs.Include(p => p.User).FirstOrDefaultAsync(p => p.Id == id);
            if (job == null) return NotFound();

            // STRICT: Only Owner can edit/update (Admin restricted unless owner)
            var currentUser = await GetCurrentUser();
            if (job.UserId != currentUser.Id) return Forbid();

            var originalStatus = job.Status;

            // Restriction: Admins cannot resume a Completed task unless they are owner or participant
            if (job.Status == "Completed" && request.Status != "Completed")
            {
                // currentUser already defined above
                bool isOwnerOrParticipant = (job.UserId == currentUser.Id) || 
                    await _context.CutJobParticipants.AnyAsync(p => p.CutJobId == job.Id && p.UserId == currentUser.Id);
                
                if (!isOwnerOrParticipant && currentUser.Role == "admin")
                    return Forbid("Administrators cannot resume completed tasks created by others.");
            }

            // If status changing to In Progress -> Set StartTime if null
            if (job.Status == "Paused" && request.Status == "In Progress")
            {
                 job.LastResumedAt = DateTime.UtcNow;
            }
            // Start (Pending -> In Progress)
            else if (job.Status != "In Progress" && request.Status == "In Progress")
            {
                if (job.StartTime == null) job.StartTime = DateTime.UtcNow;
                job.LastResumedAt = DateTime.UtcNow;
            }

            // Pause (In Progress -> Paused)
            if (job.Status == "In Progress" && request.Status == "Paused")
            {
                 if (job.LastResumedAt.HasValue)
                 {
                     var sessionDuration = DateTime.UtcNow - job.LastResumedAt.Value;
                     job.Duration = (job.Duration ?? TimeSpan.Zero) + sessionDuration;
                     job.LastResumedAt = null;
                 }
            }
            
            // Finish (Any -> Completed)
            if (job.Status != "Completed" && request.Status == "Completed")
            {
                if (job.EndTime == null) job.EndTime = DateTime.UtcNow;
                
                // If it was running, add final session
                if (job.Status == "In Progress" && job.LastResumedAt.HasValue)
                {
                     var sessionDuration = DateTime.UtcNow - job.LastResumedAt.Value;
                     job.Duration = (job.Duration ?? TimeSpan.Zero) + sessionDuration;
                     job.LastResumedAt = null;
                }
                // Fallback for simple flow
                else if (job.Duration == null && job.StartTime != null)
                {
                    job.Duration = job.EndTime - job.StartTime;
                }
            }

            try 
            {
                job.JobName = request.JobName;
                job.MaterialId = request.MaterialId;
                job.Status = request.Status;
                job.Description = request.Description;
                job.Machine = request.Machine;
                job.Speed = request.Speed;
                job.Power = request.Power;
                job.TimeEstimate = request.TimeEstimate;
                job.Thickness = request.Thickness;
                job.OperationType = request.OperationType;
                job.Passes = request.Passes;
                if (request.CutPhase != null) job.CutPhase = request.CutPhase;
                
                // Allow manual override of duration only if provided
                if (request.Duration.HasValue)
                {
                    job.Duration = request.Duration;
                }

                await _context.SaveChangesAsync();

                // System Comment for Status Change
                if (originalStatus != job.Status)
                {
                    // currentUser defined above
                    _context.CutJobComments.Add(new CutJobComment
                    {
                        CutJobId = job.Id,
                        UserId = currentUser.Id,
                        Text = $"changed status to {job.Status}.",
                        Tag = "System", // Added Tag
                        CreatedAt = DateTime.UtcNow
                    });
                    await _context.SaveChangesAsync();
                }

                // System Comment for Cut Phase Change
                if (request.CutPhase != null && request.CutPhase != job.CutPhase)
                {
                    // currentUser defined above
                    _context.CutJobComments.Add(new CutJobComment
                    {
                        CutJobId = job.Id,
                        UserId = currentUser.Id,
                        Text = $"updated cut phase to: {request.CutPhase}",
                        CreatedAt = DateTime.UtcNow
                    });
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                 return StatusCode(500, new { message = "Database Error: " + ex.Message, inner = ex.InnerException?.Message });
            }

            try 
            {
                await NotifyUserAndAdmin(job.User, job, "updated");
            }
            catch (Exception) 
            {
                // Ignore notification failures
            }

            return Ok(job);
        }

        // POST: api/cutjob/{id}/start
        [HttpPost("{id}/start")]
        public async Task<IActionResult> StartJob(int id)
        {
            var job = await _context.CutJobs.Include(p => p.User).FirstOrDefaultAsync(p => p.Id == id);
            if (job == null) return NotFound();
            // STRICT: Only Owner can start
            var currentUser = await GetCurrentUser();
            if (job.UserId != currentUser.Id) return Forbid();

            // currentUser already defined
            // Restriction: Admins cannot resume a Completed task unless they are owner or participant
            if (job.Status == "Completed")
            {
                bool isOwnerOrParticipant = (job.UserId == currentUser.Id) || 
                    await _context.CutJobParticipants.AnyAsync(p => p.CutJobId == job.Id && p.UserId == currentUser.Id);
                
                if (!isOwnerOrParticipant && currentUser.Role == "admin")
                    return Forbid("Administrators cannot resume completed tasks created by others.");
            }

            if (job.Status == "In Progress") return BadRequest("Job already in progress.");

            job.Status = "In Progress";
            
            if (job.StartTime == null) 
                job.StartTime = DateTime.UtcNow;

            job.LastResumedAt = DateTime.UtcNow;

            // System Comment
            var commentText = (job.Status == "In Progress" && job.StartTime == job.LastResumedAt) 
                              ? "started the task." 
                              : "resumed the task.";

            _context.CutJobComments.Add(new CutJobComment
            {
                CutJobId = id,
                UserId = currentUser.Id,
                Text = commentText,
                Tag = "System",
                CreatedAt = DateTime.UtcNow
            });
            
            await _context.SaveChangesAsync();

            try { await NotifyUserAndAdmin(job.User, job, "started"); }
            catch (Exception) { /* Ignore notification failures */ }

            return Ok(job);
        }

        // POST: api/cutjob/{id}/pause
        [HttpPost("{id}/pause")]
        public async Task<IActionResult> PauseJob(int id)
        {
            var job = await _context.CutJobs.Include(p => p.User).FirstOrDefaultAsync(p => p.Id == id);
            if (job == null) return NotFound();
            // STRICT: Only Owner can pause
            var currentUser = await GetCurrentUser();
            if (job.UserId != currentUser.Id) return Forbid();

            if (job.Status != "In Progress") return BadRequest("Job is not in progress.");

            if (job.LastResumedAt.HasValue)
            {
                var sessionDuration = DateTime.UtcNow - job.LastResumedAt.Value;
                job.Duration = (job.Duration ?? TimeSpan.Zero) + sessionDuration;
            }

            job.Status = "Paused";
            job.LastResumedAt = null;

            // System Comment
            _context.CutJobComments.Add(new CutJobComment
            {
                CutJobId = id,
                UserId = currentUser.Id,
                Text = "paused the task.",
                Tag = "System",
                CreatedAt = DateTime.UtcNow
            });
            
            await _context.SaveChangesAsync();

            try { await NotifyUserAndAdmin(job.User, job, "paused"); }
            catch (Exception) { /* Ignore notification failures */ }

            return Ok(job);
        }

        // POST: api/cutjob/{id}/finish
        [HttpPost("{id}/finish")]
        public async Task<IActionResult> FinishJob(int id)
        {
            var job = await _context.CutJobs.Include(p => p.User).FirstOrDefaultAsync(p => p.Id == id);
            if (job == null) return NotFound();
            // STRICT: Only Owner can finish
            var currentUser = await GetCurrentUser();
            if (job.UserId != currentUser.Id) return Forbid();

            job.Status = "Completed";
            job.EndTime = DateTime.UtcNow;
            
            // Add final session if running
            if (job.LastResumedAt.HasValue)
            {
                var sessionDuration = DateTime.UtcNow - job.LastResumedAt.Value;
                job.Duration = (job.Duration ?? TimeSpan.Zero) + sessionDuration;
                job.LastResumedAt = null;
            }
            // Fallback
            else if (job.Duration == null && job.StartTime.HasValue)
            {
                job.Duration = job.EndTime - job.StartTime;
            }

            // System Comment
            // System Comment
            // currentUser defined above
            _context.CutJobComments.Add(new CutJobComment
            {
                CutJobId = id,
                UserId = currentUser.Id,
                Text = "finished the task.",
                Tag = "System",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            try { await NotifyUserAndAdmin(job.User, job, "finished"); }
            catch (Exception) { /* Ignore notification failures */ }

            return Ok(job);
        }

        // POST: api/cutjob/{id}/participants
        [HttpPost("{id}/participants")]
        public async Task<IActionResult> AddParticipant(int id, [FromBody] CutUserIdRequest request)
        {
            var job = await _context.CutJobs.Include(p => p.User).Include(p => p.Participants).FirstOrDefaultAsync(p => p.Id == id);
            if (job == null) return NotFound();
            
            // Only Owner or Admin can add participants
            var currentUser = await GetCurrentUser();
            if (currentUser.Id != job.UserId && currentUser.Role != "admin") return Forbid();

            if (job.Participants.Any(p => p.UserId == request.UserId))
                return BadRequest("User already a participant.");

            var participantUser = await _context.Users.FindAsync(request.UserId);
            if (participantUser == null) return NotFound("User not found.");

            var participant = new CutJobParticipant
            {
                CutJobId = id,
                UserId = request.UserId,
                JoinedAt = DateTime.UtcNow
            };

            _context.CutJobParticipants.Add(participant);
            await _context.SaveChangesAsync();

            return Ok(participant);
        }

        // DELETE: api/cutjob/{id}/participants/{userId}
        [HttpDelete("{id}/participants/{userId}")]
        public async Task<IActionResult> RemoveParticipant(int id, int userId)
        {
            var job = await _context.CutJobs.FirstOrDefaultAsync(p => p.Id == id);
            if (job == null) return NotFound();
            
            // Only Owner or Admin can remove participants
            var currentUser = await GetCurrentUser();
            if (currentUser.Id != job.UserId && currentUser.Role != "admin") return Forbid();

            var participant = await _context.CutJobParticipants
                .FirstOrDefaultAsync(p => p.CutJobId == id && p.UserId == userId);
            
            if (participant == null) return NotFound("Participant not found.");

            _context.CutJobParticipants.Remove(participant);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/cutjob/{jobId}/comments/{commentId}
        [HttpPut("{jobId}/comments/{commentId}")]
        public async Task<IActionResult> UpdateComment(int jobId, int commentId, [FromBody] CutCommentRequest request)
        {
            var comment = await _context.CutJobComments
                .Include(c => c.CutJob)
                .FirstOrDefaultAsync(c => c.Id == commentId && c.CutJobId == jobId);

            if (comment == null)
                return NotFound("Comment not found.");

            var currentUser = await GetCurrentUser();
            
            // Only the comment author can edit
            if (comment.UserId != currentUser.Id)
                return Forbid();

            comment.Text = request.Text;
            await _context.SaveChangesAsync();

            return Ok(comment);
        }

        // DELETE: api/cutjob/{jobId}/comments/{commentId}
        [HttpDelete("{jobId}/comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(int jobId, int commentId)
        {
            var comment = await _context.CutJobComments
                .Include(c => c.CutJob)
                .FirstOrDefaultAsync(c => c.Id == commentId && c.CutJobId == jobId);

            if (comment == null)
                return NotFound("Comment not found.");

            var currentUser = await GetCurrentUser();
            
            // Only the comment author can delete
            if (comment.UserId != currentUser.Id)
                return Forbid();

            _context.CutJobComments.Remove(comment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Comment deleted successfully." });
        }

        // POST: api/cutjob/{id}/comments
        [HttpPost("{id}/comments")]
        public async Task<IActionResult> AddComment(int id, [FromBody] CutCommentRequest request)
        {
            var job = await _context.CutJobs.Include(p => p.Participants).FirstOrDefaultAsync(p => p.Id == id);
            if (job == null) return NotFound();
            if (!await CanEdit(job)) return Forbid(); // Participants can also add comments

            var user = await GetCurrentUser();

            var comment = new CutJobComment
            {
                CutJobId = id,
                UserId = user.Id,
                Text = request.Text,
                Tag = request.Tag, // Support tagging
                CreatedAt = DateTime.UtcNow
            };

            _context.CutJobComments.Add(comment);
            await _context.SaveChangesAsync();
            
            // Return DTO to include User name
            return Ok(new 
            {
                comment.Id,
                comment.Text,
                comment.CreatedAt,
                User = new { user.FullName }
            });
        }

        // DELETE: api/cutjob/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCutJob(int id)
        {
            var job = await _context.CutJobs.FindAsync(id);
            if (job == null) return NotFound();

            var user = await GetCurrentUser();
            if (job.UserId != user.Id && user.Role != "admin") return Forbid();

            _context.CutJobs.Remove(job);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Helpers
        private async Task<User> GetCurrentUser()
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        private async Task<bool> CanEdit(CutJob job)
        {
            var user = await GetCurrentUser();
            if (user.Role == "admin") return true;
            if (job.UserId == user.Id) return true;
            
            // Check if participant
            var isParticipant = await _context.CutJobParticipants
                .AnyAsync(p => p.CutJobId == job.Id && p.UserId == user.Id);
            
            return isParticipant;
        }

        private async Task NotifyUserAndAdmin(User owner, CutJob job, string action)
        {
            if (owner == null) return; // Safety check

            // Localized action key (e.g., notifications.actions.started)
            string actionKey = $"notifications.actions.{action}";
            string typeKey = "notifications.types.cut";

            // Notify Owner
            var ownerMsg = new
            {
                key = "notifications.owner_job_msg",
                @params = new { jobName = job.JobName, type = typeKey, action = actionKey }
            };
            await _hubContext.Clients.User(owner.Id.ToString()).SendAsync("ReceiveMessage", "Sistemi", $"NTF:{System.Text.Json.JsonSerializer.Serialize(ownerMsg)}");

            // Notify Admin
            var adminMsg = new
            {
                key = "notifications.admin_job_msg",
                @params = new { userName = owner.FullName, jobName = job.JobName, type = typeKey, action = actionKey }
            };
            await _hubContext.Clients.Group("admins").SendAsync("ReceiveMessage", "Sistemi", $"NTF:{System.Text.Json.JsonSerializer.Serialize(adminMsg)}");
        }
    }

    // DTOs
    public class CutJobCreateRequest
    {
        [Required] public string JobName { get; set; }
        [Required] public int MaterialId { get; set; }
        [Required] public string Description { get; set; }
        // New Cut Settings
        public string? Machine { get; set; }
        public string? Speed { get; set; }
        public string? Power { get; set; }
        public string? TimeEstimate { get; set; }
        public string? Thickness { get; set; }
        public string? OperationType { get; set; }
        public int? Passes { get; set; }
        public string? CutPhase { get; set; }
    }

    public class CutJobUpdateRequest
    {
        public int Id { get; set; }
        [Required] public string JobName { get; set; }
        [Required] public int MaterialId { get; set; }
        [Required] public string Status { get; set; }
        [Required] public string Description { get; set; }
        public TimeSpan? Duration { get; set; }
        // New Cut Settings
        public string? Machine { get; set; }
        public string? Speed { get; set; }
        public string? Power { get; set; }
        public string? TimeEstimate { get; set; }
        public string? Thickness { get; set; }
        public string? OperationType { get; set; }
        public int? Passes { get; set; }
        public string? CutPhase { get; set; }
    }
    
    public class CutUserIdRequest
    {
        public int UserId { get; set; }
    }

    public class CutCommentRequest
    {
        [Required] public string Text { get; set; }
        public string? Tag { get; set; }
    }
}
