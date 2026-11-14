# Progress Log

> This file is the project's memory. Every new AI session must read it first and update it at the end of every task.

## Current status
- Phase: Setup complete, build not started
- **Next task: Week 1, Day 2** (create client/server projects, env config, ESLint/Prettier, Docker Compose for PostgreSQL, connect Prisma)

## Completed
_Nothing yet._

## Key decisions
- Language: JavaScript. Server uses CommonJS (easier with Jest); client uses ES modules (Vite).
- Package manager: npm
- Validation: Zod
- Password hashing: bcrypt
- Auth: short-lived access token (kept in memory on the client) + refresh token in an HttpOnly, Secure, SameSite cookie
- API error format: `{ "error": { "code": "STRING_CODE", "message": "Human readable message" } }`
- API prefix: `/api/v1`

## Important files and patterns to reuse
_Add entries as they are created (e.g. middleware, services, API client)._

## Known issues / TODO
_None yet._

## Task log (newest first)
<!-- Format:
### YYYY-MM-DD, Week X Day Y: <title>
- What was built:
- Files added/changed:
- Tests added / status:
- Decisions or deviations from PLAN.md:
- Open issues:
-->
