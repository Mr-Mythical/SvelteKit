# Mr. Mythical — SvelteKit

Mythic+ rating calculator and raid log analyzer for World of Warcraft.

## What's here

- **Rating calculator** (`/rating-calculator`) — score targeting, keystone breakdowns, character lookups.
- **Raid analytics** (`/raid`) — boss-by-boss log browsing, top-player leaderboards, healer-comp filtering, death hotspots, damage/healing/cast charts.
- **Account features** — Battle.net OAuth sign-in, recent characters/reports, persisted calculator state.

See `PRODUCT.md` for the product brief and `DESIGN.md` (and `DESIGN.json`) for the design system.

## Stack

- SvelteKit + Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`)
- TypeScript strict
- Drizzle ORM on Postgres (postgres-js)
- Auth.js with the Battle.net provider
- Cloudflare Pages / Workers via `wrangler`
- Vitest

## Two databases

The app talks to **two** Postgres databases:

| Database         | Purpose                                                | Env var              | Schema                  | Accessor                                  |
| ---------------- | ------------------------------------------------------ | -------------------- | ----------------------- | ----------------------------------------- |
| **Raid analytics** | Public spec/healer/composition aggregates, encounters | `DATABASE_URL`       | `src/lib/db/schema.ts`  | `getRaidDb()` from `$lib/db`              |
| **User**         | Auth.js accounts/sessions, recents, linked characters | `DATABASE_USER_URL` (falls back to `DATABASE_URL`) | `src/lib/db/userSchema.ts` | `getUserDb()` from `$lib/db/userDb`       |

Both go through the shared `createDrizzlePostgres` factory in `src/lib/db/connection.ts`. Drizzle config files are split: `drizzle.config.ts` (raid) and `drizzle.user.config.ts` (user). Migrations live in `drizzle/` and `drizzle/user/` respectively.

## Layout conventions

- **`src/routes/api/*`** — server endpoints. Per-fight WCL endpoints (`cast-events`, `damage-events`, `healing-events`, `boss-events`, `death-events`) all funnel through `handleWclFightRequest` in `$lib/server/wclGraphQL`. Aggregate / DB-backed endpoints use `handleApiError(scope, error, clientMessage, status?)` from `$lib/server/logger`.
- **`src/components/`** — app-specific feature components (`charts/`, `raid/`, `calculator/`, `layout/`, plus top-level pieces like `seo.svelte`).
- **`src/lib/components/ui/`** — generic shadcn-svelte primitives only. Keep these decoupled from app concerns.
- **`src/lib/db/`** — schemas, connection factory, shared data access.
- **`src/lib/data/`** — feature-scoped data access (e.g. `myWowRoster`).
- **`src/lib/server/`** — server-only helpers (logger, API responses, WCL client, score sources).
- **`src/lib/utils/clientLog.ts`** — client-side logging seam (`logClientError`, `notifyClientError`).

## Local dev

```bash
npm install
npm run dev          # start the dev server
npm run check        # svelte-check + tsc
npm run test         # vitest
npm run build        # production build
```

Set `DATABASE_URL`, `DATABASE_USER_URL`, `AUTH_BATTLENET_ID`, `AUTH_BATTLENET_SECRET`, and `AUTH_SECRET` in `.env` for local dev.

## Deployment

Deployed to Cloudflare Pages via `wrangler.toml`. Build output goes to `build/`.
