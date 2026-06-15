# DEPLOYMENT_SMOKE_TEST.md
> Generated: 2026-06-15
> Purpose: Manual smoke tests to run immediately after go-live
> Prerequisites: All 12 migrations applied, admin user created and confirmed, application running
> Test environment: Browser — use private/incognito window to ensure clean session state
> Time estimate: 45–60 minutes

---

## How to use this document

1. Run each test in order
2. Mark PASS or FAIL next to each item
3. On any FAIL: stop and diagnose before continuing
4. Do not proceed to the next section if the previous section has any FAIL

---

## SECTION 1 — Authentication

### ST-001 — Login page loads
- **Action:** Navigate to `https://[your-app-url]/login`
- **Expected:** Hebrew RTL login form displays with email and password fields
- **Pass:** Form renders, no JavaScript errors in browser console
- **Fail:** Blank page, 404, or JS error

### ST-002 — Invalid credentials rejected
- **Action:** Enter email `wrong@test.com`, password `wrongpassword`, click login
- **Expected:** Hebrew error message: "אימייל או סיסמה שגויים"
- **Pass:** Error message appears, user remains on login page
- **Fail:** No error, or redirected to app, or English error message

### ST-003 — Admin login succeeds
- **Action:** Enter admin credentials, click login
- **Expected:** Redirect to `/` dashboard, sidebar visible, no yellow bypass banner
- **Pass:** Dashboard loads, URL changes to `/`, no yellow banner
- **Fail:** Stays on login page, or yellow bypass banner is visible (auth still bypassed)

### ST-004 — Session persists across refresh
- **Action:** While logged in, press F5 / hard refresh the browser
- **Expected:** Remain on current page, still authenticated
- **Pass:** Page reloads, user is still logged in
- **Fail:** Redirected to login page after refresh

### ST-005 — Logout clears session
- **Action:** Click the logout button in the sidebar footer
- **Expected:** Redirect to `/login`, sidebar disappears
- **Pass:** Login page shows, session is cleared
- **Fail:** Stays on dashboard, or redirect fails

### ST-006 — Unauthenticated redirect
- **Action:** Log out, then manually navigate to `/projects`
- **Expected:** Redirected to `/login`
- **Pass:** Redirect happens immediately
- **Fail:** Dashboard or data is accessible without login

---

## SECTION 2 — Sites

### ST-007 — Sites list loads
- **Action:** Log in as admin, navigate to `/sites`
- **Expected:** Sites page renders (empty state or cards if seed data was applied)
- **Pass:** Page renders without error
- **Fail:** Error page, blank content, or console errors

### ST-008 — Create a site
- **Action:** Click "הוסף אתר" (Add Site), fill in: name, address, client, type, status, dates. Submit.
- **Expected:** New site card appears in the list
- **Pass:** Site appears immediately, toast confirmation shown
- **Fail:** Form submits but site does not appear, or error toast

### ST-009 — Site detail page
- **Action:** Click on the newly created site card
- **Expected:** Site detail page loads at `/sites/[uuid]`, shows site info and linked projects section
- **Pass:** Detail page renders with correct site data
- **Fail:** 404, blank page, or wrong data displayed

---

## SECTION 3 — Projects

### ST-010 — Projects list loads
- **Action:** Navigate to `/projects`
- **Expected:** Project table renders (empty or with data)
- **Pass:** Table renders without error
- **Fail:** Error page or console errors

### ST-011 — Create a project
- **Action:** Click "פרויקט חדש" (New Project), fill all required fields (name, address, client, manager, status, start date, target date). Optionally link to a site. Submit.
- **Expected:** New project row appears in the table
- **Pass:** Project appears, toast shown
- **Fail:** Submission fails, or project does not appear

### ST-012 — Project detail page
- **Action:** Click on the project row to open detail
- **Expected:** Project detail page at `/projects/[uuid]` renders with stat cards and recent activity
- **Pass:** Page renders, stats show 0 (no data yet), no console errors
- **Fail:** 404, blank, or error boundary triggered

