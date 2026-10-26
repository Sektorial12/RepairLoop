# Deployment notes

No secrets belong in this file or the repository. Production secrets live in `/etc/repairloop/api.env` on the VPS, `chmod 600`, root-owned. The API reads them through `systemd`; the web app receives only public values.

## Topology

```text
Browser
  └── Vercel: Next.js web app
        └── HTTPS: https://repairloop.<VPS_HOST>.sslip.io
              └── Caddy → 127.0.0.1:3002
                    └── Fastify API
                          ├── PostgreSQL 14: repairloop
                          ├── Gemini 3.5 Flash-Lite (free tier)
                          └── PayPal Orders v2 (Sandbox)
```

- **Production code:** `/code/repairloop` on the VPS.
- **API service:** `repairloop-api.service` (systemd), bound to `127.0.0.1:3002`.
- **Database:** local PostgreSQL database `repairloop`; no public port.
- **Proxy:** Caddy with automatic HTTPS for `repairloop.<VPS_HOST>.sslip.io`.
- **Backups:** `repairloop-backup.timer` runs `/usr/local/bin/repairloop-backup.sh` daily at 03:15 UTC; 7-day retention.
- **Old site:** the original `volshift.xyz` Caddyfile block was removed after the service was retired. A backup is at `/etc/caddy/Caddyfile.repairloop-backup`.

## Local development

Run these commands from the repository root.

```bash
npm install
cp .env.example .env
# Fill local values; never commit .env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev:api   # 127.0.0.1:3002
npm run dev:web   # localhost:3000
```

Set `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3002
```

## VPS setup (already applied)

1. Code lives at `/code/repairloop`; the service runs as the `repairloop` system user with read access.
2. `/etc/repairloop/api.env` contains:
   - `NODE_ENV=production`
   - `PORT=3002`
   - `HOST=127.0.0.1`
   - `DATABASE_URL=postgres://repairloop:<PASSWORD>@127.0.0.1:5432/repairloop`
   - `CORS_ORIGINS=https://<VERCEL_APP>.vercel.app`
   - `GEMINI_API_KEY=<KEY>`
   - `GEMINI_MODEL=gemini-3.5-flash-lite`
   - `PAYPAL_CLIENT_ID=<SANDBOX_ID>`
   - `PAYPAL_CLIENT_SECRET=<SANDBOX_SECRET>`
   - `PAYPAL_API_BASE=https://api-m.sandbox.paypal.com`
   - `PAYPAL_WEBHOOK_ID=<WEBHOOK_ID>`
   - `DEMO_MODE=true`
   - `LOG_LEVEL=info`
3. Build and restart:

```bash
cd /code/repairloop
npm ci
npm run build:api
sudo systemctl restart repairloop-api
curl -fsS http://127.0.0.1:3002/health
```

4. Caddy site block:

```caddy
repairloop.<VPS_HOST>.sslip.io {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3002
}
```

Validate and reload:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

5. Database:

```bash
# Run as root so the root-only env file can be sourced
sudo bash -c 'set -a; source /etc/repairloop/api.env; set +a; cd /code/repairloop/apps/api; npx drizzle-kit push --force; npx tsx src/db/seed.ts'
```

6. Backups:

```bash
sudo systemctl start repairloop-backup.service
sudo systemctl status repairloop-backup.timer
ls -lh /var/backups/repairloop
```

## Deploy from the workspace

Set `VPS_HOST` to the VPS hostname/IP. The script uses the existing SSH key and excludes local build artifacts and secrets.

```bash
VPS_HOST=<VPS_HOST> ./scripts/deploy-vps.sh
```

The script rsyncs the repository to `/code/repairloop`, runs `npm ci` and `npm run build:api`, then restarts `repairloop-api`.

## Vercel (Phase 6 — after development)

1. Import the public GitHub repo.
2. Set the project root to **`apps/web`**.
3. Framework preset: Next.js.
4. Environment variable:
   - `NEXT_PUBLIC_API_BASE_URL=https://repairloop.<VPS_HOST>.sslip.io`
5. Deploy.
6. Add the production/preview Vercel origins to `CORS_ORIGINS` in `/etc/repairloop/api.env`, then restart the API:

```bash
sudo systemctl restart repairloop-api
```

7. Verify from a clean browser:
   - Landing page loads.
   - The “API online” status shows the database, AI, PayPal, and model count.
   - The API URL has a valid HTTPS certificate.

## Rollback

- **App:** check out the previous commit, rsync, `npm ci`, `npm run build:api`, restart the service.
- **Caddy:** restore `/etc/caddy/Caddyfile.repairloop-backup`, validate, reload.
- **Database:** restore the latest `/var/backups/repairloop/*.sql.gz` with `gunzip -c ... | sudo -u postgres psql repairloop`.

## Security reminders

- Sandbox only; no real money.
- Rotate the PayPal Sandbox secret after judging because it was shared in chat.
- Keep `/etc/repairloop/api.env` root-only.
- Do not copy service tags, serial numbers, or battery-report history into public media.
- Keep the demo live and free through **15 Dec 2026**.
