# 09 — Next Steps

## Immediate (Before Phase 3)

### 1. Connect to Supabase (1 hour)
See `docs/TOMORROW_ACTION_PLAN.md` for exact steps.

1. Create Supabase project
2. Fill `.env.local` with real credentials
3. Apply 4 migration files in order
4. Validate seed data counts in Table Editor
5. `npm run dev` → test all 12 screens
6. Produce bug list in `docs/BUG_LIST.md`
7. Fix high-severity bugs

---

## Phase 3 — Authentication + RLS + Storage

**Gate:** Produce and get approval for an Approval Brief before starting (per global CLAUDE.md rules). The brief must cover: new tables, RLS policies, auth config, storage bucket setup.

### 3a. Authentication
1. Enable Supabase Auth (email + password for MVP)
2. Create `project_member` table (migration)
3. Add login route (`src/routes/login.tsx`)
4. Add auth middleware to TanStack Router root
5. Wire `useSession()` hook in `__root.tsx`
6. Add redirect-to-login if unauthenticated

### 3b. RLS Policies (migration)
1. Enable RLS on all tables
2. Add `project_member`-based policies (read access)
3. Add write policies (managers can write to their projects)
4. Test: anon user should get 0 rows; authenticated member should get project rows only

### 3c. Storage
1. Create `photos` bucket in Supabase Storage
2. Add storage RLS policies (per-project access)
3. Restore photo upload UI in daily log create form
4. Restore photo upload UI in issue create/edit form
5. Update `photoUrl()` in repositories to generate public signed URLs
6. Test photo upload and display end-to-end

---

## Phase 4 — PDF Export

1. Add PDF generation library (`@react-pdf/renderer` or similar)
2. Create report PDF template (Hebrew, RTL)
3. Wire "Download PDF" button in report detail page
4. Test PDF output for a complete daily log

---

## Phase 5 — Production Deployment

1. Choose hosting: Vercel, Netlify, or custom
2. Set up production Supabase project (separate from dev)
3. Configure environment variables in hosting platform
4. Set up CI/CD (run `npm run build` + `npm run lint` on push)
5. Configure custom domain
6. Run final end-to-end test on production

---

## Future Considerations (Backlog)

These are not scheduled but should be tracked:

- Email sending of PDF reports (Resend, SendGrid, or Supabase Edge Functions)
- Weekly/monthly report generation
- Issue and blocker detail pages
- Edit daily log (with approval flow to bypass immutability trigger)
- Mobile-first design pass
- Multi-tenant SaaS (company isolation layer)
- Notifications (email digest, push)
- Excel/CSV export
