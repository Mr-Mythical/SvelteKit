# `drizzle/` — generated migration artifacts

This directory contains **drizzle-kit output only**, not source of truth.

## Canonical schema locations

| Database         | Schema (TypeScript)            | drizzle-kit config       | Migration output  |
| ---------------- | ------------------------------ | ------------------------ | ----------------- |
| Raid analytics   | `src/lib/db/schema.ts`         | `drizzle.config.ts`      | `drizzle/*.sql`   |
| User / auth      | `src/lib/db/userSchema.ts`     | `drizzle.user.config.ts` | `drizzle/user/`   |

Application code imports schemas only from `src/lib/db/`. Nothing outside
this folder should import from `drizzle/`.

## What lives here

- `drizzle/*.sql` and `drizzle/meta/` — generated migrations for the raid DB.
- `drizzle/user/` — generated migrations for the user DB.
- `drizzle/migrations/` — hand-written migrations executed by deploy scripts.

## What used to live here

`drizzle/schema.ts` and `drizzle/relations.ts` — stale `drizzle-kit pull`
introspection snapshots — were deleted because they confused readers about
which schema was canonical. If you need to re-introspect the live DB, run
`drizzle-kit pull` to a temp directory, diff against `src/lib/db/schema.ts`,
then discard.
