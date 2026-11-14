# Progress Log

> This file is the project's memory. Every new AI session must read it first and update it at the end of every task.

## Current status
- Phase: Phase B completed. Starting Phase C (Auth APIs: register, login, refresh, logout, me).
- **Next task: Week 1, Phase C** (Implement auth APIs: register in 1 transaction, login, refresh, logout, GET /auth/me)

## Completed
- Phase A: Setup & Infrastructure (/client, /server, folder structure per PLAN.md section 7, server/.env.example, ESLint/Prettier, Docker Compose for PostgreSQL, working Prisma connection).
- Phase B: Database models (tenants, users, memberships, refresh_tokens) per PLAN.md section 4, migrations applied to dev and test databases, seed script with 2 demo tenants (Acme Corp and Globex Corporation).

## Key decisions
- Language: JavaScript. Server uses CommonJS (easier with Jest); client uses ES modules (Vite).
- Package manager: npm
- Validation: Zod
- Password hashing: bcrypt
- Auth: short-lived access token (kept in memory on the client) + refresh token in an HttpOnly, Secure, SameSite cookie
- API error format: `{ "error": { "code": "STRING_CODE", "message": "Human readable message" } }`
- API prefix: `/api/v1`

## Important files and patterns to reuse
- `server/src/config/environment.js`: Central environment configuration.
- `server/src/config/prisma.js`: Central Prisma Client instance.
- `server/prisma/schema.prisma`: Core data models for tenants, users, memberships, refresh tokens.
- `server/prisma/seed.js`: Database seeding script for development and demo environments.
- `docker-compose.yml`: Local PostgreSQL 16 container on port 5432.

## Known issues / TODO
_None._

## Task log (newest first)
### 2026-11-15, Week 1 Phase B: Database Models, Migrations, and Seed
- What was built:
  - Prisma schema with `Tenant`, `User`, `Membership`, and `RefreshToken` models with UUID PKs, unique constraints, composite unique `(tenant_id, user_id)`, and foreign key cascades.
  - Initial migration `20261114202519_init_week1_schema` created and applied to both `knowledgehub` and `knowledgehub_test` databases.
  - Idempotent seed script (`server/prisma/seed.js`) generating Acme Corp (with Owner and Admin) and Globex Corporation (with Owner).
- Files added/changed:
  - `server/prisma/schema.prisma`
  - `server/prisma/migrations/20261114202519_init_week1_schema/migration.sql`
  - `server/prisma/seed.js`
- Tests added / status:
  - Migration ran successfully on dev and test databases.
  - Seed executed and verified via database query showing 2 tenants, 3 users, and 3 memberships.
- Decisions or deviations from PLAN.md:
  - Added `RefreshToken` model to cleanly support revocable sessions and cookie logout requirements from PLAN.md section 8.
- Open issues:
  - None.

### 2026-11-15, Week 1 Phase A: Setup and Infrastructure
- What was built:
  - Docker Compose configured for PostgreSQL 16 Alpine on port 5432.
  - Server project initialized with Express, CommonJS, dependencies (Prisma, bcrypt, JWT, Zod, helmet, cors), ESLint, Prettier, folder structure per PLAN.md section 7.
  - Client project initialized with React, Vite, Tailwind CSS, folder structure per PLAN.md section 7.
  - Working Prisma connection verified against running PostgreSQL instance.
- Files added/changed:
  - `docker-compose.yml`
  - `.env.example`
  - `.gitignore`
  - `server/package.json`, `server/.eslintrc.json`, `server/.prettierrc`, `server/.env.example`, `server/.env`
  - `server/src/config/environment.js`, `server/src/config/prisma.js`, `server/src/app.js`, `server/src/server.js`
  - `server/prisma/schema.prisma`
  - `client/package.json`, `client/vite.config.js`, `client/tailwind.config.js`, `client/postcss.config.js`, `client/index.html`
  - `client/src/main.jsx`, `client/src/App.jsx`, `client/src/index.css`
- Tests added / status:
  - Prisma database connection test passed (`Prisma connected successfully!`).
  - Client build test passed (`vite build` succeeded with no errors).
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.
