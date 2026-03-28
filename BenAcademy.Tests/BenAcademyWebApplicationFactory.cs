using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using BenAcademy.Server.Services;
using BenAcademy.Tests.Fakes;

namespace BenAcademy.Tests;

public class BenAcademyWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"ben_academy_test_{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={_dbPath}",
                ["Jwt:Issuer"] = "BenAcademy.Test",
                ["Jwt:Audience"] = "BenAcademy.Test.Client",
                ["Jwt:Key"] = "UNIT_TEST_JWT_SIGNING_KEY_AT_LEAST_32_CHARS!",
                ["Jwt:AccessTokenMinutes"] = "60",
                ["OpenAI:ApiKey"] = "",
                ["OpenAI:Model"] = "gpt-4o-mini",
            });
        });

        builder.ConfigureTestServices(services =>
        {
            foreach (var d in services.Where(s => s.ServiceType == typeof(IBenAiGradingService)).ToList())
                services.Remove(d);
            services.AddScoped<IBenAiGradingService, FakeBenAiGradingService>();
        });
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            try
            {
                if (File.Exists(_dbPath))
                    File.Delete(_dbPath);
            }
            catch
            {
                // ignore
            }
        }

        base.Dispose(disposing);
    }
}
