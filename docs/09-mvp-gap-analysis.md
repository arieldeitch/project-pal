# MVP Gap Analysis — Mehayesod Platform

> Version 1.0 | 2026-06-14

---

## 1. Analysis Method

This gap analysis compares the current implementation (Phase 1 mock data) against the requirements needed to launch a production MVP with real data. Each gap is ranked:

- **CRITICAL** — Blocks production launch. System cannot function without it.
- **HIGH** — Required for the MVP value proposition but not an absolute blocker.
- **MEDIUM** — Improves the product significantly; recommended before first client use.
- **LOW** — Nice-to-have; defer to Phase 2.

---

## 2. Critical Gaps (Production Blockers)

### GAP-C01 — No Database

**Current state:** All data lives in a JavaScript in-memory store (`src/lib/mock-data.ts`). Data is lost on every page refresh.

**Required:** PostgreSQL database (Supabase) with the schema defined in `docs/03-postgres-schema.md`.

**Impact:** Without a database, nothing is persisted. This is the most critical gap.

**Effort:** 2–3 days (schema creation + migration setup)

**Depends on:** Supabase project creation

---

### GAP-C02 — No API Layer

**Current state:** Components call `store.addDailyLog()` directly. There is no API server, no HTTP layer, no separation between the UI and data.

**Required:** REST API layer (TanStack Start server routes or Supabase client calls) that reads/writes from the database.

**Impact:** Without an API, there is no path to connect the UI to real data.

**Effort:** 3–5 days

**Depends on:** GAP-C01 (database)

---

### GAP-C03 — No File Storage

**Current state:** Photos use Unsplash placeholder URLs hardcoded in the mock data. No real photos can be uploaded or persisted.

**Required:** Supabase Storage buckets with upload flow (see `docs/08-file-storage-strategy.md`).

**Impact:** The Daily Log form's most distinctive feature (photo documentation) is entirely non-functional.

**Effort:** 2 days

**Depends on:** Supabase project creation

---

### GAP-C04 — No Authentication

**Current state:** Zero authentication. Any user who opens the URL can see all data.

**Required:** Supabase Auth with email/password login before any client-facing deployment.

**Impact:** Cannot share the system with clients or field employees without authentication.

**Effort:** 2–3 days (auth flow, session management, protected routes)

**Depends on:** GAP-C01, GAP-C02

---

### GAP-C05 — No Real Photo Upload Flow

**Current state:** The daily log form has a photo section in the UI but no actual upload mechanism. Photos are not saved.

**Required:** Client-side compression + Supabase Storage upload + photo record creation.

**Impact:** Core feature of daily logs is missing.

**Effort:** 2 days

**Depends on:** GAP-C03, GAP-C04

---

## 3. High Priority Gaps (MVP Value Proposition)

### GAP-H01 — No PDF Generation

**Current state:** "Export PDF" button exists in the Reports UI but does nothing (placeholder).

**Required:** Server-side PDF generation (see `docs/05-report-generation-engine.md`). A construction company cannot deliver reports to clients without PDFs.

**Impact:** The core output of the entire system (the report) cannot be delivered.

**Effort:** 3–4 days (Edge Function + HTML template + Puppeteer or managed PDF service)

**Depends on:** GAP-C01, GAP-C02

---

### GAP-H02 — Report Content Not Stored as Snapshot

**Current state:** Reports are metadata-only records. There is no mechanism to freeze report content after sending.

**Required:** When a report is marked `sent`, a PDF snapshot must be generated and stored immutably in Supabase Storage.

**Impact:** Without snapshots, a sent report can silently change if someone edits the source daily log. This is a legal/compliance risk for a construction documentation system.

**Effort:** 1 day (add `pdf_storage_key` column + trigger snapshot on status change to `sent`)

**Depends on:** GAP-H01

---

### GAP-H03 — No Data Validation at API Boundary

