# Domain Model — Mehayesod Construction Project Execution Platform

> Version 1.1 | 2026-06-15
> Changes from v1.0: RC-01 (photo typed FKs), RC-04 (project_member added), RA-01 (resolved_at), RA-02 (discovered_in_log_id), RA-05 (log_number)

---

## 1. Overview

Mehayesod is a **Construction Project Execution Control System**. The platform's central purpose is to replace the manual daily work diary process used by construction project managers. It is emphatically **not** a generic project management tool.

The system has three audiences with different needs:

| Audience | Primary Goal |
|---|---|
| Field Project Manager | Create daily logs quickly from the site |
| Company Management (CEO, Ops) | Visibility into all projects, blockers, and decisions |
| Client | Receive structured reports on project progress |

---

## 2. Business Entities

### 2.1 Project

The top-level container. Everything in the system belongs to a project.

**Attributes:**
- `id` — surrogate key
- `name` — human-readable project name (e.g., "הצלפים 24")
- `address` — site address
- `client` — client company or individual name (text field; becomes FK to `client` table in Phase 2)
- `manager` — legacy display field for the primary manager's name; authoritative membership is in `project_member`
- `status` — lifecycle stage: `planning | active | on_hold | completed`
- `startDate` — contract start
- `targetDate` — target completion; must be >= `startDate`

**Invariants:**
- A project must have at least one `project_member` with role `company_manager` or `admin`.
- Only `active` projects require daily logs.
- `planning` projects may have blockers but not daily logs.
- `target_date >= start_date` enforced by CHECK constraint.

---

### 2.2 Daily Log (Primary Entity)

The Daily Log is the **most important entity** in the system. Every workday must produce exactly one Daily Log per active project. The Daily Log is the raw input from which all reports are derived.

**Attributes:**
- `id` — surrogate key
- `projectId` — FK to Project
- `date` — ISO date (YYYY-MM-DD); unique per project; cannot be a future date
- `logNumber` — sequential integer per project, assigned automatically on creation. Display format: `LOG-{YYYY}-{NNNNNN}` (e.g., `LOG-2026-000047`). The formatted string is computed at render time; only the integer is stored.
- `submittedBy` — display name of field employee (becomes FK to users in Phase 3)
- `workHours` — work shift range as text (e.g., "07:00-15:00")
- `weather` — free text (e.g., "חמים, 28°")
- `exceptionalEvents` — free text; default "אין"
- `contractorNotes` — free text; default "אין"
- `workDescription` — ordered list of text work items (stored as `jsonb`)
- `createdAt` — server timestamp when record was persisted

**Child entities (one-to-many within a log):**
- `ContractorRow` — one row per contractor on site
- `EquipmentRow` — one row per equipment type used
- `Photo` — photos taken on site (via `photo.daily_log_id`)

**Invariants:**
- One Daily Log per (project, date) pair — `UNIQUE (project_id, date)`.
- Cannot be created for a future date — `CHECK (date <= CURRENT_DATE)`.
- Once a Report linked to this log has been marked `sent`, the log is immutable (UPDATE blocked by trigger).
- A log with a `sent` report cannot be deleted (DELETE blocked by trigger).
- A log with a `draft` or `ready` report can be deleted — the report is cascade-deleted.

---

### 2.3 ContractorRow

Child of Daily Log. Represents one contractor company working on site for the day.

**Attributes:**
- `id` — surrogate key
- `dailyLogId` — FK to DailyLog (CASCADE delete)
- `contractor` — contractor company name
- `trade` — trade category (e.g., "שלד", "חשמל", "אינסטלציה")
- `workers` — number of workers present; must be >= 1
- `notes` — free text
- `sortOrder` — display order (preserves paper diary sequence)

---

### 2.4 EquipmentRow

Child of Daily Log. Represents one piece or class of equipment used on site.

**Attributes:**
- `id` — surrogate key
- `dailyLogId` — FK to DailyLog (CASCADE delete)
- `name` — equipment name (e.g., "מיני מחפרון")
- `quantity` — count; must be >= 1
- `notes` — free text
- `sortOrder` — display order

