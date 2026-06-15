# MEHAYESOD GPT MEMORY

## Project Identity

We are building **Mehayesod Project Execution Platform**.

This is a Hebrew RTL web application for construction project execution control.

It is NOT a generic task manager.

It is NOT a CRM.

It is NOT Kanban/Gantt software.

The platform is designed for construction project managers, company management, and clients.

---

## Core Business Goal

The system replaces the manual daily work diary process currently used by Mehayesod.

Field employees create Daily Site Logs.

The system uses these logs to provide:

- Daily visibility
- Executive control
- Client reporting
- Project history
- Risk and blocker tracking

---

## Central Entity

The central entity is:

**Daily Site Log**

Everything revolves around Daily Logs.

A worker or project manager documents what happened on site that day.

Reports are generated from Daily Logs.

Users should not manually write client reports.

---

## Core Modules

- Projects
- Daily Logs
- Reports
- Issues
- Blockers
- Decisions
- Photos
- Executive Dashboard

---

## Product Hierarchy

Project  
→ Daily Logs  
→ Reports  
→ Issues  
→ Blockers  
→ Decisions  
→ Photos

---

## Daily Log Fields

Daily Logs include:

- Project
- Date
- Log number
- Submitted by
- Work hours
- Weather
- Exceptional events
- Contractors and workforce
- Equipment
- Numbered work description
- Contractor notes
- Photos

Important database rule:

Only one Daily Log per project per date.

Required constraint:

`UNIQUE(project_id, log_date)`

---

## Reports

Reports are generated automatically from Daily Logs.

Report architecture:

Daily Log  
→ Report Snapshot / Report Record  
→ Report Preview / Export

Reports can be:

- Daily
- Weekly
- Monthly

Daily reports are linked to a Daily Log.

Sent reports must not become orphaned.

---

## Issues

Issues are construction defects or site problems inspired by Cemento.

Issues include:

- Project
- Location
- Description
- Responsible contractor
- Assigned person
- Severity
- Status
- Due date
- Photos
- Comments
- resolved_at
- discovered_in_log_id

---

## Blockers

Blockers are execution obstacles that prevent progress.

Examples:

- Missing approval
- Missing material
- Supplier delay
- Missing consultant plan
- Concrete delivery delay

Blockers must appear clearly in the Executive Dashboard.

---

## Decisions

Decisions are management approvals required to move forward.

Examples:

- Concrete pour approval
- Supplier approval
- Design change approval
- Budget deviation approval

Pending decisions must appear clearly in the Executive Dashboard.

---

## Photos

Photos are first-class records.

The selected architecture uses typed nullable foreign keys, not polymorphic joins.

Photos can belong to:

- Daily Log
- Issue

A photo must belong to exactly one parent.

---

## Database Architecture Status

Database Foundation is complete.

Migrations were created under:

`supabase/migrations/`

The database includes:

- 11 tables
- Constraints
- Indexes
- Foreign keys
- Views
- Triggers
- Seed data

Created views:

- `v_project_health`
- `v_missing_daily_logs`
- `v_open_blockers`
- `v_pending_decisions`

Seed data includes:

- 3 projects
- 24 daily logs
- 16 issues
- 11 blockers
- 10 decisions
- 19 reports

---

## Frontend Integration Status

Phase 2 Real Data Integration was started/completed by Claude.

Implemented:

- `@supabase/supabase-js`
- `src/lib/supabase.ts`
- `.env.local` placeholders
- Repository layer
- React Query hooks
- Routes connected to repositories
- Mock data removed from active persistence paths

Repositories:

- ProjectRepository
- DailyLogRepository
- ReportRepository
- IssueRepository
- BlockerRepository
- DecisionRepository

React Query hooks were created for the main modules.

---

## Current Immediate Status

The next required action is NOT new feature development.

The next required action is project checkpoint and knowledge organization.

Claude should create:

- Current status checklist
- Knowledge base folder
- Developer handoff
- Tomorrow action plan
- Validation report

---

## Next Technical Step

After the checkpoint:

1. Create Supabase project
2. Fill `.env.local`
3. Run migrations
4. Validate seed data
5. Run app locally
6. Test all connected screens
7. Create bug list
8. Only then continue to Storage / Photos

---

## Explicit MVP Exclusions

Do not build yet:

- Authentication
- RLS
- User management
- File upload
- Storage
- PDF generation
- Excel generation
- AI summaries
- Kanban
- Gantt
- Workflow engine
- Notifications
- Chat
- Advanced automations

---

## MVP Success Criteria

A field employee can create a Daily Log quickly.

The Daily Log is saved in Supabase.

The log appears in the relevant Project.

The log affects the Executive Dashboard.

A Report can be opened from saved data.

The CEO can identify within 30 seconds:

- Missing daily logs
- Open blockers
- Critical issues
- Pending decisions
- Latest reports

The system must feel like a construction execution control platform, not a generic task list.