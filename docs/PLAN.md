# KnowledgeHub: 4-Week Full-Stack Development Plan

**KNOWLEDGEHUB**

Multi-Tenant Customer Support Knowledge Base SaaS

**4-Week Development Documentation & Implementation Roadmap**

A practical full-stack blueprint covering requirements, architecture, technology stack,
database design, APIs, implementation tasks, testing and deployment.

**PROJECT TYPE: Full-Stack SaaS  |  DURATION: 4 WEEKS  |  DELIVERY: MVP**

# 1. Project Overview

KnowledgeHub is a multi-tenant SaaS platform that allows multiple companies to create and manage their own public customer Help Centers from one application. Each company (tenant) can manage its branding, categories, articles, team members and feedback analytics. Customers visit a company's public Help Center, search for answers, read articles and submit feedback.

## 1.1 Problem Statement

Businesses repeatedly receive support questions about orders, payments, accounts, subscriptions and product usage. KnowledgeHub provides a self-service knowledge base so customers can find reliable answers without contacting support for every common issue. It also gives each company tools to maintain content and understand which information customers need.

## 1.2 Project Goals

Allow a company to sign up and create its own Help Center.

Keep each company's private management data isolated from every other company.

Allow company owners/admins/editors to create, organize, draft, publish and archive articles.

Provide public, tenant-specific pages for browsing categories and reading published articles.

Provide keyword search and helpful/not-helpful feedback.

Provide basic analytics for article views, searches and feedback.

Deliver a secure, tested, documented and deployed MVP.

## 1.3 Users and Roles

| **Role** | **What the role can do** |
| --- | --- |
| Platform Super Admin | Manage tenants, view platform-level status, suspend/reactivate tenant accounts. Keep this role separate from tenant roles. |
| Tenant Owner | Own the company workspace, manage settings, invite/manage members and perform all content operations. |
| Tenant Admin | Manage articles, categories, members and tenant analytics according to permissions. |
| Editor | Create and edit articles; publish only if granted the publish permission. |
| Public Customer | Browse public content, search articles and submit feedback. No admin login required. |

## 1.4 Scope and Delivery Priorities

| **Priority** | **Features** |
| --- | --- |
| Must-have MVP | Tenant signup/login; tenant isolation; roles; categories; article CRUD and draft/published states; public Help Center; search; feedback; basic analytics; tests; deployment. |
| Should-have if time permits | Article revision history; Redis caching; background email invitation; audit log; custom branding settings. |
| Stretch / post-MVP | Custom domains; subscription billing; AI answer generation; semantic/vector search; multilingual content; advanced usage-based billing. |

Important: The four-week target is a realistic MVP, not a complete commercial competitor to established support platforms. Finish and validate the must-have scope before attempting stretch features.

# 2. Recommended Technology Stack

| **Layer** | **Technology** | **Why it is used** |
| --- | --- | --- |
| Frontend | React.js + Vite | Build the customer-facing Help Center and authenticated company dashboard. |
| Styling | Tailwind CSS | Responsive layouts and reusable design utilities. |
| Routing | React Router | Navigate between public, tenant dashboard and platform admin pages. |
| Server state | TanStack Query (recommended) | Fetch, cache and refresh API data consistently. |
| Backend runtime | Node.js (LTS) | Run JavaScript server-side. |
| Backend framework | Express.js | Build REST APIs and middleware. |
| Database | PostgreSQL | Store tenants, users, memberships, articles, categories and analytics. |
| ORM / migrations | Prisma | Define relational models, generate queries and manage schema migrations. |
| Authentication | JWT access token + refresh-token strategy | Authenticate users and maintain sessions. Store refresh tokens securely. |
| Password security | bcrypt or Argon2 | Hash passwords; never store plain-text passwords. |
| Validation | Zod or express-validator | Validate request bodies, params and query strings. |
| Search | PostgreSQL Full-Text Search | Search article titles and body content without adding a separate search server. |
| Caching | Redis (Phase 2 within Week 3) | Cache public article/category reads and reduce repeated database work. |
| Testing | Jest + Supertest; React Testing Library | Test API behavior and important frontend components. |
| API documentation | Swagger / OpenAPI | Publish and inspect API contracts. |
| File storage | Cloudinary or S3-compatible storage (optional) | Store article images and uploaded assets; do not store large files in PostgreSQL. |
| Containerization | Docker + Docker Compose | Run the API, database and Redis consistently in development. |
| CI | GitHub Actions | Run linting and tests on pushes/pull requests. |
| Deployment | Render / AWS / equivalent | Host frontend and API; use managed PostgreSQL and Redis where available. |
| Performance audit | Lighthouse | Review performance, accessibility, SEO and best practices. |

