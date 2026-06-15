# 11 — Risk Register

## Active Risks

### R-01: No Authentication or RLS
**Severity:** Critical (before production)
**Description:** All Supabase tables are fully accessible with the anon key. Any person who knows the Supabase project URL and anon key can read and write all data.
**Mitigation:** Do not expose the app publicly until Phase 3 (auth + RLS) is complete. Use the app only in a controlled, non-public environment.
**Resolution:** Phase 3 — implement Supabase Auth + RLS policies.

---

### R-02: Env Vars Not Configured
**Severity:** High (blocking for development)
**Description:** `.env.local` exists but contains placeholder values. The app will not connect to Supabase until real credentials are entered.
**Mitigation:** Follow `docs/TOMORROW_ACTION_PLAN.md` Step 2 to fill in real values.
**Resolution:** Fill `.env.local` with real Supabase URL + anon key.

---

### R-03: Migrations Never Applied to a Real DB
**Severity:** High (blocking for runtime validation)
**Description:** Migration files exist and are correct SQL, but they have not been run against any real Supabase project. There may be errors discovered at apply time.
**Mitigation:** Apply migrations in a dev Supabase project first, then validate.
**Resolution:** Follow `docs/TOMORROW_ACTION_PLAN.md` Step 3.

---

### R-04: Photo Upload Not Implemented
**Severity:** Medium (feature gap)
**Description:** The daily log create form had its photo section removed. Issue create/edit forms reference photos that cannot be uploaded. All photos in the DB are seed placeholders.
**Mitigation:** Document the limitation clearly. Show gray placeholder where photos would appear.
**Resolution:** Phase 3 — implement Supabase Storage + photo upload.

---

### R-05: Build Chunk Size Warning
**Severity:** Low (performance advisory)
**Description:** Two chunks exceed Vite's 500 KB warning threshold (`index` bundle ~565 KB, `executive` ~410 KB). This is a performance concern for slow connections.
**Mitigation:** Warning only — does not affect build or runtime. Monitor load time.
**Resolution:** Future optimization — lazy-load executive dashboard route to separate Recharts from main bundle.

---

### R-06: CRLF Lint Errors
**Severity:** Low (cosmetic)
**Description:** All files have Windows CRLF line endings. Prettier ESLint plugin expects LF. `npm run lint` exits with code 1.
**Mitigation:** Does not affect build or runtime.
**Resolution:** Run `npm run format` once to fix all files. Or add `"endOfLine": "lf"` to `.prettierrc`.

---

### R-07: Edit Daily Log Not Possible
**Severity:** Medium (UX limitation)
**Description:** The immutability trigger (`prevent_log_edit_if_report_sent`) blocks editing a log after a report is sent. But there's also no edit UI at all — even before a report is generated.
**Mitigation:** Site managers must be trained: log creation is final. Errors require creating a new log (after the trigger allows deletion of the old one, if no report was sent).
**Resolution:** Future — add edit-before-report-sent UI flow. Out of current scope.

---

### R-08: PostgREST FK Disambiguation
**Severity:** Medium (risk of regression)
**Description:** The `photo` table has two FK columns (`daily_log_id`, `issue_id`). PostgREST requires explicit disambiguation (`photo!daily_log_id`). If a developer changes the select query without knowing this, they'll get a 400 error.
**Mitigation:** Documented in `04-database-architecture.md`. The select strings are in `dailyLogRepository.ts` and `issueRepository.ts`.
**Resolution:** Keep a comment in the repository files explaining why the `!column_name` syntax is used.

---

## Resolved Risks

### R-99: useSyncExternalStore Mock Data
**Was:** All data was in-memory; refreshing the page reset all mutations.
**Resolved:** Phase 2 complete — all routes connected to Supabase via React Query.
