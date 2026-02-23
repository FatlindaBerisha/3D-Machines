using backend_app.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_app.Models
{
    public class PrintJob
    {
        public int Id { get; set; }

        [Required]
        public string JobName { get; set; } = string.Empty;

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        [Required]
        public int FilamentId { get; set; }

        [ForeignKey("FilamentId")]
        public Filament Filament { get; set; } = null!;

        public TimeSpan? Duration { get; set; }

        [Required]
        [RegularExpression("Waiting|Preparing|Printing|Post-Processing|Completed|Failed|Pending|In Progress|Testing|Paused|Meetings", ErrorMessage = "Invalid status value.")]
        public string Status { get; set; } = "Pending";

        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public DateTime? LastResumedAt { get; set; }
        public string? Description { get; set; }

        // New Print Settings Fields
        public string? Printer { get; set; }
        public string? LayerHeight { get; set; }
        public string? Nozzle { get; set; }
        public string? Infill { get; set; }
        public string? TimeEstimate { get; set; }

        public string? PrintPhase { get; set; } = "Preparing";


        public ICollection<PrintJobComment> Comments { get; set; } = new List<PrintJobComment>();
        public ICollection<PrintJobParticipant> Participants { get; set; } = new List<PrintJobParticipant>();

        // Computed property for formatted duration (HH:MM without seconds)
        [NotMapped]
        public string? DurationFormatted => Duration.HasValue 
            ? $"{(int)Duration.Value.TotalHours:D2}:{Duration.Value.Minutes:D2}" 
            : null;
    }
}