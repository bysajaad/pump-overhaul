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
  /** Scroll-linked camera movement; off means beats cut instead of fly. */
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
  cameraOnScroll: false,
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

  const cores = navigator.hardwareConcurrency ?? 4;
  return cores <= 4 ? LOW : HIGH;
}

export { HIGH as HIGH_FIDELITY, LOW as LOW_FIDELITY, NONE as NO_WEBGL_FIDELITY };