### ST-013 — Edit project status
- **Action:** On project detail, change status from "planning" to "active" and save
- **Expected:** Status updates and confirms
- **Pass:** Status change saved, UI reflects new status
- **Fail:** Update fails silently or throws error

---

## SECTION 4 — Tasks

### ST-014 — Tasks list loads
- **Action:** Navigate to `/tasks`
- **Expected:** Task list with status filter bar (all / not started / in progress / blocked / completed)
- **Pass:** Page and filter bar render
- **Fail:** Error page or missing filter bar

### ST-015 — Create a task (admin)
- **Action:** Click "משימה חדשה" (New Task), fill in title, description, project, priority, assigned to, due date. Submit.
- **Expected:** Task appears in the list
- **Pass:** Task visible in list, toast shown
- **Fail:** Task not created, or error

### ST-016 — Task status filter
- **Action:** With at least one task created, click "בביצוע" (In Progress) filter
- **Expected:** Only in-progress tasks shown; count badge updates
- **Pass:** Filter correctly narrows the list
- **Fail:** Filter has no effect, or shows wrong tasks

### ST-017 — Task detail page
- **Action:** Click on a task to open `/tasks/[uuid]`
- **Expected:** Task detail with progress bar (0%), employee update section (blue border), management comment section (amber)
- **Pass:** Both sections render, progress bar at 0%
- **Fail:** 404 or sections missing

---

## SECTION 5 — Task Updates (Employee Progress)

### ST-018 — Submit a task update
- **Action:** On task detail page, in the employee update section: verify "הוגש על ידי" (Submitted by) is pre-filled with logged-in user's email. Enter content. Set progress slider to 50%. Click submit.
- **Expected:** Update appears in update history below the form. Progress bar updates to 50%. Task status changes to "in_progress".
- **Pass:** Update listed, progress bar shows 50%, status updated
- **Fail:** Update not saved, progress not updated, or submitted_by is empty

### ST-019 — Submit 100% progress — task completes
- **Action:** Submit another task update with progress set to 100%
- **Expected:** Task status changes to "completed", progress bar at 100%
- **Pass:** Status = completed, progress = 100%
- **Fail:** Status does not change to completed

### ST-020 — Form resets after submit
- **Action:** After submitting a task update, verify the form state
- **Expected:** Content field is cleared, progress resets to current task progress, "submitted by" is still pre-filled with email
- **Pass:** All fields reset correctly, email preserved
- **Fail:** Form not reset, or email field cleared

---

## SECTION 6 — Daily Logs

### ST-021 — Daily logs list loads
- **Action:** Navigate to `/daily-logs`
- **Expected:** Daily logs list renders (empty or with entries)
- **Pass:** List renders without error
- **Fail:** Error or blank

### ST-022 — Create a daily log
- **Action:** Click "יומן חדש" (New Log), fill in: project, date (today), work hours, weather, submitted by (should be pre-filled), work description. Add at least one contractor row and one equipment row. Submit.
- **Expected:** Redirect to the log detail page, log number auto-assigned
- **Pass:** Log created, redirected to `/daily-logs/[uuid]`, log_number is a positive integer
- **Fail:** Submit fails, or log_number is NULL

### ST-023 — Duplicate log prevention
- **Action:** Try to create a second daily log for the same project on the same date
- **Expected:** Error — duplicate log for this project/date combination is rejected
- **Pass:** Error message shown, second log not created
- **Fail:** Duplicate log created (violates unique constraint)

### ST-024 — Log detail view
- **Action:** Navigate to `/daily-logs/[uuid]`
- **Expected:** Read-only view shows all log fields, contractor table, equipment table
- **Pass:** All data displays correctly
- **Fail:** Blank sections or missing data

---

## SECTION 7 — Issues

### ST-025 — Issues list loads
- **Action:** Navigate to `/issues`
- **Expected:** Issue card grid renders
- **Pass:** Page renders without error
- **Fail:** Error page

