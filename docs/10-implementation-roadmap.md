# Implementation Roadmap — Mehayesod Platform

> Version 1.0 | 2026-06-14
> **Status note (2026-06-15):** Phases 1–5 of this document were the original planning roadmap. The MVP implementation is now complete. The current priority is Supabase deployment (see `GO_LIVE_CHECKLIST.md`). Phase 2 scope — field reporting and PDF generation — is defined at the bottom of this document and in `docs/knowledge-base/13-reference-report-specifications.md`.

---

## Overview

This roadmap converts the gap analysis (`docs/09-mvp-gap-analysis.md`) into an ordered execution plan. Each phase has a clear objective, concrete deliverables, effort estimate, and dependencies.

**Total estimated effort to production MVP:** 20–25 engineering days (4–5 weeks for one developer).

---

## Phase 1 — Database (Days 1–4)

### Objective

Establish the persistent data layer. Replace the in-memory mock store with a real PostgreSQL database. This is the foundation everything else depends on.

### Deliverables

1. **Supabase project created** — `mehayesod-dev` and `mehayesod-prod` projects initialized.
2. **Migration files created** — One migration file per table, in dependency order.
3. **All tables created** — `project`, `daily_log`, `contractor_row`, `equipment_row`, `photo`, `report`, `issue`, `comment`, `blocker`, `decision`.
4. **Indexes created** — All indexes defined in `docs/03-postgres-schema.md`.
5. **`updated_at` trigger** — Deployed on all mutable tables.
6. **Database views created** — `v_projects_missing_log_today`, `v_project_health`.
7. **Supabase TypeScript types generated** — `npx supabase gen types typescript` → `src/types/supabase.ts`.
8. **Environment variables configured** — `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
9. **Seed script** — A migration or separate script that inserts the 3 test projects and sample data from mock-data.ts.

### Migration File Order

```
supabase/migrations/
├── 20260615000001_create_project.sql
├── 20260615000002_create_daily_log.sql
├── 20260615000003_create_contractor_row.sql
├── 20260615000004_create_equipment_row.sql
├── 20260615000005_create_photo.sql
├── 20260615000006_create_report.sql
├── 20260615000007_create_issue.sql
├── 20260615000008_create_comment.sql
├── 20260615000009_create_blocker.sql
├── 20260615000010_create_decision.sql
├── 20260615000011_create_triggers.sql
├── 20260615000012_create_views.sql
└── 20260615000013_seed_dev_data.sql
```

### Estimated Effort

4 days

### Dependencies

- Supabase account and project (requires approval brief per global rules — design only today)
- Access to `.env` configuration

### Acceptance Criteria

- `SELECT * FROM project LIMIT 1;` returns a row in the Supabase SQL editor.
- TypeScript types are generated and importable.
- No tables are missing, no constraints are missing.

---

## Phase 2 — Storage (Days 5–7)

### Objective

Enable real file uploads for site photos and PDF reports. Replace Unsplash placeholder URLs with real Supabase Storage objects.

### Deliverables

1. **Storage buckets created** — `site-photos`, `reports`, `exports` (all private).
2. **Upload URL endpoint** — `POST /api/photos/upload-url` returns pre-signed upload URLs.
3. **Photo registration endpoint** — `POST /api/photos` creates the DB record after upload.
4. **Photo deletion endpoint** — `DELETE /api/photos/:id` removes record and storage object.
5. **Client-side image compression** — WebP conversion, max 1280px, before upload.
6. **Daily Log form updated** — Photo uploader calls real upload flow instead of placeholder.
7. **Issue form updated** — Photo uploader connected.
8. **Photo display updated** — All `<img>` tags use Supabase signed URLs (1-hour TTL).
9. **Signed URL cache** — TanStack Query caches signed URLs with 55-minute stale time.

### Estimated Effort

3 days

### Dependencies

- Phase 1 complete (photo table exists)
- Supabase Storage enabled on project

### Acceptance Criteria

- Field employee can upload a photo in the daily log form; photo persists after page refresh.
- Photo appears in the daily log detail view from the correct storage URL.
- Deleted photos are removed from both storage and the database.

---

## Phase 3 — Authentication (Days 8–12)

### Objective

Secure the application. No unauthenticated access to any data. Implement the role-based access model designed in `docs/04-supabase-architecture.md`.

### Deliverables

1. **Login page** — Email + password form at `/login` (Hebrew RTL).
2. **Magic link flow** — Alternative authentication for mobile field users.
3. **Session management** — Supabase Auth session persisted; auto-refresh.
4. **Protected route wrapper** — All routes redirect to `/login` if no session.
5. **Auth context** — `useAuth()` hook providing current user and role.
6. **Three roles implemented** — `field_manager`, `company_manager`, `admin` via `app_metadata`.
7. **RLS enabled** — All tables have RLS enabled with initial permissive policies (authenticated users can read/write all).
   - **Note:** Strict project-scoped RLS is Phase 5. Phase 3 uses "any authenticated user" policies.
8. **User profile** — `submittedBy` field in daily logs resolves from `auth.user.email` / display name.
9. **Logout** — Sidebar user menu with logout action.
10. **API layer enforces auth** — All API routes validate Supabase JWT before processing.

### RLS Policy Approach for Phase 3

Minimal — safe but permissive:
```sql
-- All authenticated users can read all data
CREATE POLICY "authenticated_read_all"
ON public.project FOR SELECT
TO authenticated
USING (true);
```

Full project-scoped RLS moves to Phase 5. Phase 3 just closes the "anonymous access" hole.

### Estimated Effort

5 days

### Dependencies

- Phase 1 and Phase 2 complete
- Supabase Auth configured
- Decision on user management flow (manual Supabase dashboard vs. invite flow)

### Acceptance Criteria

- Opening the app without a session redirects to `/login`.
- Login with valid credentials establishes a session and redirects to dashboard.
- Logging out clears session and redirects to `/login`.
- All API calls include the JWT; calls without a token return 401.

---

## Phase 4 — Reporting (Days 13–19)

### Objective

Complete the reporting pipeline: API layer, React Query migration, PDF generation, Excel export, report snapshots.

### Deliverables

#### 4a — API Layer (Days 13–15)

1. **All REST endpoints implemented** — per `docs/06-api-design.md`.
2. **Supabase client in API layer** — replacing mock store calls.
3. **Input validation with Zod** — all endpoints validate request bodies.
4. **Unique log constraint** — API returns 409 if log already exists for (project, date).
5. **Log immutability trigger** — Database trigger prevents editing logs with sent reports.
6. **Dashboard summary endpoint** — Single optimized query for dashboard data.

#### 4b — React Query Migration (Days 15–16)

1. **Query client configured** — `src/lib/query-client.ts`.
2. **Query key factory** — `src/lib/query-keys.ts`.
3. **All query hooks implemented** — `useProjects`, `useDailyLogs`, `useIssues`, etc.
4. **All mutation hooks implemented** — `useCreateDailyLog`, `useUpdateIssue`, etc.
5. **Optimistic updates** — Create daily log, update issue status.
6. **Cache invalidation** — Per the map in `docs/07-state-management.md`.
7. **`useStore()` calls removed** — All components use React Query hooks.

#### 4c — PDF Generation (Days 16–18)

1. **Edge Function: `generate-pdf-report`** — Puppeteer-based HTML→PDF.
2. **Report HTML template** — Hebrew RTL, company branding, A4 format.
3. **PDF stored in Supabase Storage** — `reports/` bucket.
4. **`pdf_storage_key` column added** — On report table.
5. **"Export PDF" button connected** — Triggers Edge Function, downloads result.
6. **Snapshot on send** — Marking report as `sent` triggers PDF generation if not already done.

#### 4d — Excel Export (Day 18)

1. **ExcelJS integrated** — Client-side Excel generation.
2. **Weekly export** — Aggregates daily logs for a project per week.
3. **"Export Excel" button connected** — Downloads `.xlsx` file.

#### 4e — Report Snapshot (Day 19)

1. **Immutable snapshot confirmed** — Sent reports use PDF from storage, not live DB render.
2. **Sent report view** — Displays stored PDF in an iframe or downloads it directly.
3. **"Mark as Sent" flow** — Generates PDF snapshot, stores it, updates status.

### Estimated Effort

7 days

### Dependencies

- Phases 1, 2, 3 complete
- Supabase Edge Functions enabled

### Acceptance Criteria

- Field manager submits a daily log → report is auto-created with status `draft`.
- Manager clicks "Export PDF" → receives a properly formatted Hebrew A4 PDF.
- Manager marks report "sent" → a PDF is stored; source log becomes uneditable.
- Dashboard KPIs reflect real data from the database.

---

## Phase 5 — Production Hardening (Days 20–25)

### Objective

Prepare the system for real client use. Security, performance, observability, and operational stability.

### Deliverables

1. **Strict RLS policies** — Project-scoped policies per role (see `docs/04-supabase-architecture.md`).
2. **Error boundaries** — `<ErrorBoundary>` around all major UI sections.
3. **Toast error handling** — All failed mutations show Hebrew error messages.
4. **Loading skeletons** — Replace raw loading states with skeleton screens.
5. **Mobile optimization** — Daily log form tested and optimized for iOS Safari and Android Chrome.
6. **Performance audit** — Lighthouse score > 80 on mobile.
7. **Export cleanup cron** — Edge Function deletes `exports/` files older than 7 days.
8. **Missing log detection** — Dashboard shows projects without today's log; email notification (or Slack) when 16:00 passes without a log (if notification infrastructure available).
9. **Environment hardening** — Production env vars reviewed; `SUPABASE_SERVICE_ROLE_KEY` never in frontend bundle (confirmed by grep of production build).
10. **Pagination** — All list endpoints and UI list components implement pagination.
11. **Comments UI** — Issue detail view with threaded comments and add-comment form.
12. **Weekly report view** — UI for viewing aggregated weekly data.
13. **UUID migration in mock data** — `uid()` replaced with `crypto.randomUUID()` for consistency.
14. **Staging environment** — `mehayesod-staging` Supabase project for pre-production validation.
15. **Runbook** — Operations guide: how to add a user, run a migration, roll back a bad deploy.

### Estimated Effort

5–6 days

### Dependencies

- Phases 1–4 complete
- First real user (test deployment with actual project manager)

### Acceptance Criteria

- System passes the security checklist in `docs/04-supabase-architecture.md`.
- Dashboard loads in < 2 seconds on a mobile device on 4G.
- A field manager can submit a complete daily log (with photos) in < 5 minutes.
- A company manager can view all projects, see missing logs, and access any report.
- No unauthenticated access to any data possible.

---

## Phase Summary Table

| Phase | Name | Days | Cumulative | Key Output |
|---|---|---|---|---|
| 1 | Database | 4 | 4 | Schema live in Supabase |
| 2 | Storage | 3 | 7 | Real photo uploads working |
| 3 | Authentication | 5 | 12 | Secure login, roles, protected routes |
| 4 | Reporting | 7 | 19 | Full API, React Query, PDF generation |
| 5 | Production Hardening | 5–6 | 25 | Production-ready system |

---

## Day-by-Day Schedule (Suggested)

| Day | Task |
|---|---|
| 1 | Supabase project setup, env vars, migration tooling |
| 2 | Migrations for project, daily_log, contractor_row, equipment_row |
| 3 | Migrations for photo, report, issue, comment, blocker, decision |
| 4 | Triggers, views, seed script, TypeScript type generation |
| 5 | Storage buckets, upload URL endpoint |
| 6 | Client-side compression, photo upload flow in daily log form |
| 7 | Photo display with signed URLs; issue photo upload |
| 8 | Login page, Supabase Auth integration |
| 9 | Session management, protected routes, logout |
| 10 | Auth context, role handling, user profile in JWT |
| 11 | RLS Phase 3 (permissive — authenticated users only) |
| 12 | Test auth flow end-to-end; fix issues |
| 13 | API layer: projects + daily logs endpoints |
| 14 | API layer: issues + blockers + decisions endpoints |
| 15 | API layer: reports + dashboard summary; Zod validation |
| 16 | React Query: query client, key factory, query hooks |
| 17 | React Query: mutation hooks, optimistic updates, cache invalidation |
| 18 | PDF Edge Function; Excel export with ExcelJS |
| 19 | Report snapshot on send; sent report view |
| 20 | Strict RLS policies |
| 21 | Error boundaries, loading skeletons, toast error messages |
| 22 | Mobile optimization + Lighthouse audit |
| 23 | Pagination on all lists; comments UI |
| 24 | Export cleanup cron; missing log detection + notification |
| 25 | Security checklist, production env review, runbook |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Puppeteer in Edge Function is too slow (>30s) | Medium | High | Switch to PDFShift or DocRaptor managed service |
| RLS policies accidentally lock out users | High | High | Test every role in staging before production |
| HEIC photos from iPhones don't compress correctly | Medium | Medium | Fallback to JPEG if WebP conversion fails |
| Hebrew RTL in PDF renders incorrectly | Medium | High | Test PDF template with real Hebrew content early in Phase 4 |
| Field employee edits sent report through a bug | Low | High | Database trigger (GAP-H05) is the safety net |
| Supabase Storage signed URLs expire during PDF generation | Low | Medium | Generate PDF synchronously or use service role key server-side |

---

## Phase 2 — Field Reporting and PDF Generation

> **Gate:** Do not begin until MVP Supabase deployment is complete and verified. Requires explicit product owner approval.

**Reference documents:** Two PDF samples provided by product owner (2026-06-15). Full field specifications in `docs/knowledge-base/13-reference-report-specifications.md`.

### Phase 2 Objective

Generate professional branded PDF reports matching the reference output samples provided by the product owner. Two report types are in scope:

1. **Daily Work Log PDF (יומן עבודה)** — structured site activity record for clients and supervision
2. **Engineering Response PDF (דוח תגובה הנדסי)** — professional response to inspection findings with cost estimates and standard references

### Phase 2 New Entities

| Entity | Purpose |
|---|---|
| `field_note` | Categorized observation within a daily log (supervision / safety / quality) |
| `engineering_finding` | An inspection claim requiring a professional response |
| `engineering_response` | Engineer's position on a specific finding |
| `standard_reference` | Standard or regulation cited in response (embedded in response record) |
| `cost_estimate` | Line-item cost table per finding (quantity, unit, price, VAT) |
| `generated_pdf_report` | Storage pointer to generated PDF |
| `signature` | Stored signature field (text or image) |

### Phase 2 Data Model Additions

Daily log extended with:
- Date range (from–to) instead of single date
- Formal role holder table (work manager, safety officer, others)
- Work location per contractor row
- Field notes with category

New hierarchy for engineering reports:
```
project
  └─ engineering_finding (many, per inspection report)
       ├─ engineering_response (one)
       ├─ cost_estimate (many line items)
       └─ photo (many)
