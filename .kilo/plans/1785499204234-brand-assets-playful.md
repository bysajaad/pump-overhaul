# Brand Assets, Real 3D & Input-Responsive Playfulness

## Overview

The prototype currently has zero brand visual assets (pure procedural geometry + DOM text) and responds only to scroll. This plan:

1. **Pulls pumpgame.ir's asset inventory** and recreates the on-brand pieces as **real, responsive 3D** — the stepped پ logo and پامپ wordmark are pixel-traced into voxel data (resolution-independent by construction), and the coin / bottle-cap / treasure / podium motifs are rebuilt as voxel-clay geometry per the repo's art rule ("form is voxel, material is soft clay, vector only for UI chrome").
2. **Makes the page react to everything**: pointer, device tilt (parallax), scroll velocity, game state (coin theatre), plus magnetic buttons and haptics.
3. **Uses the OpenRouter key for AI media** — video models ARE available (verified: `GET /api/v1/models?output_modalities=video` returns 20 models — Veo 3.1 family, Sora 2 Pro, Kling v3, Runway Gen-4.5, etc.; the *unfiltered* `/api/v1/models` catalog omits them, which is why my first check missed them). Video is used narrowly, where a baked clip does not fight responsiveness: the no-WebGL fallback loop and flipbook-frame sources. Everything interactive stays real-time. Key lives in `.env.local` (gitignored), never in the repo. Total media cost cap ~$8.

Original rasters are **never committed** — they are downloaded to a temp dir as tracing ground-truth only. This keeps the README's "assets are rebuilt, not copied" scope intact while achieving pixel-exact brand fidelity.

## Original-site asset inventory (verified by download & inspection)

| Asset | Style | Disposition |
|---|---|---|
| `images/landing/pump-logo.png` | Stepped voxel پ, magenta | **Pixel-trace → 3D voxel emblem** (`BrandMark.tsx`) |
| `images/branding/word-mark.png` | Stepped پامپ wordmark | **Pixel-trace → SVG rects** (`WordMark.tsx`) in new `Header.tsx` |
| `cdn.pumpgame.ir/pump/campaign/steps/1..25.png` | Gold coin, stepped پ mint | **Rebuild as 3D voxel coin** (`Coin.tsx`) on all 25 path steps |
| `images/branding/pumps-coin.png`, `pumps-prize.png` | Photoreal red bottle-cap, "Pumps" script | **Rebuild as voxel bottle-cap** (crimped rim = voxel flutes), magenta/gold, پ mint — the Pumps currency icon in 3D coin flip + burst |
| `images/landing/hero-3.png`, step 25 | Photoreal treasure pile + crown | **Rebuild as `TreasureMound.tsx`** (instanced gold voxels + voxel crown + token-colored gems), upgrading `Podium.tsx` |
| `images/landing/bitcoin-up-down.png` | Soft-3D ETH coin, green/red arrows | Recreated by the **call coin flip**: coin spins during open call, lands green-up / red-down on settle |
| `images/landing/podium-2.png` | Glossy gold podium, Persian ۱۲۳ | Folded into TreasureMound staging; numerals stay in DOM (screen-reader rule) |
| `chevron-*.svg`, `glow-*.svg`, `question-mark.svg`, `users-2.png`, `youtube.png`, `gamepad-2.png` | UI chrome / stat icons | **Hand-tuned inline SVG set** (`components/icons/`), 24px grid, 1.5 stroke, round caps — no icon dependency |
| `eth-logo.png` | Third-party mark | Minimal diamond glyph in DOM ticker only |
| `application-2.png`, `footpump*`, Esteghlal/Persepolis | App screenshots / other brands | **Out of scope** — not landing-page assets / not Pump's marks |

## Decisions locked with the user

- **AI media:** images + sprite sheets, and now video (confirmed available) for the fallback loop + flipbook sources. Sprite sheets are generated as **short video clips → extracted frames**, because frame-to-frame consistency from one clip beats generating image grids.
- **Tilt permission:** requested silently on first game commit (iOS gesture requirement), no-op on denial.
- **Playful layers:** all five — parallax everywhere, coin theatre, magnetic buttons, scroll-velocity juice, haptics. All routed through `fidelity.ts`, all disabled under `prefers-reduced-motion`.

## OpenRouter API facts (verified against the live API)

