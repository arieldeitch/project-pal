# 01 — Product Principles

## Design Rules

### 1. Simplicity Over Features
The app competes with WhatsApp and Excel. Users must find it easier, not more complex. Every new feature must clear the bar: "Is this easier than a WhatsApp message?"

### 2. Hebrew First
All user-facing text is in Hebrew. RTL is not an afterthought — it's the primary layout direction. Never add LTR-only UI patterns without verifying RTL compatibility.

### 3. Form-Driven Workflows
All data entry is via structured forms, not free-text. The daily log form is the centerpiece. Forms should auto-save drafts where feasible.

### 4. Data Immutability for Accountability
Daily logs cannot be edited after a report is generated. This is a business rule: reports are legal/contractual documents. The `prevent_log_edit_if_report_sent` trigger enforces this at DB level.

### 5. Mobile-Acceptable, Desktop-Primary
The site is RTL-responsive and works on mobile, but the primary UX is designed for desktop (site office laptop, project manager workstation). No native mobile features required for MVP.

---

## What NOT to Build (for now)

These are explicitly deferred. Do not add them without explicit product decision:

- **Offline mode / PWA** — adds significant complexity, not needed for MVP
- **Real-time collaboration** (simultaneous editing) — too complex for MVP
- **Push notifications** — email is sufficient for now
- **Multi-language UI** — Hebrew only for initial market
- **Budgeting / financial tracking** — out of scope
- **Integration with other tools** (Primavera, MS Project) — future
- **Edit-after-create for daily logs** — requires immutability exception logic
- **Issue/blocker detail pages** — current list view is sufficient for MVP

---

## UX Principles

### Loading States
All data-fetching pages show a simple Hebrew loading indicator (`טוען...`). No skeleton loaders required for MVP.

### Error Handling
- Network errors → generic Hebrew toast
- Duplicate data → specific Hebrew toast (e.g., "כבר קיים יומן לתאריך זה בפרויקט זה")
- Not found → TanStack Router's `notFound()` mechanism

### Status Colors
Status badges follow a consistent color system:
- Green → active / resolved / sent / approved
- Yellow → pending / in-progress
- Red → critical / blocked / overdue
- Gray → closed / cancelled

### Dialogs
Dialogs close only after successful mutation. Never close immediately on submit. This prevents the user from thinking the action succeeded when it failed.
