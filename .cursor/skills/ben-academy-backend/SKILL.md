---
name: ben-academy-backend
description: >-
  Backend conventions for Ben Academy — ASP.NET Core Web API, Entity Framework Core, Identity/JWT/roles, System.Text.Json, dependency injection, and FluentValidation/DataAnnotations. Use when implementing APIs, auth, data access, DTOs, migrations, or server-side validation for this project.
---

# Ben Academy — backend / API stack

Apply these defaults unless `PROJECT.md` or the user explicitly overrides them.

## Runtime and project shape

- Target **current .NET LTS** (or the version already in the repo’s `.csproj`). Prefer **nullable reference types** and **implicit usings** if the project file allows them.
- Use **ASP.NET Core Web API** with **controller-based** endpoints (`[ApiController]`, route prefixes like `api/[controller]` or explicit `[Route]`). Use **Minimal APIs** only for tiny probes or when the repo already standardizes on them.
- **OpenAPI / Swagger** in Development; keep XML or attribute comments on public DTOs where helpful.

## Entity Framework Core

- **Code-first** models; one **DbContext** per bounded area if the app grows, otherwise a single application context with clear `DbSet<>` groupings.
- Use **async** APIs (`ToListAsync`, `FirstOrDefaultAsync`, `SaveChangesAsync`) in controllers/services.
- **Migrations**: `dotnet ef migrations add <Name> --project <DbProject> --startup-project <ApiProject>`; review generated snapshots; never hand-edit designer state without care.
- Prefer **strongly typed IDs** or GUID PKs consistently; add indexes for foreign keys and frequent filters.
- Use **`AsNoTracking()`** for read-only queries; include related data deliberately (`Include` / projections) to avoid N+1.

## Authentication and authorization

- **ASP.NET Core Identity** for users, password hashing, and lockout (if the product needs accounts).
- **JWT Bearer** for API authentication: short-lived access tokens, secure signing key configuration (user secrets / environment / Key Vault — never committed), clock skew awareness.
- **Role-based** and **policy-based** authorization: `[Authorize(Roles = "...")]`, custom policies for fine-grained rules, and **claims** for tenant or user attributes when roles are not enough.
- Protect endpoints by default (`[Authorize]` on controllers or a global filter) and **opt out** explicitly for login/register/health.

## JSON

- Use **System.Text.Json** for serialization (default in ASP.NET Core). Configure **camelCase** property naming for JSON unless the client contract requires otherwise.
- For **AI grading / feedback** payloads, define **versioned DTOs** and validate at the boundary; avoid `JsonElement`/`dynamic` in domain logic unless parsing unknown provider shapes — then isolate that in an adapter.

## Dependency injection

- Register services in **`Program.cs`** or **extension methods** (`AddApplicationServices`, `AddInfrastructure`, etc.) for clarity.
- Lifetimes: **`AddScoped`** for EF `DbContext`, repositories, and request-scoped domain services; **`Singleton`** only for thread-safe caches/config; **`Transient`** sparingly.
- Favor **interfaces** for external integrations (AI grading client, **Stripe**, **email/push notifications**) so tests can substitute fakes.

## Input validation

- **DataAnnotations** on simple DTOs (`[Required]`, `[MaxLength]`, `[Range]`, `[EmailAddress]`).
- **FluentValidation** for multi-field rules, conditional logic, and readable messages. Register validators with DI and enable **automatic validation** (e.g. FluentValidation’s ASP.NET Core integration) so controllers stay thin.
- Return **Problem Details** (RFC 7807) or a **consistent error envelope** for validation failures; never leak stack traces in production.

## Cross-cutting checks

- **CORS** configured explicitly for known front-end origins when browser clients call the API.
- **Rate limiting** / abuse considerations on auth and AI-heavy endpoints when exposed publicly.
- **Logging**: structured logs without PII or secrets; correlate requests when a correlation ID exists.

When planning or implementing features with GSD, align new code with this document so APIs, data, auth, and validation stay consistent.
