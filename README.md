# Pureastra Ecommerce Platform

Backend and frontend monorepo for the **Pureastra ecommerce platform**.

This repository contains the core services required to run the ecommerce system including API services, frontend application, shared packages, and deployment infrastructure.

The project is structured as a **pnpm monorepo** to allow shared types, reusable utilities, and simplified dependency management across applications.

---

# Project Overview

The Pureastra platform provides:

- Ecommerce storefront
- Product catalog and inventory management
- Order processing system
- Customer accounts
- Influencer referral tracking
- Automated feedback collection
- Admin dashboard for platform management

The system is designed to be **modular, scalable, and deployable on a VPS using Docker containers**.

---

# Repository Architecture

This project follows a **monorepo architecture** using **pnpm workspaces**.

```
pureastra/
│
├ apps/
│ ├ backend/ # Express + TypeScript API
│ └ frontend/ # Customer-facing web application
│
├ packages/
│ ├ shared-types/ # Shared TypeScript interfaces
│ ├ shared-utils/ # Shared utilities
│ └ validation/ # Shared validation schemas
│
├ infra/
│ ├ docker/ # Dockerfiles and nginx configs
│ ├ docker-compose.yml
│ └ scripts/ # Deployment scripts
│
├ .github/
│ └ workflows/ # CI/CD workflows
│
├ pnpm-workspace.yaml
├ tsconfig.base.json
├ .env.example
└ README.md
```

---

# Applications

## Backend

Location:

apps/backend

Technology stack:

- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma ORM

Responsibilities:

- Authentication
- User management
- Product management
- Order processing
- Inventory management
- Feedback collection
- Influencer tracking

Backend structure:

```
src/
├ config/
├ modules/
│ ├ auth/
│ ├ users/
│ ├ products/
│ ├ orders/
│ ├ inventory/
│ ├ feedback/
│ └ influencers/
│
├ middleware/
├ jobs/
├ utils/
├ app.ts
├ routes.ts
└ server.ts
```

---

## Frontend

Location:

apps/frontend

Responsibilities:

- Product browsing
- Customer authentication
- Shopping cart
- Checkout flow
- Customer order tracking

Structure:

```
src/
├ components/
├ pages/
├ hooks/
├ services/
├ store/
├ utils/
└ types/
```

---

# Shared Packages

Shared packages allow frontend and backend to use the same definitions.

Location:

packages/

## shared-types

Contains common TypeScript interfaces used by both applications.

Examples:

- Product
- Order
- User
- APIResponse

---

## validation

Contains reusable validation schemas for API inputs.

Example technologies that may be used:

- Zod
- Yup
- Joi

---

## shared-utils

Contains common helper utilities used across applications.

Examples:

- formatting helpers
- date utilities
- reusable constants

---

# Infrastructure

Infrastructure configuration lives in the **infra folder**.

infra/

Includes:

- Dockerfiles for services
- docker-compose configuration
- Nginx configuration
- deployment scripts

---

# Deployment Strategy

The platform is designed to run on a **VPS server using Docker Compose**.

Deployment architecture:

Internet
|
v
Nginx
|
v
Frontend container
Backend API container
|
v
PostgreSQL database
Redis (optional)

CI/CD pipeline uses **GitHub Actions** to:

1. Build Docker images
2. Push images to the server
3. Restart containers via docker-compose

---

# Development Setup

## Prerequisites

Install the following tools:

- Node.js
- pnpm
- Docker
- Git

Install pnpm globally:

npm install -g pnpm

---

# Install Dependencies

From the root of the repository:

pnpm install

This installs dependencies for all workspace packages.

---

# Run Backend (Development)

pnpm --filter backend dev

---

# Run Frontend (Development)

pnpm --filter frontend dev

---

# Environment Variables

Environment variables should be defined in a `.env` file.

Example variables:

DATABASE_URL=
REDIS_URL=
SMTP_USER=
SMTP_PASS=
JWT_SECRET=

Refer to `.env.example` for the full list.

---

# Database

The backend uses **PostgreSQL**.

Schema definitions are located in:

apps/backend/prisma/schema.prisma

Database migrations are managed via Prisma.

---

# Git Workflow

Typical workflow:

main branch
|
├ feature/auth
├ feature/products
├ feature/orders

Developers should create feature branches for new functionality.

---

# API Development

All backend APIs are prefixed with:

/api/v1

Example endpoints:

POST /api/v1/auth/login
POST /api/v1/auth/signup
GET /api/v1/products
POST /api/v1/orders

---

# Future Extensions

The architecture supports adding additional applications such as:

apps/admin
apps/mobile
apps/analytics

Additional shared packages may also be added.

---

# Contribution Guidelines

1. Create feature branch
2. Implement changes
3. Ensure code passes lint and tests
4. Submit pull request

---

# License

This repository is private and maintained for the **Pureastra platform**.
