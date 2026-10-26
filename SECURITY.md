# Security and privacy

## Secrets

- PayPal client ID/secret, Gemini API key, webhook ID, and database URL live in `/etc/repairloop/api.env` on the VPS, `chmod 600`, root-only.
- Never commit secrets, `.env` files, SSH keys, tokens, or service-tag/serial data.
- The frontend may receive only public values (e.g., `NEXT_PUBLIC_API_BASE_URL`; PayPal client ID if the chosen v6 path requires it).
- Rotate the PayPal Sandbox secret after judging because it was shared in a chat during development.

## Payments

- PayPal Sandbox only; no real money.
- Amounts are computed server-side from the verified catalog. Never trust a client-provided amount.
- Capture is server-side; success is shown only after a verified `COMPLETED` capture.
- Verify webhook signatures using the raw request body and the configured webhook ID.
- Use idempotency keys for order creation, capture, and webhook processing.
- Do not collect or store card data.

## API

- CORS allowlist only the deployed frontend origins.
- Rate-limit AI, upload, match, and checkout endpoints.
- Validate all request bodies with Zod.
- Upload limits: images only, 5 MB, no executables; strip metadata where possible.
- Bind the API to `127.0.0.1:3002`; Caddy terminates HTTPS.
- Use `systemd` hardening: `NoNewPrivileges`, `PrivateTmp`, `ProtectSystem`, restricted `ReadWritePaths`.
- Do not expose stack traces or secrets in error responses.
- Log request metadata, not image contents or credentials.

## Data

- Store only the fields needed for a repair case: model, capacities, health %, confirmed part number, selected part, and payment references.
- Do not store the full battery report, label image, serial number, or service tag.
- Redact serials/service tags in screenshots, videos, and the repository.
- Use synthetic or own photos for the demo; obtain permission for any borrowed device or repair-shop footage.
- Provide a clear disclaimer: RepairLoop is not affiliated with Dell; compatibility is source-verified but the user should confirm before purchase.

## Disclosure

If a security issue is found, document it in the submission’s limitations and fix it before the judging period. Never hide a known payment or data-handling issue.