**Current state:** The mock store has minimal validation. `store.addDailyLog()` accepts whatever it receives.

**Required:** Zod schemas validating all API inputs. The project already uses Zod for form validation — extend this to the API layer.

**Impact:** Without server-side validation, bad data will corrupt the database.

**Effort:** 1–2 days

**Depends on:** GAP-C02

---

### GAP-H04 — No Unique Log Constraint Enforcement in UI

**Current state:** Nothing prevents a user from submitting two daily logs for the same project on the same date.

**Required:** UI check before submitting + database constraint (see `docs/03-postgres-schema.md` UNIQUE constraint on `daily_log(project_id, date)`).

**Impact:** Duplicate logs break report generation and corrupt project data.

**Effort:** 0.5 days (DB constraint already designed; UI check is a `useQuery` + conditional in the form)

**Depends on:** GAP-C01

---

### GAP-H05 — No Log Immutability After Report Sent

**Current state:** Daily logs can be edited at any time. No enforcement of immutability.

**Required:** Database trigger preventing edits to logs with `sent` reports (see `docs/05-report-generation-engine.md`).

**Impact:** Editing a log after its report was sent to a client creates legal risk (delivered document no longer matches database).

**Effort:** 0.5 days (trigger is pre-designed in docs/05)

**Depends on:** GAP-C01

---

### GAP-H06 — TanStack Query Not Connected to Any Data Source

**Current state:** `@tanstack/react-query` is installed but not used. `useStore()` is called directly in all components.

**Required:** Migrate all data access to React Query hooks backed by the API layer.

**Impact:** Without React Query, there is no cache management, no optimistic updates, no background refresh. The app will feel stale and require manual refreshes.

**Effort:** 2–3 days

**Depends on:** GAP-C02

---

## 4. Medium Priority Gaps

### GAP-M01 — No Excel Export

**Current state:** "Export Excel" button exists but does nothing.

**Required:** ExcelJS-based export generating weekly/monthly summaries in Excel format.

**Impact:** Many construction managers prefer Excel for data analysis. Not a blocker for daily log submission or report delivery, but affects adoption.

**Effort:** 2 days

---

### GAP-M02 — No Comment Functionality (Issues)

**Current state:** Issues have a `comments` array in the mock data but no UI for adding comments.

**Required:** Comment input UI on Issue detail + API endpoint for comment creation.

**Impact:** Issues need discussion threads to be useful for contractor coordination. Without comments, issues become static and uncommunicative.

**Effort:** 1 day

---

### GAP-M03 — No Pagination on Lists

**Current state:** All lists load all items with no pagination. 

**Required:** Pagination on daily logs list, issues list, reports list. As data grows, loading 500 logs at once is untenable.

**Impact:** Performance degrades with real data. Not critical for 3 projects with 60 logs, but becomes critical at 20+ projects.

**Effort:** 1–2 days

---

### GAP-M04 — Work Description is an Unstructured Array

**Current state:** Work description is stored as `jsonb` (array of strings). There is no ability to link a work item to a specific photo.

**Required:** Maintain the string array but add an optional `relatedWorkItemIndex` to the Photo entity, linking a photo to a specific work item.

**Impact:** In the original paper diary, photos are annotated against specific work items. This traceability is valuable for construction documentation.

**Effort:** 0.5 days (schema change + UI change in photo uploader)

---

### GAP-M05 — No Project Activity Timeline

**Current state:** Project detail page shows tabs for logs, issues, blockers, decisions. There is no unified timeline view.

**Required:** A chronological activity feed showing all events on a project: log submitted, issue opened, blocker created, decision made.

**Impact:** Management wants to see "what happened on this project" at a glance. The current tab structure requires switching tabs to build a mental picture.

**Effort:** 2 days

---

### GAP-M06 — No Mobile-Optimized Log Submission Form

**Current state:** The daily log form (`daily-logs.new.tsx`) is a standard form. It works on mobile but is not optimized for field use.

