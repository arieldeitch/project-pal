# File Storage Strategy — Mehayesod Platform

> Version 1.0 | 2026-06-14

---

## 1. Storage Provider

**Chosen: Supabase Storage**

Supabase Storage is built on top of AWS S3 with a PostgreSQL-backed metadata layer. It integrates natively with Supabase Auth for access control (via Storage RLS policies). No additional service account or SDK is required beyond the existing Supabase client.

**Alternatives considered:**
- Cloudflare R2 — cheaper egress but requires separate integration.
- AWS S3 directly — more control but more operational complexity.
- **Decision:** Supabase Storage is the correct default for an MVP using Supabase as the primary backend.

---

## 2. Storage Buckets

### 2.1 `site-photos`

Photos uploaded from daily logs and issue reports.

```
Bucket: site-photos
Access: PRIVATE
Max object size: 10 MB
Allowed types: image/jpeg, image/png, image/webp, image/heic
```

### 2.2 `reports`

Generated PDF report files.

```
Bucket: reports
Access: PRIVATE
Max object size: 50 MB
Allowed types: application/pdf
```

### 2.3 `exports`

Excel/CSV exports (temporary).

```
Bucket: exports
Access: PRIVATE
Max object size: 10 MB
Allowed types: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Lifecycle: auto-delete after 7 days
```

---

## 3. Folder Structure

### 3.1 Site Photos

```
site-photos/
└── {project_id}/
    ├── logs/
    │   └── {daily_log_id}/
    │       ├── photo_001.webp
    │       ├── photo_002.webp
    │       └── photo_003.webp
    └── issues/
        └── {issue_id}/
            ├── photo_001.webp
            └── photo_002.webp
```

**Example:**
```
site-photos/
└── f3a7b2c1-...-proj/
    ├── logs/
    │   ├── e1d4a9f2-...-log1/
    │   │   ├── photo_001.webp
    │   │   └── photo_002.webp
    │   └── e1d4a9f2-...-log2/
    │       └── photo_001.webp
    └── issues/
        └── b2c3d4e5-...-issue1/
            └── photo_001.webp
```

### 3.2 Reports

```
reports/
└── {project_id}/
    └── {report_id}/
        └── daily_report_{YYYY-MM-DD}.pdf
```

**Example:**
```
reports/
└── f3a7b2c1-...-proj/
    ├── a1b2c3d4-...-report1/
    │   └── daily_report_2026-06-14.pdf
    └── a1b2c3d4-...-report2/
        └── daily_report_2026-06-15.pdf
```

### 3.3 Exports

```
exports/
└── {user_id}/
    └── {timestamp}_{export_type}.xlsx
```

**Example:**
```
exports/
└── usr_abc123/
    └── 2026-06-14T15-30-00Z_weekly_report_pr1.xlsx
```

---

## 4. Naming Conventions

### Photo Files

```
photo_{sequence:03d}.{ext}
```

- Sequence is 1-indexed: `photo_001`, `photo_002`
- Extension is always `webp` for processed photos, `jpg` as fallback for HEIC originals
- No spaces in filenames
- Sequence is assigned by the upload order within a session

### Report PDFs

```
daily_report_{YYYY-MM-DD}.pdf
weekly_report_{YYYY-MM-DD}_to_{YYYY-MM-DD}.pdf
monthly_report_{YYYY-MM}.pdf
```

### Storage Keys (unique identifier used in `photo.storage_key`)

The full storage key for each object combines bucket name and path:

```
{bucket}/{project_id}/{entity_type}/{entity_id}/{filename}
```

Example:
```
site-photos/f3a7b2c1/logs/e1d4a9f2/photo_001.webp
reports/f3a7b2c1/a1b2c3d4/daily_report_2026-06-14.pdf
```

The `storage_key` column in the `photo` table stores the path **without** the bucket name prefix. The bucket is determined by `entity_type`.

---

## 5. Upload Flow

### 5.1 Client-Side Photo Upload (Direct to Storage)

Files are uploaded **directly from the client to Supabase Storage** via a pre-signed URL. The file never passes through the application server. This is critical for mobile field employees on construction sites with variable connectivity.

```
Field employee selects photo (mobile)
    │
    ▼
Client requests upload URL: POST /api/photos/upload-url
    │
    ▼
Server generates pre-signed URL (Supabase Storage SDK)
    │
    ▼
Client compresses image (client-side, before upload)
    │
    ▼
Client uploads directly to Supabase Storage (PUT to signed URL)
    │
    ▼
Client notifies server of completion: POST /api/photos
    │
    ▼
Server creates photo record in DB with storageKey
```

### 5.2 Client-Side Image Compression

Before uploading, images are compressed in the browser:

```typescript
// Target: max 1280px wide, max 500 KB, WebP format
async function compressImage(file: File): Promise<Blob> {
  const imageBitmap = await createImageBitmap(file);
  const maxWidth = 1280;
  const scale = Math.min(1, maxWidth / imageBitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = imageBitmap.width * scale;
  canvas.height = imageBitmap.height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.8));
}
```

