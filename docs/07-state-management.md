# State Management Architecture — Mehayesod Platform

> Version 1.0 | 2026-06-14

---

## 1. Current State

The application currently uses a custom `useSyncExternalStore`-based in-memory store (`src/lib/mock-data.ts`). This is appropriate for the mock data phase. The migration path to TanStack Query (React Query) is the subject of this document.

---

## 2. Technology Selection

**Chosen: TanStack Query v5 (already installed)**

The project already has `@tanstack/react-query@5.83.0` in `package.json`. It is the correct choice for this application because:

- The data model is heavily server-driven (fetching from Supabase).
- Multiple views display the same data (project health appears on dashboard, project detail, and executive view simultaneously).
- Optimistic updates improve the field experience on mobile networks.
- Background refetching keeps dashboards fresh without full reloads.

**Not needed:**
- Zustand / Redux — no complex client-only shared state.
- Context API for server data — anti-pattern, no cache invalidation.

---

## 3. QueryClient Configuration

```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,        // 2 minutes — data is fresh for 2 min
      gcTime: 1000 * 60 * 10,          // 10 minutes — cache kept for 10 min
      refetchOnWindowFocus: true,       // Refresh when user returns to tab
      refetchOnReconnect: true,         // Refresh after network reconnect
      retry: 2,                         // Retry failed requests twice
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
    mutations: {
      retry: 0,                         // Don't retry mutations — side effects
    },
  },
});
```

**Rationale for 2-minute staleTime:** Construction data changes infrequently within a session (field managers submit once a day). Aggressive caching reduces Supabase read costs without sacrificing correctness.

---

## 4. Query Key Structure

Query keys are the foundation of TanStack Query's cache. Use a hierarchical tuple structure for precise invalidation.

### 4.1 Key Factory Pattern

```typescript
// src/lib/query-keys.ts

export const queryKeys = {
  // Projects
  projects: {
    all: () => ['projects'] as const,
    list: (filters?: ProjectFilters) => ['projects', 'list', filters ?? {}] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
    health: (id: string) => ['projects', 'health', id] as const,
  },

  // Daily Logs
  dailyLogs: {
    all: () => ['daily-logs'] as const,
    list: (filters: DailyLogFilters) => ['daily-logs', 'list', filters] as const,
    detail: (id: string) => ['daily-logs', 'detail', id] as const,
    byProject: (projectId: string) => ['daily-logs', 'list', { projectId }] as const,
    today: (projectId: string) => ['daily-logs', 'today', projectId] as const,
  },

  // Reports
  reports: {
    all: () => ['reports'] as const,
    list: (filters?: ReportFilters) => ['reports', 'list', filters ?? {}] as const,
    detail: (id: string) => ['reports', 'detail', id] as const,
    forLog: (dailyLogId: string) => ['reports', 'for-log', dailyLogId] as const,
  },

  // Issues
  issues: {
    all: () => ['issues'] as const,
    list: (filters?: IssueFilters) => ['issues', 'list', filters ?? {}] as const,
    detail: (id: string) => ['issues', 'detail', id] as const,
    byProject: (projectId: string) => ['issues', 'list', { projectId }] as const,
  },

  // Blockers
  blockers: {
    all: () => ['blockers'] as const,
    list: (filters?: BlockerFilters) => ['blockers', 'list', filters ?? {}] as const,
    detail: (id: string) => ['blockers', 'detail', id] as const,
    byProject: (projectId: string) => ['blockers', 'list', { projectId }] as const,
  },

  // Decisions
  decisions: {
    all: () => ['decisions'] as const,
    list: (filters?: DecisionFilters) => ['decisions', 'list', filters ?? {}] as const,
    detail: (id: string) => ['decisions', 'detail', id] as const,
    byProject: (projectId: string) => ['decisions', 'list', { projectId }] as const,
  },

  // Dashboard
  dashboard: {
    summary: () => ['dashboard', 'summary'] as const,
  },
} as const;
```

### 4.2 Key Hierarchy for Invalidation

```
['projects']              ← invalidates ALL project queries
['projects', 'list', *]   ← invalidates only list queries
['projects', 'detail', id] ← invalidates only one project
```

This hierarchy means invalidating `queryKeys.projects.all()` will bust the list and all detail caches simultaneously.

---

## 5. Query Hooks

Each entity module has its own hooks file.

### 5.1 Projects

