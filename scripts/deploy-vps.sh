#!/usr/bin/env bash
set -euo pipefail

: "${VPS_HOST:?Set VPS_HOST to the VPS hostname or IP}"
VPS_USER="${VPS_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
REMOTE_DIR="${REMOTE_DIR:-/code/repairloop}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "Deploying ${SOURCE_DIR}/ to ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}"

rsync -az --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude dist \
  --exclude .env \
  --exclude .env.local \
  --exclude '*.log' \
  -e "ssh -i ${SSH_KEY}" \
  "${SOURCE_DIR}/" "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/"

ssh -i "${SSH_KEY}" "${VPS_USER}@${VPS_HOST}" \
  "cd ${REMOTE_DIR} && npm ci && npm run build:api && sudo systemctl restart repairloop-api && for i in \$(seq 1 15); do if curl -fsS --max-time 2 http://127.0.0.1:3002/health; then exit 0; fi; sleep 1; done; echo 'Health check failed'; exit 1"

echo
echo "Deploy complete."
