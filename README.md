# KnowledgeHub

> Multi-Tenant Customer Support Knowledge Base SaaS platform built with React 18, Vite, Tailwind CSS, Node.js (Express CommonJS), PostgreSQL 16, Prisma ORM, and Redis 7.

[![Tests](https://img.shields.io/badge/tests-133%20passed-success)](docs/TEST_REPORT.md)
[![Security](https://img.shields.io/badge/security-hardened-blue)](docs/SECURITY_CHECKLIST.md)
[![Performance](https://img.shields.io/badge/lighthouse-97%20perf-brightgreen)](docs/PERFORMANCE.md)
[![API Docs](https://img.shields.io/badge/openapi-3.0.3-orange)](docs/api.md)

---

## 1. Project Overview

**KnowledgeHub** is a production-grade, multi-tenant SaaS knowledge management platform designed for customer support operations. Companies (tenants) can independently register, customize branding, organize categories, draft and publish self-service articles, manage team permissions, inspect administrative audit trails, and review real-time customer feedback analytics.

Customers visit isolated public Help Centers (`/help/:tenantSlug`), search published articles with parameterized PostgreSQL full-text search, read safely rendered markdown guides, and submit feedback without requiring authentication.

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph Clients["Clients & Public Web"]
        C1["Customer Browser<br/>(/help/:tenantSlug)"]
        C2["Company Dashboard<br/>(/articles, /analytics)"]
    end

    subgraph CDN["Edge & Static Hosting"]
        ViteClient["React 18 + Vite SPA<br/>Route Code-Splitting<br/>DOMPurify Sanitization"]
    end

    subgraph API["Backend Modular Monolith (Node.js Express)"]
        EdgeSec["Helmet + Strict CORS + Rate Limiters"]
        AuthLayer["JWT Auth + Refresh Cookie Sessions"]
        TenantContext["Strict Tenant Resolver<br/>(Derives Workspace from Membership)"]
        RBACLayer["RBAC Gating<br/>(OWNER > ADMIN > EDITOR)"]
        Services["Controllers & Services<br/>(Articles, Categories, Search, Analytics, Audit)"]
    end

    subgraph Caching["In-Memory Cache"]
        RedisDB[("Redis 7 Alpine<br/>Tenant-Scoped Cache Keys<br/>Active Invalidation Hooks")]
    end

    subgraph Persistence["Primary Database"]
        PostgresDB[("PostgreSQL 16 Alpine<br/>Prisma ORM<br/>Full-Text Search tsvector")]
    end

    C1 --> ViteClient
    C2 --> ViteClient
    ViteClient --> EdgeSec
    EdgeSec --> AuthLayer
    AuthLayer --> TenantContext
    TenantContext --> RBACLayer
    RBACLayer --> Services
    Services <--> RedisDB
    Services <--> PostgresDB
```

---

## 3. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    Tenant ||--o{ Membership : "has many"
    Tenant ||--o{ Category : "owns"
    Tenant ||--o{ Article : "owns"
    Tenant ||--o{ Feedback : "receives"
    Tenant ||--o{ ArticleView : "tracks"
    Tenant ||--o{ SearchLog : "logs"
    Tenant ||--o{ AuditLog : "records"

    User ||--o{ Membership : "belongs to"
    User ||--o{ RefreshToken : "holds"
    User ||--o{ Article : "authors"
    User ||--o{ AuditLog : "acts in"

    Category ||--o{ Article : "contains"
    Article ||--o{ Feedback : "rated by"
    Article ||--o{ ArticleView : "viewed in"

    Tenant {
        uuid id PK
        varchar name
        varchar slug UK
        varchar logo_url
        varchar primary_color
        enum status
        timestamptz created_at
        timestamptz updated_at
    }

    User {
        uuid id PK
        varchar name
        varchar email UK
        varchar password_hash
        enum status
        timestamptz created_at
        timestamptz updated_at
    }

    Membership {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        enum role
        enum status
        timestamptz created_at
    }

    RefreshToken {
        uuid id PK
        varchar token_hash
        uuid user_id FK
        timestamptz expires_at
        timestamptz revoked_at
    }

    Category {
        uuid id PK
        uuid tenant_id FK
        varchar name
        varchar slug
        text description
        int sort_order
        enum status
        timestamptz created_at
    }

    Article {
        uuid id PK
        uuid tenant_id FK
        uuid category_id FK
        uuid author_id FK
        varchar title
        varchar slug
        text excerpt
        text content
        enum status
        timestamptz published_at
        timestamptz created_at
    }

    Feedback {
        uuid id PK
        uuid tenant_id FK
        uuid article_id FK
        boolean helpful
        text comment
        varchar ip_hash
        timestamptz created_at
    }

    ArticleView {
        uuid id PK
        uuid tenant_id FK
        uuid article_id FK
        varchar session_hash
        boolean is_bot
        timestamptz viewed_at
    }

    SearchLog {
        uuid id PK
        uuid tenant_id FK
        varchar query_text
        int results_count
        timestamptz created_at
    }

    AuditLog {
        uuid id PK
        uuid tenant_id FK
        uuid actor_user_id FK
        varchar action
        varchar resource_type
        uuid resource_id
        jsonb details
        timestamptz created_at
    }
```

---

## 4. Key Features

- **Multi-Tenant Isolation:** Tenant context is strictly derived from verified memberships. Zero cross-tenant data leakage.
- **Role-Based Access Control (RBAC):** Server-enforced permissions (`OWNER` > `ADMIN` > `EDITOR`). Editors draft content; Owners and Admins review and publish.
- **Article Lifecycle Management:** State machine transitions (`DRAFT` <-> `PUBLISHED` <-> `ARCHIVED`) with slug generation and category validation.
- **Public Customer Portal:** Fast, tenant-branded Help Center resolving by slug (`/help/:tenantSlug`). Published-only visibility.
- **PostgreSQL Full-Text Search:** Parameterized search using `to_tsvector`, `plainto_tsquery`, and `ts_rank` with category filtering.
- **Redis Caching:** Sub-10ms response times for public branding and article reads with automatic invalidation on updates and resilient database fallback.
- **Reader Feedback & Abuse Controls:** Helpful/unhelpful rating with optional comment, IP-hash abuse prevention, and sliding-window rate limiting.
- **Analytics Intelligence:** Real-time metrics for views (with crawler/bot detection), feedback sentiment, top articles, and unanswered search terms.
- **Audit Logging:** Immutable administrative log capturing publish, archive, member promotion, and workspace settings changes.
- **Security Hardened:** Helmet security headers, strict CORS, DOMPurify Stored XSS defense, rate limiting, and 2MB payload bounds.
- **Interactive OpenAPI/Swagger 3.0:** Complete API documentation hosted at `/api/v1/docs` with downloadable `swagger.json`.
- **Production Health Endpoints:** Active database and cache probing at `/health` and `/api/v1/health` with HTTP 200/503 status codes.

---

## 5. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS | High-performance single page application with route code-splitting |
| **State & Data** | TanStack Query v5, React Router v6 | Server-state caching and client routing |
| **Backend** | Node.js (LTS), Express 4 (CommonJS) | Modular monolith architecture |
| **Database** | PostgreSQL 16 Alpine, Prisma 5 ORM | Relational models, migrations, and Full-Text Search |
| **Cache** | Redis 7 Alpine, ioredis | In-memory public response caching with graceful offline fallback |
| **Security** | Helmet 8, CORS, bcrypt, DOMPurify | HTTP security headers, origin control, password hashing, XSS sanitization |
| **Rate Limiting** | express-rate-limit | Sliding-window IP rate limiters on auth, search, feedback, and API |
| **Testing** | Jest, Supertest, Vitest, Testing Library | 133 automated unit, integration, and security tests |
| **Documentation** | OpenAPI 3.0.3, Swagger UI | Interactive endpoint contracts and schema inspection |

---

## 6. Quick Start & Local Setup

### 6.1 Prerequisites
- **Node.js** (v18+ LTS)
- **Docker Desktop** (for PostgreSQL 16 & Redis 7)

### 6.2 Step-by-Step Launch

```bash
# 1. Start PostgreSQL 16 and Redis 7 containers
docker compose up -d

# 2. Setup Server Environment
cd server
cp .env.example .env
npm install

# 3. Run Migrations & Seed Demo Data
npx prisma migrate dev
npm run seed

# 4. Start Backend Server (runs on http://localhost:5000)
npm run dev

# 5. Setup and Start Client (in a new terminal, runs on http://localhost:5173)
cd ../client
npm install
npm run dev
```

---

## 7. Environment Variables Reference

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment (`development` / `production` / `test`) |
| `PORT` | `5000` | Express API listener port |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/knowledgehub` | Primary PostgreSQL connection string |
| `TEST_DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/knowledgehub_test` | Dedicated test database connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis cache connection string |
| `ACCESS_TOKEN_SECRET` | *(secret string)* | Secret for signing short-lived 15m access JWTs |
| `REFRESH_TOKEN_SECRET` | *(secret string)* | Secret for signing 7d refresh session JWTs |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origins (comma-separated for multiple) |
| `COOKIE_SAMESITE` | `lax` | Refresh token cookie SameSite policy (`lax` / `none`) |

---

## 8. Available Scripts Reference

### Root Monorepo Commands
```bash
npm run build         # Builds production client static assets
npm run migrate:deploy # Executes pending migrations in production
npm run seed          # Seeds rich demo workspaces and analytics
npm run test          # Executes all backend and frontend test suites
npm run start         # Starts backend API in production mode
```

### Server Commands (`/server`)
```bash
npm test              # Executes Jest + Supertest test suite (123 tests)
npm run lint          # Runs ESLint code style and syntax checks
npm run dev           # Starts development server with nodemon reload
npm run migrate       # Applies Prisma migrations in development
npm run seed          # Seeds development database
```

### Client Commands (`/client`)
```bash
npm test              # Executes Vitest + React Testing Library (10 tests)
npm run build         # Compiles production bundle with code-splitting
npm run dev           # Starts Vite hot-reloading development server
npm run preview       # Serves compiled production build locally
```

---

## 9. Seed Demonstration Accounts

The database seed script generates two complete, isolated workspaces with pre-populated categories, published articles, view events, and feedback:

| Tenant Name | Slug | User Role | Email | Password | Help Center URL |
|---|---|---|---|---|---|
| **Acme Corp** | `acme` | **OWNER** | `owner@acme.com` | `Password123!` | [http://localhost:5173/help/acme](http://localhost:5173/help/acme) |
| **Acme Corp** | `acme` | **ADMIN** | `admin@acme.com` | `Password123!` | [http://localhost:5173/help/acme](http://localhost:5173/help/acme) |
| **Acme Corp** | `acme` | **EDITOR** | `editor@acme.com` | `Password123!` | [http://localhost:5173/help/acme](http://localhost:5173/help/acme) |
| **Globex Corp** | `globex` | **OWNER** | `owner@globex.com` | `Password123!` | [http://localhost:5173/help/globex](http://localhost:5173/help/globex) |

---

## 10. Production Deployment & Readiness

Complete step-by-step production guides, backup strategies, and rollback notes are available in:
👉 [**docs/DEPLOYMENT.md**](docs/DEPLOYMENT.md)

Production artifacts included:
- **`server/Dockerfile`**: Multi-stage production container for API.
- **`client/Dockerfile` & `client/nginx.conf`**: Multi-stage Nginx container with gzip and SPA routing.
- **`docker-compose.prod.yml`**: Full multi-container production stack.
- **`render.yaml`**: Infrastructure blueprint for Render.com.
- **Health Checks**: `GET /health` and `GET /api/v1/health` with automated DB & Redis probes.

---

## 11. Demonstration Flow

A detailed, step-by-step 5–8 minute demonstration script covering multi-tenancy, article lifecycle, public search, feedback, and analytics is documented in:
👉 [**docs/DEMO_SCRIPT.md**](docs/DEMO_SCRIPT.md)

---

## 12. Known MVP Limitations & Roadmap

As defined in `docs/PLAN.md` (MVP scope):
1. **Custom Domains:** Public portals resolve via tenant slug (`/help/:slug`). Custom CNAME resolution is reserved for Post-MVP.
2. **Billing & Subscriptions:** Stripe subscription tiers and billing webhooks are omitted from MVP.
3. **Multilingual Localization:** Content is stored and indexed in English; multi-language article variants are slated for v2.
4. **File Storage:** Images and assets in articles rely on external URLs (CDN/S3/Cloudinary); direct binary upload endpoints are not implemented in MVP.