### ST-026 — Create an issue
- **Action:** Click "דיווח תקלה חדשה" (New Issue), fill in: project, title, location, severity, responsible contractor. Submit.
- **Expected:** New issue card appears in the grid
- **Pass:** Card visible, correct badge colors for severity
- **Fail:** Issue not created

### ST-027 — Add a comment to an issue
- **Action:** On an issue card, expand the comment thread (chevron/expand), type a comment, submit
- **Expected:** Comment appears in the thread below the form
- **Pass:** Comment visible with author name and timestamp
- **Fail:** Comment not saved or not displayed

### ST-028 — Resolve an issue
- **Action:** Click the resolve button on an issue card
- **Expected:** Issue status changes to "resolved", card updates visually
- **Pass:** Status updated, visual change confirmed
- **Fail:** No status change

### ST-029 — Reopen a resolved issue
- **Action:** Click reopen on a resolved issue
- **Expected:** Status returns to "open" or "reopened"
- **Pass:** Status updated
- **Fail:** Reopen fails

---

## SECTION 8 — Blockers

### ST-030 — Blockers list loads
- **Action:** Navigate to `/blockers`
- **Expected:** Blocker list renders with priority and status badges
- **Pass:** Page renders
- **Fail:** Error

### ST-031 — Create a blocker
- **Action:** Create a new blocker with priority "critical"
- **Expected:** Blocker appears in list with critical badge
- **Pass:** Blocker visible with correct badge
- **Fail:** Not created

### ST-032 — Resolve a blocker
- **Action:** Click resolve on a blocker
- **Expected:** Status changes to "resolved"
- **Pass:** Status updated
- **Fail:** No change

---

## SECTION 9 — Decisions

### ST-033 — Decisions list loads
- **Action:** Navigate to `/decisions`
- **Expected:** Decision log renders with status badges
- **Pass:** Page renders
- **Fail:** Error

### ST-034 — Create a decision
- **Action:** Create a new decision with status "pending"
- **Expected:** Decision appears in list with "pending" badge
- **Pass:** Decision visible
- **Fail:** Not created

### ST-035 — Update decision status
- **Action:** Change decision status from "pending" to "approved"
- **Expected:** Status updates and badge changes
- **Pass:** Status updated
- **Fail:** Update fails

---

## SECTION 10 — Reports

### ST-036 — Reports list loads
- **Action:** Navigate to `/reports`
- **Expected:** Reports table renders with type, date, and status columns
- **Pass:** Table renders
- **Fail:** Error

### ST-037 — Mark report as sent
- **Action:** Click "שלח דוח" (Send Report) on a draft or ready report
- **Expected:** Report status changes to "sent"
- **Pass:** Status updated, visual change confirmed
- **Fail:** No status change

### ST-038 — Per-report CSV export
- **Action:** Click the CSV export button on a report with a linked daily log
- **Expected:** Browser downloads a `.csv` file
- **Pass:** File downloads successfully
- **Fail:** No download, or error

### ST-039 — Hebrew CSV Excel compatibility
- **Action:** Open the downloaded CSV in Microsoft Excel
- **Expected:** Hebrew text renders correctly (not garbled characters)
- **Pass:** Hebrew is readable in Excel
- **Fail:** Garbled text (encoding issue — should be UTF-8 BOM)

### ST-040 — Bulk CSV export
- **Action:** Click "ייצוא כל הדוחות" (Export All Reports) button
- **Expected:** CSV with all report metadata downloads
- **Pass:** File contains all reports as rows with Hebrew headers
- **Fail:** No download, or empty file

---

## SECTION 11 — Management Comments on Tasks

### ST-041 — Add a management comment
- **Action:** Log in as admin or company_manager. Open a task detail page. In the amber-styled management comment section, type a comment and submit.
- **Expected:** Comment appears in the amber comment list with author name
- **Pass:** Comment visible
- **Fail:** Comment not saved, or section not visible

