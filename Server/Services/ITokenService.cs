using BenAcademy.Server.Data;

namespace BenAcademy.Server.Services;

public interface ITokenService
{
    Task<(string Token, DateTimeOffset ExpiresAt)> CreateAccessTokenAsync(ApplicationUser user, CancellationToken cancellationToken = default);
}
