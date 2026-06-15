# Migration Validation Queries — Mehayesod Platform

> Version 1.0 | 2026-06-15
> Run these queries in the Supabase SQL Editor (dev project only) after applying all four migrations.

---

## How to Use

Run each section in order. Each block includes the expected result. A failed validation means a migration did not apply correctly.

---

## 1. Table Existence

Verify all 11 tables were created in the `public` schema.

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected tables (11):**
```
blocker
contractor_row
daily_log
decision
equipment_row
issue
issue_comment
photo
project
project_member
report
```

---

## 2. View Existence

Verify all 4 views were created.

```sql
SELECT table_name AS view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected views (4):**
```
v_missing_daily_logs
v_open_blockers
v_pending_decisions
v_project_health
```

---

## 3. Trigger Existence

Verify all 9 triggers (5 functions × their trigger instances) were created.

```sql
SELECT trigger_name, event_object_table, event_manipulation, action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

**Expected triggers:**
| trigger_name | table | event | timing |
|---|---|---|---|
| `trg_assign_log_number` | `daily_log` | INSERT | BEFORE |
| `trg_daily_log_updated_at` | `daily_log` | UPDATE | BEFORE |
| `trg_prevent_log_delete_if_report_sent` | `daily_log` | DELETE | BEFORE |
| `trg_prevent_log_edit_if_report_sent` | `daily_log` | UPDATE | BEFORE |
| `trg_blocker_resolved_at` | `blocker` | UPDATE | BEFORE |
| `trg_blocker_updated_at` | `blocker` | UPDATE | BEFORE |
| `trg_decision_updated_at` | `decision` | UPDATE | BEFORE |
| `trg_issue_resolved_at` | `issue` | UPDATE | BEFORE |
| `trg_issue_updated_at` | `issue` | UPDATE | BEFORE |
| `trg_project_updated_at` | `project` | UPDATE | BEFORE |

---

## 4. Index Existence

Verify all expected indexes were created.

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%_pkey'  -- exclude auto-created PK indexes
ORDER BY tablename, indexname;
```

**Expected non-PK indexes:**
| indexname | tablename |
|---|---|
| `idx_blocker_critical` | `blocker` |
| `idx_blocker_project_status` | `blocker` |
| `idx_contractor_row_log` | `contractor_row` |
| `idx_daily_log_project_date` | `daily_log` |
| `idx_decision_pending` | `decision` |
| `idx_decision_project_status` | `decision` |
| `idx_equipment_row_log` | `equipment_row` |
| `idx_issue_discovered_log` | `issue` |
| `idx_issue_due_date` | `issue` |
| `idx_issue_project_status` | `issue` |
| `idx_issue_severity` | `issue` |
| `idx_issue_comment` | `issue_comment` |
| `idx_photo_daily_log` | `photo` |
| `idx_photo_issue` | `photo` |
| `idx_photo_storage_key` | `photo` |
| `idx_project_member_project` | `project_member` |
| `idx_project_member_user` | `project_member` |
| `idx_project_status` | `project` |
| `idx_report_project_date` | `report` |
| `idx_report_project_status` | `report` |
| `uq_report_aggregate` | `report` |
| `uq_daily_log_project_date` | `daily_log` |
| `uq_daily_log_project_number` | `daily_log` |
| `uq_project_member` | `project_member` |
| `uq_report_daily_log` | `report` |

---

## 5. Seed Data Row Counts

Verify seed data loaded completely.

```sql
SELECT
    'project'         AS entity, COUNT(*) AS rows FROM public.project
UNION ALL SELECT 'project_member',           COUNT(*) FROM public.project_member
UNION ALL SELECT 'daily_log',                COUNT(*) FROM public.daily_log
UNION ALL SELECT 'contractor_row',           COUNT(*) FROM public.contractor_row
UNION ALL SELECT 'equipment_row',            COUNT(*) FROM public.equipment_row
UNION ALL SELECT 'issue',                    COUNT(*) FROM public.issue
UNION ALL SELECT 'issue_comment',            COUNT(*) FROM public.issue_comment
UNION ALL SELECT 'photo',                    COUNT(*) FROM public.photo
UNION ALL SELECT 'blocker',                  COUNT(*) FROM public.blocker
UNION ALL SELECT 'decision',                 COUNT(*) FROM public.decision
UNION ALL SELECT 'report',                   COUNT(*) FROM public.report
ORDER BY entity;
```

**Expected counts:**
| entity | rows |
|---|---|
| project | 3 |
| project_member | 5 |
| daily_log | 24 |
| contractor_row | 32 |
| equipment_row | 30 |
| issue | 16 |
| issue_comment | 10 |
| photo | 16 |
| blocker | 11 |
| decision | 10 |
| report | 19 |

---

## 6. Trigger: log_number Assignment

Verify the `assign_log_number` trigger correctly numbered all daily logs.

```sql
-- PR1 should have 12 logs numbered 1-12 in date order
SELECT date, log_number,
       'LOG-' || to_char(date, 'YYYY') || '-' || lpad(log_number::text, 6, '0') AS display_id
