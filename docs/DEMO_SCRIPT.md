# KnowledgeHub: 5–8 Minute Demonstration Script

**Demo Title:** Multi-Tenant Customer Support Knowledge Base SaaS  
**Total Duration:** 6–8 Minutes  
**Demonstration Scope:** Two Isolated Tenants (Acme Corp & Globex Corporation) + Full Customer Self-Service Journey  
**Prerequisites:** Database seeded via `npm run seed`; server and client running.

---

## Demonstration Timeline & Overview

| Timestamp | Phase | Role / Persona | Screen / URL | Key Takeaway |
|---|---|---|---|---|
| **0:00 – 1:00** | Introduction & Problem | Presenter | Home Page / Login | The self-service support challenge for multi-brand companies. |
| **1:00 – 2:15** | Tenant Workspace & Branding | Acme Owner | `/settings`, `/profile` | Dynamic workspace branding, team member management. |
| **2:15 – 3:30** | Content Drafting & RBAC | Acme Editor | `/articles/new` | Markdown editor, live XSS-safe preview, server-enforced publish block. |
| **3:30 – 4:30** | Review, Publish & Audit | Acme Admin | `/articles`, `/tenant/audit-logs` | Publishing workflow, category attachment, administrative audit logging. |
| **4:30 – 6:00** | Customer Self-Service | Public Visitor | `/help/acme` | Fast Redis-cached portal, full-text search, feedback rating & comment. |
| **6:00 – 7:00** | Customer Intelligence | Acme Owner | `/analytics` | Real-time views, sentiment gauge, zero-result search gap identification. |
| **7:00 – 8:00** | Cross-Tenant Isolation | Globex Owner | `/articles`, `/analytics` | Zero leakage proof: Tenant B cannot see Tenant A's data. |

---

## Detailed Step-by-Step Walkthrough

### 1. Introduction (0:00 – 1:00)
- **Goal:** Set the stage and explain what KnowledgeHub solves.
- **Talking Points:**
  > *"Customer support teams are overwhelmed by repetitive questions about billing, account setup, and product usage. KnowledgeHub is a multi-tenant knowledge base SaaS that enables companies to run their own branded public Help Centers while keeping all administrative content, team roles, and analytics strictly isolated."*
- **Action:** Open browser at `http://localhost:5173/login`.

---

### 2. Tenant Workspace & Team Management (1:00 – 2:15)
- **Persona:** Alice Smith (`owner@acme.com` / `Password123!`) — Acme Corp Owner.
- **Action:**
  1. Log in with `owner@acme.com`.
  2. The dashboard shell displays the active workspace: **Acme Corp**.
  3. Navigate to **Settings** (`/settings`):
     - Point out workspace customization: Company Name, Logo URL, and Primary Color (`#2563EB`).
  4. Navigate to **Team Profile** (`/profile`):
     - Show the active team roster: Owner (`owner@acme.com`), Admin (`admin@acme.com`), and Editor (`editor@acme.com`).
     - Mention that Owners can promote or demote members, and every sensitive action is recorded in the immutable audit log.
- **Talking Points:**
  > *"Every company manages its own workspace identity. Notice our primary blue branding and team hierarchy with fine-grained roles."*

---

### 3. Content Authoring & RBAC Enforcement (2:15 – 3:30)
- **Persona:** Eddie Editor (`editor@acme.com` / `Password123!`) — Acme Corp Editor.
- **Action:**
  1. Log out or switch to `editor@acme.com`.
  2. Navigate to **Articles** (`/articles`) and click **New Article** (`/articles/new`).
  3. Enter Title: `Troubleshooting SSO & Google Login`.
     - Point out auto-generated URL slug: `troubleshooting-sso-google-login`.
  4. Select Category: `Account & Profile`.
  5. Enter Content in Markdown:
     ```markdown
     # Single Sign-On (SSO) Troubleshooting

     If you receive an **SSO authentication timeout**, verify your corporate identity provider.

     ### Quick Resolution Steps:
     1. Clear browser cookies.
     2. Ensure your domain matches your corporate email.
     ```
  6. Click the **Preview** tab:
     - Show real-time markdown parsing with clean typography.
     - Mention that `SafeContent.jsx` strips all malicious scripts to prevent Stored XSS.
  7. Point out the **Publish** button:
     - Notice that for the `EDITOR` role, publishing is disabled or rejected by the backend server (`403 ROLE_NOT_AUTHORIZED`).
  8. Click **Save Draft**.
- **Talking Points:**
  > *"Content authors can easily draft rich guides, but enterprise governance requires review before publishing to the public."*

---

