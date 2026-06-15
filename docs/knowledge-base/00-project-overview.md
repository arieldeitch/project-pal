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

---

## Product Stage

**Internal MVP** — single company deployment. The architecture is designed to scale to multi-tenant SaaS later but currently targets one company.

---

## Tech Context

- Hebrew-first, RTL layout throughout
- All UI copy is in Hebrew
- Designed for desktop browsers (primary use case is office + site office)
- No offline/PWA requirement for MVP
