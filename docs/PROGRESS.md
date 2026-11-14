# Progress Log

> This file is the project's memory. Every new AI session must read it first and update it at the end of every task.

## Current status
- Phase: **Week 1 (Days 2–7) Fully Completed**.
- **Next task: Week 2, Day 8** (Tenant Dashboard shell, sidebar, tenant switcher, profile, and settings pages).

## Completed
- **Phase A (Setup & Infrastructure):** `/client` (React + Vite + Tailwind), `/server` (Express CommonJS), folder structures from PLAN.md section 7, environment variables, ESLint/Prettier, Docker Compose for PostgreSQL 16, working Prisma connection.
- **Phase B (Database Models & Seed):** Prisma schema for `Tenant`, `User`, `Membership`, and `RefreshToken` per PLAN.md section 4. Migration applied to dev and test databases. Seed script generating Acme Corp and Globex Corporation.
- **Phase C (Auth APIs):** Atomic registration (`Tenant` + `User` + `Membership` in one `prisma.$transaction`), login with generic errors, refresh token via HttpOnly cookie & DB session check, logout with session revocation, `GET /auth/me`.
- **Phase D (Middleware + UI):** `authMiddleware`, `tenantContextMiddleware` (tenant derived strictly from membership, never from client input), `roleMiddleware` (RBAC), `GET /tenant/current`. React client with Login, Register, Protected Dashboard, TanStack Query, and automatic token refresh API client.
- **Phase E (Tests):** Jest + Supertest test suite on dedicated `knowledgehub_test` database (20 passed tests covering auth, token revocation, generic errors, and negative cross-tenant isolation).
- **Phase F (Wrap-up):** Verified against Week 1 checklist in PLAN.md, comprehensive root `README.md` written, `docs/api.md` updated with request/response examples and status codes.

## Key decisions
- Language: JavaScript. Server uses CommonJS (easier with Jest); client uses ES modules (Vite).
- Package manager: npm
- Validation: Zod schemas on all endpoints
- Password hashing: bcrypt with salt rounds = 10
- Auth: 15-minute access token in JSON response + 7-day refresh token in HttpOnly, SameSite=Lax cookie backed by database `refresh_tokens` session table for revocation support.
- Tenant resolution: strictly derived from authenticated user's active membership; client `x-tenant-id` header is only an optional selector that must match one of the user's verified active memberships.
- API error format: `{ "error": { "code": "STRING_CODE", "message": "Human readable message", "details": ... } }`

## Important files and patterns to reuse
- `server/src/middleware/auth.js`: Authenticates Bearer token, sets `req.user`.
- `server/src/middleware/tenantContext.js`: Resolves active workspace from `req.user.memberships`, sets `req.tenant` and `req.membership`.
- `server/src/middleware/rbac.js`: Role authorization helper enforcing `OWNER`, `ADMIN`, `EDITOR`.
- `server/src/modules/auth/auth.service.js`: Authentication service implementing atomic registration, login, refresh, logout, and me.
- `server/src/modules/tenants/tenant.controller.js`: Returns current tenant details and user membership.
- `client/src/lib/api.js`: Unified API client managing access token in-memory and auto-refreshing via cookie.
- `client/src/features/auth/AuthContext.jsx`: Application-wide auth state and session bootstrap.

## Known issues / TODO
_None._

## Task log (newest first)
### 2026-11-15, Week 1 Phase F: Wrap-up, Documentation & Checklist Verification
- What was built:
  - Verified Week 1 checklist in PLAN.md: all 7 checklist criteria satisfied.
  - Authored comprehensive root `README.md` with overview, tech stack, architecture, env vars, Docker instructions, migration/seed commands, and test instructions.
  - Updated `docs/api.md` with complete contract specifications, request/response examples, headers, and status codes for all Week 1 endpoints.
- Files added/changed:
  - `README.md`
  - `docs/api.md`
  - `docs/PROGRESS.md`
- Tests added / status:
  - All 20 automated tests passing (`npm test`).
  - ESLint passing with 0 warnings (`npm run lint`).
  - Client production build passing (`npm run build`).
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.

### 2026-11-15, Week 1 Phase E: Automated Testing Suite
- What was built:
  - Jest test setup file `server/tests/setup.js` running against `knowledgehub_test` database with automatic cleanup between test runs.
  - `server/tests/auth.test.js` & `server/tests/tenant.test.js` covering 20 test cases.
- Files added/changed:
  - `server/tests/setup.js`, `server/tests/auth.test.js`, `server/tests/tenant.test.js`
- Tests added / status:
  - 2 test suites passed, 20 tests passed, 0 failures.

### 2026-11-15, Week 1 Phase D: Middleware and UI
- What was built:
  - `server/src/middleware/tenantContext.js`: Tenant isolation.
  - `server/src/middleware/rbac.js`: Role authorization.
  - `server/src/modules/tenants/tenant.routes.js`: `GET /api/v1/tenant/current`.
  - React client: AuthContext, LoginPage, RegisterPage, DashboardPage, ProtectedRoute, PublicRoute, unified api.js.
- Files added/changed:
  - `server/src/middleware/tenantContext.js`, `server/src/middleware/rbac.js`, `server/src/modules/tenants/`, `client/src/`
- Tests added / status:
  - `GET /api/v1/tenant/current` verified. Spoof attempt rejected (403). Client build succeeded.

### 2026-11-15, Week 1 Phase C: Auth APIs
- What was built:
  - Atomic register, login with generic errors, refresh with cookie, logout with session revocation, and me endpoint.
- Files added/changed:
  - `server/src/modules/auth/`, `server/src/utils/`, `server/src/middleware/`
- Tests added / status:
  - 10-step integration check passed.

### 2026-11-15, Week 1 Phase B: Database Models, Migrations, and Seed
- What was built:
  - Prisma schema with `Tenant`, `User`, `Membership`, and `RefreshToken` models.
  - Migrations applied to dev and test databases; seed script executed.
- Files added/changed:
  - `server/prisma/schema.prisma`, `server/prisma/seed.js`
- Tests added / status:
  - Seed verified.

### 2026-11-15, Week 1 Phase A: Setup and Infrastructure
- What was built:
  - Docker Compose for PostgreSQL 16. Server and Client initial setups.
- Files added/changed:
  - `docker-compose.yml`, `.env.example`, `server/`, `client/`
- Tests added / status:
  - Prisma connection test passed. Client build passed.
