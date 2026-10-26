# RepairLoop

> **Repair the right thing, with the right part.**

RepairLoop turns a laptop battery report or label photo into a source-verified replacement-part decision, then completes the purchase with PayPal. AI helps with messy input; a curated, source-linked catalog decides fitment, price, and availability. If RepairLoop cannot verify a match, it says so and disables checkout.

**Status:** Phase 1 foundation. The API, catalog matcher, VPS deployment, and web shell are being built. See [`roadmap.md`](./roadmap.md) for the full plan.

## Why this exists

Dell lists three battery capacities for the Latitude 5400 — 42Wh, 51Wh, and 68Wh — with different voltages, dimensions, and multiple Dell part numbers. The same machine family can use several batteries, and a plausible-looking 68Wh battery can be the wrong voltage. RepairLoop starts with this narrow, verifiable case:

- **Installed reference:** Dell Latitude 5400, 68Wh 4-cell 7.6V, `X77XY` (part of the `4GVMP` family)
- **Exact replacement family:** `4GVMP`, `X77XY`, `RF7WM`, `C5GV2`, `9JRYT`, `MCV1G`, `5H46R`
- **Lower-capacity options:** 51Wh `R8D7N` family; 42Wh `1V1XF` family
- **Explicitly unverified:** 68Wh **15.2V** `3HWPP` — same capacity, different voltage; never offered at checkout
- **No match:** unsupported models, unknown parts, conflicting signals, or a damaged-battery safety stop

## Stack

- **Web:** Next.js 16 on Vercel
- **API:** Fastify 5 + TypeScript on an Ubuntu VPS at `/code/repairloop`
- **Database:** PostgreSQL 14 + Drizzle ORM
- **AI:** Gemini 3.5 Flash-Lite (free tier), structured JSON, manual fallback
- **Payments:** PayPal Orders v2 + JavaScript SDK v6, Sandbox only
- **Proxy:** Caddy with automatic HTTPS
- **Repo:** npm workspaces at the repository root

## Quick start

Run these commands from the repository root.

```bash
npm install
cp .env.example .env
# Fill DATABASE_URL, GEMINI_API_KEY, PayPal Sandbox values in .env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev:api   # http://127.0.0.1:3002
npm run dev:web   # http://localhost:3000
```

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

## Project structure

```text
.
├── apps/
│   ├── api/       # Fastify API, catalog, matcher, Drizzle schema
│   └── web/       # Next.js landing page and API status
├── packages/
│   └── shared/    # shared TypeScript types
├── scripts/       # deploy helpers
├── .env.example
├── roadmap.md     # phase-by-phase build plan and checklists
├── DEPLOY.md      # VPS + Vercel deployment notes
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
- No secrets, card data, or personal data in the repository.
- Sandbox demo only; this is not a real parts store.

Dell is a trademark of Dell Inc. RepairLoop is not affiliated with or endorsed by Dell.
