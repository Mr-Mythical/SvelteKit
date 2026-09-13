# `drizzle/` — migration artifacts

This directory contains **drizzle-kit output** and hand-written SQL, not the
TypeScript source of truth. Canonical schemas live in `src/lib/db/`.

## Unified database

Raid analytics and user/auth share one Postgres instance (`DATABASE_USER_URL`).

| Domain         | Schema (TypeScript)           | drizzle-kit config  | Migration output |
| -------------- | ----------------------------- | ------------------- | ---------------- |
| Unified (both) | `schema.ts` + `userSchema.ts` | `drizzle.config.ts` | `drizzle/user/`  |

Application code imports schemas only from `src/lib/db/`.

## What lives here

- `drizzle/user/` — active migration history for the unified DB (started as the
  user/auth track; raid aggregate tables were added in `0005_add_raid_analytics_tables.sql`).
- `drizzle/*.sql` + `drizzle/meta/` — **historical** raid-only migrations from
  before the merge. Do not apply these to the unified DB.
- `drizzle/migrations/` — hand-written one-offs executed by deploy scripts.

## What used to live here

`drizzle/schema.ts` and `drizzle/relations.ts` — stale `drizzle-kit pull`
introspection snapshots — were deleted because they confused readers about
which schema was canonical. If you need to re-introspect the live DB, run
`drizzle-kit pull` to a temp directory, diff against `src/lib/db/*.ts`,
then discard.
