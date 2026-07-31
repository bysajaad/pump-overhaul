# Pump — Extracted Design System

Reference documentation of the **existing** `pumpgame.ir` brand, for use as the fixed constraint in this repo. This records what is there, not what is proposed — proposals live in [README.md](./README.md).

**Provenance:** extracted 2026-07-31 from the live site's Tailwind v4 bundle at `/_next/static/chunks/13hbp-_vr63am.css` (125 KB) plus the server-rendered HTML. `firecrawl-website-design-clone` could not be used — Firecrawl's API was unreachable from this machine (`ETIMEDOUT 35.245.250.27:443`, three attempts, while the site itself served 200 in 0.27s). Tokens below are read directly from the CSS custom properties the site ships, so they are authoritative rather than eyeballed.

---

## Typography

| Token | Value |
|---|---|
| `--default-font-family` | `"IRANYekanXVF"` |
| `--default-font-feature-settings` | `"ss02"` |
| `--default-font-variation-settings` | `"dots" 1` |
| `--font-rooyin-vf` | `RooyinVF` (secondary/display) |

Two non-obvious details that must carry over or the type will look wrong:

- **`ss02`** — a stylistic set is enabled globally. Dropping it silently changes Persian letterforms.
- **`"dots" 1`** — IRANYekanX exposes a `dots` variable axis controlling the dot treatment on Persian glyphs. The site sets it explicitly. This is a deliberate identity choice, not a default.

**Weights:** 200 extralight · 400 normal · 600 semibold · 700 bold · 800 extrabold · **950 extrablack**

Weights are set via the variable axis, not separate static cuts. The 950 extrablack is the display weight.

**Type scale** — note there is no `text-base`; the middle step is named `md`:

| Step | Size | Paired leading |
|---|---|---|
| `2xs` | 0.625rem | `2xs` 1rem |
| `xs` | 0.75rem | `xs` 1.25rem |
| `sm` | 0.875rem | `sm` 1.5rem |
| `md` | 1rem | `md` 1.75rem |
| `lg` | 1.25rem | `lg` 2.25rem |
| `xl` | 1.5rem | `xl` 2.5rem |
| `2xl` | 2rem | `2xl` 3rem |
| `3xl` | 3rem | `3xl` 3.5rem |

Leading runs generous relative to size (1rem text → 1.75rem leading) — correct for Persian, which needs more line height than Latin at equal size.

## Color

**The scale is inverted for a dark theme.** `50` is the darkest and `950` the lightest — the opposite of stock Tailwind. Reading these as light-mode ramps will invert every surface.

### Primary — magenta

| Token | Hex | | Token | Hex |
|---|---|---|---|---|
| `primary-50` | `#16040d` | | `primary-600` | `#f655a6` |
| `primary-100` | `#30081b` | | `primary-650` | `#f769b0` |
| `primary-200` | `#601038` | | `primary-700` | `#f881bd` |
| `primary-300` | `#941957` | | `primary-750` | `#f995c7` |
| `primary-400` | `#c42173` | | `primary-800` | `#fba7d1` |
| **`primary-500`** | **`#f42a8f`** | | `primary-850` | `#fcc0de` |
| | | | `primary-900` | `#fdd3e7` |
| | | | `primary-950` | `#feecf5` |

