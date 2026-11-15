# KnowledgeHub API Reference (Weeks 1, 2 & 3)

Base path: `/api/v1`  
Private routes require: `Authorization: Bearer <accessToken>`  
Active tenant context on private routes is derived strictly from user's active membership (optional `x-tenant-id` header validated against user's verified active memberships).

---

## Endpoint Summary

### Auth & Tenant Workspace APIs
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | None | Atomically creates User, Tenant, and Owner Membership |
| POST | `/api/v1/auth/login` | Public | None | Authenticates credentials, issues access token & HttpOnly refresh cookie (Rate-limited: 10/15m) |
| POST | `/api/v1/auth/refresh` | Cookie | None | Issues a new short-lived access token using verified DB session |
| POST | `/api/v1/auth/logout` | Cookie | None | Revokes refresh token in database and clears the cookie |
| GET | `/api/v1/auth/me` | Bearer | None | Returns current authenticated user profile and all tenant memberships |
| GET | `/api/v1/tenant/current` | Bearer | Any Member | Returns active workspace details and user membership |
| PATCH | `/api/v1/tenant/current` | Bearer | OWNER, ADMIN | Updates workspace name, primary color, or logo URL (creates audit log) |
| GET | `/api/v1/tenant/members` | Bearer | Any Member | Lists workspace team members with roles and statuses |
| PATCH | `/api/v1/tenant/members/:memberId` | Bearer | OWNER | Updates team member role (creates audit log) |
| GET | `/api/v1/tenant/audit-logs` | Bearer | OWNER, ADMIN | Paginated workspace administrative audit logs |

### Category APIs
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/v1/categories` | Bearer | Any Member | Lists categories scoped to active workspace (supports `?status=ACTIVE\|ARCHIVED\|ALL`) |
| POST | `/api/v1/categories` | Bearer | OWNER, ADMIN | Creates new category with auto/custom slug unique per tenant |
| GET | `/api/v1/categories/:id` | Bearer | Any Member | Reads single category detail with article count |
| PATCH | `/api/v1/categories/:id` | Bearer | OWNER, ADMIN | Updates category name, slug, description, sort order, or status |
| DELETE | `/api/v1/categories/:id` | Bearer | OWNER, ADMIN | Archives category (sets status to `ARCHIVED`, creates audit log) |

### Article APIs
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/v1/articles` | Bearer | Any Member | Lists articles with pagination (`page`, `limit`), `status`, `categoryId`, and `sort` |
| POST | `/api/v1/articles` | Bearer | Any Member | Creates draft article (EDITOR cannot create PUBLISHED directly) |
| GET | `/api/v1/articles/:id` | Bearer | Any Member | Reads single article detail with category and author info |
| PATCH | `/api/v1/articles/:id` | Bearer | Any Member | Updates article content, category, or status (EDITOR cannot set PUBLISHED/ARCHIVED) |
| POST | `/api/v1/articles/:id/publish` | Bearer | OWNER, ADMIN | Publishes draft or archived article, sets `publishedAt = NOW()` (creates audit log) |
| DELETE | `/api/v1/articles/:id` | Bearer | OWNER, ADMIN | Archives article (or permanently deletes if `?permanent=true`, creates audit log) |

### Analytics APIs
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/v1/analytics/overview` | Bearer | OWNER, ADMIN | Aggregated views, feedback sentiment ratio, search counts (`?days=7\|30\|90\|365`) |
| GET | `/api/v1/analytics/articles` | Bearer | OWNER, ADMIN | Top performing articles ranked by total views with helpfulness stats |
| GET | `/api/v1/analytics/searches` | Bearer | OWNER, ADMIN | Most frequent search queries and unanswered searches (0 results) |

### Public Help Center APIs
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/v1/public/:tenantSlug` | Public | None | Returns public branding & config for active workspace (Redis cached) |
| GET | `/api/v1/public/:tenantSlug/categories` | Public | None | Lists public active categories with published article counts (Redis cached) |
| GET | `/api/v1/public/:tenantSlug/articles` | Public | None | Lists **PUBLISHED** articles only; supports `categorySlug`, `page`, `limit` |
| GET | `/api/v1/public/:tenantSlug/articles/:slug` | Public | None | Returns single published article; 404 for drafts/archived (Redis cached) |
| GET | `/api/v1/public/:tenantSlug/search` | Public | None | PostgreSQL full-text search on published title/content (Rate-limited: 30/min) |
| POST | `/api/v1/public/:tenantSlug/articles/:slug/feedback` | Public | None | Submit helpful/unhelpful rating + comment (Rate-limited: 15/15m) |
| POST | `/api/v1/public/:tenantSlug/articles/:slug/view` | Public | None | Record article page view with bot filtering and session deduplication |

