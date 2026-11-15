# Progress Log

> This file is the project's memory. Every new AI session must read it first and update it at the end of every task.

## Current status
- Phase: **Week 3 Phase F Completed** (RBAC hardening and audit logging for publish, archive, and membership operations).
- **Next task: Week 3 Phase G** (Rate limiting on login, search, and feedback).

## Completed
- **Phase F (RBAC Hardening & Administrative Audit Logging):** Hardened role permissions across all routes. Enforced that Editors can only create and edit `DRAFT` articles, rejecting attempts to publish or archive via create/update with 403 `ROLE_NOT_AUTHORIZED`. Added workspace member management endpoints (`GET /api/v1/tenant/members`, `PATCH /api/v1/tenant/members/:memberId`) allowing Owners to manage member roles. Created `AuditService` (`server/src/modules/audit/audit.service.js`) and administrative audit endpoint `GET /api/v1/tenant/audit-logs` recording audit logs on article publish/archive/deletion, category archiving, workspace settings updates, and member role changes. Added 9 automated tests in `tests/rbac.test.js`.
- **Phase E (Redis Caching Layer & Invalidation):** Added `redis:7-alpine` container (`knowledgehub-redis`) to Docker Compose on port 6379 with healthcheck. Created resilient cache client `server/src/config/redis.js` using `ioredis` with non-blocking error interception, offline queue suppression, and 100% database fallback when Redis is offline. Cached public tenant config (`tenant:<slug>`, 1hr TTL), category lists (`categories:<slug>`, 15m TTL), and published article reads (`article:<slug>:<slug>`, 15m TTL). Implemented automatic cache invalidation hooks on article changes, category changes, and branding updates. Added 6 automated tests in `tests/cache.test.js`.
- **Phase D (Analytics Dashboard UI):** Built full-featured customer intelligence dashboard in `client/src/features/analytics/AnalyticsPage.jsx` with date range selectors (7d, 30d, 90d, 1y), KPI summary cards (Article Views, Search Queries, Helpfulness Score, Unanswered Searches), sentiment gauge breakdown, top articles ranking table, popular search terms table, and actionable zero-result queries with direct "Draft Article" links. Enforced server and client RBAC (`OWNER`/`ADMIN` only; informative lock state for `EDITOR`). Added navigation link in `DashboardLayout.jsx` and registered `/analytics` in `AppRoutes.jsx`.
- **Phase C (Analytics Data Collection & Aggregation):** Built view collection endpoint `POST /api/v1/public/:tenantSlug/articles/:articleSlug/view` with User-Agent bot filtering (identifying crawlers/bots) and daily session deduplication. Implemented backend `AnalyticsService` with multi-table aggregations for `GET /api/v1/analytics/overview` (views, searches, feedback ratio), `GET /api/v1/analytics/articles` (top articles by view and helpfulness count), and `GET /api/v1/analytics/searches` (popular searches and searches with no results). Enforced strict RBAC (`OWNER`/`ADMIN` only) and multi-tenant scoping. Added 9 automated tests in `tests/analytics.test.js`.
- **Phase B (Article Feedback & Abuse Controls):** Added `POST /api/v1/public/:tenantSlug/articles/:articleSlug/feedback` accepting boolean `helpful` and optional 1000-char `comment`. Enforced strict tenant scoping, published-only article verification (drafts/archived/cross-tenant return 404), and anonymous SHA-256 IP hashing abuse prevention blocking rapid spam with 429 `FEEDBACK_ALREADY_SUBMITTED`. Integrated interactive feedback widget in `PublicArticleDetailPage.jsx` with rating buttons, optional comment form, thank you state, and localStorage persistence. Added 8 automated tests in `tests/feedback.test.js`.
- **Phase A (PostgreSQL Full-Text Search & Category Filters):** Implemented parameterized PostgreSQL FTS on published articles using `plainto_tsquery('english', $1)` against `to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))` with `ts_rank` relevance ranking, category filter, and pagination. Bounded and validated search queries (`q` 1-100 characters). Enforced strict tenant scoping and published-only privacy. Updated public landing page with live search, category filter pills, empty states, and error handling. Added 9 automated tests in `tests/search.test.js` covering FTS, category filters, bounds, and negative cross-tenant isolation.
- **Phase G (Tests + Wrap-up):** Verified all 7 criteria of the Week 2 checklist in PLAN.md. 62 passed automated tests across 5 test suites. Updated database seed script with categories and articles. Authored complete API reference in `docs/api.md` and updated root `README.md`.
- **Phase F (Polish, Pagination & Accessibility):** Reusable accessible `Pagination` component, sorting controls on article tables (Newest, Oldest, Title A-Z, Title Z-A, Recently Updated), responsive layout refinements, proper ARIA labeling for accessibility, enhanced loading skeletons, empty states, and error handling.
- **Phase E (Public Help Center):** Backend public APIs (`/api/v1/public/:tenantSlug`, `/categories`, `/articles`, `/articles/:articleSlug`) resolving active tenant by slug and returning **PUBLISHED** content strictly. Public portal UI with `PublicHelpLayout`, `PublicLandingPage` (hero, topic cards, recent guides), `PublicCategoryPage` (category overview with articles), and `PublicArticleDetailPage` with `SafeContent` XSS sanitization and breadcrumb navigation. Automated tests in `server/tests/public.test.js` verifying published-only visibility, draft/archived 404 privacy, and cross-tenant isolation.
- **Phase D (Articles UI & Safe Rendering):** Built `ArticlesListPage` with status tabs (`ALL`, `DRAFT`, `PUBLISHED`, `ARCHIVED`), category filter, search, badges, pagination, quick preview modal, and action buttons. Built `ArticleEditorPage` with auto-slug generation, category selector, dual-tab Write/Live-Preview, and role-aware publishing. Implemented `SafeContent` with DOMPurify sanitization to block stored XSS.
- **Phase C (Articles API):** Article CRUD APIs (`GET/POST/PATCH/DELETE /api/v1/articles`, `POST /api/v1/articles/:articleId/publish`), validated state transitions (`DRAFT` <-> `PUBLISHED` <-> `ARCHIVED`), slug uniqueness per tenant, strict parent-child tenant category validation (`INVALID_CATEGORY` on cross-tenant category attachment), predictable sorting, pagination metadata (`{ data, meta: { total, page, limit, totalPages } }`), and 15 new automated integration & cross-tenant tests.
- **Phase B (Categories Management):** Prisma models for `Category` and `Article`, migrations applied, Category CRUD APIs (`GET/POST/PATCH/DELETE /api/v1/categories`), role enforcement (`OWNER`/`ADMIN` manage, `EDITOR` view), slug uniqueness per tenant, `CategoriesPage` UI with filter tabs, create/edit modal, archive dialog, and 13 new automated integration & cross-tenant tests.
- **Phase A (Dashboard Shell):** `DashboardLayout` with responsive collapsible sidebar, top navigation, dynamic tenant switcher (rendered conditionally only for users with >1 memberships), `OverviewPage`, `ProfilePage`, `SettingsPage` with branding updates, and backend `PATCH /api/v1/tenant/current` with RBAC enforcement (`OWNER`/`ADMIN`).
- **Week 1 Phases A-F:** Multi-tenant setup, database models (`Tenant`, `User`, `Membership`, `RefreshToken`), auth APIs (register, login, refresh, logout, me), middleware, client auth, and initial tests.
- **Week 2 Phase D (Articles UI & Safe Rendering):** Built `ArticlesListPage` with status tabs (`ALL`, `DRAFT`, `PUBLISHED`, `ARCHIVED`), category filter, search, badges, pagination, quick preview modal, and action buttons. Built `ArticleEditorPage` with auto-slug generation, category selector, dual-tab Write/Live-Preview, and role-aware publishing. Implemented `SafeContent` with DOMPurify sanitization to block stored XSS.
- **Week 2 Phase C (Articles API):** Article CRUD APIs (`GET/POST/PATCH/DELETE /api/v1/articles`, `POST /api/v1/articles/:articleId/publish`), validated state transitions (`DRAFT` <-> `PUBLISHED` <-> `ARCHIVED`), slug uniqueness per tenant, strict parent-child tenant category validation (`INVALID_CATEGORY` on cross-tenant category attachment), predictable sorting, pagination metadata (`{ data, meta: { total, page, limit, totalPages } }`), and 15 new automated integration & cross-tenant tests.
- **Week 2 Phase B (Categories Management):** Prisma models for `Category` and `Article`, migrations applied, Category CRUD APIs (`GET/POST/PATCH/DELETE /api/v1/categories`), role enforcement (`OWNER`/`ADMIN` manage, `EDITOR` view), slug uniqueness per tenant, `CategoriesPage` UI with filter tabs, create/edit modal, archive dialog, and 13 new automated integration & cross-tenant tests.
- **Week 2 Phase A (Dashboard Shell):** `DashboardLayout` with responsive collapsible sidebar, top navigation, dynamic tenant switcher (rendered conditionally only for users with >1 memberships), `OverviewPage`, `ProfilePage`, `SettingsPage` with branding updates, and backend `PATCH /api/v1/tenant/current` with RBAC enforcement (`OWNER`/`ADMIN`).
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
### 2026-11-15, Week 3 Phase F: RBAC Hardening & Administrative Audit Logging
- What was built:
  - Role enforcement hardening on article creation and update: explicitly blocked `EDITOR` role from creating pre-published articles or changing status to `PUBLISHED` / `ARCHIVED`, returning 403 `ROLE_NOT_AUTHORIZED`.
  - Built `AuditService` (`server/src/modules/audit/audit.service.js`) capturing administrative actions: `ARTICLE_PUBLISHED`, `ARTICLE_ARCHIVED`, `ARTICLE_DELETED`, `CATEGORY_ARCHIVED`, `TENANT_SETTINGS_UPDATED`, `MEMBER_ROLE_UPDATED`.
  - Added workspace member management APIs: `GET /api/v1/tenant/members` and `PATCH /api/v1/tenant/members/:memberId` (Owner role management with audit logging).
  - Added `GET /api/v1/tenant/audit-logs` endpoint for Owners and Admins to inspect administrative workspace activity.
  - Automated tests in `server/tests/rbac.test.js` covering article role bounds, member promotion, owner protection, and audit event creation.
