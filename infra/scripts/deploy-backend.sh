#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/pureastra}"
COMPOSE_FILE="${COMPOSE_FILE:-infra/docker-compose.yml}"
BRANCH="${BRANCH:-main}"
BACKEND_IMAGE="${BACKEND_IMAGE:-ghcr.io/helloaethonex-cmd/pureastra/backend}"
BACKEND_TAG="${BACKEND_TAG:-main}"
GHCR_USERNAME="${GHCR_USERNAME:-}"
GHCR_TOKEN="${GHCR_TOKEN:-}"

echo "[deploy] app dir: ${APP_DIR}"
echo "[deploy] branch: ${BRANCH}"

cd "${APP_DIR}"

echo "[deploy] syncing git branch"
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"

echo "[deploy] ensuring backend env file exists"
if [ ! -f "apps/backend/.env" ]; then
  echo "[deploy] missing apps/backend/.env"
  exit 1
fi

if [ -z "${GHCR_USERNAME}" ] || [ -z "${GHCR_TOKEN}" ]; then
  echo "[deploy] GHCR_USERNAME and GHCR_TOKEN are required"
  exit 1
fi

echo "[deploy] authenticating with ghcr.io"
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USERNAME}" --password-stdin

export BACKEND_IMAGE
export BACKEND_TAG

echo "[deploy] writing compose image defaults"
cat > "${APP_DIR}/infra/.env" <<EOF
BACKEND_IMAGE=${BACKEND_IMAGE}
BACKEND_TAG=${BACKEND_TAG}
EOF

echo "[deploy] cleaning stopped containers"
docker container prune -f > /dev/null 2>&1 || true

echo "[deploy] pulling latest backend image"
docker compose -f "${COMPOSE_FILE}" pull backend worker-inventory worker-email

echo "[deploy] starting redis first"
docker compose -f "${COMPOSE_FILE}" up -d redis

echo "[deploy] applying prisma migrations (one-off container)"
docker compose -f "${COMPOSE_FILE}" run --rm backend npx prisma migrate deploy --config prisma.config.mjs

echo "[deploy] deploying backend and workers"
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans backend worker-inventory worker-email

# Remove ALL unused images after deploy.
# Safe because the new image is now running — old tagged builds are unused.
# This is what prevents disk filling up over multiple deploys.
echo "[deploy] cleaning unused images (dangling + old builds)"
docker image prune -a -f > /dev/null 2>&1 || true

echo "[deploy] disk usage after cleanup"
df -h / | tail -1

echo "[deploy] deployment complete"
