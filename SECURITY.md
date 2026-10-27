# Security and privacy

## Secrets

- PayPal client ID/secret, Gemini API key, webhook ID, and database URL live in a server-side secret store, never in the repository.
- Never commit secrets, `.env` files, SSH keys, tokens, or service-tag/serial data.
- The frontend may receive only public values (e.g., `NEXT_PUBLIC_API_BASE_URL`; the PayPal public client ID).
- Rotate any credential that may have been exposed outside the secret store.

## Payments

- PayPal Sandbox only; `DEMO_MODE=true` blocks a live PayPal base and no real money is taken.
- Amounts are computed server-side from the verified catalog. Never trust a client-provided amount.
- Capture is server-side; success is shown only after a verified `COMPLETED` capture.
- Verify webhook signatures using the raw request body and the configured webhook ID.
- Deduplicate by PayPal event ID before state changes; apply only monotonic status transitions (no approved/capture replay downgrade).
- Use idempotency keys for order creation and capture; build return/cancel URLs only from the CORS allowlist and create a fresh order after cancel/failure.
- Do not collect or store card data.

## API

- CORS allowlist only the deployed frontend origins.
- Rate-limit all endpoints globally by Cloudflare client IP (`CF-Connecting-IP`) or socket address, never client-supplied `X-Forwarded-For`; apply a stricter AI limit; exempt PayPal webhooks because signature verification is the gate.
- Send Helmet-style API headers; the web app sends frame denial, CSP `frame-ancestors`, referrer policy, permissions policy, and HSTS.
- Deduplicate webhook events by event ID and reject unverified signatures.
- Validate all request bodies with Zod.
- Upload limits: images only, 6 MB, no executables; strip metadata where possible.
- Bind to localhost in development; bind to the platform-provided host in production and terminate HTTPS at the reverse proxy.
- Run the API with least privilege and process isolation.
- Do not expose stack traces or secrets in error responses; malformed JSON returns 400.
- Log request metadata, not image contents or credentials.

## Data

- Store only the fields needed for a repair case: model, capacities, health %, confirmed part number, selected part, and payment references.
- Webhook rows store event ID/type, order/capture IDs, and amount/currency only; do not persist payer name, email, address, or full PayPal payloads.
- Do not store the full battery report, label image, serial number, or service tag.
- Redact serials/service tags in screenshots, videos, and the repository.
- Use synthetic or own photos for the demo; obtain permission for any borrowed device or repair-shop footage.
- Provide a clear disclaimer: RepairLoop is not affiliated with Dell; compatibility is source-verified but the user should confirm before purchase.

## Disclosure

Document known limitations and fix security issues before publishing. Never hide a known payment or data-handling issue.
