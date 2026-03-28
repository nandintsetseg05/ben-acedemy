# STATE — Ben Academy

## Position

- **Milestone**: Sprint 1 MVP scaffold **complete** (2026-03-28).
- **Branch**: `main` (local).

## Decisions

- Hosted Blazor template unavailable in .NET 9 CLI → **standalone WASM + separate API**; CORS + JWT header auth.
- `PracticeTest` type name in code; table name **`Tests`** per product vocabulary.
- Forgot-password emails **logged** in development (`LogEmailSender`); replace with real SMTP/SendGrid later.

## Blockers / secrets

- `OpenAI:ApiKey` must be set via user-secrets or environment for live grading.

## Next (suggested)

- Sprint 2: teacher review queue (`FlaggedForReview`), reading/listening/speaking flows, stronger validation messages on client.
