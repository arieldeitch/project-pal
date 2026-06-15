# 02 — Business Process

## Daily Workflow

```
Morning
  └─ Site Manager arrives at site
  └─ Checks previous issues / blockers that need attention

During Day
  └─ Supervises contractor work
  └─ Notes issues (defects, quality problems)
  └─ Escalates blockers (material shortage, permit delay)
  └─ Flags decisions needed from project owner

End of Day
  └─ Opens Mehayesod
  └─ Creates Daily Log:
       ├─ Date, weather, work hours
       ├─ List of contractors on site (name, trade, workers count, notes)
       ├─ Equipment used (type, quantity)
       ├─ Work description (bullet list)
       ├─ Exceptional events
       └─ Contractor notes

After Daily Log
  └─ Clicks "Generate Report" → creates a PDF report record
  └─ "Mark Sent" → status changes to "sent", timestamp recorded
  └─ Project owner receives report (email, future phase)
```

---

## User Roles

| Role | Permissions (future RLS) | Current State |
|---|---|---|
| **Site Manager** | Read/write own project | All routes open (no auth yet) |
| **Project Manager** | Read/write all projects | All routes open |
| **Executive / Owner** | Read-only all projects + executive dashboard | All routes open |

---

## Business Rules

### 1. One Log Per Day Per Project
A project can have only one daily log per calendar date. Enforced by:
- DB: `UNIQUE(project_id, date)` constraint on `daily_log`
- UI: Hebrew toast on constraint violation (error code `23505`)

### 2. Log Number Auto-Assigned
`log_number` is assigned by the `assign_log_number()` trigger (BEFORE INSERT). It's sequential per project (log 1, 2, 3...). The UI never sets it.

### 3. Reports Lock Logs
Once a report is generated from a daily log:
- The log cannot be edited (`prevent_log_edit_if_report_sent` trigger)
- The log cannot be deleted (`prevent_log_delete_if_report_sent` trigger)
- These triggers raise `P0001` exception

### 4. Issue Resolution Timestamp
When an issue's status changes to `resolved`, the `set_resolved_at()` trigger automatically sets `resolved_at = now()`. The UI never sets this field.

### 5. Blocker Resolution Timestamp
Same trigger covers blocker: when status changes to `resolved`, `resolved_at` is set automatically.

---

## Issue Lifecycle

```
open → in_progress → resolved → closed
         ↓
       (can reopen from resolved to in_progress)
```

Severity levels: `low` | `medium` | `high` | `critical`

---

## Blocker Lifecycle

```
open → in_progress → resolved
```

Priority levels (same as issue severity): `low` | `medium` | `high` | `critical`

---

## Decision Lifecycle

```
pending → approved → implemented
        ↓
      rejected
```

---

## Report Types

| Type | Description |
|---|---|
| `daily` | Generated from a daily log |
| `weekly` | Manual weekly summary (not yet implemented) |
| `monthly` | Manual monthly summary (not yet implemented) |

## Report Statuses

| Status | Meaning |
|---|---|
| `ready` | Generated, not yet sent |
| `sent` | Marked as sent to project owner |
