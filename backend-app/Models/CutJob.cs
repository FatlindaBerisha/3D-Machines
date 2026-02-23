using backend_app.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_app.Models
{
    public class CutJob
    {
        public int Id { get; set; }

        [Required]
        public string JobName { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        [Required]
        public int MaterialId { get; set; }

        [ForeignKey("MaterialId")]
        public Material Material { get; set; }

        public TimeSpan? Duration { get; set; }

        [Required]
        [RegularExpression("Waiting|Preparing|Cutting|Post-Processing|Completed|Failed|Pending|In Progress|Testing|Paused|Meetings", ErrorMessage = "Invalid status value.")]
        public string Status { get; set; } = "Pending";

        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public DateTime? LastResumedAt { get; set; }
        public string? Description { get; set; }

        // New Cut Settings Fields
        public string? Machine { get; set; }
        public string? Speed { get; set; }
        public string? Power { get; set; }
        public string? TimeEstimate { get; set; }

        public string? Thickness { get; set; }
        public string? OperationType { get; set; } // Cut, Engrave, Score
        public int? Passes { get; set; }

        public string? CutPhase { get; set; } = "Preparing";

        public ICollection<CutJobComment> Comments { get; set; } = new List<CutJobComment>();
        public ICollection<CutJobParticipant> Participants { get; set; } = new List<CutJobParticipant>();

        // Computed property for formatted duration (HH:MM without seconds)
        [NotMapped]
        public string? DurationFormatted => Duration.HasValue 
            ? $"{(int)Duration.Value.TotalHours:D2}:{Duration.Value.Minutes:D2}" 
            : null;
    }
}
