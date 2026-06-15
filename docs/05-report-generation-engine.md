# Report Generation Engine Design — Mehayesod Platform

> Version 1.1 | 2026-06-15
> Changes from v1.0: RC-01 — Photo join query fixed. The polymorphic `photos:photo!entity_id` join was incompatible with PostgREST. Now uses the typed FK `photos:photo!daily_log_id`.

---

## 1. Core Philosophy

**Reports are derived artifacts, not primary data.**

The Report table stores only metadata (id, project_id, daily_log_id, status, sent_at). Report content is assembled at render time from the source Daily Log. This is the single most important architectural decision in this module.

**Why this matters:**
- No data duplication between the log and the report.
- Editing a Daily Log automatically fixes the report (while it is still in `draft` or `ready` state).
- Report records are lightweight and cheap to create.
- A "regenerate" feature is trivially implemented — just re-render from source.

---

## 2. Report Types

| Type | Source | Frequency | Trigger |
|---|---|---|---|
| `daily` | Single DailyLog | One per workday per project | Manual (field manager or auto after log submit) |
| `weekly` | All DailyLogs for a project in a calendar week | Once per week | Manual (manager) or scheduled cron |
| `monthly` | All DailyLogs for a project in a calendar month | Once per month | Manual or scheduled cron |

---

## 3. Daily Report — Data Assembly

When a daily report is rendered (for PDF, print, or web preview), the system fetches:

```
Report.id → Report record (metadata)
    │
    └── Report.daily_log_id → DailyLog (full record)
            │
            ├── DailyLog.project_id → Project (name, client, address, manager)
            ├── ContractorRows WHERE daily_log_id = log.id ORDER BY sort_order
            ├── EquipmentRows WHERE daily_log_id = log.id ORDER BY sort_order
            ├── Photos WHERE entity_type = 'daily_log' AND entity_id = log.id
            └── DailyLog.work_description (jsonb array)
```

**Single query pattern (with Supabase):**
```typescript
const { data } = await supabase
  .from('report')
  .select(`
    id, status, sent_at, date, type, log_number,
    daily_log:daily_log_id (
      id, date, log_number, work_hours, weather, submitted_by,
      exceptional_events, contractor_notes, work_description,
      project:project_id (name, client, address, manager),
      contractor_rows (contractor, trade, workers, notes, sort_order),
      equipment_rows (name, quantity, notes, sort_order),
      photos:photo!daily_log_id (storage_key, caption, work_item, area)
    )
  `)
  .eq('id', reportId)
  .single();
```

This is one round-trip to the database.

**RC-01 fix:** The photo join now uses `photos:photo!daily_log_id` instead of the previous `photos:photo!entity_id`. The `!daily_log_id` hint tells PostgREST to traverse the `photo.daily_log_id` FK when joining photos to the daily log. This works because `photo.daily_log_id` is a real foreign key constraint — PostgREST can resolve the relationship automatically.

The previous `!entity_id` syntax was attempting to join through a non-existent FK (the polymorphic `entity_id` column has no FK constraint). That query would have failed at runtime with "Could not find a relationship between 'daily_log' and 'photo'".

---

## 4. Report Snapshot Strategy

### The Problem
If a manager edits a Daily Log after a report has been sent to a client, the report would silently change retroactively. This is unacceptable for a professional construction log.

### The Solution: Immutability After Send

**Phase 1 (current):** The UI disables editing for logs whose report is `sent`. No database enforcement.

**Phase 2 (recommended):** Add a database-level guard:

```sql
CREATE OR REPLACE FUNCTION public.prevent_log_edit_if_report_sent()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.report
        WHERE daily_log_id = OLD.id AND status = 'sent'
    ) THEN
        RAISE EXCEPTION 'Cannot modify a daily log whose report has been sent';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_log_edit_if_report_sent
    BEFORE UPDATE ON public.daily_log
    FOR EACH ROW EXECUTE FUNCTION public.prevent_log_edit_if_report_sent();
```

