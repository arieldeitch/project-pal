# 05 — Supabase Architecture

## Client Setup

**File:** `src/lib/supabase.ts`

Singleton pattern — one client for the entire app:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder"
);
```

The fallback to placeholder values prevents a crash on startup if env vars are missing. The app will fail to fetch data but won't throw on import.

---

## Environment Variables

| Variable | Description | File |
|---|---|---|
| `VITE_SUPABASE_URL` | Project API URL | `.env.local` |
| `VITE_SUPABASE_ANON_KEY` | Public anon JWT | `.env.local` |

**Never use `service_role` key in frontend code.** Only `anon` key is safe to expose.

---

## Current State: No RLS, No Auth

As of Phase 2, RLS is OFF and Auth is not implemented. All tables are accessible with the anon key. This is intentional for MVP development speed.

**This must change before any production deployment.**

---

## RLS Strategy (Phase 3 Plan)

When implementing auth, the planned RLS design is:

### project_member table (to be created in Phase 3)
```sql
CREATE TABLE project_member (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES project(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('manager', 'viewer', 'admin')),
  UNIQUE(project_id, user_id)
);
```

### RLS Policy Pattern
```sql
-- Project: users can only read projects they're members of
CREATE POLICY "project_member_read" ON project
  FOR SELECT USING (
    id IN (SELECT project_id FROM project_member WHERE user_id = auth.uid())
  );
```

All child tables (daily_log, issue, blocker, etc.) inherit access via the project:
```sql
-- daily_log: access if user is member of the log's project
CREATE POLICY "log_member_read" ON daily_log
  FOR SELECT USING (
    project_id IN (SELECT project_id FROM project_member WHERE user_id = auth.uid())
  );
```

**Important:** Never use `USING (true)` as a shortcut. All RLS policies must reference `project_member`.

---

## Auth Plan (Phase 3)

1. Enable Supabase Auth (email/password for MVP)
2. Add `project_member` table (migration)
3. Add RLS policies (migration)
4. Add auth middleware to TanStack Router (redirect to login if not authenticated)
5. Add login page (`src/routes/login.tsx`)
6. Wire `useSession()` hook in `__root.tsx`

**Gate:** Produce Approval Brief before implementing any auth/RLS change (per global CLAUDE.md rules).

---

## Storage Plan (Phase 3/4)

### Bucket Design
```
photos/
  {project_id}/
    logs/
      {daily_log_id}/
        {photo_id}.jpg
    issues/
      {issue_id}/
        {photo_id}.jpg
```

### Storage RLS
Photos bucket must be restricted: only authenticated members of the project can read/write photos for that project.

### Current Photo State
The `photo.storage_key` field currently contains placeholder values (not real storage paths). The `dailyLogRepository.photoUrl()` function detects this:
```typescript
function photoUrl(storageKey: string): string {
  if (storageKey.startsWith("https://")) return storageKey;
  return PHOTO_PLACEHOLDER; // gray SVG data URI
}
```

---

## Supabase Features Used

| Feature | Status |
|---|---|
| PostgreSQL (tables, views, triggers) | ✅ Used |
| PostgREST (REST API via supabase-js) | ✅ Used |
| Supabase JS client | ✅ Used |
| Supabase Auth | ❌ Not yet |
| RLS | ❌ Not yet |
| Supabase Storage | ❌ Not yet |
| Edge Functions | ❌ Not needed for MVP |
| Realtime subscriptions | ❌ Not needed for MVP |