### ST-042 — Field manager cannot add management comment
- **Action:** Log in as a field_manager (if user created). Open the same task. Attempt to submit a management comment.
- **Expected:** Submit button is absent or request is rejected by RLS
- **Pass:** Field manager cannot add comments to the management section
- **Fail:** Field manager successfully adds a comment (RLS not enforced)

---

## SECTION 12 — Executive Dashboard

### ST-043 — Executive dashboard loads
- **Action:** Navigate to `/executive`
- **Expected:** Dashboard renders with 8 KPI stat cards, bar charts, pie chart, missing logs panel, open blockers panel, pending decisions panel
- **Pass:** All panels render, charts visible (may show 0 data)
- **Fail:** Error page, or charts fail to render

### ST-044 — KPI cards show data
- **Action:** After creating at least one project, one daily log, one issue, and one blocker, reload `/executive`
- **Expected:** KPI cards reflect the created data (log count > 0, open issues > 0, etc.)
- **Pass:** Numbers update correctly
- **Fail:** All cards show 0 despite existing data (RLS or view issue)

### ST-045 — Missing logs panel
- **Action:** With at least one active project that has no log for today, check the "יומנים חסרים" (Missing Logs) panel
- **Expected:** The active project appears in the missing logs panel
- **Pass:** Project name listed in panel
- **Fail:** Panel empty despite active project with no today's log

---

## SECTION 13 — Role-Based Permissions

### ST-046 — Field manager project isolation
- **Prerequisites:** Create a field_manager user, assign them to exactly one project via `project_member`, log in as that user
- **Action:** Navigate to `/projects`
- **Expected:** Only the assigned project is visible; other projects do not appear
- **Pass:** Correct project isolation
- **Fail:** Field manager sees all projects (RLS 010 not enforced or project_member missing)

### ST-047 — Field manager cannot create a task
- **Prerequisites:** Logged in as field_manager
- **Action:** Navigate to `/tasks`, attempt to create a new task
- **Expected:** The "New Task" button is absent, or if clicked, the request is rejected
- **Pass:** Task creation blocked for field_manager
- **Fail:** Field manager successfully creates a task

### ST-048 — Field manager can create a daily log
- **Prerequisites:** Logged in as field_manager with project membership
- **Action:** Navigate to `/daily-logs/new`, select their assigned project, fill in log details, submit
- **Expected:** Daily log created successfully
- **Pass:** Log created, redirected to log detail
- **Fail:** RLS blocks the insert (misconfiguration in policy `daily_log_insert`)

### ST-049 — Company manager sees all projects
- **Prerequisites:** Create a company_manager user, do NOT add to project_member
- **Action:** Log in as company_manager, navigate to `/projects`
- **Expected:** All projects visible (company_manager bypasses project_member check via `is_manager_or_admin()`)
- **Pass:** All projects listed
- **Fail:** Company manager sees no projects (role not set correctly)

---

## PASS / FAIL SUMMARY

Copy this table to record results:

