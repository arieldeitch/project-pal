# CONFLICT RESOLUTION LOG
> Updated: 2026-06-15
> Resolution authority: User's explicit override message

---

## Resolved Conflicts

| ID | Conflict | Older Document | New Authority | Resolution |
|---|---|---|---|---|
| CR-01 | Data hierarchy | Knowledge/ files: `Project → Daily Logs` | User override: `Site → Project → Task` | **Site → Project → Task is the current MVP model.** Daily Logs infrastructure is kept as legacy/supplemental module. |
| CR-02 | Authentication | Knowledge/: Excluded from MVP | User override: MVP includes Supabase Email+Password | **Auth IS in MVP scope. Implementing now.** |
| CR-03 | Task entity | Knowledge/: Not documented | User override: Task entity is MVP | **Task entity added to data model.** |
| CR-04 | Site entity | Knowledge/: Not documented | User override: Site entity is MVP | **Site entity added as top-level container.** |

---

## Implementation Decision

All new code targets the authoritative MVP definition:

```
Site (Asset)
  └─ Project
       └─ Task
            └─ Task Updates (employee progress reports)
```

Authentication: Supabase Email + Password. Permissive RLS (Phase 3 level): any authenticated user can read/write all data.

## Legacy Modules Status

The following modules from older architecture are retained (not removed):
- Daily Logs — valid supplemental module; kept as-is
- Issues — kept as-is  
- Blockers — kept as-is
- Decisions — kept as-is
- Reports — kept as-is

These are not the MVP priority. MVP priority is Site / Project / Task / Auth.
