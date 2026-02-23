using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_app.Models
{
    public class PrintJobParticipant
    {
        public int Id { get; set; }

        public int PrintJobId { get; set; }
        [ForeignKey("PrintJobId")]
        public PrintJob PrintJob { get; set; } = null!;

        public int UserId { get; set; }
        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}
