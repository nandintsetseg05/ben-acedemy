using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BenAcademy.Server.Data;

public class Profile
{
    public Guid Id { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public ApplicationUser User { get; set; } = null!;

    [MaxLength(200)]
    public string Name { get; set; } = "";

    public float TargetBand { get; set; }
    public float CurrentBand { get; set; }
}
