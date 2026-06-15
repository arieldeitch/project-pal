# 00 — Project Overview

## What Is Mehayesod?

**Mehayesod** (מהיסוד — Hebrew: "from the foundation") is a web-based construction site execution platform for Israeli construction companies.

It digitizes the daily operational workflow that currently lives across WhatsApp messages, Excel sheets, and phone calls. It gives site managers a structured way to document work, track issues, and communicate status to project owners.

---

## The Problem It Solves

Israeli construction site managers spend significant time:
- Manually writing daily work summaries in WhatsApp groups
- Tracking defects and blockers in messy Excel files
- Missing approvals because "decision needed" messages get lost
- Generating PDF reports manually from notes

Mehayesod replaces all of this with a single tool.

---

## Who Uses It

| Role | What they do |
|---|---|
| **Site Manager** | Submits daily logs, reports issues, tracks blockers |
| **Project Manager** | Reviews project status, approves decisions |
| **Company Owner / Executive** | Sees cross-project dashboard, receives PDF reports |

---

## Core Value Proposition

1. **Daily log in 5 minutes** — structured form replacing WhatsApp daily summaries
2. **Issues tracked, not forgotten** — every defect has a status and owner
3. **Reports sent automatically** — PDF generated from daily log and emailed to owner
4. **Executive visibility** — one dashboard showing all projects' status

---

## What It Is NOT

- Not a project scheduling / Gantt tool
- Not a financial or budget management tool
- Not a BIM/CAD platform
- Not a mobile app (web-responsive but not native)
- Not a public marketplace

## MVP Scope Boundary

The following features are explicitly OUT of the current MVP and must not be added until the product owner approves Phase 2 after Supabase deployment is verified:

- Branded PDF report generation
- Engineering response / findings workflow
- Cost estimate tables
- Standard / regulation references
- Digital signature fields
- Photo storage and upload (Supabase Storage bucket not yet configured)
- Email delivery of reports
- Weekly / monthly automated report generation

---

## Product Stage

**Phase 1 (current):** Operational MVP — single company deployment. The architecture is designed to scale to multi-tenant SaaS later but currently targets one company. Supabase backend is configured; migrations are pending deployment.

**Phase 2 (next):** Field reporting and professional PDF generation. Based on reference documents provided by the product owner, Phase 2 will add branded PDF output for two report types:
- Daily Work Log PDF (יומן עבודה) — structured daily site activity record for clients and supervision
- Engineering Response PDF (דוח תגובה הנדסי) — professional response to inspection findings with cost estimates, standard references, and digital signature

**Phase 3 (future, not yet scoped):** Advanced analytics and automation. Requires explicit product owner approval before any implementation.

---

## Tech Context

- Hebrew-first, RTL layout throughout
- All UI copy is in Hebrew
- Designed for desktop browsers (primary use case is office + site office)
- No offline/PWA requirement for MVP
