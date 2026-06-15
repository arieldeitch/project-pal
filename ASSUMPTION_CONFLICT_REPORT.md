# ASSUMPTION_CONFLICT_REPORT.md
> Analysis of conflicts between the user's Phase 1–6 prompt, previous AI sessions,
> and the authoritative knowledge base.
> Source of truth: Knowledge/ folder documents.

---

## CRITICAL CONFLICTS — Stop and Resolve Before Any Code

---

### CONFLICT-01: Business Hierarchy Mismatch

**Issue:** The user's prompt specifies the business hierarchy as:
```
Site / Asset → Projects → Tasks
```

**Knowledge base says:** The hierarchy is:
```
Project → Daily Logs, Issues, Blockers, Decisions, Reports
```

**Specific conflicts:**
- "Site" entity: Does NOT exist in any knowledge base document. There is no Site table, no Site concept, no Site-level aggregation.
- "Task" entity: Does NOT exist in any knowledge base document. The closest entities are "Issues", "Blockers", and "Decisions" — but none of these are called "Tasks" and they have fundamentally different semantics.
- "Asset" entity: Does NOT exist anywhere in the knowledge base.

**Source files:** MEHAYESOD PROJECT EXECUTION PLATFORM.MD §Core Modules, MEHAYESOD_PLATFORM_MEMORY.md §Project Structure, 150626 MEHAYESOD GPT MEMORY.md §Product Hierarchy

**Recommended correction:** STOP. Verify with the product owner whether:
- (A) "Site" is a synonym for "Project" in the construction context (a construction project = a construction site)
- (B) "Tasks" are a new entity not yet documented, to be added
- (C) The prompt was written for a different product entirely

**Impact if ignored:** Implementing Site → Project → Task would require a complete data model redesign, new tables, and invalidation of all existing migrations and UI.

---

### CONFLICT-02: Authentication in MVP

**Issue:** The user's prompt places "Authentication" as Priority #1 in the execution plan:
> "1. Authentication"
> "2. Permission System (RLS)"

And describes an MVP authentication requirement:
> "Supabase Email + Password only."

**Knowledge base says:** Authentication is **EXPLICITLY EXCLUDED FROM MVP**:

From MEHAYESOD PROJECT EXECUTION PLATFORM.MD §Explicitly Excluded From MVP:
> Authentication, User Management, Roles, Permissions

From 150626 MEHAYESOD GPT MEMORY.md §Explicit MVP Exclusions:
> Authentication, RLS, User management

From docs/10-implementation-roadmap.md:
> Phase 3 (Days 8–12) — Authentication

**Source files:** All three knowledge base documents explicitly exclude authentication from MVP.

**Recommended correction:** Clarify whether the product owner has changed the MVP definition to include authentication. If yes, update the knowledge base and obtain approval brief (per global CLAUDE.md rules — authentication changes require approval brief).

**Impact if ignored:** Building auth in Phase 1 when the knowledge base says no-auth would conflict with Phase 1 success criteria and add 5 days of work not yet approved.

---

### CONFLICT-03: Permission Model (RLS) in MVP

**Issue:** The user's prompt specifies:
> "Permission Model — Employee: Can only see assigned sites/projects/tasks. Manager/Admin: Can access all data."

This is a **strict project-scoped RLS model**.

**Knowledge base says:**
- Phase 1: No RLS, no permissions
- Phase 3: Permissive RLS (any authenticated user = all data)
- Phase 5: Strict project-scoped RLS

The strict employee-can-only-see-assigned-projects model is Phase 5, not MVP.

**Source files:** docs/10-implementation-roadmap.md §Phase 3, §Phase 5; MEHAYESOD PROJECT EXECUTION PLATFORM.MD §Explicitly Excluded From MVP

**Recommended correction:** Confirm which phase the permission model belongs to. The documentation is clear: strict per-user project scoping is Phase 5.

---

### CONFLICT-04: "Employee" Role vs. "Field Manager" Role

**Issue:** The user's prompt uses the term "Employee" as a role.

**Knowledge base uses:** "Field Project Manager" / "Field Manager" as the primary field role. "Company Manager" and "CEO/Admin" as management roles.

**Source files:** MEHAYESOD PROJECT EXECUTION PLATFORM.MD §Core Modules (Field Project Managers, Company Management, Clients); docs/10-implementation-roadmap.md §Phase 3 (field_manager, company_manager, admin roles)

