# KnowledgeHub: Production Deployment Guide

**Version:** 1.0.0 (Week 4 MVP)  
**Target Environments:** Cloud PaaS (Render, Railway, Fly.io), Vercel / Netlify (Static Frontend), Self-Hosted Docker Compose  

---

## 1. Overview & Architecture

KnowledgeHub is packaged as a modular monolith consisting of:
- **Frontend Client:** React 18 + Vite static application. Can be hosted on Vercel, Netlify, Cloudflare Pages, Render Static Sites, or served via Nginx.
- **Backend API:** Node.js Express CommonJS REST API. Exposes JSON endpoints, Swagger UI at `/api/v1/docs`, and health status at `/health`.
- **Primary Database:** PostgreSQL 16 (Relational models, UUID primary keys, Full-Text Search).
- **In-Memory Cache:** Redis 7 (Sub-10ms public caching with automated content invalidation).

---

## 2. Production Environment Variables Checklist

Configure these environment variables in your deployment platform's secret manager. **Never commit actual production secrets to Git.**

| Variable | Required | Description | Production Example |
|---|---|---|---|
| `NODE_ENV` | **Yes** | Execution mode | `production` |
| `PORT` | **Yes** | Server listening port | `5000` |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `postgresql://user:pass@db-host:5432/knowledgehub?sslmode=require` |
| `REDIS_URL` | **Yes** | Redis connection URI | `redis://default:pass@redis-host:6379` |
| `ACCESS_TOKEN_SECRET` | **Yes** | 256-bit secret for signing access JWTs | Generated via `openssl rand -hex 32` |
| `REFRESH_TOKEN_SECRET` | **Yes** | 256-bit secret for signing refresh JWTs | Generated via `openssl rand -hex 32` |
| `CLIENT_ORIGIN` | **Yes** | Allowed CORS origins (comma-separated if multiple) | `https://knowledgehub.company.com` |
| `COOKIE_SAMESITE` | Optional | Refresh token cookie SameSite policy | `lax` (same-domain/proxy) or `none` (cross-domain) |

### Generating Cryptographic Secrets
Run in your local terminal:
```bash
openssl rand -hex 32
```

---

## 3. Step-by-Step Deployment Options

### Option A: Render Infrastructure Blueprint (`render.yaml`)