- Images: `POST /api/v1/chat/completions` with `modalities:["image","text"]`, models `google/gemini-3.1-flash-image` (~$0.004/img), `google/gemini-3-pro-image` (~$0.02–0.05/img).
- Video: `POST /api/v1/videos` `{model, prompt, seconds, image?}` → `{id, polling_url, status}`; poll `GET polling_url` until `completed`, then download from `unsigned_urls[0]`. Response includes `usage.cost`. Async by nature (frame-coherent diffusion): **measured ~7 min wall-clock for a 4s Veo Fast clip** — generation is one-time and offline, committed as static files; visitors never wait for it. Clips are generated in the background while other phases are built. Models: `google/veo-3.1-lite` (cheapest Veo), `google/veo-3.1-fast` (**measured $0.24/s** via probe: 4s = $0.96), `kling/v3-std`, etc. Token pricing fields are zeroed for video — billing is per second of output; exact per-second rates are shown on each model page. Supports **image-to-video** (`image` param), which we use to seed clips from our generated poster for style consistency.

## Work items

### Phase 1 — Brand data pipeline (no AI, no cost)

1. **`scripts/trace-brand.mjs`** (new, dev-only, Node 22; run manually):
   - Fetches `pump-logo.png` + `word-mark.png` to the OS temp dir (never the repo), decodes PNG (use `pngjs` as a devDependency — tiny, no native build), downscales to coarse grids (logo ~20×14, wordmark ~52×14), thresholds alpha, samples per-cell brand color.
   - Emits **`lib/brand/logo-map.ts`** and **`lib/brand/wordmark-map.ts`**: `export const MAP: readonly string[]` (rows of `0`/`1`) + sparse per-cell tint overrides. Deterministic output; committed.
2. **`components/WordMark.tsx`** (new): renders traced rows as SVG `<rect>` runs (one path per run-length row segment to keep node count low). Used in:
3. **`components/Header.tsx`** (new): slim fixed top bar (`z-20`), wordmark start-side + a live pool chip (reads throttled snapshot like `PoolReadout`). Counter-drifts with parallax (Phase 3).
4. **`components/icons/index.tsx`** (new): inline SVG icon set — `Chevron`, `Question`, `Users`, `Play` (youtube stat), `Gamepad`, `Gift`, `Clock`, `EthGlyph`. `stroke="currentColor"`, `strokeWidth={1.5}`, round caps, `aria-hidden` (labels live in adjacent text).
5. Wire icons into `app/page.tsx` stat cards and the instrument's timer (`Clock`). Persian copy unchanged in meaning.

### Phase 2 — Real 3D brand assets

6. **`components/scene/BrandMark.tsx`** (new): `InstancedMesh` of `RoundedBox` (drei) voxels built from `logo-map`, extruded 2 layers deep (back layer offset +0.5 grid, darker shell tint for relief). Material: `MeshStandardMaterial` `flatShading` + `roughness ~0.55`, colors from traced tints — matches the vessel's clay feel without duplicating its shader. Slow self-rotation; parked above the vessel in the hero framing; CameraRig keyframes get a small y-offset so the mark frames the first beat. Leans with parallax (Phase 3).
7. **`components/scene/Coin.tsx`** (new): coin = short cylinder (24 seg) + instanced voxel پ relief on both faces (from a small 7×5 پ map) + crimped rim (16 box flutes). Gold from tokens (`yellow-500/600`), `flatShading`. Exports `CoinMesh` plus shared geometry builders so `Path`, `CoinFlip`, `CoinBurst` reuse one geometry.
8. **`components/scene/Path.tsx`** (edit): a `Coin` standing on each of the 25 plinths, slow spin; coin color follows the same pressure-frontier logic already in `Path` (reached = lit gold, pending = `primary-100`, frontier pulses). One more `InstancedMesh`; matrices static except frontier spin.
9. **`components/scene/TreasureMound.tsx`** (new, consumed by `Podium.tsx`): deterministic-seeded cone of instanced gold voxels (~220 high / ~60 low), a hand-authored voxel crown on top, ~12 gem icosahedra in `blue-500`/`green-500`/`red-500`. Plinths remain but gain gold accents. Breathes with surge (existing Podium motion pattern).
10. **`components/GameProvider.tsx`** (new): lifts `useCall` into context mounted in `app/page.tsx` above `<Stage/>`. **Fixes a real defect**: the two `<CallInstrument/>` instances (beats 1 & 6) currently hold independent state and double-poll `/api/price`; after this they share one game. Exposes `state` (React) + a mutable `eventsRef` queue (`commit`/`settle` with outcome) for per-frame scene consumers.
11. **`components/scene/CoinFlip.tsx`** (new): one large coin above the vessel; idle-hidden, flips/spins on `commit`, lands on `settle` — face-up for `correct`/`flat` with a `green-500` rim flash, gentle edge-tilt for `wrong` with `red-500` rim (losing still pays: the coin deflates, never "dies" — mirrors the copy).
12. **`components/scene/CoinBurst.tsx`** (new): instanced coins (~40 high / ~12 low) erupt from the vessel on `settle`, gravity + spin + fade, ~1.6s life, zero per-frame allocation (preallocated trajectory buffer, time-parameterized). Gold on `correct`; fewer, `primary-650` on `wrong` — generous, not punitive. Puff/spark flipbook quads (Phase 4) layer in if sheets ship; burst must look right without them.

