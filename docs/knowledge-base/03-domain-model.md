# 03 — Domain Model

## Core Entities

### project
The top-level entity. Each construction project.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | Project name |
| address | text | Site address |
| client | text | Client/owner name |
| manager | text | Site manager name |
| status | text | `active` | `completed` | `on_hold` |
| start_date | date | |
| target_date | date | Planned completion |
| created_at | timestamptz | Auto |

---

### daily_log
One per day per project. Core operational document.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | FK → project |
| date | date | UNIQUE with project_id |
| log_number | int | Auto-assigned by trigger (sequential per project) |
| work_hours | text | e.g. "07:00–17:00" |
| weather | text | e.g. "שמשי, 28°C" |
| submitted_by | text | Manager name |
| exceptional_events | text | Free text |
| contractor_notes | text | Free text |
| work_description | jsonb | String array — list of work items done |
| created_at | timestamptz | Auto |

---

### contractor_row
Each contractor present on a given day. Sub-entity of daily_log.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| daily_log_id | uuid | FK → daily_log |
| contractor | text | Company name |
| trade | text | Trade (e.g. "אינסטלציה") |
| workers | int | Worker count |
| notes | text | Optional |
| sort_order | int | Display order |

---

### equipment_row
Equipment used on a given day. Sub-entity of daily_log.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| daily_log_id | uuid | FK → daily_log |
| name | text | Equipment name |
| quantity | int | Count |
| notes | text | Optional |
| sort_order | int | Display order |

---

### photo
Photos attached to either a daily_log OR an issue. Two FK columns — one must be null.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| daily_log_id | uuid | FK → daily_log (nullable) |
| issue_id | uuid | FK → issue (nullable) |
| storage_key | text | Supabase Storage path OR placeholder |
| caption | text | Optional |
| work_item | text | Which work item this photo documents |
| area | text | Area of site |

**PostgREST disambiguation:** When joining from daily_log, use `photo!daily_log_id(*)`. When joining from issue, use `photo!issue_id(*)`.

---

### issue
A defect, quality problem, or safety concern.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | FK → project |
| title | text | |
| description | text | |
| severity | text | `low` | `medium` | `high` | `critical` |
| status | text | `open` | `in_progress` | `resolved` | `closed` |
| assigned_to | text | Person responsible |
| responsible_contractor | text | Contractor who caused it |
| due_date | date | |
| resolved_at | timestamptz | Set by trigger on status=resolved |
| created_at | timestamptz | Auto |

---

### issue_comment
Comments on an issue (like a simple thread).

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| issue_id | uuid | FK → issue |
| author | text | |
| body | text | Comment text |
| created_at | timestamptz | Auto |

UI maps: `body` → `text`, `created_at.slice(0,10)` → `date`

---

### blocker
Something actively blocking site work.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | FK → project |
| title | text | |
| description | text | |
| priority | text | `low` | `medium` | `high` | `critical` |
| status | text | `open` | `in_progress` | `resolved` |
| due_date | date | |
| resolved_at | timestamptz | Set by trigger |
| created_at | timestamptz | Auto |

---

### decision
A decision that needs to be made or has been made.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | FK → project |
| title | text | |
| description | text | |
| status | text | `pending` | `approved` | `rejected` | `implemented` |
| owner | text | Who decides |
| requested_by | text | Who is requesting the decision |
| due_date | date | |
| created_at | timestamptz | Auto |

---

### report
A generated report based on a daily log.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | FK → project |
| daily_log_id | uuid | FK → daily_log (nullable for non-daily reports) |
| date | date | Report date |
| type | text | `daily` | `weekly` | `monthly` |
| status | text | `ready` | `sent` |
| sent_at | timestamptz | Set when marked sent |
| created_at | timestamptz | Auto |

---

## Entity Relationships

```
project
  ├─ daily_log (many)
  │    ├─ contractor_row (many)
  │    ├─ equipment_row (many)
  │    └─ photo!daily_log_id (many)
  ├─ issue (many)
  │    ├─ issue_comment (many)
  │    └─ photo!issue_id (many)
  ├─ blocker (many)
  ├─ decision (many)
  └─ report (many)
       └─ daily_log (one, via daily_log_id)
```

---

## TypeScript Types (Frontend)

All frontend types live in `src/lib/mock-data.ts`. They use camelCase field names. Repositories handle the snake_case ↔ camelCase transformation.

Key type aliases:
- `ProjectStatus` = `"active" | "completed" | "on_hold"`
- `IssueStatus` = `"open" | "in_progress" | "resolved" | "closed"`
- `Severity` = `"low" | "medium" | "high" | "critical"`
- `BlockerStatus` = `"open" | "in_progress" | "resolved"`
- `DecisionStatus` = `"pending" | "approved" | "rejected" | "implemented"`
- `ReportStatus` = `"ready" | "sent"`
- `ReportType` = `"daily" | "weekly" | "monthly"`