KnowledgeHub includes a turnkey Render infrastructure blueprint at [`render.yaml`](file:///c:/Users/rg688/Downloads/knowledgehub/knowledgehubFolder/render.yaml).

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Blueprint**.
3. Connect your GitHub/GitLab repository.
4. Render will parse `render.yaml` and provision:
   - **PostgreSQL 16** managed database (`knowledgehub-postgres`).
   - **Redis 7** managed cache instance (`knowledgehub-redis`).
   - **Node.js Web Service** (`knowledgehub-api`) running `npx prisma migrate deploy && node src/server.js`.
   - **Static Site** (`knowledgehub-client`) running `npm run build`.
5. Enter the `CLIENT_ORIGIN` environment variable pointing to the URL assigned to your client static site.
6. Click **Apply**.

---

### Option B: Decoupled Deploy (Vercel / Netlify Frontend + Render / Railway Backend)

#### 1. Backend & Databases (Render / Railway)
1. Provision a PostgreSQL 16 database and a Redis 7 instance.
2. Deploy the `server` directory as a Node.js web service.
3. Configure environment variables (`DATABASE_URL`, `REDIS_URL`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `CLIENT_ORIGIN`).
4. Set Build Command:
   ```bash
   npm ci && npx prisma generate
   ```
5. Set Start Command:
   ```bash
   npx prisma migrate deploy && node src/server.js
   ```

#### 2. Frontend (Vercel / Netlify)
1. Connect your repository to Vercel or Netlify.
2. Set Root Directory to `client`.
3. Set Build Command: `npm run build`.
4. Set Output Directory: `dist`.
5. Configure SPA redirect / rewrite:
   - For Vercel: Create `client/vercel.json`:
     ```json
     {
       "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
     }
     ```
   - For Netlify: Create `client/_redirects`:
     ```text
     /*    /index.html   200
     ```
6. Set the `VITE_API_URL` (or proxy) to your deployed backend API URL.

---

### Option C: Production Docker Compose (Self-Hosted Linux VM / VPS)

KnowledgeHub includes production Docker configurations:
- [`server/Dockerfile`](file:///c:/Users/rg688/Downloads/knowledgehub/knowledgehubFolder/server/Dockerfile)
- [`client/Dockerfile`](file:///c:/Users/rg688/Downloads/knowledgehub/knowledgehubFolder/client/Dockerfile)
- [`client/nginx.conf`](file:///c:/Users/rg688/Downloads/knowledgehub/knowledgehubFolder/client/nginx.conf)
- [`docker-compose.prod.yml`](file:///c:/Users/rg688/Downloads/knowledgehub/knowledgehubFolder/docker-compose.prod.yml)

1. Clone repository onto your host VM:
   ```bash
   git clone <repo-url> /opt/knowledgehub
   cd /opt/knowledgehub
   ```
2. Create production `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   # Edit .env and supply strong secrets and production domain
   nano .env
   ```
3. Build and launch the container stack:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
4. Run migrations inside the server container:
   ```bash
   docker compose -f docker-compose.prod.yml exec server npx prisma migrate deploy
   ```
5. Optionally seed demo data:
   ```bash
   docker compose -f docker-compose.prod.yml exec server node prisma/seed.js
   ```

---

## 4. Running Migrations in Production

Always execute migrations before or during the start of the new container version:

```bash
# Direct CLI execution
npx prisma migrate deploy --schema=server/prisma/schema.prisma

# Root package script
npm run migrate:deploy
```

`prisma migrate deploy` applies all pending migration SQL files in chronological sequence and updates the `_prisma_migrations` tracking table without resetting database data.

---

## 5. Seeding Demo & Initial Data

To populate initial workspace accounts, demo categories, published articles, view events, and sample feedback:

```bash
# Server folder
cd server
npm run seed

# Or from root
npm run seed
```

### Pre-Seeded Demonstration Accounts

| Tenant Name | Tenant Slug | Role | Email | Password |
|---|---|---|---|---|
| Acme Corp | `acme` | **OWNER** | `owner@acme.com` | `Password123!` |
| Acme Corp | `acme` | **ADMIN** | `admin@acme.com` | `Password123!` |
| Acme Corp | `acme` | **EDITOR** | `editor@acme.com` | `Password123!` |
| Globex Corp | `globex` | **OWNER** | `owner@globex.com` | `Password123!` |

*Public Help Center URLs:*
- Acme Corp: `http://<your-domain>/help/acme`
- Globex Corp: `http://<your-domain>/help/globex`

---

## 6. Health Checks & Observability

KnowledgeHub exposes two monitoring endpoints:
- `GET /health`
- `GET /api/v1/health`

### Expected HTTP 200 OK Response:
```json
{
  "status": "ok",
  "timestamp": "2026-11-15T15:00:00.000Z",
  "uptime": 1420,
  "services": {
    "database": "up",
    "redis": "up"
  },
  "version": "1.0.0",
  "memory": {
    "usedRssMb": 68,
    "heapUsedMb": 34
  }
}
```

If the PostgreSQL database is unreachable, `/health` returns **HTTP 503 Service Unavailable** with `"services": { "database": "down" }`, alerting cloud load balancers to halt traffic routing to the unhealthy instance.

---

## 7. Database Backup & Disaster Recovery Strategy

### 7.1 Automated Logical Backups (`pg_dump`)
Set up a daily cron task to export encrypted database dumps:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/knowledgehub"
mkdir -p $BACKUP_DIR

pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="$BACKUP_DIR/db_backup_$DATE.dump"

# Retain backups for 30 days
find $BACKUP_DIR -type f -name "*.dump" -mtime +30 -exec rm {} \;
```

### 7.2 Cloud Managed Backups
If using AWS RDS, Render PostgreSQL, or Railway Postgres:
- Enable **Automated Daily Snapshots** with a 7–14 day retention window.
- Enable **Point-in-Time Recovery (PITR)** to restore the database to any millisecond within the retention period.

### 7.3 Restoring from Backup
```bash
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname="$DATABASE_URL" \
  /var/backups/knowledgehub/db_backup_20261115.dump
```

---

## 8. Rollback Procedures

### 8.1 Application Code Rollback
If a newly deployed build introduces a regression:
1. **Render / Railway / Vercel:** Navigate to the **Deploys** history tab and click **Rollback to this Deploy** on the last known healthy deployment.
2. **Docker Compose:** Re-tag or redeploy the prior image digest:
   ```bash
   git checkout <last-healthy-commit-hash>
   docker compose -f docker-compose.prod.yml up -d --build
   ```

### 8.2 Database Migration Rollback Strategy
1. **Additive Migrations:** KnowledgeHub migrations follow backward-compatible design patterns (e.g. nullable new columns, non-destructive tables). A previous application version can safely run against the newly migrated schema in almost all scenarios.
2. **Schema Rollback:** If a migration must be reverted:
   - Identify the migration to revert in `server/prisma/migrations/`.
   - Restore database from the pre-deployment snapshot taken prior to the deployment.
   - Alternatively, write a downward migration SQL script to drop newly created columns/tables and apply via `npx prisma db execute`.
