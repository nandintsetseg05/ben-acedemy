using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Components.Authorization;

namespace BenAcademy.Client.Services;

public class JwtAuthenticationStateProvider(AuthTokenProvider tokens) : AuthenticationStateProvider
{
    public override async Task<AuthenticationState> GetAuthenticationStateAsync()
    {
        var token = await tokens.GetTokenAsync();
        if (string.IsNullOrWhiteSpace(token))
            return Anon();

        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(token);
            if (jwt.ValidTo < DateTime.UtcNow)
            {
                await tokens.SetTokenAsync(null);
                return Anon();
            }

            var identity = new ClaimsIdentity(jwt.Claims, authenticationType: "jwt");
            return new AuthenticationState(new ClaimsPrincipal(identity));
        }
        catch
        {
            return Anon();
        }
    }

    public async Task SignInAsync(string token)
    {
        await tokens.SetTokenAsync(token);
        NotifyAuthenticationStateChanged(GetAuthenticationStateAsync());
    }

    public async Task SignOutAsync()
    {
        await tokens.SetTokenAsync(null);
        NotifyAuthenticationStateChanged(GetAuthenticationStateAsync());
    }

    private static AuthenticationState Anon() =>
        new(new ClaimsPrincipal(new ClaimsIdentity()));
}
