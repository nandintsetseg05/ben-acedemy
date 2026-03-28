using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OpenAI;
using OpenAI.Chat;
using BenAcademy.Server.Data;
using BenAcademy.Server.Options;
using BenAcademy.Shared;

namespace BenAcademy.Server.Services;

public class BenAiGradingService : IBenAiGradingService
{
    private readonly AppDbContext _db;
    private readonly OpenAiOptions _openAi;
    private readonly ILogger<BenAiGradingService> _logger;

    public BenAiGradingService(AppDbContext db, IOptions<OpenAiOptions> openAi, ILogger<BenAiGradingService> logger)
    {
        _db = db;
        _openAi = openAi.Value;
        _logger = logger;
    }

    public async Task<BenAiResponse> GradeWritingAsync(BenAiRequest request, Guid authenticatedUserId, CancellationToken cancellationToken = default)
    {
        if (request.UserId != authenticatedUserId)
            throw new UnauthorizedAccessException("userId must match the authenticated user.");

        if (string.IsNullOrWhiteSpace(_openAi.ApiKey))
            throw new InvalidOperationException("OpenAI API key is not configured.");

        var testId = request.TestId ?? await GetDefaultWritingTestIdAsync(cancellationToken);
        var test = await _db.Tests.AsNoTracking().FirstOrDefaultAsync(t => t.Id == testId, cancellationToken)
            ?? throw new InvalidOperationException("Test not found.");

        var submission = await ResolveSubmissionAsync(request, authenticatedUserId, testId, cancellationToken);
        var answersPayload = JsonSerializer.Serialize(new
        {
            essayText = request.EssayText,
            currentBand = request.CurrentBand,
            targetBand = request.TargetBand
        });
        submission.AnswersJson = answersPayload;
        submission.LastAutoSave = DateTimeOffset.UtcNow;

        var client = new OpenAIClient(_openAi.ApiKey);
        var chat = client.GetChatClient(string.IsNullOrWhiteSpace(_openAi.Model) ? "gpt-4o-mini" : _openAi.Model);

        var systemPrompt = """
            You are an IELTS writing examiner. Evaluate Task 2-style essays.
            Respond with ONLY a single JSON object (no markdown) using this shape:
            {
              "bandScore": <number 0-9, can use half bands like 6.5>,
              "detailedFeedback": {
                "summary": "<short overview>",
                "taskResponse": "<comment>",
                "coherence": "<comment>",
                "lexicalResource": "<comment>",
                "grammar": "<comment>"
              },
              "suggestedTasks": ["<specific practice task>", "..."]
            }
            """;

        var userPrompt = $"""
            Current band estimate: {request.CurrentBand}
            Target band: {request.TargetBand}

            Essay:
            {request.EssayText}
            """;

        var completion = await chat.CompleteChatAsync(
            [
                new SystemChatMessage(systemPrompt),
                new UserChatMessage(userPrompt),
            ],
            cancellationToken: cancellationToken);

        var text = completion.Value.Content.LastOrDefault()?.Text
            ?? throw new InvalidOperationException("Empty model response.");

        var (band, feedbackEl, tasks, rawStored) = ParseModelJson(text);

        submission.Score = band;
        submission.AiFeedbackJson = rawStored;
        submission.Status = SubmissionStatus.Submitted;
        await _db.SaveChangesAsync(cancellationToken);

        return new BenAiResponse
        {
            BandScore = band,
            DetailedFeedback = feedbackEl,
            SuggestedTasks = tasks,
            SubmissionId = submission.Id
        };
    }

    private async Task<Guid> GetDefaultWritingTestIdAsync(CancellationToken ct)
    {
        var id = await _db.Tests.AsNoTracking()
            .Where(t => t.Type == TestType.Writing)
            .Select(t => t.Id)
            .FirstOrDefaultAsync(ct);
        if (id == Guid.Empty)
            throw new InvalidOperationException("No writing tests are seeded.");
        return id;
    }

    private async Task<Submission> ResolveSubmissionAsync(BenAiRequest request, Guid userId, Guid testId, CancellationToken ct)
    {
        if (request.SubmissionId is { } sid)
        {
            var existing = await _db.Submissions.FirstOrDefaultAsync(s => s.Id == sid && s.UserId == userId, ct);
            if (existing is null)
                throw new InvalidOperationException("Submission not found.");
            existing.TestId = testId;
            return existing;
        }

        var sub = new Submission
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TestId = testId,
            Status = SubmissionStatus.InProgress
        };
        _db.Submissions.Add(sub);
        await _db.SaveChangesAsync(ct);
        return sub;
    }

    private (float Band, JsonElement Feedback, List<string> Tasks, string RawForDb) ParseModelJson(string text)
    {
        text = text.Trim();
        if (text.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
            text = text[7..].TrimStart();
        if (text.StartsWith("```", StringComparison.Ordinal))
            text = text[3..].TrimStart();
        if (text.EndsWith("```", StringComparison.Ordinal))
            text = text[..^3].TrimEnd();

        using var doc = JsonDocument.Parse(text);
        var root = doc.RootElement;
        var band = root.TryGetProperty("bandScore", out var b) ? (float)b.GetDouble() : 0f;
        JsonElement feedback;
        if (root.TryGetProperty("detailedFeedback", out var df))
            feedback = df.Clone();
        else
            feedback = JsonDocument.Parse("{\"note\":\"No detailedFeedback from model\"}").RootElement.Clone();

        var tasks = new List<string>();
        if (root.TryGetProperty("suggestedTasks", out var arr) && arr.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in arr.EnumerateArray())
            {
                if (item.ValueKind == JsonValueKind.String)
                    tasks.Add(item.GetString() ?? "");
            }
        }

        var raw = root.GetRawText();
        return (band, feedback, tasks, raw);
    }
}