**Recommended correction:** Align terminology. If "Employee" = "Field Manager", document this equivalence. If "Employee" is a new, lower-permission role (below Field Manager), it requires documentation and schema changes.

---

### CONFLICT-05: "Management Comments" as MVP Success Criterion

**Issue:** The user's prompt states:
> "The CEO must be able to: Leave management comments"

**Knowledge base says:** Comments exist only on Issues (as `issue_comment` table). There is no concept of "management comments" on reports or projects in the MVP.

**Source files:** docs/09-mvp-gap-analysis.md §GAP-M02 (comments on Issues is Medium Priority, not MVP Critical); MEHAYESOD PROJECT EXECUTION PLATFORM.MD §Issues Module (comments field listed)

**Recommended correction:** Clarify what "management comments" means. If it means:
- Comments on Issues → already in data model, UI not yet built (medium priority)
- Comments on Reports → NOT in knowledge base, would be a new feature
- Comments on Daily Logs → NOT in knowledge base

---

### CONFLICT-06: Excel Export as MVP Priority

**Issue:** The user's prompt includes "Excel Export" in the MVP feature list and as execution step #9.

**Knowledge base says:** Excel export is:
- Phase 4, Day 18 in the roadmap
- GAP-M01 (Medium priority, not Critical)
- "2 days effort"

**Source files:** docs/09-mvp-gap-analysis.md §GAP-M01; docs/10-implementation-roadmap.md §Phase 4d

**Recommended correction:** Excel export is a valid Phase 4 feature. It is not MVP Phase 1. Confirm whether the product owner has elevated its priority.

---

### CONFLICT-07: "Task Management" Feature Category

**Issue:** The user's prompt includes "Task Management" as an MVP feature category.

**Knowledge base says:** "Task" does not exist as an entity. There is no task module documented anywhere.

**Source files:** All knowledge base documents. "Task" is never mentioned.

**Recommended correction:** This is either:
- (A) A wrong term — "Tasks" may mean "Daily Logs" (field work items to document)
- (B) A new undocumented entity — requires specification
- (C) Evidence the prompt was written for a different product

---

### CONFLICT-08: "Site Management" Feature Category

**Issue:** The user's prompt includes "Site Management" as an MVP feature category.

**Knowledge base says:** "Site" is not a separate entity. The closest entity is "Project" (a construction project = a construction site).

**Recommended correction:** If "Site" = "Project", then Site Management = Project Management, and these are the same thing. Confirm and align terminology.

---

## Previously Built Code Conflicts

### CONFLICT-09: Mock Data Was Removed Prematurely

**Issue:** A previous AI session (Phase 2) removed all mock data from `src/lib/mock-data.ts` and connected the UI to Supabase repositories. However, the knowledge base's Phase 1 MVP specifies:
> "Phase 1: Build with mock data only. No backend complexity. No authentication. No Supabase. No integrations."

**Current code state:** `src/lib/mock-data.ts` is stripped to only types and label maps. All route files use React Query + Supabase repositories. The app CANNOT function without a Supabase connection (`.env.local` with real credentials).

**Knowledge base intent:** Phase 1 = fully functional UI with mock data, no Supabase dependency.

**Impact:** The app currently shows empty states for everything because Supabase is not connected. A new developer following the docs would expect mock data to work without any setup.

**Recommended correction:** Either:
- (A) Accept that Phase 2 (Supabase integration) is done and focus on connecting the real Supabase project
- (B) Restore mock data fallback so the app demonstrates correctly without credentials

**Source files:** Knowledge/MEHAYESOD PROJECT EXECUTION PLATFORM.MD §MVP Philosophy; docs/CHECKPOINT_CURRENT_STATUS.md (Phase 2 marked complete)

---

### CONFLICT-10: Photo Upload Removed from Forms

**Issue:** The daily log creation form (`src/routes/daily-logs.new.tsx`) had its photo upload section removed by a previous AI session.

**Knowledge base says:** Photos are a core feature of Daily Logs. The knowledge base lists photos as one of the key Daily Log fields.

**Current code state:** Photo upload section removed. Storage not implemented. Gray placeholder SVG shown.

**Recommended correction:** This is correct per Phase 2 scope. Photo upload is Phase 2/3. The placeholder approach is the right interim solution. No action needed now.

---

### CONFLICT-11: `DailyLog.logNumber` Auto-Assignment

