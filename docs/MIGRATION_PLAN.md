# Full Major Version Migration Plan

Baseline: state of `main` after the Safe-A audit (sveltekit-superforms pinned `<2.27`, Svelte 4.2.20, Tailwind 3, Zod 3, Vite 5, 104 `.svelte` files).

End state target:
- Svelte **5** (runes mode, legacy compat allowed where safe)
- SvelteKit **2.58+** (already current)
- Vite **7** + Vitest **4**
- Tailwind **4** (CSS-first)
- Zod **4** + Superforms **2.30+** with `zod4` adapter
- TypeScript **6**, ESLint **10**, Node 20.19+
- All `bits-ui`, `cmdk-sv`, `formsnap`, `mode-watcher`, `svelte-sonner`, `svelte-chartjs`, `lucide-svelte` majors

Result: 0 production vulnerabilities, 0 outdated majors, modern tooling.

---

## Guiding principles

1. **One ecosystem at a time.** Never stack two framework-level majors in a single commit.
2. **Green-in, green-out.** Every phase must leave `npm run build` + `npm run test:run` passing before merging.
3. **Use official migration tools first.**
   - `npx sv migrate svelte-5`
   - `npx sv migrate svelte-4` (if rollback needed)
   - `npx @tailwindcss/upgrade`
   - Zod 4 codemod: `npx zod-v4-codemod` (community) or manual find/replace
4. **Prefer the legacy escape hatches** during migration: `<svelte:options runes={false} />` on pages that aren't converted yet; Tailwind 4's `@config` directive for the old `tailwind.config.ts`.
5. **Ship behind a branch.** A long-lived `migration/svelte5` branch rebased onto `main` weekly. Each phase is a separate PR into that branch.

---

## Dependency graph (what blocks what)

```
Node 20.19+
    └─ Vite 7 ─┬─ Vitest 4
               ├─ @sveltejs/vite-plugin-svelte 6
               │    └─ Svelte 5 ──┬─ bits-ui 2
               │                  ├─ cmdk-sv latest (Svelte 5 fork: cmdk-sv-5 or switch)
               │                  ├─ formsnap 2
               │                  ├─ mode-watcher 1
               │                  ├─ svelte-sonner 1
               │                  ├─ svelte-chartjs 4
               │                  ├─ svelte-check 4
               │                  └─ lucide-svelte 1
               └─ Tailwind 4 ─────┬─ tailwind-variants 3
                                  ├─ prettier-plugin-tailwindcss 0.6+
                                  └─ (autoprefixer removed — built in)

Zod 4 ── Superforms 2.30 (zod4 adapter) — independent of Svelte
TypeScript 6 — independent, do last
ESLint 10 — independent, do last
```

Critical path = **Vite 7 → Svelte 5 → bits-ui 2**. Everything else parallelizes.

---

## Phase 0 — Pre-flight (0.5 day)

- [ ] Confirm Node version: `node -v` ≥ 20.19.0 (Vite 7 requirement). Upgrade `.nvmrc`/`package.json` engines if needed.
- [ ] Fix the 9 pre-existing `svelte-check` errors so the baseline is actually green:
  - Null-narrowing in [src/components/averageChart.svelte](src/components/averageChart.svelte) and [src/components/specPerformanceChart.svelte](src/components/specPerformanceChart.svelte) — add `if (value == null) return ''` guards.
  - The `ZodObjectType` / "excessively deep" errors in [src/components/apiForm.svelte](src/components/apiForm.svelte) and [src/routes/rating-calculator/+page.server.ts](src/routes/rating-calculator/+page.server.ts) — these vanish in Phase 4 (Zod 4 + zod4 adapter). Until then, cast to `any` at the call site or silence with `// @ts-expect-error` so CI can pass.
- [ ] Tag baseline: `git tag pre-migration-baseline`.
- [ ] Create branch `migration/epic`.
- [ ] Enable CI: `build` + `test:run` + `check` on every PR.
- [ ] Baseline bundle size measurement (`du -sh .svelte-kit/output`) for regression tracking.

**Exit gate:** green CI on baseline branch.

---

## Phase 1 — Vite 7 + Vitest 4 (1 day)

Low risk, unlocks Svelte 5 tooling.

### Steps
1. `npm i -D vite@^7 vitest@^4 @vitest/ui@^4 @vitest/coverage-v8@^4`
2. Update [vitest.config.ts](vitest.config.ts):
   - `reporters: ['verbose', 'html', 'json']` — keep, format unchanged in v4.
   - Remove the `pool: 'threads'` block (new default). Keep only if needed for isolation.
3. Update [vite.config.ts](vite.config.ts) for any deprecated option names.
4. Run `npm run build`, `npm run test:run`.

