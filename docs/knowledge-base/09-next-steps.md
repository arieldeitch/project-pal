# 09 — Next Steps

> Last updated: 2026-06-15
> Current state: MVP feature-complete. Supabase project connected. Migrations pending.

---

## Immediate — Supabase Deployment

This is the only active work item. No new features until this is complete.

See `DATABASE_DEPLOYMENT_ORDER.md` and `GO_LIVE_CHECKLIST.md` for exact steps.

### Phase A — Migrations (before admin creation)
Run in Supabase SQL Editor in this exact order:
```
001 → 002 → 003 → 005 → 006 → 007 → 009
```

### Admin Creation (between phases)
1. In Supabase Auth dashboard: create admin user
2. Confirm email (autoconfirm is OFF — enable temporarily or click confirmation link)
3. In SQL Editor: set `user_profile.role = 'admin'`
4. Verify: `SELECT COUNT(*) FROM user_profile WHERE role = 'admin';` → must return 1

### Phase B — Strict RLS (after admin creation)
```
010 → 011 → 012
```

### Post-Deployment Verification
1. Run `POST_DEPLOYMENT_VERIFICATION.sql` in Supabase SQL Editor
2. Run smoke tests from `DEPLOYMENT_SMOKE_TEST.md` (49 tests)
3. Confirm all go/no-go criteria pass

---

## Phase 2 — Field Reporting and PDF Generation

**Gate:** Do not begin until Supabase deployment is verified and product owner approves.

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
