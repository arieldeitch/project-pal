# 09 — Next Steps

> Last updated: 2026-06-15
> Current state: MVP deployed. Auth enforced. DB live. Awaiting acceptance testing.

---

## Immediate — Unblock Admin Login

**Status:** The admin user in Supabase returns "Invalid login credentials" on login attempt.
This is a credentials issue, not a code or connectivity issue.

**Action:**
1. Open Supabase Dashboard → Authentication → Users
2. Find the admin user
3. Use "Send password reset" or manually set a new password
4. Confirm the user's email is verified (autoconfirm may be OFF — check Authentication → Settings)
5. Log in via the app at `/login`

**This is the only blocker before acceptance testing.**

---

## Acceptance Testing

Once login is unblocked:

Run the 49 smoke tests in `DEPLOYMENT_SMOKE_TEST.md` (if it exists) or execute manual verification:

1. Log in as admin
2. Verify redirect from `/login` → `/`
3. Create a new project
4. Add a daily log
5. Add an issue and mark it resolved
6. Add a blocker
7. Log a decision
8. View executive dashboard — verify all KPIs reflect live data
9. Export CSV from any list
10. Log out — verify redirect to `/login`
11. Verify unauthenticated access to `/` redirects to `/login`

---

## Phase 2 — Field Reporting and PDF Generation

**Gate:** Do not begin until acceptance testing is complete and product owner approves.

Phase 2 scope is defined by two reference documents provided by the product owner:
- Daily Work Log PDF (יומן עבודה)
- Engineering Response PDF (דוח תגובה הנדסי)

Full field specifications are in `docs/knowledge-base/13-reference-report-specifications.md`.

### Phase 2a — Daily Work Log PDF
1. Design branded PDF template (A4, RTL, company logo, footer)
2. Extend daily log data model with: work location per entry, note categories (supervision / safety / quality), formal role holder fields (work manager, safety officer)
3. Implement PDF generation (server-side via Supabase Edge Function or `@react-pdf/renderer`)
4. Test Hebrew RTL rendering and Excel/PDF interoperability

### Phase 2b — Engineering Response Report
1. New data entities: `EngineeringFinding`, `EngineeringResponse`, `StandardReference`, `CostEstimate`
2. UI: finding entry form, response form, cost table, photo attachments
3. PDF template: professional report layout matching reference document
4. Digital signature field (captured as text/image — not cryptographic at MVP)

### Phase 2c — Photo Storage
1. Create `photos` Supabase Storage bucket with per-project RLS
2. Wire photo upload in daily log form
3. Wire photo upload in issue form
4. Photos attach to field notes in Engineering Response report

---

## Phase 3 — Future (Not Yet Scoped)

Do not plan or implement until Phase 2 is complete and product owner explicitly approves.

Possible directions (not commitments):
- Advanced analytics / cross-project reporting
- Automated report delivery by email
- Mobile-first PWA
- Multi-tenant company isolation layer
- Notifications (missing log alerts, blocker escalation)
