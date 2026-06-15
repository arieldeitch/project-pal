# Frontend Data Audit — Mehayesod Platform

> Phase: Execution Phase 2 — Real Data Integration
> Completed: 2026-06-15

---

## Summary

Every route file used `useStore()` from `src/lib/mock-data.ts` — a `useSyncExternalStore`-based in-memory store
with hardcoded seed data. All mutations (`store.addXxx`, `store.updateXxx`) were direct calls to that store.

---

## File-by-File Audit

| File | Mock Source | Replacement Strategy |
|---|---|---|
| `src/lib/mock-data.ts` | The entire in-memory store + seed data | Stripped to types + label maps + helper functions; store removed |
| `src/routes/index.tsx` | `useStore()` → projects, dailyLogs, issues, blockers, decisions | `useProjects()`, `useDailyLogs()`, `useIssues()`, `useBlockers()`, `useDecisions()` |
| `src/routes/projects.index.tsx` | `useStore()` → projects, dailyLogs, issues, blockers | Individual hooks + `lastLogDate()` helper (now operates on fetched data) |
| `src/routes/projects.$projectId.tsx` | `useStore()` → all 6 entities | `useProject(id)` + 5 filtered collection hooks |
| `src/routes/daily-logs.index.tsx` | `useStore()` → dailyLogs, projects | `useDailyLogs()` + `useProjects()` |
| `src/routes/daily-logs.new.tsx` | `useStore()` + `store.addDailyLog()` | `useProjects()` + `useCreateDailyLog()` mutation |
| `src/routes/daily-logs.$logId.tsx` | `useStore()` + `store.generateReportFromLog()` | `useDailyLog(id)` + `useGenerateReport()` mutation |
| `src/routes/issues.index.tsx` | `useStore()` + `store.updateIssue()` + `store.addIssue()` | `useIssues()` + `useCreateIssue()` + `useUpdateIssue()` |
| `src/routes/blockers.index.tsx` | `useStore()` + `store.updateBlocker()` + `store.addBlocker()` | `useBlockers()` + `useCreateBlocker()` + `useUpdateBlocker()` |
| `src/routes/decisions.index.tsx` | `useStore()` + `store.updateDecision()` + `store.addDecision()` | `useDecisions()` + `useCreateDecision()` + `useUpdateDecision()` |
| `src/routes/reports.index.tsx` | `useStore()` + `store.markReportSent()` | `useReports()` + `useMarkReportSent()` |
| `src/routes/reports.$reportId.tsx` | `useStore()` + `store.markReportSent()` — fetched log inline from store | `useReportDetail(id)` — returns report + log + project in one query |
| `src/routes/executive.tsx` | `useStore()` → all 6 entities | 6 separate query hooks; chart data computed from live fetched arrays |

---

## Schema Mapping Notes

| Mock field (camelCase) | DB column (snake_case) |
|---|---|
| `project.startDate` | `project.start_date` |
| `project.targetDate` | `project.target_date` |
| `dailyLog.projectId` | `daily_log.project_id` |
| `dailyLog.workHours` | `daily_log.work_hours` |
| `dailyLog.submittedBy` | `daily_log.submitted_by` |
| `dailyLog.exceptionalEvents` | `daily_log.exceptional_events` |
| `dailyLog.contractorNotes` | `daily_log.contractor_notes` |
| `dailyLog.workDescription` | `daily_log.work_description` (JSONB array) |
| `dailyLog.contractors` | `contractor_row` (separate table, joined via `daily_log_id`) |
| `dailyLog.equipment` | `equipment_row` (separate table) |
| `dailyLog.photos` | `photo!daily_log_id` (separate table, disambiguated FK) |
| `issue.responsibleContractor` | `issue.responsible_contractor` |
| `issue.assignedTo` | `issue.assigned_to` |
| `issue.dueDate` | `issue.due_date` |
| `issue.comments[].text` | `issue_comment.body` |
| `issue.comments[].date` | `issue_comment.created_at` (sliced to date) |
| `issue.photos` | `photo!issue_id` (disambiguated FK) |
| `blocker.dueDate` | `blocker.due_date` |
| `decision.requestedBy` | `decision.requested_by` |
| `decision.dueDate` | `decision.due_date` |
| `report.dailyLogId` | `report.daily_log_id` |
| `report.sentAt` | `report.sent_at` |
| `photoItem.url` | `photo.storage_key` — mapped to placeholder URL if not a real HTTPS URL |

---

## What Was NOT Changed

| Item | Reason |
|---|---|
| `hasLogToday()` and `lastLogDate()` helpers | Pure functions; still work identically on fetched `DailyLog[]` arrays |
| Label dictionaries (`projectStatusLabel`, etc.) | Pure constants; no data source involved |
| All TypeScript type interfaces | Preserved unchanged for component compatibility |
| UI component structure | No redesign — only data source swapped |
| Photo display in detail views | Kept; DB photos render as gray placeholders (storage not implemented) |
| Photo upload in create form | Removed — storage not implemented per Phase 2 scope |
