---
name: ben-academy-optional-extras
description: >-
  Optional product features for Ben Academy — SignalR (or equivalent) for live notifications, scheduling and booking rules for teacher 1:1 sessions, and gamification (XP, streaks, leaderboards) with fair, auditable scoring. Use when adding real-time UX, calendar-based sessions, or engagement mechanics on top of the core stack.
---

# Ben Academy — optional / extra features

Use when these capabilities are **in scope**. Always align with **`ben-academy-backend`** (data, APIs), **`ben-academy-frontend`** (Blazor UX), **`ben-academy-security`** (auth on hubs, rate limits), and **`ben-academy-payments`** if bookings require payment before confirmation.

## SignalR / real-time updates

- Prefer **ASP.NET Core SignalR** for **live notifications** (new feedback, booking changes, session reminders) when the client is **Blazor WASM** — use the **SignalR client** with the same **JWT** (or cookie) strategy as `HttpClient` where hubs require auth.
- Map **hub endpoints** explicitly; **authorize** hub connections (`[Authorize]` on hub or methods) and validate **user/group** membership before joining **groups** named by `userId` or `classId` — never let clients pick arbitrary group names without server checks.
- **Scale-out**: if multiple API instances run, add a **backplane** (Redis, etc.) so messages reach all nodes; document this in deployment.
- **Fallbacks**: polling or manual refresh for users when WebSockets fail; handle **reconnect** and **missed messages** (replay or “catch up” API) if notifications are critical.

## Scheduling / booking (teacher 1:1)

- Model **availability**, **time zones**, and **bookings** in the database with **UTC** storage and explicit **IANA timezone** on user or resource profiles; convert for display only on the client.
- Enforce **business rules on the server**: minimum notice, maximum concurrent bookings, **double-book** prevention with **transactions** or **unique constraints** (e.g. teacher + slot), and status machine (`requested` → `confirmed` → `completed` / `cancelled`).
- **Conflict detection**: use optimistic or pessimistic patterns as load requires; return **clear error codes** for “slot taken” vs validation failures.
- **Notifications**: optionally push **SignalR** + **email** for confirm/cancel; link to **`ben-academy-payments`** if confirmation depends on **paid** state.
- **Calendar UX**: expose **clear APIs** (free slots, create/cancel booking); keep **Blazor** thin — heavy logic stays in domain services.

## Gamification — XP, streaks, leaderboard

- Define **transparent rules**: what actions grant **XP**, caps per day, anti-farming (e.g. min time on task, server-validated completion), and whether **AI-graded** attempts count — document in code or product spec.
- **Streaks**: compute from **activity dates in UTC**; clarify **grace timezone** or “calendar day” vs “rolling 24h”; persist **last activity date** and **current streak** or derive streaks with **idempotent** daily jobs to avoid double increments on retries.
- **Leaderboards**: **aggregate queries** with indexed keys (period, scope: class/global); **snapshot** or **materialized** summaries for large cohorts to avoid heavy live scans; **privacy** — opt-out, age band, or classroom-scoped boards per policy.
- **Integrity**: award XP in the **same transaction** as recording the underlying **earning event**; use **idempotency keys** or unique constraints so duplicate webhook/job runs do not double-award.
- **Fairness**: detect obvious abuse (burst submissions, scripted patterns) with **`ben-academy-security`**-style limits and server-side validation.

When scoping or building these extras with GSD, mention **`ben-academy-optional-extras`** so real-time, scheduling, and gamification stay consistent with the rest of the platform.
