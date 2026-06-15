# Architecture Review — Mehayesod Platform

> Reviewer: Lead Software Architect
> Review Date: 2026-06-15
> Documents Reviewed: 01-domain-model, 02-erd, 03-postgres-schema, 04-supabase-architecture, 05-report-generation-engine, 09-mvp-gap-analysis

---

## Review Summary

The domain model is conceptually sound. The core entity relationships are correct, the business logic is well-understood, and the PostgreSQL schema demonstrates solid fundamentals. However, **six issues require resolution before implementation begins** — two of them would cause runtime failures in production, and two would require painful schema migrations if not addressed now.

---

## 1. Critical Risks

### RISK-01 — The Polymorphic Photo Join is Broken (Runtime Failure)

**Severity: CRITICAL — Will fail in production**

Document `05-report-generation-engine.md` presents the report assembly query as a single Supabase round-trip:

```typescript
photos:photo!entity_id (storage_key, caption, work_item, area)
```

**This query will not execute.** Supabase PostgREST generates automatic joins exclusively from declared foreign key constraints. The `photo` table has no FK on `entity_id` (by design — it is polymorphic). Without a FK, PostgREST has no relationship to traverse. The query will return a "Could not find a relationship between 'daily_log' and 'photo'" error at runtime.

The entire claim that report assembly can be done in "one round-trip to the database" rests on this broken query. The report rendering module — the core output of the entire platform — would fail immediately upon connecting to a real database.

**Two valid resolutions (choose one before implementing):**

**Option A — Separate queries (no schema change):**
Fetch the daily log in one query, then fetch photos in a second explicit query:
```typescript
const { data: log } = await supabase.from('daily_log').select('...').eq('id', logId);
const { data: photos } = await supabase.from('photo')
  .select('*')
  .eq('entity_type', 'daily_log')
  .eq('entity_id', logId);
```
Two round-trips. Slightly more code. Zero schema changes. Recommended for speed of implementation.

**Option B — Non-polymorphic photo columns (schema change):**
Replace the polymorphic `entity_type/entity_id` pattern with nullable typed FK columns:
```sql
daily_log_id  UUID REFERENCES public.daily_log(id) ON DELETE CASCADE,
issue_id      UUID REFERENCES public.issue(id) ON DELETE CASCADE,
-- constraint: exactly one must be non-null
CHECK (
  (daily_log_id IS NOT NULL)::int +
  (issue_id IS NOT NULL)::int = 1
)
```
Enables native PostgREST joins and DB-level referential integrity. More schema complexity upfront but eliminates the entire class of orphaned photo risk. Recommended if the development timeline allows it.

**Decision required before Day 1 of implementation.**

---

### RISK-02 — `ON DELETE SET NULL` Creates Permanently Empty Reports

**Severity: CRITICAL — Silent data corruption**

The `report` table defines:
```sql
daily_log_id UUID REFERENCES public.daily_log(id) ON DELETE SET NULL
```

If a daily log with a `draft` or `ready` report is deleted, the report record survives with `daily_log_id = NULL`. That report:
- Cannot be rendered (no source data)
- Cannot be detected as invalid without a specific query
- Appears in the reports list with no content
- Will confuse users and corrupt the dashboard counts

The immutability trigger (doc 05) only blocks UPDATE on logs with `sent` reports. It does not block DELETE on logs with `draft`/`ready` reports.

**Required fix:**
Change the FK behavior to either:
```sql
-- Option A: Block deletion if any report exists (safest)
daily_log_id UUID REFERENCES public.daily_log(id) ON DELETE RESTRICT

-- Option B: Cascade delete the report if the log is deleted and not sent
-- (requires trigger logic — more complex)
```
Option A is recommended. A field manager who wants to delete a log must first delete its draft report. This is the correct behavior.

---

### RISK-03 — Missing UNIQUE Constraint Allows Duplicate Weekly/Monthly Reports

**Severity: HIGH — Causes duplicate report records**

