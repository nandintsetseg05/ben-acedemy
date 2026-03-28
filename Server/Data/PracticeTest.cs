using System.ComponentModel.DataAnnotations;
using BenAcademy.Shared;

namespace BenAcademy.Server.Data;

/// <summary>IELTS practice module definition (maps to "Test" in product vocabulary).</summary>
public class PracticeTest
{
    public Guid Id { get; set; }
    public TestType Type { get; set; }
    public TestDifficulty Difficulty { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