- Files added/changed:
  - `server/src/modules/audit/audit.service.js`, `server/src/modules/articles/article.controller.js`, `server/src/modules/categories/category.controller.js`, `server/src/modules/tenants/tenant.controller.js`, `server/src/modules/tenants/tenant.routes.js`, `server/tests/rbac.test.js`, `docs/PROGRESS.md`.
- Tests added / status:
  - 103 passed tests across 10 test suites in Jest/Supertest suite (`npm test`).
  - ESLint passed with 0 warnings (`npm run lint`).
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.

### 2026-11-15, Week 3 Phase E: Redis Caching Layer & Invalidation
- What was built:
  - Added Redis 7 container `knowledgehub-redis` in `docker-compose.yml` on port 6379 with healthcheck and persistent volume `redis_data`.
  - Configured `REDIS_URL=redis://localhost:6379` in root `.env.example`, `server/.env.example`, `server/.env`, and `server/src/config/environment.js`.
  - Built resilient cache module `server/src/config/redis.js` with `ioredis` featuring lazy connect, reconnect strategy, error suppression, and automatic database fallback when Redis is unreachable.
  - Cached public endpoints: `GET /api/v1/public/:tenantSlug` (1 hour), `GET /api/v1/public/:tenantSlug/categories` (15 mins), `GET /api/v1/public/:tenantSlug/articles/:articleSlug` (15 mins). All cache keys scoped by tenant identity.
  - Automatic cache invalidation on content changes in `article.service.js`, `category.service.js`, and `tenant.controller.js`.
  - Automated tests in `server/tests/cache.test.js` covering cache hits, content invalidation, tenant key scoping, and resilient offline fallback.
