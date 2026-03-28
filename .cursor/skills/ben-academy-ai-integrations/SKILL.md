---
name: ben-academy-ai-integrations
description: >-
  AI and external integration conventions for Ben Academy — OpenAI (official .NET SDK or equivalent), async API calls, streaming vs non-streaming usage, resilient HTTP patterns, and JSON serialization for persisting AI feedback to the database. Use when implementing grading, feedback, chat, or other LLM features from C# / ASP.NET Core.
---

# Ben Academy — AI / integrations

Apply these defaults unless `PROJECT.md` or the user explicitly overrides them. Align with **`ben-academy-backend`** for EF Core, DTOs, and API boundaries, and **`ben-academy-frontend`** when shaping feedback the UI will render.

## OpenAI / .NET SDK

- Prefer the **official OpenAI .NET SDK** (`OpenAI` NuGet package) for chat/completions, embeddings, and related APIs when calling **OpenAI-hosted** models. For **Azure OpenAI**, use the **Azure-supported client** for that deployment (SDK surface aligns with the same general patterns — configure **endpoint, API key, and deployment name** from configuration, never from source).
- **Register the client** via **dependency injection** (`AddOpenAIClient` or manual `OpenAIClient` registration with `IOptions<T>`). Use **scoped** or **singleton** lifetime per SDK guidance; avoid creating a new client per HTTP request unless the SDK docs require it.
- **Model and deployment names** live in **configuration** (`appsettings`, env vars, Key Vault references). Support **dev/staging/prod** overrides without code changes.

## Async HTTP and API consumption

- All OpenAI (and similar) calls must be **`async`/`await`** end-to-end from API handlers or background jobs. Do not use **`.Result`** or **`.Wait()`** on async network calls.
- **Timeouts and cancellation**: pass **`CancellationToken`** from the HTTP request (or job scope) into SDK methods; set reasonable **client timeouts** for long generations.
- **Retries**: use **`Polly`** or **`Microsoft.Extensions.Http.Resilience`** for transient failures (429, 5xx) with **jitter** and **respect for `Retry-After`**. Cap total wait so user-facing requests do not hang unbounded.
- **Rate limits**: centralize calls behind an **application service** (e.g. `IAiGradingService`) so throttling, logging, and circuit-breaking stay consistent.
- **Streaming**: if the product needs token streams (e.g. live feedback), use the SDK’s streaming APIs and **flush** to the client in a controlled way; for **simple grading payloads**, non-streaming may be simpler and easier to persist.

## Data serialization and persistence

- Use **`System.Text.Json`** for **normalizing provider responses** into **stable, versioned** domain or persistence DTOs (e.g. `AiFeedbackRecord`, rubric scores, raw model message metadata). See **`ben-academy-backend`** for JSON naming and validation.
- **Do not persist entire raw JSON blobs alone** without a schema — store **structured fields** (scores, summary, highlights, model id, token usage, finish reason) suitable for queries and UI. Optional **`RawResponseJson`** column or storage is fine for **audit/debug**, with **PII/redaction** policy in mind.
- **EF Core**: map feedback entities with **clear FKs** to submission/user/attempt; index by `CreatedAt` and lookup keys the dashboard uses.
- **Failures**: persist **terminal error state** (provider message code, last error) where product requires partial visibility; avoid leaking **full provider error bodies** to clients in production.

## Security and compliance

- **Secrets**: API keys only in configuration providers; **never** commit keys or log them.
- **Prompts and submissions**: treat student content as **sensitive**; log **correlation ids**, not full prompts, unless explicitly approved.
- **Content policy**: handle provider refusals and empty completions gracefully in the service layer before returning to the UI.

When implementing AI features with GSD, mention **`ben-academy-ai-integrations`** alongside **`ben-academy-backend`** so HTTP, storage, and API contracts stay coherent.
