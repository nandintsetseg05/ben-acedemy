---
name: ben-academy-security
description: >-
  Security conventions for Ben Academy — HTTPS and HSTS, JWT authentication with authorization middleware and roles/policies, parameterized data access and output encoding to mitigate SQL injection and XSS, and rate limiting with abuse-oriented safeguards. Use when hardening ASP.NET Core APIs, Blazor WASM boundaries, or deployment configuration for this project.
---

# Ben Academy — security

Apply these defaults unless `PROJECT.md` or the user explicitly overrides them. **`ben-academy-backend`** owns detailed Identity/JWT setup; this skill focuses on **transport**, **authorization wiring**, **injection/XSS discipline**, and **throttling**.

## HTTPS / SSL enforcement

- **Production** must serve traffic over **HTTPS** only. In ASP.NET Core, use **`UseHttpsRedirection`** and set **`HttpsRedirectionOptions`** (HTTPS port) appropriately behind reverse proxies.
- Enable **HSTS** (`Strict-Transport-Security`) for production with a sensible **max-age**; avoid overly broad **`includeSubDomains`** until subdomains are all HTTPS-ready.
- **Forwarded headers**: when behind **IIS, Nginx, or cloud load balancers**, configure **`ForwardedHeaders`** so scheme and client IP are correct for redirects and rate limiting.
- **Development**: HTTPS in `launchSettings` / dev certificates where applicable; never ship **default dev certificates** or **HTTP-only** assumptions to production configs.

## JWT authentication and authorization middleware

- Register **authentication** before **authorization** in the pipeline: **`UseAuthentication`** then **`UseAuthorization`**.
- **JWT Bearer**: validate **issuer**, **audience**, **signing key**, and **lifetime**; use short **access token** lifetimes and secure **refresh** if implemented (see **`ben-academy-backend`**).
- Prefer **global authorization** (`FallbackPolicy`, `RequireAuthenticatedUser`) with **explicit `[AllowAnonymous]`** on login, webhooks (if they use signature auth instead), health, and similar.
- **Roles and policies**: use **`[Authorize(Roles = "...")]`** or **named policies** for fine-grained checks; avoid **role strings** scattered without constants or enums where the team wants consistency.
- **Blazor WASM**: tokens and secrets stay **server-side** when possible; browser-held tokens are **accessible to XSS** — reduce XSS surface (next section) and **CSP** where the stack allows.

## Input sanitization — SQL injection and XSS

- **SQL injection**: use **EF Core** (parameterized queries) exclusively for data access; no string-concatenated SQL. If **raw SQL** is unavoidable, use **parameterized** APIs (`SqlParameter`, interpolated **FormattableString** only where EF documents safety). **Dapper**/`FromSqlRaw` must use **parameters**, never concatenated user input.
- **XSS**: in APIs returning HTML is rare — prefer **JSON** with **System.Text.Json**. In **Blazor**, default encoding avoids raw HTML unless **`MarkupString`** or **`BuildRenderTree`** injects untrusted content — **never** mark user or AI-generated text as trusted HTML without a **vetted sanitizer** and **CSP**.
- **Validation**: enforce **`ben-academy-backend`** rules (DataAnnotations / FluentValidation) at the boundary; treat all client input as **hostile** regardless of UI “friendliness”.
- **Headers**: consider **`Content-Security-Policy`**, **`X-Content-Type-Options: nosniff`**, and **`Frame-Options`** / **`frame-ancestors`** per deployment (some are easier at the reverse proxy).

## Rate limiting and abuse prevention

- Use **ASP.NET Core rate limiting** (`RateLimiter` / `AddRateLimiter`) or a reverse-proxy limiter for **IP**, **user id**, or **API key** buckets on **login**, **password reset**, **webhooks** (careful — Stripe uses many IPs; prefer **signature** auth + moderate limits), **AI/LLM proxy** endpoints, and **public** routes.
- Apply **stricter** limits to **unauthenticated** traffic than to **authenticated** users where appropriate.
- **Account enumeration**: keep **login/register** responses and timing **consistent**; avoid revealing whether an email exists unless product policy requires it.
- **Lockout / Identity**: rely on **ASP.NET Identity** lockout settings for credential stuffing; combine with **rate limits** for defense in depth.

When reviewing or implementing security-sensitive code with GSD, mention **`ben-academy-security`** with **`ben-academy-backend`**, **`ben-academy-frontend`**, and **`ben-academy-payments`** (webhooks) as needed.