- Files added/changed:
  - `docker-compose.yml`, `.env.example`, `server/.env.example`, `server/.env`, `server/package.json`, `server/src/config/environment.js`, `server/src/config/redis.js`, `server/src/modules/public/public.service.js`, `server/src/modules/categories/category.service.js`, `server/src/modules/articles/article.service.js`, `server/src/modules/tenants/tenant.controller.js`, `server/tests/setup.js`, `server/tests/cache.test.js`, `docs/PROGRESS.md`.
- Tests added / status:
  - All 94 backend tests passing (`npm test`).
  - ESLint passed with 0 warnings (`npm run lint`).
- Decisions or deviations from PLAN.md:
  - Installed `ioredis` to satisfy Week 3 Redis caching specification with resilient offline fallback.
- Open issues:
  - None.

### 2026-11-15, Week 3 Phase D: Analytics Dashboard UI & Insights
- What was built:
  - `client/src/features/analytics/AnalyticsPage.jsx`: Interactive analytics dashboard with date range filter pills (7d, 30d, 90d, 1y), KPI summary cards, sentiment bar gauge, top performing articles table with satisfaction percentages, popular search terms table, and unanswered searches table with quick article creation CTAs.
  - Role-based UI gating: Editors see informative restricted access banner; sidebar link conditionally displays only for `OWNER` and `ADMIN` roles.
  - Linked `/analytics` route in `AppRoutes.jsx` and `DashboardLayout.jsx`.
