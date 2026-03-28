using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.UI.Services;
using System.Text;
using BenAcademy.Server.Data;
using BenAcademy.Server.Services;
using BenAcademy.Shared;

namespace BenAcademy.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly ITokenService _tokens;
    private readonly AppDbContext _db;
    private readonly IEmailSender _email;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> users,
        ITokenService tokens,
        AppDbContext db,
        IEmailSender email,
        ILogger<AuthController> logger)
    {
        _users = users;
        _tokens = tokens;
        _db = db;
        _email = email;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<LoginResponse>> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        if (!AppLanguages.IsSupported(request.Language))
            request.Language = AppLanguages.English;

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = true,
            Language = request.Language
        };

        var result = await _users.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return ValidationProblem(string.Join("; ", result.Errors.Select(e => e.Description)));

        await _users.AddToRoleAsync(user, AppRoles.Student);
        _db.Profiles.Add(new Profile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Name = request.Name ?? "",
            TargetBand = 6.5f,
            CurrentBand = 5f
        });
        await _db.SaveChangesAsync(cancellationToken);

        var (token, exp) = await _tokens.CreateAccessTokenAsync(user, cancellationToken);
        var roles = await _users.GetRolesAsync(user);
        return Ok(new LoginResponse
        {
            Token = token,
            ExpiresAt = exp,
            Email = user.Email ?? "",
            Role = roles.FirstOrDefault() ?? AppRoles.Student,
            UserId = user.Id
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var normalized = _users.NormalizeEmail(request.Email);
        var user = await _users.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalized, cancellationToken);
        if (user is null)
        {
            await Task.Delay(Random.Shared.Next(80, 220), cancellationToken);
            return Unauthorized();
        }

        if (!await _users.CheckPasswordAsync(user, request.Password))
        {
            await Task.Delay(Random.Shared.Next(80, 220), cancellationToken);
            return Unauthorized();
        }

        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _users.UpdateAsync(user);

        var (token, exp) = await _tokens.CreateAccessTokenAsync(user, cancellationToken);
        var roles = await _users.GetRolesAsync(user);
        return Ok(new LoginResponse
        {
            Token = token,
            ExpiresAt = exp,
            Email = user.Email ?? "",
            Role = roles.FirstOrDefault() ?? AppRoles.Student,
            UserId = user.Id
        });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        var user = await _users.FindByEmailAsync(request.Email);
        if (user is null)
        {
            await Task.Delay(Random.Shared.Next(50, 150), cancellationToken);
            return Ok(new { message = "If the account exists, password reset instructions were sent." });
        }

        var token = await _users.GeneratePasswordResetTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        var resetLink = $"https://localhost:7003/reset-password?email={Uri.EscapeDataString(user.Email!)}&token={encodedToken}";
        await _email.SendEmailAsync(user.Email!, "Ben Academy password reset",
            $"<p>Reset your password using this link:</p><p><a href=\"{resetLink}\">{resetLink}</a></p>");
        _logger.LogInformation("Password reset link for {Email}: {Link}", user.Email, resetLink);

        return Ok(new { message = "If the account exists, password reset instructions were sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var user = await _users.FindByEmailAsync(request.Email);
        if (user is null)
            return Ok();

        byte[] decoded;
        try
        {
            decoded = WebEncoders.Base64UrlDecode(request.Token);
        }
        catch
        {
            return BadRequest(new { error = "Invalid token format." });
        }

        var token = Encoding.UTF8.GetString(decoded);
        var result = await _users.ResetPasswordAsync(user, token, request.NewPassword);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        return Ok(new { message = "Password updated." });
    }
}
