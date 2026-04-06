#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/pureastra}"
COMPOSE_FILE="${COMPOSE_FILE:-infra/docker-compose.yml}"
BRANCH="${BRANCH:-main}"
BACKEND_IMAGE="${BACKEND_IMAGE:-}"
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

if [ -z "${BACKEND_IMAGE}" ]; then
  echo "[deploy] BACKEND_IMAGE is required"
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

echo "[deploy] pulling latest backend image"
docker compose -f "${COMPOSE_FILE}" pull backend worker

echo "[deploy] starting backend stack"
docker compose -f "${COMPOSE_FILE}" up -d redis backend worker

echo "[deploy] applying prisma migrations"
docker compose -f "${COMPOSE_FILE}" exec -T backend npx prisma migrate deploy

echo "[deploy] deployment complete"
