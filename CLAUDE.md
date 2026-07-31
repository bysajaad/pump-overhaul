# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

**The repository is currently empty** — only `LICENSE` and `.claude/settings.local.json` exist. Everything below "Reference site" is *stated intent*, not observed structure. The commands are the target setup, not verified ones. Re-derive this file from the real tree once the scaffold lands.

## What this is

An experimental design exploration for **pumpgame.ir** — a Persian entertainment/gaming platform. The owner asked how the game and site could be re-thought: design, feel, and how it looks. This repo is not a fork of production and does not aim to be deployable to it; it exists to argue a creative direction.

The goal for the landing page is **playful and attractive** — the thesis is that a prize/competition platform doesn't have to look like every other prize/competition platform.

Deliverable shape: **three divergent concepts**, not one refined page. They should disagree with each other — e.g. a physics/toy-like take, a bold-editorial-type take, a narrative scroll-driven take. The owner picks a direction before any of them gets production depth. Resist the pull to converge them into one house style early; the divergence *is* the deliverable.

## Reference site (observed 2026-07-31)

Fetched from `https://pumpgame.ir/`:

- **Stack**: Next.js (React) — `_next/static` bundles throughout
- **Locale**: `<html lang="fa-IR" dir="rtl" translate="no">` — `translate="no"` is deliberate; keep it
- **Positioning**: entertainment platform — games, competition, fun content, large weekly prizes. OG copy also references a Pump *app*, so mobile is part of the story
- **Type**: IRANYekanX variable font, self-hosted `.woff2`
- **Palette**: brand magenta is **`#f42a8f`** (`primary-500`), on an **inverted dark scale** where `50` is darkest and `950` lightest. `theme-color` is `#000000` — dark-first. See `DESIGN.md` for the full 200+ token set; do not eyeball colors from the rendered page. (`#ed077b` and `#8b58da` appear in the live hero as off-token hex literals — they are *not* brand values.)
- **Routes**: `/`, `/guides`, `/weekly/leaderboard`, `/terms`, `/licenses`

## Hard constraints

- **Brand, logo, and colors are fixed.** The magenta/purple-on-black identity above is the given, not a variable. Creative range comes from layout, motion, type treatment, composition, and interaction — not from re-palletting. If a concept needs a colour outside the set, derive it from the existing hues rather than introducing a new hue.
- **Persian-first, RTL-first.** Not an English design with RTL bolted on. Copy, rhythm, and layout decisions start from Persian.
- Use **owner-supplied brand assets**. Don't ship logos or imagery pulled off the live site into this repo.

## Intended stack

Next.js (App Router) + Tailwind + Motion (Framer Motion).

```bash
npm run dev          # dev server
npm run build        # production build
npm run lint         # eslint
npm test             # test runner — TBD, none chosen yet
```

No test framework is chosen yet. Pick one when the first piece of logic worth testing exists; a concept landing page may not need one.

## RTL + Persian: the things that actually bite

These cost the most time when missed, and cut across every component:

- **Use Tailwind logical properties, never physical ones**: `ms-*`/`me-*`, `ps-*`/`pe-*`, `start-*`/`end-*`, `text-start`/`text-end`. `ml-*`, `mr-*`, `left-*`, `text-left` will silently mirror wrong. This is the single most common source of RTL bugs here.
- **Motion on the x-axis does not auto-mirror.** `x: 20` slides the same physical direction regardless of `dir`, so an "enters from the trailing edge" animation reverses meaning in RTL. Drive horizontal motion from a direction token derived from `dir`, not from hardcoded signs. Same for drag constraints, carousel/swipe direction, and scroll-linked horizontal movement.
- **Numerals**: prize amounts, countdowns, and leaderboard ranks should render as Persian digits — `Intl.NumberFormat('fa-IR')`. Don't hand-map digits.
- **Mirror directional icons** (arrows, chevrons, back/next). Do *not* mirror media controls, logos, or clocks.
- **IRANYekanX is a variable font** — use the variable axes for weight rather than loading separate static cuts, and set `font-display: swap`. Persian text has different optical needs than Latin: it needs more line-height than a Latin equivalent, and letter-spacing/tracking tweaks that work on Latin display type will damage Persian joining forms. Leave tracking alone on Persian.
- Persian text runs longer than English for the same content. Design to flex.

## Conventions

- Concepts live side by side and stay independently viewable — a shared route per concept (e.g. `/concepts/<name>`) so the owner can compare them in one session without a rebuild.
- Anything genuinely shared across concepts (font loading, brand tokens, RTL direction helper) belongs in one place; anything expressing a concept's point of view does not.
- Respect `prefers-reduced-motion` in every concept. Playful and accessible are not in tension, and a physics-heavy concept without a reduced-motion path is an incomplete concept.
