using System.ComponentModel.DataAnnotations;

namespace BenAcademy.Shared;

public class RegisterRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = "";

    [Required]
    [MinLength(8)]
    [MaxLength(100)]
    public string Password { get; set; } = "";

    [MaxLength(120)]
    public string? Name { get; set; }

    [MaxLength(8)]
    public string Language { get; set; } = AppLanguages.English;
}

public class LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    public string Password { get; set; } = "";
}

public class LoginResponse
{
    public string Token { get; set; } = "";
    public DateTimeOffset ExpiresAt { get; set; }
    public string Email { get; set; } = "";
    public string Role { get; set; } = "";
    public Guid UserId { get; set; }
}

public class ForgotPasswordRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";
}

public class ResetPasswordRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    public string Token { get; set; } = "";

    [Required]
    [MinLength(8)]
    [MaxLength(100)]
    public string NewPassword { get; set; } = "";
}
