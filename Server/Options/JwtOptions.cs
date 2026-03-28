namespace BenAcademy.Server.Options;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "BenAcademy";
    public string Audience { get; set; } = "BenAcademy.Client";
    public string Key { get; set; } = "";
    public int AccessTokenMinutes { get; set; } = 60;
}
