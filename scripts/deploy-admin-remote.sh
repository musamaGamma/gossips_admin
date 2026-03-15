#!/bin/bash
# Deploy the admin dashboard (Next.js) to production.
#
# Two modes:
#   --github  (default)  Push to GitHub → server pulls, builds, restarts PM2
#   --rsync              Build locally with prod env, rsync .next + public to server, restart PM2
#
# Required env vars (or set in .env.deploy at this repo root):
#   DEPLOY_HOST          server IP or hostname
#   DEPLOY_USER          SSH user
#
# Optional env vars:
#   DEPLOY_ADMIN_PATH    remote path  (default: /var/www/gossips_admin)
#   PM2_APP_NAME         PM2 process  (default: gossips-admin)
#   NEXT_PUBLIC_API_URL  build-time API URL (default: https://api.arktechworks.com/api)
#
# Usage examples:
#   DEPLOY_HOST=1.2.3.4 DEPLOY_USER=root npm run deploy            # github mode
#   DEPLOY_HOST=1.2.3.4 DEPLOY_USER=root npm run deploy -- --rsync # rsync/local-build mode
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Load .env.deploy if present (never commit this file)
[ -f ".env.deploy" ] && set -a && . ./.env.deploy && set +a

DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_USER="${DEPLOY_USER:-}"
DEPLOY_ADMIN_PATH="${DEPLOY_ADMIN_PATH:-/var/www/gossips_admin}"
PM2_APP_NAME="${PM2_APP_NAME:-gossips-admin}"
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://api.arktechworks.com/api}"
MODE="github"

for arg in "$@"; do
  case "$arg" in
    --rsync) MODE="rsync" ;;
    --github) MODE="github" ;;
  esac
done

if [ -z "$DEPLOY_HOST" ] || [ -z "$DEPLOY_USER" ]; then
  echo "ERROR: DEPLOY_HOST and DEPLOY_USER must be set."
  echo "  Example: DEPLOY_HOST=1.2.3.4 DEPLOY_USER=root npm run deploy"
  echo "  Or create a .env.deploy file in the repo root with those values."
  exit 1
fi

echo "==> Mode: $MODE | Target: $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_ADMIN_PATH"
echo "==> API URL: $NEXT_PUBLIC_API_URL"
echo ""

# ─── GitHub mode ───────────────────────────────────────────────────────────
if [ "$MODE" = "github" ]; then
  echo "==> Pushing to GitHub (origin main)..."
  git push origin main

  echo "==> SSHing to server: pull → build → restart PM2..."
  ssh "${DEPLOY_USER}@${DEPLOY_HOST}" bash -s <<REMOTE
set -e
[ -s "\$HOME/.nvm/nvm.sh" ] && . "\$HOME/.nvm/nvm.sh" && nvm use 20 2>/dev/null || true
cd ${DEPLOY_ADMIN_PATH}
echo "--- git pull ---"
git pull origin main
echo "--- npm ci ---"
npm ci
echo "--- build (NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}) ---"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}"
npm run build
echo "--- pm2 restart ---"
pm2 restart ${PM2_APP_NAME} 2>/dev/null || pm2 start npm --name ${PM2_APP_NAME} -- start -- -p 3001
pm2 save
echo "==> Admin deploy done."
REMOTE
fi

# ─── Rsync mode ────────────────────────────────────────────────────────────
if [ "$MODE" = "rsync" ]; then
  echo "==> Building locally with prod API URL..."
  export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}"
  npm ci
  npm run build

  echo "==> Rsyncing build artifacts to server..."
  if [ -d ".next/standalone" ]; then
    rsync -az --delete \
      --exclude '.next/cache' \
      .next/standalone/ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_ADMIN_PATH}/"
    rsync -az --delete \
      .next/static/ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_ADMIN_PATH}/.next/static/"
    rsync -az --delete \
      public/ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_ADMIN_PATH}/public/" 2>/dev/null || true
  else
    rsync -az --delete \
      --exclude '.next/cache' \
      .next/ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_ADMIN_PATH}/.next/"
    rsync -az \
      package.json package-lock.json \
      "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_ADMIN_PATH}/"
    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" bash -s <<REMOTE_DEPS
set -e
[ -s "\$HOME/.nvm/nvm.sh" ] && . "\$HOME/.nvm/nvm.sh" && nvm use 20 2>/dev/null || true
cd ${DEPLOY_ADMIN_PATH}
npm ci --omit=dev
REMOTE_DEPS
  fi

  echo "==> Restarting PM2..."
  ssh "${DEPLOY_USER}@${DEPLOY_HOST}" bash -s <<REMOTE_PM2
set -e
[ -s "\$HOME/.nvm/nvm.sh" ] && . "\$HOME/.nvm/nvm.sh" && nvm use 20 2>/dev/null || true
pm2 restart ${PM2_APP_NAME} 2>/dev/null || pm2 start npm --cwd ${DEPLOY_ADMIN_PATH} --name ${PM2_APP_NAME} -- start
pm2 save
echo "==> Admin rsync deploy done."
REMOTE_PM2
fi
