using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using BenAcademy.Shared;

namespace BenAcademy.Server.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await context.Database.MigrateAsync(cancellationToken);

        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        foreach (var role in new[] { AppRoles.Student, AppRoles.Teacher, AppRoles.Admin })
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole<Guid>(role) { Id = Guid.NewGuid() });
        }

        if (!await context.Tests.AnyAsync(cancellationToken))
        {
            context.Tests.Add(new PracticeTest
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Type = TestType.Writing,
                Difficulty = TestDifficulty.Medium,
                CreatedAt = DateTimeOffset.UtcNow
            });
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