Stack decision: Use React + Vite with a separate Express API for this project because it makes the frontend/backend boundary and REST API work explicit. Next.js is a valid alternative, but do not combine multiple frontend frameworks in the MVP.

# 3. High-Level Architecture

```text
Customer Browser / Company Dashboard / Platform Admin
                 |
          React + Vite UI
                 | HTTPS / JSON REST API
          Node.js + Express
       [Auth] [Tenant Resolver] [RBAC]
       [Article] [Search] [Feedback] [Analytics]
                 |
       Prisma ORM / PostgreSQL
                 |
       Redis cache (Week 3)
```

## 3.1 Request Flow

A user signs in. The server validates credentials and issues a short-lived access token plus a secure refresh-token mechanism.

For private dashboard routes, authentication middleware identifies the user.

Tenant context is resolved from the user's active membership, not from an arbitrary tenant ID supplied by the browser.

Authorization middleware checks that the user has the required role/permission in that tenant.

The controller calls a service layer; tenant-scoped database queries apply the verified tenant ID.

For public Help Center routes, resolve the tenant by its unique slug or verified custom domain, then return only published content for that tenant.

## 3.2 Multi-Tenant Isolation Rules

Every tenant-owned record must include tenant_id (or be linked through a parent record that is tenant-scoped and validated).

Never trust tenant_id sent in a request body or query string for private operations.

Derive tenant context from the authenticated user's membership for dashboard operations.

For public pages, resolve tenant by a unique public slug/domain and constrain every query to that tenant.

Use composite unique constraints where appropriate, for example (tenant_id, slug) for article slugs.

Add negative tests proving Tenant A cannot read, update or delete Tenant B's records.

Consider PostgreSQL Row-Level Security as a hardening enhancement; it is not a substitute for correct application authorization.

# 4. Database Design

Use UUID primary keys where practical. Store timestamps in UTC. Add created_at and updated_at to mutable records. The schema below is a logical design; finalize exact Prisma types and relations during Week 1.

| **Entity / table** | **Key fields** | **Notes** |
| --- | --- | --- |
| tenants | id, name, slug, logo_url, primary_color, status, created_at | One record per company. slug must be globally unique for subdomain-style URLs. |
| users | id, name, email, password_hash, status, created_at | Email should be normalized and unique. |
| memberships | id, tenant_id, user_id, role, status | Connects users to tenants. Unique constraint on (tenant_id, user_id). |
| categories | id, tenant_id, name, slug, description, sort_order | Tenant-owned. Unique (tenant_id, slug). |
| articles | id, tenant_id, category_id, author_id, title, slug, excerpt, content, status, published_at | Tenant-owned. status: DRAFT, PUBLISHED, ARCHIVED. Unique (tenant_id, slug). |
| article_revisions | id, tenant_id, article_id, version_number, content_snapshot, edited_by | Optional MVP extension; useful for history and rollback. |
| feedback | id, tenant_id, article_id, helpful, comment, created_at | Allow anonymous feedback with abuse/rate controls; avoid collecting unnecessary personal data. |
| article_views | id, tenant_id, article_id, viewed_at, session_hash (optional) | Record aggregate usage without storing raw personal identifiers unnecessarily. |
| search_logs | id, tenant_id, query_text, results_count, created_at | Restrict retention and avoid storing sensitive search text. |
| audit_logs | id, tenant_id, actor_user_id, action, resource_type, resource_id, created_at | Optional; track sensitive admin changes. |

## 4.1 Important Relationships

Tenant 1-to-many Memberships, Categories and Articles.

User 1-to-many Memberships; a user may belong to more than one tenant.

Category 1-to-many Articles; an article belongs to one tenant and optionally one category.

Article 1-to-many Feedback, Views and Revisions.

Tenant ownership should be validated on every relation. Do not rely only on a client-provided article_id or category_id.

## 4.2 Indexes and Constraints

Unique users.email; unique tenants.slug.

Unique memberships(tenant_id, user_id).

Unique categories(tenant_id, slug) and articles(tenant_id, slug).

Indexes on articles(tenant_id, status, published_at), articles(tenant_id, category_id), feedback(tenant_id, article_id), article_views(tenant_id, article_id, viewed_at).

