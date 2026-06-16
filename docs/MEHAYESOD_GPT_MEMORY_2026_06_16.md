# MEHAYESOD GPT MEMORY — 2026-06-16

---

## Product Identity

**Mehayesod** (מהיסוד) is a Hebrew RTL construction project execution control platform.

It is **not**:
- A generic task manager
- A CRM
- A Kanban board
- A Gantt chart tool
- An AI system

It **is**:
- A field-to-management reporting pipeline
- A daily log → report → visibility chain
- A single source of truth for construction site status

---

## Business Goal

Replace manual field reporting (WhatsApp photos, Excel, phone calls) with a structured digital workflow that gives management real-time visibility — without changing how field engineers work.

---

## Core Flow

```
Field engineer fills Daily Log once
         ↓
System surfaces:
  → Project status
  → Issues visibility
  → Blockers visibility
  → Decisions pending
  → Reports (daily/weekly/monthly)
  → Executive dashboard
```

**The value proposition**: The engineer reports once. Management gets visibility automatically.

---

## MVP Success Criteria

A CEO should understand within 30 seconds:

1. Which projects are active
2. Which projects were updated today (have a daily log)
3. Which projects are **missing** logs (alerts)
4. Which blockers are open and who owns them
5. Which critical issues exist
6. Which decisions are pending and who must make them
7. Which reports were generated this week

---

## User Personas

| Persona | Role | Primary Screen |
|---------|------|----------------|
| אריאל דייטש (Admin) | Company owner / CEO | Executive Dashboard |
| מנהל פרויקט | Project manager | Project Detail, Daily Log form |
| מהנדס שטח | Field engineer | Daily Log form (mobile) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite |
| Routing | TanStack Router (file-based) |
| Data | TanStack React Query + repository pattern |
| UI | Tailwind CSS + shadcn/ui components |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| Charts | Recharts |
| Language/Direction | Hebrew RTL |

---

## Repository Pattern

All data goes through `src/repositories/`. Hooks call repositories. Repositories call Supabase (or return demo data).

```
Hook (useProjects) → projectRepository.list() → Supabase OR DEMO_PROJECTS
```

8 repositories: site, project, task, issue, blocker, decision, report, dailyLog.

---

## DEMO_MODE Architecture

**File**: `src/lib/demo-mode.ts`

```typescript
export const DEMO_MODE = true; // flip to false to restore production
export const DEMO_USER = { id: "demo-admin", email: "admin@mehayesod.co.il", name: "אריאל דייטש", role: "Admin" };
export const DEMO_SESSION: Session = { ... } as unknown as Session;
```

**Pattern in every repository**:
```typescript
if (DEMO_MODE) return [...DEMO_XYZ]; // no Supabase call ever happens
```

**Auth bypass in** `src/lib/auth-context.tsx`:
```typescript
const [session, setSession] = useState(DEMO_MODE ? DEMO_SESSION : null);
const [loading, setLoading] = useState(!DEMO_MODE);
useEffect(() => { if (DEMO_MODE) return; /* Supabase auth ... */ });
```

Auth code is **preserved**, not deleted. One flag restores it.

---

## Mock Data Counts (as of 2026-06-16)

| Entity | Count | File |
|--------|-------|------|
| Sites | 5 | `src/lib/demo-data.ts` — `DEMO_SITES` |
| Projects | 12 | `DEMO_PROJECTS` |
| Tasks | 70 | `DEMO_TASKS` |
| Issues | 25 | `DEMO_ISSUES` |
| Blockers | 15 | `DEMO_BLOCKERS` |
| Decisions | 12 | `DEMO_DECISIONS` |
| Reports | 22 | `DEMO_REPORTS` |
| Daily Logs | 15 | `DEMO_DAILY_LOGS` |
| Site Photos | 12 | `DEMO_PHOTOS` |

---

## CEO Story Architecture (Project States)

| Projects | Site | State | Story |
|----------|------|-------|-------|
| p01, p02, p03 | נוף הכרמל | Active/Healthy | On schedule, logs submitted daily |
| p04, p05, p06 | הדר ירושלים | Active/Issues | Open issues, blockers, concrete test pending |
| p07, p08 | גבעת זאב | On Hold | Multiple blockers, pending decisions |
| p09, p10 | בית ספר מודיעין | Planning | Awaiting permits and budget approvals |
| p11, p12 | הר חוצבים | Completed | Historical reports available |

---

## Photo System (Demo Only — 2026-06-16)

- **Type**: `SitePhoto` in `src/lib/mock-data.ts`
- **Data**: `DEMO_PHOTOS` in `src/lib/demo-data.ts` (12 photos, 6 projects)
- **Categories**: התקדמות / ביצוע / איכות / ליקוי / חסם / בקרה
- **Image source**: `picsum.photos` with consistent seeds (requires internet)
- **Upload simulation**: DEMO_MODE intercepts file input → instant toast + placeholder image
- **Lightbox**: Click any photo in daily log detail → full-screen modal with prev/next

**NOT yet implemented**: Real Supabase Storage upload, persistent photo URLs, mobile camera access.

---

## Verified Demo Routes (as of 2026-06-16)

All 22 routes pass Playwright audit: no empty states, no spinners, no undefined/NaN, zero Supabase calls.

`/` `/executive` `/sites` `/sites/s1–s5` `/projects` `/projects/p01–p12`
`/tasks` `/tasks/t001` `/tasks/t026` `/daily-logs` `/daily-logs/new`
`/daily-logs/l01–l15` `/issues` `/blockers` `/decisions` `/reports` `/reports/r01`

---

## Important Architecture Rules

1. **Never delete auth or Supabase code** — DEMO_MODE must be reversible by one flag
2. **Never use `USING (true)` for RLS** — global CLAUDE.md rule
3. **Never expose service_role keys to frontend** — global CLAUDE.md rule
4. **Never introduce a new Supabase project** — global CLAUDE.md rule
5. Before any Supabase/auth/schema/migration change: produce an **Approval Brief** (see CLAUDE.md)

---

## Current Priority (as of 2026-06-16)

**Today**: CEO demo only. App is in DEMO_MODE. Do not touch.

**After demo**:
1. Create `demo-freeze` branch
2. Collect CEO feedback
3. Restore production auth path
4. Fix admin password (known blocker)
5. Run acceptance testing on live Supabase data
6. Then continue feature work

---

## Explicitly Do NOT Build Yet

These are not approved for this sprint:

- AI summaries or AI chat
- Kanban board
- Gantt chart / timeline
- Workflow engine or automation
- Push notifications
- Slack / email integration
- Advanced dashboards beyond current executive view
- Production photo storage (Supabase Storage) — needs separate approval brief
- Multi-tenant / multi-company architecture

---

## Known Supabase Credentials (committed)

- URL: committed in `.env` / `src/lib/supabase.ts`
- anon key: committed
- Admin password: needs reset (known blocker for production use)

---

## File Map (Key Files)

```
src/lib/demo-mode.ts          ← DEMO_MODE flag + fake session
src/lib/demo-data.ts          ← all mock data (sites, projects, tasks, issues, blockers, decisions, reports, logs, photos)
src/lib/mock-data.ts          ← TypeScript types for all domain entities
src/lib/auth-context.tsx      ← AuthProvider with DEMO_MODE guard
src/repositories/             ← 8 repositories, all with DEMO_MODE intercepts
src/hooks/                    ← React Query hooks wrapping repositories
src/routes/                   ← TanStack Router file-based routes
src/routes/__root.tsx         ← AuthGate (skipped in DEMO_MODE)
docs/                         ← Architecture docs + checkpoints
```