The schema enforces `UNIQUE (daily_log_id)` on the `report` table. For daily reports, this prevents duplicates.

For weekly and monthly reports, `daily_log_id` is NULL. The UNIQUE constraint allows multiple NULLs (per SQL standard). There is **no constraint preventing two weekly reports for the same project on the same week**.

If a manager clicks "Generate Weekly Report" twice, two identical report records are created. The dashboard will count them as two separate reports.

**Required fix — add to the schema:**
```sql
-- For weekly/monthly deduplication
CREATE UNIQUE INDEX uq_report_aggregate
ON public.report (project_id, type, date)
WHERE type IN ('weekly', 'monthly');
```

This partial unique index allows multiple daily reports per project (since they're handled by the `daily_log_id` unique constraint) while preventing duplicate aggregate reports.

---

### RISK-04 — JWT Project Scoping Will Become Stale

**Severity: HIGH — Security and usability risk when auth is implemented**

Document `04-supabase-architecture.md` proposes storing project assignments in the JWT `app_metadata`:
```json
{ "app_metadata": { "role": "field_manager", "project_ids": ["pr1", "pr3"] } }
```

RLS policies then check `auth.jwt() -> 'app_metadata' -> 'project_ids'` to scope access.

**The problem:** JWTs are issued at login and refreshed on a schedule (typically every hour). If a field manager is assigned to a new project between token refreshes, they cannot access that project's data until their JWT is refreshed. If a field manager is removed from a project, they retain access until the JWT expires. Both outcomes are incorrect.

**Required architectural addition:**

A `project_member` junction table must exist in the schema. RLS policies must query this table at runtime, not the JWT:

```sql
CREATE TABLE public.project_member (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL DEFAULT 'field_manager'
                CHECK (role IN ('field_manager','company_manager','admin')),
    added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_project_member UNIQUE (project_id, user_id)
);
```

RLS policy example (instead of JWT claims array):
```sql
CREATE POLICY "field_manager_read_own_projects_logs"
ON public.daily_log FOR SELECT
TO authenticated
USING (
    project_id IN (
        SELECT pm.project_id FROM public.project_member pm
        WHERE pm.user_id = auth.uid()
    )
);
```

This table also resolves the `project.manager` free-text field problem — the primary manager is the `project_member` row with `role = 'company_manager'` or whichever role is designated as lead.

**This table needs to be in the schema now.** Adding it after RLS is live requires a coordinated migration and RLS rewrite.

---

## 2. Database Review

### 2.1 Constraints

| Constraint | Assessment |
|---|---|
| `UNIQUE (project_id, date)` on `daily_log` | **CORRECT** — The single most important constraint in the system |
| `CHECK (date <= CURRENT_DATE)` on `daily_log` | **CORRECT** — Prevents future-dated logs |
| `UNIQUE (daily_log_id)` on `report` (allows multiple NULLs) | **CORRECT** for daily reports; **MISSING** aggregate constraint (see RISK-03) |
| `CHECK` constraints on all status/type columns | **CORRECT** — Correct choice over ENUM types |
| `ON DELETE RESTRICT` on `project_id` FKs | **CORRECT** — Projects cannot be accidentally deleted |
| `ON DELETE CASCADE` on contractor/equipment rows | **CORRECT** — Sub-entities follow their parent |
| `ON DELETE SET NULL` on `report.daily_log_id` | **INCORRECT** — See RISK-02 |
| Missing: `CHECK (target_date >= start_date)` on `project` | **GAP** — Noted as "Phase 2" in docs but safe to add now at zero cost |

**Gap: No constraint on `work_hours` format.** The field is free text. Entries like "07:00-15:00", "7AM-3PM", and "שבע בוקר" are all accepted. This will create inconsistent data that cannot be queried. Recommended: either two `TIME` columns (`work_start`, `work_end`) or a `CHECK` constraint enforcing HH:MM-HH:MM format. Flagged as a future migration risk.

---

### 2.2 Indexes

| Index | Assessment |
|---|---|
| `idx_daily_log_project_id` | **REDUNDANT** — The composite `idx_daily_log_project_date(project_id, date DESC)` already covers queries filtering by `project_id` alone (leftmost prefix rule). Delete this index. |
| `idx_daily_log_date_desc` | **UNNECESSARY for MVP** — Only useful for cross-project date queries that don't filter by project first. Omit until a real use case is identified. |
| `idx_daily_log_project_date` | **CORRECT** — This is the primary access pattern |
| Partial index on `issue.severity` excluding closed/resolved | **EXCELLENT** — Correct use of partial indexes for executive dashboard |
| Partial index on `blocker` for critical unresolved | **EXCELLENT** |
| `idx_photo_entity (entity_type, entity_id)` | **CORRECT** |
| `idx_comment_entity (entity_type, entity_id, created_at)` | **CORRECT** — The `created_at` suffix enables efficient pagination |
| `idx_report_status` | **LOW VALUE** — Global status index across all projects is rarely the primary filter. Consider replacing with `INDEX(project_id, status)` |

**Summary:** Remove `idx_daily_log_project_id` and `idx_daily_log_date_desc`. Add the aggregate report uniqueness index from RISK-03.

---

### 2.3 Cascading Behavior

| Relationship | Behavior | Assessment |
|---|---|---|
| `project` → `daily_log` | RESTRICT | CORRECT |
| `project` → `issue` | RESTRICT | CORRECT |
| `project` → `blocker` | RESTRICT | CORRECT |
| `project` → `decision` | RESTRICT | CORRECT |
| `project` → `report` | RESTRICT | CORRECT |
| `daily_log` → `contractor_row` | CASCADE | CORRECT |
| `daily_log` → `equipment_row` | CASCADE | CORRECT |
| `daily_log` → `report` (via daily_log_id) | SET NULL | **INCORRECT — see RISK-02** |
| `photo` → parent entity | No FK | **RISK — orphaned photos on entity deletion** |

**Orphaned photos:** When a `daily_log` is deleted, any photo records with `entity_type = 'daily_log' AND entity_id = <deleted_id>` become orphaned in the DB, and their corresponding storage objects become unreachable garbage. If RISK-01 is resolved by switching to Option B (non-polymorphic), ON DELETE CASCADE handles this automatically. If staying with Option A (polymorphic, separate queries), a cleanup procedure must be planned.

---

### 2.4 ERD Inconsistency

The ERD in doc 02 shows:
```
ISSUE ||--o{ COMMENT : "has"
```

But the schema in doc 03 allows `comment.entity_type IN ('issue','blocker','decision')`. Comments on blockers and decisions are in the schema but absent from the ERD.

This inconsistency is benign today but will mislead future developers reading the ERD as the authoritative reference. The ERD must be updated to reflect actual schema capabilities.

---

## 3. Future Readiness Review

### 3.1 Authentication — Needs One Schema Addition

Adding authentication to the current schema requires:
1. Adding a `project_member` table (see RISK-04 — required now)
2. Adding a nullable `user_id` FK column to `daily_log.submitted_by`, `issue.assigned_to`, `decision.requested_by`, `decision.owner`, `blocker.responsible`

The text fields serve as the bridge: keep `submitted_by TEXT` for display and human-readable history, and add `submitted_by_user_id UUID REFERENCES auth.users(id)` as a nullable FK. In Phase 3, the migration populates the FK column from the text field where a match is found.

**Readiness: ACCEPTABLE** if `project_member` table is added now. The remaining changes are non-breaking column additions.

---

### 3.2 Multiple Field Managers Per Project

Currently the schema assumes one manager per project (text field). In practice:
- A large project has a site manager, a sub-PM, and a foreman
- Multiple people may need to submit logs on different days
- A field manager may rotate across projects during a year

The `project_member` table (RISK-04) solves this completely. Without it, multi-PM projects are not representable.

**Readiness: BLOCKED** until `project_member` is added.

---

### 3.3 Client Access

`project.client` is a free-text string. A client portal requires:
- Client entity with contact email, company name, contact person
- One project can have one client; one client may have multiple projects
- Client-scoped RLS: clients see only their own projects and only the reports for those projects

The migration from `project.client TEXT` to `project.client_id UUID FK` requires:
- Creating a `client` table
- Inserting de-duplicated client records from existing text values
- Updating the FK column
- Dropping the text column

This migration is **much harder once data is in production** because the free-text values will have spelling variations and duplicates. For example: "יזמות בן-דוד בע״מ" and "יזמות בן דוד" and "בן דוד יזמות" are likely the same client.

**Recommendation:** Either add a minimal `client` table now (id, name, contact_email, phone) and use `client_id UUID` on project, or accept that this migration will require manual data cleanup later.

**Readiness: POOR** for future client portal without schema change now.

---

### 3.4 Contractors as Entities

`contractor_row.contractor`, `issue.responsible_contractor`, `blocker.responsible` are all free-text strings. If contractor management is ever needed:
- Contractor analytics (total worker-days per contractor per month) will have spelling-variation errors
- Sending a contractor a list of open issues requires a contact email — not stored anywhere
- Contractor accountability tracking is unreliable on text names

**Recommendation for MVP:** Keep as-is. Add a note in the schema that contractor text fields must use a controlled vocabulary (a dropdown, not free text) in the UI — this prevents the spelling variation problem without a schema change.

**Readiness: ACCEPTABLE** for MVP if UI enforces controlled input.

---

### 3.5 Issues Linked to Daily Logs

Currently there is no relationship between `issue` and `daily_log`. An issue has no reference to when or in which log it was first observed. This creates a gap:

- The daily report cannot list "issues observed today" because there's no link
- A retrospective investigation ("when was this first noted?") requires searching log descriptions manually

**Missing link:** An optional `discovered_in_log_id UUID REFERENCES daily_log(id)` on the `issue` table. This is cheap to add now and enables report enrichment later.

---

## 4. MVP Simplification Review

### 4.1 What is Over-Engineered for MVP

| Item | Assessment | Recommendation |
|---|---|---|
| `exports` storage bucket | The Excel export in doc 05 is client-side (ExcelJS in browser). No file storage is needed for client-side exports. The exports bucket is only useful for server-generated exports. | **Remove the `exports` bucket from MVP scope.** Generate Excel in the browser; serve directly to the user without touching storage. |
| `comment.entity_type` supporting `blocker` and `decision` | Only issue comments are in the domain model. The polymorphic design pre-builds for blocker and decision comments that are not planned. | **Simplify to `issue_id UUID FK` (direct FK, non-polymorphic)**. This also resolves the PostgREST join issue for comment queries. Named `issue_comment` if desired. |
| `v_project_health` view in the database | A database view that joins 4 tables is harder to maintain than an equivalent SQL query in the API layer. The view is not wrong, but it's one more object to manage and version. | **Acceptable for MVP** — the view is useful. Keep it, but document that it may be retired in Phase 5 if a materialized view or computed columns become necessary for performance. |
| Multiple status transitions that aren't needed yet | The decision lifecycle includes `deferred → pending` reconsideration. The issue lifecycle has `reopened`. These are correct business rules, not over-engineering. | **Keep all statuses** — removing them would require a schema migration to add back. |
| `sort_order` on `contractor_row` and `equipment_row` | Essential — the paper diary has a specific contractor order that must be preserved in the report. | **Keep — not over-engineered.** |

### 4.2 What Must Not Be Postponed

These items were marked as "Phase 2" or "later" in the docs but should be in the schema now — adding them later requires migrations on populated tables:

| Item | Why Now |
|---|---|
| `project_member` table | Required for auth RLS design. Adding this after auth is live requires a multi-step migration and RLS rewrite. |
| `CHECK (target_date >= start_date)` on `project` | Zero cost to add now; requires `ALTER TABLE` later on a table with live data. |
| `resolved_at TIMESTAMPTZ` on `issue` and `blocker` | Missing column for analytics. Adding after go-live loses historical resolution timestamps. |
| `discovered_in_log_id` on `issue` | Inexpensive FK column. Adding after issue data is entered loses the discovery linkage. |

---

## 5. Missing Business Requirements

### BR-01 — No `resolved_at` Timestamp on Issues and Blockers

**Impact: HIGH**

The domain model tracks issue lifecycle: open → in_progress → resolved → closed. But there is no `resolved_at TIMESTAMPTZ` column on either `issue` or `blocker`.

The `updated_at` trigger fires on ANY update to the row. A comment being added, severity being changed, or the assigned person being updated all change `updated_at`. You cannot query `updated_at` to determine when something was resolved.

Without `resolved_at`, the system cannot answer:
- "Average time to close a critical issue"
- "Blockers unresolved beyond their due date"
- "How long did this blocker delay the project?"

These are standard construction project KPIs. **Add `resolved_at TIMESTAMPTZ NULL` to both `issue` and `blocker`.** Set it via a trigger when `status` changes to `resolved` or `closed`.

---

### BR-02 — No Sequential Log Number Per Project

**Impact: MEDIUM**

The paper diary that this system replaces uses sequential log numbers: Day 1, Day 2, Day 3... These numbers appear on the printed diary for legal and reference purposes ("per our Daily Log #47, the concrete pour was approved...").

The current schema uses UUID as the only identifier. UUIDs are not human-readable and cannot be cited in contracts, site meetings, or legal disputes.

**Required:** A `log_number INTEGER` column on `daily_log`. This should be auto-incremented per project (not globally), so project "הצלפים 24" has logs 1, 2, 3... independently of other projects.

Implementation:
```sql
-- Add column
ALTER TABLE public.daily_log ADD COLUMN log_number INTEGER;

-- Generate via trigger or use a sequence per project
-- Simpler: compute on insert via
-- SELECT COALESCE(MAX(log_number), 0) + 1 FROM daily_log WHERE project_id = NEW.project_id
-- (advisory lock or serializable transaction required to avoid race condition)
```

Alternatively: derive it on-read from `ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY date ASC)`. This avoids storing it but complicates queries.

---

### BR-03 — No Blocker-to-Decision Linkage

**Impact: MEDIUM**

A blocker is frequently resolved by a management decision. Example: "Concrete supplier delay" (blocker) → "Approve alternative supplier" (decision) → blocker resolved.

Currently there is no FK between `blocker` and `decision`. The system cannot show "this blocker was resolved by decision X" or "this decision unblocked Y."

**Optional FK:** `blocker.resolved_by_decision_id UUID REFERENCES public.decision(id) NULL`

Not strictly required for MVP but cheap to add now. Enables high-value reporting ("which decisions had the most impact on unblocking projects").

---

### BR-04 — No Issue-to-Daily-Log Discovery Linkage

**Impact: MEDIUM**

When a field manager submits a daily log describing defects observed that day, and separately creates an issue for the same defect, there is no system link between the two records. The report cannot list "issues first observed today."

**Required:** `issue.discovered_in_log_id UUID REFERENCES public.daily_log(id) NULL`

This is a nullable, optional FK. The UI presents it as "reported during which log?" in the issue creation form. Once this exists, the daily report can include a section: "New issues observed today."

---

### BR-05 — No Weather Condition Structure

**Impact: LOW for MVP, MEDIUM for analytics**

`daily_log.weather` is free text. This is acceptable for the paper diary replacement but limits future value:
- Can't query "how many days of rain delay this project had"
- Can't flag "today's exceptional events say work was stopped — update project timeline"
- Can't correlate weather with productivity

**MVP:** Keep as free text. **Phase 2:** Add `weather_condition TEXT CHECK (... 'sunny','cloudy','rain','storm','extreme_heat','snow')` and `temperature_celsius INTEGER NULL` alongside the free-text field (not replacing it).

---

### BR-06 — No Company/Organization Entity

**Impact: LOW for MVP, HIGH for SaaS**

The entire system assumes one construction company (Mehayesod). There is no `organization` or `company` table. If this product is ever sold to multiple construction companies, all data is globally scoped with no tenant isolation.

For MVP as a single-company internal tool: not a problem. Flag this risk if the business goal is to commercialize the platform to multiple companies. The multi-tenant refactor is a fundamental schema change.

---

## 6. Final Recommendation

---

## ⚠️ REQUIRES ARCHITECTURE CHANGES

---

**The schema cannot be implemented in its current form without fixing four issues before migrations are written.**

### Required Changes (Block Implementation)

| # | Change | Location | Effort |
|---|---|---|---|
| **RC-01** | Decide on polymorphic vs. non-polymorphic photo pattern. If staying polymorphic, remove the single-query join from doc 05 and replace with two separate queries. If switching to typed FKs, update the photo table schema. | `docs/03-postgres-schema.md` + `docs/05-report-generation-engine.md` | 2–4 hours to decide and update docs; 0.5 days if schema changes |
| **RC-02** | Change `report.daily_log_id` FK from `ON DELETE SET NULL` to `ON DELETE RESTRICT` | `docs/03-postgres-schema.md` | 15 minutes |
| **RC-03** | Add `CREATE UNIQUE INDEX uq_report_aggregate ON report(project_id, type, date) WHERE type IN ('weekly','monthly')` | `docs/03-postgres-schema.md` | 15 minutes |
| **RC-04** | Add `project_member` table to the schema | `docs/03-postgres-schema.md` + `docs/04-supabase-architecture.md` | 1 hour to update docs |

### Recommended Additions (Add Before First Migration)

| # | Addition | Effort |
|---|---|---|
| **RA-01** | Add `resolved_at TIMESTAMPTZ NULL` to `issue` and `blocker` | 15 minutes |
| **RA-02** | Add `discovered_in_log_id UUID FK NULL` to `issue` | 15 minutes |
| **RA-03** | Add `CHECK (target_date >= start_date)` to `project` | 5 minutes |
| **RA-04** | Remove redundant `idx_daily_log_project_id` index | 5 minutes |
| **RA-05** | Add `log_number INTEGER` to `daily_log` | 30 minutes (include auto-increment strategy) |

### Approved As-Is

| # | Item | Notes |
|---|---|---|
| ✅ | Core domain model | Entities, lifecycles, and business rules are correct |
| ✅ | `UNIQUE (project_id, date)` on `daily_log` | Most critical constraint, correctly placed |
| ✅ | `TEXT + CHECK` over `ENUM` for status columns | Correct choice for evolvability |
| ✅ | Polymorphic `comment` table | Acceptable for MVP if issue is the only current target |
| ✅ | `jsonb` for `work_description` | Correct — unstructured list with no relational query need |
| ✅ | `ON DELETE CASCADE` on contractor/equipment rows | Correct cascade for sub-entities |
| ✅ | Partial indexes on issue severity and blocker priority | Well-designed |
| ✅ | `updated_at` trigger design | Correct implementation |
| ✅ | `v_projects_missing_log_today` view | Correct and useful |
| ✅ | EU-Central region selection | Correct for Israel latency and data residency |
| ✅ | Phase-gated RLS approach | Correct — avoid premature RLS |
| ✅ | Service role key never in frontend | Correct security boundary |
| ✅ | Report content assembled at render time (no duplication) | Core architectural decision is sound |
| ✅ | Immutability trigger after report is sent | Correct legal safeguard |
| ✅ | Gap analysis completeness | Comprehensive and correctly prioritized |

---

### Implementation Clearance

The architecture may proceed to implementation **after** RC-01 through RC-04 are resolved and the affected documents are updated. The four required changes are small in scope and do not require redesigning any entity. They should take no more than half a day to document and apply to the migration files.

**Do not write migration files until the schema document reflects all required changes above.**
