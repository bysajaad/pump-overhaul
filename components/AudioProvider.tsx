"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getAudioEngine, type SfxName } from "@/lib/audio";
import { haptic, setHapticsEnabled } from "@/lib/haptics";
import { resolveFidelity } from "@/lib/fidelity";
import { useInput } from "@/components/InputProvider";
import { useGame } from "@/components/GameProvider";

interface AudioContextValue {
  /** The context was created inside a gesture and the buses are live. */
  unlocked: boolean;
  muted: boolean;
  /** Onboarding entry point: `withSound` starts the ambient loop unmuted. */
  enter: (withSound: boolean) => Promise<void>;
  toggleMuted: () => void;
  sfx: (name: SfxName, options?: { gain?: number; rate?: number }) => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

/**
 * Owns the audio engine for the page and centralizes every reaction sound:
 * game phase changes, scroll-velocity ticks, and beat-crossing whooshes all
 * fire from here so instruments and scene theatre never double-trigger.
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  const engine = useMemo(getAudioEngine, []);
  const [unlocked, setUnlocked] = useState(false);
  const [muted, setMuted] = useState(engine.isMuted);
  const { state } = useGame();
  const { progress, scrollVelocity } = useInput();
  const previousPhase = useRef(state.phase);

  // Haptics are a device-cost decision: fidelity (which folds in the reduced-
  // motion preference) is the single authority.
  useEffect(() => {
    setHapticsEnabled(resolveFidelity().haptics);
  }, []);

  // Game sounds: one transition, one sound.
  useEffect(() => {
    const before = previousPhase.current;
    const after = state.phase;
    previousPhase.current = after;
    if (before === after) return;
    if (after === "committed") {
      engine.sfx("commit");
      haptic("commit");
    } else if (after === "settled") {
      const outcome = state.call?.outcome;
      if (outcome === "correct") {
        engine.sfx("win");
        window.setTimeout(() => engine.sfx("coin", { gain: 0.7 }), 350);
        haptic("win");
      } else if (outcome === "wrong") {
        engine.sfx("lose", { gain: 0.8 });
        haptic("lose");
      } else {
        engine.sfx("tick", { gain: 0.5 });
        haptic("tap");
      }
    } else if (after === "idle" && before === "settled") {
      engine.sfx("coin", { gain: 0.5, rate: 1.1 });
      haptic("tap");
    }
  }, [state.phase, state.call, engine]);

  // Scroll sounds: velocity ticks (micro) and beat-boundary whooshes (macro).
  // Reads input refs on a rAF loop — never through React state.
  useEffect(() => {
    const BEATS = 6;
    let lastTick = 0;
    let lastProgress = progress.current;
    let frame = 0;
    const tick = (now: number) => {
      const v = Math.abs(scrollVelocity.current);
      if (v > 0.12 && now - lastTick > 120) {
        lastTick = now;
        engine.sfx("tick", {
          gain: Math.min(0.35, 0.06 + v * 0.25),
          rate: 1 + Math.min(0.5, v * 0.3),
        });
      }
      const p = progress.current;
      const crossed = Math.floor(p * BEATS) !== Math.floor(lastProgress * BEATS);
      if (crossed && v > 0.02) {
        engine.sfx("whoosh", { gain: 0.2, rate: 1 + Math.min(0.3, v * 0.2) });
      }
      lastProgress = p;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [engine, progress, scrollVelocity]);

  // Park the context when the page is hidden; the loop resumes on return.
  useEffect(() => {
    const onVisibility = () => engine.setActive(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [engine]);

  const value = useMemo<AudioContextValue>(() => ({
    unlocked,
    muted,
    enter: async (withSound) => {
      engine.setMuted(!withSound);
      setMuted(!withSound);
      await engine.unlock();
      setUnlocked(true);
    },
    toggleMuted: () => {
      const next = !engine.isMuted;
      engine.setMuted(next);
      setMuted(next);
      if (!next) {
        // Unmuting from a "mute" onboarding: this tap is the gesture the
        // autoplay policy needs, so the engine can still come alive.
        void engine.unlock().then(() => setUnlocked(true));
        engine.sfx("tick", { gain: 0.4 });
      }
    },
    sfx: (name, options) => engine.sfx(name, options),
  }), [engine, unlocked, muted]);

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const value = useContext(AudioContext);
  if (!value) throw new Error("useAudio must be used inside <AudioProvider>");
  return value;
}
