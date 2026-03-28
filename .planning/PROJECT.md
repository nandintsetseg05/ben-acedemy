# Ben Academy

## Vision

Online IELTS preparation: practice, **AI-assisted writing feedback**, dashboards for students (and later teachers), multi-language UX (English / Mongolian).

## Sprint 1 (MVP) — shipped in repo

- Solution: `BenAcademy.sln` (`Server` Web API, `Client` Blazor WASM, `Shared` contracts).
- **Auth**: Identity + JWT; register/login/forgot/reset; roles `Student`, `Teacher`, `Admin` (new users default to Student).
- **Data**: SQLite dev DB; entities `ApplicationUser`, `Profile`, `PracticeTest` (table `Tests`), `Submission` with JSON fields for answers and AI feedback.
- **Landing**: Hero, CTA, EN/MN toggle, footer.
- **Ben AI**: `POST /api/ben` (students only), OpenAI SDK, persists `Submission`.

## Technical constraints

- .NET 9, EF Core 9, OpenAI official .NET SDK.
- Rate limiting on Ben endpoint; HTTPS + HSTS (prod); parameterized EF (no raw concatenated SQL).

## Out of scope (later phases)

- Teacher/admin dashboards, payments, SignalR notifications, production email provider.
