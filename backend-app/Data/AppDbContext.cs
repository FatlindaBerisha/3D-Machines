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
        public DbSet<Material> Materials { get; set; }
        public DbSet<CutJob> CutJobs { get; set; }
        public DbSet<PrintJobComment> PrintJobComments { get; set; }
        public DbSet<PrintJobParticipant> PrintJobParticipants { get; set; }
        public DbSet<CutJobComment> CutJobComments { get; set; }
        public DbSet<CutJobParticipant> CutJobParticipants { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<PrintJob>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PrintJob>()
                .HasOne(p => p.Filament)
                .WithMany()
                .HasForeignKey(p => p.FilamentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CutJob>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CutJob>()
                .HasOne(p => p.Material)
                .WithMany()
                .HasForeignKey(p => p.MaterialId)
                .OnDelete(DeleteBehavior.Restrict);

            // PrintJobComment: Delete PrintJob -> Cascade, Delete User -> Restrict
            modelBuilder.Entity<PrintJobComment>()
                .HasOne(c => c.PrintJob)
                .WithMany(p => p.Comments)
                .HasForeignKey(c => c.PrintJobId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PrintJobComment>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // PrintJobParticipant: Delete PrintJob -> Cascade, Delete User -> Restrict
            modelBuilder.Entity<PrintJobParticipant>()
                .HasOne(p => p.PrintJob)
                .WithMany(j => j.Participants)
                .HasForeignKey(p => p.PrintJobId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PrintJobParticipant>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // CutJobComment: Delete CutJob -> Cascade, Delete User -> Restrict
            modelBuilder.Entity<CutJobComment>()
                .HasOne(c => c.CutJob)
                .WithMany(p => p.Comments)
                .HasForeignKey(c => c.CutJobId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CutJobComment>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // CutJobParticipant: Delete CutJob -> Cascade, Delete User -> Restrict
            modelBuilder.Entity<CutJobParticipant>()
                .HasOne(p => p.CutJob)
                .WithMany(j => j.Participants)
                .HasForeignKey(p => p.CutJobId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CutJobParticipant>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}