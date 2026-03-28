---
name: ben-academy-payments
description: >-
  Payment conventions for Ben Academy — Stripe.NET (subscriptions, Checkout or Billing sessions), secure server-side session creation, webhook endpoints with signature verification, and idempotent updates to booking/payment status in the database. Use when implementing Stripe checkout, subscriptions, invoices, or payment state from ASP.NET Core.
---

# Ben Academy — payments (Stripe)

Apply these defaults unless `PROJECT.md` or the user explicitly overrides them. Use **`ben-academy-backend`** for DI, EF Core, validation, and API patterns.

## Stripe.NET SDK

- Add **`Stripe.net`** (Stripe official .NET SDK) and register Stripe configuration via **`StripeConfiguration.ApiKey`** or **`StripeClient`** constructed with the **secret key** from **configuration only** (user secrets / environment / vault — never committed or sent to Blazor WASM).
- Use **Stripe’s recommended API version** pinned in code or config if the team standardizes on one; document upgrades when Stripe deprecates fields.
- **Subscriptions / Checkout**: prefer **Checkout Sessions** or **Billing** flows that match the product (e.g. subscription mode with price IDs). Create sessions **only on the server**; return **`sessionId`** or **`clientSecret`** to the client as Stripe documents — never expose the full secret key to browsers.
- **Metadata**: attach **`userId`**, **`bookingId`**, or internal correlation ids on **Customer**, **Subscription**, **Session**, or **PaymentIntent** so webhooks and support can reconcile without guessing.

## Webhook handling

- Expose a **dedicated webhook route** (e.g. `POST /api/stripe/webhook`) that reads the **raw request body** as bytes/string — required for **signature verification**. Do not bind the body to a model before verifying the signature.
- Use **`EventUtility.ConstructEvent`** (or equivalent) with the **webhook signing secret** (`whsec_...`) from configuration. Reject requests with **wrong or missing signatures** using **`400`**/`401` as appropriate; log minimally (no full payload secrets).
- Treat webhooks as **at-least-once delivery**: handlers must be **idempotent** (same `Stripe-Signature` / **`event.Id`** processed once — store processed event ids or use natural keys on status updates).

## Booking and payment status

- Map Stripe lifecycle events to **internal states** (e.g. `checkout.session.completed`, `customer.subscription.updated`, `invoice.paid`, `invoice.payment_failed`). Keep a **single source of truth** in EF entities (**`Payment`**, **`Subscription`**, **`Booking`**) aligned with **`ben-academy-backend`**.
- Update **booking** or **entitlement** status **inside a transaction** where multiple rows must stay consistent; guard with current status checks to avoid regressions.
- Return **fast `200`** from the webhook after **durable persistence** (or queue work if async processing is required); Stripe retries on non-2xx — avoid long blocking work on the webhook thread.
- **Testing**: use **Stripe CLI** to forward events locally; use **test mode** keys and separate webhook secrets per environment.

## Security and compliance

- **Never** trust client-side payment success alone — **confirm** via webhook and/or server-side retrieve of Session/Subscription before granting access.
- **PCI**: avoid handling raw card data in custom forms; prefer **Stripe Checkout / Elements** as intended.
- **Logging**: no full card numbers; stripe ids and internal ids are usually acceptable for support traces.

When implementing payments with GSD, mention **`ben-academy-payments`** with **`ben-academy-backend`** so routes, persistence, and auth stay consistent.
