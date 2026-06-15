# FINAL_RLS_IMPLEMENTATION_PLAN.md
> Generated: 2026-06-15
> Scope: Full audit of all 15 tables + deployment status of strict RLS

---

## Summary

| State | Description |
|---|---|
| **Current (migrations 001-009 applied)** | RLS enabled on 13 tables with `USING(true)` policies — authenticated users have full access |
| **Target (migrations 010-012 applied)** | Strict role-based policies; field_managers scoped to their projects only |
| **Gap found** | `project_member` table was missing from all RLS migrations — fixed in migration 012 |

---

## RLS Audit — All 15 Tables

### TABLE: `site`
| | |
|---|---|
| **Current policy** | `auth_all_site` — `FOR ALL USING(true)` (migration 007) |
| **Required MVP policy** | SELECT: all authenticated; INSERT/UPDATE/DELETE: admin only |
| **Migration 010 policy** | `site_select_auth`, `site_write_admin`, `site_update_admin`, `site_delete_admin` ✓ |
| **Missing schema** | None |
| **Required indexes** | `idx_site_status` ✓ exists |
| **Status** | ✅ Fully implemented — activate by applying migration 010 |

---

### TABLE: `project`
| | |
|---|---|
| **Current policy** | `auth_all_project` — `FOR ALL USING(true)` (migration 007) |
| **Required MVP policy** | SELECT: manager/admin OR project member; INSERT: admin; UPDATE: manager+; DELETE: admin |
| **Migration 010 policy** | `project_select`, `project_insert_admin`, `project_update_manager`, `project_delete_admin` ✓ |
| **Missing schema** | None |
| **Required indexes** | `idx_project_status` ✓, `idx_project_site_id` ✓ |
| **Status** | ✅ Fully implemented — activate by applying migration 010 |

---

### TABLE: `task`
| | |
|---|---|
| **Current policy** | `auth_all_task` — `FOR ALL USING(true)` (migration 007) |
| **Required MVP policy** | SELECT: manager/admin OR project member; INSERT/UPDATE: manager+; DELETE: admin |
| **Migration 010 policy** | `task_select`, `task_insert_manager`, `task_update_manager`, `task_delete_admin` ✓ |
| **Missing schema** | `assigned_to_user_id UUID FK to auth.users` (migration 009 adds this column) |
| **Required indexes** | `idx_task_project_id`, `idx_task_assigned_to`, `idx_task_status`, `idx_task_assigned_user` ✓ |
| **Status** | ✅ Fully implemented — field_manager cannot create tasks (manager/admin only) |

---

### TABLE: `task_update`
| | |
|---|---|
| **Current policy** | `auth_all_task_update` — `FOR ALL USING(true)` (migration 007) |
| **Required MVP policy** | SELECT: project member; INSERT: assigned employee OR manager; no UPDATE; DELETE: admin |
| **Migration 010 policy** | `task_update_select`, `task_update_insert`, `task_update_admin_delete` ✓ |
| **Missing schema** | None — intentionally immutable (no UPDATE policy) |
| **Required indexes** | `idx_task_update_task_id`, `idx_task_update_created` ✓ |
| **Status** | ✅ Fully implemented — immutability enforced via missing UPDATE policy |

---

