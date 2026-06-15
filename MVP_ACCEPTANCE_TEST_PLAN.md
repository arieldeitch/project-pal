# MVP_ACCEPTANCE_TEST_PLAN.md
> Generated: 2026-06-15
> Prerequisite: All 12 migrations applied; admin user created; at least one company_manager and one field_manager user created
> Format: Preconditions → Steps → Expected Result → Pass/Fail

---

## TEST SECTION 1 — Authentication

### AT-AUTH-01: Admin Login
| Field | Value |
|---|---|
| **Preconditions** | App running; Supabase credentials set; admin user exists in auth.users |
| **Steps** | 1. Navigate to app URL. 2. Observe redirect to `/login`. 3. Enter admin email and password. 4. Click "התחבר". |
| **Expected result** | Redirect to `/` (dashboard). Sidebar shows admin email in footer. All 10 nav items visible. |
| **Pass/Fail** | ☐ |

### AT-AUTH-02: Invalid Credentials
| Field | Value |
|---|---|
| **Preconditions** | On `/login` page |
| **Steps** | 1. Enter wrong password. 2. Click "התחבר". |
| **Expected result** | Toast error: "אימייל או סיסמה שגויים". Form stays on `/login`. No redirect. |
| **Pass/Fail** | ☐ |

### AT-AUTH-03: Unauthenticated Route Access
| Field | Value |
|---|---|
| **Preconditions** | Not logged in (or clear session storage) |
| **Steps** | 1. Navigate directly to `/projects`. |
| **Expected result** | Redirect to `/login`. After login, redirect to `/projects`. |
| **Pass/Fail** | ☐ |

### AT-AUTH-04: Logout
| Field | Value |
|---|---|
| **Preconditions** | Logged in as any user |
| **Steps** | 1. Click "התנתק" in sidebar footer. |
| **Expected result** | Redirect to `/login`. Session cleared. Navigating to `/` redirects back to `/login`. |
| **Pass/Fail** | ☐ |

### AT-AUTH-05: Session Persistence
| Field | Value |
|---|---|
| **Preconditions** | Logged in |
| **Steps** | 1. Refresh the page (F5). |
| **Expected result** | App stays on current page. Session restored from Supabase token. No redirect to `/login`. |
| **Pass/Fail** | ☐ |

---

## TEST SECTION 2 — Sites

### AT-SITES-01: View Site List (Admin)
| Field | Value |
|---|---|
| **Preconditions** | Logged in as admin; migrations 005 + 008 applied (seed sites exist) |
| **Steps** | 1. Click "אתרים" in sidebar. |
| **Expected result** | 3 site cards visible: "פרויקט מגדל תל אביב", "קומפלקס מגורים חיפה", "מרכז לוגיסטי באר שבע". Each shows status badge, type badge, client name. |
| **Pass/Fail** | ☐ |

### AT-SITES-02: Create New Site (Admin)
| Field | Value |
|---|---|
| **Preconditions** | Logged in as admin; on `/sites` |
| **Steps** | 1. Click "אתר חדש". 2. Fill: Name="אתר בדיקה", Address="רח' הבדיקה 1", Type=commercial, Client="בדיקה בע\"מ", Status=active. 3. Click "שמור". |
| **Expected result** | Toast "האתר נוצר בהצלחה". New site card appears in list. Count increases by 1. |
| **Pass/Fail** | ☐ |

### AT-SITES-03: Site Detail
| Field | Value |
|---|---|
| **Preconditions** | Seed data applied; on `/sites` |
| **Steps** | 1. Click on "פרויקט מגדל תל אביב". |
| **Expected result** | Site detail page loads. Shows: address, client, type, date range. "פרויקטים באתר" section shows the linked project. |
| **Pass/Fail** | ☐ |

### AT-SITES-04: Field Manager Cannot Create Site
| Field | Value |
|---|---|
| **Preconditions** | Logged in as field_manager; migration 010 applied |
| **Steps** | 1. Navigate to `/sites`. 2. Click "אתר חדש". 3. Fill form. 4. Submit. |
| **Expected result** | Supabase returns permission error. Toast "שגיאה ביצירת האתר". Site not created. |
| **Pass/Fail** | ☐ |

---

## TEST SECTION 3 — Projects

### AT-PROJ-01: View Project List
| Field | Value |
|---|---|
| **Preconditions** | Logged in as admin or manager; seed data applied |
| **Steps** | 1. Click "פרויקטים" in sidebar. |
| **Expected result** | Table shows 3 projects with name, manager, status badge, last log date, issue/blocker counts, site name column. |
| **Pass/Fail** | ☐ |

