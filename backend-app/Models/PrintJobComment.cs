using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_app.Models
{
    public class PrintJobComment
    {
        public int Id { get; set; }

        public int PrintJobId { get; set; }
        [ForeignKey("PrintJobId")]
        public PrintJob PrintJob { get; set; } = null!;

        public int UserId { get; set; }
        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        [Required]
        public string Text { get; set; } = string.Empty;

        public string? Tag { get; set; } // Context tag (Printer Issue, Material Change, etc.)

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