Use a PostgreSQL full-text search vector/index for published article title and content, scoped by tenant_id.

# 5. Functional Requirements and Acceptance Criteria

| **Feature** | **Expected behavior / acceptance criteria** |
| --- | --- |
| Tenant onboarding | A company owner can register with company name, email and password. A tenant and owner membership are created atomically. Duplicate email/slug is handled clearly. |
| Authentication | Login works with valid credentials; invalid credentials return a generic error. Protected routes reject missing/expired tokens. Logout/revocation invalidates refresh session. |
| Tenant members and RBAC | Owner/Admin/Editor permissions are enforced on the server. A user cannot access another tenant's dashboard data. |
| Categories | Authorized users can create, rename, reorder and archive categories. Duplicate category slug within one tenant is rejected. |
| Articles | Authorized users can create and edit drafts, publish and archive articles. Only published articles appear publicly. |
| Public Help Center | A visitor can open /help/:tenantSlug, browse categories and open published article pages. |
| Search | Search returns relevant published articles for the selected tenant only. Empty query and invalid parameters are handled. |
| Feedback | A visitor can mark an article helpful/not helpful. Duplicate/spam submissions are rate-limited or otherwise controlled. |
| Analytics | Tenant dashboard shows article views, helpful vs not-helpful feedback, top articles and popular searches for a selected date range. |
| Quality and delivery | README, .env.example, migrations, API docs, tests and deployment instructions are included. |

# 6. Four-Week Implementation Plan

Work in small, reviewable tasks. Each week ends with a demonstrable milestone and a checklist. Suggested daily breakdown assumes approximately 5–7 focused development hours per day; adjust to your available time.

# WEEK 1 — Planning, Setup, Database and Authentication

Goal: Establish a working project foundation, design the data model and implement tenant signup/login with secure tenant membership.

| **Day** | **Tasks** | **Deliverable** |
| --- | --- | --- |
| Day 1 | Confirm MVP scope; write user stories and acceptance criteria; sketch customer, tenant dashboard and platform admin screens; create GitHub repository and issue board. | Scope document, wireframes, repository. |
| Day 2 | Create frontend and backend projects; configure environment variables, ESLint/Prettier, folder structure, Docker Compose for PostgreSQL; connect Prisma. | App starts locally; database connection works. |
| Day 3 | Design Prisma models for tenants, users and memberships; add migrations, seed script and essential constraints/indexes. | Initial database schema and migration. |
| Day 4 | Implement signup, login, password hashing, access token and refresh-token flow; validate inputs and return consistent errors. | Authentication APIs. |
| Day 5 | Implement auth middleware, tenant membership lookup, active tenant selection and initial role middleware. Build basic login/register UI. | User can register/login and enter own workspace. |
| Day 6 | Write auth and tenant onboarding tests; test duplicate email, invalid credentials, inactive tenant and unauthorized access. | Automated tests and bug fixes. |
| Day 7 | Review architecture, update README and API notes, demo onboarding flow and record known issues. | Week 1 milestone demo. |

## Week 1 detailed checklist

Repository includes /client and /server (or clearly separated packages).

PostgreSQL runs locally and Prisma migrations are committed.

Passwords are hashed; secrets are not committed.

Tenant creation and owner membership happen in one database transaction.

Protected API routes require authentication.

Tenant context comes from a verified membership.

Tests cover signup, login and basic tenant isolation.

## Week 1 suggested API endpoints

| **Method** | **Endpoint** | **Purpose** |
| --- | --- | --- |
| POST | /api/v1/auth/register | Create user, tenant and owner membership. |
| POST | /api/v1/auth/login | Authenticate user. |
| POST | /api/v1/auth/refresh | Issue a new access token using a valid refresh session. |
| POST | /api/v1/auth/logout | Revoke refresh session. |
| GET | /api/v1/auth/me | Return current user and memberships. |
| GET | /api/v1/tenant/current | Return current tenant/workspace details. |

# WEEK 2 — Tenant Dashboard, Categories, Articles and Public Help Center

Goal: Make the product useful end-to-end: company members manage content, and customers can view published content through a tenant-specific public Help Center.

