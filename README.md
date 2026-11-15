# KnowledgeHub

> Multi-Tenant Customer Support Knowledge Base SaaS platform built with React, Vite, Tailwind CSS, Node.js (Express CommonJS), PostgreSQL, and Prisma.

## Overview

KnowledgeHub enables companies (tenants) to create, manage, and publish customer support help centers with complete tenant data isolation.

This repository implements **Week 1 (Days 1–7)**, **Week 2 (Days 8–14)**, and **Week 3 (Days 15–21)** of the architecture roadmap:
- **Tenant Isolation:** Tenant context is strictly derived from verified memberships. Queries are scoped by `tenant_id` on every private route.
- **Tenant Dashboard Shell:** Responsive layout with sidebar, profile, settings, branding management, and a dynamic workspace switcher (rendered only for multi-membership users).
- **Categories Management:** CRUD operations, per-tenant slug uniqueness, ordering, archiving, and role-based access control (`OWNER`, `ADMIN`, `EDITOR`).
- **Articles Lifecycle & Management:** Draft, published, and archived states with validated transitions. Parent-child tenant validation prevents cross-tenant category attachment.
- **Content Safety & Security:** Rich content and markdown are sanitized using DOMPurify (`SafeContent.jsx`) before rendering to eliminate stored XSS.
- **Public Help Center:** Customer-facing portal resolving tenants by slug (`/help/:tenantSlug`). Strictly displays **PUBLISHED** content only; drafts and archived articles return non-disclosing 404s.
- **Full-Text Search:** PostgreSQL parameterized full-text search (`to_tsvector`, `plainto_tsquery`, `ts_rank`) on published titles and content, tenant-scoped with category filtering.
- **Reader Feedback:** Thumbs up/down rating with optional comment, IP-hash abuse prevention, and rate limiting.
- **Analytics Collection & Dashboard:** Automated article view recording with bot filtering, search query logging, and administrative analytics dashboard with date filters (7d, 30d, 90d, 1y), KPI summary cards, sentiment analysis, top articles ranking, and unanswered search queries.
- **Redis Caching:** High-performance caching for public tenant branding, category lists, and published articles with tenant-scoped cache keys, custom TTLs, automatic invalidation on updates, and graceful offline fallback.
- **RBAC Hardening & Audit Logging:** Enforced permissions across all routes (`OWNER`, `ADMIN`, `EDITOR`), member role management, and immutable audit logs for administrative actions.
- **Rate Limiting:** Protection against abuse on login (10 req/15m), search (30 req/min), and feedback (15 req/15m).
- **Automated Test Suite:** 106 passed automated integration tests across 11 suites covering search, feedback, analytics, caching, RBAC, rate limiting, and cross-tenant attack prevention.

---

## Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18 + Vite | Tailwind CSS, React Router v6, TanStack Query, Lucide icons, DOMPurify |
| **Backend** | Node.js + Express | CommonJS, modular monolith (`src/modules`, `src/middleware`, `src/utils`) |
| **Database** | PostgreSQL 16 Alpine | Containerized via Docker Compose, managed with Prisma ORM |
| **Caching** | Redis 7 Alpine | Containerized via Docker Compose, managed with ioredis with offline fallback |
| **Rate Limiting** | express-rate-limit | Configured on authentication, search, and reader feedback |
| **Authentication** | JWT + bcrypt | Short-lived access token (15m) + revocable refresh cookie (7d) |
| **Validation** | Zod | Server-side request validation with structured error responses |
| **Testing** | Jest + Supertest | 106 integration tests against isolated test database (`knowledgehub_test`) |

---

## Directory Structure

