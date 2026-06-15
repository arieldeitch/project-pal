# SCREEN_AUDIT.md
> Generated: 2026-06-15
> Total routes: 18
> Auth required: 17 of 18 (login page is the exception)

---

## Route Inventory

### `/login`
| Field | Value |
|---|---|
| **File** | `src/routes/login.tsx` |
| **Purpose** | Email + password authentication form |
| **Data source** | `supabase.auth.signInWithPassword()` |
| **Auth required** | No (public) |
| **Employee access** | Yes |
| **Manager/Admin access** | Yes |
| **CRUD** | Read-only form; mutates auth session |
| **Completion** | 100% |
| **Notes** | RTL Hebrew UI; error messages translated to Hebrew; redirects to `/` on success |

---

### `/` (Dashboard)
| Field | Value |
|---|---|
| **File** | `src/routes/index.tsx` |
| **Purpose** | Operational dashboard — project list, open issues, blockers summary |
| **Data source** | `useProjects`, `useDailyLogs`, `useIssues`, `useBlockers`, `useDecisions` |
| **Auth required** | Yes |
| **Employee access** | Yes (sees all projects — field_manager scope enforced at DB layer after RLS) |
| **Manager/Admin access** | Yes |
| **CRUD** | Read-only |
| **Completion** | 100% |
| **Notes** | Shows projects missing daily logs today; links to project detail; uses `hasLogToday()` helper |

---

### `/executive`
| Field | Value |
|---|---|
| **File** | `src/routes/executive.tsx` |
| **Purpose** | Executive KPI dashboard — charts, stats, all-project overview |
| **Data source** | `useProjects`, `useDailyLogs`, `useIssues`, `useBlockers`, `useDecisions`, `useReports` |
| **Auth required** | Yes |
| **Employee access** | Yes (but UI is management-oriented — no write actions) |
| **Manager/Admin access** | Yes |
| **CRUD** | Read-only |
| **Completion** | 100% |
| **Notes** | Recharts bar/pie charts; 8 KPI stat cards; missing-logs table; blockers panel; decisions panel |

---

### `/sites`
| Field | Value |
|---|---|
| **File** | `src/routes/sites.index.tsx` |
| **Purpose** | Site list — all construction sites, create new site |
| **Data source** | `useSites`, `useCreateSite` |
| **Auth required** | Yes |
| **Employee access** | Read only (after migration 010 — admin-only write) |
| **Manager/Admin access** | Full CRUD |
| **CRUD** | Create ✓, Read ✓, Update ✗ (edit not on list page), Delete ✗ |
| **Completion** | 85% |
| **Notes** | Missing: inline edit on site cards. Edit available on detail page. Create form is inline (not modal). |

---

### `/sites/$siteId`
| Field | Value |
|---|---|
| **File** | `src/routes/sites.$siteId.tsx` |
| **Purpose** | Site detail — shows site metadata + linked projects |
| **Data source** | `useSite`, `useProjects` (filtered by siteId) |
| **Auth required** | Yes |
| **Employee access** | Read only |
| **Manager/Admin access** | Read only (edit not implemented) |
| **CRUD** | Read only |
| **Completion** | 70% |
| **Notes** | Missing: inline edit form for site. `throw notFound()` on missing site. |

---

### `/projects`
| Field | Value |
|---|---|
| **File** | `src/routes/projects.index.tsx` |
| **Purpose** | Project list table — create and edit projects |
| **Data source** | `useProjects`, `useSites`, `useCreateProject`, `useUpdateProject` |
| **Auth required** | Yes |
| **Employee access** | Read only |
| **Manager/Admin access** | Create + Edit |
| **CRUD** | Create ✓, Read ✓, Update ✓, Delete ✗ |
| **Completion** | 90% |
| **Notes** | Create dialog + edit dialog (pencil button per row). Site dropdown links project to site. Missing: delete. |

---

### `/projects/$projectId`
| Field | Value |
|---|---|
| **File** | `src/routes/projects.$projectId.tsx` |
| **Purpose** | Project detail — stats, recent logs, open issues, blockers, decisions |
| **Data source** | `useProject`, `useDailyLogs`, `useIssues`, `useBlockers`, `useDecisions` |
| **Auth required** | Yes |
| **Employee access** | Yes (own projects only after RLS) |
| **Manager/Admin access** | Yes |
| **CRUD** | Read only |
| **Completion** | 95% |
| **Notes** | Full project overview page; links to daily log creation; summary stat cards |

---

### `/tasks`
| Field | Value |
|---|---|
| **File** | `src/routes/tasks.index.tsx` |
| **Purpose** | Task list — all tasks across all projects, create task, filter by status |
| **Data source** | `useTasks`, `useCreateTask`, `useProjects` |
| **Auth required** | Yes |
| **Employee access** | Yes (own project tasks after RLS) |
| **Manager/Admin access** | Yes (all tasks) |
| **CRUD** | Create ✓, Read ✓, Update ✗ (via detail page), Delete ✗ |
| **Completion** | 90% |
| **Notes** | Status filter bar (all/not_started/in_progress/blocked/completed); progress bar per task; links to task detail |

---

### `/tasks/$taskId`
| Field | Value |
|---|---|
| **File** | `src/routes/tasks.$taskId.tsx` |
| **Purpose** | Task detail — progress bar, employee updates, management comments |
| **Data source** | `useTask`, `useAddTaskUpdate`, `useAddTaskComment`, `useSession`, `useProjects` |
| **Auth required** | Yes |
| **Employee access** | Yes — can submit task updates |
| **Manager/Admin access** | Yes — can add management comments (amber section) |
| **CRUD** | Read ✓, Create task_update ✓, Create task_comment ✓, Update task ✗, Delete ✗ |
| **Completion** | 90% |
| **Notes** | submittedBy pre-filled from session.user.email; management comments styled amber; immutable updates styled blue |

