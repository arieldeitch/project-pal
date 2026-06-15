# REST API Design — Mehayesod Platform

> Version 1.0 | 2026-06-14

---

## 1. API Overview

### Base URL
```
Development: http://localhost:3000/api
Production:  https://app.mehayesod.co.il/api
```

### Conventions
- All endpoints use **JSON** request and response bodies.
- All timestamps are **ISO 8601** in UTC: `2026-06-14T07:30:00Z`.
- All dates are ISO 8601 date-only: `2026-06-14`.
- All IDs are **UUIDs**.
- Pagination: `?page=1&limit=20` (offset-based for MVP; cursor-based in Phase 5).
- Filtering: `?status=open&severity=critical` (query params, AND semantics).
- Sorting: `?sort=created_at&dir=desc`.
- Error responses use RFC 7807 Problem Details format.
- Hebrew text is transmitted as UTF-8.
- All routes require authentication in Phase 3+ (currently open for MVP).

### Standard Error Response
```json
{
  "type": "https://errors.mehayesod.co.il/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Daily log with id abc123 was not found",
  "instance": "/api/daily-logs/abc123"
}
```

### Pagination Response Envelope
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 2. Projects

### `GET /api/projects`

List all projects with optional status filter.

**Query params:**
- `status` — filter by project status
- `sort` — `name | start_date | target_date` (default: `name`)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "הצלפים 24",
      "address": "הצלפים 24, רעננה",
      "client": "יזמות בן-דוד בע״מ",
      "manager": "אבי כהן",
      "status": "active",
      "startDate": "2026-01-15",
      "targetDate": "2027-03-30",
      "lastLogDate": "2026-06-14",
      "hasLogToday": true,
      "openIssues": 4,
      "criticalIssues": 1,
      "openBlockers": 2,
      "pendingDecisions": 2
    }
  ]
}
```

**Notes:** The summary fields (`lastLogDate`, `openIssues`, etc.) are computed via the `v_project_health` view. This avoids N+1 queries from the frontend.

---

### `GET /api/projects/:id`

Get single project with all summary counts.

**Response 200:** Single project object (same shape as list item).

**Response 404:** Project not found.

---

### `POST /api/projects`

Create a new project.

**Request body:**
```json
{
  "name": "פרויקט חדש",
  "address": "רחוב הרצל 5, תל אביב",
  "client": "לקוח בע״מ",
  "manager": "שם מנהל",
  "status": "planning",
  "startDate": "2026-07-01",
  "targetDate": "2027-06-30"
}
```

**Response 201:**
```json
{ "id": "new-uuid", ...project }
```

**Validation:**
- `name`, `address`, `client`, `manager` are required, non-empty strings.
- `status` must be one of the allowed values.
- `startDate` must be a valid ISO date.
- `targetDate` must be >= `startDate`.

---

### `PUT /api/projects/:id`

Update a project. Partial updates supported (only send changed fields).

**Request body:** Partial project fields.

**Response 200:** Updated project.

**Response 404:** Project not found.

---

### `DELETE /api/projects/:id`

Delete a project. Blocked if the project has daily logs, issues, blockers, or decisions.

**Response 204:** No content.

**Response 409:** Conflict — project has related records. Returns list of blocking entity counts.

---

## 3. Daily Logs

### `GET /api/daily-logs`

List daily logs with filtering.

**Query params:**
- `projectId` — filter by project (required in most views)
- `dateFrom`, `dateTo` — date range filter
- `submittedBy` — filter by submitter
- `page`, `limit`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "projectName": "הצלפים 24",
      "date": "2026-06-14",
      "workHours": "07:00-15:00",
      "weather": "חמים, 28°",
      "submittedBy": "אבי כהן",
      "exceptionalEvents": "אין",
      "contractorNotes": "אין",
      "workDescription": ["קשירת ברזל קומה 2", "חפירת יסודות"],
      "contractorsCount": 2,
      "workersCount": 6,
      "photosCount": 2,
      "hasReport": true,
      "reportStatus": "sent",
      "createdAt": "2026-06-14T15:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### `GET /api/daily-logs/:id`

Get a single daily log with full details (contractors, equipment, photos).

**Response 200:**
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "date": "2026-06-14",
  "workHours": "07:00-15:00",
  "weather": "חמים, 28°",
  "submittedBy": "אבי כהן",
  "exceptionalEvents": "אין",
  "contractorNotes": "אין",
  "workDescription": ["קשירת ברזל קומה 2", "חפירת יסודות"],
  "contractors": [
    { "id": "uuid", "contractor": "א.ש שלד", "trade": "שלד", "workers": 5, "notes": "", "sortOrder": 0 }
  ],
  "equipment": [
    { "id": "uuid", "name": "מיני מחפרון", "quantity": 1, "notes": "", "sortOrder": 0 }
  ],
  "photos": [
    { "id": "uuid", "url": "signed-url", "caption": "יציקת בטון", "workItem": "יציקה", "area": "אזור A" }
  ],
  "report": { "id": "uuid", "status": "ready" },
  "createdAt": "2026-06-14T15:30:00Z"
}
```

