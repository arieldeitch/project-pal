# Supabase Architecture Design — Mehayesod Platform

> Version 1.1 | 2026-06-15
> **Status: Design only. Do not implement until Phase 2–3.**
> Changes from v1.0: RC-04 — RLS policy templates updated to use `project_member` table instead of JWT claims for project scoping.

---

## 1. Supabase Project Structure

### Single Project, Multiple Environments

**Decision:** One Supabase project per environment (development, production).

| Environment | Purpose | Notes |
|---|---|---|
| `mehayesod-dev` | Development and testing | Reset frequently; seed data allowed |
| `mehayesod-prod` | Production | Real data; guarded migrations |

**Rationale:** Separate projects prevent migration mistakes in production. Each project has its own URL, anon key, and service role key. Environment variables select the correct project.

### Branch strategy (Supabase Branching — future)
Once the product stabilizes, Supabase Branching can be enabled to get preview environments per PR. Not needed for MVP.

---

## 2. Database Configuration

```
Organization: Mehayesod
Project: mehayesod-prod
Region: eu-central-1 (Frankfurt — lowest latency from Israel)
Plan: Pro (for production; Free tier for dev)
Postgres version: 15+
```

**Extensions to enable:**
```sql
-- Already enabled by default in Supabase:
-- uuid-ossp (for gen_random_uuid())
-- pgcrypto

-- Enable for future use:
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- fuzzy text search on project names / issues
CREATE EXTENSION IF NOT EXISTS unaccent;  -- Hebrew text normalization
```

---

## 3. Storage Buckets

Supabase Storage is used for all binary file uploads: photos from site, generated PDF reports.

### 3.1 Bucket: `site-photos`

**Purpose:** All photos uploaded from daily logs and issue reports.

| Property | Value |
|---|---|
| Bucket name | `site-photos` |
| Access | Private (authenticated access only) |
| Max file size | 10 MB |
| Allowed MIME types | image/jpeg, image/png, image/webp, image/heic |
| CORS | Supabase dashboard configured |

**Folder structure:**
```
site-photos/
└── {project_id}/
    ├── logs/
    │   └── {daily_log_id}/
    │       ├── photo_001.webp
    │       └── photo_002.webp
    └── issues/
        └── {issue_id}/
            └── photo_001.webp
```

**Naming convention:** `{entity_type}/{entity_id}/photo_{sequence:03d}.{ext}`

**Client-side compression:** Before upload, images are compressed to max 1280px wide and converted to WebP (target < 500 KB). Full-resolution originals are not stored in MVP.

---

### 3.2 Bucket: `reports`

**Purpose:** Generated PDF reports ready for client delivery.

| Property | Value |
|---|---|
| Bucket name | `reports` |
| Access | Private |
| Max file size | 50 MB |
| Allowed MIME types | application/pdf |

**Folder structure:**
```
reports/
└── {project_id}/
    └── {report_id}/
        └── daily_report_{date}.pdf
```

**Naming convention:** `{report_id}/daily_report_{YYYY-MM-DD}.pdf`

**Lifecycle:** PDF files are generated on-demand and stored. A report with `status = sent` should have a corresponding PDF. Draft/ready reports may not yet have a PDF.

---

### 3.3 Bucket: `exports`

**Purpose:** Excel exports of weekly/monthly data. Temporary files, purged after 7 days.

| Property | Value |
|---|---|
| Bucket name | `exports` |
| Access | Private |
| Max file size | 10 MB |
| Retention | 7 days (object lifecycle policy) |
| Allowed MIME types | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet |

---

## 4. Future Authentication Model

> **This section is design only. Authentication is not implemented in Phase 1.**

### 4.1 Identity Provider

**Supabase Auth** (built-in) with:
- **Email + Password** for all internal users (project managers, management)
- **Magic Link** as an alternative for field users on mobile (no password to forget)
- **No social OAuth** in MVP (reduces attack surface)

### 4.2 User Roles

Three roles, implemented via Supabase's `app_metadata` claim:

| Role | Hebrew | Who | Permissions |
|---|---|---|---|
| `field_manager` | מנהל שטח | Creates daily logs | Own project logs, can view all issues/blockers |
| `company_manager` | מנהל חברה | CEO / Operations | Full read access, can approve decisions |
| `admin` | מנהל מערכת | System admin | Full CRUD on all entities |

Clients (external) get a separate read-only **client portal** in Phase 2 with a distinct access mechanism (shared token or separate auth).

### 4.3 JWT Custom Claims

```json
{
  "sub": "uuid",
  "email": "user@company.com",
  "app_metadata": {
    "role": "field_manager"
  }
}
```

**RC-04 change:** `project_ids` has been removed from the JWT claims. Project scoping is determined at query time by joining to the `project_member` table, not by reading a static array from the JWT.

**Why:** JWT claims are issued at login and only refresh on the next token cycle. A field manager assigned to a new project midday would have no access until their token expires. Conversely, a manager removed from a project would retain access until expiry. The `project_member` table is the live, authoritative source of project access — RLS policies must query it rather than relying on the JWT.