---

### 2.5 Photo

Photos are attached to Daily Logs and Issues. Each photo carries site documentation metadata.

**Design (RC-01): Typed Nullable Foreign Keys**

The photo entity uses two nullable FK columns (`dailyLogId`, `issueId`). Exactly one must be non-null, enforced by a CHECK constraint. This replaces the previous polymorphic `entity_type / entity_id` pattern, which was incompatible with Supabase PostgREST's FK-driven join system.

**Attributes:**
- `id` — surrogate key
- `dailyLogId` — FK to DailyLog (nullable; CASCADE delete); set when photo belongs to a daily log
- `issueId` — FK to Issue (nullable; CASCADE delete); set when photo belongs to an issue
- `storageKey` — path in Supabase Storage (e.g., `site-photos/proj-uuid/logs/log-uuid/photo_001.webp`); unique
- `caption` — human-entered description
- `workItem` — which work item this photo documents (free text referencing a work description entry)
- `area` — site area / location label
- `uploadedBy` — display name (becomes FK to users in Phase 3)
- `uploadedAt` — server timestamp

**Constraint:** `(dailyLogId IS NOT NULL)::int + (issueId IS NOT NULL)::int = 1`

**Adding future parent types (Phase 2):** Add `decisionId UUID REFERENCES decision(id) ON DELETE CASCADE` column and update the CHECK constraint. One-line migration, no data migration required.

---

### 2.6 Report

Reports are **system-generated artifacts**, not user-authored documents.

**Attributes:**
- `id` — surrogate key
- `projectId` — FK to Project
- `dailyLogId` — FK to DailyLog (nullable for weekly/monthly; CASCADE delete for daily)
- `type` — `daily | weekly | monthly`
- `date` — date the report covers (for weekly: Monday of the week; for monthly: first of the month)
- `status` — `draft | ready | sent`
- `sentAt` — timestamp when marked as sent (nullable)
- `pdfStorageKey` — path to the immutable PDF snapshot in Supabase Storage (set in Phase 4)
- `pdfGeneratedAt` — when the PDF was generated
- `createdAt` — server timestamp

**Invariants:**
- Each DailyLog produces at most one `daily` Report — `UNIQUE (daily_log_id)`.
- No duplicate weekly/monthly reports per project per period — `UNIQUE INDEX (project_id, type, date) WHERE type IN ('weekly','monthly')`.
- Report **content** is derived on-read from the source Daily Log. Only metadata is stored.
- `ON DELETE CASCADE` on `daily_log_id` — deleting a log auto-deletes its draft/ready report.
- Deleting a log with a `sent` report is blocked by trigger.

---

### 2.7 Issue

Issues are field-observed quality defects, non-conformances, or punch-list items.

**Attributes:**
- `id` — surrogate key
- `projectId` — FK to Project
- `discoveredInLogId` — FK to DailyLog (nullable, `ON DELETE SET NULL`); which daily log first noted this issue
- `title` — short description
- `location` — site area (e.g., "קומה 2 - אזור B")
- `description` — detailed description
- `responsibleContractor` — which contractor must fix it
- `assignedTo` — internal person responsible for tracking
- `dueDate` — resolution deadline
- `severity` — `low | medium | high | critical`
- `status` — `open | in_progress | resolved | reopened | closed`
- `resolvedAt` — timestamp of first resolution; set automatically by trigger when status → `resolved` or `closed`; retained on reopen (captures first resolution for analytics)
- `createdAt` — server timestamp
- `updatedAt` — auto-maintained

**Child entities:**
- `Photo` (via `photo.issue_id`)
- `IssueComment` (via `issue_comment.issue_id`)

---

### 2.8 IssueComment

Threaded comments on Issues.

**Attributes:**
- `id` — surrogate key
- `issueId` — FK to Issue (CASCADE delete)
- `author` — display name (becomes FK to users in Phase 3)
- `body` — comment text
- `createdAt` — server timestamp

