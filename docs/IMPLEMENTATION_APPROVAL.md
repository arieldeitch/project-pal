# Implementation Approval — Mehayesod Platform

> Version 1.0 | 2026-06-15
> Prepared by: Lead Software Architect
> Follows: docs/ARCHITECTURE_REVIEW.md findings

---

## Fixed Issues

All four required changes and all five recommended additions from the architecture review have been applied to the documentation set.

### Required Changes — All Resolved

| ID | Finding | Resolution | Documents Updated |
|---|---|---|---|
| RC-01 | Polymorphic photo join incompatible with PostgREST — runtime failure in report rendering | Switched to typed nullable FK columns (`daily_log_id`, `issue_id`) with CHECK constraint. Comment table converted similarly (`issue_comment`). | 01, 02, 03, 05 |
| RC-02 | `ON DELETE SET NULL` creates permanently unrenderable orphan reports | Changed to `ON DELETE CASCADE`. Added BEFORE DELETE trigger blocking deletion of logs with `sent` reports. | 03 |
| RC-03 | No uniqueness constraint prevents duplicate weekly/monthly reports | Added `UNIQUE INDEX (project_id, type, date) WHERE type IN ('weekly','monthly')`. | 02, 03 |
| RC-04 | JWT project_ids scoping goes stale; no junction table for multi-PM projects | Added `project_member` table (project_id, user_id, role). Updated RLS policy templates to query this table. Removed `project_ids` from JWT claims design. | 01, 02, 03, 04, MASTER |

### Recommended Additions — All Applied

| ID | Addition | Resolution | Documents Updated |
|---|---|---|---|
| RA-01 | Missing `resolved_at` on issues and blockers — analytics impossible | Added `resolved_at TIMESTAMPTZ NULL` to both tables. Added `set_resolved_at` trigger. | 01, 02, 03 |
| RA-02 | No issue-to-daily-log discovery linkage | Added `discovered_in_log_id UUID FK → daily_log` (nullable, ON DELETE SET NULL). | 01, 02, 03 |
| RA-03 | Missing `CHECK (target_date >= start_date)` on project; `workers >= 0` too permissive | Added date order CHECK to project. Tightened `workers >= 1` and `quantity >= 1` on child tables. | 03 |
| RA-04 | Two redundant indexes on daily_log | Removed `idx_daily_log_project_id` and `idx_daily_log_date_desc`. Improved `idx_report_status` to `idx_report_project_status`. | 02, 03 |
| RA-05 | No human-readable log numbering — UUIDs cannot be cited in contracts | Added `log_number INTEGER` with BEFORE INSERT trigger for per-project auto-increment. UNIQUE (project_id, log_number) as backstop. Display format `LOG-YYYY-NNNNNN` computed at API layer. | 01, 02, 03, MASTER |

---

## Remaining Risks

The following are acknowledged risks that are **not blocking implementation**. They are tracked for Phase 2+ attention.

### REM-01 — `work_hours` Stored as Unstructured Text (Low Risk for MVP)

`daily_log.work_hours` is a free-text field ("07:00-15:00"). No format validation exists at the DB level. This prevents querying shift start/end times for payroll analytics or work-stoppage detection.

**Accepted for MVP.** The construction execution use case does not yet require shift analytics. A future migration can add `work_start TIME` and `work_end TIME` columns.

**Mitigation:** The UI input in `daily-logs.new.tsx` should enforce a consistent HH:MM-HH:MM format at the form validation layer (Zod), preventing the worst inconsistencies before they reach the database.

---

### REM-02 — Contractor Names Are Free Text (Medium Risk, Phase 2)

`contractor_row.contractor`, `issue.responsible_contractor`, and `blocker.responsible` are all text fields. The same contractor entered as "א.ש שלד" and "א.ש. שלד" (with a period) is treated as two different contractors. Workforce analytics (total worker-days per contractor per month) will have data quality issues.

**Accepted for MVP.** Adding a `contractor` master table and converting these fields to FKs is a Phase 2 data migration that requires collecting canonical contractor names from users.

