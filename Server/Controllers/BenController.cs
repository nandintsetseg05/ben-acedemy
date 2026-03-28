using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using BenAcademy.Server.Services;
using BenAcademy.Shared;

namespace BenAcademy.Server.Controllers;

[ApiController]
[Route("api/ben")]
[Authorize(Roles = AppRoles.Student)]
[EnableRateLimiting("ben")]
public class BenController : ControllerBase
{
    private readonly IBenAiGradingService _ben;

    public BenController(IBenAiGradingService ben) => _ben = ben;

    [HttpPost]
    public async Task<ActionResult<BenAiResponse>> Grade([FromBody] BenAiRequest request, CancellationToken cancellationToken)
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (sub is null || !Guid.TryParse(sub, out var userId))
            return Unauthorized();

        try
        {
            var result = await _ben.GradeWritingAsync(request, userId, cancellationToken);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("OpenAI", StringComparison.OrdinalIgnoreCase))
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = ex.Message });
            return BadRequest(new { error = ex.Message });
        }
    }
}
