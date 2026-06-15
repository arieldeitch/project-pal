# MEHAYESOD PROJECT EXECUTION PLATFORM

## MVP Master Plan

Version: 1.0

Last Updated: June 2026

---

# Project Overview

We are building a Web MVP for **Mehayesod Project Management**.

The platform is NOT a generic project management system.

The platform is a **Construction Project Execution Control System** designed for:

* Field Project Managers
* Company Management
* Clients

The system replaces the current manual daily work diary process and provides full visibility into project execution.

---

# Business Goal

Provide management and clients with complete visibility into:

* What happened today on site
* Which projects were updated
* Which projects were not updated
* Open blockers
* Open issues
* Pending decisions
* Daily progress
* Historical reports

The platform must become the operational source of truth for project execution.

---

# Current Manual Process

Today, project managers create daily work diaries manually.

Each diary contains:

* Date
* Work hours
* Weather
* Exceptional events
* Contractors
* Workforce count
* Equipment
* Work description
* Contractor notes
* Photos

The uploaded "Project Diary" document serves as the reference model for this workflow.

The system must digitize this process.

---

# MVP Philosophy

## Phase 1

Build with mock data only.

No backend complexity.

No authentication.

No permissions.

No Supabase.

No integrations.

Focus only on:

* User experience
* Data structure
* Reporting flow
* Management visibility

---

# Core Modules

## Projects

Construction projects.

Fields:

* Project Name
* Address
* Client
* Project Manager
* Status
* Start Date
* Target Completion Date

---

## Daily Site Logs

Primary module.

This is the most important entity in the entire platform.

Every workday should create a Daily Site Log.

Fields:

### Basic Information

* Project
* Date
* Submitted By
* Work Hours
* Weather

### Exceptional Events

Free text.

Default value:

אין

---

### Contractors & Workforce

Multiple rows.

Fields:

* Contractor Name
* Trade
* Number of Workers
* Notes

Examples:

* שלד – 5 עובדים
* חשמל – 2 עובדים
* אינסטלציה – 3 עובדים

---

### Equipment

Multiple rows.

Fields:

* Equipment Name
* Quantity
* Notes

Examples:

* מיני מחפרון
* בובקט
* משאית מנוף
* כלים חשמליים

---

### Work Description

Multiple numbered work items.

Examples:

1. קשירת ברזל
2. חפירת יסודות
3. יציקת בטון רזה
4. הורדת תבניות

---

### Contractor Notes

Free text.

Default:

אין

---

### Photos

Multiple images.

Each photo contains:

* Image
* Caption
* Related Work Item
* Area / Location

---

# Reports

Reports are generated automatically.

The field employee does NOT create reports manually.

The employee fills a Daily Log.

The system generates Reports automatically.

---

## Report Types

### Daily Report

Generated from Daily Log.

### Weekly Report

Aggregated summary.

### Monthly Report

Aggregated summary.

---

## Report Content

* Company Header
* Project Information
* Daily Log Information
* Contractors Table
* Equipment List
* Work Description
* Notes
* Photos

---

## Report Actions

* Preview
* Export PDF
* Export Excel
* Mark as Sent

For MVP:

UI only.

---

# Issues Module

Construction defects / field issues.

Inspired by Cemento.

Fields:

* Project
* Location
* Title
* Description
* Responsible Contractor
* Assigned To
* Due Date
* Severity
* Status
* Photos
* Comments

---

## Severity

* Low
* Medium
* High
* Critical

---

## Status

* Open
* In Progress
* Resolved
* Reopened
* Closed

---

# Blockers Module

Items preventing progress.

Examples:

* Missing approval
* Missing material
* Supplier delay
* Missing consultant plan
* Concrete delivery delay

Fields:

* Project
* Title
* Description
* Impact
* Responsible Person
* Due Date
* Priority
* Status

---

## Priority

* Low
* Medium
* High
* Critical

---

## Status

* Open
* In Progress
* Resolved

---

# Decisions Module

Management decisions required.

Examples:

* Concrete pour approval
* Supplier approval
* Design change approval
* Budget deviation approval

Fields:

* Project
* Title
* Description
* Requested By
* Decision Owner
* Due Date
* Status

---

## Status

* Pending
* Approved
* Rejected
* Deferred

---

# Executive Dashboard

Management Control Center.

Purpose:

Answer management questions immediately.

---

## Main Questions

### What happened today?

### Which projects were not updated?

### Which projects are stuck?

### Which blockers are open?

### Which decisions are waiting?

### Which issues are critical?

### Which reports were sent?

---

## KPI Cards

* Active Projects
* Logs Submitted Today
* Missing Logs
* Open Issues
* Critical Issues
* Open Blockers
* Pending Decisions
* Reports Sent This Week

---

## Management Tables

### Projects Without Daily Log Today

### Critical Open Issues

### Open Blockers

### Pending Decisions

### Latest Reports

---

## Charts

### Issues By Status

### Blockers By Priority

### Daily Logs By Project

### Reports By Week

---

# UI Requirements

## Language

Hebrew

RTL

---

## Mobile First

Field employees primarily use mobile devices.

---

## Desktop Support

Management primarily uses desktop.

---

## Design Style

Construction industry.

Professional.

Operational.

Clean.

---

## Color Logic

Green:

* Closed
* Completed
* Approved

Yellow:

* Pending
* In Progress

Red:

* Critical
* Missing
* Overdue

Gray:

* Draft
* No Data

---

# Explicitly Excluded From MVP

Do NOT build:

* Authentication
* User Management
* Roles
* Permissions
* Supabase Integration
* AI Summaries
* Kanban Boards
* Gantt Charts
* Workflow Engines
* Notifications
* Chat
* Real File Storage
* Email Sending
* Advanced Automations

---

# Phase 2 (Future)

Only after MVP validation:

* Supabase
* Authentication
* Role Management
* File Storage
* PDF Generation
* Excel Export
* Client Portal
* Contractor Portal
* Push Notifications
* Advanced Reporting

---

# MVP Success Criteria

The CEO can:

* See all projects
* See daily updates
* See missing daily logs
* See blockers
* See decisions
* See issues
* See generated reports

The Project Manager can:

* Create a Daily Log in minutes
* Upload photos
* Record site activity

The Client can:

* Receive a structured report
* Understand project progress
* Gain visibility and control

The platform must feel like a real construction execution control system and not a generic task management application.
