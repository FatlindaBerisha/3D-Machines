using System.ComponentModel.DataAnnotations;

namespace backend_app.Models
{
    public class Material
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        public string Color { get; set; }

        public string MaterialType { get; set; }

        public double Thickness { get; set; }

        public string Description { get; set; }
    }
}
