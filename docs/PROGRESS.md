# Progress Log

> This file is the project's memory. Every new AI session must read it first and update it at the end of every task.

## Current status
- Phase: Phase D completed. Starting Phase E (Tests: Jest + Supertest test suite on test database).
- **Next task: Week 1, Phase E** (Implement automated Jest + Supertest test suite covering all 10 required test scenarios).

## Completed
- Phase A: Setup & Infrastructure (/client, /server, folder structure per PLAN.md section 7, server/.env.example, ESLint/Prettier, Docker Compose for PostgreSQL, working Prisma connection).
- Phase B: Database models (tenants, users, memberships, refresh_tokens) per PLAN.md section 4, migrations applied to dev and test databases, seed script with 2 demo tenants.
- Phase C: Auth APIs: register (single transaction: tenant + user + owner membership), login (generic errors, bcrypt compare), refresh token (HttpOnly cookie validation & DB session verification), logout (session revocation & cookie clearing), GET /auth/me (authenticated user + memberships).
- Phase D: Middleware + UI: `authMiddleware`, `tenantContextMiddleware` (tenant derived strictly from membership, never trusted from client), `roleMiddleware` (RBAC), `GET /api/v1/tenant/current`, React client with Login, Register, Protected Dashboard, TanStack Query, and automatic token refresh API client.

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
- `server/src/modules/tenants/tenant.controller.js`: Returns current tenant details and user membership.
- `client/src/lib/api.js`: Unified API client managing access token in-memory and auto-refreshing via cookie.
- `client/src/features/auth/AuthContext.jsx`: Application-wide auth state and session bootstrap.

## Known issues / TODO
_None._

## Task log (newest first)
### 2026-11-15, Week 1 Phase D: Middleware and UI
- What was built:
  - `server/src/middleware/tenantContext.js`: Enforces tenant derivation from verified user membership. Prevents cross-tenant spoofing.
  - `server/src/middleware/rbac.js`: Role authorization middleware.
  - `server/src/modules/tenants/tenant.routes.js`: `GET /api/v1/tenant/current` endpoint returning active tenant profile and caller role.
  - React client:
    - `client/src/lib/api.js`: In-memory access token storage, automatic Bearer attachment, and 401 transparent token refresh.
    - `client/src/features/auth/AuthContext.jsx`: Session bootstrap and auth state.
    - `client/src/features/auth/LoginPage.jsx`: Sign in screen with generic error handling.
    - `client/src/features/auth/RegisterPage.jsx`: Workspace registration with slug preview.
    - `client/src/features/tenant/DashboardPage.jsx`: Workspace dashboard displaying tenant details, user role badge, and isolation confirmations.
    - `client/src/components/ProtectedRoute.jsx` & `PublicRoute.jsx`: Route guards.
- Files added/changed:
  - `server/src/middleware/tenantContext.js`
  - `server/src/middleware/rbac.js`
  - `server/src/modules/tenants/tenant.controller.js`
  - `server/src/modules/tenants/tenant.routes.js`
  - `server/src/routes/index.js`
  - `client/src/lib/api.js`
  - `client/src/features/auth/AuthContext.jsx`
  - `client/src/features/auth/LoginPage.jsx`
  - `client/src/features/auth/RegisterPage.jsx`
  - `client/src/features/tenant/DashboardPage.jsx`
  - `client/src/components/ProtectedRoute.jsx`
  - `client/src/components/PublicRoute.jsx`
  - `client/src/app/AppRoutes.jsx`
  - `client/src/App.jsx`
- Tests added / status:
  - `GET /api/v1/tenant/current` verified for authenticated access (200 OK).
  - Cross-tenant spoofing attempt rejected with 403 `TENANT_ACCESS_DENIED`.
  - Client production build succeeded (`vite build` completed in 4.38s).
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
