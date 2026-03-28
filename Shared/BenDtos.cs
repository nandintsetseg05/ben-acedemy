using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace BenAcademy.Shared;

public class BenAiRequest
{
    [Required]
    [MaxLength(25_000)]
    public string EssayText { get; set; } = "";

    [Range(0, 9)]
    public float CurrentBand { get; set; }

    [Range(0, 9)]
    public float TargetBand { get; set; }

    /// <summary>Must match the authenticated user id (enforced server-side).</summary>
    [Required]
    public Guid UserId { get; set; }

    /// <summary>Optional; defaults to seeded writing task when omitted.</summary>
    public Guid? TestId { get; set; }

    public Guid? SubmissionId { get; set; }
}

public class BenAiResponse
{
    public float BandScore { get; set; }
    public JsonElement DetailedFeedback { get; set; }
    public IReadOnlyList<string> SuggestedTasks { get; set; } = Array.Empty<string>();
    public Guid SubmissionId { get; set; }
}
