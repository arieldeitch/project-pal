# MEHAYESOD_PLATFORM_MEMORY.md

## Product Identity

Mehayesod is a Construction Project Execution Platform.

It is NOT a generic task management system.

It is NOT a CRM.

It is NOT a ticketing system.

The platform exists to provide operational visibility and execution control over construction projects.

---

# Business Goal

Replace the current manual daily work diary process.

Allow field employees and project managers to document site activity once.

Generate reports automatically.

Provide visibility to:

* Company management
* CEO
* Clients

---

# Core Product Philosophy

The most important entity in the system is:

Daily Log

Everything else revolves around Daily Logs.

Users should not create reports manually.

Users should create Daily Logs.

Reports are generated automatically from Daily Logs.

---

# Core Modules

1. Projects
2. Daily Logs
3. Reports
4. Issues
5. Blockers
6. Decisions
7. Photos
8. Executive Dashboard

---

# Project Structure

Project

contains:

* Daily Logs
* Issues
* Blockers
* Decisions
* Reports

---

# Daily Logs

Daily Logs are the operational record of a workday.

Each Daily Log includes:

* Date
* Work Hours
* Weather
* Exceptional Events
* Contractors
* Workforce Count
* Equipment
* Work Description
* Contractor Notes
* Photos

Business Rule:

Only one Daily Log per Project per Date.

Required database constraint:

UNIQUE(project_id, log_date)

---

# Reports

Reports are derived from Daily Logs.

Reports should not duplicate Daily Log data unnecessarily.

Preferred architecture:

Daily Log
→ Report Snapshot
→ Rendered Report

Reports support:

* Daily
* Weekly
* Monthly

---

# Issues

Construction defects and field issues.

Inspired by Cemento.

Fields include:

* Description
* Severity
* Status
* Responsible Contractor
* Due Date
* Photos
* Comments

---

# Blockers

Execution obstacles preventing project progress.

Examples:

* Missing approval
* Missing material
* Supplier delay
* Design issue

Blockers must be visible in Executive Dashboard.

---

# Decisions

Management approvals required to move projects forward.

Examples:

* Concrete approval
* Design approval
* Supplier selection
* Budget approval

Pending decisions must be visible in Executive Dashboard.

---

# Photos

Photos are first-class entities.

Do not store photos directly in business tables.

Use a dedicated Photos table and storage strategy.

Photos can be attached to:

* Daily Logs
* Issues
* Reports

---

# Executive Dashboard

Must answer:

* What happened today?
* Which projects were not updated?
* Which projects are blocked?
* Which issues are critical?
* Which decisions are pending?
* Which reports were sent?

This is the primary CEO view.

---

# Technical Principles

Phase 1:

* Mock Data
* UI Validation
* Workflow Validation

Phase 2:

* Supabase
* Database
* Storage

Phase 3:

* Authentication
* Roles
* Permissions

Phase 4:

* Reporting Engine

Phase 5:

* Production Hardening

---

# Explicitly Excluded From MVP

Do not build:

* AI Summaries
* Kanban
* Gantt
* Workflow Engines
* Notifications
* Chat
* Advanced Automations

Unless explicitly approved.

---

# Success Criteria

Field employee:

Can submit Daily Log in under 3 minutes.

Project manager:

Can understand project status immediately.

CEO:

Can identify missing updates, blockers and risks in under 30 seconds.

Client:

Can receive professional reports generated automatically from Daily Logs.
