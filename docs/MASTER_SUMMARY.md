# Master Summary — Mehayesod Platform Architecture

> Version 1.0 | 2026-06-14
> Prepared by: Lead Software Architect

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

### Decision 3: Polymorphic Photos and Comments

`photo` and `comment` tables use `entity_type + entity_id` instead of multiple nullable FK columns.

**Why:** Photos can attach to daily logs, issues, and (future) decisions. A polymorphic pattern allows adding new attachable entity types without schema changes. Trade-off: no DB-level FK constraint; application layer enforces integrity.

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

**The order matters:**
1. Create `project` table first (no dependencies).
2. Create `daily_log` (depends on `project`).
3. Create `contractor_row` and `equipment_row` (depend on `daily_log`).
4. Create `photo` (polymorphic — no FK, can go anywhere).
5. Create `report` (depends on `project` and `daily_log`).
6. Create `issue`, `comment`, `blocker`, `decision` (depend on `project`).
7. Add triggers and views last.

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
