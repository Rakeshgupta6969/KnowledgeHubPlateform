# KnowledgeHub API Reference (Weeks 1 & 2)

Base path: `/api/v1`  
Private routes require: `Authorization: Bearer <accessToken>`  
Active tenant context on private routes is derived strictly from user's active membership (optional `x-tenant-id` header validated against user's verified active memberships).

---

## Endpoint Summary

### Auth & Tenant Workspace APIs
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | None | Atomically creates User, Tenant, and Owner Membership |
| POST | `/api/v1/auth/login` | Public | None | Authenticates credentials, issues access token & HttpOnly refresh cookie |
| POST | `/api/v1/auth/refresh` | Cookie | None | Issues a new short-lived access token using verified DB session |
| POST | `/api/v1/auth/logout` | Cookie | None | Revokes refresh token in database and clears the cookie |
| GET | `/api/v1/auth/me` | Bearer | None | Returns current authenticated user profile and all tenant memberships |
| GET | `/api/v1/tenant/current` | Bearer | Any Member | Returns active workspace details and user membership |
| PATCH | `/api/v1/tenant/current` | Bearer | OWNER, ADMIN | Updates workspace name, primary color, or logo URL |

### Category APIs
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/v1/categories` | Bearer | Any Member | Lists categories scoped to active workspace (supports `?status=ACTIVE\|ARCHIVED\|ALL`) |
| POST | `/api/v1/categories` | Bearer | OWNER, ADMIN | Creates new category with auto/custom slug unique per tenant |
| GET | `/api/v1/categories/:id` | Bearer | Any Member | Reads single category detail with article count |
| PATCH | `/api/v1/categories/:id` | Bearer | OWNER, ADMIN | Updates category name, slug, description, sort order, or status |
| DELETE | `/api/v1/categories/:id` | Bearer | OWNER, ADMIN | Archives category (sets status to `ARCHIVED`) |

### Article APIs
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/v1/articles` | Bearer | Any Member | Lists articles with pagination (`page`, `limit`), `status`, `categoryId`, and `sort` |
| POST | `/api/v1/articles` | Bearer | Any Member | Creates draft or published article; checks category tenant ownership |
| GET | `/api/v1/articles/:id` | Bearer | Any Member | Reads single article detail with category and author info |
| PATCH | `/api/v1/articles/:id` | Bearer | Any Member | Updates article content, category, or status with transition validation |
| POST | `/api/v1/articles/:id/publish` | Bearer | OWNER, ADMIN | Publishes draft or archived article, sets `publishedAt = NOW()` |
| DELETE | `/api/v1/articles/:id` | Bearer | OWNER, ADMIN | Archives article (or permanently deletes if `?permanent=true`) |

### Public Help Center APIs
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/v1/public/:tenantSlug` | Public | None | Returns public branding & config for active workspace |
| GET | `/api/v1/public/:tenantSlug/categories` | Public | None | Lists public active categories with published article counts |
| GET | `/api/v1/public/:tenantSlug/articles` | Public | None | Lists **PUBLISHED** articles only; supports `categorySlug`, `page`, `limit` |
| GET | `/api/v1/public/:tenantSlug/articles/:slug` | Public | None | Returns single published article; returns 404 for drafts or archived |

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
- `403 Forbidden` (`FORBIDDEN`, `TENANT_ACCESS_DENIED`, `TENANT_INACTIVE`, `USER_SUSPENDED`)
- `404 Not Found` (`ROUTE_NOT_FOUND`, `USER_NOT_FOUND`, `CATEGORY_NOT_FOUND`, `ARTICLE_NOT_FOUND`, `TENANT_NOT_FOUND`)
- `409 Conflict` (`EMAIL_ALREADY_EXISTS`, `SLUG_ALREADY_EXISTS`, `CATEGORY_SLUG_EXISTS`, `ARTICLE_SLUG_EXISTS`)
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
