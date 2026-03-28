namespace BenAcademy.Shared;

public static class AppLanguages
{
    public const string English = "en";
    public const string Mongolian = "mn";

    public static bool IsSupported(string? code) =>
        code is English or Mongolian;
}