### Expected issues
- Vite 7 drops Node < 20.19 and requires `esbuild` ≥ 0.21 — `npm install` handles it.
- `sveltekit()` from `@sveltejs/kit/vite` already speaks Vite 7 on SvelteKit 2.58.
- `@sveltejs/vite-plugin-svelte` 3 may emit peer-dep warnings — will be resolved in Phase 2.

### Rollback
`git revert` the phase commit. No runtime changes.

---

## Phase 2 — Svelte 5 (core rewrite, 3–5 days)

The big one. 104 `.svelte` files; most will compile unchanged in legacy mode.

### Strategy
Svelte 5 is **mostly backwards compatible** for Svelte 4 syntax — `export let`, `$:`, stores, slots all still work in "legacy mode". You do **not** have to rewrite everything to runes at once. The plan:

**Step A — Mechanical compiler bump.** Get the app compiling on Svelte 5 with zero syntax changes.
**Step B — Fix what actually broke.** Stricter prop typing, removed APIs, store-subscription semantics.
**Step C — Opt individual components into runes.** Only where it simplifies or is required by peer libs.

### Steps

1. Install:
   ```
   npm i -D svelte@^5 @sveltejs/vite-plugin-svelte@^6 svelte-check@^4
   ```
2. Run the official migration:
   ```
   npx sv migrate svelte-5
   ```
   The codemod:
   - Wraps incompatible components in legacy mode automatically.
   - Updates `vitePreprocess` import path.
   - Rewrites `createEventDispatcher`, slot usage, etc. where it can safely.
3. First pass `npm run check` — expect **many** type errors. Sort by file and triage.
4. Known hotspots in this codebase:
   - [src/routes/+layout.svelte](src/routes/+layout.svelte) — `<slot />` still works, but check `$$props`, `$$restProps` usage.
   - All 60+ files in [src/lib/components/ui/](src/lib/components/ui/) — shadcn-style shells. Most will need `bits-ui` v2 API (Phase 3), not Svelte 5 changes. Leave on legacy for now.
   - [src/components/apiForm.svelte](src/components/apiForm.svelte), form components — formsnap 1 is Svelte 4 only; stays broken until Phase 3.
   - Chart components — `svelte-chartjs` needs v4 (Phase 3).
5. For every `.svelte` file that fails to compile but uses **no** runes, add `<svelte:options legacy={true} />` (rare) or let automatic detection handle it.
6. Fix `$app/stores` deprecation: new is `$app/state` with `page`/`navigating` as reactive objects. For now keep `$app/stores` (still works in Svelte 5) — migrate in a follow-up.
7. Update [src/test-setup.ts](src/test-setup.ts) — the `$app/stores` mock stays compatible.
8. Re-run `npm run build`, `npm run test:run`. **Vitest test files need @testing-library/svelte@^5.2+ already installed — confirm it supports Svelte 5 (it does, via `svelte5` export).**

### Risks
- **bits-ui 0.22 is incompatible with Svelte 5.** This is a hard blocker — must upgrade bits-ui in the same PR chain (Phase 3).
  - Workaround during Phase 2: pin `svelte` to `^5.0.0` but also bump `bits-ui` to `^2` in a single commit so peer deps resolve.
- **cmdk-sv 0.0.18 is dead upstream.** Options (pick one in Phase 3):
  - (a) Switch to `bits-ui`'s built-in `Command` primitive (bits-ui 2 has one).
  - (b) Use `@melt-ui/svelte` directly.
  - (c) Fork/vendored copy.
  Recommended: **(a)** — one less dep.
- **formsnap 1 breaks.** Bump to 2 in same PR chain (Phase 3).
- Two-way binding on component props now requires `bind:` + `$bindable()` in runes mode. Non-issue if you don't convert to runes.

### Exit gate
- `npm run build` green.
- `npm run test:run` green (expect to rewrite 1–2 tests for Svelte 5 mount semantics).
- App renders in dev; navigate every route manually once.

---

## Phase 3 — UI library cascade (2–3 days)

Lockstep with Phase 2 — may need to merge Phase 2+3 as one PR because of peer-dep constraints.

### Sub-steps

**3a. bits-ui 0.22 → 2.x** (largest churn)
- API completely redesigned in 1.x (slot props → snippets, renamed components).
- Affects every file under [src/lib/components/ui/](src/lib/components/ui/).
- Strategy: generate fresh shadcn-svelte components for Svelte 5 + bits-ui 2 via:
  ```
  npx shadcn-svelte@latest init
  npx shadcn-svelte@latest add button card dialog dropdown-menu form input label popover select separator slider tabs checkbox radio-group table accordion badge command
  ```
  Then port custom tweaks from the old files.