### Phase 3 — Input-responsive playfulness

13. **`components/InputProvider.tsx`** (new): single bus, refs-only (PressureProvider pattern — no re-renders):
    - `pointer` (normalized −1..1, passive `pointermove` on window),
    - `tilt` (normalized from `deviceorientation` beta/gamma, clamped ±25°),
    - `scrollVelocity` (`useScrollProgress` gains a `velocity` ref — exponential-decayed delta of progress),
    - one rAF loop damping all values (frame-rate independent, `1 - exp(-dt*k)`).
    - `prefers-reduced-motion` and low tier → outputs pinned to 0. Provider wraps page inside `PressureProvider`.
14. **Tilt permission:** `lib/useTiltPermission.ts` — `request()` calls `DeviceOrientationEvent.requestPermission?.()`; invoked fire-and-forget inside `commit()` in `useCall` (first play = the gesture). On grant, `InputProvider` attaches the orientation listener. One line of microcopy in the hero, rendered only when granted: «دستگاهت را تکان بده — مخزن جواب می‌دهد».
15. **Parallax layers:**
    - `CameraRig`: damped pointer+tilt offset (±0.35u x/y) + tilt roll (±1.5°) + **FOV breath**: `fov += clamp(velocity) * 1.5°`, all additive after keyframe sampling; reduced-motion keeps existing behavior.
    - `Vessel`: lean toward pointer (≤0.06 rad) + **scroll-velocity squish** (scaleY −3% max, scaleXZ compensates to preserve volume).
    - `Crowd`: group counter-drift (0.4× camera offset) → depth layering.
    - DOM: glass panels + `Header` translate3d via CSS vars (`--par-x/--par-y`, ±6px panels, ±10px header) set from `InputProvider` on `document.documentElement.style` (transform-only, no layout).
16. **`components/Magnetic.tsx`** (new): wraps a button; within 24px radius translates toward cursor (≤6px), springs back with the brand ease; child gets `whileTap={{ scale: 0.97 }}`. Applied to the up/down buttons, «یک‌بار دیگر», and the final-beat CTA. Disabled on touch-only devices and under reduced-motion.
17. **Haptics:** `navigator.vibrate?.(15)` on commit; `vibrate([20,40,20])` on `correct` settle. Guarded, fire-and-forget (iOS ignores silently).

### Phase 4 — AI media (OpenRouter)

