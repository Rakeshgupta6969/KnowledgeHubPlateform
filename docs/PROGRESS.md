# Progress Log

> This file is the project's memory. Every new AI session must read it first and update it at the end of every task.

## Current status
- Phase: Phase E completed. Starting Phase F (Wrap-up: README.md, docs/api.md, Week 1 checklist).
- **Next task: Week 1, Phase F** (Final wrap-up, README.md, update docs/api.md with request/response examples).

## Completed
- Phase A: Setup & Infrastructure (/client, /server, folder structure per PLAN.md section 7, server/.env.example, ESLint/Prettier, Docker Compose for PostgreSQL, working Prisma connection).
- Phase B: Database models (tenants, users, memberships, refresh_tokens) per PLAN.md section 4, migrations applied to dev and test databases, seed script with 2 demo tenants.
- Phase C: Auth APIs: register (single transaction: tenant + user + owner membership), login (generic errors, bcrypt compare), refresh token (HttpOnly cookie validation & DB session verification), logout (session revocation & cookie clearing), GET /auth/me (authenticated user + memberships).
- Phase D: Middleware + UI: `authMiddleware`, `tenantContextMiddleware` (tenant derived strictly from membership, never trusted from client), `roleMiddleware` (RBAC), `GET /api/v1/tenant/current`, React client with Login, Register, Protected Dashboard, TanStack Query, and automatic token refresh API client.
- Phase E: Automated testing suite with Jest & Supertest using dedicated test database `knowledgehub_test`: 20 test cases passing across auth and tenant isolation.

## Key decisions
- Language: JavaScript. Server uses CommonJS (easier with Jest); client uses ES modules (Vite).
- Package manager: npm
- Validation: Zod schemas on all endpoints
- Password hashing: bcrypt with salt rounds = 10
- Auth: 15-minute access token in JSON response + 7-day refresh token in HttpOnly, SameSite=Lax cookie backed by database `refresh_tokens` session table for revocation support.
- Tenant resolution: strictly derived from authenticated user's active membership; client `x-tenant-id` header is only an optional selector that must match one of the user's verified active memberships.
- API error format: `{ "error": { "code": "STRING_CODE", "message": "Human readable message", "details": ... } }`

## Important files and patterns to reuse
- `server/tests/setup.js`: Automated database cleanup and test configuration using `TEST_DATABASE_URL`.
- `server/tests/auth.test.js`: Integration tests for auth, registration, login, token refresh, and logout.
- `server/tests/tenant.test.js`: Integration tests for tenant context and negative cross-tenant isolation.
- `server/src/middleware/auth.js`: Authenticates Bearer token, sets `req.user`.
- `server/src/middleware/tenantContext.js`: Resolves active workspace from `req.user.memberships`, sets `req.tenant` and `req.membership`.
- `server/src/middleware/rbac.js`: Role authorization helper enforcing `OWNER`, `ADMIN`, `EDITOR`.

## Known issues / TODO
_None._

## Task log (newest first)
### 2026-11-15, Week 1 Phase E: Automated Testing Suite
- What was built:
  - Jest test setup file `server/tests/setup.js` running against `knowledgehub_test` database with automatic cleanup between test runs.
  - `server/tests/auth.test.js`: 13 test cases covering atomic registration, duplicate email rejection (409), duplicate slug rejection (409), Zod validation failure, login success, wrong password generic error (401), non-existent user generic error (401), suspended user error, token refresh, refresh without cookie, logout revocation, and `GET /auth/me`.
  - `server/tests/tenant.test.js`: 7 test cases covering unauthorized access (missing/invalid token), positive tenant derivation for multiple tenants, **negative cross-tenant isolation test** (User A blocked with 403 `TENANT_ACCESS_DENIED` when attempting to access Tenant B), suspended tenant rejection (403 `TENANT_INACTIVE`), and multi-tenant workspace switching.
- Files added/changed:
  - `server/tests/setup.js`
  - `server/tests/auth.test.js`
  - `server/tests/tenant.test.js`
  - `server/package.json`
  - `server/src/middleware/rbac.js`
- Tests added / status:
  - Ran `npm test`: 2 test suites passed, 20 tests passed, 0 failures.
  - Ran `npm run lint`: 0 errors, 0 warnings.
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.

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
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.

### 2026-11-15, Week 1 Phase C: Auth APIs
- What was built:
  - Atomic register, login with generic errors, refresh with cookie, logout with session revocation, and me endpoint.
- Files added/changed:
  - `server/src/modules/auth/`, `server/src/utils/`, `server/src/middleware/`
- Tests added / status:
  - 10-step integration check passed.
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.

### 2026-11-15, Week 1 Phase B: Database Models, Migrations, and Seed
- What was built:
  - Prisma schema with `Tenant`, `User`, `Membership`, and `RefreshToken` models.
  - Migrations applied to dev and test databases; seed script executed.
- Files added/changed:
  - `server/prisma/schema.prisma`, `server/prisma/seed.js`
- Tests added / status:
  - Seed verified.
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.

### 2026-11-15, Week 1 Phase A: Setup and Infrastructure
- What was built:
  - Docker Compose for PostgreSQL 16. Server and Client initial setups.
- Files added/changed:
  - `docker-compose.yml`, `.env.example`, `server/`, `client/`
- Tests added / status:
  - Prisma connection test passed. Client build passed.
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.
