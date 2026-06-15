# CURRENT_PROJECT_UNDERSTANDING.md
> Derived exclusively from: Knowledge/MEHAYESOD PROJECT EXECUTION PLATFORM.MD,
>   Knowledge/150626 MEHAYESOD GPT MEMORY.md, Knowledge/MEHAYESOD_PLATFORM_MEMORY.md,
>   docs/09-mvp-gap-analysis.md, docs/10-implementation-roadmap.md, docs/MASTER_SUMMARY.md
> No assumptions. No prior context. Documentation wins over code or memory.

---

# Product Goal

Mehayesod is a **Construction Project Execution Control System**.

Its single purpose: replace the manual, paper-based daily work diary used on Israeli construction sites with a structured digital platform.

The system answers three operational questions:
1. **What happened today on each site?** (Daily Logs)
2. **What is blocking progress?** (Blockers, Decisions)
3. **Are there quality/defect issues that need resolution?** (Issues)

The central output is a professional **Daily Report** — generated automatically from the Daily Log — that can be delivered to clients and stored as legal construction documentation.

The platform is NOT a generic task manager, CRM, Kanban board, or project scheduling tool.

---

# Target Users

## Field Project Manager / Site Manager
- Submits Daily Site Logs (the core workflow)
- Records what happened: contractors on site, equipment, work done, exceptional events, photos
- Logs issues discovered on site
- Logs blockers preventing progress

**Goal:** Complete a Daily Log in under 3 minutes from a mobile device.

## Company Management / Company Manager
- Reviews submitted Daily Logs
- Reviews open issues, blockers, pending decisions
- Monitors which projects are missing daily logs
- Approves or rejects decisions

**Goal:** Understand project execution status in under 30 seconds from desktop.

## CEO / Executive
- Views the Executive Dashboard (cross-project view)
- Identifies risks, missing logs, critical issues
- Does NOT manually create any data

**Goal:** Answer "what is the state of all our projects right now?" in under 30 seconds.

## Client
- Receives professional reports generated automatically from Daily Logs
- Gets visibility into project progress without manual report writing

**Goal:** Receive structured, professional documentation without the field manager writing a separate client report.

---

# Business Structure

## Hierarchy (per knowledge base — verbatim)

```
Project
  └─ Daily Logs         ← primary entity; one per project per calendar day
  └─ Issues             ← construction defects / field problems
  └─ Blockers           ← execution obstacles (missing approval, material, plan)
  └─ Decisions          ← management approvals required to proceed
  └─ Reports            ← generated from Daily Logs; delivered to clients
       └─ PDF Snapshot  ← stored immutably after report is marked "sent"
```

**CRITICAL NOTE:** The knowledge base documents NO "Site" entity above Project.
The knowledge base documents NO "Task" entity under Project.
The hierarchy is: Project → {Daily Logs, Issues, Blockers, Decisions, Reports}

## Entity Relationships

- One **Project** has many **Daily Logs**
- One **Daily Log** has many **Contractor Rows**, **Equipment Rows**, **Photos**, **Work Description Items**
- One **Daily Log** generates at most one **Daily Report**
- One **Project** has many **Issues**
- One **Issue** has many **Photos** and many **Comments**
- One **Project** has many **Blockers**
- One **Project** has many **Decisions**

## Key Business Rules

1. **One Daily Log per project per date** — enforced by `UNIQUE(project_id, date)` constraint
2. **Log numbers are sequential per project** — auto-assigned by DB trigger
3. **Logs with sent reports cannot be edited** — enforced by DB trigger
4. **Reports are derived, not duplicated** — report content assembled from source Daily Log at render time
5. **After a report is marked "sent", a PDF snapshot is stored immutably** — source log becomes uneditable

---

# Permission Model

## Current State (Knowledge Base — Phase 1 MVP)

**AUTHENTICATION IS EXPLICITLY EXCLUDED FROM PHASE 1 MVP.**

The knowledge base states under "Explicitly Excluded From MVP":
> Authentication, User Management, Roles, Permissions, Supabase Integration

Authentication is planned for **Phase 3** in the implementation roadmap.

## Future Phase 3 Plan (NOT current MVP)

### Phase 3 — Authentication (Days 8–12)
- Email + password login (Supabase Auth)
- Magic link flow for mobile field users
- Three roles: `field_manager`, `company_manager`, `admin`
- RLS Phase 3 policy: **permissive** — any authenticated user can read/write all data
- Strict project-scoped RLS deferred to Phase 5

### Phase 5 — Strict RLS (Days 20–25)
- Project-scoped policies per role
- Based on `project_member` junction table (project_id, user_id, role)

**The `project_member` table is created in Phase 1 (without the auth.users FK) as architectural scaffolding.**

---

# Authentication

Per knowledge base and roadmap:

**MVP Phase 1: NO authentication.**

