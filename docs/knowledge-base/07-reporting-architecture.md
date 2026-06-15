# 07 — Reporting Architecture

## What a Report Is

A `report` record is a pointer to a daily log snapshot. It records:
- Which project and date
- Which daily log it was generated from
- The send status and timestamp

The report itself does not store a copy of the log data. When viewing a report, the system fetches the associated daily log and renders its current content.

**Trade-off:** If a daily log were ever edited after report generation, the report view would show the edited version. This is why the immutability trigger exists — `prevent_log_edit_if_report_sent` blocks edits once a report is sent.

---

## Report Generation Flow

1. User opens a daily log detail page (`/daily-logs/:id`)
2. Clicks "Create Report" button
3. `useGenerateReport()` mutation calls `reportRepository.generateFromLog(logId, projectId, date)`
4. Repository checks for an existing report for this log (idempotency):
   ```typescript
   const { data: existing } = await supabase
     .from("report")
     .select("*")
     .eq("daily_log_id", logId)
     .maybeSingle();
   if (existing) return dbToReport(existing);
   ```
5. If no existing report, inserts new report with `status: "ready"`
6. Returns the new report
7. Mutation `onSuccess` navigates to the new report detail page

---

## Report Sending Flow

1. User sees "Mark Sent" button on either:
   - Reports list (`/reports/`)
   - Report detail page (`/reports/:id`)
2. `useMarkReportSent()` mutation calls `reportRepository.markSent(id)`
3. Repository updates `status = 'sent'` and `sent_at = now()` in DB
4. Cache invalidated → UI reflects new status

---

## Report Detail View

The `useReportDetail(id)` hook:
1. Fetches the report record
2. In parallel (`Promise.all`), fetches:
   - The associated daily log (if `daily_log_id` is not null)
   - The associated project
3. Returns `{ report, log, project }`

The report detail page renders:
- Report header (project name, date, report type, status)
- All daily log content (contractors, equipment, work description, exceptional events)
- "Mark Sent" button (if not yet sent)

---

## Future PDF Export (Phase 4)

The planned PDF generation approach:
1. User clicks "Download PDF" on report detail page
2. Frontend generates PDF client-side using a library like `@react-pdf/renderer`
3. PDF renders the same content as the report detail page, formatted for print
4. Download triggered via browser

Alternatively: Supabase Edge Function generates PDF server-side.

**Not implemented yet.** The "Download PDF" button shows a placeholder toast.

---

## Report Types

Currently only `daily` type is generated. `weekly` and `monthly` types are defined in the schema but not yet implemented in the UI or business logic.

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Report is a pointer, not a snapshot | Simpler schema; immutability trigger handles data integrity |
| `generateFromLog` is idempotent | Prevents duplicate reports if button clicked twice |
| `markSent` sets `sent_at = now()` in DB | Audit trail; not set by client clock |
| Report detail fetches log in parallel | Avoids waterfall; both IDs are known from the report |