### 4. Administrative Review, Publishing & Audit Trail (3:30 – 4:30)
- **Persona:** Bob Admin (`admin@acme.com` / `Password123!`) — Acme Corp Admin.
- **Action:**
  1. Log in as `admin@acme.com`.
  2. Open **Articles** (`/articles`) and filter by `DRAFT`.
  3. Find `Troubleshooting SSO & Google Login`.
  4. Click **Publish**:
     - The status badge transitions from yellow `DRAFT` to green `PUBLISHED`.
     - Redis cache for Acme Corp categories and article feeds is automatically invalidated.
  5. Open the Developer Tools / API or Swagger docs (`/api/v1/docs`):
     - Show `GET /api/v1/tenant/audit-logs` recording the immutable audit event `ARTICLE_PUBLISHED` with timestamp and actor ID.
- **Talking Points:**
  > *"Admins review and publish with one click. Every publishing event is recorded in the workspace audit log."*

---

### 5. Customer Self-Service Experience (4:30 – 6:00)
- **Persona:** Unauthenticated Public Customer.
- **Action:**
  1. Open a new private/incognito window or navigate directly to `http://localhost:5173/help/acme`.
  2. Point out:
     - The page loads in **sub-10ms** directly from Redis cache.
     - Custom Acme Corp branding (blue theme, logo, and active categories).
     - **Draft articles are invisible** — only `PUBLISHED` guides appear.
  3. **Full-Text Search:**
     - In the search bar, type `billing`.
     - Point out ranked full-text results (`How to update credit card`, `Annual subscription discounts`) powered by PostgreSQL `to_tsvector` and `ts_rank`.
  4. Click on `How to update credit card`:
     - Read the article detail with breadcrumbs and clean markdown.
     - Scroll to the bottom feedback widget: *"Was this article helpful?"*
  5. Click **Yes (Thumbs Up)**, type an optional comment: `Great explanation, worked immediately!`, and click **Submit Feedback**:
     - The widget transitions to a confirmation state: *"Thank you for your feedback!"*
     - Point out abuse prevention: duplicate submissions are throttled using IP hashing.
- **Talking Points:**
  > *"Customers find instant answers without contacting human agents. Search is fast, ranked by relevance, and readers can submit actionable feedback."*

---

### 6. Customer Intelligence & Analytics (6:00 – 7:00)
- **Persona:** Alice Smith (`owner@acme.com`) — Acme Corp Owner.
- **Action:**
  1. Return to the authenticated Acme dashboard and navigate to **Analytics** (`/analytics`).
  2. Point out the KPI Summary Cards:
     - **Article Views:** Automated view tracking with crawler/bot detection.
     - **Helpfulness Sentiment Score:** Visual satisfaction gauge breakdown (helpful vs unhelpful).
     - **Search Queries:** Volume of customer searches.
  3. Scroll to **Top Performing Articles Table**:
     - Shows most viewed guides with satisfaction percentages.
  4. Scroll to **Unanswered Searches Table (Searches with 0 Results)**:
     - Notice terms like `refund policy` or `wire transfer`.
     - Point out the **"Draft Article"** direct CTA link, allowing team members to immediately author guides to cover customer knowledge gaps.
- **Talking Points:**
  > *"Support leaders don't just host articles—they measure content effectiveness and discover exactly what answers customers are searching for but not finding."*

---

### 7. Multi-Tenant Isolation Proof (7:00 – 8:00)
- **Persona:** George Globex (`owner@globex.com` / `Password123!`) — Globex Corporation Owner.
- **Action:**
  1. Log out and sign in as `owner@globex.com`.
  2. Observe the dashboard:
     - The workspace name is **Globex Corporation**.
     - Color branding is distinct (`#DC2626` crimson red).
  3. Navigate to **Articles** (`/articles`):
     - **Zero Acme Corp articles exist.** Only Globex articles are visible.
  4. Navigate to **Categories** (`/categories`):
     - Only Globex categories exist.
  5. Navigate to **Analytics** (`/analytics`):
     - Globex metrics are completely separate; views, searches, and feedback for Acme never leak into Globex.
  6. Visit Globex Public Help Center (`http://localhost:5173/help/globex`):
     - Shows Globex branding and Globex published articles.
- **Talking Points:**
  > *"Tenant isolation is enforced at the database and middleware layers. Even if an attacker attempts to spoof headers or IDs, cross-tenant access is rejected with 403 or non-disclosing 404. Each company's data remains 100% private."*

---

## 8. Demo Wrap-Up & Conclusion

> *"To summarize: KnowledgeHub delivers complete multi-tenant isolation, enterprise RBAC, full-text search, Redis caching, abuse-protected customer feedback, and actionable analytics in one unified, production-ready full-stack application."*