FROM public.daily_log dl
JOIN public.project p ON p.id = dl.project_id
WHERE p.name = 'הצלפים 24'
ORDER BY date;
```

**Expected:** 12 rows with `log_number` = 1 through 12 in ascending date order.

```sql
-- All projects: no NULL log_numbers, no duplicates within project
SELECT project_id, log_number, COUNT(*) AS count
FROM public.daily_log
GROUP BY project_id, log_number
HAVING COUNT(*) > 1 OR log_number IS NULL;
```

**Expected:** 0 rows (no nulls, no duplicates).

---

## 7. Constraint: Photo Must Have Exactly One Parent

```sql
-- Should return 0 rows (all photos have exactly one FK)
SELECT id, daily_log_id, issue_id
FROM public.photo
WHERE (daily_log_id IS NOT NULL)::int + (issue_id IS NOT NULL)::int != 1;
```

**Expected:** 0 rows.

Test the constraint enforces correctly (should raise an error):
```sql
-- Test 1: Both FKs set → should fail
INSERT INTO public.photo (daily_log_id, issue_id, storage_key)
SELECT dl.id, i.id, 'test/constraint-violation.webp'
FROM public.daily_log dl, public.issue i
LIMIT 1;
-- Expected: ERROR: new row violates check constraint "photo_exactly_one_parent"

-- Test 2: Neither FK set → should fail
INSERT INTO public.photo (daily_log_id, issue_id, storage_key)
VALUES (NULL, NULL, 'test/constraint-violation-2.webp');
-- Expected: ERROR: new row violates check constraint "photo_exactly_one_parent"
```

---

## 8. Constraint: Unique (project_id, date) on daily_log

```sql
-- Find duplicate (project, date) combinations — should be 0
SELECT project_id, date, COUNT(*) AS count
FROM public.daily_log
GROUP BY project_id, date
HAVING COUNT(*) > 1;
```

**Expected:** 0 rows.

Test enforcement (should fail):
```sql
-- Try to insert a duplicate log — should fail
INSERT INTO public.daily_log (project_id, date, submitted_by)
SELECT project_id, date, 'duplicate test'
FROM public.daily_log
LIMIT 1;
-- Expected: ERROR: duplicate key value violates unique constraint "uq_daily_log_project_date"
```

---

## 9. Constraint: No Future Daily Logs

```sql
-- Should return 0 rows
SELECT id, date FROM public.daily_log WHERE date > CURRENT_DATE;
```

**Expected:** 0 rows.

Test enforcement (should fail):
```sql
INSERT INTO public.daily_log (project_id, date, submitted_by)
SELECT id, CURRENT_DATE + 1, 'future test'
FROM public.project LIMIT 1;
-- Expected: ERROR: new row for relation "daily_log" violates check constraint
```

---

## 10. Trigger: resolved_at on Status Transition

Verify the `set_resolved_at` trigger sets the field on UPDATE.

```sql
-- Get an open issue to test with
SELECT id, status, resolved_at
FROM public.issue
WHERE status = 'open'
LIMIT 1;
```

Then update it and check:
```sql
WITH target AS (
    SELECT id FROM public.issue WHERE status = 'open' LIMIT 1
)
UPDATE public.issue
SET status = 'resolved'
WHERE id = (SELECT id FROM target)
RETURNING id, status, resolved_at;
```

**Expected:** `resolved_at` is NOT NULL and close to `now()`.

Verify it was NOT set on INSERT (pre-existing resolved issues set it manually):
```sql
SELECT id, status, resolved_at
FROM public.issue
WHERE status IN ('resolved','closed')
  AND resolved_at IS NULL;
```

**Expected:** 0 rows (all resolved/closed issues have resolved_at).

---

## 11. Trigger: Immutability — Edit Blocked After Report Sent

```sql
-- Get a log with a sent report
SELECT dl.id AS log_id, r.id AS report_id, r.status
FROM public.daily_log dl
JOIN public.report r ON r.daily_log_id = dl.id
WHERE r.status = 'sent'
LIMIT 1;
```

Test the block trigger (should raise an error):
```sql
UPDATE public.daily_log
SET weather = 'שינוי לא מורשה'
WHERE id = (
    SELECT dl.id FROM public.daily_log dl
    JOIN public.report r ON r.daily_log_id = dl.id
    WHERE r.status = 'sent'
    LIMIT 1
);
-- Expected: ERROR: לא ניתן לשנות יומן עבודה שדוח נשלח בגינו
```

---

## 12. Trigger: Immutability — Delete Blocked After Report Sent

```sql
DELETE FROM public.daily_log
WHERE id = (
    SELECT dl.id FROM public.daily_log dl
    JOIN public.report r ON r.daily_log_id = dl.id
    WHERE r.status = 'sent'
    LIMIT 1
);
-- Expected: ERROR: לא ניתן למחוק יומן עבודה שדוח נשלח בגינו
```

---

## 13. Cascade Delete: draft/ready Report Deleted With Log

```sql
-- Verify that a log with a draft report can be deleted (cascades)
-- Step 1: Find a log with a draft report
SELECT dl.id AS log_id, r.id AS report_id, r.status
FROM public.daily_log dl
JOIN public.report r ON r.daily_log_id = dl.id
WHERE r.status = 'draft'
LIMIT 1;