**Phase 3 (full snapshot):** For legal compliance, once a report is marked `sent`, a PDF snapshot is generated and stored in Supabase Storage under `reports/{project_id}/{report_id}/`. This is the authoritative record. Even if the database record changes (which it shouldn't), the PDF is immutable.

### Snapshot Metadata (stored in Report record)

When a PDF is generated and stored:

```sql
ALTER TABLE public.report ADD COLUMN pdf_storage_key TEXT;
ALTER TABLE public.report ADD COLUMN pdf_generated_at TIMESTAMPTZ;
```

The `pdf_storage_key` points to the immutable PDF in storage. Any view of a sent report uses the stored PDF, not a live database render.

---

## 5. Weekly Report — Aggregation Logic

A Weekly Report aggregates all Daily Logs for a project within a Monday–Sunday week.

**Assembly:**
```
WeeklyReport.project_id + WeeklyReport.date (week start Monday)
    │
    └── SELECT all DailyLogs WHERE
          project_id = ? AND
          date BETWEEN week_start AND week_start + 6 DAYS
          ORDER BY date ASC
```

**Weekly report sections:**
1. **Summary header** — project info, week period, manager
2. **Attendance summary** — total workers per contractor per day (tabular)
3. **Equipment summary** — equipment used per day
4. **Work log** — chronological daily work descriptions
5. **Issues opened this week** — severity-sorted
6. **Blockers raised this week**
7. **Decisions requested this week**
8. **Photo gallery** — all photos from the week

The weekly report is generated as a document from assembled data — same "render from source" principle, just with multiple logs as source.

---

## 6. PDF Generation Strategy

### Chosen Approach: Server-Side HTML → PDF

**Recommended tool:** [Puppeteer](https://pptr.dev/) running inside a Supabase Edge Function (Node.js runtime), or a managed PDF service (PDFShift, DocRaptor).

**Why not client-side PDF (jsPDF, html2pdf)?**
- Construction reports contain many photos — client-side rendering is slow and crashes on mobile.
- No control over print layout, page breaks, or Hebrew RTL rendering in jsPDF.
- A server-generated PDF is consistent across all devices.

**Why not WeasyPrint / wkhtmltopdf?**
- Not available in Supabase Edge Functions (Node.js only).

### PDF Generation Flow

```
Manager clicks "Export PDF"
    │
    ▼
Frontend calls POST /api/reports/{id}/generate-pdf
    │
    ▼
Edge Function: generate-pdf-report
    │
    ├── Fetch report + daily log data from DB
    ├── Render HTML template (Hebrew RTL, construction brand)
    ├── Puppeteer generates PDF with:
    │     - A4 format
    │     - RTL direction
    │     - Company header/footer
    │     - Page numbers
    │     - Photo grid
    │
    ├── Upload PDF to Supabase Storage: reports/{project_id}/{report_id}/report.pdf
    ├── Update report record: pdf_storage_key, pdf_generated_at
    └── Return signed URL (15-minute expiry) for immediate download
```

### HTML Report Template Requirements

```
┌────────────────────────────────────────────────────────┐
│  [Company Logo]          יומן עבודה יומי               │
│                          תאריך: 14/06/2026             │
│  פרויקט: הצלפים 24                                     │
│  כתובת: הצלפים 24, רעננה   לקוח: יזמות בן-דוד        │
│  מנהל: אבי כהן           שעות עבודה: 07:00-15:00      │
│  מזג אוויר: חמים, 28°                                  │
├────────────────────────────────────────────────────────┤
│  קבלני משנה ופועלים                                    │
│  ┌──────────┬──────┬────────┬──────┐                   │
│  │ קבלן     │ מקצוע │ פועלים │ הערות│                  │
│  ├──────────┼──────┼────────┼──────┤                   │
│  │ א.ש שלד  │ שלד  │   5    │      │                   │
│  └──────────┴──────┴────────┴──────┘                   │
├────────────────────────────────────────────────────────┤
│  ציוד                                                   │
│  • מיני מחפרון × 1                                     │
│  • משאית מנוף × 1                                      │
├────────────────────────────────────────────────────────┤
│  תיאור עבודה                                           │
│  1. קשירת ברזל קומה 2                                  │
│  2. המשך חפירת יסודות                                  │
│  3. יציקת בטון רזה אזור A                              │
├────────────────────────────────────────────────────────┤
│  אירועים חריגים: אין                                   │
│  הערות קבלן: אין                                       │
├────────────────────────────────────────────────────────┤
│  תמונות                                                 │
│  [Photo 1]  יציקת בטון רזה       [Photo 2] קשירת ברזל │
└────────────────────────────────────────────────────────┘
```

---

## 7. Excel Export Strategy

**Recommended tool:** [ExcelJS](https://github.com/exceljs/exceljs) — runs in both Node.js (Edge Function) and browser.

**For MVP:** Client-side generation is acceptable for Excel (lighter data than PDF). Use ExcelJS in the browser.

**Excel report sheets:**
1. **Cover** — project info, report period
2. **Daily Log** — one row per day, columns for weather, workers, work summary
3. **Contractors** — aggregated worker counts per contractor
4. **Equipment** — aggregated equipment usage
5. **Issues** — all issues with status and severity
6. **Blockers** — all blockers
7. **Decisions** — all decisions

---

## 8. Report Status State Machine

```
[DailyLog submitted]
    │
    ▼
Report created → status: draft
    │
    ▼
Manager reviews → status: ready
    │
    ▼
PDF generated + sent to client → status: sent
    │
    └── DailyLog becomes immutable
        PDF snapshot stored in Storage
```

**Allowed transitions:**
- `draft` → `ready` (manager reviews)
- `ready` → `sent` (manager sends)
- `ready` → `draft` (manager reverts — before send only)
- `sent` → (no transitions allowed)

---

## 9. Auto-Generation vs. Manual Trigger

**Phase 1 (current):** Manual. Field manager clicks "Generate Report" from the Daily Log detail page.

**Phase 2 (recommended):** Auto-generate on log submit. When a Daily Log is saved, the system automatically creates a `draft` Report record. This ensures every log has a corresponding report entry.

**Phase 5 (future):** Scheduled auto-generation of `weekly` and `monthly` reports via Edge Function cron.

---

## 10. Missing Log Detection

The executive dashboard must show which active projects have no log for today.

**Query:**
```sql
SELECT p.id, p.name, p.manager
FROM project p
WHERE p.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM daily_log dl
    WHERE dl.project_id = p.id
      AND dl.date = CURRENT_DATE
  )
ORDER BY p.name;
```

**Dashboard behavior:**
- Show count in KPI card: "פרויקטים ללא יומן היום: 2"
- Show table with project names and last log date
- Color: red if no log today by 16:00, yellow before cutoff time
