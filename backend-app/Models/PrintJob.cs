using backend_app.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_app.Models
{
    public class PrintJob
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
        public int FilamentId { get; set; }

        [ForeignKey("FilamentId")]
        public Filament Filament { get; set; }

        public TimeSpan? Duration { get; set; }

        [Required]
        [RegularExpression("Pending|In Progress|Completed", ErrorMessage = "Invalid status value.")]
        public string Status { get; set; } = "Pending";
    }
}