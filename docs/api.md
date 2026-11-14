# API Reference (Week 1 Implementation)

Base path: `/api/v1`
Private routes require: `Authorization: Bearer <accessToken>`

## Summary of Implemented Endpoints

| Method | Endpoint | Auth Required | Status | Description |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Implemented (Week 1) | Atomically creates user, tenant, and owner membership in one transaction |
| POST | `/api/v1/auth/login` | Public | Implemented (Week 1) | Authenticates credentials, issues access token & HttpOnly refresh cookie |
| POST | `/api/v1/auth/refresh` | Refresh Cookie | Implemented (Week 1) | Issues a new short-lived access token using verified DB session |
| POST | `/api/v1/auth/logout` | Refresh Cookie | Implemented (Week 1) | Revokes refresh token in database and clears the cookie |
| GET | `/api/v1/auth/me` | Bearer Token | Implemented (Week 1) | Returns current authenticated user profile and all tenant memberships |
| GET | `/api/v1/tenant/current` | Bearer Token | Implemented (Week 1) | Returns active tenant profile and membership derived strictly from user |

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
- `400 Bad Request` (`VALIDATION_ERROR`, `INVALID_JSON`)
- `401 Unauthorized` (`INVALID_CREDENTIALS`, `TOKEN_REQUIRED`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `INVALID_REFRESH_TOKEN`)
- `403 Forbidden` (`FORBIDDEN`, `TENANT_ACCESS_DENIED`, `TENANT_INACTIVE`, `USER_SUSPENDED`)
- `404 Not Found` (`ROUTE_NOT_FOUND`, `USER_NOT_FOUND`)
- `409 Conflict` (`EMAIL_ALREADY_EXISTS`, `SLUG_ALREADY_EXISTS`, `DUPLICATE_ENTRY`)
- `500 Internal Server Error` (`INTERNAL_ERROR`)

---

## Detailed Endpoint Contracts

### 1. Register Workspace & Owner
**`POST /api/v1/auth/register`**

Creates Tenant, User, and Owner Membership in a single atomic database transaction.

#### Request Body
```json
{
  "companyName": "Acme Corp",
  "slug": "acme",
  "name": "Acme Owner",
  "email": "owner@acme.com",
  "password": "Password123!"
}
```
*Note: `slug` is optional. If omitted, it will be automatically derived from `companyName`.*

#### Response (`201 Created`)
**Set-Cookie Header:** `refreshToken=<token>; Path=/api/v1; HttpOnly; SameSite=Lax; Max-Age=604800`
```json
{
  "user": {
    "id": "713df0d3-379e-4d56-a4f6-0618ce5c7ea7",
    "name": "Acme Owner",
    "email": "owner@acme.com",
    "createdAt": "2026-11-15T02:00:00.000Z"
  },
  "tenant": {
    "id": "893d9b15-7762-4b2a-89bc-993d39589d31",
    "name": "Acme Corp",
    "slug": "acme"
  },
  "membership": {
    "id": "a9dc891e-367d-45df-bbfe-7756f7e8a931",
    "role": "OWNER",
    "status": "ACTIVE"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2. Login
**`POST /api/v1/auth/login`**

Authenticates with email and password. Returns a generic `Invalid email or password` (401) error on invalid email, wrong password, or inactive account to prevent enumeration.

#### Request Body
```json
{
  "email": "owner@acme.com",
  "password": "Password123!"
}
```

#### Response (`200 OK`)
**Set-Cookie Header:** `refreshToken=<token>; Path=/api/v1; HttpOnly; SameSite=Lax; Max-Age=604800`
```json
{
  "user": {
    "id": "713df0d3-379e-4d56-a4f6-0618ce5c7ea7",
    "name": "Acme Owner",
    "email": "owner@acme.com",
    "createdAt": "2026-11-15T02:00:00.000Z"
  },
  "memberships": [
    {
      "id": "a9dc891e-367d-45df-bbfe-7756f7e8a931",
      "role": "OWNER",
      "status": "ACTIVE",
      "tenant": {
        "id": "893d9b15-7762-4b2a-89bc-993d39589d31",
        "name": "Acme Corp",
        "slug": "acme",
        "status": "ACTIVE",
        "logoUrl": null,
        "primaryColor": "#3B82F6"
      }
    }
  ],
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3. Refresh Access Token
**`POST /api/v1/auth/refresh`**

Reads the `refreshToken` HttpOnly cookie, verifies it against the database session, and issues a new access token.

#### Request Headers
`Cookie: refreshToken=<token>`

#### Response (`200 OK`)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 4. Logout
**`POST /api/v1/auth/logout`**

Revokes the refresh token session in PostgreSQL and clears the `refreshToken` cookie.

#### Request Headers
`Cookie: refreshToken=<token>`

#### Response (`200 OK`)
**Set-Cookie Header:** `refreshToken=; Path=/api/v1; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
```json
{
  "message": "Logged out successfully"
}
```

---

### 5. Get Current User & Memberships
**`GET /api/v1/auth/me`**

Returns authenticated user profile and all tenant memberships.

#### Request Headers
`Authorization: Bearer <accessToken>`

#### Response (`200 OK`)
```json
{
  "user": {
    "id": "713df0d3-379e-4d56-a4f6-0618ce5c7ea7",
    "name": "Acme Owner",
    "email": "owner@acme.com",
    "status": "ACTIVE",
    "createdAt": "2026-11-15T02:00:00.000Z"
  },
  "memberships": [
    {
      "id": "a9dc891e-367d-45df-bbfe-7756f7e8a931",
      "role": "OWNER",
      "status": "ACTIVE",
      "tenant": {
        "id": "893d9b15-7762-4b2a-89bc-993d39589d31",
        "name": "Acme Corp",
        "slug": "acme",
        "status": "ACTIVE",
        "logoUrl": null,
        "primaryColor": "#3B82F6"
      }
    }
  ]
}
```

---

### 6. Get Current Active Workspace Context
**`GET /api/v1/tenant/current`**

Derives active tenant strictly from user's verified active membership. An optional `x-tenant-id` header allows users with multiple memberships to select an active workspace, but is strictly validated against the user's verified memberships.

#### Request Headers
- `Authorization: Bearer <accessToken>`
- `x-tenant-id: <tenantUuid>` *(optional)*

#### Response (`200 OK`)
```json
{
  "tenant": {
    "id": "893d9b15-7762-4b2a-89bc-993d39589d31",
    "name": "Acme Corp",
    "slug": "acme",
    "logoUrl": null,
    "primaryColor": "#3B82F6",
    "status": "ACTIVE",
    "createdAt": "2026-11-15T02:00:00.000Z"
  },
  "membership": {
    "id": "a9dc891e-367d-45df-bbfe-7756f7e8a931",
    "role": "OWNER",
    "status": "ACTIVE",
    "createdAt": "2026-11-15T02:00:00.000Z"
  }
}
```

#### Error Response on Cross-Tenant Access Attempt (`403 Forbidden`)
If user tries to supply an `x-tenant-id` that does not belong to their verified memberships:
```json
{
  "error": {
    "code": "TENANT_ACCESS_DENIED",
    "message": "You do not have access to the requested workspace"
  }
}
```
