# Product

## Register

product

## Users

Mid-tier World of Warcraft Mythic+ players running keys in roughly the +10 to +15 range. They arrive with a concrete question — _"what keystones do I need to hit X score?"_ or _"where did our pull go wrong on boss Y?"_ — and they want the answer now, between dungeon runs or while their raid waits. Secondary audiences: high-key pushers who grade tools on data density, and raid leaders reviewing encounters post-pull. Usage context is split between a second monitor during gameplay and a phone mid-queue.

## Product Purpose

Mr. Mythical turns raw Warcraft data (scores, logs, keystone math, encounter telemetry) into fast, decisive answers. The site is a toolkit, not a magazine: a Mythic+ score calculator, a raid log browser, a character profile, and encounter visualizations. Success is a user reaching their answer in under a minute, trusting it, and coming back next week. Everything else — the landing page, the about page — exists to route players into the tools and out again.

## Brand Personality

Sharp, precise, competitive. Tone is that of a veteran teammate in voice chat at 2 AM: confident, concise, no filler. Numbers are the hero; prose is scaffolding. The brand acknowledges this is WoW (pink/crimson palette, League Spartan display face) without LARPing the game's UI. Emotional goal: the user feels _capable_, not _sold to_.

## Anti-references

- **Generic SaaS landings.** Hero metric template, gradient blob backgrounds, three-up feature grids with lucide icons — explicitly banned. This is a tool, not a series B fundraise.
- **Old-web WoW fansites.** Cluttered tables, ad banners, six-color text, 2008-era gradients. Honor the domain, modernize the craft.
- **RGB / cyberpunk / tryhard gaming.** Neon edges, glitch effects, angular clip-paths, "game UI" pastiche.
- **Corporate analytics dashboards.** Flat gray-and-blue, dead typography, rectangles on rectangles.

**Positive references:** Linear — dense, confident, restrained; use it as the rhythm model. Everything else should feel _game-literate_ but _tool-disciplined_.

## Design Principles

1. **Answer-first, always.** Every surface resolves the user's goal in one screen. The calculator shows the score plan above the fold. The raid browser shows results, not a tutorial. If the user has to scroll to get the answer, the layout is wrong.
2. **Data earns its pixels.** Every number on screen must influence a decision. Decorative stats, fake progress bars, and sentimental visualizations are cut. When in doubt, delete it.
3. **Competitive, not combative.** Sharp edges (tight metrics, precise alignment, confident weight) without hostile styling. No angry red, no barked CTAs, no gamified streak-shaming. The pink/crimson palette stays warm.
4. **Game-literate, tool-disciplined.** Fluent in WoW conventions (boss names, spec abbreviations, keystone math) without mimicking the in-game UI. Typography and rhythm come from the tool world (Linear, Raycast), vocabulary comes from the game world.
5. **Honest performance.** Pages load instantly and interactions feel mechanical. A calculator that stutters is a calculator nobody trusts with a score target. Perceived speed is a design principle, not a follow-up task.

## Accessibility & Inclusion

- Target WCAG 2.2 AA across all tools and marketing surfaces.
- Honor `prefers-reduced-motion`: no non-essential transitions or transforms for users who request reduction.
- Support light and dark themes at parity (the app already uses `mode-watcher`); colorblind-safe encoding for any categorical charts — never color alone.
- Keyboard-first paths through the calculator and log browser; never trap focus in a combobox or popover.
- Language: English, US-centric but avoid idioms that don't translate (international raiding audience).
