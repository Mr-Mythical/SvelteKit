---
name: Mr. Mythical
description: Mythic+ and raid analysis toolkit for World of Warcraft players
colors:
  background: "#fefafa"
  foreground: "#0a0400"
  card: "#fbe7e7"
  popover: "#fefafa"
  primary: "#f2afbe"
  primary-foreground: "#0a0400"
  secondary: "#f6d8d8"
  secondary-foreground: "#0a0400"
  muted: "#d6cccc"
  muted-foreground: "#5c3d3d"
  accent: "#f3dccf"
  accent-foreground: "#0a0400"
  destructive: "#e48a8a"
  destructive-foreground: "#0a0400"
  border: "#f6d8d8"
  input: "#edb3b3"
  ring: "#985939"
  progress: "#aeeebf"
  link: "#a01231"
  mythic-crimson: "#86132a"
  tyrande-rose: "#ec7990"
typography:
  display:
    fontFamily: "'League Spartan', ui-sans-serif, system-ui, sans-serif"
    fontSize: "4.21rem"
    fontWeight: 700
    lineHeight: "1.05"
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'League Spartan', ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.158rem"
    fontWeight: 700
    lineHeight: "1.1"
  title:
    fontFamily: "'League Spartan', ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.369rem"
    fontWeight: 700
    lineHeight: "1.15"
  body:
    fontFamily: "'Roboto', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.6"
  label:
    fontFamily: "'Roboto', ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1.3"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-ghost:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "24px"
  badge:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
---

# Design System: Mr. Mythical

## 1. Overview

**Creative North Star: "The Raid Night Console"**

Mr. Mythical's visual system is the tool an experienced player opens at 2 AM between pulls. The screen is warm, not hostile. The typography is confident, not loud. Pink and crimson run through every surface because the game does — this is a World of Warcraft product and it owns that heritage without cosplaying the game's UI. League Spartan carries headings with geometric authority; Roboto carries body and data with neutral discipline. Together they produce a system that is *sharp, precise, competitive*, matching the brand personality in PRODUCT.md.

The system is Restrained in the product (calculator, log browser, profile) and earns Committed on the homepage, where the pink becomes the material, not the accent. Cards exist but aren't the first reach; borders and tonal layers do most of the work. Motion is reserved for state feedback — there are no orchestrated entrances, no scroll-linked sequences. The goal is *answer-first, always*: the UI gets out of the way and the data speaks.

Explicitly rejected: generic SaaS landings (hero-metric templates, gradient blobs, "AI-powered" vagueness), old-web WoW fansite aesthetics (cluttered tables, ad banners, dated gradients), RGB/cyberpunk tryhard gaming visuals, and flat gray-and-blue corporate dashboards.

**Key Characteristics:**
- Warm-neutral backgrounds tinted toward the brand hue, never pure white
- Soft rose primary that feels inviting without losing precision
- Type pairing of geometric display + humanist body, with an exaggerated 1.333 scale ratio
- Flat surfaces; depth comes from borders, tonal layers, and weight
- Full light/dark parity via `mode-watcher`; dark mode is a shift, not an afterthought

## 2. Colors: The Rose & Crimson Palette

The palette is a single warm hue family — roses, pinks, and crimsons with occasional earthy accents — run at full lightness range for light mode and mirrored at low lightness for dark. Chroma stays mid-range; no garish high-chroma primaries at any extreme.

### Primary
- **Tyrande Rose** (`#f2afbe`, `hsl(348 75% 81%)`): The product's signature color. Primary buttons, selected states, active filters, brand hover underlines. In the homepage's Committed register, this carries 30–60% of the surface. In the product's Restrained register, it's reserved for the single most important action per view.
- **Mythic Crimson** (`#86132a`): The deep brand anchor. Used sparingly on brand marks, long-form emphasis, homepage callouts. Pairs with Tyrande Rose as a gradient range (`--color-grad` / `--color-gradinverse`) — never used as gradient *text*.

