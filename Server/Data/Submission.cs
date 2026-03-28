using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using BenAcademy.Shared;

namespace BenAcademy.Server.Data;

public class Submission
{
    public Guid Id { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public ApplicationUser User { get; set; } = null!;

    [Required]
    public Guid TestId { get; set; }

    [ForeignKey(nameof(TestId))]
    public PracticeTest Test { get; set; } = null!;

    /// <summary>JSON payload of learner answers / essay text snapshot.</summary>
    public string AnswersJson { get; set; } = "{}";

    public float Score { get; set; }

    /// <summary>Structured AI output (JSON).</summary>
    public string AiFeedbackJson { get; set; } = "{}";

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastAutoSave { get; set; }
    public SubmissionStatus Status { get; set; } = SubmissionStatus.InProgress;
    public bool FlaggedForReview { get; set; }
}