- Files added/changed:
  - `client/src/features/analytics/AnalyticsPage.jsx`, `client/src/layouts/DashboardLayout.jsx`, `client/src/app/AppRoutes.jsx`, `docs/PROGRESS.md`.
- Tests added / status:
  - All 88 backend tests passing (`npm test`).
  - Client production build succeeded (`npm run build`).
  - ESLint passed with 0 warnings (`npm run lint`).
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.

### 2026-11-15, Week 3 Phase C: Analytics Collection, Bot Detection & Aggregation
- What was built:
  - View event endpoint `POST /api/v1/public/:tenantSlug/articles/:articleSlug/view` with regex bot filtering (`/bot|crawl|spider|.../i`) and daily session hash deduplication.
  - Analytics aggregate service `server/src/modules/analytics/analytics.service.js` calculating overview metrics, top viewed articles with helpfulness ratio, popular search terms, and missing content (searches with zero results).
  - Controller and routes for `GET /api/v1/analytics/overview`, `GET /api/v1/analytics/articles`, `GET /api/v1/analytics/searches` with `from` and `to` date filters.
  - RBAC protection: enforced `OWNER` and `ADMIN` access; rejects `EDITOR` with 403.
  - Background view event recording hooked in `PublicArticleDetailPage.jsx`.
  - Added 9 automated tests in `server/tests/analytics.test.js` covering views, bot detection, overview metrics, search queries, RBAC, and negative cross-tenant isolation.
- Files added/changed:
  - `server/src/middleware/validate.js`, `server/src/modules/public/public.service.js`, `server/src/modules/public/public.controller.js`, `server/src/modules/public/public.routes.js`, `server/src/modules/analytics/`, `server/src/routes/index.js`, `client/src/features/public/PublicArticleDetailPage.jsx`, `server/tests/analytics.test.js`, `docs/PROGRESS.md`.
- Tests added / status:
  - 88 passed tests across 8 test suites in Jest/Supertest suite (`npm test`).
  - ESLint passed with 0 warnings (`npm run lint`).
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.

