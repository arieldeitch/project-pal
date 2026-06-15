# Real Data Integration Complete — Mehayesod Platform

> Phase: Execution Phase 2 — Real Data Integration
> Completed: 2026-06-15
> Status: ✅ COMPLETE — READY FOR SUPABASE CONNECTION

---

## What Was Built

Full replacement of the `useSyncExternalStore` in-memory mock store with Supabase-backed
TanStack Query hooks, across all 12 route files.

---

## New Files Created

### Infrastructure

| File | Purpose |
|---|---|
| `.env.local` | Supabase URL + anon key (fill in with real values) |
| `src/lib/supabase.ts` | Supabase JS client singleton |

### Repositories (`src/repositories/`)

| File | Entities |
|---|---|
| `projectRepository.ts` | `list`, `get`, `create`, `update` |
| `dailyLogRepository.ts` | `list(filter?)`, `get`, `create` (with contractor + equipment rows) |
| `issueRepository.ts` | `list(filter?)`, `create`, `update` |
| `blockerRepository.ts` | `list(filter?)`, `create`, `update` |
| `decisionRepository.ts` | `list(filter?)`, `create`, `update` |
| `reportRepository.ts` | `list(filter?)`, `getDetail`, `generateFromLog`, `markSent` |

### React Query Hooks (`src/hooks/`)

| File | Exported Hooks |
|---|---|
| `useProjects.ts` | `useProjects`, `useProject`, `useCreateProject`, `useUpdateProject` |
| `useDailyLogs.ts` | `useDailyLogs`, `useDailyLog`, `useCreateDailyLog` |
| `useIssues.ts` | `useIssues`, `useCreateIssue`, `useUpdateIssue` |
| `useBlockers.ts` | `useBlockers`, `useCreateBlocker`, `useUpdateBlocker` |
| `useDecisions.ts` | `useDecisions`, `useCreateDecision`, `useUpdateDecision` |
| `useReports.ts` | `useReports`, `useReportDetail`, `useGenerateReport`, `useMarkReportSent` |

---

## Modified Files

### `src/lib/mock-data.ts`

Stripped to types + label dictionaries + helper functions. All mock data (seed state, useSyncExternalStore, store mutations) removed.

### Route Files (12 files rewritten)

| Route | Changes |
|---|---|
| `routes/index.tsx` | 5 separate query hooks replace single `useStore()` |
| `routes/projects.index.tsx` | 4 query hooks |
| `routes/projects.$projectId.tsx` | 6 query hooks (project + 5 filtered collections) |
| `routes/daily-logs.index.tsx` | `useDailyLogs()` + `useProjects()` |
| `routes/daily-logs.new.tsx` | `useProjects()` + `useCreateDailyLog()` mutation; UNIQUE error handling; photo section removed |
| `routes/daily-logs.$logId.tsx` | `useDailyLog(id)` + `useGenerateReport()` mutation |
| `routes/issues.index.tsx` | `useIssues()` + create/update mutations |
| `routes/blockers.index.tsx` | `useBlockers()` + create/update mutations |
| `routes/decisions.index.tsx` | `useDecisions()` + create/update mutations |
| `routes/reports.index.tsx` | `useReports()` + `useMarkReportSent()` mutation |
| `routes/reports.$reportId.tsx` | `useReportDetail(id)` — single query returns report + log + project |
| `routes/executive.tsx` | 6 query hooks replace single `useStore()` |

---

## Architecture

```
Supabase DB (PostgreSQL)
    ↕  PostgREST (via @supabase/supabase-js)
src/lib/supabase.ts         — singleton client
src/repositories/           — DB access + snake_case → camelCase transform
src/hooks/                  — TanStack Query wrappers (useQuery + useMutation)
src/routes/                 — React components, pure UI
```

### Data Flow

```
Component → useXxx hook → repository.fn() → supabase.from('table').select/insert/update
                              ↑
              snake_case ↔ camelCase transformation happens here
```

### Cache Invalidation Strategy

All mutation hooks call `queryClient.invalidateQueries({ queryKey: ['entity'] })` on success,
which causes React Query to re-fetch all queries whose key starts with that prefix.

---

## Key Decisions

| Decision | Rationale |
|---|---|
| Repository layer transforms snake_case → camelCase | UI types preserved unchanged; zero component rewrites needed |
| Full sub-entity fetches on daily log queries | Avoids dual type shapes; 24 logs with ~30 sub-rows is trivially small |
| `photo.url` set to gray placeholder SVG | Storage not implemented; keeps display consistent rather than broken images |
| Photo upload removed from create form | Phase 2 scope: no file upload |
| `useReportDetail(id)` fetches report + log + project | Single query avoids waterfall; report detail page needs all three |
| UNIQUE(project_id, date) error shows Hebrew toast | Code `23505` caught in `mutateAsync` catch block in the form |
| Dialog closes only after successful mutation | Prevents user confusion on network error; `setOpen(false)` is in `onSuccess` |

---

## To Connect to Supabase

1. Open `.env.local` and fill in real values:
   ```
   VITE_SUPABASE_URL=https://<your-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```

2. Confirm all 4 Phase 1 migrations are applied to the project.

3. Run `npm run dev` — all queries will hit Supabase and render real data.

---

## Next Phase: Phase 3 — Authentication

- Enable Supabase Auth
- Add RLS policies (per `docs/04-supabase-architecture.md` §5)
- Wire `project_member.user_id` FK to `auth.users`
- Gate routes with auth middleware

---

## What Is NOT Implemented (by design)

| Feature | Phase |
|---|---|
| Authentication / RLS | Phase 3 |
| File upload / Supabase Storage | Phase 3 |
| PDF generation | Phase 4 |
| Edit daily log after creation | Not yet scoped |
| Issue / blocker detail page | Not yet scoped |