- Diff your custom styling/variants manually before overwriting.

**3b. cmdk-sv → bits-ui Command**
- Replace imports in [src/components/dungeonCombobox.svelte](src/components/dungeonCombobox.svelte), [src/components/realmCombobox .svelte](src/components/realmCombobox%20.svelte) (note typo-space in filename — consider renaming).
- Update [src/lib/components/ui/command/*](src/lib/components/ui/command/) to bits-ui Command.

**3c. formsnap 1 → 2**
- New API uses snippets. Update [src/lib/components/ui/form/*](src/lib/components/ui/form/) and [src/components/apiForm.svelte](src/components/apiForm.svelte).

**3d. Drop-in bumps** (usually one-liners):
- `svelte-sonner` 0.3 → 1.x
- `mode-watcher` 0.2 → 1.x
- `svelte-chartjs` 3 → 4 — affects [src/components/averageChart.svelte](src/components/averageChart.svelte), [src/components/bossPreviewChart.svelte](src/components/bossPreviewChart.svelte), [src/components/damageChart.svelte](src/components/damageChart.svelte), [src/components/specPerformanceChart.svelte](src/components/specPerformanceChart.svelte).
- `lucide-svelte` 0.469 → 1.x — icons mostly compatible; check for renamed icons.
- `tailwind-merge` 2 → 3 — used by `cn()` in [src/lib/utils.js.ts](src/lib/utils.js.ts) (rename this file to `utils.ts`, by the way).
- `tailwind-variants` 0.2 → 3 — variant component shells.

### Exit gate
- Manual QA of every route.
- `dungeonCombobox.test.ts` and `contentShowcase.test.ts` pass.
- Visual regression acceptable.

---

## Phase 4 — Zod 4 + Superforms 2.30 (0.5 day)

Now Superforms can be unpinned.

### Steps
1. Remove the `<2.27.0` pin:
   ```json
   "sveltekit-superforms": "^2.30.0",
   "zod": "^4.3.0"
   ```
2. Switch adapter import in [src/routes/rating-calculator/+page.server.ts](src/routes/rating-calculator/+page.server.ts) and [src/components/apiForm.svelte](src/components/apiForm.svelte):
   ```ts
   // before
   import { zod, zodClient } from 'sveltekit-superforms/adapters';
   // after
   import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
   ```
3. Update all schemas (search `z\.` across [src/](src/)):
   - `z.string().email()` → `z.email()` (hoisted top-level)
   - `z.string().url()` → `z.url()`
   - `.nullish()`, `.default()` semantics slightly tightened — check defaults.
   - `errorMap` → `error` option shape change.
4. The "excessively deep" type errors and `ZodObjectType` errors from Phase 0 disappear automatically.
5. Run `npm run check`, `npm run test:run`.

### Rollback
If a schema change causes runtime regressions, keep Zod 3 + Superforms <2.27 and defer — not a blocker for the rest.

---

## Phase 5 — Tailwind 4 (1 day)

Independent of Svelte; can actually be done in parallel with Phase 2 on a separate branch.

### Steps
1. Run the official upgrade:
   ```
   npx @tailwindcss/upgrade@next
   ```
   This:
   - Migrates [tailwind.config.ts](tailwind.config.ts) to the new CSS-first format.
   - Rewrites `@tailwind base/components/utilities` → `@import "tailwindcss"` in [src/app.pcss](src/app.pcss).
   - Renames deprecated utilities (`shadow-sm` → `shadow-xs`, `blur-sm` → `blur-xs`, etc.).
2. Replace the build pipeline — Tailwind 4 ships a first-party Vite plugin:
   ```
   npm i -D @tailwindcss/vite@^4
   npm rm tailwindcss postcss autoprefixer
   ```
   Delete [postcss.config.cjs](postcss.config.cjs) (no longer needed — Tailwind 4 handles nesting + autoprefix natively).
3. Update [vite.config.ts](vite.config.ts):
   ```ts
   import tailwindcss from '@tailwindcss/vite';
   export default defineConfig({ plugins: [tailwindcss(), sveltekit()] });
   ```
4. `tailwind-variants` 3 + `prettier-plugin-tailwindcss` latest.
5. Move any `theme.extend` colors from the old config into `@theme { ... }` in [src/app.pcss](src/app.pcss) (the upgrade tool mostly does this).
6. Dark mode: `darkMode: 'class'` → `@custom-variant dark (&:is(.dark *))` in CSS.

### Risks
- Custom plugins (none currently in this project — easy).
- Third-party libs shipping Tailwind 3 class names in their docs — shouldn't matter, all classes still work.
- `bg-opacity-*` and similar deprecated utilities: migration tool rewrites to slash notation.

### Exit gate
- Visual diff each page. Check dark mode toggle via `mode-watcher`.

---

## Phase 6 — Long tail (0.5 day)

All independent, all low risk.

- [ ] **TypeScript 6:** `npm i -D typescript@^6`. Run `npm run check`. Expect a handful of stricter inference errors in generics.
- [ ] **ESLint 10:** `npm i -D eslint@^10 eslint-plugin-svelte@^3 eslint-config-prettier@latest`. Delete [.eslintrc.cjs](.eslintrc.cjs), create `eslint.config.js` (flat config is required in 10):
  ```js
  import js from '@eslint/js';
  import svelte from 'eslint-plugin-svelte';
  import prettier from 'eslint-config-prettier';
  export default [js.configs.recommended, ...svelte.configs['flat/recommended'], prettier];
  ```
- [ ] **jsdom 26 → 29** (test env) — drop-in.
- [ ] **@sveltejs/adapter-auto 3 → 7** — drop-in. (Unused for production since you use `adapter-cloudflare`; can remove entirely.)
- [ ] **drizzle-orm 0.44 → 0.45** — check changelog; usually additive.
- [ ] **@auth/\*** — already at latest via `npm update`.
- [ ] Rename oddities: [src/components/realmCombobox .svelte](src/components/realmCombobox%20.svelte) (trailing space), [src/lib/utils.js.ts](src/lib/utils.js.ts) (`.js.ts` double extension).

---

## Phase 7 — Cleanup & consolidation (0.5 day)

- [ ] Run `npm audit` — expect **0** vulnerabilities.
- [ ] Run `npm outdated` — expect empty output.
- [ ] Bundle-size delta vs Phase 0 baseline. Svelte 5 typically shaves 20–40% off client JS; Tailwind 4 shaves CSS.
- [ ] Convert 3–5 flagship components to runes (`$state`, `$derived`, `$effect`) as a proof-of-concept — not required, but demonstrates the new mental model. Candidates: [src/components/header.svelte](src/components/header.svelte), [src/components/logBrowser.svelte](src/components/logBrowser.svelte).
- [ ] Delete the `<2.27.0` pin, any `// @ts-expect-error` suppressions from Phase 0.
- [ ] Update [README.md](README.md) with new Node version requirement + scripts.
- [ ] Merge `migration/epic` → `main`.
- [ ] Tag `post-migration-v1`.

---

## Timeline summary

| Phase | Content | Est. effort | Can parallelize? |
|---|---|---|---|
| 0 | Pre-flight + fix baseline | 0.5d | — |
| 1 | Vite 7 + Vitest 4 | 1d | No (foundation) |
| 2 | Svelte 5 compile | 3–5d | With 5 |
| 3 | bits-ui/cmdk/formsnap/etc. | 2–3d | With 2 (often merged) |
| 4 | Zod 4 + Superforms | 0.5d | After 3 |
| 5 | Tailwind 4 | 1d | With 2 (separate branch) |
| 6 | TS/ESLint/long tail | 0.5d | After all |
| 7 | Cleanup | 0.5d | — |

**Total: ~8–12 focused days** for a solo developer, compressed if you skip manual QA. Recommend spreading over 3 calendar weeks.

---

## Decision points

These need product-level choices before starting:

1. **Runes everywhere, or legacy forever?** Recommendation: legacy mode now, runes opportunistically. Full runes rewrite is not required and can be deferred indefinitely. 
Do full rune rewrite
2. **Replace `cmdk-sv` with bits-ui Command, or keep a fork?** Recommendation: bits-ui Command — one less abandoned dep.
replace with bits-ui Command
3. **Drop shadcn-svelte's generated components for a newer CLI regeneration, or patch in place?** Recommendation: regenerate with the latest CLI targeting Svelte 5, then apply your custom tweaks on top. Faster than manually patching 60+ files.
use latest shadcn-svelte CLI to regenerate components
4. **Keep `@sveltejs/adapter-auto`?** Recommendation: remove — unused, just noise.
If truly unused, remove adapter-auto
5. **Migration on `main` with feature flags, or long-lived branch?** Recommendation: long-lived `migration/epic` branch, rebased weekly, merged once stable.
Use Development Branch
---

## Abort criteria

Pull the plug and roll back to `pre-migration-baseline` if:
- Phase 2 reveals > 20 Svelte-5-incompatible third-party components (not currently the case).
- Phase 3 bits-ui rewrite exceeds 5 days — consider sticking with Svelte 5 legacy mode + bits-ui 0.22 forked, or freezing UI at bits-ui 0.22 behind Svelte 4 indefinitely.
- Production build size regresses by > 15% after Phase 3 (unlikely, usually improves).