```typescript
// src/hooks/use-projects.ts

export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: () => api.projects.list(filters),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => api.projects.get(id),
    enabled: !!id,
  });
}
```

### 5.2 Daily Logs

```typescript
// src/hooks/use-daily-logs.ts

export function useDailyLogs(filters: DailyLogFilters) {
  return useQuery({
    queryKey: queryKeys.dailyLogs.list(filters),
    queryFn: () => api.dailyLogs.list(filters),
  });
}

export function useDailyLog(id: string) {
  return useQuery({
    queryKey: queryKeys.dailyLogs.detail(id),
    queryFn: () => api.dailyLogs.get(id),
    enabled: !!id,
  });
}

// Check if active project has a log today
export function useHasLogToday(projectId: string) {
  return useQuery({
    queryKey: queryKeys.dailyLogs.today(projectId),
    queryFn: () => api.dailyLogs.hasToday(projectId),
    staleTime: 1000 * 60 * 5,  // 5 minutes — this check is expensive if run on every render
  });
}
```

### 5.3 Reports

```typescript
// src/hooks/use-reports.ts

export function useReport(id: string) {
  return useQuery({
    queryKey: queryKeys.reports.detail(id),
    queryFn: () => api.reports.get(id),  // Returns assembled report with daily log content
    enabled: !!id,
  });
}

export function useReportForLog(dailyLogId: string) {
  return useQuery({
    queryKey: queryKeys.reports.forLog(dailyLogId),
    queryFn: () => api.reports.getForLog(dailyLogId),
    enabled: !!dailyLogId,
  });
}
```

---

## 6. Mutation Patterns

### 6.1 Create Daily Log with Optimistic Update

```typescript
// src/hooks/use-create-daily-log.ts

export function useCreateDailyLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDailyLogInput) => api.dailyLogs.create(data),

    onMutate: async (newLog) => {
      // Cancel any in-flight queries that could overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.dailyLogs.all() });

      // Snapshot current data for rollback
      const previousLogs = queryClient.getQueryData(
        queryKeys.dailyLogs.list({ projectId: newLog.projectId })
      );

      // Optimistically add the new log to the list
      queryClient.setQueryData(
        queryKeys.dailyLogs.list({ projectId: newLog.projectId }),
        (old: DailyLog[] | undefined) => [
          { ...newLog, id: 'optimistic-' + Date.now(), createdAt: new Date().toISOString() },
          ...(old ?? []),
        ]
      );

      return { previousLogs };
    },

    onError: (err, newLog, context) => {
      // Rollback on error
      if (context?.previousLogs) {
        queryClient.setQueryData(
          queryKeys.dailyLogs.list({ projectId: newLog.projectId }),
          context.previousLogs
        );
      }
      toast.error('שגיאה ביצירת יומן. נסה שוב.');
    },

    onSuccess: (createdLog) => {
      toast.success('היומן נשמר בהצלחה');
    },

    onSettled: (data, error, variables) => {
      // Always refetch after mutation settles (success or error)
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyLogs.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
      // Also invalidate today's log check for this project
      queryClient.invalidateQueries({
        queryKey: queryKeys.dailyLogs.today(variables.projectId)
      });
    },
  });
}
```

### 6.2 Update Issue Status

```typescript
export function useUpdateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Issue> }) =>
      api.issues.update(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.issues.detail(id) });

      const previousIssue = queryClient.getQueryData<Issue>(queryKeys.issues.detail(id));

      // Optimistically update the cached detail
      queryClient.setQueryData<Issue>(queryKeys.issues.detail(id), (old) =>
        old ? { ...old, ...data } : old
      );

      return { previousIssue };
    },

    onError: (err, { id }, context) => {
      if (context?.previousIssue) {
        queryClient.setQueryData(queryKeys.issues.detail(id), context.previousIssue);
      }
      toast.error('שגיאה בעדכון ליקוי');
    },

    onSettled: (data, error, { id, data: updated }) => {
      // Invalidate detail, lists, and dashboard
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
    },
  });
}
```

### 6.3 Generate Report (Non-optimistic — server-side action)

```typescript
export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dailyLogId: string) => api.reports.generateFromLog(dailyLogId),

    onSuccess: (report) => {
      toast.success('הדוח נוצר בהצלחה');
      // Populate the cache with the new report
      queryClient.setQueryData(queryKeys.reports.detail(report.id), report);
      queryClient.setQueryData(queryKeys.reports.forLog(report.dailyLogId), report);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all() });
    },
  });
}
```

