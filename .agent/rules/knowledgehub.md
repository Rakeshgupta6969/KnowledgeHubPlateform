# KnowledgeHub: Project Rules

## Session start (every time)
1. Read `docs/PLAN.md`, `docs/PROGRESS.md` and `docs/ARCHITECTURE.md`.
2. Scan `/server/src`, `/server/prisma` and `/client/src` to see what already exists.
3. Run the existing tests (if any) and report the result before changing anything.
4. Summarize what exists and what the requested task needs. Show a plan and wait for approval before coding on anything touching auth, tenancy or the database schema.

## Session end (every task)
- Update `docs/PROGRESS.md`: current status, next task, files added/changed, decisions, known issues.
- Update `docs/api.md` if endpoints changed.
- Report test results. Never claim tests pass without running them.

## Working style
- Do only the task requested (one day or one module). Do not build later weeks' features or anything in PLAN.md section 13 ("What not to build").
- Reuse existing middleware, services and patterns. Never recreate or rewrite working modules. If an existing file must change, explain why first and keep the change minimal.
- Do not add new dependencies without saying why.
- Small, reviewable changes. Suggest a commit message at the end of each task.

## Stack
React + Vite + Tailwind, React Router, TanStack Query; Node.js (LTS) + Express (CommonJS); PostgreSQL + Prisma; Zod; bcrypt; JWT access + refresh sessions; Redis (Week 3); Jest + Supertest; React Testing Library; Docker Compose.

## Non-negotiables
- **Tenant isolation:** never trust `tenant_id` from body/query/params on private routes; derive it from the authenticated user's membership. Scope every tenant-owned query. Validate parent/child tenant ownership.
- Public routes resolve tenant by slug and return `PUBLISHED` content only.
- Enforce roles on the server for every protected operation.
- Validate all input with Zod; bound pagination, search length and content size.
- Hash passwords; never log or return secrets or password hashes.
- No secrets in Git. Only `.env.example` is committed.
- Sanitize article content before rendering (prevent stored XSS).
- Use consistent error format and `/api/v1` prefix (see `docs/ARCHITECTURE.md`).
- Every feature ships with tests, including **negative cross-tenant tests**.
- Business logic in services, HTTP in controllers, shared checks in middleware.
