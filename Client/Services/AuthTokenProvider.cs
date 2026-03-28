using Microsoft.JSInterop;

namespace BenAcademy.Client.Services;

public class AuthTokenProvider(IJSRuntime js)
{
    private const string StorageKey = "ben_academy_jwt";
    private string? _cache;

    public async Task<string?> GetTokenAsync()
    {
        if (_cache != null) return _cache;
        try
        {
            _cache = await js.InvokeAsync<string?>("localStorage.getItem", StorageKey);
        }
        catch (JSException)
        {
            /* prerender / no JS */
        }
        return _cache;
    }

    public async Task SetTokenAsync(string? token, CancellationToken cancellationToken = default)
    {
        _cache = token;
        try
        {
            if (token is null)
                await js.InvokeVoidAsync("localStorage.removeItem", StorageKey);
            else
                await js.InvokeVoidAsync("localStorage.setItem", StorageKey, token);
        }
        catch (JSException)
        {
            // ignore
        }
    }
}