```

### Phase 2 Acceptance Criteria

**Daily Work Log PDF:**
- User generates branded A4 PDF from a daily log
- PDF includes: general info, role holders, contractors, equipment, notes with photos, signature
- PDF visually matches the reference daily work log document

**Engineering Response PDF:**
- User creates findings, enters responses, adds standard references, and enters cost estimates
- Cost totals compute automatically (quantity × unit price + supervision % + VAT)
- PDF includes all sections: client details, declaration, per-finding responses with photos, cost tables, summary, signature
- PDF visually matches the reference engineering response document

### Phase 2 Estimated Effort

| Sub-phase | Description | Estimated Days |
|---|---|---|
| 2a | Photo storage (Supabase Storage bucket) | 2 |
| 2b | Extended daily log + field notes + Daily Work Log PDF | 5 |
| 2c | Engineering finding / response data model + UI | 5 |
| 2d | Engineering Response PDF generation | 4 |
| 2e | Testing and PDF layout refinement | 3 |
| **Total** | | **~19 days** |

### Phase 2 Dependencies

- MVP deployment verified (all 49 smoke tests pass)
- Product owner approval after reviewing smoke test results
- Supabase Storage bucket created and RLS configured
- PDF generation approach decided (client-side `@react-pdf/renderer` vs. server-side Edge Function)

---

## Phase 3 — Future (Not Yet Scoped)

Not planned. Requires explicit product owner approval after Phase 2 is complete.

Possible directions (not commitments):
- Automated PDF delivery by email (Resend, SendGrid, or Supabase Edge Functions)
- Weekly / monthly automated report aggregation
- Advanced analytics / cross-project KPI trends
- Mobile-first PWA
- Multi-tenant company isolation layer
- Notifications (missing log alerts, blocker escalation)
