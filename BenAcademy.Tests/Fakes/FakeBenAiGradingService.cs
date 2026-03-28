using System.Text.Json;
using BenAcademy.Server.Services;
using BenAcademy.Shared;

namespace BenAcademy.Tests.Fakes;

/// <summary>Deterministic AI response for integration tests (no OpenAI calls).</summary>
public sealed class FakeBenAiGradingService : IBenAiGradingService
{
    public Task<BenAiResponse> GradeWritingAsync(
        BenAiRequest request,
        Guid authenticatedUserId,
        CancellationToken cancellationToken = default)
    {
        if (request.UserId != authenticatedUserId)
            throw new UnauthorizedAccessException("userId must match the authenticated user.");

        using var doc = JsonDocument.Parse(
            """
            {"summary":"Test feedback","taskResponse":"ok","coherence":"ok","lexicalResource":"ok","grammar":"ok"}
            """);

        return Task.FromResult(new BenAiResponse
        {
            BandScore = 6.5f,
            DetailedFeedback = doc.RootElement.Clone(),
            SuggestedTasks = new List<string> { "Practice compound sentences" },
            SubmissionId = Guid.Parse("22222222-2222-2222-2222-222222222222")
        });
    }
}