### Neutral
- **Rose Parchment** (`#fefafa`, `hsl(0 60% 99%)`): The base background in light mode. Near-white, tinted toward the brand hue so it never reads as clinical.
- **Ink Umber** (`#0a0400`, `hsl(24 100% 2%)`): The base foreground in light mode. Near-black with a faint warm cast; pairs with Rose Parchment for body text and headings. Never `#000`.
- **Petal Card** (`#fbe7e7`, `hsl(0 60% 95%)`): Card and elevated surface color in light mode. A single tonal step above the background; no shadow needed to feel distinct.
- **Ash Rose** (`#d6cccc`, `hsl(0 20% 80%)`): Muted text, helper copy, inactive labels.
- **Clay Rose** (`#5c3d3d`, `hsl(0 20% 30%)`): Muted foreground; used for secondary prose in light mode.

### Semantic
- **Ember Ring** (`#985939`, `hsl(19 49% 40%)`): Focus ring. The warm earthy tone keeps focus legible without introducing a foreign blue.
- **Link Crimson** (`#a01231`, `hsl(348 80% 35%)`): In-prose links. Darker sibling of Tyrande Rose; always underlined.
- **Soft Destructive** (`#e48a8a`, `hsl(0 62% 70%)`): Destructive actions. Muted red — never a blaring alert red.
- **Jade Progress** (`#aeeebf`, `hsl(126 75% 81%)`): Progress indicators. The one non-rose hue in the system, reserved for success and progress states so it reads as meaningful difference.

### Dark Mode
Every color above has a dark-mode counterpart that mirrors the relationship, not the hue. Background drops to `hsl(0 60% 1%)`, foreground rises to `hsl(24 100% 98%)`, primary darkens to `hsl(348 75% 19%)` (a deep wine rather than a bright rose). Ember Ring shifts lighter to `hsl(19 49% 60%)`. The product feels the same in either mode because the hue relationships are preserved.

### Named Rules
**The One Hue Rule.** Every neutral is tinted toward the brand hue (rose/crimson family). There is no pure `#000`, `#fff`, or neutral gray anywhere in this system. Neutrals that "look gray" are cheating — they read wrong next to the pink accents.

**The Pink Is The Point Rule.** Tyrande Rose is not a shy accent. On the homepage it carries the surface. In the product it claims primary actions unapologetically. Ghost buttons and outlines exist, but they earn their use; the default answer for "make this important" is pink.

## 3. Typography

**Display Font:** League Spartan (ui-sans-serif fallback)
**Body Font:** Roboto (ui-sans-serif fallback)
**Label/Mono Font:** Roboto, same family as body

**Character:** League Spartan brings geometric, nearly-condensed authority to every heading — wide tracking at display sizes, confident uppercase-friendly letterforms. Roboto holds the body, data, and labels in a humanist neutral that never competes with the display face. Two families, cleanly divided by role.

### Hierarchy
The scale ratio is `1.333` (a perfect fourth) between steps, which is wider than the typical 1.125–1.2 product-register default. This is intentional: headings on the homepage need to feel *editorial*, and the product's tool surfaces need enough contrast between table headers and cell text that data skims fast.

- **Display** (League Spartan, 700, 4.21rem / ~67px, line-height 1.05): Homepage hero, rare brand moments. Do not use inside product surfaces.
- **Headline** (League Spartan, 700, 3.158rem / ~51px, line-height 1.1): Section-opener headings on marketing surfaces, `/about` page leads.
- **Title** (League Spartan, 700, 2.369rem / ~38px, line-height 1.15): Page-level titles in the product, card titles on the homepage.
- **Sub-title** (League Spartan, 700, 1.777rem, line-height 1.2): Secondary headings within a product view.
- **Body** (Roboto, 400, 1rem / 16px, line-height 1.6): All paragraph copy. Cap line length at 65–75ch.
- **Label** (Roboto, 400, 0.75rem / 12px, line-height 1.3): Form labels, table column headers, helper text, badge copy.

### Named Rules
**The Two Families Rule.** League Spartan is headings, Roboto is everything else. Never a display face in buttons, form labels, or data tables. Never a body face in marketing headlines.

**The Wide-Tracked Headline Rule.** Display and Headline levels get a `letter-spacing: -0.02em` correction to counteract League Spartan's natural looseness at large sizes. Body and label sizes keep default tracking.

## 4. Elevation

**This system is flat by default.** Surfaces sit at rest on a single plane. Depth is conveyed through tonal layering (card background is one lightness step off the page background), full-perimeter borders (`1px hsl(var(--border))`), and typographic weight — not shadow.

