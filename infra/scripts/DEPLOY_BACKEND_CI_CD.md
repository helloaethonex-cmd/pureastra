# Backend CI/CD (GitHub Actions -> VPS)

This repository now includes:

- Workflow: `.github/workflows/deploy-backend.yml`
- Server deploy script: `infra/scripts/deploy-backend.sh`

## Required GitHub Secrets

Add these in **GitHub -> Settings -> Secrets and variables -> Actions**:

- `VPS_HOST`: VPS public IP/domain
- `VPS_USER`: SSH user
- `VPS_SSH_KEY`: private SSH key content (PEM/OpenSSH)
- `VPS_SSH_PORT`: optional (defaults to `22`)
- `VPS_APP_DIR`: absolute path of repository on VPS (example: `/srv/pureastra`)
- `GHCR_USERNAME`: GitHub username/org allowed to read package
- `GHCR_TOKEN`: GitHub token/PAT with `read:packages`

## One-time VPS setup

1. Clone repo to `${VPS_APP_DIR}`.
2. Install Docker + Docker Compose plugin.
3. Ensure backend env file exists:
   - `${VPS_APP_DIR}/apps/backend/.env`
4. Ensure `.env` contains all required backend variables from `apps/backend/src/config/env.ts`.

## Deployment behavior

On push to `main` (backend/infra related paths), workflow does:

1. Build-check backend on GitHub runner.
2. Build and push backend image to GHCR (`ghcr.io/<owner>/<repo>/backend:main`).
3. SSH to VPS.
4. `git pull` latest `main`.
5. `docker login ghcr.io` on VPS (using secrets).
6. `docker compose pull backend worker` then `up -d redis backend worker`.
7. `prisma migrate deploy` inside backend container.

## Manual trigger

Workflow also supports `workflow_dispatch` for manual deploys.