---

## Standard Error Format

All error responses across all endpoints follow this consistent JSON structure:

```json
{
  "error": {
    "code": "STRING_ERROR_CODE",
    "message": "Human readable error description",
    "details": [
      {
        "field": "fieldName",
        "message": "Field specific message"
      }
    ]
  }
}
```

### Common HTTP Status Codes
- `400 Bad Request` (`VALIDATION_ERROR`, `INVALID_CATEGORY`, `INVALID_STATUS_TRANSITION`)
- `401 Unauthorized` (`INVALID_CREDENTIALS`, `TOKEN_REQUIRED`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `INVALID_REFRESH_TOKEN`)
- `403 Forbidden` (`FORBIDDEN`, `ROLE_NOT_AUTHORIZED`, `TENANT_ACCESS_DENIED`, `TENANT_INACTIVE`, `USER_SUSPENDED`)
- `404 Not Found` (`ROUTE_NOT_FOUND`, `USER_NOT_FOUND`, `CATEGORY_NOT_FOUND`, `ARTICLE_NOT_FOUND`, `TENANT_NOT_FOUND`)
- `409 Conflict` (`EMAIL_ALREADY_EXISTS`, `SLUG_ALREADY_EXISTS`, `CATEGORY_SLUG_EXISTS`, `ARTICLE_SLUG_EXISTS`)
- `429 Too Many Requests` (`TOO_MANY_REQUESTS`, `FEEDBACK_COOLDOWN`)
- `500 Internal Server Error` (`INTERNAL_ERROR`)

---

## Detailed Endpoint Contracts

### Category Management

#### `POST /api/v1/categories`
Creates a category in the active tenant.
```json
// Request Body
{
  "name": "Billing & Payments",
  "slug": "billing-payments",       // Optional: auto-slugified from name if omitted
  "description": "Guides for invoices, refunds, and subscriptions",
  "sortOrder": 1
}

// Response (201 Created)
{
  "category": {
    "id": "2ba94a0d-3ea0-47b7-bdc1-ff443ec09c31",
    "name": "Billing & Payments",
    "slug": "billing-payments",
    "description": "Guides for invoices, refunds, and subscriptions",
    "sortOrder": 1,
    "status": "ACTIVE",
    "tenantId": "893d9b15-7762-4b2a-89bc-993d39589d31",
    "createdAt": "2026-11-15T09:00:00.000Z",
    "updatedAt": "2026-11-15T09:00:00.000Z",
    "_count": { "articles": 0 }
  }
}
```

#### `GET /api/v1/categories`
Returns all categories belonging to the authenticated workspace.
```json
// Query params: ?status=ACTIVE | ARCHIVED | ALL
// Response (200 OK)
{
  "categories": [
    {
      "id": "2ba94a0d-3ea0-47b7-bdc1-ff443ec09c31",
      "name": "Billing & Payments",
      "slug": "billing-payments",
      "sortOrder": 1,
      "status": "ACTIVE",
      "_count": { "articles": 4 }
    }
  ]
}
```

---

### Article Management

#### `POST /api/v1/articles`
Creates a draft or published article.
```json
// Request Body
{
  "title": "How to update your credit card",
  "slug": "how-to-update-credit-card", // Optional: auto-generated from title
  "categoryId": "2ba94a0d-3ea0-47b7-bdc1-ff443ec09c31", // Must belong to same tenant!
  "excerpt": "A short 2-minute walkthrough on updating billing info",
  "content": "# Updating Billing Information\n\n1. Go to Settings.\n2. Click Payment Methods.",
  "status": "DRAFT" // or "PUBLISHED"
}

// Response (201 Created)
{
  "article": {
    "id": "d04a62e0-2642-4f05-b076-2f6368d40be4",
    "title": "How to update your credit card",
    "slug": "how-to-update-credit-card",
    "status": "DRAFT",
    "publishedAt": null,
    "category": {
      "id": "2ba94a0d-3ea0-47b7-bdc1-ff443ec09c31",
      "name": "Billing & Payments",
      "slug": "billing-payments"
    },
    "author": {
      "id": "713df0d3-379e-4d56-a4f6-0618ce5c7ea7",
      "name": "Jane Support",
      "email": "jane@acme.com"
    }
  }
}
```

