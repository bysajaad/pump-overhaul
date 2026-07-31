/**
 * Cross-platform haptics.
 *
 * Android/Chrome: the Vibration API. iOS Safari never implemented it, but iOS
 * 18+ plays a haptic when an `<input type="checkbox" switch>` is toggled, so a
 * hidden switch is kept in the DOM and clicked for each pulse. Everywhere else
 * silently no-ops. All patterns stay subtle — UI confirmation, not a buzzer.
 *
 * Enablement is a device-cost decision, so it routes through fidelity: the
 * provider that resolves it calls `setHapticsEnabled` once.
 */

export type HapticKind = "tick" | "tap" | "commit" | "win" | "lose";

/** Pulse patterns in milliseconds: [buzz, pause, buzz, ...]. */
const PATTERNS: Record<HapticKind, number[]> = {
  tick: [8],
  tap: [12],
  commit: [18],
  win: [15, 60, 25],
  lose: [30],
};

let enabled = true;
let iosSwitch: HTMLInputElement | null = null;
let chain = 0;

export function setHapticsEnabled(next: boolean) {
  enabled = next;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * The switch-toggle trick needs a real rendered element; display:none or
 * detached nodes do not fire the haptic. Visually hidden but in the layout.
 */
function ensureIOSSwitch(): HTMLInputElement | null {
  if (iosSwitch) return iosSwitch;
  if (typeof document === "undefined") return null;
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  input.setAttribute("aria-hidden", "true");
  input.tabIndex = -1;
  Object.assign(input.style, {
    position: "fixed",
    insetInlineStart: "-2px",
    top: "0",
    width: "1px",
    height: "1px",
    opacity: "0",
    pointerEvents: "none",
    zIndex: "-1",
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(input);
  iosSwitch = input;
  return input;
}

function clickChain(target: HTMLInputElement, pattern: number[]) {
  let delay = 0;
  for (let i = 0; i < pattern.length; i += 2) {
    // iOS drops toggles that arrive faster than ~50 ms apart; floor the gap.
    const pulse = Math.max(50, pattern[i]);
    const pause = pattern[i + 1] ?? 0;
    window.setTimeout(() => target.click(), delay);
    delay += pulse + pause;
  }
}

export function haptic(kind: HapticKind) {
  if (!enabled || typeof window === "undefined") return;
  const pattern = PATTERNS[kind];
  try {
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
      return;
    }
    if (isIOS()) {
      const target = ensureIOSSwitch();
      if (!target) return;
      // Serialize chains so a win pattern is not shredded by an intervening
      // tick: later calls queue behind the running one.
      const start = Math.max(0, chain - performance.now());
      chain = performance.now() + start + pattern.reduce((a, b) => a + Math.max(50, b), 0);
      window.setTimeout(() => clickChain(target, pattern), start);
    }
  } catch {
    // Haptics are decorative; never let them break an interaction.
  }
}