18. **`.env.example`** (new): `OPENROUTER_API_KEY=` (empty, documented). Real key goes in `.env.local` — already covered by the repo's `.env*` gitignore rule. **Never written into any tracked file.** (User was advised: key was pasted in chat — rotate after this work.)
19. **`scripts/generate-media.mjs`** (new, manual, `node --env-file=.env.local`):
    - Hard fail without `OPENROUTER_API_KEY`. Images via chat/completions; video via `/api/v1/videos` (submit → poll `polling_url` with timeout → download).
    - **Manifest with exact prompts + model per asset**; `--final` flag switches image models from flash (drafts) to pro (finals). Writes `public/media/manifest.json` (model, prompt, date — provenance for DESIGN.md). Manual, additive regeneration only; never in CI.
    - Style suffix on every prompt: "soft clay 3D render, voxel-stepped forms, matte material, deep dark magenta background #16040d, brand magenta #f42a8f accent lighting, no text, no letters".
    - **Images:**
      1. `poster-hero.png` → `public/media/poster-hero.webp` — hero still of voxel vessel + treasure mound; og:image, poster frame, and the seed image for the fallback video.
      2. `env-glow.png` → additive far-plane backdrop behind the crowd (parallax-reactive — stays responsive).
    - **Video:**
      3. `fallback-loop.mp4` — 5s image-to-video from `poster-hero` (`veo-3.1-lite`, fallback `kling/v3-std`): the vessel breathing, treasure glinting, near-static camera. Used by the no-WebGL tier: poster paints instantly, video fades in when buffered. Stripped of audio, ≤2MB target.
      4. `puff-src.mp4` + `spark-src.mp4` — 3–4s each on pure black: a clay smoke puff expanding/dissipating; a small voxel sparkle pop. `veo-3.1-lite`. Frame extraction → 4×4 flipbook sheets (`puff-sheet.webp`, `spark-sheet.webp`).
    - **Frame extraction:** `ffmpeg` via `imageio[ffmpeg]` pip package in the existing temp venv (static binary, no system install) → 16 evenly-spaced frames → montage to sheet. `sips` for image resize/webp conversion.
    - Optional if budget remains (~$1): 3s voxel پ self-assembling "sting" for the fallback tier. Skip otherwise.
20. **Flipbook player** (`lib/shaders/flipbook.ts` + use in `CoinBurst` and a subtle vessel-base steam wisp on surge): instanced quads, UV frame from `uAge`, additive blending, `depthWrite:false`. If a sheet fails visual review (frame inconsistency), that layer is dropped — burst/steam must not depend on AI output to look right.
21. **No-WebGL fallback:** `Stage.tsx` — `fidelity.tier === "none"` when WebGL context creation fails; render poster `<img>` (or `<video poster loop muted playsinline>` when `fallback-loop` shipped) fixed full-bleed + existing scrim. DOM overlay already carries all content. `app/layout.tsx`: `openGraph.images = ["/media/poster-hero.webp"]`.

### Phase 5 — Fidelity routing, verification, docs

22. **`lib/fidelity.ts`** (edit): add `parallax: boolean`, `coinDetail: number`, `burstCount: number`, `spriteSheets: boolean`. LOW: parallax on (nearly free), reduced counts, sheets off. Reduced-motion forces parallax/velocity/haptics off while keeping visual detail (per AGENTS.md).
23. **Verification:** `npm run typecheck` → `npm run lint` → `npm run build` (final gate; AGENTS.md warns the checkers disagree). Manual dev pass: desktop + mobile emulation, scroll flight, tilt grant flow, settle burst, no-WebGL fallback, reduced-motion. Visual review of every generated image/clip before accepting (read the files back).
24. **Docs:**
    - `DESIGN.md`: append asset inventory table + traced/rebuilt provenance + AI media manifest summary (models, prompts, dates, cost).
    - `README.md`: scope — no-WebGL now has a poster/video fallback; media pipeline documented.
    - `AGENTS.md`: Runtime Shape — `InputProvider`, `GameProvider`, new scene members, `scripts/*`, `OPENROUTER_API_KEY` env var, "original rasters never committed" rule.

## Cost budget (OpenRouter)

| Item | Model | Est. |
|---|---|---|
| Planning probe (done, measured) | veo-3.1-fast, 4s | $0.96 |
| Image drafts (~8) | gemini-3.1-flash-image | ~$0.04 |
| Image finals (2 × ~2 tries) | gemini-3-pro-image | ~$0.10–0.20 |
| Fallback loop (5s × 2 tries) | veo-3.1-lite (est. ~½ fast's $0.24/s) | ~$0.60–1.20 |
| Flipbook sources (2 clips × 2 tries) | veo-3.1-lite | ~$0.50–1.00 |
| Contingency re-rolls | mixed | ~$3 |
| **Total cap** | | **≤ ~$8** |

Video is deliberately *not* used for anything interactive: a baked clip cannot respond to scroll, pointer, or tilt — the "mindblowing" moments (vessel surge, coin theatre, parallax) are all real-time GLSL/R3F. Video's two jobs are making the no-WebGL tier alive and producing consistent flipbook frames.

## Explicitly out of scope

- Original PNGs copied into the repo (trace/rebuild only).
- FootPump, Esteghlal/Persepolis, app screenshots, winners table data.
- Accounts, real wagering, real prizes (unchanged repo constraint).
- Sound.
