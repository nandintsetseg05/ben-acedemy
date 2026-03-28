# Ben Academy — Sprint 1 MVP

Online IELTS prep platform: **ASP.NET Core 9 Web API** + **Blazor WebAssembly**, **SQLite** (dev), **ASP.NET Identity** with **JWT**, **OpenAI** writing feedback, EN/MN UI strings.

Aligned with **GSD** ([get-shit-done](https://github.com/gsd-build/get-shit-done)): see `.planning/` for project context and executor skills.

## Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- Optional: `dotnet tool install --global dotnet-ef` (migrations are applied automatically on API startup)

## Configuration

1. **HTTPS dev certificate** (one-time):

   ```bash
   dotnet dev-certs https --trust
   ```

2. **JWT** — `Server/appsettings.Development.json` includes a dev-only signing key. For other environments, set `Jwt:Key` to a random string **at least 32 characters** (environment variable or user secrets).

3. **OpenAI** — set your API key (never commit it):

   ```bash
   cd Server
   dotnet user-secrets set "OpenAI:ApiKey" "sk-..."
   ```

4. **API URL for the Blazor client** — default in `Client/wwwroot/appsettings.json` is `https://localhost:7051`. If you change the API port or profile, update `ApiBaseUrl` to match.

## Run the API (HTTPS profile)

From the repo root:

```bash
dotnet run --project Server/BenAcademy.Server.csproj --launch-profile https
```

Swagger UI: `https://localhost:7051/swagger` (Development only).

SQLite file: `Server/benacademy.db` (created after first run). Roles and a seeded **Writing** `PracticeTest` are inserted on startup.

## Run the Blazor client

In a **second** terminal:

```bash
dotnet run --project Client/BenAcademy.Client.csproj --launch-profile https
```

Open `https://localhost:7003`. Register a student → **Writing coach** (`/ben`) calls `POST /api/ben` with JWT.

## Tests

Integration tests (xUnit + `WebApplicationFactory`) exercise auth and the Ben AI API with a **temp SQLite DB** and a **fake AI service** (no OpenAI calls).

```bash
dotnet test BenAcademy.sln
```

JWT validation uses **the same options pipeline** as token issuance, so test `Jwt:*` overrides from the factory apply correctly.

## EF Core migrations (manual)

Migrations run on API startup (`DbInitializer`). To add a new migration after model changes:

```bash
dotnet ef migrations add <Name> --project Server/BenAcademy.Server.csproj --startup-project Server/BenAcademy.Server.csproj
dotnet ef database update --project Server/BenAcademy.Server.csproj --startup-project Server/BenAcademy.Server.csproj
```

## Project layout

| Path | Role |
|------|------|
| `Shared/` | DTOs and enums (`RegisterRequest`, `BenAiRequest`, roles, languages) |
| `Server/` | Web API, EF Core (`AppDbContext`, Identity), controllers, `Services/BenAiGradingService` |
| `Client/` | Blazor WASM pages (landing, auth, Ben AI), JWT in `localStorage`, Bootstrap 5 |

## Security notes

- All API endpoints require JWT by default except `[AllowAnonymous]` auth routes and Swagger.
- `POST /api/ben` is **Student** only, rate-limited, and enforces `userId` == JWT subject.
- Use **HTTPS** in non-development environments and rotate `Jwt:Key`.

## GSD next steps

Use Cursor skills **`gsd-progress`** / **`gsd-next`** or mention **`gsd-plan-phase`** / **`gsd-execute-phase`** for Sprint 2+. Project skills: `ben-academy-backend`, `ben-academy-frontend`, `ben-academy-ai-integrations`, `ben-academy-security`, etc.