### 2026-11-15, Week 3 Phase B: Article Helpful Feedback & Abuse Controls
- What was built:
  - Backend API: `POST /api/v1/public/:tenantSlug/articles/:articleSlug/feedback` validating `helpful` (boolean) and optional `comment` (max 1000 characters).
  - Abuse prevention: IP hashing with SHA-256 and duplicate submission throttling within 10-minute window (429 `FEEDBACK_ALREADY_SUBMITTED`).
  - Privacy and tenancy: Only active tenants and `PUBLISHED` articles accept feedback; draft, archived, or cross-tenant articles return 404.
  - Added `ApiError.tooManyRequests(message, code)` to `server/src/utils/errors.js`.
  - Frontend feedback widget in `PublicArticleDetailPage.jsx` featuring helpful/unhelpful rating buttons, optional comment textarea, submission loader, error alerts, thank-you banner, and local storage submission persistence.
  - Automated test suite `server/tests/feedback.test.js` covering 8 test cases (ratings, comments, bounds, rapid abuse throttling, and cross-tenant isolation).
- Files added/changed:
  - `server/src/utils/errors.js`, `server/src/modules/public/public.service.js`, `server/src/modules/public/public.controller.js`, `server/src/modules/public/public.routes.js`, `client/src/features/public/PublicArticleDetailPage.jsx`, `server/tests/feedback.test.js`, `docs/PROGRESS.md`.
- Tests added / status:
  - 79 passed tests across 7 test suites in Jest/Supertest suite (`npm test`).
  - Client production build passed (`npm run build`).
  - ESLint passed with 0 warnings (`npm run lint`).
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.

### 2026-11-15, Week 3 Phase A: PostgreSQL Full-Text Search with Category Filters
- What was built:
  - Database schema models for Week 3 added to Prisma (`Feedback`, `ArticleView`, `SearchLog`, `AuditLog`) and migration `20261115103541_add_week3_models` created and deployed.
  - Parameterized PostgreSQL Full-Text Search service `searchPublicArticles(tenantSlug, queryParams)` using `prisma.$queryRaw`, `to_tsvector`, `plainto_tsquery`, and `ts_rank` with pagination and category filtering.
  - Public API `GET /api/v1/public/:tenantSlug/search?q=...&category=...` validating query bounds (1-100 chars) and strictly scoping to active tenant and `PUBLISHED` status.
  - Public Help Center UI updated in `PublicLandingPage.jsx` with debounced search query, category filter pill buttons, result count, and empty states.
  - Automated tests in `server/tests/search.test.js` covering validation, keyword search, category filtering, draft exclusion, and negative cross-tenant isolation.
- Files added/changed:
  - `server/prisma/schema.prisma`, `server/prisma/migrations/20261115103541_add_week3_models/`, `server/tests/setup.js`, `server/src/modules/public/public.validation.js`, `server/src/modules/public/public.service.js`, `server/src/modules/public/public.controller.js`, `server/src/modules/public/public.routes.js`, `client/src/features/public/PublicLandingPage.jsx`, `server/tests/search.test.js`, `docs/PROGRESS.md`.
- Tests added / status:
  - 71 passed tests across 6 test suites in Jest/Supertest suite (`npm test`).
  - Client production build succeeded (`npm run build`).
  - ESLint passed with 0 warnings (`npm run lint`).
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.

### 2026-11-15, Week 2 Phase G: Tests, Wrap-up & Checklist Verification
- What was built:
  - Reviewed and confirmed all 7 items of the Week 2 checklist in PLAN.md:
    1. Tenant Admin/Editor can manage only their tenant's categories and articles (enforced via `auth`, `tenantContext`, and `rbac` middleware).
    2. Article status transitions are validated by the backend (`DRAFT` <-> `PUBLISHED` <-> `ARCHIVED`).
    3. Draft and archived articles return 404 to public visitors; only `PUBLISHED` content is exposed.
    4. Public Help Center resolves tenant using a unique slug.
    5. Parent-child tenant relationships checked: article creation/update rejects category from another tenant (`INVALID_CATEGORY`).
    6. List endpoints support pagination (`page`, `limit` max 50) and predictable sorting (`sort=createdAt:desc`, etc.).
    7. UI works seamlessly on desktop and mobile and displays loading, error, and empty states.
  - Enhanced demo database seed script (`server/prisma/seed.js`) to generate initial categories and articles for Acme Corp and Globex Corporation.
  - Authored comprehensive API reference in `docs/api.md` covering all Week 1 & Week 2 endpoints.
  - Updated root `README.md` with updated architecture, endpoint summaries, credentials, and verification instructions.