`#f42a8f` is the brand magenta. See [Inconsistencies](#inconsistencies-found) — this repo's earlier notes had it as `#ed077b`, which is wrong.

### Semantic scales

| Role | 500 value |
|---|---|
| `blue` (info) | `#266fed` |
| `green` (success / "up") | `#00b88a` |
| `red` (danger / "down") | `#f53d50` |
| `yellow` (reward) | `#ffbb00` |
| `amber` | `#ffad33` (600) |
| `orange` | `#ff8833` (600) |

Blue and neutral carry extra half-steps (`650`, `750`, `850`) that other ramps lack. Green/red are the natural pair for the up/down prediction mechanic.

### Neutral

`neutral-50` `#0c0d0d` · `100` `#18191b` · `200` `#303336` · `350` `#55595e` · `400` `#61666b` · `550` `#878c92` · `850` `#d7d9db` · `900` `#e4e5e7` · plus `neutral-black` `#000` and `neutral-white` `#fff`.

### Glass — alpha ramps

A full parallel system of pre-composited alpha colors: `glass-{black,white,primary,blue,green,red,yellow}-{0…90}`, where the suffix is the opacity percentage. E.g. `glass-primary-30` = `#f42a8f4d`.

This is the most reusable part of the system — the entire UI depth model is alpha-over-dark rather than shadow-based, which is why there are almost no shadow tokens.

## Space, radius, blur

- **Spacing base:** `--spacing: 0.125rem` (2px). Every spacing utility is a multiple of 2px, so the scale is twice as fine as stock Tailwind.
- **Radius:** `sm` 0.25rem · `md` 0.5rem · `md-nudge` 0.625rem · `xl` 1rem · `2xl` 1.5rem · `3xl` 2rem · `full` 625rem. The bespoke `md-nudge` step signals hand-tuning between `md` and `xl`.
- **Blur:** `xs` 4px · `sm` 8px · `md` 12px · `lg` 16px · `2xl` 40px — feeding the glass model.
- **Drop shadows only:** `sm` `0 1px 2px #00000026` · `md` `0 3px 3px #0000001f` · `2xl` `0 25px 25px #00000026`. No elevation shadow scale exists.

### The container is phone-width

```
--container-max-width: 27.5rem   /* 440px */
--container-xs:         20rem    /* 320px */
```

Observed max-widths resolve to 375px, 340px, 335px — phone dimensions. **The current site is a narrow mobile column, even on desktop.** Under `768px` the scrollbar is hidden (`scrollbar-width: none`).

This is the single most consequential finding for the overhaul: a full-viewport 3D scene is a fundamental departure from the existing layout model, not a restyle. It should be a deliberate, argued decision.

## Motion

Six keyframes total — `magnetic`, `marquee`, `pulse`, `slide-down`, `slide-up`, `spin`:

| Animation | Value |
|---|---|
| `--animate-magnetic` | `magnetic 3s ease-in-out infinite` |
| `--animate-marquee` | `marquee 40s linear infinite` |
| `--animate-pulse` | `pulse 2s cubic-bezier(.4,0,.6,1) infinite` |
| `--animate-slide-up` / `-down` | `.3s cubic-bezier(.87,0,.13,1)` |
| `--animate-spin` | `spin 1s linear infinite` |

`cubic-bezier(.87,0,.13,1)` is a strong symmetric ease — near-flat at both ends, fast through the middle. It is the closest thing the current system has to a signature curve, and it is worth keeping as the 2D overlay's easing so the new work still feels related to the old.

No transform-driven entrance choreography, no scroll-linked motion, no spring physics. Motion is ambient (marquee, pulse, magnetic) rather than responsive to the user.

---

## Inconsistencies found

Evidence for the art-direction argument in the README:

1. **Off-token hex literals.** The hero uses an arbitrary Tailwind value gradient — `from-[#1a000b] … to-[#ed077b]` — where `#ed077b` is *not* the brand magenta `#f42a8f` and appears nowhere in the token set. `#8b58da` is likewise off-system. Hand-picked hexes sitting beside a fully-defined 200+ token palette.
2. **Mixed asset languages.** Vector UI chrome (`prize-carousel/chevron-*.svg`, `glow-*.svg`) beside raster illustration whose filenames record ad-hoc iteration (`hero-3.png`, `podium-2.png`, `total-prize-1.png`, `application-2.png`), plus third-party logos (ETH, Esteghlal, Persepolis) and the FootPump sub-brand.
3. **Two display fonts.** `IRANYekanXVF` and `RooyinVF` coexist with no documented rule for which is used when.
4. **Ambient-only motion.** Nothing responds to input, so the interface never feels like it acknowledges the user — a notable gap for a product whose subject is a game.

## What this repo keeps vs. changes

**Keeps (fixed constraint):** `primary-500` `#f42a8f` and its ramp; the inverted dark scale; the glass alpha model; IRANYekanXVF with `ss02` and `"dots" 1`; the 950 extrablack display weight; green/red as up/down; `cubic-bezier(.87,0,.13,1)` as the 2D signature ease.

**Changes:** the 440px phone column → full-viewport 3D stage; ambient motion → input- and scroll-responsive; the mixed illustration styles → one clay-pixelate language; off-token hexes → tokens only.

## Rebuilt asset inventory

Original rasters are tracing references only and are downloaded to the operating system's temporary directory by `scripts/trace-brand.mjs`. They are never written into this repository. The committed outputs are resolution-independent occupancy maps or hand-authored geometry.

| Source motif | Rebuilt form | Runtime use |
|---|---|---|
| Stepped پ logo | `lib/brand/logo-map.ts` + instanced rounded voxels | `BrandMark` above the vessel |
| پامپ wordmark | `lib/brand/wordmark-map.ts` + run-length SVG rectangles | Fixed live-pool header |
| Campaign step coins | Shared voxel-relief coin geometry | All 25 pressure path steps |
| Pumps bottle-cap coin | Crimped 16-flute rim and voxel پ relief | Call flip and settlement burst |
| Treasure, crown, gems | Seeded instanced clay voxels and authored crown | Podium staging |
| UI/stat symbols | 24px inline SVG, 1.5px rounded stroke | Semantic DOM chrome |

## AI media provenance

`scripts/generate-media.mjs` defines the complete additive manifest and enforces the $8 recorded-cost cap. Draft images use `google/gemini-3.1-flash-image`; `--final` uses `google/gemini-3-pro-image`. Video requests use `google/veo-3.1-lite` with `kling/v3-std` as submission fallback. Every prompt includes the clay-voxel, dark-magenta, no-text style suffix.

Accepted outputs are recorded in `public/media/manifest.json` with model, exact prompt, UTC date, and reported cost. The 2026-07-31 run accepted a Gemini Pro hero poster and environment glow plus Veo Lite puff/spark sources, extracted into 4×4 sheets. Recorded provider cost is `$2.837088`, plus one pre-manifest poster attempt whose cost could not be recovered after local conversion failed.

Both Veo fallback-loop attempts were rejected during visual review because they replaced the supplied vessel composition. Their `$1.28` combined cost remains in the manifest. The shipped `fallback-loop.mp4` is instead a deterministic, seamless five-second motion pass derived from the accepted AI poster, preventing a visible poster-to-video composition jump. The real-time scene remains complete if any optional sheet is removed.