| **Day** | **Tasks** | **Deliverable** |
| --- | --- | --- |
| Day 8 | Build authenticated dashboard shell, sidebar, tenant switcher (if a user belongs to multiple tenants), profile and settings pages. | Tenant dashboard UI. |
| Day 9 | Implement category create/list/update/archive APIs and UI; enforce tenant scoping and permissions. | Category management. |
| Day 10 | Implement article create/list/detail/update/delete APIs; add draft/published/archived states and slug generation. | Article CRUD APIs. |
| Day 11 | Build article editor form, article list, filters, status badges and preview; add server-side validation and safe content rendering. | Article management UI. |
| Day 12 | Build public Help Center landing page, category pages and article detail pages using tenant slug. | Public customer portal. |
| Day 13 | Add pagination, sorting, empty/loading/error states, responsive design and accessibility checks. | Polished browsing experience. |
| Day 14 | Test cross-tenant access, published-only public visibility, category ownership and article lifecycle; demo full workflow. | Week 2 milestone demo. |

## Week 2 detailed checklist

Tenant Admin/Editor can manage only their tenant's categories and articles.

Article status transitions are validated by the backend.

Draft and archived articles are not visible to public visitors.

Public Help Center resolves tenant using a unique slug.

Article and category relationships are checked against the same tenant.

List endpoints support pagination and predictable sorting.

UI works on desktop and mobile and displays useful error/empty states.

## Week 2 suggested API endpoints

| **Method** | **Endpoint** | **Purpose** |
| --- | --- | --- |
| GET/POST | /api/v1/categories | List/create tenant categories. |
| PATCH/DELETE | /api/v1/categories/:categoryId | Update/archive category (prefer archive if articles depend on it). |
| GET/POST | /api/v1/articles | List/create tenant articles. |
| GET/PATCH/DELETE | /api/v1/articles/:articleId | Read/update/archive or delete an article. |
| POST | /api/v1/articles/:articleId/publish | Publish an eligible draft. |
| GET | /api/v1/public/:tenantSlug | Get public Help Center configuration. |
| GET | /api/v1/public/:tenantSlug/categories | List public categories. |
| GET | /api/v1/public/:tenantSlug/articles | List published articles. |
| GET | /api/v1/public/:tenantSlug/articles/:articleSlug | Get one published article. |

# WEEK 3 — Search, Feedback, Analytics, RBAC Hardening and Redis

Goal: Add the features that make the Help Center useful to customers and measurable for businesses, while strengthening security and reliability.

| **Day** | **Tasks** | **Deliverable** |
| --- | --- | --- |
| Day 15 | Implement PostgreSQL Full-Text Search for published article title/body; tenant-scope results; add search UI and filters. | Working search. |
| Day 16 | Implement article helpful/not-helpful feedback endpoint and UI; add input validation, abuse prevention and rate limiting. | Feedback capture. |
| Day 17 | Record article views and search activity; design aggregate queries for top articles, feedback ratio and popular searches. | Analytics data collection. |
| Day 18 | Build tenant analytics dashboard with date filters, summary cards and charts; ensure all analytics are tenant-scoped. | Analytics dashboard. |
| Day 19 | Add Redis caching for public tenant config, category lists and published article reads; define TTL and invalidation on content updates. | Cache integration. |
| Day 20 | Complete RBAC checks for Owner/Admin/Editor; add audit events for publish/archive/member changes if time allows. | Authorization hardening. |
| Day 21 | Write integration tests for search, feedback, analytics, cache invalidation and cross-tenant attack cases; demo end-to-end flow. | Week 3 milestone demo. |

## Week 3 detailed checklist

Search returns only published articles belonging to the requested tenant.

Search query is validated, bounded in length and safely parameterized through Prisma/raw-query safeguards.

Feedback is associated with the correct tenant and article.

Rate limiting protects login, search and feedback endpoints.

Analytics queries are scoped by tenant and date range.

Cache keys include tenant identity; content updates invalidate or refresh relevant keys.

Automated tests prove cross-tenant isolation for articles, categories and analytics.

## Week 3 suggested API endpoints

| **Method** | **Endpoint** | **Purpose** |
| --- | --- | --- |
| GET | /api/v1/public/:tenantSlug/search?q=... | Search published articles within a tenant. |
| POST | /api/v1/public/:tenantSlug/articles/:articleSlug/feedback | Submit helpful/not-helpful feedback. |
| POST | /api/v1/public/:tenantSlug/articles/:articleSlug/view | Record a view event (consider bot filtering). |
| GET | /api/v1/analytics/overview | Tenant-level summary metrics. |
| GET | /api/v1/analytics/articles | Top articles and article performance. |
| GET | /api/v1/analytics/searches | Popular searches and searches with no results. |

