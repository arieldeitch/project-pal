# CLAUDE HANDOFF — MEHAYESOD
Date: 2026-06-16

---

## Current Instruction

**Development is paused. Do not continue coding unless explicitly instructed.**

The app is demo-ready for a CEO presentation today. The working state is stable, committed, and pushed to `origin/main` (commit `86874b3`).

---

## Last Completed Work

| Session | What Was Done |
|---------|--------------|
| Phase 1 | DB migrations, Supabase schema, seed data |
| Phase 2 | Supabase + React Query integration, 12 routes migrated |
| Phase 3 | Auth enforced, admin login working |
| Demo Prep | `DEMO_MODE = true`, fake session, 8 repositories intercepted |
| Mock Data | 5 sites / 12 projects / 70 tasks / 25 issues / 15 blockers / 12 decisions / 22 reports / 15 daily logs |
| Audit | Playwright audit of 22 routes — all passed |
| Photos | 12 demo photos, daily log gallery + lightbox, project photos widget, executive photos card, daily log form upload section |
| Commit | `86874b3` pushed to `origin/main` |

---

## Current Working Assumption

The app is demo-ready for CEO presentation.
`DEMO_MODE = true` is active.
All 22 routes render correctly with Hebrew mock data.
No Supabase calls occur in demo mode.
The demo photo upload flow works: click → instant toast → thumbnail appears.

---

## ⚠️ Critical Warnings

```
DO NOT set DEMO_MODE = false before the demo.
DO NOT reconnect Supabase before the demo.
DO NOT introduce authentication blockers before the demo.
DO NOT modify src/lib/demo-mode.ts before the demo.
DO NOT modify src/lib/demo-data.ts before the demo.
DO NOT run database migrations before the demo.
```

The only file that controls demo mode is `src/lib/demo-mode.ts`.
The only change needed to restore production: `DEMO_MODE = false`.

---

## After Demo — Recommended Actions (in order)

### Step 1 — Freeze
```bash
git checkout -b demo-freeze
git push origin demo-freeze
```
Preserve the exact demo state as a named branch.

### Step 2 — Capture Feedback
Write down CEO feedback before touching any code.
Questions to answer:
- What resonated most?
- What was confusing?
- What was missing?
- Which user persona matters first (CEO, project manager, or field engineer)?

### Step 3 — Prioritize
Based on feedback, decide:
- Does the field engineer Daily Log form need mobile-first redesign?
- Does the Executive Dashboard need new KPIs?
- Does photo upload need real Supabase Storage? (needs Approval Brief per CLAUDE.md)

### Step 4 — Restore Production Auth
```typescript
// src/lib/demo-mode.ts
export const DEMO_MODE = false; // restore this
```
Then fix admin password via Supabase Dashboard.
Then run acceptance testing on real data path.

### Step 5 — Only Then Continue Features
Do not build new features while demo mode is active and untested production path exists.

---

## Next Likely Feature (Post-Demo)

**Field engineer Daily Log workflow** — highest business value:

- Mobile-first Daily Log form
- Camera integration (real file upload → Supabase Storage)
- Contractor + equipment tracking
- Work description with item-by-item breakdown
- One-tap "generate report" from log
- PDF export of daily report
- Send report to client via WhatsApp / email

This requires:
1. Approval Brief for Supabase Storage (per CLAUDE.md global rule)
2. Mobile testing on iPhone/Android
3. Real field engineer user testing

---

## Known Technical Debt

| Item | Where | Priority |
|------|-------|----------|
| Admin password not set | Supabase Dashboard | High (blocks production) |
| `reports.index.tsx` has 6 pre-existing TypeScript errors | `src/routes/reports.index.tsx` | Medium |
| Photo images require internet (picsum.photos) | `src/lib/demo-data.ts` | Low (demo only) |
| No mobile testing done | All routes | Medium |
| No real acceptance testing on Supabase data path | All repositories | High (before production) |

---

## Key Files — Do Not Accidentally Modify

```
src/lib/demo-mode.ts          ← DEMO_MODE flag — do not touch before demo
src/lib/demo-data.ts          ← all mock data — do not touch before demo
src/lib/auth-context.tsx      ← auth bypass — do not touch before demo
src/repositories/             ← all have DEMO_MODE guards — do not touch
```

---

## Architecture Constraint (Global CLAUDE.md)

Before any change involving:
- Supabase auth, auth.users, RLS policies
- Database schema or migrations
- Environment variables or service_role keys
- Deployment configuration or production data
- Security permissions

→ **Stop and produce an Approval Brief first.**

See `C:\Users\user\.claude\CLAUDE.md` for full format.

---

## How to Resume This Project

1. Read `docs/CHECKPOINT_2026_06_16_DEMO_READY.md` for current state
2. Read `docs/MEHAYESOD_GPT_MEMORY_2026_06_16.md` for product context
3. Check `git log --oneline -10` to confirm you are on `main` at `86874b3`
4. Run `npm run dev` to start the app
5. Confirm `DEMO_MODE = true` in `src/lib/demo-mode.ts`
6. Only then proceed with whatever is instructed
