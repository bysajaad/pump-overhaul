# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An experimental design exploration for **pumpgame.ir** — a Persian entertainment/rewards platform. The owner asked how the game and site could be re-thought. This repo is **not a fork of production** and is not deployable to it; it exists to argue a creative direction. See `README.md` (in Persian) for the proposal itself and `DESIGN.md` for the extracted brand.

It argues two things:

1. **The landing should be the game, not a teaser for it.** The live footer already links a `نسخه وب‌اپلیکیشن` beside the Cafebazaar Android download, so browser play is already possible — the landing/game split is a product decision, not a technical constraint.
2. **The art direction needs one language.** 8-bit pixel, soft-3D and clay-pixelate coexist on the live site with no rule choosing between them.

**Superseded:** an earlier plan called for three divergent concepts. That was dropped in favour of a single flagship 3D landing. Don't reintroduce it.

## Commands

```bash
npm run dev        # dev server (Turbopack)
npm run build      # production build
npm run lint       # next lint
npm run typecheck  # tsc --noEmit
```

No test framework — nothing here yet justifies one. `npm run build` plus a browser pass is the real gate.

**Two environment traps, both already hit:**

- **TypeScript must stay on v6.** `typescript@latest` resolves to 7.x, which does not expose the compiler API Next.js 16 needs; the build fails while a standalone `tsc --noEmit` still passes. Don't "upgrade" it.
- **A stray `package-lock.json` in the parent directory** makes Turbopack infer the wrong workspace root. `turbopack.root` in `next.config.ts` pins it.

Verifying with a piped command (`npm run build | tail`) reports the pipe's exit code, not Next's. Redirect to a file and check `$?`.

## Architecture

One continuous 3D world with a scrolling DOM overlay. Scroll position drives a camera through the scene; sections do not stack over separate backdrops.

```
lib/pressure.ts        the spine — simulated collective play inflating the pool
lib/game.ts            pure reducer for the call: idle→committed→resolving→settled
lib/shaders/vessel.ts  GLSL for the hero object
lib/fidelity.ts        the single capability seam
components/PressureProvider.tsx   one model, two consumption patterns
components/scene/      Stage, Vessel, Path, Podium, Crowd, CameraRig
app/api/price/route.ts ETH feed, cached, with fallbacks
```

### The pressure model is the spine

`lib/pressure.ts` owns "how full is the pool". The vessel, the path, the podium and the crowd all read from it; **nothing keeps its own copy**. Pump's real mechanic is that the weekly prize pool grows with collective play, so that value is the one thing every visual must agree on.

### Two consumers, one source

`PressureProvider` exposes the same state twice on purpose:

- **`live` (ref)** — mutated in place, read inside `useFrame`. The scene must never cause a React render to animate.
- **`snapshot` (state)** — throttled to ~5Hz for the DOM. Formatting Persian currency at 60fps would burn the frame budget on `Intl` for no perceptible gain.

Adding a scene element? Read the ref. Adding a readout? Read the snapshot.

### Art direction: clay-pixelate, one rule

> **Form is voxel-quantized. Material is soft clay. Vector is for chrome only.**

Implemented in-shader, not with modelled assets: displace a sphere, snap the result to a grid, then take the normal from screen-space derivatives so each facet lights as its own plane. Wrap lighting gives clay's soft falloff; a posterized diffuse carries the 8-bit lineage.

**The quantization grid must stay coarser than the underlying triangles.** Too fine and the icosphere tessellation shows through, and it reads as low-poly crystal rather than stacked clay. Anything new in the scene follows the same rule — chunky forms, few segments.

## Things that will bite

### RTL stops at the canvas

The DOM overlay mirrors for `dir="rtl"`. **The 3D scene does not.** World space is world space: mirroring the camera or scene would invert the key light and flip the pressure metaphor, which is spatial, not linguistic. Camera keyframes, light directions and the path helix are all authored in world space and stay that way.

In the overlay, though, RTL is structural:

- **Logical properties only** — `ms-*`/`me-*`, `ps-*`/`pe-*`, `start-*`/`end-*`, `text-start`/`text-end`. Physical `ml-*`/`left-*`/`text-left` mirror wrong silently.
- **Persian numerals** via `lib/format.ts` (`faNum`, `faDecimal`, `faCompactToman`, `faClock`) — never hand-map digits.
- **Never letter-space Persian.** Tracking breaks joining forms; `globals.css` enforces this for `:lang(fa)`.
- **Latin symbols beside Persian digits flip direction.** Prefer the Persian word (`دلار`) or wrap in `dir="ltr"`.

### Never derive scale from `useThree().viewport`

`viewport` is computed from the camera's current distance, so anything sized by it grows and shrinks as the rig flies. Size from canvas aspect at a fixed reference distance instead — see `Vessel.tsx`.

Related: `fov` is **vertical**. On a narrow portrait viewport the horizontal field is far tighter, so an unscaled radius-1 object swallows the screen.

### Layering

The stage is `fixed inset-0 z-0`; `main` is `relative z-10`; **`body` must stay transparent**. An opaque background on `body` paints over the canvas, because in-flow descendant backgrounds paint after low/negative-z positioned children. This looked exactly like "WebGL is broken".

### Copy needs its own contrast

The vessel is large, bright and high-frequency. Camera distance is not a reliable contrast guarantee at every scroll position, so copy sits on glass panels (`bg-glass-black-60` + `backdrop-blur-md`) using the brand's existing glass depth model.

### The price feed is deliberately defensive

`app/api/price/route.ts` is server-side so the browser never touches a foreign origin. Order: Binance → CoinGecko → simulated. It caches successes for 15s, and on upstream failure **drifts around the last real price** rather than re-serving it frozen.

That last part is load-bearing. A frozen price makes every call settle "flat", which pays maximum Pumps and silently stops the mini-game being a game. Drift is anchor-relative so amplitude stays plausible at any price level. Don't "simplify" this back to a constant.

## Scope guards

- **Play-only.** No accounts, no wagering, no payments, no real prizes. Pumps are fictional. Keep it that way.
- **Brand is fixed.** `primary-500` `#f42a8f`, the inverted dark scale, the glass model. Creative range is layout, motion, type, composition, interaction — not re-palletting. Derive from existing hues rather than adding one.
- **Don't ship their assets.** No logos or imagery copied from the live site; rebuild instead. Numbers quoted from their page are attributed in the overlay.
- **Fonts:** IRANYekanXVF is commercially licensed and must not be committed. Vazirmatn (SIL OFL) stands in. `DESIGN.md` records the real settings (`ss02`, `"dots" 1` axis) for production.
- **Low-end and no-WebGL tiers are deferred**, not forgotten. Every cost decision routes through `lib/fidelity.ts` so the tier is a config change, not a refactor. Nothing else should branch on device capability. A real Pump audience is largely mid-tier Iranian Android, so this will matter eventually.

## Known gaps

- Path steps read as floating platforms more than a connected staircase.
- The vessel is behind the panel at the crowd beat, since that panel is top-aligned to clear the podium. Acceptable — the beat is about the crowd and the leaderboard — but the composition never shows vessel and podium together.
- `prefers-reduced-motion` holds the camera's opening pose, but the vessel still breathes.
- Firecrawl's API was unreachable from this machine, so `DESIGN.md` was extracted by fetching the CSS bundle directly rather than via `firecrawl-website-design-clone`.