Shadows appear only in two places: (a) popover, dropdown-menu, and dialog components at runtime, inherited from bits-ui / shadcn defaults (`0 10px 15px -3px rgba(0 0 0 / 0.1)` or similar); (b) the existing `shadow-md` used on some homepage cards, which is legacy and should be retired during any `$impeccable polish` pass in favor of the tonal card background alone.

Do not introduce new shadow vocabulary on hover, focus, or elevation. The mental model is: *surfaces do not float*. Interactive states are expressed via background shift and ring, not lift.

### Named Rules
**The Flat-By-Default Rule.** Cards, panels, and navigation sit flat. If a surface needs to feel distinct, use tonal separation (`--color-card`) or a border, not a shadow. Overlays (popover, dialog) are the only permitted exception because they genuinely lift off the document.

**The No-Drop-Shadow-On-Buttons Rule.** Buttons are flat. The active-state `translate-y-px` in the shadcn button variants is the only "motion-like" depth the button gets.

## 5. Components

The component vocabulary comes from shadcn-svelte built on bits-ui 2, customized with the rose palette and League Spartan / Roboto pairing. Every interactive component ships the full state grid: default, hover, focus-visible, active, disabled, aria-invalid. Component feel: *precise and restrained, just pinked*.

### Buttons
- **Shape:** `rounded-lg` (8px). Consistent across all sizes; no pills, no square buttons.
- **Sizes:** `xs` (24px), `sm` (28px), `default` (32px), `lg` (36px). Icon variants exist at matching sizes. Padding is tight — `px-2.5` default, a deliberate product-register density.
- **Primary:** Tyrande Rose background, Ink Umber foreground. Hover (on anchor-styled buttons) drops to 80% opacity; the button shifts color by state, not lift.
- **Outline / Secondary / Ghost / Destructive / Link:** All present, all follow the shadcn variant system in [button.svelte](src/lib/components/ui/button/button.svelte). Destructive uses `destructive/10` background with `destructive` foreground rather than a saturated red fill, keeping alarm proportional to task.
- **Focus-visible:** `ring-3` in `--ring` color (Ember Ring). Border shifts to `--ring` as well. Never a default blue browser outline.
- **Active:** `translate-y-px` for buttons without popup semantics. That is the sum total of motion.

### Inputs / Fields
- **Style:** 1px border in `--border`, background `--background`, radius `rounded-md` (6px). Height 36px default.
- **Focus:** border shifts to `--ring` plus a 3px semi-transparent ring. No glow, no inner shadow.
- **aria-invalid:** destructive-tinted ring, no red fill. Never flash-red.
- **Disabled:** 50% opacity, pointer-events off.

### Cards / Containers
- **Corner Style:** `rounded-lg` (8px).
- **Background:** Petal Card (`--card`).
- **Shadow Strategy:** Flat. See Elevation.
- **Border:** none at rest; consider a 1px `--border` if the card sits on a same-tone surface.
- **Internal Padding:** 24px (`lg` spacing step) for content cards, 16px for compact variants.

### Badges
- **Style:** Secondary background (`--secondary`), foreground `--secondary-foreground`, radius `rounded-md`, 2px × 8px padding, label-size type.
- **Usage:** Tags, filters, status markers. Never as buttons.

### Navigation (Header)
- **Style:** Full-width top bar. Logo left, primary links right, theme toggle + auth on the end.
- **Typography:** Roboto, label size, weight 400 default / 700 on active route.
- **Active state:** Link Crimson underline in light mode, lighter crimson in dark.
- **Mobile:** Collapses to a hamburger trigger opening a sheet; links stack at body size.

### Charts (Signature)
The raid visualization charts are a signature component. They use `chart.js` via `svelte-chartjs`, configured with a custom palette sourced from the same rose/crimson family (not defaults). Axis labels and legends use Roboto at label size. Grid lines use `--border`. No 3D, no gradients, no animated drawing on first render.

## 6. Do's and Don'ts

### Do:
- **Do** use Tyrande Rose for the primary action on every screen, and only the primary action. Restrained mode is the product default.
- **Do** write marketing headings in League Spartan; write labels, body, table cells in Roboto. Two families, clean split.
- **Do** tint every neutral toward the rose/crimson hue. Backgrounds, borders, and muted text all carry a hint of warmth.
- **Do** rely on tonal separation and borders for depth. Flat is the default.
- **Do** use `--progress` (Jade Progress) for success and progress states only. Its difference from the rose family is the signal.
- **Do** preserve light/dark parity. The product feels the same in either mode.
- **Do** honor `prefers-reduced-motion` on every animated transition.
- **Do** keep the focus ring warm (Ember Ring). Blue focus rings are foreign to this system.