### AT-PROJ-02: Create Project
| Field | Value |
|---|---|
| **Preconditions** | Logged in as admin; on `/projects` |
| **Steps** | 1. Click "+ פרויקט חדש". 2. Fill all required fields. 3. Select a site from dropdown. 4. Click "שמור". |
| **Expected result** | Dialog closes. New project row appears. Site column shows selected site name. |
| **Pass/Fail** | ☐ |

### AT-PROJ-03: Edit Project
| Field | Value |
|---|---|
| **Preconditions** | Logged in as admin or manager; projects exist |
| **Steps** | 1. Click pencil icon on a project row. 2. Change status to "on_hold". 3. Click "שמור". |
| **Expected result** | Dialog closes. Status badge updates to "מושהה". |
| **Pass/Fail** | ☐ |

### AT-PROJ-04: Field Manager Sees Only Own Projects
| Field | Value |
|---|---|
| **Preconditions** | field_manager user assigned to 1 of 3 projects via project_member; migration 010 applied |
| **Steps** | 1. Log in as field_manager. 2. Navigate to `/projects`. |
| **Expected result** | Only 1 project visible (the assigned one). Other 2 are hidden by RLS. |
| **Pass/Fail** | ☐ |

### AT-PROJ-05: Project Detail
| Field | Value |
|---|---|
| **Preconditions** | Seed data applied |
| **Steps** | 1. Click on a project name in the list. |
| **Expected result** | Project detail page loads with: stat cards (logs, issues, blockers), recent daily logs list, open issues list. |
| **Pass/Fail** | ☐ |

---

## TEST SECTION 4 — Tasks

### AT-TASK-01: View Task List
| Field | Value |
|---|---|
| **Preconditions** | Logged in as admin; seed tasks applied (migration 008) |
| **Steps** | 1. Click "משימות" in sidebar. |
| **Expected result** | 6 tasks visible with status/priority badges, progress bars, assignee names, due dates. |
| **Pass/Fail** | ☐ |

### AT-TASK-02: Filter Tasks by Status
| Field | Value |
|---|---|
| **Preconditions** | On `/tasks`; seed tasks loaded |
| **Steps** | 1. Click "בביצוע" filter button. |
| **Expected result** | Only in_progress tasks visible (2 from seed: "יציקת רצפת קומה 3", "עבודות איטום גג"). |
| **Pass/Fail** | ☐ |

### AT-TASK-03: Create Task (Manager)
| Field | Value |
|---|---|
| **Preconditions** | Logged in as admin or company_manager |
| **Steps** | 1. Click "+ משימה חדשה". 2. Select project. 3. Enter title. 4. Set priority and assignee. 5. Click "שמור". |
| **Expected result** | Toast "המשימה נוצרה בהצלחה". New task card appears. Progress = 0%, status = "לא התחיל". |
| **Pass/Fail** | ☐ |

### AT-TASK-04: Field Manager Cannot Create Task
| Field | Value |
|---|---|
| **Preconditions** | Logged in as field_manager; migration 010 applied |
| **Steps** | 1. Click "+ משימה חדשה". 2. Fill form. 3. Submit. |
| **Expected result** | RLS rejects the INSERT. Toast "שגיאה ביצירת המשימה". |
| **Pass/Fail** | ☐ |

### AT-TASK-05: Task Detail Page
| Field | Value |
|---|---|
| **Preconditions** | Seed tasks exist |
| **Steps** | 1. Click on task "יציקת רצפת קומה 3". |
| **Expected result** | Task detail loads: title, status/priority badges, progress bar at 60%, description, assignee, due date. "עדכוני ביצוע" section visible. "הערות הנהלה" section visible. |
| **Pass/Fail** | ☐ |

---

## TEST SECTION 5 — Task Updates (Employee Reporting)

### AT-UPDATE-01: Submit Task Update
| Field | Value |
|---|---|
| **Preconditions** | Logged in as field_manager; on a task detail page |
| **Steps** | 1. Click "הוסף עדכון". 2. Verify "שם המגיש" pre-filled with user email. 3. Enter content. 4. Move progress slider to 80%. 5. Click "שמור עדכון". |
| **Expected result** | Toast "העדכון נשמר בהצלחה". New update appears in blue-bordered list. Progress bar updates to 80%. |
| **Pass/Fail** | ☐ |

### AT-UPDATE-02: Task Auto-Completes at 100%
| Field | Value |
|---|---|
| **Preconditions** | On a task detail page with progress < 100% |
| **Steps** | 1. Submit task update with progress = 100%. |
| **Expected result** | Task status changes to "הושלם" (triggered by `auto_update_task_progress` DB trigger). Status badge updates on refresh. |
| **Pass/Fail** | ☐ |

