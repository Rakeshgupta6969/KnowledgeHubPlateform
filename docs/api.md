# API Reference (working document)

Update this whenever an endpoint is added or changed. Base path: `/api/v1`. Auth: `Authorization: Bearer <accessToken>` for private routes.

| Method | Endpoint | Auth | Status | Notes |
|---|---|---|---|---|
| POST | /auth/register | Public | Planned (Week 1) | Creates user + tenant + owner membership in one transaction |
| POST | /auth/login | Public | Planned (Week 1) | |
| POST | /auth/refresh | Refresh cookie | Planned (Week 1) | |
| POST | /auth/logout | Auth | Planned (Week 1) | Revokes refresh session |
| GET | /auth/me | Auth | Planned (Week 1) | User + memberships |
| GET | /tenant/current | Auth | Planned (Week 1) | |

Add request/response examples under each endpoint once implemented.
