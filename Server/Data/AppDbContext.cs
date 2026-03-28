using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using BenAcademy.Shared;

namespace BenAcademy.Server.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<PracticeTest> Tests => Set<PracticeTest>();
    public DbSet<Submission> Submissions => Set<Submission>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(e =>
        {
            e.Property(u => u.Language).HasMaxLength(8).IsRequired();
        });

        builder.Entity<Profile>(e =>
        {
            e.HasIndex(p => p.UserId).IsUnique();
        });

        builder.Entity<PracticeTest>(e =>
        {
            e.ToTable("Tests");
            e.Property(t => t.Type).HasConversion<string>().HasMaxLength(32);
            e.Property(t => t.Difficulty).HasConversion<string>().HasMaxLength(32);
        });

        builder.Entity<Submission>(e =>
        {
            e.Property(s => s.Status).HasConversion<string>().HasMaxLength(32);
            e.HasIndex(s => s.UserId);
            e.HasIndex(s => s.TestId);
        });
    }
}
