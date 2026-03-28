---
name: ben-academy-frontend
description: >-
  Frontend conventions for Ben Academy — Blazor WebAssembly/SPA (dashboards, landing), Bootstrap or Tailwind for responsive UI, forms and data binding (auth and submissions), timed test UI with auto-save, and charts for AI feedback and progress. Use when building Blazor pages, layout, styling, or client-side features for this project.
---

# Ben Academy — frontend / UI stack

Apply these defaults unless `PROJECT.md` or the user explicitly overrides them.

## Blazor WebAssembly / SPA shell

- Use **Blazor WebAssembly** for the **student/teacher dashboard** and **marketing/landing** experience when the repo targets a **SPA + API** split (see `ben-academy-backend` for the API side).
- Organize routable UI under **`Pages/`** or **`Features/<area>/`** with **`@page`**, shared chrome in **`Layout`**, and **role-aware navigation** (student vs teacher) driven by claims or a small session/profile store.
- Prefer **`HttpClient`** + typed API clients for backend calls; register a **DelegatingHandler** or **AuthorizationMessageHandler** so JWT (or cookie-based) auth attaches consistently. Handle **401** with redirect-to-login and **refresh** flows if the API supports them.
- Keep **loading / empty / error** states explicit so dashboards stay usable on slow networks.

## Bootstrap and Tailwind CSS

- **Pick one primary system** per shell: **Bootstrap** (common in Blazor templates, component-friendly) **or** **Tailwind** (utility-first; ensure the build pipeline — e.g. `tailwindcss` + `@tailwindcss/postcss` or project-specific setup — is already configured).
- Avoid ad hoc mixing of large Bootstrap + Tailwind surface areas without isolation (e.g. separate layout zones or a documented exception). If the repo already committed to one stack, **extend that** rather than introducing the other without migration.
- **Responsive**: mobile-first breakpoints, touch-friendly controls, tables that scroll or collapse on small widths.

## Forms and data binding

- Use **`<EditForm>`** with **`DataAnnotationsValidator`** and **`ValidationSummary` / `ValidationMessage`** for **signup, login, and test submission** forms. Mirror **server validation messages** (Problem Details or shared codes) in UI copy where helpful.
- **Two-way binding**: prefer **`@bind`** with clear **model types** (DTOs aligned with API contracts). For login, avoid logging passwords; use **HTTPS-only** assumptions in copy and config.
- **Accessibility**: labels tied to inputs, focus management after errors, keyboard submit, sufficient contrast.

## Timer and auto-save (writing tests)

- Encapsulate **timer** and **auto-save** in a **dedicated component or service** (e.g. `TestSessionTimer`, `DraftAutoSave`) so pages stay readable.
- **Auto-save**: debounce keystrokes or section changes (e.g. 2–5s idle or on blur); persist to **localStorage** or the **API** per product requirements; show **“saved at …”** and **retry** on failure.
- **Timer**: sync with **server time** if exams are proctored (avoid client clock drift); clearly display **remaining time**; warn before auto-submit; use **`Page Visibility`** / **`beforeunload`** only as hints (do not rely on them for enforceable limits — server rules win).
- **Offline / flaky network**: queue saves or block submission with a clear message; never silently drop content without feedback.

## Charts and progress visualization

- Choose **one chart approach** and reuse it (e.g. a Blazor-friendly wrapper around **Chart.js**, or another library already in the repo). Prefer **accessible** charts: text summaries or tables where possible, not color-only meaning.
- Map **AI feedback** and **learning progress** to **small multiples** or simple series (scores over time, rubric breakdowns, completion %) rather than overcrowded dashboards.
- **Data**: fetch aggregates from the API where possible; if the client reshapes JSON, keep transforms in a thin layer so components receive **view models** ready for binding.

## Cross-cutting UI checks

- **Global error boundary** or top-level catch for WASM faults where supported; user-friendly fallback.
- **Localization-ready** strings for future i18n if the product might expand.
- Align **API base URL** and **CORS** with the backend skill; never embed secrets in WASM bundles.

When planning or implementing UI with GSD, mention **`ben-academy-frontend`** together with **`ben-academy-backend`** so client and server contracts stay aligned.
