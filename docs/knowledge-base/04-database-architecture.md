# 04 — Database Architecture

## Migration Files

All migrations live in `supabase/migrations/`. Apply in order.

| File | Contents |
|---|---|
| `20260615000001_create_tables.sql` | All tables, primary keys, foreign keys, unique constraints, indexes |
| `20260615000002_create_views.sql` | `project_summary` view, `daily_log_summary` view |
| `20260615000003_create_triggers.sql` | `assign_log_number`, `set_resolved_at`, immutability guards |
| `20260615000004_seed_data.sql` | 3 projects, 24 logs, 16 issues, 11 blockers, 10 decisions, 19 reports |

---

## Key Constraints

### UNIQUE(project_id, date) on daily_log
Prevents two logs for the same project on the same day. This is a core business rule.

The frontend catches violation with error code `23505` and shows:
```
"כבר קיים יומן לתאריך זה בפרויקט זה"
```

### CASCADE DELETEs
- Deleting a project cascades to: daily_log, issue, blocker, decision, report
- Deleting a daily_log cascades to: contractor_row, equipment_row, photo (via daily_log_id)
- Deleting an issue cascades to: issue_comment, photo (via issue_id)

---

## Views

### project_summary
Aggregates per-project counts for the dashboard:
- `total_logs`, `total_issues`, `open_issues`, `critical_issues`, `total_blockers`, `open_blockers`

### daily_log_summary
Aggregates per-log counts:
- `contractor_count`, `equipment_count`, `photo_count`

These views are available for query but the frontend currently computes these values client-side from fetched arrays (avoids extra query complexity for MVP scale).

---

## Triggers

### assign_log_number()
**When:** BEFORE INSERT on `daily_log`
**What:** Sets `log_number = COUNT(*) + 1` for the project (sequential, 1-based)
**Why:** Log numbers need to be stable and sequential per project. UI never sets this field.

### set_resolved_at()
**When:** BEFORE UPDATE on `issue` and `blocker`
**What:** If `NEW.status = 'resolved'` and `OLD.status != 'resolved'`, sets `resolved_at = now()`
**Why:** Automatic audit trail — when was this actually resolved?

### prevent_log_edit_if_report_sent()
**When:** BEFORE UPDATE on `daily_log`
**What:** Raises `P0001` exception if a report with `daily_log_id = OLD.id` exists with status `'sent'`
**Why:** Sent reports are legal/contractual documents. Log content cannot change after they're sent.

### prevent_log_delete_if_report_sent()
**When:** BEFORE DELETE on `daily_log`
**What:** Same check as above but for DELETE operation
**Why:** Same reason — data integrity for sent reports.

---

## Indexes

Key indexes beyond PKs and FKs:
- `daily_log(project_id, date)` — fast project-scoped log lookup
- `daily_log(date DESC)` — chronological log listing
- `issue(project_id, status)` — filtered issue queries
- `issue(severity, status)` — critical issue queries
- `blocker(project_id, status)` — filtered blocker queries
- `report(project_id, date DESC)` — project report history

---

## JSONB Field

`daily_log.work_description` is a JSONB column storing a `string[]`:
```json
["הנחת יסודות בגוש צפוני", "עבודות אינסטלציה קומה 2", "בטון רצפה מקטע A"]
```

Supabase JS client automatically parses this to a JavaScript `string[]` when selected. The repository passes it through as-is.

---

## PostgREST FK Disambiguation

The `photo` table has TWO foreign key columns (`daily_log_id` and `issue_id`). When querying via PostgREST, the FK must be specified explicitly:

```typescript
// In dailyLogRepository — join photos for a log
`photo!daily_log_id (id, storage_key, caption, work_item, area)`

// In issueRepository — join photos for an issue
`photo!issue_id (id, storage_key, caption, work_item, area)`
```

Without this disambiguation, PostgREST returns an error.