**Issue:** The `DailyLog` TypeScript type in `src/lib/mock-data.ts` does NOT include a `logNumber` field.

**Knowledge base says:** `log_number` is a required field, auto-assigned by a BEFORE INSERT trigger, and used in display format `LOG-YYYY-NNNNNN`. It appears in legal/contractual documents.

**Recommended correction:** Add `logNumber: number` to the `DailyLog` interface once the Supabase connection is live.

---

### CONFLICT-12: `DecisionStatus` Includes "Deferred" vs. Knowledge Base "Deferred"

**Issue:** `src/lib/mock-data.ts` defines `DecisionStatus = "pending" | "approved" | "rejected" | "deferred"` but the knowledge base §Decisions Module lists status as: Pending, Approved, Rejected, **Deferred** (exact match). No conflict here — this is consistent.

**Finding:** No conflict. This is correct.

---

### CONFLICT-13: `ReportStatus` Includes "Draft" Not in Original Spec

**Issue:** `src/lib/mock-data.ts` includes `"draft"` as a report status. The original MEHAYESOD PROJECT EXECUTION PLATFORM.MD does not mention "draft" explicitly — it mentions Preview, Export PDF, Export Excel, Mark as Sent as actions.

**Knowledge base (GPT Memory):** Report statuses are Daily/Ready/Sent per MASTER_SUMMARY.md, which mentions `draft`, `ready`, `sent`.

**Finding:** Minor — `draft` is a reasonable initial state and is consistent with MASTER_SUMMARY.md Decision 1. Not a true conflict.

---

### CONFLICT-14: Project Status "planning" Not in Knowledge Base

**Issue:** `src/lib/mock-data.ts` defines `ProjectStatus = "planning" | "active" | "on_hold" | "completed"`.

The knowledge base (MEHAYESOD PROJECT EXECUTION PLATFORM.MD) lists project status as only Active, On Hold, Completed. "Planning" is not mentioned.

**Recommended correction:** Verify with product owner whether "planning" is a valid project status. Low priority.

---

## Features Planned/Built That Are NOT in Documentation

| Feature | Status | Knowledge Base Reference |
|---|---|---|
| Supabase repositories | Built | Phase 2 in roadmap — ahead of schedule or correct per Phase 2 |
| React Query hooks | Built | Phase 4b in roadmap — significantly ahead of roadmap order |
| Auth (proposed by user prompt) | Not built | Explicitly excluded from MVP; Phase 3 in roadmap |
| RLS (proposed by user prompt) | Not built | Explicitly excluded from MVP; Phase 3 in roadmap |
| Site entity (proposed by user prompt) | Not built | NOT IN KNOWLEDGE BASE AT ALL |
| Task entity (proposed by user prompt) | Not built | NOT IN KNOWLEDGE BASE AT ALL |

## Features Missing from Current Implementation

| Feature | Knowledge Base Priority | Status |
|---|---|---|
| Real Supabase project connected | CRITICAL | Missing — .env.local empty |
| Photo upload | CRITICAL | Missing |
| PDF generation | HIGH | Missing (button placeholder) |
| Report snapshot on send | HIGH | Missing |
| Excel export | MEDIUM | Missing (button placeholder) |
| Comments UI on Issues | MEDIUM | Missing |
| Pagination | MEDIUM | Missing |
| Authentication | Phase 3 | Not yet (by design) |

---

## Architecture Decisions That Should Be Reviewed

### REVIEW-01: React Query Migration Completed Before API Layer

The roadmap specifies: API Layer (Phase 4a) → React Query Migration (Phase 4b).
The current code has React Query hooks but calls Supabase directly from repositories, skipping the "API Layer" (server routes) phase.

**Assessment:** This is NOT necessarily wrong. The roadmap assumed a server-side API layer (TanStack Start server routes), but using Supabase client directly from the browser with React Query hooks is a valid alternative that skips the server-side API entirely. This is the standard Supabase + React Query pattern.

**Recommended action:** Accept this as a valid shortcut. Document it. The original API layer design assumed we'd need server routes for security; Supabase RLS can replace that for most endpoints.

### REVIEW-02: Photo FK Architecture Was Correctly Fixed

The original Phase 1 design used polymorphic FKs for photos. This was corrected (Decision 3 in MASTER_SUMMARY.md) to use typed nullable FKs with a CHECK constraint. The current schema reflects this correctly.

**Assessment:** No action needed.