**Rationale:**
- HEIC files from iPhones cannot be displayed in browsers without conversion.
- WebP is ~30% smaller than JPEG at the same quality.
- 1280px is sufficient for construction documentation; higher resolution is unnecessary.
- Compressing on-device reduces upload time on slow mobile networks.

### 5.3 PDF Generation Upload (Server-Side)

PDFs are generated server-side (Edge Function) and uploaded directly from the server:

```typescript
// Inside Edge Function: generate-pdf-report
const pdfBuffer = await generatePdf(reportData);
const storagePath = `${projectId}/${reportId}/daily_report_${date}.pdf`;

const { error } = await supabase.storage
  .from('reports')
  .upload(storagePath, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: false,  // Never overwrite sent reports
  });
```

---

## 6. Access Control (Storage RLS)

### 6.1 Site Photos

```sql
-- Authenticated users can read photos for their accessible projects
CREATE POLICY "authenticated_read_site_photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'site-photos');

-- Field managers can upload to their projects
CREATE POLICY "field_manager_upload_photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'site-photos'
  -- Path starts with their assigned project_id
  AND (storage.foldername(name))[1] IN (
    SELECT jsonb_array_elements_text(auth.jwt() -> 'app_metadata' -> 'project_ids')
  )
);

-- Users can delete their own uploads
CREATE POLICY "uploader_delete_photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'site-photos'
  AND owner = auth.uid()
);
```

### 6.2 Reports

```sql
-- Reports are readable by authenticated users (company managers and admins)
CREATE POLICY "authenticated_read_reports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'reports');

-- Only Edge Functions (service role) can write reports
-- No INSERT policy for authenticated users — server-only writes
```

---

## 7. Serving Photos

### 7.1 For Preview (Short-Lived Signed URLs)

```typescript
// Get a 1-hour signed URL for displaying a photo
const { data } = await supabase.storage
  .from('site-photos')
  .createSignedUrl(photo.storageKey, 3600);

// data.signedUrl is used as <img src={signedUrl}>
```

**Cache the signed URL** — regenerating it on every render is wasteful. Store the URL in TanStack Query with a TTL of 55 minutes.

### 7.2 For PDF Download (Short-Lived Signed URLs)

```typescript
const { data } = await supabase.storage
  .from('reports')
  .createSignedUrl(report.pdfStorageKey, 900); // 15 minutes for download
```

### 7.3 Public URLs (Do Not Use for MVP)

Supabase Storage objects in private buckets cannot have permanent public URLs. Do not make any bucket public — all construction site photos and reports are confidential.

---

## 8. Retention Policy

| Bucket | Retention | Enforcement |
|---|---|---|
| `site-photos` | Indefinite (for legal compliance) | Manual deletion only |
| `reports` | Indefinite (sent reports are legal documents) | Manual deletion only |
| `exports` | 7 days | Supabase Storage lifecycle rules (when available) or a scheduled cron Edge Function |

**Assumption:** Construction project records and daily logs are retained for the lifetime of the project plus 7 years (standard Israeli construction documentation requirements). Storage deletion requires explicit management action.

### Cleanup Cron (Phase 5)

```typescript
// Edge Function: cleanup-exports
// Runs daily, deletes export files older than 7 days
const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const { data: files } = await supabase.storage.from('exports').list('', {
  search: '',
});
const oldFiles = files?.filter(f => f.created_at < cutoff) ?? [];
await supabase.storage.from('exports').remove(oldFiles.map(f => f.name));
```

---

## 9. Storage Capacity Estimates

| Source | Per Event | Events/Month | Monthly Storage |
|---|---|---|---|
| Site photos | ~400 KB avg (compressed WebP) | 50 photos/log × 22 days × 3 projects = 3,300 photos | ~1.3 GB/month |
| Report PDFs | ~500 KB avg | 22 reports × 3 projects = 66 PDFs | ~33 MB/month |
| Excel exports | ~200 KB avg | ~20 exports/month | ~4 MB/month |

**Total estimated growth: ~1.35 GB/month** — well within Supabase Pro plan limits (100 GB included).

After 12 months: ~16 GB. Photos are the dominant cost. WebP compression is the key cost control.

---

## 10. Edge Cases

| Scenario | Handling |
|---|---|
| User uploads same photo twice | `unique index on photo.storage_key` prevents duplicate DB records; Supabase Storage with `upsert: false` rejects duplicate object keys |
| Upload fails mid-stream | Client retries the upload. If the signed URL expired (>5 minutes), re-request a new URL. |
| Report PDF generation fails | Report status remains `ready`; no PDF stored. User can retry PDF generation. |
| Photo deleted but record remains | Application shows a broken image placeholder. Phase 2 adds a cleanup job to detect orphaned DB records. |
| Field employee on airplane mode | Photos are queued in IndexedDB and uploaded when connectivity returns. (Phase 5 — offline support) |
