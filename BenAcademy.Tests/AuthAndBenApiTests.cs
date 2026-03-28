using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using BenAcademy.Server.Data;
using BenAcademy.Server.Services;
using BenAcademy.Shared;
using Xunit;

namespace BenAcademy.Tests;

[Collection("BenAcademy integration")]
public class AuthAndBenApiTests
{
    private readonly BenAcademyWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AuthAndBenApiTests(BenAcademyWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_returns_JWT_and_student_role()
    {
        var email = NewEmail();
        var res = await _client.PostAsJsonAsync("api/auth/register", new RegisterRequest
        {
            Email = email,
            Password = "testpass1",
            Name = "Test User",
            Language = AppLanguages.Mongolian
        });

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(body);
        Assert.False(string.IsNullOrEmpty(body.Token));
        Assert.Equal(AppRoles.Student, body.Role);
        Assert.Equal(email, body.Email);
        Assert.NotEqual(Guid.Empty, body.UserId);
    }

    [Fact]
    public async Task Login_invalid_password_returns_401()
    {
        var email = NewEmail();
        await RegisterAsync(email, "correctpass1");

        var res = await _client.PostAsJsonAsync("api/auth/login", new LoginRequest
        {
            Email = email,
            Password = "wrongpass"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Login_valid_returns_JWT()
    {
        var email = NewEmail();
        await RegisterAsync(email, "loginpass1");

        var res = await _client.PostAsJsonAsync("api/auth/login", new LoginRequest
        {
            Email = email,
            Password = "loginpass1"
        });

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(body);
        Assert.False(string.IsNullOrEmpty(body.Token));
    }

    [Fact]
    public async Task Forgot_password_returns_200_without_enumeration()
    {
        var res = await _client.PostAsJsonAsync("api/auth/forgot-password", new ForgotPasswordRequest
        {
            Email = "unknown-user@local.test"
        });

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }

    [Fact]
    public async Task Ben_without_token_returns_401()
    {
        var res = await _client.PostAsJsonAsync("api/ben", new BenAiRequest
        {
            EssayText = "Hello",
            CurrentBand = 5,
            TargetBand = 6,
            UserId = Guid.NewGuid()
        });

        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Ben_student_token_and_matching_userId_returns_200_with_scores()
    {
        var email = NewEmail();
        var login = await RegisterAndLoginAsync(email, "studentpass1");

        var req = new HttpRequestMessage(HttpMethod.Post, "api/ben");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", login.Token);
        req.Content = JsonContent.Create(new BenAiRequest
        {
            EssayText = "This is a test essay for IELTS.",
            CurrentBand = 5,
            TargetBand = 7,
            UserId = login.UserId
        });

        var res = await _client.SendAsync(req);

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<BenAiResponse>();
        Assert.NotNull(body);
        Assert.Equal(6.5f, body.BandScore);
        Assert.NotEmpty(body.SuggestedTasks);
    }

    [Fact]
    public async Task Ben_userId_mismatch_returns_403()
    {
        var login = await RegisterAndLoginAsync(NewEmail(), "mismatch1");

        var req = new HttpRequestMessage(HttpMethod.Post, "api/ben");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", login.Token);
        req.Content = JsonContent.Create(new BenAiRequest
        {
            EssayText = "Essay",
            CurrentBand = 5,
            TargetBand = 6,
            UserId = Guid.NewGuid()
        });

        var res = await _client.SendAsync(req);

        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task Ben_teacher_role_returns_403()
    {
        var email = NewEmail();
        var login = await RegisterAndLoginAsync(email, "teacherpass1");

        using (var scope = _factory.Services.CreateScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = await users.FindByEmailAsync(email);
            Assert.NotNull(user);
            await users.RemoveFromRoleAsync(user, AppRoles.Student);
            await users.AddToRoleAsync(user, AppRoles.Teacher);
        }

        string freshToken;
        using (var scope = _factory.Services.CreateScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var tokens = scope.ServiceProvider.GetRequiredService<ITokenService>();
            var user = await users.FindByEmailAsync(email);
            (freshToken, _) = await tokens.CreateAccessTokenAsync(user!);
        }

        var req = new HttpRequestMessage(HttpMethod.Post, "api/ben");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", freshToken);
        req.Content = JsonContent.Create(new BenAiRequest
        {
            EssayText = "Essay",
            CurrentBand = 6,
            TargetBand = 7,
            UserId = login.UserId
        });

        var res = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task Duplicate_register_returns_400()
    {
        var email = NewEmail();
        var first = await _client.PostAsJsonAsync("api/auth/register", new RegisterRequest
        {
            Email = email,
            Password = "duppass1"
        });
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await _client.PostAsJsonAsync("api/auth/register", new RegisterRequest
        {
            Email = email,
            Password = "duppass1"
        });
        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }

    private static string NewEmail() => $"u_{Guid.NewGuid():N}@test.local";

    private async Task RegisterAsync(string email, string password)
    {
        var res = await _client.PostAsJsonAsync("api/auth/register", new RegisterRequest
        {
            Email = email,
            Password = password,
            Name = "T"
        });
        res.EnsureSuccessStatusCode();
    }

    private async Task<LoginResponse> RegisterAndLoginAsync(string email, string password)
    {
        await RegisterAsync(email, password);
        var res = await _client.PostAsJsonAsync("api/auth/login", new LoginRequest
        {
            Email = email,
            Password = password
        });
        res.EnsureSuccessStatusCode();
        return (await res.Content.ReadFromJsonAsync<LoginResponse>())!;
    }
}
