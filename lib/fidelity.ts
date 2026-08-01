/**
 * The single fidelity seam.
 *
 * Low-end and no-WebGL tiers are deliberately out of scope for this concept
 * (see README). But a real Pump audience is largely mid-tier Iranian Android,
 * so every cost decision routes through here — adding the low tier later is a
 * config change, not a refactor. Nothing else in the app should branch on
 * device capability.
 */

export type FidelityTier = "high" | "low" | "none";

export interface Fidelity {
  tier: FidelityTier;
  /** Device pixel ratio clamp passed to the R3F canvas. */
  dpr: [number, number];
  /** Instance count for the crowd field. */
  crowdCount: number;
  /** Radial segments on the vessel — drives silhouette smoothness. */
  vesselDetail: number;
  /** Selective bloom is the most expensive pass we run. */
  postprocessing: boolean;
  /**
   * Scroll-linked camera movement. Only reduced motion turns this off: the
   * flight is a handful of lerps and the scene re-renders every frame anyway,
   * so cutting it saves nothing on weak hardware — it just froze the stage on
   * exactly the mid-tier phones the LOW tier exists for.
   */
  cameraOnScroll: boolean;
  /** Pointer, tilt, and velocity-linked transforms. */
  parallax: boolean;
  /** Radial segment count for branded coins. */
  coinDetail: number;
  /** Number of coins emitted by a settlement. */
  burstCount: number;
  /** AI-generated flipbook effects, when the sheets are present. */
  spriteSheets: boolean;
  /** Haptics follow motion preference even though unsupported browsers ignore them. */
  haptics: boolean;
}

const HIGH: Fidelity = {
  tier: "high",
  dpr: [1, 2],
  crowdCount: 4000,
  vesselDetail: 128,
  postprocessing: true,
  cameraOnScroll: true,
  parallax: true,
  coinDetail: 24,
  burstCount: 40,
  spriteSheets: true,
  haptics: true,
};

const LOW: Fidelity = {
  tier: "low",
  dpr: [1, 1.25],
  crowdCount: 600,
  vesselDetail: 48,
  postprocessing: false,
  // Camera flight stays on: it is cheap, and without it the stage never moves
  // on the mid-tier Androids this tier targets.
  cameraOnScroll: true,
  parallax: true,
  coinDetail: 16,
  burstCount: 12,
  spriteSheets: false,
  haptics: true,
};

const NONE: Fidelity = {
  ...LOW,
  tier: "none",
  parallax: false,
  haptics: false,
};

/**
 * Resolved once on the client. SSR always returns HIGH so markup is stable —
 * the canvas mounts client-side anyway, so no hydration mismatch results.
 */
export function resolveFidelity(): Fidelity {
  if (typeof window === "undefined") return HIGH;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    // Reduced motion is a stated preference, not a capability limit: keep the
    // detail, drop the movement.
    return { ...HIGH, cameraOnScroll: false, parallax: false, haptics: false };
  }

  try {
    const canvas = document.createElement("canvas");
    if (!canvas.getContext("webgl2") && !canvas.getContext("webgl")) return NONE;
  } catch {
    return NONE;
  }

  // iPhones take HIGH before the cores check: older Safari does not expose
  // hardwareConcurrency (the `?? 4` fallback would dump them into LOW), and a
  // 3x Retina canvas at dpr 2 plus bloom is a thermal trap on Safari, so the
  // pixel-ratio cap — not a tier drop — is the right cost control. Visually
  // indistinguishable from 2 on a phone, much cooler.
  const ios =
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios) return { ...HIGH, dpr: [1, 1.6] };

  const cores = navigator.hardwareConcurrency ?? 4;
  if (cores <= 4) return LOW;

  return HIGH;
}

export { HIGH as HIGH_FIDELITY, LOW as LOW_FIDELITY, NONE as NO_WEBGL_FIDELITY };