### Don't:
- **Don't** use `#000` or `#fff` anywhere. Every neutral is tinted.
- **Don't** use gradient text (`background-clip: text`). This is an absolute ban. The `--color-grad` / `--color-gradinverse` tokens exist for backgrounds only.
- **Don't** use side-stripe borders (`border-left` greater than 1px as a colored accent). Anywhere. Ever. Use a full 1px border or a tonal background instead.
- **Don't** add drop shadows to cards or buttons. Overlays are the only exception.
- **Don't** build the identical card-grid pattern (same-sized cards, icon + heading + text, repeated). Quoting PRODUCT.md: this is a banned anti-reference.
- **Don't** ship hero-metric templates (big number, small label, gradient accent). Another PRODUCT.md anti-reference.
- **Don't** use glassmorphism decoratively. Blurs must be purposeful, never default.
- **Don't** use League Spartan inside buttons, form labels, tables, or body text.
- **Don't** use modals as a first thought. Prefer inline or progressive disclosure.
- **Don't** evoke old-web WoW fansite aesthetics (ad banners, six-color text, cluttered tables, 2008-era gradients). The brand is game-literate, not game-pastiche.
- **Don't** evoke RGB / cyberpunk / tryhard gaming visuals (neon edges, glitch effects, angular clip-paths). The brand is a tool, not a rig.
- **Don't** use em dashes in copy. Use commas, periods, or parentheses.
- **Don't** add orchestrated page-load animations. Users are entering a tool, not watching a reveal.

## 7. Error Handling Conventions

A single, consistent error policy across server, DB, and util layers. Pick the
convention based on the layer you're in — don't mix strategies for similar
operations.

### Server-side API handlers (`src/routes/api/**`)

- **Response shape:** Use `apiError(message, status)` and `apiOk(body, status?)`
  from `src/lib/server/apiResponses.ts`. Errors are always `{ error: string }`.
- **Top-level catch:** Use `handleApiError(scope, error, clientMessage?)` from
  `src/lib/server/logger.ts`. It logs the original error server-side (with full
  stack via the underlying object) and returns a sanitized 500. Never let an
  error bubble out of a handler unlogged or unsanitized.
- **Authentication:** Use `requireSession(locals)` and short-circuit with the
  returned `401` response. Never check `locals.auth()` ad-hoc.
- **WCL GraphQL:** Use `executeWclQuery<T>` from `src/lib/server/wclGraphQL.ts`
  and catch `WclQueryError` separately to distinguish `kind:'graphql'` vs
  transport. Don't hand-roll `body.errors` checks.

### Database layer (`src/lib/db/**`)

- **Standard:** Wrap every query in `dbOperation(label, fn)` from
  `_helpers.ts`. It logs once on failure (with the operation label) and
  rethrows so callers can decide policy.
- **No-rows-but-success:** Return an empty domain value (`null`, `[]`, etc.)
  from inside the `dbOperation` closure — empties are reserved for "query
  succeeded, no rows", never for "query failed". Failures throw.
- **Anti-pattern:** Don't catch and return `null`/`[]` to mask failures. The
  caller can't distinguish "no data" from "DB down" and the server logs lose
  context.

### Logging

- **One helper:** `logServerError(scope, message, error)` and
  `logServerWarn(scope, message, detail?)` from `src/lib/server/logger.ts`.
- **Scope tag format:** `'<layer>/<name>'` — e.g. `'api/damage-average'`,
  `'db/users'`, `'auth/jwt'`. This makes log filtering trivial.
- **Don't:** Use raw `console.error`/`console.warn` in server code, prefix log
  lines manually, or dump synthetic `{name, message, stack}` shapes — the
  helpers preserve the original error object for log aggregators.

### Client-side (`src/components/**`, `src/lib/utils/**`)

- **User feedback:** Use `notifyClientError(message)` (toast + console) from
  `src/lib/utils/clientLog.ts`. Never silently swallow.
