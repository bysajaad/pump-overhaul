"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PressureModel, type PressureState } from "@/lib/pressure";

/**
 * One pressure model, two consumers with very different needs.
 *
 * The 3D scene wants the value every frame and must not trigger React renders
 * to get it — so it reads a mutable ref. The DOM overlay only needs numbers a
 * human can read, so it gets a throttled snapshot a few times a second.
 * Rendering Persian-formatted currency at 60fps would burn most of the frame
 * budget on `Intl` for no perceptible gain.
 */

interface PressureContextValue {
  /** Live values, mutated in place. For useFrame consumers only. */
  live: React.RefObject<PressureState>;
  /** Throttled snapshot, safe for DOM. */
  snapshot: PressureState;
  /** The viewer played: spike the vessel. */
  injectPlay: (weight?: number) => void;
  /** 0..1 decaying pulse from the viewer's own play. */
  playerPulse: React.RefObject<number>;
}

const PressureContext = createContext<PressureContextValue | null>(null);

/** DOM updates per second. Enough to feel live, cheap enough to ignore. */
const SNAPSHOT_HZ = 5;

export function PressureProvider({ children }: { children: ReactNode }) {
  const model = useMemo(() => new PressureModel(), []);
  const live = useRef<PressureState>(PressureModel.initial());
  const playerPulse = useRef(0);
  const [snapshot, setSnapshot] = useState<PressureState>(PressureModel.initial());

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let sinceSnapshot = 0;

    const tick = (now: number) => {
      // Clamp dt so a backgrounded tab does not fast-forward the pool.
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      model.advance(dt);
      live.current = model.read();

      // Player pulse decays independently of crowd surge so "my play" stays
      // visually distinct from "someone's play".
      playerPulse.current *= Math.exp(-dt * 2.4);

      sinceSnapshot += dt;
      if (sinceSnapshot >= 1 / SNAPSHOT_HZ) {
        sinceSnapshot = 0;
        setSnapshot(live.current);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [model]);

  const injectPlay = useCallback(
    (weight = 1) => {
      model.injectPlay(weight);
      playerPulse.current = Math.min(1, playerPulse.current + 0.9 * weight);
      setSnapshot(model.read());
    },
    [model],
  );

  const value = useMemo(
    () => ({ live, snapshot, injectPlay, playerPulse }),
    [snapshot, injectPlay],
  );

  return <PressureContext.Provider value={value}>{children}</PressureContext.Provider>;
}

export function usePressure(): PressureContextValue {
  const ctx = useContext(PressureContext);
  if (!ctx) throw new Error("usePressure must be used inside <PressureProvider>");
  return ctx;
}