### TABLE: `task_comment`
| | |
|---|---|
| **Current policy** | Policies from migration 011 (runs after 010's drop-and-recreate loop) |
| **Required MVP policy** | SELECT: project member; INSERT: manager/admin only; UPDATE: author or admin; DELETE: admin |
| **Migration 011 policy** | `tc_select`, `tc_insert_manager`, `tc_update_author`, `tc_delete_admin` ✓ |
| **Missing schema** | None |
| **Required indexes** | `idx_task_comment_task` ✓ |
| **Status** | ✅ Fully implemented — managers-only insert enforced |

---

### TABLE: `daily_log`
| | |
|---|---|
| **Current policy** | `auth_all_daily_log` — `FOR ALL USING(true)` (migration 007) |
| **Required MVP policy** | SELECT/INSERT/UPDATE: project member OR manager; DELETE: admin |
| **Migration 010 policy** | `daily_log_select`, `daily_log_insert`, `daily_log_update`, `daily_log_delete_admin` ✓ |
| **Missing schema** | None |
| **Required indexes** | `idx_daily_log_project_date` ✓ |
| **Status** | ✅ Fully implemented |

---

### TABLE: `contractor_row`
| | |
|---|---|
| **Current policy** | `auth_all_contractor_row` — `FOR ALL USING(true)` (migration 007) |
| **Required MVP policy** | Access derived from parent daily_log's project membership |
| **Migration 010 policy** | `contractor_row_select`, `contractor_row_write`, `contractor_row_update`, `contractor_row_delete` ✓ |
| **Missing schema** | None |
| **Required indexes** | `idx_contractor_row_log` ✓ |
| **Status** | ✅ Fully implemented |

---

### TABLE: `equipment_row`
| | |
|---|---|
| **Current policy** | `auth_all_equipment_row` — `FOR ALL USING(true)` (migration 007) |
| **Required MVP policy** | Access derived from parent daily_log's project membership |
| **Migration 010 policy** | `equipment_row_select`, `equipment_row_write`, `equipment_row_update`, `equipment_row_delete` ✓ |
| **Missing schema** | None |
| **Required indexes** | `idx_equipment_row_log` ✓ |
| **Status** | ✅ Fully implemented |

---

### TABLE: `issue`
| | |
|---|---|
| **Current policy** | `auth_all_issue` — `FOR ALL USING(true)` (migration 007) |
| **Required MVP policy** | SELECT/INSERT/UPDATE: project member OR manager; DELETE: admin |
| **Migration 010 policy** | `issue_select`, `issue_insert`, `issue_update`, `issue_delete_admin` ✓ |
| **Missing schema** | None |
| **Required indexes** | `idx_issue_project_status`, `idx_issue_severity`, `idx_issue_due_date`, `idx_issue_discovered_log` ✓ |
| **Status** | ✅ Fully implemented |

---

### TABLE: `issue_comment`
| | |
|---|---|
| **Current policy** | `auth_all_issue_comment` — `FOR ALL USING(true)` (migration 007) |
| **Required MVP policy** | SELECT/INSERT: project member; DELETE: admin |
| **Migration 010 policy** | `issue_comment_select`, `issue_comment_insert`, `issue_comment_delete_admin` ✓ |
| **Missing schema** | None |
| **Required indexes** | `idx_issue_comment` ✓ |
| **Status** | ✅ Fully implemented |

---

### TABLE: `photo`
| | |
|---|---|
| **Current policy** | `auth_all_photo` — `FOR ALL USING(true)` (migration 007) |
| **Required MVP policy** | Access derived from parent (daily_log or issue) project membership |
| **Migration 010 policy** | `photo_select`, `photo_insert`, `photo_delete_admin` ✓ |
| **Missing schema** | None — typed FK constraint (not polymorphic) already enforced |
| **Required indexes** | `idx_photo_daily_log`, `idx_photo_issue`, `idx_photo_storage_key` ✓ |
| **Status** | ✅ Fully implemented |

---

### TABLE: `blocker`
| | |
|---|---|
| **Current policy** | `auth_all_blocker` — `FOR ALL USING(true)` (migration 007) |
| **Required MVP policy** | SELECT: project member; INSERT/UPDATE: manager+; DELETE: admin |
| **Migration 010 policy** | `blocker_select`, `blocker_write_manager`, `blocker_update_manager`, `blocker_delete_admin` ✓ |
| **Missing schema** | None |
| **Required indexes** | `idx_blocker_project_status`, `idx_blocker_critical` ✓ |
| **Status** | ✅ Fully implemented |

---

### TABLE: `decision`
| | |
|---|---|
| **Current policy** | `auth_all_decision` — `FOR ALL USING(true)` (migration 007) |
| **Required MVP policy** | SELECT: project member; INSERT/UPDATE: manager+; DELETE: admin |
| **Migration 010 policy** | `decision_select`, `decision_write_manager`, `decision_update_manager`, `decision_delete_admin` ✓ |
| **Missing schema** | None |
| **Required indexes** | `idx_decision_project_status`, `idx_decision_pending` ✓ |
| **Status** | ✅ Fully implemented |

---

### TABLE: `report`
| | |
|---|---|
| **Current policy** | `auth_all_report` — `FOR ALL USING(true)` (migration 007) |
| **Required MVP policy** | SELECT: project member; INSERT: project member or manager; UPDATE/DELETE: manager/admin |
| **Migration 010 policy** | `report_select`, `report_insert_manager`, `report_update_manager`, `report_delete_admin` ✓ |
| **Missing schema** | None |
| **Required indexes** | `idx_report_project_date`, `idx_report_project_status`, `uq_report_aggregate` ✓ |
| **Status** | ✅ Fully implemented |

---

### TABLE: `user_profile`
| | |
|---|---|
| **Current policy** | `auth_all_user_profile` — `FOR ALL USING(true)` (migration 009) |
| **Required MVP policy** | SELECT: own row OR admin; UPDATE: own row OR admin; INSERT/DELETE: admin only |
| **Migration 010 policy** | `up_select_own`, `up_update_own`, `up_admin_insert`, `up_admin_delete` ✓ |
| **Missing schema** | None |
| **Required indexes** | `idx_user_profile_role` ✓ |
| **Status** | ✅ Fully implemented |

---

### TABLE: `project_member` — ⚠️ WAS MISSING — FIXED IN MIGRATION 012
| | |
|---|---|
| **Current policy** | **NONE** — no RLS enabled, no policies. Any authenticated user can read/write all memberships |
| **Required MVP policy** | SELECT: own rows OR manager+; INSERT: manager+; UPDATE/DELETE: admin only |
| **Migration 012 policy** | `pm_select`, `pm_insert_manager`, `pm_update_admin`, `pm_delete_admin` ✓ |
| **Missing schema** | FK to auth.users added by migration 009 |
| **Required indexes** | `idx_project_member_user`, `idx_project_member_project` ✓ |
| **Status** | ✅ Fixed in migration 012 — activate by applying it |

---

## Deployment Sequence for RLS Activation

```
007  (permissive — already written)
009  (user_profile + helpers — already written)
010  (strict RLS on 13 tables — already written)  ← STOP: create admin first
011  (task_comment RLS — already written)
012  (project_member RLS — already written)        ← NEW: was missing
```

## Security Functions (all SECURITY DEFINER — bypass RLS safely)

| Function | Purpose | Used by |
|---|---|---|
| `is_admin()` | Returns TRUE if current user is admin | site, project, task, all tables |
| `is_manager_or_admin()` | Returns TRUE if manager or admin | project, task, blocker, decision, etc. |
| `is_project_member(UUID)` | Returns TRUE if user is member of given project | project, task, daily_log, issue, etc. |
| `current_user_role()` | Returns user's role string | Available helper — not used in policies directly |
| `handle_new_user()` | Auto-creates user_profile on auth.users INSERT | auth.users trigger |

## Remaining RLS Gaps After Migration 012

**None.** All 15 tables will have RLS enabled with appropriate role-based policies after migrations 007–012 are applied.

## Performance Notes

- `is_project_member()` is called on every SELECT across 8 tables. At MVP scale (3-10 projects, <20 users) this is fast.
- If project count exceeds 50, consider caching role in JWT claims via Supabase custom claims.
- All join indexes exist to support the subquery pattern in policies.
