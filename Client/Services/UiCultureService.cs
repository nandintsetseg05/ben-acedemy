using Microsoft.JSInterop;

namespace BenAcademy.Client.Services;

public class UiCultureService(IJSRuntime js)
{
    public string Culture { get; private set; } = "en";

    public event Action? OnChange;

    public async Task InitializeAsync()
    {
        try
        {
            var c = await js.InvokeAsync<string?>("localStorage.getItem", "ben_lang");
            if (c is "en" or "mn")
                Culture = c;
        }
        catch (JSException)
        {
            // ok during prerender
        }
    }

    public async Task SetCultureAsync(string culture)
    {
        if (culture is not ("en" or "mn")) return;
        Culture = culture;
        try
        {
            await js.InvokeVoidAsync("localStorage.setItem", "ben_lang", culture);
        }
        catch (JSException)
        {
            // ignore
        }
        OnChange?.Invoke();
    }

    public string T(string key) => Translations.Get(Culture, key);
}

public static class Translations
{
    private static readonly Dictionary<string, Dictionary<string, string>> Data = new()
    {
        ["en"] = new()
        {
            ["hero_title"] = "Ben Academy – Your IELTS AI Coach",
            ["hero_sub"] = "Practice writing, get instant AI band feedback, and move toward your target score.",
            ["cta_signup"] = "Create free account",
            ["cta_login"] = "Sign in",
            ["lang_en"] = "English",
            ["lang_mn"] = "Монгол",
            ["footer_contact"] = "Contact: support@benacademy.test · Ulaanbaatar · © Ben Academy",
            ["nav_home"] = "Home",
            ["nav_ben"] = "Writing coach",
            ["logout"] = "Sign out",
            ["email"] = "Email",
            ["password"] = "Password",
            ["name"] = "Display name",
            ["register_title"] = "Sign up",
            ["login_title"] = "Sign in",
            ["forgot"] = "Forgot password?",
            ["submit"] = "Submit",
            ["forgot_title"] = "Reset password",
            ["reset_title"] = "Choose a new password",
            ["essay"] = "Your essay",
            ["grade"] = "Get AI feedback",
            ["loading"] = "Working…",
        },
        ["mn"] = new()
        {
            ["hero_title"] = "Ben Academy – Таны IELTS AI дасгалжуулагч",
            ["hero_sub"] = "Бичвэрээ бэлтгэж, шууд AI үнэлгээ аваад зорилтот оноондоо ойртоно уу.",
            ["cta_signup"] = "Бүртгүүлэх",
            ["cta_login"] = "Нэвтрэх",
            ["lang_en"] = "English",
            ["lang_mn"] = "Монгол",
            ["footer_contact"] = "Холбоо барих: support@benacademy.test · Улаанбаатар · © Ben Academy",
            ["nav_home"] = "Нүүр",
            ["nav_ben"] = "Бичгийн дасгал",
            ["logout"] = "Гарах",
            ["email"] = "И-мэйл",
            ["password"] = "Нууц үг",
            ["name"] = "Нэр",
            ["register_title"] = "Бүртгүүлэх",
            ["login_title"] = "Нэвтрэх",
            ["forgot"] = "Нууц үг мартсан?",
            ["submit"] = "Илгээх",
            ["forgot_title"] = "Нууц үг сэргээх",
            ["reset_title"] = "Шинэ нууц үг",
            ["essay"] = "Таны эссэ",
            ["grade"] = "AI үнэлгээ авах",
            ["loading"] = "Түр хүлээнэ үү…",
        }
    };

    public static string Get(string culture, string key) =>
        Data.GetValueOrDefault(culture, Data["en"]).GetValueOrDefault(key, key);
}
