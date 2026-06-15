# 06 — Frontend Architecture

## Stack

| Layer | Technology |
|---|---|
| Meta-framework | TanStack Start |
| Router | TanStack Router (file-based) |
| Data fetching | TanStack Query v5 |
| DB client | Supabase JS v2 |
| UI | shadcn/ui + Radix UI |
| Styling | Tailwind CSS v4 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Toasts | Sonner |
| Icons | Lucide React |

---

## File Structure

```
src/
  lib/
    supabase.ts          Supabase singleton client
    mock-data.ts         TypeScript types + label dictionaries only
                         (mock data and store have been removed)
  repositories/          DB access layer — one file per entity
    projectRepository.ts
    dailyLogRepository.ts
    issueRepository.ts
    blockerRepository.ts
    decisionRepository.ts
    reportRepository.ts
  hooks/                 TanStack Query wrappers — one file per entity
    useProjects.ts
    useDailyLogs.ts
    useIssues.ts
    useBlockers.ts
    useDecisions.ts
    useReports.ts
  routes/                File-based page components
    __root.tsx           Root layout + QueryClientProvider + Sidebar
    index.tsx            Dashboard (/)
    projects.index.tsx   Projects list (/projects/)
    projects.$projectId.tsx  Project detail (/projects/:id)
    daily-logs.index.tsx Daily logs list (/daily-logs/)
    daily-logs.new.tsx   Create log (/daily-logs/new)
    daily-logs.$logId.tsx Log detail (/daily-logs/:id)
    issues.index.tsx     Issues (/issues/)
    blockers.index.tsx   Blockers (/blockers/)
    decisions.index.tsx  Decisions (/decisions/)
    reports.index.tsx    Reports (/reports/)
    reports.$reportId.tsx Report detail (/reports/:id)
    executive.tsx        Executive dashboard (/executive)
  components/
    AppSidebar.tsx       Navigation sidebar
    StatusBadges.tsx     Colored status badges for all entity statuses
    ui/                  shadcn/ui generated components (do not edit)
```

---

## Data Flow

```
Component
  → useXxx() hook (TanStack Query)
      → repository.fn() (async)
          → supabase.from('table').select/insert/update
              → PostgREST API
                  → Supabase PostgreSQL

On response:
  repository.fn() transforms snake_case → camelCase
  TanStack Query caches result by queryKey
  Component re-renders with data
```

---

## Repository Pattern

Each repository:
- Imports the singleton `supabase` client
- Exports named async functions: `list`, `get`, `create`, `update`
- Handles all PostgREST query construction
- Transforms DB row format (snake_case) → TypeScript type (camelCase)

The UI components never import `supabase` directly. All DB access goes through repositories.

---

## Query Key Convention

```typescript
const KEYS = {
  all: ["entityName"] as const,
  detail: (id: string) => ["entityName", id] as const,
  filtered: (filter: object) => ["entityName", filter] as const,
};
```

Cache invalidation uses the prefix: `queryClient.invalidateQueries({ queryKey: ["entityName"] })` — this invalidates all queries starting with that key (list + all detail queries).

---

## Routing

TanStack Router uses file-based routing. Route params (like `$projectId`, `$logId`, `$reportId`) are typed and available via `Route.useParams()`.

The root route (`__root.tsx`) is configured with:
```typescript
createRootRouteWithContext<{ queryClient: QueryClient }>()
```

This injects `queryClient` into the router context, enabling prefetching patterns in future phases.

Not-found handling: when a detail query returns null, components call `throw notFound()` which triggers TanStack Router's 404 mechanism.

---

## Hook Pattern (Read + Mutations)

```typescript
// Read
export function useProjects() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: projectRepository.list,
  });
}

// Mutation
export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: projectRepository.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
```

Per-call `onSuccess`/`onError` can be passed to `.mutate()` or `.mutateAsync()` for dialog-close behavior:

```typescript
createProject.mutate(input, {
  onSuccess: () => setOpen(false),
  onError: () => toast.error("שגיאה"),
});
```

---

## React Rules Compliance

All hooks are called unconditionally at the top of the component, before any early returns. This is required by React's Rules of Hooks.

Pattern in detail pages:
```typescript
function ProjectDetail() {
  const { projectId } = Route.useParams();
  // ALL hooks called first
  const { data: project, isLoading } = useProject(projectId);
  const { data: logs = [] } = useDailyLogs({ projectId });
  // ... more hooks ...

  // Early returns AFTER all hook calls
  if (isLoading) return <div>טוען...</div>;
  if (!project) throw notFound();

  return <div>...</div>;
}
```

---

## Loading States

All data-bound pages show a simple Hebrew loading text while queries are pending:
```tsx
if (isLoading) return <div>טוען...</div>;
```

No skeleton loaders. No Suspense. React Query's `isLoading` flag is the single mechanism.

---

## RTL Layout

The app is Hebrew-first RTL. Key points:
- `<html dir="rtl">` set in root
- Tailwind v4 RTL utility classes used (`start-*`, `end-*` instead of `left-*`, `right-*` where needed)
- Sidebar is on the right in the design
- Forms flow right-to-left