-- Step 2: Count reports before delete
SELECT COUNT(*) FROM public.report;

-- Step 3: Delete the log (DO NOT RUN on seed data you want to keep)
-- DELETE FROM public.daily_log WHERE id = '<log_id_from_step_1>';

-- Step 4: Verify report was cascade-deleted
-- SELECT COUNT(*) FROM public.report;
-- Expected: count decreased by 1
```

---

## 14. View: v_project_health

```sql
SELECT
    name,
    status,
    total_logs,
    last_log_date,
    days_since_last_log,
    open_issues,
    critical_issues,
    open_blockers,
    critical_blockers,
    pending_decisions,
    sent_reports,
    draft_reports
FROM public.v_project_health
ORDER BY name;
```

**Expected:** 3 rows (one per project). Active projects should have non-zero `total_logs`.

---

## 15. View: v_missing_daily_logs

```sql
SELECT * FROM public.v_missing_daily_logs;
```

**Expected:** Projects that did NOT have a log submitted for today.
The "נוף הגליל 12" project is `planning` (not `active`) so it is excluded.
If PR1 and PR2 both have logs for today (2026-06-15), this view returns 0 rows.

---

## 16. View: v_open_blockers

```sql
SELECT project_name, title, priority, status, is_overdue
FROM public.v_open_blockers
ORDER BY
    CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END;
```

**Expected:** 10 rows (11 blockers minus 1 resolved), with `is_overdue = true` for any whose `due_date < CURRENT_DATE`.

---

## 17. View: v_pending_decisions

```sql
SELECT project_name, title, status, due_date, is_overdue
FROM public.v_pending_decisions
ORDER BY due_date NULLS LAST;
```

**Expected:** 8 rows (10 decisions minus 1 approved and 1 rejected).

---

## 18. FK Integrity: No Orphan Records

```sql
-- No daily logs referencing non-existent projects
SELECT COUNT(*) AS orphan_logs
FROM public.daily_log dl
LEFT JOIN public.project p ON p.id = dl.project_id
WHERE p.id IS NULL;

-- No contractor rows referencing non-existent logs
SELECT COUNT(*) AS orphan_contractor_rows
FROM public.contractor_row cr
LEFT JOIN public.daily_log dl ON dl.id = cr.daily_log_id
WHERE dl.id IS NULL;

-- No photos with orphan daily_log_id
SELECT COUNT(*) AS orphan_log_photos
FROM public.photo ph
LEFT JOIN public.daily_log dl ON dl.id = ph.daily_log_id
WHERE ph.daily_log_id IS NOT NULL AND dl.id IS NULL;

-- No photos with orphan issue_id
SELECT COUNT(*) AS orphan_issue_photos
FROM public.photo ph
LEFT JOIN public.issue i ON i.id = ph.issue_id
WHERE ph.issue_id IS NOT NULL AND i.id IS NULL;
```

**Expected:** All counts = 0.

---

## 19. Constraint: project.target_date >= start_date

```sql
-- Should return 0 rows
SELECT id, name, start_date, target_date
FROM public.project
WHERE target_date < start_date;
```

**Expected:** 0 rows.

Test enforcement:
```sql
INSERT INTO public.project (name, address, client, manager, start_date, target_date)
VALUES ('בדיקה', 'בדיקה', 'בדיקה', 'בדיקה', '2026-12-01', '2026-06-01');
-- Expected: ERROR: new row violates check constraint "chk_project_dates"
```

---

## 20. Report Uniqueness: One Report Per Daily Log

```sql
-- Should return 0 rows (each daily_log_id referenced by at most one report)
SELECT daily_log_id, COUNT(*) AS count
FROM public.report
WHERE daily_log_id IS NOT NULL
GROUP BY daily_log_id
HAVING COUNT(*) > 1;
```

**Expected:** 0 rows.

---

## Validation Checklist Summary

Run all sections and verify each expected result. Mark as ✅ when passing.

| # | Validation | Status |
|---|---|---|
| 1 | All 11 tables exist | |
| 2 | All 4 views exist | |
| 3 | All 10 triggers exist | |
| 4 | All 25 indexes exist | |
| 5 | Seed data row counts match | |
| 6 | log_number auto-assigned correctly | |
| 7 | Photo constraint enforced | |
| 8 | Unique (project_id, date) enforced | |
| 9 | No future date constraint | |
| 10 | resolved_at set on status transition | |
| 11 | Edit blocked on sent-report log | |
| 12 | Delete blocked on sent-report log | |
| 13 | Draft report cascade-deleted with log | |
| 14 | v_project_health returns correct data | |
| 15 | v_missing_daily_logs works | |
| 16 | v_open_blockers returns 10 rows | |
| 17 | v_pending_decisions returns 8 rows | |
| 18 | No orphan FK records | |
| 19 | project date order constraint | |
| 20 | One report per daily log | |
