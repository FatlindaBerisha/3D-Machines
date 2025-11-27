using System.ComponentModel.DataAnnotations;

namespace backend_app.Models
{
    public class Filament
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        public string Color { get; set; }

        public string MaterialType { get; set; }

        public double Diameter { get; set; }

        public string Description { get; set; }
    }
}