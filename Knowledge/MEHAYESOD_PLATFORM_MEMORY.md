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

## Completed Phases

Phase 1 — Mock Data MVP:
* UI, workflow validation, all core screens built with mock data

Phase 2 — Supabase Integration (COMPLETE):
* Supabase client, repositories, TanStack Query
* 10 migrations deployed, 16 tables, 61 RLS policies
* Real data in all 18 routes — no mock data at runtime

Phase 3 — Authentication + RLS (COMPLETE):
* Email/password auth via Supabase Auth
* Strict role-based RLS (admin / company_manager / field_manager)
* AuthGate enforces login on all 17 non-login routes
* DEV_BYPASS removed

## Pending Phases

Phase 4 — Reporting Engine:
* Branded PDF generation (Daily Work Log + Engineering Response)
* Supabase Storage for photo upload
* Reference specifications in docs/knowledge-base/13-reference-report-specifications.md

Phase 5 — Production Hardening:
* Advanced analytics, automated delivery, notifications
* Requires explicit product owner approval

## Current State (2026-06-15)

MVP is deployed and ready for acceptance testing.
Single remaining operational blocker: admin login credential needs reset.

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
