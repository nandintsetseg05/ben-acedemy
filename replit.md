# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (no API key needed)
- **Payments**: Stripe (requires STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_WEBHOOK_SECRET env vars)
- **Auth**: JWT (SESSION_SECRET env var)

## Project: Ben Academy — Sprint 3

An IELTS Writing Test preparation platform with a Teacher Marketplace.

### Sprint 2 Features (complete)
- Secure timed writing tests (40 min, auto-save, tab-switch detection, lock after submit)
- AI grading by "Ben AI" (OpenAI GPT) with band scores (0-9), detailed feedback on 4 IELTS criteria
- Student dashboard with progress chart, weakness analysis, suggested tasks
- Stripe monthly subscriptions (Free vs Paid test access)
- JWT authentication with role-based access

### Sprint 3 Features (complete)
- **Teacher Marketplace**: Browse and filter teachers by IELTS score / hourly rate
- **Teacher Profiles**: Teachers can set up profiles (IELTS score, bio, rate, availability, specializations)
- **1:1 Session Booking**: Students book sessions (first 3 per teacher are free); teachers accept/decline/complete
- **In-app Notifications**: Bell icon in navbar, real-time alerts for booking updates
- **Teacher Dashboard**: Manage incoming bookings, respond, mark complete
- **Student Bookings Page**: View all past and upcoming sessions with status badges

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   │   └── src/
│   │       ├── routes/     # auth, tests, submissions, ben, dashboard, payments
│   │       ├── middlewares/ # JWT auth middleware
│   │       └── app.ts
│   └── ben-academy/        # React + Vite frontend
│       └── src/
│           ├── pages/      # Home, Login, Register, Dashboard, TestList, TestRoom, SubmissionReview, Upgrade
│           ├── components/ # layout/Navbar + UI components
│           └── lib/        # auth.ts (Zustand store), utils.ts
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/
│           ├── users.ts    # Users table (JWT auth, Stripe fields)
│           ├── tests.ts    # Writing tests (free/paid, difficulty)
│           └── submissions.ts # Submissions (InProgress/Submitted/TimeExpired, AI feedback)
└── scripts/                # Utility scripts
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Environment Variables Required

- `DATABASE_URL` — PostgreSQL connection (auto-provisioned by Replit)
- `SESSION_SECRET` — JWT signing secret (already set)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Auto-set by Replit AI Integrations
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Auto-set by Replit AI Integrations
- `STRIPE_SECRET_KEY` — Stripe secret key (needs to be added for payments)
- `STRIPE_PRICE_ID` — Stripe price ID for monthly subscription
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret

## API Routes

- `GET /api/healthz` — health check
- `POST /api/auth/register` — register user
- `POST /api/auth/login` — login
- `GET /api/auth/me` — get current user (JWT required)
- `GET /api/tests` — list all tests
- `GET /api/tests/:id` — get test (403 if paid required)
- `POST /api/submissions` — start submission
- `GET /api/submissions` — list my submissions
- `GET /api/submissions/:id` — get submission
- `PATCH /api/submissions/:id/autosave` — auto-save answers
- `POST /api/submissions/:id/submit` — submit test
- `POST /api/ben/grade` — AI grade submission (rate limited: 20/hour)
- `GET /api/dashboard` — full dashboard data
- `POST /api/payments/create-checkout` — Stripe checkout
- `POST /api/payments/portal` — Stripe customer portal
- `GET /api/payments/status` — subscription status
- `POST /api/payments/webhook` — Stripe webhook

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with JWT auth, AI grading (OpenAI), Stripe payments.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Auth middleware: `src/middlewares/auth.ts` — JWT verification
- Depends on: `@workspace/db`, `@workspace/api-zod`, `openai`, `stripe`, `bcrypt`, `jsonwebtoken`, `express-rate-limit`

### `artifacts/ben-academy` (`@workspace/ben-academy`)

React + Vite frontend with all pages for the IELTS test platform.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Tables: users, tests, submissions.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`).

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.