**Note:** Renamed from `Comment` in v1.0 and converted to a direct FK (not polymorphic). Comments on Blockers or Decisions are added as separate `blocker_comment` / `decision_comment` tables in Phase 2 if required.

---

### 2.9 Blocker

Blockers are impediments that prevent project progress. They require management intervention, not contractor action.

**Attributes:**
- `id` — surrogate key
- `projectId` — FK to Project
- `title` — short description
- `description` — detailed description
- `impact` — what cannot proceed because of this blocker
- `responsible` — person responsible for resolution
- `dueDate` — target resolution date
- `priority` — `low | medium | high | critical`
- `status` — `open | in_progress | resolved`
- `resolvedAt` — timestamp when first resolved; set by trigger (same mechanism as Issue)
- `createdAt` — server timestamp
- `updatedAt` — auto-maintained

---

### 2.10 Decision

Decisions are management approvals required to unblock work. They create an auditable trail.

**Attributes:**
- `id` — surrogate key
- `projectId` — FK to Project
- `title` — what decision is needed
- `description` — context and options
- `requestedBy` — who is requesting the decision (field manager)
- `owner` — who must make the decision (CEO, architect, chief engineer)
- `dueDate` — when the decision is needed
- `status` — `pending | approved | rejected | deferred`
- `createdAt` — server timestamp
- `updatedAt` — auto-maintained

---

### 2.11 ProjectMember (RC-04)

The junction entity between Projects and system users. Defines who has access to a project and in what role.

**Attributes:**
- `id` — surrogate key
- `projectId` — FK to Project (CASCADE delete — removing a project removes all memberships)
- `userId` — UUID; will gain FK to `auth.users` in Phase 3 when authentication is enabled
- `role` — `field_manager | company_manager | admin | viewer`
- `createdAt` — server timestamp

**Roles:**
| Role | Who | Permissions |
|---|---|---|
| `field_manager` | Field PM, site supervisor | Creates and edits daily logs on assigned projects |
| `company_manager` | CEO, Operations | Full read access; approves decisions; marks reports sent |
| `admin` | System administrator | Full CRUD on all entities |
| `viewer` | Client (future) | Read-only access to reports for assigned projects |

**Constraint:** `UNIQUE (project_id, user_id)` — one membership record per person per project.

**Why now:** Phase 3 RLS policies will query this table to scope field manager access. Creating it after auth is live would require adding the table AND rewriting all RLS policies in a single coordinated migration. Adding it now makes Phase 3 a two-step process: (1) add auth.users FK, (2) write RLS.

---

## 3. Relationships

```
Project (1) ────< DailyLog (many)                    [UNIQUE per project+date]
Project (1) ────< ProjectMember (many)               [access control junction]
Project (1) ────< Issue (many)
Project (1) ────< Blocker (many)
Project (1) ────< Decision (many)
Project (1) ────< Report (many)

DailyLog (1) ────< ContractorRow (many)              [CASCADE delete]
DailyLog (1) ────< EquipmentRow (many)               [CASCADE delete]
DailyLog (1) ────< Photo (many, via daily_log_id)    [CASCADE delete]
DailyLog (1) ──── Report (1, daily type)             [CASCADE delete]
DailyLog (1) ──o< Issue (many, discovered_in_log_id) [SET NULL on delete]

Issue (1) ────< Photo (many, via issue_id)           [CASCADE delete]
Issue (1) ────< IssueComment (many)                  [CASCADE delete]

Report references DailyLog (content derived on-read, no data duplication)
```

---

## 4. Business Rules

### Logging Rules
1. **One Log Per Day Per Project** — `UNIQUE (project_id, date)` constraint.
2. **No Future Logs** — `CHECK (date <= CURRENT_DATE)` constraint.
3. **Sequential Numbering** — `log_number` auto-assigned per project; displayed as `LOG-YYYY-NNNNNN`.
4. **Log Completeness Warning** — A log without contractors is technically valid but should trigger a UI warning.
5. **Missing Log Detection** — Dashboard identifies active projects with no log for today.