The `role` claim remains in the JWT for the role check (field_manager vs. company_manager), since roles change far less frequently than project assignments.

### 4.4 Auth Flow

```
User opens app
    │
    ▼
No session → /login page
    │
    ├── Email + Password → supabase.auth.signInWithPassword()
    └── Magic Link → supabase.auth.signInWithOtp()
    │
    ▼
Session established → JWT stored in httpOnly cookie (SSR) or localStorage (SPA)
    │
    ▼
All API requests include Authorization: Bearer <JWT>
    │
    ▼
Supabase RLS policies validate JWT claims per table
```

---

## 5. Future RLS Strategy

> **Do not implement RLS until Phase 3. Premature RLS is a common source of production bugs.**

### 5.1 Design Principles

1. **Default deny** — Every table starts with RLS enabled and zero permissive policies. Access is granted explicitly.
2. **Role-based policies** — Policies read the `app_metadata.role` claim from the JWT for role checks.
3. **Project scoping** — `field_manager` can only see projects listed in their `project_member` rows. **Never from JWT claims** (RC-04).
4. **No `USING (true)`** — Never a blanket allow-all policy.
5. **Separate read and write policies** — `SELECT` and `INSERT/UPDATE/DELETE` are distinct policies.
6. **Live membership, not cached claims** — Project access is always resolved from the `project_member` table at query time.

### 5.2 Policy Templates

**Project table — company_manager can read all:**
```sql
CREATE POLICY "company_manager_read_all_projects"
ON public.project FOR SELECT
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('company_manager','admin')
);
```

**Daily log — field_manager reads own projects only (RC-04: uses project_member table):**
```sql
CREATE POLICY "field_manager_read_own_projects_logs"
ON public.daily_log FOR SELECT
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'field_manager'
    AND project_id IN (
        SELECT pm.project_id
        FROM public.project_member pm
        WHERE pm.user_id = auth.uid()
    )
);
```

**Daily log — field_manager creates logs in own projects (RC-04: uses project_member table):**
```sql
CREATE POLICY "field_manager_insert_own_logs"
ON public.daily_log FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'field_manager'
    AND project_id IN (
        SELECT pm.project_id
        FROM public.project_member pm
        WHERE pm.user_id = auth.uid()
    )
);
```

**Photo — field_manager accesses photos for their projects (RC-01 + RC-04):**
```sql
-- Photos are now FK-linked; join through the parent entity for authorization
CREATE POLICY "field_manager_read_log_photos"
ON public.photo FOR SELECT
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'field_manager'
    AND (
        daily_log_id IN (
            SELECT dl.id FROM public.daily_log dl
            WHERE dl.project_id IN (
                SELECT pm.project_id FROM public.project_member pm
                WHERE pm.user_id = auth.uid()
            )
        )
        OR
        issue_id IN (
            SELECT i.id FROM public.issue i
            WHERE i.project_id IN (
                SELECT pm.project_id FROM public.project_member pm
                WHERE pm.user_id = auth.uid()
            )
        )
    )
);
```

### 5.3 RLS Rollout Sequence

1. Enable RLS on all tables with no policies → complete lockout (test in dev first)
2. Add `admin` role policies (full access)
3. Add `company_manager` read-all policies
4. Add `field_manager` scoped policies
5. Test each role in dev environment before deploying to prod
6. Never modify RLS in production without staging validation

---

## 6. Supabase Client Configuration

### Environment Variables

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Never expose in frontend:
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Rule:** `SUPABASE_SERVICE_ROLE_KEY` is only used in server-side code (Edge Functions, migration scripts). It must never appear in any file that is bundled by Vite.

### Supabase Client Initialization

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
```

---

## 7. Supabase Edge Functions (Future)

Edge Functions will be used for server-side logic that cannot safely run in the browser:

| Function | Purpose | Phase |
|---|---|---|
| `generate-pdf-report` | Generate PDF from daily log data using a headless renderer | Phase 4 |
| `send-report-email` | Send report PDF to client via Resend/SendGrid | Phase 4 |
| `generate-weekly-report` | Aggregate daily logs into a weekly summary | Phase 4 |
| `notify-missing-logs` | Daily cron to flag projects without today's log | Phase 5 |

---

## 8. Realtime (Future)

Supabase Realtime can enable live updates on the dashboard when field managers submit new logs.

**Candidate channels:**
- `daily_log` INSERT events → refresh dashboard KPIs
- `issue` UPDATE events → refresh issue list
- `decision` UPDATE events → refresh pending decisions

Not needed for MVP. Consider in Phase 5.

---

## 9. Security Checklist (Pre-Launch)

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT in any frontend bundle (run `grep -r "service_role" dist/`)
- [ ] RLS is enabled on all tables
- [ ] No `USING (true)` policies exist
- [ ] Storage buckets are all private (no public buckets unless deliberate)
- [ ] `auth.users` is never touched directly with SQL
- [ ] Supabase project has MFA enabled for admin accounts
- [ ] Database password is rotated and not shared
- [ ] Connection pooling is configured for production
