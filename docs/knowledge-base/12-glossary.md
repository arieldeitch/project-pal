# 12 — Glossary

## Hebrew Product Terms

| Hebrew | Transliteration | English |
|---|---|---|
| מהיסוד | Mehayesod | "From the foundation" — the product name |
| יומן יומי | Yoman Yomi | Daily log |
| ליקוי | Likui | Issue / defect |
| חסם | Chosem | Blocker |
| החלטה | Hachlata | Decision |
| דוח | Doch | Report |
| פרויקט | Proyekt | Project |
| קבלן | Kablan | Contractor |
| ציוד | Tziyud | Equipment |
| עובדים | Ovedim | Workers |
| ענף | Anaf | Trade (e.g., plumbing, electrical) |
| מנהל אתר | Menahel Atar | Site manager |
| מנהל פרויקט | Menahel Proyekt | Project manager |
| בעל פרויקט | Baal Proyekt | Project owner |
| טוען... | Toan... | Loading... (Hebrew loading indicator) |

---

## Status Labels (Hebrew)

### Project Status
| Code | Hebrew |
|---|---|
| `active` | פעיל |
| `completed` | הושלם |
| `on_hold` | מוקפא |

### Issue Status
| Code | Hebrew |
|---|---|
| `open` | פתוח |
| `in_progress` | בטיפול |
| `resolved` | טופל |
| `closed` | סגור |

### Severity / Priority
| Code | Hebrew |
|---|---|
| `low` | נמוכה |
| `medium` | בינונית |
| `high` | גבוהה |
| `critical` | קריטי |

### Blocker Status
| Code | Hebrew |
|---|---|
| `open` | פתוח |
| `in_progress` | בטיפול |
| `resolved` | טופל |

### Decision Status
| Code | Hebrew |
|---|---|
| `pending` | ממתין |
| `approved` | אושר |
| `rejected` | נדחה |
| `implemented` | יושם |

### Report Status
| Code | Hebrew |
|---|---|
| `ready` | מוכן |
| `sent` | נשלח |

---

## Technical Terms

| Term | Meaning in This Codebase |
|---|---|
| Repository | `src/repositories/*.ts` — async functions that talk to Supabase and transform data |
| Hook | `src/hooks/*.ts` — TanStack Query wrappers over repositories |
| KEYS | Query key constants in each hook file — used for cache management |
| `notFound()` | TanStack Router function to trigger a 404 response |
| `isPending` | TanStack Query mutation state — true while a mutation is in flight |
| `invalidateQueries` | TanStack Query method to mark cached data stale and trigger refetch |
| PostgREST | The REST API layer that Supabase exposes on top of PostgreSQL |
| `anon key` | Public Supabase API key — safe for frontend use; used in `VITE_SUPABASE_ANON_KEY` |
| `service_role key` | Secret Supabase key — NEVER use in frontend code |
| RLS | Row Level Security — PostgreSQL policy system that restricts row access per user |
| CRLF | Windows line ending (`\r\n`) — causes Prettier lint warnings |
| `23505` | PostgreSQL error code for unique constraint violation |
| `P0001` | PostgreSQL error code raised by custom triggers (our immutability guards) |
| `work_description` | JSONB column on `daily_log` storing `string[]` of work items done |
| `log_number` | Sequential number per project, auto-assigned by trigger |
| `resolved_at` | Timestamp auto-set by trigger when issue/blocker status → `resolved` |
| PostgREST FK disambiguation | `table!column_name(*)` syntax required when a table has multiple FK columns |
| PHOTO_PLACEHOLDER | Gray SVG data URI shown when `storage_key` is not a real HTTPS URL |

---

## Acronyms

| Acronym | Meaning |
|---|---|
| MVP | Minimum Viable Product |
| RLS | Row Level Security |
| RTL | Right-to-left (text direction) |
| FK | Foreign Key |
| PK | Primary Key |
| ERD | Entity Relationship Diagram |
| JWT | JSON Web Token (used for Supabase auth tokens and anon key) |
| CRUD | Create / Read / Update / Delete |
