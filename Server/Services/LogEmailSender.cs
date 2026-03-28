using Microsoft.AspNetCore.Identity.UI.Services;

namespace BenAcademy.Server.Services;

/// <summary>Development-friendly email stub — logs reset links instead of sending mail.</summary>
public class LogEmailSender(ILogger<LogEmailSender> logger) : IEmailSender
{
    public Task SendEmailAsync(string email, string subject, string htmlMessage)
    {
        logger.LogInformation("Email to {Email} subject {Subject}: {Body}", email, subject, htmlMessage);
        return Task.CompletedTask;
    }
}
