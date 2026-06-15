# Master Summary — Mehayesod Platform Architecture

> Version 1.1 | 2026-06-15
> Prepared by: Lead Software Architect
> Updated after formal architecture review: decisions 3 and 11–14 added/revised.

---

## Executive Summary

The Mehayesod Construction Project Execution Platform has completed its Phase 1 MVP: a fully functional Hebrew-language, RTL-aware construction management UI running on TanStack Router with in-memory mock data. The platform correctly models the core construction execution workflow — daily logs driving report generation — and the UI has been validated for daily use.

**What was accomplished today:** A complete technical blueprint covering all 10 architecture domains. Development can begin tomorrow morning without any upfront design decisions to make.

**What must happen next:** The platform must be connected to a real database, real file storage, and real authentication before it can be used with actual construction projects or shared with clients. This requires approximately **20–25 engineering days** across 5 phases.

---

## What Exists Today

| Component | Status |
|---|---|
| UI — Daily Log creation form | ✅ Complete (mock data) |
| UI — Dashboard (operational + executive) | ✅ Complete (mock data) |
| UI — Projects, Issues, Blockers, Decisions | ✅ Complete (mock data) |
| UI — Reports list and detail view | ✅ Complete (mock data) |
| Data types and business logic | ✅ Complete in TypeScript |
| Database | ❌ Not implemented |
| File storage | ❌ Not implemented (Unsplash placeholders) |
| Authentication | ❌ Not implemented |
| API layer | ❌ Not implemented |
| PDF generation | ❌ Not implemented (button placeholder) |

---

## Architecture Decisions

### Decision 1: Reports Are Derived, Not Duplicated

Reports store only metadata (status, sent_at, pdf_storage_key). Report **content** is assembled at render time from the source Daily Log. No data duplication. A report is a view over a log, not a copy of it.

**Why:** Changes to the log automatically propagate to the report while it is in `draft` or `ready` state. After the report is `sent`, a PDF snapshot is stored immutably in Supabase Storage. The PDF becomes the authoritative record.

### Decision 2: Single Unique Constraint — One Log Per (Project, Date)

Database enforces `UNIQUE (project_id, date)` on the `daily_log` table. This is the most critical business rule: every workday produces exactly one log per project.

**Why:** Duplicate logs would corrupt report generation and double-count contractor hours and workforce numbers.

### Decision 3: Typed Nullable FKs for Photos (RC-01 — revised from v1.0)

`photo` table uses two nullable FK columns (`daily_log_id`, `issue_id`) with a CHECK constraint enforcing exactly one non-null. The original polymorphic `entity_type + entity_id` pattern was removed.

**Why:** Supabase PostgREST requires real FK constraints to resolve table relationships in auto-join queries. The polymorphic pattern breaks all PostgREST joins on photos — including the report assembly query — causing a runtime error. Typed FKs restore PostgREST join capability, enable ON DELETE CASCADE (eliminating orphaned photos), and allow RLS policies to authorize photo access through the parent entity's FK. Adding a new photo parent type in Phase 2 is a one-line `ALTER TABLE ADD COLUMN` migration.

### Decision 4: Text Over Enum for Status Columns

All status and type columns use `TEXT` with `CHECK` constraints instead of PostgreSQL `ENUM` types.

**Why:** Adding a new enum value in PostgreSQL requires `ALTER TYPE` which can take an `ACCESS EXCLUSIVE` lock on large tables. `CHECK` constraints can be updated without locking. Construction workflows evolve — status values will change.

### Decision 5: TanStack Query as the State Management Layer

`@tanstack/react-query@5` is already installed. It is the correct tool for server-state management: caching, background refresh, optimistic updates, and request deduplication.

**Why:** The current `useSyncExternalStore` pattern works only because data is in-memory. Once data lives in Supabase, React Query handles the complexity of keeping the UI in sync with the server without manual cache management.

### Decision 6: Phase-Gated RLS

RLS is enabled from Phase 3 but starts with permissive "any authenticated user" policies. Strict project-scoped policies come in Phase 5 after the auth model is validated.

**Why:** Premature strict RLS is the most common source of production access bugs. Validate the auth model with permissive policies first, then tighten.

### Decision 7: Server-Side PDF via Edge Function

PDF generation uses a Supabase Edge Function (Node.js + Puppeteer or managed service), not client-side jsPDF.

**Why:** Construction reports contain many photos. Client-side rendering is unreliable on mobile. Hebrew RTL rendering in jsPDF is poor. A server-generated PDF is consistent and correct.

### Decision 8: Direct-to-Storage Upload (No File Proxying)

Photos are uploaded directly from the browser to Supabase Storage via pre-signed URLs. Files never pass through the application server.

**Why:** Field employees upload on construction sites with slow mobile networks. Proxying files through the app server adds latency and increases server bandwidth costs.

### Decision 9: Single Supabase Project Per Environment

Two Supabase projects: `mehayesod-dev` and `mehayesod-prod`. No shared database between environments.

**Why:** Migration mistakes in `dev` must never reach `prod`. Environment isolation is non-negotiable for a system that stores construction legal documentation.

### Decision 10: Region — EU Central (Frankfurt)

Supabase project hosted in `eu-central-1` (Frankfurt).

**Why:** Lowest latency from Israel. Israeli data privacy law (Privacy Protection Law 5741-1981) allows storage in EU under GDPR-equivalent frameworks.

### Decision 11: ON DELETE CASCADE on Report → DailyLog FK (RC-02)

