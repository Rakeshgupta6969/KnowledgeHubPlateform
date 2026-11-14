# Architecture and Conventions

Short reference for every session. The full spec is in `docs/PLAN.md`; if the two conflict, ask the developer.

## Shape
- Modular monolith: React + Vite client, Express API, PostgreSQL via Prisma, Redis cache (added in Week 3).
- Monorepo folders: `/client`, `/server`, `/docs`.

## Server layering
- `routes/` wire URLs to controllers. `modules/<name>/` hold `controller`, `service`, `validation` (Zod schemas).
- Controllers handle HTTP only. **Business logic and DB access live in services.**
- Shared checks live in `middleware/`: `auth`, `tenantContext`, `rbac`, `validate`, `rateLimit`, `errorHandler`.
- No giant `server.js`. `app.js` builds the Express app; `server.js` only starts it (keeps Supertest simple).

## Multi-tenancy rules (critical)
1. Every tenant-owned table has `tenant_id`.
2. Private routes: tenant comes from the authenticated user's active **membership**. Never from body, query or params supplied by the client.
3. Public routes: resolve tenant by unique `slug`, then scope every query to that tenant.
4. Validate parent/child ownership: a `categoryId` or `articleId` from the client must belong to the same tenant.
5. Cross-tenant access returns 404 (non-disclosing) or 403.
6. Cache keys always include the tenant identity.
7. Every module needs negative tests proving Tenant A cannot touch Tenant B's data.

## Roles
`OWNER` > `ADMIN` > `EDITOR` (publish only if granted). Platform Super Admin is separate from tenant roles. Enforce on the server; hiding UI buttons is not security.

## API conventions
- Base path `/api/v1`. JSON only. Plural nouns.
- Success: return the resource or `{ data, meta }` for lists. Lists accept `page`, `limit` (max 50) and `sort`.
- Errors: `{ "error": { "code", "message", "details?" } }` with correct status codes (400, 401, 403, 404, 409, 422, 429, 500).
- Auth failures on login use a generic message.
- Document every endpoint in `docs/api.md` (and Swagger from Day 22).

## Data conventions
- UUID primary keys, UTC timestamps, `created_at` / `updated_at` on mutable records.
- Unique `(tenant_id, slug)` for categories and articles. Unique `users.email` (normalized lowercase) and `tenants.slug`.
- Article status: `DRAFT` | `PUBLISHED` | `ARCHIVED`. Only `PUBLISHED` is public.

## Frontend conventions
- Feature folders under `client/src/features/<name>`. Shared UI in `components/`.
- TanStack Query for server state. One API client in `lib/` that attaches the access token and handles refresh.
- Tailwind for styling. Every list needs loading, empty and error states. Responsive and accessible by default.
- Render article content safely (sanitize; no raw `dangerouslySetInnerHTML` without sanitizing).

## Testing
- Server: Jest + Supertest against a separate test database. Client: React Testing Library for key components.
- Each feature ships with happy-path, validation-failure, permission and cross-tenant tests.

## Security baseline
bcrypt, short-lived JWT, revocable refresh sessions, Zod validation on every input, Helmet, strict CORS (`CLIENT_ORIGIN`), rate limits on login/search/feedback, no secrets in Git (`.env.example` only), parameterized queries (careful with raw SQL for full-text search).