# WEEK 4 — Quality, Security, Deployment and Final Handoff

Goal: Stabilize the MVP, document how to run it, deploy it and prepare a professional demonstration.

| **Day** | **Tasks** | **Deliverable** |
| --- | --- | --- |
| Day 22 | Review API contracts; complete Swagger/OpenAPI docs; standardize status codes, error format and pagination. | API documentation. |
| Day 23 | Run full backend and frontend tests; fix high-priority bugs; test validation, permissions, token expiry and tenant isolation. | Test report. |
| Day 24 | Security review: CORS, Helmet, rate limits, secure cookies/token storage strategy, secrets, SQL/query safety, XSS-safe article rendering. | Security checklist and fixes. |
| Day 25 | Run Lighthouse; optimize images, bundles, queries and indexes; verify Redis invalidation and loading performance. | Performance report. |
| Day 26 | Create production environment, managed PostgreSQL, migrations and environment variables; deploy API and frontend. | Deployed application. |
| Day 27 | Run smoke tests on deployed environment; verify logs, health endpoint, database backup approach and rollback notes. | Production validation. |
| Day 28 | Finalize README, architecture diagram, ER diagram, API docs, test evidence, demo script and known limitations; record final demo. | Final project handoff. |

## Week 4 detailed checklist

Production secrets are configured through environment variables, not committed to Git.

Database migrations run successfully in deployment.

CORS allows only the intended frontend origins.

HTTP security headers and rate limits are configured.

Public article content is rendered safely; user-submitted content is validated/sanitized.

Lighthouse audit and test results are recorded.

README explains local setup, environment variables, migrations, seed data and deployment.

Demo account credentials are safe, temporary and documented separately from source code.

# 7. Suggested Project Folder Structure

```text
knowledgehub/
  client/
    src/
      app/                 # routes and app providers
      components/          # reusable UI components
      features/
        auth/
        tenant/
        articles/
        categories/
        search/
        analytics/
      layouts/
      lib/                 # API client, helpers
      hooks/
      styles/
  server/
    prisma/
      schema.prisma
      migrations/
      seed.js
    src/
      config/
      middleware/          # auth, tenant, RBAC, validation, errors
      modules/
        auth/
        tenants/
        memberships/
        categories/
        articles/
        search/
        feedback/
        analytics/
      routes/
      utils/
      app.js
      server.js
    tests/
  docs/
    architecture.md
    er-diagram.md
    api.md
  docker-compose.yml
  .env.example
  README.md
```

Keep business logic in service modules, HTTP concerns in controllers/routes, and shared security checks in middleware. Avoid putting all logic in one large server.js file.

# 8. Security and Reliability Requirements

Authentication: hash passwords with bcrypt/Argon2; use short-lived access tokens and revocable refresh sessions.

Token storage: prefer HttpOnly, Secure, SameSite cookies for browser refresh tokens; protect cookie-based state-changing requests against CSRF. If using Authorization headers, document the chosen storage and XSS trade-offs.

Authorization: enforce permissions on the server for every protected operation; hiding a button in the UI is not security.

Tenant isolation: scope every tenant-owned read/write; validate parent-child relationships; test IDOR/cross-tenant access.

Validation: validate all inputs; constrain pagination, search length and content size.

Content safety: sanitize rich text/HTML before rendering; prevent stored XSS.

Abuse protection: rate-limit login, search and feedback; consider bot protection for public endpoints.

Secrets: use environment variables/secret manager; commit only .env.example.

Transport: use HTTPS in production; configure CORS and security headers.

Data handling: collect minimal personal data; define retention for logs and analytics.

# 9. Testing Strategy

| **Test level** | **What to test** | **Suggested tool** |
| --- | --- | --- |
| Unit tests | Slug generation, validation, permission helpers, article status rules, analytics calculations. | Jest |
| API integration tests | Signup/login, CRUD, search, feedback, analytics and error cases. | Jest + Supertest |
| Tenant isolation tests | Tenant A cannot fetch/update/delete Tenant B's records, even by guessing IDs. | Jest + Supertest |
| Frontend component tests | Forms, article cards, search states, feedback controls and protected routes. | React Testing Library |
| Manual smoke tests | Complete owner/editor/customer journeys on desktop and mobile. | Browser checklist |
| Performance/accessibility | Core pages, images, accessibility and best-practice checks. | Lighthouse |