- Files added/changed:
  - `server/prisma/seed.js`, `docs/api.md`, `README.md`, `docs/PROGRESS.md`.
- Tests added / status:
  - 62 passed tests across 5 test suites in Jest/Supertest suite (`npm test`).
  - Client production build succeeded (`npm run build`).
  - ESLint passed with 0 warnings (`npm run lint`).
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.

### 2026-11-15, Week 2 Phase F: Polish, Sorting, Pagination & Accessibility
- What was built:
  - `client/src/components/Pagination.jsx`: Reusable, keyboard-navigable pagination component with item count ranges, bounded Previous/Next buttons, and semantic ARIA labeling.
  - Sorting support: Added sorting dropdown to `ArticlesListPage.jsx` supporting predictable sorting (`Newest First`, `Oldest First`, `Title A-Z`, `Title Z-A`, `Recently Updated`).
  - Integrated `Pagination` component into both `ArticlesListPage.jsx` and `PublicCategoryPage.jsx`.
  - Accessibility & Polish: Added explicit `aria-label` attributes to icon-only buttons, modal dialogs, and navigation elements. Refined loading skeletons, empty states with direct CTAs, and responsive layout behavior across mobile and desktop breakpoints.
- Files added/changed:
  - `client/src/components/Pagination.jsx`, `client/src/features/articles/ArticlesListPage.jsx`, `client/src/features/public/PublicCategoryPage.jsx`, `docs/PROGRESS.md`.
- Tests added / status:
  - All 62 backend tests passing (`npm test`).
  - Client production build succeeded (`npm run build`).
  - ESLint passed with 0 warnings (`npm run lint`).
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.

### 2026-11-15, Week 2 Phase E: Public Help Center Portal & Endpoints
- What was built:
  - `server/src/modules/public/`: `public.service.js`, `public.controller.js`, `public.routes.js`.
  - Public APIs: `GET /api/v1/public/:tenantSlug` (tenant metadata & branding), `GET /api/v1/public/:tenantSlug/categories` (active categories with published article counts), `GET /api/v1/public/:tenantSlug/articles` (published articles with category filter and pagination), `GET /api/v1/public/:tenantSlug/articles/:articleSlug` (single published article).
  - Security & Privacy Non-negotiables: Draft and archived articles strictly return 404 `ARTICLE_NOT_FOUND` to public visitors. Suspended or nonexistent tenants return 404. Sensitive internal fields (user passwords, refresh sessions, draft contents) are never exposed.
  - Resolved non-deterministic database query bug: Added `orderBy: { createdAt: 'asc' }` to memberships query in `server/src/middleware/auth.js` so user's active tenant ordering remains deterministic across all PostgreSQL sessions.
  - Customer Help Center UI: `PublicHelpLayout.jsx` with custom tenant primaryColor styling, `PublicLandingPage.jsx` with hero search banner and topic cards, `PublicCategoryPage.jsx` with category article list, and `PublicArticleDetailPage.jsx` with breadcrumbs and safe content rendering.
  - Automated tests: `server/tests/public.test.js` covering 11 test cases (public branding, category counts, published-only filtering, draft 404, archived 404, and cross-tenant slug isolation).
- Files added/changed:
  - `server/src/modules/public/`, `server/src/routes/index.js`, `server/src/middleware/auth.js`, `client/src/features/public/`, `client/src/app/AppRoutes.jsx`, `server/tests/public.test.js`, `docs/PROGRESS.md`.