### AT-UPDATE-03: Task Update Is Immutable
| Field | Value |
|---|---|
| **Preconditions** | task_update row exists |
| **Steps** | 1. Attempt to UPDATE a task_update row directly via Supabase API (using anon key). |
| **Expected result** | No UPDATE policy exists on task_update — RLS rejects the operation. Row unchanged. |
| **Pass/Fail** | ☐ |

---

## TEST SECTION 6 — Reporting (Daily Logs)

### AT-REPORT-01: Create Daily Log
| Field | Value |
|---|---|
| **Preconditions** | Logged in as any authenticated user; project exists |
| **Steps** | 1. Click "יומני עבודה" → "+ יומן חדש". 2. Select project. 3. Verify today's date pre-filled. 4. Verify "הוגש ע״י" pre-filled with user email. 5. Add 1 contractor row, 1 equipment row, 2 work description items. 6. Click "שמור יומן". |
| **Expected result** | Toast "היומן נשמר". Redirect to log detail page showing all data. Log number assigned automatically (sequential per project). |
| **Pass/Fail** | ☐ |

### AT-REPORT-02: Duplicate Log Prevention
| Field | Value |
|---|---|
| **Preconditions** | A log already exists for project X on today's date |
| **Steps** | 1. Try to create another log for same project + date. |
| **Expected result** | Toast "כבר קיים יומן לתאריך זה בפרויקט זה". No duplicate created. |
| **Pass/Fail** | ☐ |

### AT-REPORT-03: View Reports List
| Field | Value |
|---|---|
| **Preconditions** | Logged in; seed data includes 19 reports |
| **Steps** | 1. Navigate to `/reports`. |
| **Expected result** | Table shows reports sorted by date descending. Each row has date, type, project, status badge. CSV export buttons visible per row. |
| **Pass/Fail** | ☐ |

### AT-REPORT-04: Mark Report Sent
| Field | Value |
|---|---|
| **Preconditions** | A report with status "draft" exists |
| **Steps** | 1. Click the Send (✉) icon on a draft report. |
| **Expected result** | Toast "הדוח סומן כנשלח". Status badge changes to "נשלח". Send button disappears for that row. |
| **Pass/Fail** | ☐ |

---

## TEST SECTION 7 — Permissions (Role-Based Access)

### AT-PERM-01: field_manager Project Scope
| Field | Value |
|---|---|
| **Preconditions** | field_manager user assigned to 1 of 3 projects; migration 010 applied |
| **Steps** | 1. Log in as field_manager. 2. Check `/projects`, `/tasks`, `/daily-logs`, `/issues`. |
| **Expected result** | Only data belonging to the assigned project is visible across all routes. |
| **Pass/Fail** | ☐ |

### AT-PERM-02: company_manager Sees All Data
| Field | Value |
|---|---|
| **Preconditions** | company_manager user exists with role set; migration 010 applied |
| **Steps** | 1. Log in as company_manager. 2. Check all list pages. |
| **Expected result** | All 3 projects, all tasks, all daily logs, all issues visible. |
| **Pass/Fail** | ☐ |

### AT-PERM-03: field_manager Cannot Write Blockers/Decisions
| Field | Value |
|---|---|
| **Preconditions** | Logged in as field_manager; migration 010 applied |
| **Steps** | 1. Navigate to `/blockers`. 2. Try to create a new blocker. |
| **Expected result** | RLS rejects the INSERT. Toast error displayed. Blocker not created. |
| **Pass/Fail** | ☐ |

### AT-PERM-04: Project Member RLS
| Field | Value |
|---|---|
| **Preconditions** | field_manager user is NOT a member of project X |
| **Steps** | 1. Attempt to fetch tasks for project X via API using field_manager's session. |
| **Expected result** | Empty result — RLS filters out all tasks for project X. |
| **Pass/Fail** | ☐ |

---

## TEST SECTION 8 — Management Review

### AT-MGMT-01: Add Management Comment on Task
| Field | Value |
|---|---|
| **Preconditions** | Logged in as admin or company_manager; on task detail page |
| **Steps** | 1. Scroll to "הערות הנהלה" section. 2. Enter comment text. 3. Click "הוסף הערה" (amber button). |
| **Expected result** | Toast "ההערה נשמרה". Comment appears in amber-bordered card with author email and timestamp. |
| **Pass/Fail** | ☐ |

### AT-MGMT-02: Field Manager Cannot Add Management Comment
| Field | Value |
|---|---|
| **Preconditions** | Logged in as field_manager; migration 010 + 011 applied |
| **Steps** | 1. Navigate to task detail. 2. Try to submit a comment via the "הוסף הערה" button. |
| **Expected result** | RLS rejects INSERT on task_comment (`tc_insert_manager` policy: managers only). Toast error displayed. |
| **Pass/Fail** | ☐ |

