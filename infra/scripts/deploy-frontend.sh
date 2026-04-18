#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/pureastra}"
COMPOSE_FILE="${COMPOSE_FILE:-infra/docker-compose.yml}"
BRANCH="${BRANCH:-main}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-ghcr.io/helloaethonex-cmd/pureastra/frontend}"
FRONTEND_TAG="${FRONTEND_TAG:-main}"
FRONTEND_BACKEND_URL="${FRONTEND_BACKEND_URL:-http://backend:5050}"
NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-}"
NEXT_PUBLIC_SHIPPING_GST_RATE="${NEXT_PUBLIC_SHIPPING_GST_RATE:-}"
NEXT_PUBLIC_FLAT_SHIPPING_CHARGE_INCLUSIVE="${NEXT_PUBLIC_FLAT_SHIPPING_CHARGE_INCLUSIVE:-}"
GHCR_USERNAME="${GHCR_USERNAME:-}"
GHCR_TOKEN="${GHCR_TOKEN:-}"

COMPOSE_ENV_FILE="${APP_DIR}/infra/.env"

upsert_compose_env() {
  local key="$1"
  local value="$2"
  local tmp_file

  mkdir -p "$(dirname "${COMPOSE_ENV_FILE}")"
  touch "${COMPOSE_ENV_FILE}"
  tmp_file="$(mktemp)"

  if grep -q "^${key}=" "${COMPOSE_ENV_FILE}"; then
    awk -v key="${key}" -v value="${value}" '
      index($0, key "=") == 1 { print key "=" value; next }
      { print }
    ' "${COMPOSE_ENV_FILE}" > "${tmp_file}"
  else
    cp "${COMPOSE_ENV_FILE}" "${tmp_file}"
    printf "%s=%s\n" "${key}" "${value}" >> "${tmp_file}"
  fi

  mv "${tmp_file}" "${COMPOSE_ENV_FILE}"
}

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
  echo "[deploy] frontend depends on the backend service in docker compose"
  exit 1
fi

if [ -z "${GHCR_USERNAME}" ] || [ -z "${GHCR_TOKEN}" ]; then
  echo "[deploy] GHCR_USERNAME and GHCR_TOKEN are required"
  exit 1
fi

echo "[deploy] authenticating with ghcr.io"
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USERNAME}" --password-stdin

export FRONTEND_IMAGE
export FRONTEND_TAG
export FRONTEND_BACKEND_URL
export NEXT_PUBLIC_BACKEND_URL
export NEXT_PUBLIC_SHIPPING_GST_RATE
export NEXT_PUBLIC_FLAT_SHIPPING_CHARGE_INCLUSIVE

echo "[deploy] writing compose image defaults"
upsert_compose_env "FRONTEND_IMAGE" "${FRONTEND_IMAGE}"
upsert_compose_env "FRONTEND_TAG" "${FRONTEND_TAG}"
upsert_compose_env "FRONTEND_BACKEND_URL" "${FRONTEND_BACKEND_URL}"
upsert_compose_env "NEXT_PUBLIC_BACKEND_URL" "${NEXT_PUBLIC_BACKEND_URL}"
upsert_compose_env "NEXT_PUBLIC_SHIPPING_GST_RATE" "${NEXT_PUBLIC_SHIPPING_GST_RATE}"
upsert_compose_env "NEXT_PUBLIC_FLAT_SHIPPING_CHARGE_INCLUSIVE" "${NEXT_PUBLIC_FLAT_SHIPPING_CHARGE_INCLUSIVE}"

echo "[deploy] cleaning stopped containers"
docker container prune -f > /dev/null 2>&1 || true

echo "[deploy] pulling latest frontend image"
docker compose -f "${COMPOSE_FILE}" pull frontend

echo "[deploy] deploying frontend"
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans frontend

echo "[deploy] cleaning unused images (dangling + old builds)"
docker image prune -a -f > /dev/null 2>&1 || true

echo "[deploy] disk usage after cleanup"
df -h / | tail -1

echo "[deploy] deployment complete"
