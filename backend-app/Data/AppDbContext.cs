using backend_app.Models;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Filament> Filaments { get; set; }
        public DbSet<PrintJob> PrintJobs { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<PrintJob>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PrintJob>()
                .HasOne(p => p.Filament)
                .WithMany()
                .HasForeignKey(p => p.FilamentId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}