## 9.1 Minimum Test Scenarios

Register two different tenants and verify each receives a distinct tenant ID and owner membership.

Create an article in Tenant A and confirm Tenant B cannot retrieve it through private APIs.

Try updating Tenant A's article using a Tenant B account; expect 403 or a non-disclosing 404.

Confirm public users can read published articles but cannot read drafts or archived articles.

Search a phrase that exists in both tenants and verify results are tenant-specific.

Submit feedback for a valid article and reject an invalid/nonexistent article reference.

Verify analytics for one tenant never include another tenant's events.

Verify cache invalidation after an article is edited, published or archived.

Verify expired/revoked sessions cannot access protected routes.

Verify malformed input, oversized content and excessive requests are rejected safely.

# 10. Environment Variables and Local Setup

```bash
# server/.env.example
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/knowledgehub
ACCESS_TOKEN_SECRET=replace_with_long_random_secret
REFRESH_TOKEN_SECRET=replace_with_long_random_secret
CLIENT_ORIGIN=http://localhost:5173
REDIS_URL=redis://localhost:6379
```

Never use the example secrets in a real environment. Generate unique strong secrets for local and production environments.

## 10.1 Local Development Sequence

Install a current Node.js LTS release, Git, Docker Desktop and a code editor.

Clone the repository and install client/server dependencies.

Copy .env.example to a local .env and configure PostgreSQL/Redis connection strings.

Start PostgreSQL and Redis using Docker Compose.

Run Prisma migration and seed commands.

Start the Express API and React development server.

Run automated tests and open Swagger documentation.

# 11. Deployment and Final Deliverables

| **Deliverable** | **Expected content** |
| --- | --- |
| Source repository | Readable client/server code, meaningful commits, no secrets. |
| Working deployment | Public customer Help Center and secured tenant dashboard. |
| README | Project overview, features, architecture, setup, environment variables, migrations, scripts and demo flow. |
| ER diagram | Tables, keys and relationships. |
| Architecture diagram | Frontend, API, middleware, services, database and cache. |
| OpenAPI/Swagger | Documented endpoints, request/response examples and auth requirements. |
| Test evidence | Test summary, tenant isolation test cases and known gaps. |
| Performance evidence | Lighthouse report and any optimizations performed. |
| Demo presentation | 5–8 minute walkthrough showing two tenants and a customer journey. |

# 12. Definition of Done

A company can register, log in and manage its own Help Center.

Two or more tenants can coexist without cross-tenant data leakage.

Tenant members can create categories and manage article lifecycle according to their roles.

Public customers can browse and search published content for the correct company.

Customers can submit article feedback.

Company admins can view basic tenant-specific analytics.

Critical authentication, authorization and tenant-isolation tests pass.

The application is deployed and reproducible from the README.

API documentation, database diagram and final demo are ready.

# 13. Scope Control: What Not to Build in the First Four Weeks

Do not implement a complete billing/subscription engine in the MVP.

Do not start with Elasticsearch, vector databases or microservices; PostgreSQL search and a modular monolith are sufficient.

Do not add AI-generated answers until article retrieval, access control and source attribution are reliable.

Do not build custom domains before tenant slug routing works correctly.

Do not spend the first week polishing animations; prioritize database design, tenant isolation and core workflows.

# 14. Final Demo Script

Register Company A and Company B as separate tenants.

Log in as Company A's owner and create a category plus two articles.

Publish one article and leave another as a draft.

Open Company A's public Help Center in a private browser window and verify only the published article is visible.

Search for the article and submit helpful/not-helpful feedback.

Open Company A's analytics dashboard and show the recorded activity.

Log in as Company B and prove that Company A's private article management data is inaccessible.

Show Swagger docs, automated test results and the deployed application.

# 15. Suggested Learning / Reference Documentation

**React documentation: **https://react.dev/learn

**Node.js documentation: **https://nodejs.org/docs/latest/api/

**Express documentation: **https://expressjs.com/

**PostgreSQL documentation: **https://www.postgresql.org/docs/

**Prisma documentation: **https://www.prisma.io/docs

**Redis documentation: **https://redis.io/docs/latest/

**Docker documentation: **https://docs.docker.com/

**Jest documentation: **https://jestjs.io/docs/getting-started

**Supertest: **https://github.com/ladjs/supertest

**OpenAPI specification: **https://spec.openapis.org/oas/latest.html

**OWASP Top 10: **https://owasp.org/www-project-top-ten/
