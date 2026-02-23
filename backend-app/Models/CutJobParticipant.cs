using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_app.Models
{
    public class CutJobParticipant
    {
        public int Id { get; set; }

        public int CutJobId { get; set; }
        [ForeignKey("CutJobId")]
        public CutJob CutJob { get; set; } = null!;

        public int UserId { get; set; }
        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}
