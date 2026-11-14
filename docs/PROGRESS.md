# Progress Log

> This file is the project's memory. Every new AI session must read it first and update it at the end of every task.

## Current status
- Phase: Phase A completed. Starting Phase B (Database models, migrations, and seed script).
- **Next task: Week 1, Phase B** (Database models for tenants, users, memberships, migration, seed script)

## Completed
- Phase A: Setup & Infrastructure (/client, /server, folder structure per PLAN.md section 7, server/.env.example, ESLint/Prettier, Docker Compose for PostgreSQL, working Prisma connection).

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
- `docker-compose.yml`: Local PostgreSQL 16 container on port 5432.

## Known issues / TODO
_None._

## Task log (newest first)
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