#### `GET /api/v1/articles`
Lists tenant articles with pagination and sorting.
```text
GET /api/v1/articles?page=1&limit=10&status=PUBLISHED&sort=createdAt:desc
```
```json
// Response (200 OK)
{
  "data": [
    {
      "id": "d04a62e0-2642-4f05-b076-2f6368d40be4",
      "title": "How to update your credit card",
      "slug": "how-to-update-credit-card",
      "status": "PUBLISHED",
      "publishedAt": "2026-11-15T09:30:00.000Z",
      "category": { "id": "...", "name": "Billing & Payments", "slug": "billing-payments" },
      "author": { "name": "Jane Support" }
    }
  ],
  "meta": {
    "total": 24,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

#### `POST /api/v1/articles/:id/publish`
Publishes an article, sets `status = PUBLISHED` and records timestamp.
```json
// Response (200 OK)
{
  "message": "Article published successfully",
  "article": {
    "id": "d04a62e0-2642-4f05-b076-2f6368d40be4",
    "status": "PUBLISHED",
    "publishedAt": "2026-11-15T09:35:00.000Z"
  }
}
```

---

### Public Help Center Portal

#### `GET /api/v1/public/:tenantSlug`
Returns customer portal configuration.
```json
// Response (200 OK)
{
  "tenant": {
    "id": "893d9b15-7762-4b2a-89bc-993d39589d31",
    "name": "Acme Corp",
    "slug": "acme",
    "logoUrl": null,
    "primaryColor": "#3B82F6",
    "status": "ACTIVE"
  }
}
```

#### `GET /api/v1/public/:tenantSlug/articles`
Returns **PUBLISHED** content only for the specified tenant.
```text
GET /api/v1/public/acme/articles?categorySlug=billing-payments&page=1&limit=10
```
```json
// Response (200 OK)
{
  "tenant": { "name": "Acme Corp", "slug": "acme" },
  "category": { "name": "Billing & Payments", "slug": "billing-payments" },
  "data": [
    {
      "id": "d04a62e0-2642-4f05-b076-2f6368d40be4",
      "title": "How to update your credit card",
      "slug": "how-to-update-credit-card",
      "excerpt": "A short 2-minute walkthrough on updating billing info",
      "publishedAt": "2026-11-15T09:35:00.000Z"
    }
  ],
  "meta": {
    "total": 4,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

#### `GET /api/v1/public/:tenantSlug/articles/:articleSlug`
Returns a single published article. Drafts, archived articles, or articles belonging to other tenants return `404 ARTICLE_NOT_FOUND`.
```json
// Response (200 OK)
{
  "tenant": { "name": "Acme Corp", "slug": "acme" },
  "article": {
    "id": "d04a62e0-2642-4f05-b076-2f6368d40be4",
    "title": "How to update your credit card",
    "slug": "how-to-update-credit-card",
    "excerpt": "A short 2-minute walkthrough on updating billing info",
    "content": "# Updating Billing Information\n\n1. Go to Settings.\n2. Click Payment Methods.",
    "status": "PUBLISHED",
    "publishedAt": "2026-11-15T09:35:00.000Z",
    "category": { "name": "Billing & Payments", "slug": "billing-payments" },
    "author": { "name": "Jane Support" }
  }
}
```

---

### Week 3 Endpoints

#### `GET /api/v1/public/:tenantSlug/search`
Executes PostgreSQL full-text search across published article titles and markdown bodies.
- Strictly tenant-scoped (Tenant B articles are never returned in Tenant A search).
- Query string `q` validated (1-100 characters).
- Optional `categorySlug` filter.
- Automatically logs query and result count to `search_logs` table for tenant analytics.
- Rate-limited: 30 requests per minute per IP.

```text
GET /api/v1/public/acme/search?q=payment+methods&categorySlug=billing-subscriptions&limit=10
```
```json
// Response (200 OK)
{
  "query": "payment methods",
  "category": "billing-subscriptions",
  "data": [
    {
      "id": "8bb38093-4fc6-419b-a01c-6b3a24683d73",
      "title": "Managing your Payment Methods and Invoices",
      "slug": "managing-payment-methods-invoices",
      "excerpt": "Everything you need to know about downloading monthly invoices.",
      "publishedAt": "2026-11-10T11:00:00.000Z",
      "category": {
        "name": "Billing & Subscriptions",
        "slug": "billing-subscriptions"
      },
      "rank": 0.42
    }
  ],
  "meta": {
    "total": 1,
    "limit": 10
  }
}
```

#### `POST /api/v1/public/:tenantSlug/articles/:articleSlug/feedback`
Records reader feedback (`helpful: true|false` + optional comment) on a published article.
- Verifies article exists, is published, and belongs to tenant slug.
- Stores SHA-256 hash of client IP for privacy-preserving deduplication.
- Cooldown protection: blocks subsequent submission within 60 seconds from same IP for same article (429 status).
- Rate-limited: 15 submissions per 15 minutes per IP.

```json
// Request Body
{
  "helpful": true,
  "comment": "Very clear walkthrough, helped me set up billing in 5 minutes!"
}

// Response (201 Created)
{
  "message": "Feedback submitted successfully",
  "feedback": {
    "id": "e4f8d956-65be-45f8-80f2-b88334be5db1",
    "helpful": true,
    "createdAt": "2026-11-15T10:15:00.000Z"
  }
}
```

#### `POST /api/v1/public/:tenantSlug/articles/:articleSlug/view`
Dispatches an asynchronous article view event.
- Bot filtering: ignores automated user agents matching common bot signatures (`bot|crawl|spider|slurp|facebookexternalhit|...`).
- Daily session hashing: `sha256(ip + userAgent + YYYY-MM-DD)` to deduplicate multiple refreshes.

```json
// Response (200 OK)
{
  "recorded": true
}
```

#### `GET /api/v1/analytics/overview`
Returns high-level KPI metrics for the tenant workspace.
- Requires role `OWNER` or `ADMIN`.
- Date range filter: `?days=7` (default), `30`, `90`, `365`.

```json
// Response (200 OK)
{
  "period": { "days": 30 },
  "views": {
    "total": 1420,
    "unique": 980
  },
  "feedback": {
    "total": 85,
    "helpful": 74,
    "unhelpful": 11,
    "ratio": 87.1
  },
  "searches": {
    "total": 310,
    "noResult": 14
  }
}
```

#### `GET /api/v1/analytics/articles`
Returns top articles ranked by total views with helpfulness sentiment.
- Requires role `OWNER` or `ADMIN`.
- Supports `?days=30&limit=10`.

```json
// Response (200 OK)
{
  "data": [
    {
      "id": "764b8556-91bf-4fa9-8bb8-2a10df768f51",
      "title": "Quickstart: Setting up your account in 5 minutes",
      "slug": "quickstart-setting-up-account",
      "views": 420,
      "helpful": 28,
      "unhelpful": 2,
      "feedbackRatio": 93.3
    }
  ]
}
```

#### `GET /api/v1/analytics/searches`
Returns popular search keywords and zero-result search queries to identify documentation gaps.
- Requires role `OWNER` or `ADMIN`.

```json
// Response (200 OK)
{
  "popular": [
    { "query": "quickstart", "count": 48 },
    { "query": "invoicing", "count": 22 }
  ],
  "noResults": [
    { "query": "sso saml login", "count": 12 },
    { "query": "webhook delivery", "count": 7 }
  ]
}
```

#### `GET /api/v1/tenant/members`
Lists all members in the authenticated tenant workspace.
```json
// Response (200 OK)
{
  "members": [
    {
      "id": "e81d77cb-0027-4f6f-a88a-26514f7b6058",
      "role": "OWNER",
      "status": "ACTIVE",
      "user": {
        "id": "2da12b9a-4c28-49d7-8292-126fa9bc10ad",
        "name": "Acme Owner",
        "email": "owner@acme.com"
      }
    }
  ]
}
```

#### `PATCH /api/v1/tenant/members/:memberId`
Updates a member's role (`ADMIN`, `EDITOR`). Requires role `OWNER`. Automatically generates an audit log event.
```json
// Request Body
{
  "role": "ADMIN"
}
// Response (200 OK)
{
  "message": "Member role updated successfully",
  "membership": {
    "id": "e81d77cb-0027-4f6f-a88a-26514f7b6058",
    "role": "ADMIN",
    "status": "ACTIVE"
  }
}
```

#### `GET /api/v1/tenant/audit-logs`
Returns paginated administrative audit logs for the workspace.
- Requires role `OWNER` or `ADMIN`.
- Supports `?page=1&limit=20`.

```json
// Response (200 OK)
{
  "data": [
    {
      "id": "1e72e1ab-5d46-4cb4-9b5f-50f96d0ea4fa",
      "action": "ARTICLE_PUBLISHED",
      "resourceType": "ARTICLE",
      "resourceId": "8bb38093-4fc6-419b-a01c-6b3a24683d73",
      "details": { "title": "Managing your Payment Methods and Invoices" },
      "createdAt": "2026-11-15T11:20:00.000Z",
      "actor": {
        "id": "2da12b9a-4c28-49d7-8292-126fa9bc10ad",
        "name": "Acme Owner",
        "email": "owner@acme.com"
      }
    }
  ],
  "meta": { "total": 3, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

### Rate Limiting Specification

Rate limiting is enforced via `express-rate-limit` using standard headers:
- `RateLimit-Limit`: Maximum allowed requests in window
- `RateLimit-Remaining`: Remaining requests in current window
- `RateLimit-Reset`: Seconds remaining until window resets

When a client exceeds the limit, a `429 Too Many Requests` response is returned:
```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many requests from this IP, please try again in a minute."
  }
}
```
