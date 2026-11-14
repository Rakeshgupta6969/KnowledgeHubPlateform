# Progress Log

> This file is the project's memory. Every new AI session must read it first and update it at the end of every task.

## Current status
- Phase: Phase C completed. Starting Phase D (Middleware + UI).
- **Next task: Week 1, Phase D** (Tenant context middleware, role middleware, GET /tenant/current, React Login/Register and protected dashboard)

## Completed
- Phase A: Setup & Infrastructure (/client, /server, folder structure per PLAN.md section 7, server/.env.example, ESLint/Prettier, Docker Compose for PostgreSQL, working Prisma connection).
- Phase B: Database models (tenants, users, memberships, refresh_tokens) per PLAN.md section 4, migrations applied to dev and test databases, seed script with 2 demo tenants.
- Phase C: Auth APIs: register (single transaction: tenant + user + owner membership), login (generic errors, bcrypt compare), refresh token (HttpOnly cookie validation & DB session verification), logout (session revocation & cookie clearing), GET /auth/me (authenticated user + memberships).

## Key decisions
- Language: JavaScript. Server uses CommonJS (easier with Jest); client uses ES modules (Vite).
- Package manager: npm
- Validation: Zod schemas on all endpoints
- Password hashing: bcrypt with salt rounds = 10
- Auth: 15-minute access token in JSON response + 7-day refresh token in HttpOnly, SameSite=Lax cookie backed by database `refresh_tokens` session table for revocation support.
- API error format: `{ "error": { "code": "STRING_CODE", "message": "Human readable message", "details": ... } }`
- Generic login error: `Invalid email or password` (`INVALID_CREDENTIALS`, 401) on non-existent email or wrong password.

## Important files and patterns to reuse
- `server/src/utils/errors.js`: `ApiError` class with standard static factories.
- `server/src/utils/tokens.js`: JWT access/refresh token generation, verification, and cookie helpers.
- `server/src/middleware/validate.js`: Generic Zod request body validation middleware.
- `server/src/middleware/auth.js`: Bearer token authentication middleware attaching `req.user`.
- `server/src/middleware/errorHandler.js`: Standardized Express error handling middleware.
- `server/src/modules/auth/auth.service.js`: Authentication service implementing atomic registration, login, refresh, logout, and me.

## Known issues / TODO
_None._

## Task log (newest first)
### 2026-11-15, Week 1 Phase C: Auth APIs
- What was built:
  - `POST /api/v1/auth/register`: Atomic transaction creating Tenant, User, and Owner Membership. Issues access token and sets HttpOnly refresh cookie.
  - `POST /api/v1/auth/login`: Verifies user and bcrypt hash, rejects invalid credentials with generic 401 message, issues access token and refresh cookie.
  - `POST /api/v1/auth/refresh`: Validates refresh token cookie against database session, issues new access token.
  - `POST /api/v1/auth/logout`: Revokes refresh session in database and clears refresh cookie.
  - `GET /api/v1/auth/me`: Returns authenticated user with their tenant memberships.
  - Validation schemas for register and login using Zod.
  - Standard error format middleware and custom `ApiError` class.
- Files added/changed:
  - `server/src/utils/errors.js`
  - `server/src/utils/slugify.js`
  - `server/src/utils/tokens.js`
  - `server/src/middleware/validate.js`
  - `server/src/middleware/auth.js`
  - `server/src/middleware/errorHandler.js`
  - `server/src/modules/auth/auth.validation.js`
  - `server/src/modules/auth/auth.service.js`
  - `server/src/modules/auth/auth.controller.js`
  - `server/src/modules/auth/auth.routes.js`
  - `server/src/routes/index.js`
  - `server/src/app.js`
- Tests added / status:
  - Executed end-to-end integration check covering health, atomic registration, duplicate email rejection (409), duplicate slug rejection (409), wrong password generic error (401), valid login (200), me (200), refresh (200), logout (200), and refresh revocation check (401). All 10 checks passed.
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.

### 2026-11-15, Week 1 Phase B: Database Models, Migrations, and Seed
- What was built:
  - Prisma schema with `Tenant`, `User`, `Membership`, and `RefreshToken` models.
  - Initial migration applied to `knowledgehub` and `knowledgehub_test` databases.
  - Idempotent seed script creating Acme Corp and Globex Corporation.
- Files added/changed:
  - `server/prisma/schema.prisma`, `server/prisma/migrations/`, `server/prisma/seed.js`
- Tests added / status:
  - Seed executed and verified via database query.
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.

### 2026-11-15, Week 1 Phase A: Setup and Infrastructure
- What was built:
  - Docker Compose for PostgreSQL 16 Alpine. Server and Client initial setups.
- Files added/changed:
  - `docker-compose.yml`, `.env.example`, `server/`, `client/`
- Tests added / status:
  - Prisma connection test passed. Client build passed.
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.
