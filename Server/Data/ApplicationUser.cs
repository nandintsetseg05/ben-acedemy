using Microsoft.AspNetCore.Identity;

namespace BenAcademy.Server.Data;

public class ApplicationUser : IdentityUser<Guid>
{
    public string Language { get; set; } = Shared.AppLanguages.English;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