- Tests added / status:
  - 62 passed tests across all 5 test suites in Jest/Supertest suite (`npm test`).
  - Client production build succeeded (`npm run build`).
  - ESLint passed with 0 warnings (`npm run lint`).
- Decisions or deviations from PLAN.md:
  - Fixed non-deterministic membership ordering in `auth.js` to ensure reliable workspace defaults when multiple memberships exist.
- Open issues:
  - None.

### 2026-11-15, Week 2 Phase D: Articles UI, Editor, Preview, and XSS-Safe Rendering
- What was built:
  - Installed `dompurify` in `client` package to guarantee safe rendering and strictly eliminate stored XSS.
  - `client/src/components/SafeContent.jsx`: Markdown parser with DOMPurify sanitization allowing only safe HTML elements and attributes.
  - `client/src/features/articles/ArticlesListPage.jsx`: Full-featured article management interface with status tabs, category dropdown, real-time title search, status badges, pagination, preview modal, and role-based action buttons (`Edit`, `Publish`, `Archive`).
  - `client/src/features/articles/ArticleEditorPage.jsx`: Authoring interface with title, auto-slug generation & manual override, category selection, excerpt, content editor, and dual-tab live preview using `SafeContent`.
  - Configured client routing in `AppRoutes.jsx` for `/articles`, `/articles/new`, and `/articles/:articleId/edit`.
- Files added/changed:
  - `client/package.json`, `client/package-lock.json`, `client/src/components/SafeContent.jsx`, `client/src/features/articles/ArticlesListPage.jsx`, `client/src/features/articles/ArticleEditorPage.jsx`, `client/src/app/AppRoutes.jsx`, `docs/PROGRESS.md`.
- Tests added / status:
  - All 51 backend tests passing (`npm test`).
  - Client production build succeeded with 0 errors (`npm run build`).
  - ESLint passing with 0 warnings (`npm run lint`).
- Decisions or deviations from PLAN.md:
  - Installed `dompurify` specifically to satisfy the strict non-negotiable XSS prevention requirement.
- Open issues:
  - None.

### 2026-11-15, Week 2 Phase C: Articles API, Lifecycle, State Transitions & Cross-Tenant Validation
- What was built:
  - `server/src/modules/articles/`: `article.validation.js`, `article.service.js`, `article.controller.js`, `article.routes.js`.
  - Article CRUD APIs: `GET /api/v1/articles` (paginated list with `meta`, filters for status and category, predictable sorting), `POST /api/v1/articles` (create draft/published), `GET /api/v1/articles/:articleId` (detail with category & author), `PATCH /api/v1/articles/:articleId` (update), `POST /api/v1/articles/:articleId/publish` (explicit publish endpoint), `DELETE /api/v1/articles/:articleId` (archive/delete).
  - Validated state transitions: `DRAFT` <-> `PUBLISHED` <-> `ARCHIVED`; invalid transitions rejected with 400 `INVALID_STATUS_TRANSITION`.
  - Multi-tenant category attachment validation: Rejects creating or updating an article with a `categoryId` that belongs to another tenant with 400 `INVALID_CATEGORY`.
  - Automated tests: `server/tests/article.test.js` covering 15 test cases (CRUD, slug collision per tenant, role restrictions, publishing, status transitions, cross-tenant category attachment rejection, and negative cross-tenant isolation).
- Files added/changed:
  - `server/src/modules/articles/article.validation.js`, `server/src/modules/articles/article.service.js`, `server/src/modules/articles/article.controller.js`, `server/src/modules/articles/article.routes.js`, `server/src/routes/index.js`, `server/tests/article.test.js`, `docs/PROGRESS.md`.
- Tests added / status:
  - 51 passed tests across 4 test suites in Jest/Supertest suite (`npm test`).
  - ESLint passed with 0 warnings (`npm run lint`).
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.