---

### `/daily-logs`
| Field | Value |
|---|---|
| **File** | `src/routes/daily-logs.index.tsx` |
| **Purpose** | Daily log list — all logs, filtered per project |
| **Data source** | `useDailyLogs`, `useProjects` |
| **Auth required** | Yes |
| **Employee access** | Yes (own projects after RLS) |
| **Manager/Admin access** | Yes |
| **CRUD** | Read ✓, Create via `/daily-logs/new` link |
| **Completion** | 100% |
| **Notes** | Lists logs newest-first; project filter dropdown; log number displayed |

---

### `/daily-logs/new`
| Field | Value |
|---|---|
| **File** | `src/routes/daily-logs.new.tsx` |
| **Purpose** | Create daily log — full form with contractors, equipment, work description |
| **Data source** | `useCreateDailyLog`, `useProjects`, `useSession` |
| **Auth required** | Yes |
| **Employee access** | Yes |
| **Manager/Admin access** | Yes |
| **CRUD** | Create only |
| **Completion** | 100% |
| **Notes** | submittedBy pre-filled from session.user.email; dynamic contractor/equipment rows; prevents duplicate (project+date) |

---

### `/daily-logs/$logId`
| Field | Value |
|---|---|
| **File** | `src/routes/daily-logs.$logId.tsx` |
| **Purpose** | Daily log detail — read-only view of submitted log |
| **Data source** | `useDailyLog` |
| **Auth required** | Yes |
| **Employee access** | Yes |
| **Manager/Admin access** | Yes |
| **CRUD** | Read only |
| **Completion** | 100% |
| **Notes** | Shows contractor table, equipment table, work description list, photos |

---

### `/issues`
| Field | Value |
|---|---|
| **File** | `src/routes/issues.index.tsx` |
| **Purpose** | Issue list — punch list and quality defects; create/edit issues; comment threads |
| **Data source** | `useIssues`, `useCreateIssue`, `useUpdateIssue`, `useAddIssueComment`, `useSession`, `useProjects` |
| **Auth required** | Yes |
| **Employee access** | Yes — can create issues, add comments |
| **Manager/Admin access** | Yes — full CRUD |
| **CRUD** | Create ✓, Read ✓, Update ✓, Delete ✗ |
| **Completion** | 95% |
| **Notes** | Card grid layout; severity/status badges; expandable comment threads with inline add-comment form |

---

### `/blockers`
| Field | Value |
|---|---|
| **File** | `src/routes/blockers.index.tsx` |
| **Purpose** | Management blocker tracking — items that impede progress |
| **Data source** | `useBlockers`, `useCreateBlocker`, `useUpdateBlocker`, `useProjects` |
| **Auth required** | Yes |
| **Employee access** | Read only (after RLS) |
| **Manager/Admin access** | Full CRUD |
| **CRUD** | Create ✓, Read ✓, Update ✓ (resolve), Delete ✗ |
| **Completion** | 100% |

---

### `/decisions`
| Field | Value |
|---|---|
| **File** | `src/routes/decisions.index.tsx` |
| **Purpose** | Management decision log — pending approvals and decisions |
| **Data source** | `useDecisions`, `useCreateDecision`, `useUpdateDecision`, `useProjects` |
| **Auth required** | Yes |
| **Employee access** | Read only (after RLS) |
| **Manager/Admin access** | Full CRUD |
| **CRUD** | Create ✓, Read ✓, Update ✓, Delete ✗ |
| **Completion** | 100% |

---

### `/reports`
| Field | Value |
|---|---|
| **File** | `src/routes/reports.index.tsx` |
| **Purpose** | Report list — daily/weekly/monthly report metadata, CSV export, mark sent |
| **Data source** | `useReports`, `useMarkReportSent`, `useProjects`, `useDailyLogs` |
| **Auth required** | Yes |
| **Employee access** | Read only |
| **Manager/Admin access** | Read + mark sent + export |
| **CRUD** | Read ✓, Update (mark sent) ✓, Delete ✗ |
| **Completion** | 95% |
| **Notes** | Bulk CSV export ("ייצוא כל הדוחות"); per-report CSV with contractors/equipment sections; UTF-8 BOM for Hebrew Excel |

---

### `/reports/$reportId`
| Field | Value |
|---|---|
| **File** | `src/routes/reports.$reportId.tsx` |
| **Purpose** | Report detail — full report view assembled from daily log |
| **Data source** | `useReport`, `useDailyLog`, `useProject` |
| **Auth required** | Yes |
| **Employee access** | Read only |
| **Manager/Admin access** | Read only |
| **CRUD** | Read only |
| **Completion** | 100% |

---

## Completion Summary

| Status | Count | Routes |
|---|---|---|
| 100% complete | 9 | `/login`, `/`, `/executive`, `/daily-logs`, `/daily-logs/new`, `/daily-logs/$logId`, `/blockers`, `/decisions`, `/reports/$reportId` |
| 90-95% complete | 6 | `/projects`, `/tasks`, `/tasks/$taskId`, `/issues`, `/reports` |
| 70-85% complete | 3 | `/sites`, `/sites/$siteId`, `/projects/$projectId` |

## Missing Features (Not Blocking MVP)

| Route | Missing |
|---|---|
| `/sites/$siteId` | Edit site metadata inline |
| `/projects` | Delete project (requires cascade confirmation) |
| `/tasks` | Edit task inline (no edit form on list page) |
| All lists | Delete operations — intentionally deferred |
| All lists | Pagination — seed data is small enough to omit |
