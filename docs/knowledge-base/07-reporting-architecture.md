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

## Future PDF Export (Phase 2)

Phase 2 will add two branded PDF report types based on reference documents provided by the product owner. Full field specifications are in `docs/knowledge-base/13-reference-report-specifications.md`.

**Approach:** Server-side generation via Supabase Edge Function (Puppeteer or managed PDF service). Client-side generation is not recommended for construction reports due to photo volume, Hebrew RTL rendering constraints, and mobile performance.

**Not implemented yet.** The current "Export CSV" button provides data export. The PDF button shows a placeholder.

---

## Report Types

### Currently Implemented

| Type | Source | Status |
|---|---|---|
| `daily` (web view) | Single DailyLog | ✅ Implemented — web render only |
| `weekly` | Multiple DailyLogs | Schema defined, UI not implemented |
| `monthly` | Multiple DailyLogs | Schema defined, UI not implemented |
| CSV export | Report metadata | ✅ Implemented |

### Phase 2 — Branded PDF Reports

| Type | Hebrew Name | Purpose |
|---|---|---|
| Daily Work Log PDF | יומן עבודה | Structured daily site activity record for clients and supervision authority |
| Engineering Response PDF | דוח תגובה הנדסי | Professional response to inspection findings with cost estimates and standard references |

Both PDF types require:
- Company logo in header
- Branded footer with contact details and page numbers
- A4 format, Hebrew RTL layout
- Photo attachments embedded in document
- Signature section at the end

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Report is a pointer, not a snapshot | Simpler schema; immutability trigger handles data integrity |
| `generateFromLog` is idempotent | Prevents duplicate reports if button clicked twice |
| `markSent` sets `sent_at = now()` in DB | Audit trail; not set by client clock |
| Report detail fetches log in parallel | Avoids waterfall; both IDs are known from the report |