### 2026-11-15, Week 2 Phase B: Categories CRUD, Tenant Scoping & UI
- What was built:
  - Database Schema & Migration: Added `Category` and `Article` models with `CategoryStatus` and `ArticleStatus` enums to `server/prisma/schema.prisma`. Applied migration `20261115091514_add_categories_and_articles` to dev and test databases.
  - `server/src/modules/categories/`: `category.validation.js`, `category.service.js`, `category.controller.js`, `category.routes.js`.
  - Category APIs: `GET /api/v1/categories`, `POST /api/v1/categories`, `GET /api/v1/categories/:categoryId`, `PATCH /api/v1/categories/:categoryId`, `DELETE /api/v1/categories/:categoryId` (archive).
  - RBAC: `OWNER` and `ADMIN` can create, update, and archive categories. `EDITOR` can view list and detail.
  - Multi-tenant scoping: Category queries strictly scoped to `req.tenant.id`. Slugs unique per `(tenantId, slug)`.
  - `client/src/features/categories/CategoriesPage.jsx`: Interactive category management UI with status filter tabs (`ALL`, `ACTIVE`, `ARCHIVED`), create/edit modal with validation, archive confirmation dialog, empty state, and loading skeleton.
  - Automated tests: `server/tests/category.test.js` covering happy path, validation, duplicate slug per tenant, cross-tenant isolation (Tenant B cannot read, update, or archive Tenant A's categories).
- Files added/changed:
  - `server/prisma/schema.prisma`, `server/prisma/migrations/20261115091514_add_categories_and_articles/migration.sql`, `server/tests/setup.js`, `server/src/modules/categories/`, `server/src/routes/index.js`, `client/src/features/categories/CategoriesPage.jsx`, `client/src/app/AppRoutes.jsx`, `server/tests/category.test.js`, `docs/PROGRESS.md`.
- Tests added / status:
  - 36 passed tests across 3 suites in Jest/Supertest suite (`npm test`).
  - Client production build passed (`npm run build`).
  - ESLint passed with 0 warnings (`npm run lint`).
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.

### 2026-11-15, Week 2 Phase A: Dashboard Shell, Sidebar, Switcher, Profile & Settings
- What was built:
  - `client/src/layouts/DashboardLayout.jsx`: Responsive layout with sidebar navigation, active workspace card, public portal link, user badge, and tenant switcher shown only when `memberships.length > 1`.
  - `client/src/features/tenant/OverviewPage.jsx`: Main dashboard overview with quick action links to Articles, Categories, and Public Help Center.
  - `client/src/features/tenant/ProfilePage.jsx`: Detailed user profile with memberships list and one-click workspace switching.
  - `client/src/features/tenant/SettingsPage.jsx`: Workspace settings page with branding update form for `OWNER` / `ADMIN` roles.
  - `server/src/modules/tenants/tenant.validation.js` & `PATCH /api/v1/tenant/current`: Allows Owners and Admins to update workspace name, logoUrl, and primaryColor with Zod validation.
  - Automated tests added to `server/tests/tenant.test.js` covering `PATCH /api/v1/tenant/current` permissions and validation.
- Files added/changed:
  - `client/src/layouts/DashboardLayout.jsx`, `client/src/features/tenant/OverviewPage.jsx`, `client/src/features/tenant/ProfilePage.jsx`, `client/src/features/tenant/SettingsPage.jsx`, `client/src/app/AppRoutes.jsx`, `server/src/modules/tenants/tenant.validation.js`, `server/src/modules/tenants/tenant.controller.js`, `server/src/modules/tenants/tenant.routes.js`, `server/tests/tenant.test.js`, `docs/PROGRESS.md`.
- Tests added / status:
  - 23 passed tests in Jest/Supertest suite (`npm test`).
  - Client production build passed with 0 errors (`npm run build`).
  - ESLint passed with 0 errors (`npm run lint`).
- Decisions or deviations from PLAN.md:
  - None.
- Open issues:
  - None.

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