### AT-MGMT-03: Issue Comment Thread
| Field | Value |
|---|---|
| **Preconditions** | Logged in; seed issue comments exist (10 rows) |
| **Steps** | 1. Navigate to `/issues`. 2. Click comment count on an issue card. 3. View expanded thread. 4. Enter new comment. 5. Click Send. |
| **Expected result** | Thread expands. Existing comments shown with author + date. New comment saved. Count increments. |
| **Pass/Fail** | ☐ |

### AT-MGMT-04: Blocker Management (Manager)
| Field | Value |
|---|---|
| **Preconditions** | Logged in as company_manager or admin |
| **Steps** | 1. Navigate to `/blockers`. 2. Create new blocker. 3. Mark it as resolved. |
| **Expected result** | Blocker created. Status changes to "הושלם". Resolved blocker disappears from open list. |
| **Pass/Fail** | ☐ |

---

## TEST SECTION 9 — Executive Dashboard

### AT-EXEC-01: KPI Cards
| Field | Value |
|---|---|
| **Preconditions** | Logged in as manager or admin; seed data applied |
| **Steps** | 1. Navigate to `/executive`. |
| **Expected result** | 8 KPI cards visible: פרויקטים פעילים, יומנים היום, יומנים חסרים, ליקויים פתוחים, ליקויים קריטיים, חסמים פתוחים, החלטות ממתינות, דוחות נשלחו השבוע. All show numeric values matching seed data. |
| **Pass/Fail** | ☐ |

### AT-EXEC-02: Charts Load
| Field | Value |
|---|---|
| **Preconditions** | On `/executive` |
| **Steps** | 1. Scroll through the dashboard. |
| **Expected result** | Bar chart (logs per project), pie chart (issues by status), bar chart (blockers by priority) all render with Hebrew labels and correct data. |
| **Pass/Fail** | ☐ |

### AT-EXEC-03: Missing Logs Panel
| Field | Value |
|---|---|
| **Preconditions** | Today's date has no log for at least one active project |
| **Steps** | 1. Check "פרויקטים ללא יומן" panel on executive dashboard. |
| **Expected result** | Panel shows projects missing today's log with "ימים מאז יומן אחרון" count. |
| **Pass/Fail** | ☐ |

---

## TEST SECTION 10 — Excel Export (CSV)

### AT-EXPORT-01: Bulk CSV Export
| Field | Value |
|---|---|
| **Preconditions** | Logged in; reports exist |
| **Steps** | 1. Navigate to `/reports`. 2. Click "ייצוא כל הדוחות". |
| **Expected result** | Browser downloads `mehayesod-reports.csv`. File opens in Excel with correct Hebrew column headers (no garbled text). Columns: תאריך, סוג, פרויקט, סטטוס, נוצר, נשלח. |
| **Pass/Fail** | ☐ |

### AT-EXPORT-02: Per-Report CSV Export
| Field | Value |
|---|---|
| **Preconditions** | A report with a linked daily_log exists |
| **Steps** | 1. Click the spreadsheet icon (FileSpreadsheet) on a report row with a daily log. |
| **Expected result** | Browser downloads `report-YYYY-MM-DD-ProjectName.csv`. File contains log metadata row, contractor section, equipment section. Hebrew text renders correctly in Excel. |
| **Pass/Fail** | ☐ |

### AT-EXPORT-03: Export Without Linked Log
| Field | Value |
|---|---|
| **Preconditions** | A report exists with no daily_log_id |
| **Steps** | 1. Click spreadsheet icon on a weekly/monthly report (no daily log linked). |
| **Expected result** | Toast "אין יומן עבודה מקושר לדוח זה". No file downloaded. |
| **Pass/Fail** | ☐ |

### AT-EXPORT-04: Hebrew Encoding in Excel
| Field | Value |
|---|---|
| **Preconditions** | Any CSV export completed |
| **Steps** | 1. Open the downloaded CSV directly in Microsoft Excel. |
| **Expected result** | Hebrew text displays without corruption. UTF-8 BOM ensures correct encoding detection. |
| **Pass/Fail** | ☐ |

---

## Test Results Summary

| Section | Tests | Pass | Fail | N/A |
|---|---|---|---|---|
| Authentication | 5 | | | |
| Sites | 4 | | | |
| Projects | 5 | | | |
| Tasks | 5 | | | |
| Task Updates | 3 | | | |
| Reporting | 4 | | | |
| Permissions | 4 | | | |
| Management Review | 4 | | | |
| Executive Dashboard | 3 | | | |
| Excel Export | 4 | | | |
| **TOTAL** | **41** | | | |

**MVP Go/No-Go: All 41 tests must pass (or N/A) before production release.**