---

### `POST /api/daily-logs`

Create a new daily log. Enforces unique (projectId, date).

**Request body:**
```json
{
  "projectId": "uuid",
  "date": "2026-06-14",
  "workHours": "07:00-15:00",
  "weather": "חמים, 28°",
  "submittedBy": "אבי כהן",
  "exceptionalEvents": "אין",
  "contractorNotes": "אין",
  "workDescription": ["קשירת ברזל קומה 2"],
  "contractors": [
    { "contractor": "א.ש שלד", "trade": "שלד", "workers": 5, "notes": "", "sortOrder": 0 }
  ],
  "equipment": [
    { "name": "מיני מחפרון", "quantity": 1, "notes": "", "sortOrder": 0 }
  ]
}
```

**Response 201:** Created log with generated IDs.

**Response 409:** Log already exists for this project on this date.

**Validation:**
- `projectId` must reference an existing project.
- `date` must not be in the future.
- `date` + `projectId` must be unique.

---

### `PUT /api/daily-logs/:id`

Update a daily log. Blocked if the associated report has status `sent`.

**Response 200:** Updated log.

**Response 403:** Cannot edit a log whose report has been sent.

---

### `DELETE /api/daily-logs/:id`

Delete a daily log. Blocked if an associated report has been sent.

**Response 204:** No content.

**Response 403:** Cannot delete a log whose report has been sent.

---

## 4. Reports

### `GET /api/reports`

List reports with filtering.

**Query params:**
- `projectId`
- `status` — draft | ready | sent
- `type` — daily | weekly | monthly
- `dateFrom`, `dateTo`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "projectName": "הצלפים 24",
      "dailyLogId": "uuid",
      "type": "daily",
      "date": "2026-06-14",
      "status": "sent",
      "sentAt": "2026-06-14T18:00:00Z",
      "createdAt": "2026-06-14T15:31:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### `GET /api/reports/:id`

Get a single report with full assembled content (for web preview and PDF generation).

**Response 200:**
```json
{
  "id": "uuid",
  "type": "daily",
  "date": "2026-06-14",
  "status": "ready",
  "project": { "name": "...", "client": "...", "address": "...", "manager": "..." },
  "dailyLog": {
    "date": "2026-06-14",
    "workHours": "07:00-15:00",
    "weather": "...",
    "submittedBy": "...",
    "exceptionalEvents": "...",
    "contractorNotes": "...",
    "workDescription": [...],
    "contractors": [...],
    "equipment": [...],
    "photos": [...]
  }
}
```

---

### `POST /api/reports`

Create a report record. Typically auto-triggered after daily log creation.

**Request body:**
```json
{
  "projectId": "uuid",
  "dailyLogId": "uuid",
  "type": "daily",
  "date": "2026-06-14"
}
```

**Response 201:** Report record (without content — fetched separately).

**Response 409:** Report already exists for this daily log.

---

### `PUT /api/reports/:id`

Update report status.

**Request body:**
```json
{ "status": "ready" }
```

**Allowed transitions enforced server-side:**
- `draft` → `ready`
- `ready` → `draft`
- `ready` → `sent`

**Response 200:** Updated report.

**Response 422:** Invalid status transition.

---

### `POST /api/reports/:id/generate-pdf`

Trigger server-side PDF generation.

**Response 202:** Accepted (async generation).
```json
{ "jobId": "uuid", "estimatedSeconds": 15 }
```

**GET /api/reports/:id/pdf** — poll for PDF download URL.

**Response 200 (when ready):**
```json
{ "url": "https://signed-storage-url...", "expiresAt": "2026-06-14T20:00:00Z" }
```

**Response 202 (still generating):**
```json
{ "status": "generating" }
```

---

### `POST /api/reports/:id/send`

Mark a report as sent and record timestamp.

**Request body:** (optional)
```json
{ "recipients": ["client@company.com"] }
```

**Response 200:** Updated report with `status: sent`, `sentAt: <timestamp>`.

---

## 5. Issues

### `GET /api/issues`

**Query params:** `projectId`, `status`, `severity`, `assignedTo`, `page`, `limit`, `sort`

**Response 200:** Paginated list of issues with photo count and comment count.

---

### `GET /api/issues/:id`

Full issue details including photos and comments.

---

### `POST /api/issues`

```json
{
  "projectId": "uuid",
  "title": "סדק בקיר חיצוני",
  "location": "קומה 2 - אזור B",
  "description": "סדק אופקי באורך 80 ס״מ",
  "responsibleContractor": "א.ש שלד",
  "assignedTo": "אבי כהן",
  "dueDate": "2026-06-20",
  "severity": "high"
}
```

