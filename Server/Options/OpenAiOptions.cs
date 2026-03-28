namespace BenAcademy.Server.Options;

public class OpenAiOptions
{
    public const string SectionName = "OpenAI";

    public string ApiKey { get; set; } = "";
    public string Model { get; set; } = "gpt-4o-mini";
}