```text
knowledgehubFolder/
├── docker-compose.yml       # PostgreSQL 16 Alpine service
├── .env.example             # Template for environment variables
├── README.md                # Project documentation & setup instructions
├── docs/
│   ├── PLAN.md              # 4-Week implementation roadmap
│   ├── ARCHITECTURE.md      # Conventions and multi-tenancy rules
│   ├── PROGRESS.md          # Progress log and task history
│   └── api.md               # API endpoint specifications and examples
├── server/
│   ├── prisma/
│   │   ├── schema.prisma    # Models: Tenant, User, Membership, RefreshToken, Category, Article
│   │   ├── migrations/      # Committed SQL migrations
│   │   └── seed.js          # Demo seed script (Acme Corp & Globex)
│   ├── src/
│   │   ├── config/          # Environment & Prisma client configuration
│   │   ├── middleware/      # auth, tenantContext, rbac, validate, errorHandler
│   │   ├── modules/         # auth, tenants, categories, articles, public
│   │   ├── routes/          # API v1 route aggregator
│   │   ├── utils/           # errors, tokens, slugify
│   │   ├── app.js           # Express application setup
│   │   └── server.js        # Server listener
│   └── tests/
│       ├── setup.js         # Test lifecycle & database reset
│       ├── auth.test.js     # Auth & registration tests
│       ├── tenant.test.js   # Tenant context & isolation tests
│       ├── category.test.js # Category CRUD & cross-tenant tests
│       ├── article.test.js  # Article lifecycle & category ownership tests
│       └── public.test.js   # Public portal privacy & published-only tests
└── client/
    ├── src/
    │   ├── app/             # AppRoutes configuration
    │   ├── components/      # ProtectedRoute, PublicRoute, SafeContent, Pagination
    │   ├── layouts/         # DashboardLayout (Sidebar, Switcher, Nav)
    │   ├── features/
    │   │   ├── auth/        # AuthContext, LoginPage, RegisterPage
    │   │   ├── tenant/      # OverviewPage, ProfilePage, SettingsPage
    │   │   ├── categories/  # CategoriesPage (CRUD modal, filters, archive)
    │   │   ├── articles/    # ArticlesListPage, ArticleEditorPage
    │   │   └── public/      # PublicHelpLayout, PublicLandingPage, PublicCategoryPage, PublicArticleDetailPage
    │   └── lib/             # Unified API client with automatic refresh
```

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+ LTS)
- Docker Desktop (or local PostgreSQL 16)

### 2. Start PostgreSQL
```bash
docker compose up -d
```

### 3. Setup Backend
```bash
cd server
cp .env.example .env
npm install
npx prisma migrate dev
npm run seed
npm run dev
```
Server runs on `http://localhost:5000`.

### 4. Setup Frontend
```bash
cd client
npm install
npm run dev
```
Client runs on `http://localhost:5173`.

---

## Seed Accounts & Workspaces

Running `npm run seed` creates two isolated demonstration companies with realistic Week 3 analytics:

| Company | Slug | User Role | Email | Password | Help Center URL |
|---|---|---|---|---|---|
| **Acme Corp** | `acme` | OWNER | `owner@acme.com` | `Password123!` | `http://localhost:5173/help/acme` |
| **Acme Corp** | `acme` | ADMIN | `admin@acme.com` | `Password123!` | `http://localhost:5173/help/acme` |
| **Acme Corp** | `acme` | EDITOR | `editor@acme.com` | `Password123!` | `http://localhost:5173/help/acme` |
| **Globex Corporation** | `globex` | OWNER | `owner@globex.com` | `Password123!` | `http://localhost:5173/help/globex` |

---

## Running Verification & Tests

### Automated Backend Tests
Runs all 11 test suites against the dedicated `knowledgehub_test` database:
```bash
cd server
npm test
```
Result: 11 test suites, 106 passed tests (auth, tenant, category, article, public, search, feedback, analytics, cache, rbac, ratelimit).

### Code Quality & Linting
```bash
cd server
npm run lint
```

### Client Production Build
```bash
cd client
npm run build
```

---

## Multi-Tenancy Architecture Guarantees

1. **Header Spoof Protection:** The server rejects any attempt to access another company's data via spoofed `x-tenant-id` with `403 TENANT_ACCESS_DENIED`.
2. **Category Isolation:** An article created in Tenant A cannot be attached to Tenant B's category (`400 INVALID_CATEGORY`).
3. **Public Customer Privacy:** Draft and archived articles strictly return `404 ARTICLE_NOT_FOUND` on public routes. Only `PUBLISHED` content is exposed.
4. **XSS Sanitization:** All customer-facing and editor content is sanitized through DOMPurify before rendering.