**Mitigation:** UI autocomplete (a dropdown sourced from a static list of known contractors per project) reduces spelling variation without a schema change. Implement this in the daily log form.

---

### REM-03 — `project.client` Cannot Support a Client Portal (Phase 2)

`project.client` is a free-text field. A client portal requires a `client` entity with email, company, and contact person, plus a FK from `project.client_id`. The current free-text field will need manual deduplication before it can be migrated to a FK.

**Accepted for MVP.** Client portal is explicitly Phase 2. The migration complexity is acknowledged and will require a data cleanup script.

---

### REM-04 — No Blocker-to-Decision Linkage (Low Risk, Phase 2)

A blocker is often resolved by a specific management decision. There is no FK between `blocker` and `decision`. The "this blocker was unblocked by decision X" relationship is not captured.

**Accepted for MVP.** `blocker.resolved_by_decision_id UUID NULL FK → decision` can be added as a nullable column in Phase 2 without breaking existing data.

---

### REM-05 — `project_member.user_id` Has No FK Constraint Until Phase 3 (Design Risk)

`project_member.user_id` is a UUID with no FK constraint until `auth.users` exists. In the period between the Phase 1 database creation and Phase 3 authentication enablement, this column holds no referential integrity.

**Accepted.** The table will be empty (or contain seed/test UUIDs) during this period. The Phase 3 migration adds: `ALTER TABLE project_member ADD CONSTRAINT fk_pm_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`. The risk is confined to the development phase; no production data is at risk.

---

### REM-06 — `log_number` Race Condition at High Concurrency (Negligible Risk for MVP)

The `assign_log_number` trigger uses `SELECT MAX(log_number) + 1` without an advisory lock. At high concurrency (multiple simultaneous inserts for the same project), two inserts could theoretically read the same MAX and attempt to assign the same number. The `UNIQUE (project_id, log_number)` constraint would reject one with a unique violation error.

**Accepted for MVP.** One field manager per project submits one log per day. Concurrent inserts for the same project are not a realistic scenario. At scale, the trigger can be replaced with a Postgres sequence per project or a `FOR UPDATE` lock on the project row.

---

### REM-07 — `v_project_health` View Performance at Scale (Monitor in Phase 5)

The view performs four LEFT JOINs with `COUNT DISTINCT` + `FILTER` aggregates. At MVP scale (3–10 projects, hundreds of records), this is fast. At 20+ projects with years of data, this query may become slow.

**Accepted for MVP.** Add a `EXPLAIN ANALYZE` benchmark in Phase 5. If slow, convert to a materialized view (refreshed on schedule or on-demand) or push the aggregation into the API layer as separate targeted queries.

---

## Architecture Status

---

## ✅ APPROVED FOR MIGRATION

---

All four required changes from the architecture review have been implemented in the documentation. All five recommended additions have been applied. The schema in `docs/03-postgres-schema.md` is the authoritative source for migration file authoring.

### Pre-Migration Checklist

Before writing the first migration file, confirm:

- [ ] `docs/03-postgres-schema.md` v1.1 is the reference (not v1.0)
- [ ] Migration order follows the corrected sequence in `docs/03` (issue before photo)
- [ ] Supabase project creation Approval Brief has been prepared (per global architecture rules)
- [ ] Dev and prod project names confirmed: `mehayesod-dev`, `mehayesod-prod`
- [ ] Region confirmed: `eu-central-1` (Frankfurt)
- [ ] `.env.local` will hold `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (never service role key)

### First Migration File

The first command after Supabase CLI setup:

```bash
supabase migration new create_project
```

The first migration must contain the `project` table DDL exactly as written in `docs/03-postgres-schema.md`. Do not combine multiple tables in one migration file — one table per file enables clean rollback.

### Migration Filename Convention

```
20260615000001_create_project.sql
20260615000002_create_daily_log.sql
20260615000003_create_project_member.sql
...
```

Timestamps must increase monotonically. Never modify a migration file after it has been applied to any environment.