When a daily log is deleted, its associated `draft` or `ready` report is cascade-deleted. A separate BEFORE DELETE trigger blocks deletion of any log whose report has been marked `sent`.

**Why:** The original ON DELETE SET NULL created permanently unrenderable orphan reports. CASCADE is the correct behavior for unsent reports — they are work-in-progress tied to their log. The trigger enforces the critical legal invariant (sent reports = immutable legal documents) without conflating it with the normal delete flow.

### Decision 12: Aggregate Report Deduplication by Partial Unique Index (RC-03)

A partial unique index on `report(project_id, type, date) WHERE type IN ('weekly','monthly')` prevents duplicate weekly and monthly reports per project.

**Why:** The existing `UNIQUE(daily_log_id)` handles daily report deduplication via FK. Aggregate reports have no source log FK — they need their own uniqueness constraint on the (project, type, period) tuple.

### Decision 13: `project_member` Table as Auth Foundation (RC-04)

A `project_member` junction table (project_id, user_id, role) is created now, before authentication is implemented. The `auth.users` FK constraint is added in Phase 3.

**Why:** RLS policies cannot safely read project assignments from JWT claims — JWTs are issued at login and go stale between refreshes. The `project_member` table is the live source of truth. Creating it now makes Phase 3 auth a two-step migration (add FK, write RLS) rather than a simultaneous schema-change-plus-policy rewrite. The table also models multi-PM projects correctly — the current `project.manager` text field cannot represent more than one person.

### Decision 14: Human-Readable Log Numbers (RA-05)

`daily_log.log_number` is an integer auto-incremented per project by a BEFORE INSERT trigger. The display format `LOG-YYYY-NNNNNN` is computed at the API layer from the log's date and the stored integer.

**Why:** The paper diary system uses sequential log numbers in contracts, site meetings, and legal documents ("per Daily Log #47..."). UUIDs cannot fulfill this function. Storing only the integer avoids computed-string storage while preserving the full display format flexibility.

---

## Document Index

| Document | Purpose |
|---|---|
| `docs/01-domain-model.md` | Business entities, relationships, rules, lifecycle |
| `docs/02-erd.md` | Mermaid ERD and relationship explanations |
| `docs/03-postgres-schema.md` | Complete PostgreSQL DDL with indexes and constraints |
| `docs/04-supabase-architecture.md` | Supabase structure, storage buckets, future auth and RLS design |
| `docs/05-report-generation-engine.md` | Report pipeline, snapshot strategy, PDF generation architecture |
| `docs/06-api-design.md` | Complete REST API specification for all modules |
| `docs/07-state-management.md` | TanStack Query structure, cache keys, mutation patterns |
| `docs/08-file-storage-strategy.md` | Photo storage, PDF storage, naming conventions, retention |
| `docs/09-mvp-gap-analysis.md` | Gap analysis ranked Critical/High/Medium/Low |
| `docs/10-implementation-roadmap.md` | 5-phase execution plan with day-by-day schedule |
| `docs/ARCHITECTURE_REVIEW.md` | Formal pre-implementation review — findings and verdict |
| `docs/ARCHITECTURE_CHANGES.md` | Change log for all RC and RA corrections applied post-review |
| `docs/IMPLEMENTATION_APPROVAL.md` | Final approval verdict for migration start |

---

## Recommended Next Step: Tomorrow Morning

**Start with Phase 1 — Database.**

The first task of the day is to produce an **Approval Brief** (per global architecture rules) for the Supabase project creation and database schema. Once approved, create the Supabase projects and run the migrations in the order specified in `docs/10-implementation-roadmap.md`.

**Exact first commands:**
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in the project
supabase init

# Link to the dev project
supabase link --project-ref <dev-project-ref>

# Create the first migration
supabase migration new create_project
# → edit the file, then:
supabase db push
```

**The order matters (updated after RC-01 — issue must precede photo):**
1. `project`
2. `daily_log` (FK → project)
3. `project_member` (FK → project; no auth.users FK yet)
4. `contractor_row`, `equipment_row` (FK → daily_log)
5. `issue` (FK → project, daily_log) ← must come before photo
6. `photo` (FK → daily_log AND issue)
7. `issue_comment` (FK → issue)
8. `blocker`, `decision` (FK → project)
9. `report` (FK → project, daily_log)
10. Triggers, views, seed data

**The single most important thing to get right on Day 1:**
The `UNIQUE (project_id, date)` constraint on `daily_log`. Everything else can be fixed later. If this constraint is missing, duplicate logs will corrupt the entire system.

---

## Assumptions Made in This Blueprint

1. **Supabase is the chosen backend** — The client/business has decided on Supabase. If this changes to AWS, Azure, or another provider, the storage and auth sections need to be rewritten, but the schema (docs/03) and API design (docs/06) remain valid.

2. **One active developer** — Effort estimates assume one developer. With two developers, Phases 1–3 can be parallelized.

3. **Hebrew RTL is required throughout** — Including in PDFs. The HTML report template must be built with `dir="rtl"` and tested with Hebrew fonts (e.g., Noto Sans Hebrew) that are included in the Puppeteer environment.

4. **Construction photo retention = indefinite** — Based on typical Israeli construction documentation requirements. If the client has a different retention policy, adjust the storage lifecycle rules.

5. **No existing user accounts** — Users will be created manually in the Supabase Auth dashboard in Phase 3. A self-service registration flow is not needed for the MVP.

6. **Field managers have smartphone with camera** — The photo upload flow assumes a modern mobile browser with `getUserMedia` / `<input type="file" accept="image/*" capture="environment">` support.