**Response 201:** Created issue with `status: open`.

---

### `PUT /api/issues/:id`

Update issue fields or status.

**Status transition rules (enforced server-side):**
- `open` → `in_progress`, `closed`
- `in_progress` → `resolved`, `open`
- `resolved` → `closed`, `reopened`
- `reopened` → `in_progress`
- `closed` → (terminal)

---

### `DELETE /api/issues/:id`

Soft delete (set status to `closed`) rather than hard delete, to preserve history.

---

### `POST /api/issues/:id/comments`

Add a comment to an issue.

```json
{ "author": "אבי כהן", "body": "תואם איטום נוסף" }
```

**Response 201:** Comment record.

---

## 6. Blockers

### `GET /api/blockers`

**Query params:** `projectId`, `status`, `priority`, `page`, `limit`

---

### `GET /api/blockers/:id`

---

### `POST /api/blockers`

```json
{
  "projectId": "uuid",
  "title": "בטון לא סופק בזמן",
  "description": "ספק בטון מאחר 3 ימים",
  "impact": "עיכוב יציקת קומה 3",
  "responsible": "מנהל רכש",
  "dueDate": "2026-06-15",
  "priority": "critical"
}
```

**Response 201:** Created blocker with `status: open`.

---

### `PUT /api/blockers/:id`

Update blocker fields or status.

**Status transitions:** `open` → `in_progress` → `resolved`

---

### `DELETE /api/blockers/:id`

Hard delete only if status is `open` and no resolution notes exist. Otherwise soft-close.

---

## 7. Decisions

### `GET /api/decisions`

**Query params:** `projectId`, `status`, `owner`, `page`, `limit`

---

### `GET /api/decisions/:id`

---

### `POST /api/decisions`

```json
{
  "projectId": "uuid",
  "title": "אישור יציקת קומה 3",
  "description": "האם להתחיל יציקה למרות איחור בטון",
  "requestedBy": "אבי כהן",
  "owner": "מנכ״ל",
  "dueDate": "2026-06-15"
}
```

**Response 201:** Created decision with `status: pending`.

---

### `PUT /api/decisions/:id`

Update or change status.

**Status transitions:**
- `pending` → `approved`, `rejected`, `deferred`
- `deferred` → `pending` (reconsideration)
- `approved` / `rejected` → (terminal — no changes)

---

### `DELETE /api/decisions/:id`

Delete only if `status = pending`. Approved/rejected decisions cannot be deleted (audit trail).

---

## 8. Photos

### `POST /api/photos/upload-url`

Get a pre-signed upload URL from Supabase Storage. Client uploads directly to storage — no file passes through the API server.

**Request body:**
```json
{
  "entityType": "daily_log",
  "entityId": "uuid",
  "filename": "photo_001.jpg",
  "contentType": "image/jpeg"
}
```

**Response 200:**
```json
{
  "uploadUrl": "https://supabase-storage-url/signed-upload-url",
  "storageKey": "site-photos/proj-uuid/logs/log-uuid/photo_001.webp",
  "expiresAt": "2026-06-14T16:00:00Z"
}
```

---

### `POST /api/photos`

Register a photo after it has been uploaded to storage.

**Request body:**
```json
{
  "entityType": "daily_log",
  "entityId": "uuid",
  "storageKey": "site-photos/.../photo_001.webp",
  "caption": "יציקת בטון רזה",
  "workItem": "יציקה",
  "area": "אזור A"
}
```

**Response 201:** Photo record.

---

### `DELETE /api/photos/:id`

Delete photo record and remove file from storage.

**Response 204:** No content.

---

## 9. Dashboard

### `GET /api/dashboard/summary`

Returns all data needed for the operational and executive dashboards in a single request.

**Response 200:**
```json
{
  "kpis": {
    "activeProjects": 2,
    "logsSubmittedToday": 2,
    "missingLogsToday": 0,
    "openIssues": 8,
    "criticalIssues": 2,
    "openBlockers": 4,
    "pendingDecisions": 3,
    "reportsSentThisWeek": 5
  },
  "projectsWithoutLogToday": [...],
  "criticalOpenIssues": [...],
  "openBlockers": [...],
  "pendingDecisions": [...],
  "latestReports": [...]
}
```

**Notes:** This is a single optimized query against the `v_project_health` view plus targeted list queries. Avoids waterfall requests from the frontend.

---

## 10. HTTP Status Code Reference

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 202 | Accepted (async) |
| 204 | No Content (delete) |
| 400 | Bad Request — validation error |
| 403 | Forbidden — not allowed (e.g., edit sent log) |
| 404 | Not Found |
| 409 | Conflict — unique constraint or state conflict |
| 422 | Unprocessable — invalid state transition |
| 500 | Internal Server Error |
