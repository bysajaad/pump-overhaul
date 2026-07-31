# Repository Guide

## Purpose

- This is an experimental design argument for `pumpgame.ir`, not a production fork or deployable replacement. Keep it play-only: no accounts, wagering, payments, or real prizes.
- The chosen direction is one flagship 3D landing where the landing page is the game. An earlier multi-concept plan is superseded; do not restore it.
- Do not copy Pump logos or production imagery. `README.md` explains the proposal; `DESIGN.md` records the extracted brand constraints.

## Commands

```bash
npm run dev
npm run typecheck
npm run build
npm run trace-brand
npm run generate-media
GITHUB_PAGES=true NEXT_PUBLIC_SITE_URL=https://bysajaad.github.io/pump-overhaul npm run build
```

- There is no test framework or CI. The meaningful gate is `npm run build` followed by a desktop/mobile browser pass of the game, scrolling camera, and `/api/price` fallback behavior.
- `npm run lint` is currently broken: Next.js 16 no longer supports `next lint`, and the script treats `lint` as a project directory. Do not report lint as passing or use it as a gate until the script/tooling is replaced.
- Keep TypeScript on v6. TypeScript 7 lacks the compiler API expected by Next.js 16: `tsc --noEmit` can pass while `next build` fails.
- Keep `turbopack.root` in `next.config.ts`; a parent-directory lockfile otherwise makes Turbopack infer the wrong workspace root.
- Run `npm run build` directly when verifying its exit status. A pipeline such as `npm run build | tail` reports the final process's status instead of reliably reporting Next's.
- GitHub Pages uses conditional static export in `next.config.ts`. Keep raw public-asset URLs behind `assetPath()` so the `/pump-overhaul` base path is preserved. The static build uses a browser-side price fallback because Pages cannot execute `app/api/price`.

## Runtime Shape

- `app/page.tsx` is a scrolling semantic DOM overlay above one fixed R3F world in `components/scene/Stage.tsx`. Scroll drives `CameraRig`; sections are not independent scenes or backdrops.
- `lib/pressure.ts` is the only authority for pool pressure. All scene elements must agree with that model rather than keeping local pressure state.
- `PressureProvider` intentionally exposes `live` (a mutable ref for `useFrame`) and `snapshot` (React state throttled to 5 Hz for DOM readouts). Scene animation reads `live`; formatted UI reads `snapshot`. Do not move per-frame scene state through React renders.
- Route all device-cost decisions through `lib/fidelity.ts`. Do not add capability checks in individual scene components. Reduced motion disables camera flight, parallax, velocity response, and haptics while retaining visual detail; the `none` tier renders static-media fallback.
- `InputProvider` is the refs-only pointer, tilt, scroll-progress, and velocity bus. Per-frame consumers must read those refs rather than put input into React state.
- `lib/game.ts` is the pure `idle -> committed -> resolving -> settled` reducer. `GameProvider` mounts the sole `useCall` controller so both instruments and scene theatre share one poller and state. The game uses fictional Pumps and a 30-second ETH call.
- `AudioProvider` sits inside `GameProvider` and is the only place reaction sounds fire: it watches game phase transitions and reads input refs (scroll velocity, beat crossings) on a rAF loop. `lib/audio.ts` is the WebAudio singleton — one context, master/music/sfx buses, no `window` at import time. The context is created only inside a user gesture (`Onboarding` or the header mute toggle); sounds requested before their buffer lands are skipped, never queued.
- `components/Onboarding.tsx` is the first-visit permission gate: audio unlock, iOS orientation permission, and tilt calibration happen in its single tap. The choice persists in `localStorage` (`pump:onboarded`); a `full` choice re-arms audio on the next visit's first `pointerdown` because autoplay needs a gesture per load. `pump:muted` and the header toggle handle sound state after that.
- `lib/haptics.ts` is the only haptic path: Vibration API where present, the hidden `<input type="checkbox" switch">` toggle trick on iOS 18+, silent no-op elsewhere. Enablement routes through `fidelity.haptics` via `setHapticsEnabled`; no component calls `navigator.vibrate` directly.
- Tilt parallax is baseline-calibrated: the first `deviceorientation` reading after grant becomes the zero pose (never assume an absolute angle), and `calibrateTilt()` from `InputProvider` re-zeros it deliberately after the onboarding tap.
- `BrandMark`, path coins, `TreasureMound`, `CoinFlip`, and `CoinBurst` are real-time scene members. Optional flipbook sheets enhance the burst but must never be required for it.
- `scripts/trace-brand.mjs` writes only occupancy/tint maps from temporary reference files. `scripts/generate-media.mjs` is an offline, manual OpenRouter pipeline; it is never a build step.
- Generated `img-*.webp` stills are DOM illustration only (rounded glass frames next to beat titles, the instrument prompt, and the onboarding strip); they never replace real-time scene members, and UI chrome stays vector.
- `music-ambient.mp3` is a Lyria clip closed into a seamless loop by envelope+amix blending in the WAV domain. Do not reintroduce `acrossfade` for this: it silently starves on mp3 trims near the bitrate-estimated EOF (see `scripts/generate-media.mjs` comments).

## Fragile Constraints

- `app/api/price/route.ts` must remain server-side and defensive: Binance, then CoinGecko, then simulated movement. Successful prices are cached for 15 seconds. On upstream failure, drift around the last real price; never freeze it or replace it with an unrelated constant, because flat settlement removes the game mechanic.
- RTL applies to the DOM only. Use logical layout utilities (`ms`/`me`, `ps`/`pe`, `start`/`end`, `text-start`/`text-end`), but never mirror the 3D world, camera keyframes, lights, or path.
- Format Persian values through `lib/format.ts`; do not hand-map digits. Never add letter spacing to Persian. Wrap Latin symbols in `dir="ltr"` or prefer Persian words where bidi ordering can flip.
- Keep `body` transparent. The fixed stage is `z-0` and the overlay is `z-10`; an opaque body background paints over the canvas and looks like broken WebGL.
- Do not size scene objects from `useThree().viewport`: it changes with camera distance. Derive scale from canvas aspect at a fixed reference distance as `Vessel.tsx` does; remember that camera `fov` is vertical on portrait screens.
- Copy over the bright scene needs the existing glass panel treatment for reliable contrast; camera composition alone is not a contrast guarantee.
- Put `OPENROUTER_API_KEY` only in gitignored `.env.local`; `.env.example` stays empty. Never commit original Pump rasters, tracing downloads, keys, or intermediate media files.

## Visual Scope

- Keep the extracted brand: `primary-500` is `#f42a8f`, color ramps are inverted for dark mode (`50` darkest, `950` lightest), and depth uses glass alpha rather than a new shadow system.
- The art rule is: voxel-quantized form, soft-clay material, vector only for UI chrome. Keep the quantization grid coarser than the underlying mesh or the vessel reads as low-poly crystal.
- Vazirmatn is the checked-in SIL OFL stand-in. Never commit the commercially licensed IRANYekanXVF; `DESIGN.md` records its production settings.