| Test | Name | Result |
|---|---|---|
| ST-001 | Login page loads | ☐ PASS / ☐ FAIL |
| ST-002 | Invalid credentials rejected | ☐ PASS / ☐ FAIL |
| ST-003 | Admin login succeeds | ☐ PASS / ☐ FAIL |
| ST-004 | Session persists across refresh | ☐ PASS / ☐ FAIL |
| ST-005 | Logout clears session | ☐ PASS / ☐ FAIL |
| ST-006 | Unauthenticated redirect | ☐ PASS / ☐ FAIL |
| ST-007 | Sites list loads | ☐ PASS / ☐ FAIL |
| ST-008 | Create a site | ☐ PASS / ☐ FAIL |
| ST-009 | Site detail page | ☐ PASS / ☐ FAIL |
| ST-010 | Projects list loads | ☐ PASS / ☐ FAIL |
| ST-011 | Create a project | ☐ PASS / ☐ FAIL |
| ST-012 | Project detail page | ☐ PASS / ☐ FAIL |
| ST-013 | Edit project status | ☐ PASS / ☐ FAIL |
| ST-014 | Tasks list loads | ☐ PASS / ☐ FAIL |
| ST-015 | Create a task (admin) | ☐ PASS / ☐ FAIL |
| ST-016 | Task status filter | ☐ PASS / ☐ FAIL |
| ST-017 | Task detail page | ☐ PASS / ☐ FAIL |
| ST-018 | Submit a task update | ☐ PASS / ☐ FAIL |
| ST-019 | Submit 100% — task completes | ☐ PASS / ☐ FAIL |
| ST-020 | Form resets after submit | ☐ PASS / ☐ FAIL |
| ST-021 | Daily logs list loads | ☐ PASS / ☐ FAIL |
| ST-022 | Create a daily log | ☐ PASS / ☐ FAIL |
| ST-023 | Duplicate log prevention | ☐ PASS / ☐ FAIL |
| ST-024 | Log detail view | ☐ PASS / ☐ FAIL |
| ST-025 | Issues list loads | ☐ PASS / ☐ FAIL |
| ST-026 | Create an issue | ☐ PASS / ☐ FAIL |
| ST-027 | Add comment to issue | ☐ PASS / ☐ FAIL |
| ST-028 | Resolve an issue | ☐ PASS / ☐ FAIL |
| ST-029 | Reopen a resolved issue | ☐ PASS / ☐ FAIL |
| ST-030 | Blockers list loads | ☐ PASS / ☐ FAIL |
| ST-031 | Create a blocker | ☐ PASS / ☐ FAIL |
| ST-032 | Resolve a blocker | ☐ PASS / ☐ FAIL |
| ST-033 | Decisions list loads | ☐ PASS / ☐ FAIL |
| ST-034 | Create a decision | ☐ PASS / ☐ FAIL |
| ST-035 | Update decision status | ☐ PASS / ☐ FAIL |
| ST-036 | Reports list loads | ☐ PASS / ☐ FAIL |
| ST-037 | Mark report as sent | ☐ PASS / ☐ FAIL |
| ST-038 | Per-report CSV export | ☐ PASS / ☐ FAIL |
| ST-039 | Hebrew CSV Excel compatibility | ☐ PASS / ☐ FAIL |
| ST-040 | Bulk CSV export | ☐ PASS / ☐ FAIL |
| ST-041 | Add management comment (admin) | ☐ PASS / ☐ FAIL |
| ST-042 | Field manager cannot add management comment | ☐ PASS / ☐ FAIL |
| ST-043 | Executive dashboard loads | ☐ PASS / ☐ FAIL |
| ST-044 | KPI cards show data | ☐ PASS / ☐ FAIL |
| ST-045 | Missing logs panel | ☐ PASS / ☐ FAIL |
| ST-046 | Field manager project isolation | ☐ PASS / ☐ FAIL |
| ST-047 | Field manager cannot create task | ☐ PASS / ☐ FAIL |
| ST-048 | Field manager can create daily log | ☐ PASS / ☐ FAIL |
| ST-049 | Company manager sees all projects | ☐ PASS / ☐ FAIL |

---

## GO / NO-GO CRITERIA

| Category | Tests | Required |
|---|---|---|
| Authentication | ST-001 through ST-006 | All 6 must PASS |
| Data creation | ST-008, ST-011, ST-015, ST-022, ST-026, ST-031, ST-034 | All 7 must PASS |
| Critical security | ST-006, ST-042, ST-046, ST-047, ST-048 | All 5 must PASS |
| Export | ST-038, ST-039 | Both must PASS |
| Dashboard | ST-043, ST-044 | Both must PASS |

**Any FAIL in the above categories = NO-GO until resolved.**

Tests ST-049 (company manager isolation) and ST-041/042 (comment permissions) require additional user accounts. These can be deferred to post-go-live verification if additional users have not yet been created, but must be completed within 24 hours of go-live.
