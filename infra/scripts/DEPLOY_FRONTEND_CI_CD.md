# Frontend CI/CD (GitHub Actions -> VPS)

This repository now includes:

- Workflow: `.github/workflows/deploy-frontend.yml`
- Server deploy script: `infra/scripts/deploy-frontend.sh`
- Docker image: `infra/docker/frontend.Dockerfile`
- Compose service: `frontend` in `infra/docker-compose.yml`

## Required GitHub Secrets

Use the same VPS and GHCR secrets as the backend workflow:

- `VPS_HOST`: VPS public IP/domain
- `VPS_USER`: SSH user
- `VPS_SSH_KEY`: private SSH key content (PEM/OpenSSH)
- `VPS_SSH_PORT`: optional (defaults to `22`)
- `VPS_APP_DIR`: absolute path of repository on VPS (example: `/srv/pureastra`)
- `GHCR_USERNAME`: GitHub username/org allowed to read package
- `GHCR_TOKEN`: GitHub token/PAT with `read:packages`

## Recommended GitHub Variables

Add these in **GitHub -> Settings -> Secrets and variables -> Actions -> Variables**:

- `NEXT_PUBLIC_BACKEND_URL`: public backend URL used by browser-side requests.
  - Example with separate backend port/domain: `https://api.pureastra.com`
  - If a reverse proxy routes `/api` to the backend on the same domain, set this to an empty string.
- `FRONTEND_BACKEND_URL`: optional internal URL for server rendering on EC2.
  - Defaults to `http://backend:5050`.
- `NEXT_PUBLIC_SHIPPING_GST_RATE`: optional
- `NEXT_PUBLIC_FLAT_SHIPPING_CHARGE_INCLUSIVE`: optional

`NEXT_PUBLIC_*` values are baked into the frontend image during `next build`, so changes to them require a new frontend deploy.

## One-time VPS setup

1. Clone repo to `${VPS_APP_DIR}`.
2. Install Docker + Docker Compose plugin.
3. Ensure backend deployment is already configured.
4. Ensure backend env file exists:
   - `${VPS_APP_DIR}/apps/backend/.env`

The frontend service depends on the backend service health check in Docker Compose.

## Deployment behavior

On push to `main` (frontend/infra related paths), workflow does:

1. Build-check frontend on GitHub runner.
2. Build and push frontend image to GHCR (`ghcr.io/<owner>/<repo>/frontend:main`).
3. SSH to VPS.
4. `git pull` latest `main`.
5. `docker login ghcr.io` on VPS (using secrets).
6. `docker compose pull frontend`.
7. `docker compose up -d frontend`.

## Manual trigger

Workflow also supports `workflow_dispatch` for manual deploys.