**Phase 3 authentication method: Supabase Email + Password.**
- No SSO.
- No OAuth providers.
- No magic links in Phase 1 (planned for Phase 3).
- No self-service registration — users created manually in Supabase Auth dashboard.

---

# MVP Features

The following are explicitly within scope for the Phase 1 UI MVP (mock data, no backend):

## Projects Module
- Project list view
- Project detail view (with tabs for logs, issues, blockers, decisions, reports)
- Create project form
- Edit project form
- Fields: Name, Address, Client, Project Manager, Status, Start Date, Target Completion Date

## Daily Logs Module (PRIMARY MODULE)
- Daily log list (all projects)
- Daily log list filtered by project
- Daily log creation form (mobile-friendly)
- Daily log detail view
- Fields: Project, Date, Submitted By, Work Hours, Weather, Exceptional Events, Contractors (multi-row), Equipment (multi-row), Work Description (numbered list), Contractor Notes, Photos (multi-photo with caption, work item, area)

## Reports Module
- Report auto-generated from Daily Log (user does NOT write reports manually)
- Report list view
- Report detail view (renders from source Daily Log data)
- Report types: Daily, Weekly, Monthly
- Report statuses: Draft, Ready, Sent
- Actions: Preview, Export PDF (UI only for MVP), Export Excel (UI only for MVP), Mark as Sent
- PDF snapshot stored immutably on "Mark as Sent"

## Issues Module
- Issue list (all projects + filtered by project)
- Issue creation form
- Issue edit form
- Fields: Project, Location, Title, Description, Responsible Contractor, Assigned To, Due Date, Severity, Status
- Status lifecycle: Open → In Progress → Resolved → Reopened → Closed
- Severity: Low, Medium, High, Critical
- Photos (attached)
- Comments (threaded)

## Blockers Module
- Blocker list (all projects + filtered by project)
- Blocker creation form
- Blocker edit form
- Fields: Project, Title, Description, Impact, Responsible Person, Due Date, Priority, Status
- Priority: Low, Medium, High, Critical
- Status: Open, In Progress, Resolved

## Decisions Module
- Decision list (all projects + filtered by project)
- Decision creation form
- Decision edit form
- Fields: Project, Title, Description, Requested By, Decision Owner, Due Date, Status
- Status: Pending, Approved, Rejected, Deferred

## Executive Dashboard
- KPI Cards: Active Projects, Logs Submitted Today, Missing Logs, Open Issues, Critical Issues, Open Blockers, Pending Decisions, Reports Sent This Week
- Tables: Projects Without Daily Log Today, Critical Open Issues, Open Blockers, Pending Decisions, Latest Reports
- Charts: Issues by Status, Blockers by Priority, Daily Logs by Project, Reports by Week

---

# OUT_OF_SCOPE_FOR_MVP

The following are **EXPLICITLY EXCLUDED** from MVP per the knowledge base:

## Phase 1 — Explicitly Excluded (from documentation verbatim)
- ❌ Authentication
- ❌ User Management
- ❌ Roles and Permissions
- ❌ Supabase Integration (Phase 1 is UI + mock data only)
- ❌ RLS Policies
- ❌ Real File Storage (Unsplash/SVG placeholders only)
- ❌ Email Sending
- ❌ AI Summaries
- ❌ Kanban Boards
- ❌ Gantt Charts
- ❌ Workflow Engines
- ❌ Notifications (email, push, Slack)
- ❌ Chat / Internal Messaging
- ❌ Advanced Automations
- ❌ Multi-Tenant Architecture
- ❌ Mobile Apps (web-responsive, not native)
- ❌ Integrations (ERP, accounting, BIM, CAD)
- ❌ Client Portal
- ❌ Contractor Portal
- ❌ Self-Service User Registration

## Phase 2 Features (future, not MVP)
- Supabase backend connection
- Real photo uploads (Supabase Storage)
- Real PDF generation (Edge Function)
- Real Excel export (ExcelJS)
- Report snapshot immutability

## Phase 3 Features (future)
- Authentication (Email + Password)
- Session management
- Role-based access
- Permissive RLS

## Phase 4–5 Features (future)
- Strict RLS / project-scoped permissions
- Pagination on all lists
- Issue comment UI
- Mobile optimization pass
- Weekly/Monthly report UI
- Audit log

---

# Success Criteria

## CEO Must Be Able To (from knowledge base verbatim):
- See all projects
- See daily updates
- See missing daily logs
- See blockers
- See decisions
- See issues
- See generated reports
- Identify missing updates, blockers, and risks in under 30 seconds from Executive Dashboard

## Project Manager Must Be Able To:
- Create a Daily Log in minutes (target: under 3 minutes)
- Upload photos (Phase 2+)
- Record site activity accurately

## Client Must Be Able To:
- Receive a structured report generated automatically from Daily Logs
- Understand project progress
- Gain visibility and control

## Platform Must:
- Feel like a construction execution control system — not a generic task list
- Be in Hebrew, RTL throughout
- Work on mobile (field managers) and desktop (management)