### Report Rules
6. **Auto-Generation** — Reports are generated from logs, not authored independently.
7. **No Data Duplication** — Report stores only metadata; content assembled from source log at render.
8. **Immutability After Send** — Once `sent`, the source log is locked from edits and deletion (trigger enforcement).
9. **Cascade Delete** — Draft/ready reports are deleted with their source log.
10. **One Report Per Log** — `UNIQUE (daily_log_id)` constraint.
11. **No Duplicate Aggregates** — Weekly/monthly reports are unique per (project, type, date).

### Issue Rules
12. **Severity Escalation** — Critical issues surface prominently in the Executive Dashboard regardless of project filter.
13. **Reopening** — A `resolved` issue may move to `reopened`; `resolvedAt` is preserved (records first resolution).
14. **Discovery Linkage** — An issue may optionally reference the daily log in which it was first observed.

### Blocker Rules
15. **Critical Blockers Flag Projects** — A project with one or more `critical` open blockers is flagged in the dashboard.
16. **Blocker vs. Issue** — Blockers are management-level impediments; Issues are quality defects for contractor correction.

### Decision Rules
17. **Pending Decisions Block Work** — `pending` decisions represent unresolved approvals that may be blocking field progress.
18. **Audit Trail** — Status transitions should be preserved; a `decision_history` table is Phase 3+.

### Access Rules
19. **Project Scoping** — A `field_manager` can only see and create data in projects where they have a `project_member` record.
20. **Company Managers** — Have read access to all projects.
21. **Single Membership** — `UNIQUE (project_id, user_id)` — one role per person per project.

---

## 5. Data Lifecycle

```
DAILY LOG LIFECYCLE
────────────────────
Field employee submits log
    │
    ├── log_number auto-assigned (trigger)
    ▼
DailyLog created
    │
    ▼
Report auto-created [status: draft]
    │
    ▼
Manager reviews → [status: ready]
    │
    ▼
PDF generated → Report sent → [status: sent]
    │
    ├── DailyLog becomes immutable (UPDATE/DELETE blocked)
    └── PDF snapshot stored in Storage


ISSUE LIFECYCLE
────────────────
Defect observed on site
    │
    ├── Optional: link to discovery log (discovered_in_log_id)
    ▼
Issue created [status: open]
    │
    ▼
Contractor notified → [status: in_progress]
    │
    ▼
Fix completed → [status: resolved]
    │             └── resolved_at set by trigger
    ├── Accepted → [status: closed]
    └── Rejected → [status: reopened] → in_progress (cycle)


BLOCKER LIFECYCLE
──────────────────
Impediment identified → [status: open]
    │
    ▼
Resolution in progress → [status: in_progress]
    │
    ▼
Impediment cleared → [status: resolved]
    └── resolved_at set by trigger


DECISION LIFECYCLE
───────────────────
Approval needed → [status: pending]
    │
    ├── Approved → [status: approved]
    ├── Rejected → [status: rejected]
    └── Deferred → [status: deferred] → pending (reconsideration)


PROJECT LIFECYCLE
──────────────────
New project created → [status: planning]
    │
    ▼
Work begins → [status: active]
    │
    ├── Work paused → [status: on_hold] → active
    └── Work done → [status: completed]
```

---

## 6. Entity Priority

For development prioritization:

1. **Daily Log** — The system's core. Everything else is secondary.
2. **Project** — Container for all entities.
3. **Report** — Output artifact. Derived from Daily Log.
4. **Issue** — Quality control. High operational value.
5. **Blocker** — Management visibility. High executive value.
6. **Decision** — Governance trail. Medium-high value.
7. **ProjectMember** — Auth prerequisite. Needed before Phase 3.
8. **ContractorRow / EquipmentRow / Photo** — Sub-entities of Daily Log.
9. **IssueComment** — Discussion layer. Phase 2+.
