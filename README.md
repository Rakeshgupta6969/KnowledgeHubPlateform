# KnowledgeHub

> Multi-Tenant Customer Support Knowledge Base SaaS platform built with React, Vite, Tailwind CSS, Node.js (Express CommonJS), PostgreSQL, and Prisma.

## Overview

KnowledgeHub enables companies (tenants) to manage customer support help centers with complete data isolation.
This implementation delivers **Week 1 (Days 2–7)** of the architecture roadmap:
- Multi-tenant data modeling with UUID primary keys and strict relational constraints.
- Atomic workspace onboarding (Tenant + User + Owner Membership in one database transaction).
- Secure authentication: Short-lived access tokens + revocable refresh sessions stored in HttpOnly, SameSite cookies.
- Server-enforced tenant context derivation strictly from verified memberships (cross-tenant spoof protection).
- Full-stack client dashboard with automatic token refresh, login, registration, and tenant profile display.
- Comprehensive test suite covering authentication, session revocation, and negative cross-tenant isolation.

---

## Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18 + Vite | Modular feature architecture, Tailwind CSS, React Router v6, TanStack Query |
| **Backend** | Node.js + Express | CommonJS, modular monolith (`src/modules`, `src/middleware`, `src/utils`) |
| **Database** | PostgreSQL 16 Alpine | Managed via Docker Compose and Prisma ORM |
| **Authentication** | JWT + bcrypt | Short-lived access token (15m) + revocable refresh cookie (7d) |
| **Validation** | Zod | Server-side request validation with structured error responses |
| **Testing** | Jest + Supertest | Automated integration tests against isolated test database |

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
│   │   ├── schema.prisma    # Models: Tenant, User, Membership, RefreshToken
│   │   ├── migrations/      # Committed SQL migrations
│   │   └── seed.js          # Demo seed script (Acme Corp & Globex)
│   ├── src/
│   │   ├── config/          # Environment & Prisma client configuration
│   │   ├── middleware/      # auth, tenantContext, rbac, validate, errorHandler
│   │   ├── modules/         # auth (controller, service, routes, validation)
│   │   │   └── tenants/     # tenant (controller, routes)
│   │   ├── routes/          # API v1 route aggregator
│   │   ├── utils/           # errors, tokens, slugify
│   │   ├── app.js           # Express application setup
│   │   └── server.js        # Server listener
│   └── tests/
│       ├── setup.js         # Test lifecycle & database reset
│       ├── auth.test.js     # Auth & registration integration tests
│       └── tenant.test.js   # Tenant context & isolation tests
└── client/
    ├── src/
    │   ├── app/             # Application routing (AppRoutes.jsx)
    │   ├── components/      # Route guards (ProtectedRoute, PublicRoute)
    │   ├── features/
    │   │   ├── auth/        # AuthContext, LoginPage, RegisterPage
    │   │   └── tenant/      # DashboardPage
    │   ├── lib/             # api.js client with auto-refresh on 401
    │   ├── App.jsx          # Providers wrapper
    │   ├── main.jsx         # React root
    │   └── index.css        # Tailwind styling
    └── vite.config.js       # Vite dev server & proxy configuration
```

---

## Environment Variables

Copy `.env.example` to `server/.env`:

```env
# Server configuration
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

# Database configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/knowledgehub?schema=public"
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/knowledgehub_test?schema=public"

# JWT Secrets (replace with strong random strings in production)
ACCESS_TOKEN_SECRET=dev_access_token_secret_knowledgehub_2026_super_secure_key
REFRESH_TOKEN_SECRET=dev_refresh_token_secret_knowledgehub_2026_super_secure_key
```

---

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ or LTS)
- [Docker](https://www.docker.com/) & Docker Compose

### 2. Start PostgreSQL
From the repository root:
```bash
docker-compose up -d
```
Ensure both development and test databases are created:
```bash
docker exec -i knowledgehub-postgres psql -U postgres -c "CREATE DATABASE knowledgehub_test;"
```

### 3. Setup and Run the Server
```bash
cd server
npm install

# Run database migrations
npm run migrate

# Seed demo tenants and accounts
npm run seed

# Start server in development mode
npm run dev
# (or start directly: npm start)
```
The server starts at `http://localhost:5000`.

### 4. Setup and Run the Client
```bash
cd ../client
npm install

# Start Vite development server
npm run dev
```
The frontend starts at `http://localhost:5173`.

---

## Demo Accounts (from Seed)

The database seed provides two separate demo tenants with pre-configured accounts:

| Tenant | Role | Email | Password |
|---|---|---|---|
| **Acme Corp** (`acme`) | Owner | `owner@acme.com` | `Password123!` |
| **Acme Corp** (`acme`) | Admin | `admin@acme.com` | `Password123!` |
| **Globex Corporation** (`globex`) | Owner | `owner@globex.com` | `Password123!` |

---

## Running the Automated Test Suite

Run the full integration test suite against the isolated `knowledgehub_test` database:
```bash
cd server
npm test
```

To run linting:
```bash
cd server
npm run lint
```

To build the client for production:
```bash
cd client
npm run build
```

---

## Key Security & Multi-Tenancy Features

1. **Derived Tenant Context:** On protected routes (`/api/v1/tenant/*`), tenant ID is **never trusted** from request bodies, query strings, or client parameters. It is derived strictly from `req.user.memberships`.
2. **Negative Cross-Tenant Protection:** Attempting to supply a different tenant ID via `x-tenant-id` that does not match the authenticated user's active memberships triggers a `403 TENANT_ACCESS_DENIED`.
3. **Atomic Onboarding:** `POST /api/v1/auth/register` wraps `Tenant`, `User`, and `Membership` creation inside a single `prisma.$transaction`. If any step fails (e.g. duplicate slug or duplicate email), the entire transaction rolls back.
4. **Session Revocation:** Refresh tokens are signed JWTs whose SHA-256 hash is tracked in the `refresh_tokens` database table. Calling `POST /api/v1/auth/logout` sets `revokedAt = NOW()`, invalidating the session immediately.
5. **Generic Auth Errors:** Login failures due to wrong password, unknown email, or suspended user return an identical `401 Invalid email or password` response to prevent user enumeration.
