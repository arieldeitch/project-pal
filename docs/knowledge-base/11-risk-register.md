# 11 — Risk Register

## Active Risks

### R-04: Photo Upload Not Implemented
**Severity:** Medium (feature gap)
**Description:** The daily log create form had its photo section removed. Issue create/edit forms reference photos that cannot be uploaded. All photos in the DB are seed placeholders.
**Mitigation:** Document the limitation clearly. Show gray placeholder where photos would appear.
**Resolution:** Phase 2 — implement Supabase Storage + photo upload.

---

### R-05: Build Chunk Size Warning
**Severity:** Low (performance advisory)
**Description:** Two chunks exceed Vite's 500 KB warning threshold (`index` bundle ~781 KB, `executive` ~410 KB). This is a performance concern for slow connections.
**Mitigation:** Warning only — does not affect build or runtime. Monitor load time.
**Resolution:** Future optimization — lazy-load executive dashboard route to separate Recharts from main bundle.

---

### R-06: CRLF Lint Errors
**Severity:** Low (cosmetic)
**Description:** All files have Windows CRLF line endings. Prettier ESLint plugin expects LF. `npm run lint` exits with code 1.
**Mitigation:** Does not affect build or runtime.
**Resolution:** Run `npm run format` once to fix all files.

---

### R-07: Edit Daily Log Not Possible
**Severity:** Medium (UX limitation)
**Description:** The immutability trigger (`prevent_log_edit_if_report_sent`) blocks editing a log after a report is sent. But there is also no edit UI at all — even before a report is generated.
**Mitigation:** Site managers must be trained: log creation is final. Errors require creating a new log.
**Resolution:** Future — add edit-before-report-sent UI flow. Out of current scope.

---

### R-08: PostgREST FK Disambiguation
**Severity:** Medium (risk of regression)
**Description:** The `photo` table has two FK columns (`daily_log_id`, `issue_id`). PostgREST requires explicit disambiguation (`photo!daily_log_id`). If a developer changes the select query without knowing this, they'll get a 400 error.
**Mitigation:** Documented in `04-database-architecture.md`. The select strings are in `dailyLogRepository.ts` and `issueRepository.ts`.
**Resolution:** Keep a comment in the repository files explaining why the `!column_name` syntax is used.

---

### R-09: Admin Login Returns "Invalid Credentials"
**Severity:** High (blocks acceptance testing)
**Description:** The admin user in Supabase Auth cannot log in — returns "Invalid login credentials". The Supabase endpoint is reachable and responding correctly. This is a password/credential problem, not a code problem.
**Mitigation:** Do not attempt acceptance testing until resolved.
**Resolution:** Reset the admin user's password via Supabase Dashboard → Authentication → Users → Send password reset or manually set new password.

---

## Resolved Risks

### R-99: useSyncExternalStore Mock Data
**Was:** All data was in-memory; refreshing the page reset all mutations.
**Resolved:** Phase 2 complete — all routes connected to Supabase via React Query.

---

### R-01: No Authentication or RLS
**Was:** All Supabase tables fully accessible with the anon key. No login enforced.
**Resolved:** Migrations 007/009/010/011/012 deployed. RLS enabled on all 16 tables, 61 policies active. AuthGate enforces login. DEV_BYPASS removed in commit `01f6422`.

---

### R-02: Env Vars Not Configured
**Was:** `.env.local` contained placeholder values; Lovable Cloud builds had no credentials.
**Resolved:** `.env` committed to git (commit `1a46cb1`). Real URL and anon key baked into all builds. Placeholder fallback removed from `supabase.ts`; missing credentials now throw immediately.

---

### R-03: Migrations Never Applied to a Real DB
**Was:** Migration files existed but had never been run against a real Supabase project.
**Resolved:** 10 migrations applied (001, 002, 003, 005, 006, 007, 009, 010, 011, 012). DB verification confirmed: 16 tables, 16 with RLS, 61 policies, 4 views, 15 triggers, 1 admin user.
