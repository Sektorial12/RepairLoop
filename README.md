# RepairLoop

> **Repair the right thing, with the right part.**

[![CI](https://github.com/Sektorial12/RepairLoop/actions/workflows/ci.yml/badge.svg)](https://github.com/Sektorial12/RepairLoop/actions/workflows/ci.yml)

RepairLoop turns a laptop battery report or label photo into a source-linked replacement-part decision, then completes the sandbox purchase with PayPal. AI helps with messy input; a curated catalog decides fitment and demo price. Seller stock/availability is a point-in-time report, not a live inventory feed; shipping and fulfillment are not claimed. If RepairLoop cannot verify a match, it says so and disables checkout.

**Status:** Working prototype. The verified/no-match/safety battery check flow, live Gemini extraction and AI repair report, and PayPal Sandbox checkout/capture are implemented. No fake paid state is shown.

**Coverage:** 17 models with source-linked aliases and fitment rows across Dell Latitude/Precision/Inspiron and the Lenovo ThinkPad T480s, covering the shared Dell 42/51/68Wh families and the T480s 57Wh family. Unsupported or ambiguous models are refused and can be requested through the public issue tracker. `P92G` and bare `7590`/`7591`/`7791` are intentionally not aliases.

**Shop mode:** `/shop` provides an AI-assisted intake pipeline (customer text → extracted facts → deterministic catalog match → human-reviewed quote) with a seller handoff and a shareable customer checkout link tied to the existing PayPal Sandbox flow. `/shop/catalog` adds an AG Grid source-linked compatibility matrix for shop reference. AI never chooses fitment or captures payment.

## Why this exists

Dell lists three battery capacities for the Latitude 5400 — 42Wh, 51Wh, and 68Wh — with different voltages, dimensions, and multiple Dell part numbers. The same machine family can use several batteries, and a plausible-looking 68Wh battery can be the wrong voltage. RepairLoop starts with this narrow, verifiable case:

- **Installed reference:** Dell Latitude 5400, 68Wh 4-cell 7.6V, `X77XY` (part of the `4GVMP` family)
- **Exact replacement family:** `4GVMP`, `X77XY`, `RF7WM`, `C5GV2`, `9JRYT`, `MCV1G`, `5H46R`
- **Lower-capacity options:** 51Wh `R8D7N` family (fitment-verified; seller reported out of stock on 28 Oct 2026; source capacity conflict 51Wh vs iFixit 48.5Wh — verify the label); 42Wh `1V1XF` family
- **Explicitly unverified:** 68Wh **15.2V** `3HWPP` — same capacity, different voltage; never offered at checkout
- **No match:** unsupported models, unknown parts, conflicting signals, or a damaged-battery safety stop

## Stack

- **Web:** Next.js 16 + React 19
- **API:** Fastify 5 + TypeScript
- **Database:** Neon PostgreSQL + Drizzle ORM
- **AI:** Gemini (configured server-side), structured JSON, manual fallback
- **Payments:** PayPal Orders v2 + JavaScript SDK (v5 Buttons), Sandbox only
- **Shop reference grid:** AG Grid Community 36 (`ag-grid-react`)
- **Repo:** npm workspaces at the repository root

## Quick start

Run these commands from the repository root.

```bash
npm install
cp .env.example .env
# Fill DATABASE_URL, GEMINI_API_KEY, GEMINI_MODEL, PayPal Sandbox values
# and a random RECEIPT_TOKEN_SECRET (16+ chars) in .env
npm run db:generate
npm run db:push
npm run db:seed
# Custom-format backup into backups/ (pg_dump must match the Neon server major version; otherwise use Neon console backups):
# npm run db:backup
# db:seed is non-destructive; for catalog-only updates:
# npm run db:sync-catalog
# Scrub old full PayPal webhook payloads to metadata only:
# npm run db:scrub-events
npm run dev:api   # http://127.0.0.1:3002
npm run dev:web   # http://localhost:3000
```

Once both are running, open the guided flow at `http://localhost:3000/check` or auto-run the demo at `http://localhost:3000/check?demo=1`. Browse the source-linked catalog at `http://localhost:3000/catalog`; completed sandbox orders are shareable at `/receipt/[orderId]`.

The API loads the repository-root `.env` first, then `apps/api/.env`. No secrets belong in either tracked file.

## Judge quick start

- Hosted demo: `https://repair-loop-nu.vercel.app`
- Guided demo: `https://repair-loop-nu.vercel.app/check?demo=1`
- No-match: `https://repair-loop-nu.vercel.app/check?demo=no-match`
- Safety stop: `https://repair-loop-nu.vercel.app/check?demo=safety`
- Real completed Sandbox receipt: `https://repair-loop-nu.vercel.app/receipt/7LS832802T701580V`
- Catalog: `https://repair-loop-nu.vercel.app/catalog`
- Shop matrix: `https://repair-loop-nu.vercel.app/shop/catalog`

PayPal is Sandbox-only. The submission demo video is the judge completion path and must show the full approval, capture, and receipt flow; record it before submitting and add the URL to the Devpost. You can also complete the hosted flow with your own PayPal Sandbox buyer account; the app does not publish buyer credentials. Do not use a real PayPal account. The catalog shows demo prices and point-in-time seller-stock reports, not live stock or shipping.

**Functional demo without buying anything:** use the hosted `?demo=1` case, choose the in-stock `4GVMP` exact option, review it, and use a PayPal Sandbox buyer to approve the sandbox payment. `R8D7N` is shown as fitment-verified but seller-reported out of stock, so its checkout is disabled. Existing completed receipt: the link above.

Health check:

```bash
curl http://127.0.0.1:3002/health
```

Deterministic match check:

```bash
curl -sS http://127.0.0.1:3002/api/match \
  -H 'content-type: application/json' \
  -d '{
    "modelQuery": "Latitude 5400",
    "installedPartNumber": "X77XY",
    "designCapacityMwh": 68005,
    "fullChargeCapacityMwh": 46907,
    "symptomTags": ["battery_runtime_short"]
  }'
```

## Verify

```bash
npm test                 # 45 API, catalog, safety, webhook, token, and PayPal tests
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e         # 19 browser tests: desktop + mobile Chromium; WebKit mobile in CI
```

The AI evaluation harness is documented in `AI_USAGE.md`; it runs against the deployed API.

## Project structure

```text
.
├── apps/
│   ├── api/       # Fastify API, catalog, matcher, Drizzle schema
│   └── web/       # Next.js landing, check flow, catalog, receipt
├── packages/
│   └── shared/    # shared TypeScript types
├── .env.example
├── render.yaml
├── DATA_SOURCES.md
├── AI_USAGE.md
├── SECURITY.md
└── LICENSE
```

## Important guardrails

- AI never decides compatibility, price, inventory, or payment authorization.
- No verified source → no match → no checkout.
- Damaged/swollen/leaking/overheating battery → stop; recommend professional service.
- Payment success is shown only after a verified PayPal `COMPLETED` capture.
- Security headers, a global API rate limit, and signature-verified PayPal webhooks are enabled.
- No secrets, card data, or personal data in the repository.
- Sandbox demo only; this is not a real parts store. There is no general authentication, seller integration, inventory feed, fulfillment, returns, or warranty; receipts are public read-only links and capture retries require a per-order capability token.
- Prototype privacy, terms, and AI disclosure are linked in the app footer.
- The shop matrix is a read-only reference; it never creates a case or order. AG Grid Community is used only on `/shop/catalog`.
- The AI-assisted repair report is labelled; it summarizes confirmed fields plus the optional redacted image and cannot change fitment, price, stock, or payment.
- GitHub Actions checks the live API readiness, catalog, and hosted pages every 30 minutes; a failing run is visible in GitHub, but there is no Sentry/paging integration.

Dell and Lenovo are trademarks of their respective owners. RepairLoop is not affiliated with or endorsed by either company.