- **Util return shape:** Framework-agnostic utilities (e.g. `fetchRuns`,
  `fetchWowSummary`) return discriminated unions
  (`{kind:'ok'|'empty'|'error', ...}`) so callers handle each branch
  explicitly. Don't throw across the util boundary; don't return `null` to
  mean both "empty" and "failed".

### Throw vs return: rule of thumb

- **Throw** when the operation is a contract violation (DB down, malformed
  WCL response, missing required env var). Let `handleApiError` map it.
- **Return discriminated union** when the caller needs to render a
  domain-specific empty state vs error state (util layer for forms/charts).
- **Return empty value** only for documented "no rows, success" semantics
  inside `dbOperation`.

## 8. API Endpoint Naming

Routes under `src/routes/api/**` follow three documented patterns. Match the
existing pattern your endpoint fits — don't invent a fourth.

### The patterns

1. **Resource (`<noun>` or `<modifier>-<noun>`)** — the default. The endpoint
   represents a thing or a query over a thing. Use kebab-case, plural where the
   response is a list.
   - Examples: `recent-characters`, `recent-reports`, `top-players`,
     `spec-statistics`, `player-details`, `character-score`, `damage-average`,
     `death-hotspots`, `current-state`, `boss-events`, `cast-events`,
     `damage-events`, `death-events`, `healing-events`, `fights`.

2. **Provider passthrough (`<provider>`)** — a thin proxy/cache in front of an
   external API where the route name *is* the provider's name. Used only when
   the response shape mirrors the upstream and there's no domain transform.
   - Examples: `blizzard`, `raiderio`.

3. **RPC (`<verb>-<noun>`)** — reserved for action-shaped endpoints that
   compute or trigger something (not a CRUD-style read). Used sparingly.
   - Examples: `calculate-runs` (computes a key plan from a target score),
     `browse-logs` (paginated WCL search bridge with side-effectful caching).

### Rules

- **Default to pattern 1.** Reach for RPC only when "GET this thing" doesn't
  fit (the endpoint is doing work, not returning a resource).
- **kebab-case** always; never camelCase or snake_case in URL segments.
- **No trailing slashes**, no version prefix (`/v1/`) — versioning is
  unnecessary for an internal/site API; if a breaking change is needed,
  introduce a sibling endpoint with a new name.
- **Public endpoints are stable.** `/api/calculate-runs` is documented for
  external integrations on the rating-calculator page; renaming requires a
  redirect and a deprecation note.
- **Errors and successes** follow §7 (`apiError` / `apiOk`); naming doesn't
  affect response shape.

## 9. Library Layout (`src/lib/**`)

Code under `src/lib/` is grouped by **what it does**, not by "is it a util".
The `utils/` folder used to be a catch-all and was split into domain-focused
modules. The current map:

| Folder                | What lives there                                                              |
| --------------------- | ----------------------------------------------------------------------------- |
| `src/lib/auth/`       | OAuth client-credentials flows and token caches (Blizzard + WCL).             |
| `src/lib/calculations/` | Pure domain math (e.g. Mythic+ keystone scoring formula).                   |
| `src/lib/components/` | Reusable Svelte UI primitives (shadcn-svelte exports).                        |
| `src/lib/data/`       | External-API fetchers and DTO shaping (Warcraft Logs, Blizzard character).    |
| `src/lib/db/`         | Drizzle schemas, query helpers, and connection factories.                     |
| `src/lib/hooks/`      | Reusable Svelte runes / actions.                                              |
| `src/lib/server/`     | Server-only helpers (`apiResponses`, `logger`, `wclGraphQL`, `requireSession`, `scoreSources`). |
| `src/lib/stores/`     | Svelte writable stores and their persistence backends (recents).              |
| `src/lib/types/`      | Shared TypeScript types and JSON-backed reference data (realms, dungeons).    |
| `src/lib/ui/`         | Browser-only UI helpers: chart plugins, tooltip wiring, ability metadata, class colors. |
| `src/lib/utils/`      | Cross-cutting helpers that don't belong to any single domain (currently just `clientLog`). |

### Rules

- **`utils/` is a last resort.** If a new helper has a real domain, put it
  with that domain. Only `utils/` for genuinely cross-cutting helpers (a
  toast/log shim used by every layer).
- **`server/` is for server-only code.** Anything imported from the browser
  must live elsewhere (or be carved out into a client-safe sibling).
- **Imports use `$lib/...` aliases**, never deep relative paths between
  these folders.