**Required:** Streamlined mobile-first form with large tap targets, camera-first photo capture, voice-to-text for work description (Phase 2).

**Impact:** Field managers submit logs from construction sites on mobile. A form optimized for desktop will create friction and reduce adoption.

**Effort:** 2–3 days for mobile optimization

---

## 5. Low Priority Gaps (Phase 2+)

### GAP-L01 — No Weekly/Monthly Report Generation

**Current state:** Only daily reports exist. Weekly and monthly report types are defined in the schema but not implemented.

**Effort:** 3 days | **Phase:** 2

---

### GAP-L02 — No Client Portal

**Current state:** Reports must be shared manually (PDF download + email).

**Effort:** 5–7 days | **Phase:** 2

---

### GAP-L03 — No Push Notifications

**Current state:** No notifications for new logs, missing logs, or decision approvals.

**Effort:** 3 days | **Phase:** 3

---

### GAP-L04 — No Offline Support for Field Entry

**Current state:** App requires internet connectivity.

**Effort:** 5–7 days (Service Worker + IndexedDB sync) | **Phase:** 3

---

### GAP-L05 — No User Management UI

**Current state:** Users would need to be created directly in Supabase dashboard.

**Effort:** 2 days | **Phase:** 2

---

### GAP-L06 — No Audit Log

**Current state:** No history of who changed what and when.

**Effort:** 3 days | **Phase:** 3

---

## 6. Technical Debt

### TD-01 — IDs Are Not UUIDs in Mock Data

**Current state:** Mock data uses short random strings (`uid()` → 8-character alphanumeric). The database design uses UUIDs.

**Risk:** If mock data IDs leak into tests or seeding scripts that are assumed to be UUID-shaped, errors will occur.

**Resolution:** Replace `uid()` with `crypto.randomUUID()` in mock-data.ts.

---

### TD-02 — Component State vs. Server State Mixed

**Current state:** Some components use `useState` for data that belongs in server state (e.g., filter state is local but loaded data is also local from the store).

**Risk:** Stale state bugs when data changes while a component is mounted.

**Resolution:** Complete React Query migration (GAP-H06).

---

### TD-03 — No TypeScript Strict Mode for Server Types

**Current state:** TypeScript is enabled but the types in `mock-data.ts` serve both as UI types and implied database types. These will diverge when the database is real.

**Resolution:** Create separate `src/types/api.ts` (API response shapes) and `src/types/db.ts` (Supabase generated types), keeping mock-data types for UI-only concerns.

---

### TD-04 — No Error Boundaries Around Data-Fetching Components

**Current state:** `src/lib/error-capture.ts` exists but error boundaries are not consistently applied around query components.

**Risk:** A single failed API call can crash the entire dashboard.

**Resolution:** Wrap each major section (KPI cards, tables, charts) in an `<ErrorBoundary>` with a fallback component.

---

### TD-05 — `manager` Field is a Free Text String

**Current state:** `project.manager`, `dailyLog.submittedBy`, etc. are all text strings. Once authentication is added, these must become FKs to `auth.users`.

**Risk:** Data inconsistency (same person has different name spellings across records).

**Resolution:** Plan for this change in Phase 3. Add a `supabase_user_id` column to project and daily_log in the same migration that enables auth. Keep text fields as display name fallback.

---

## 7. Gap Priority Summary

| Priority | Count | Key Items |
|---|---|---|
| CRITICAL | 5 | Database, API, File Storage, Auth, Photo Upload |
| HIGH | 6 | PDF generation, Report snapshots, Validation, Immutability, React Query migration |
| MEDIUM | 6 | Excel export, Comments, Pagination, Mobile optimization |
| LOW | 6 | Weekly reports, Client portal, Notifications, Offline mode |
| Tech Debt | 5 | UUID consistency, Type separation, Error boundaries |

**Total implementation work for production MVP (Critical + High):** ~20–25 engineering days.
