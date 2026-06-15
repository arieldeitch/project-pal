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

---

## Phase 2 Workflows (NOT YET IMPLEMENTED — pending approval after deployment)

### Daily Work Log PDF Workflow (יומן עבודה)

The reference daily work log PDF (provided by product owner) establishes the target output format for this workflow.

```
Site Manager fills daily log
  ├─ General information (project, date range, address, site roles)
  ├─ Role holders table (project manager, work manager, safety officer, etc.)
  ├─ Contractors table (contractor name, trade, worker count, work location, description)
  ├─ Equipment and materials table
  ├─ Notes / observations (with category: supervision / safety / quality)
  │    └─ Photos attached per note
  └─ Report writer signature

Manager reviews and generates branded PDF
  └─ PDF matches reference layout with company logo, header, footer, page numbers
```

**Key differences from current MVP daily log:**
- Date range (not single date) — covers a work period
- Formal role holder table (work manager, safety assistant, additional role holders)
- Work location per contractor entry
- Categorized field notes (supervision, safety, quality)
- Photos embedded directly in note entries
- Signature field at end of document

---

### Engineering Response Workflow (דוח תגובה הנדסי)

The reference engineering response PDF establishes the target output format for professional engineering report responses.

```
Engineer creates response report
  ├─ Client details (name, property address)
  ├─ Report metadata (editor, visit date, report number, purpose)
  ├─ Documents reviewed list
  ├─ Professional declaration section
  ├─ Building description
  └─ For each finding / claim:
       ├─ Finding text (as stated in inspection report)
       ├─ Engineer's response text
       ├─ Standard / regulation reference
       ├─ Quoted standard text
       ├─ Photos documenting finding and/or response
       └─ Cost estimate:
            ├─ Description
            ├─ Quantity + unit
            ├─ Unit price
            ├─ Total
            ├─ Supervision %
            ├─ VAT %
            └─ Final total

Report summary
  ├─ Total number of claims
  ├─ Number responded
  ├─ Number pending response
  └─ Engineer's signature section

PDF output
  └─ Branded layout with logo, contact details, page footer
```

**Business rule:** A cost estimate must be attached to each finding before the report can be marked complete. Summary totals are computed automatically from line items.
