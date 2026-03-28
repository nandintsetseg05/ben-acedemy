# Ben Academy — Sprint 1 MVP

Online IELTS prep platform: **ASP.NET Core 9 Web API** + **Blazor WebAssembly**, **SQLite** (dev), **ASP.NET Identity** with **JWT**, **OpenAI** writing feedback, EN/MN UI strings.

Aligned with **GSD** ([get-shit-done](https://github.com/gsd-build/get-shit-done)): see `.planning/` for project context and executor skills.

## Required tools

1. **[.NET 9 SDK](https://dotnet.microsoft.com/download)** (9.0 or later compatible with the repo)

   ```bash
   dotnet --version
   ```

2. **Repo-local CLI tools** (EF Core migrations). From the **repository root**:

   ```bash
   dotnet tool restore
   ```

   This installs **`dotnet-ef` 9.0.2** from [`.config/dotnet-tools.json`](.config/dotnet-tools.json). Then `dotnet ef` works in this directory (no global install required).

   If you prefer a machine-wide tool instead:

   ```bash
   dotnet tool install --global dotnet-ef --version 9.0.2
   ```

3. **HTTPS development certificate** (for `https://` localhost URLs):

   ```bash
   dotnet dev-certs https --trust
   ```

## Configuration

1. **JWT** — `Server/appsettings.Development.json` includes a dev-only signing key. For other environments, set `Jwt:Key` to a random string **at least 32 characters** (environment variable or user secrets).

2. **OpenAI** — set your API key (never commit it):

   ```bash
   cd Server
   dotnet user-secrets set "OpenAI:ApiKey" "sk-..."
   ```

3. **API URL for the Blazor client** — default in `Client/wwwroot/appsettings.json` is `https://localhost:7051`. If you change the API port or profile, update `ApiBaseUrl` to match.

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

Migrations run on API startup (`DbInitializer`). To add or apply migrations manually, run **`dotnet tool restore`** once from the repo root, then:

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