### 6.4 Mark Report Sent

```typescript
export function useMarkReportSent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: string) => api.reports.markSent(reportId),

    onSuccess: (updatedReport) => {
      toast.success('הדוח סומן כנשלח');
      queryClient.setQueryData(queryKeys.reports.detail(updatedReport.id), updatedReport);
    },

    onSettled: (data, error, reportId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
    },
  });
}
```

---

## 7. Dashboard Query

The dashboard requires data from multiple entities simultaneously. Use `useQueries` for parallel fetching.

```typescript
// src/hooks/use-dashboard.ts

export function useDashboardSummary() {
  // Single endpoint that aggregates all dashboard data
  return useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: () => api.dashboard.getSummary(),
    staleTime: 1000 * 60 * 1,  // 1 minute — dashboard should feel live
    refetchInterval: 1000 * 60 * 5,  // Auto-refresh every 5 minutes
  });
}
```

If a dedicated dashboard endpoint isn't available, use parallel queries:

```typescript
export function useDashboardData() {
  return useQueries({
    queries: [
      { queryKey: queryKeys.projects.list(), queryFn: () => api.projects.list() },
      { queryKey: queryKeys.issues.list({ status: 'open' }), queryFn: () => api.issues.list({ status: 'open' }) },
      { queryKey: queryKeys.blockers.list({ status: 'open' }), queryFn: () => api.blockers.list({ status: 'open' }) },
      { queryKey: queryKeys.decisions.list({ status: 'pending' }), queryFn: () => api.decisions.list({ status: 'pending' }) },
    ],
  });
}
```

---

## 8. Cache Invalidation Map

When an entity is mutated, which caches must be invalidated?

| Action | Invalidate |
|---|---|
| Create DailyLog | `dailyLogs.all`, `dashboard.summary`, `dailyLogs.today(projectId)` |
| Update DailyLog | `dailyLogs.detail(id)`, `dailyLogs.all` |
| Delete DailyLog | `dailyLogs.all`, `reports.all`, `dashboard.summary` |
| Create Report | `reports.all`, `reports.forLog(logId)` |
| Update Report status | `reports.detail(id)`, `reports.all`, `dashboard.summary` |
| Create Issue | `issues.all`, `dashboard.summary`, `projects.health(projectId)` |
| Update Issue | `issues.detail(id)`, `issues.all`, `dashboard.summary` |
| Create Blocker | `blockers.all`, `dashboard.summary`, `projects.health(projectId)` |
| Update Blocker | `blockers.detail(id)`, `blockers.all`, `dashboard.summary` |
| Create Decision | `decisions.all`, `dashboard.summary`, `projects.health(projectId)` |
| Update Decision | `decisions.detail(id)`, `decisions.all`, `dashboard.summary` |

---

## 9. Prefetching Strategy

For predictable navigation patterns, prefetch data before the user navigates.

```typescript
// Prefetch project detail when hovering over project in list
function ProjectRow({ project }: { project: Project }) {
  const queryClient = useQueryClient();

  const prefetchProject = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.projects.detail(project.id),
      queryFn: () => api.projects.get(project.id),
      staleTime: 1000 * 60,
    });
  };

  return (
    <tr onMouseEnter={prefetchProject}>
      {/* ... */}
    </tr>
  );
}
```

---

## 10. Migration from Mock Store

The migration from `useSyncExternalStore` to TanStack Query requires:

1. **Keep mock-data.ts as the data source** during development — wrap it in an async function that returns mock data.
2. **Write API service layer** (`src/lib/api/`) that calls either mock functions or real Supabase client based on an env flag.
3. **Replace `useStore()` calls** with specific query hooks (`useProjects()`, `useDailyLogs()`, etc.).
4. **Remove `store.addX()` calls** and replace with mutation hooks.

The API service layer acts as the seam:

```typescript
// src/lib/api/daily-logs.ts
import { store } from '../mock-data';  // Phase 1
// import { supabase } from '../supabase';  // Phase 2

export const dailyLogsApi = {
  list: async (filters: DailyLogFilters) => {
    // Phase 1: return mock data
    return store.get().dailyLogs.filter(/* ... */);

    // Phase 2: return from Supabase
    // const { data } = await supabase.from('daily_log').select('*');
    // return data;
  },
};
```

This swap requires no changes to the components — they call the same hooks regardless of the underlying data source.
