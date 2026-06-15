# Developer Handoff — Mehayesod Platform
> Last updated: 2026-06-15
> Status: Phase 2 Complete — Ready for Supabase connection

---

## What This App Is

**Mehayesod** (מהיסוד — "from the foundation") is a Hebrew-language, RTL construction site execution platform for Israeli construction companies.

It replaces WhatsApp messages and Excel sheets with a structured daily workflow:
- Site managers submit a daily work log (contractors, equipment, work done)
- Issues and blockers are tracked with status and severity
- Decisions needing approval are logged
- PDF reports are generated and sent to project owners

The app is a **web-based internal tool** — not a public-facing product. It assumes a small team (5–20 users) per company.

---

## What This App Is NOT

- Not a project management tool (no tasks, Gantt charts, or scheduling)
- Not a financial/budgeting tool
- Not a BIM or CAD integration
- Not a consumer-facing product
- Not a public marketplace or SaaS product yet

---

## Technical Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | TanStack Start | ^1.167.50 |
| Routing | TanStack Router | ^1.168.25 |
| Data fetching | TanStack Query v5 | ^5.83.0 |
| Database | Supabase (PostgreSQL) | ^2.108.1 |
| UI components | shadcn/ui + Radix UI | — |
| Styling | Tailwind CSS v4 | ^4.2.1 |
| Charts | Recharts | ^2.15.4 |
| Forms | React Hook Form + Zod | ^7.71.2 / ^3.24.2 |
| Toasts | Sonner | ^2.0.7 |
| Icons | Lucide React | ^0.575.0 |
| Language | TypeScript | ^5.8.3 |
| Build tool | Vite | ^7.3.1 |

---

## How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Fill in Supabase credentials
# Edit .env.local:
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# 3. Apply migrations to your Supabase project (in order)
# Run in Supabase SQL Editor or via supabase CLI:
# supabase/migrations/20260615000001_create_tables.sql
# supabase/migrations/20260615000002_create_views.sql
# supabase/migrations/20260615000003_create_triggers.sql
# supabase/migrations/20260615000004_seed_data.sql

# 4. Start dev server
npm run dev
# → http://localhost:3000
```

---

## Required Environment Variables

| Variable | Source | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project settings → API | Project URL (e.g. `https://abcdef.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase project settings → API | Public anon key (safe to use in frontend) |

Both variables go in `.env.local` (already created, needs real values).

**Never use the `service_role` key in frontend code.**

---

## Current Database Status

| Item | Status |
|---|---|
| Migration files | ✅ Created (4 files in `supabase/migrations/`) |
| Applied to Supabase | ❌ NOT YET — no real project created |
| Seed data | ✅ In migration file (3 projects, 24 logs, 16 issues, 11 blockers, 10 decisions, 19 reports) |
| RLS policies | ❌ NOT YET — deferred to Phase 3 |
| Auth | ❌ NOT YET — deferred to Phase 3 |

---

## Current Frontend Status

| Item | Status |
|---|---|
| All 12 routes | ✅ Connected to Supabase via React Query |
| Build | ✅ Passes (`npm run build`) |
| TypeScript | ✅ Clean (`npx tsc --noEmit`) |
| Lint | ⚠️ CRLF warnings only (Windows line endings) — not real errors |
| Photos | ⚠️ Shows gray placeholders (Storage not implemented) |
| Auth guard | ❌ No auth — all routes are public |

---

## File Structure

```
src/
  lib/
    supabase.ts          — Supabase client singleton
    mock-data.ts         — TypeScript types + label dictionaries only (mock data removed)
  repositories/          — DB access layer (snake_case ↔ camelCase transforms)
    projectRepository.ts
    dailyLogRepository.ts
    issueRepository.ts
    blockerRepository.ts
    decisionRepository.ts
    reportRepository.ts
  hooks/                 — TanStack Query wrappers
    useProjects.ts
    useDailyLogs.ts
    useIssues.ts
    useBlockers.ts
    useDecisions.ts
    useReports.ts
  routes/                — Page components (file-based routing)
    __root.tsx           — Root layout + QueryClientProvider
    index.tsx            — Dashboard
    projects.index.tsx
    projects.$projectId.tsx
    daily-logs.index.tsx
    daily-logs.new.tsx
    daily-logs.$logId.tsx
    issues.index.tsx
    blockers.index.tsx
    decisions.index.tsx
    reports.index.tsx
    reports.$reportId.tsx
    executive.tsx        — Executive dashboard with charts
  components/
    AppSidebar.tsx
    StatusBadges.tsx
    ui/                  — shadcn/ui generated components
supabase/
  migrations/            — SQL migration files (apply in order)
docs/                    — Project documentation
```

---

## Known Limitations

| Limitation | Reason | Phase |
|---|---|---|
| Photos show gray placeholders | Supabase Storage not implemented | Phase 3 |
| Photo upload not available | No file upload | Phase 3 |
| All routes are public | Auth not implemented | Phase 3 |
| No PDF export | Not in scope | Phase 4 |
| Cannot edit a daily log | Immutability trigger; not yet scoped | TBD |
| Issue/blocker detail pages don't exist | Not yet scoped | TBD |
| Lint shows CRLF errors | Windows line endings vs Prettier LF expectation | Run `npm run format` to fix |

---

## Next Recommended Task

**Connect to a real Supabase project and validate all 12 screens.**

See `docs/TOMORROW_ACTION_PLAN.md` for exact step-by-step instructions.
