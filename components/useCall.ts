"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  CALL_WINDOW,
  gameReducer,
  initialGameState,
  secondsLeft,
  type Direction,
  type GameState,
  type Outcome,
} from "@/lib/game";
import { usePressure } from "@/components/PressureProvider";
import { requestTiltPermission } from "@/lib/useTiltPermission";
import { assetPath } from "@/lib/base-path";

interface PriceReading {
  price: number;
  source: "binance" | "coingecko" | "simulated";
  at: number;
  stale?: boolean;
}

/**
 * How often to refresh the ticker. Matched to the route's cache window — polling
 * faster just returns the same cached value and burns requests.
 */
const POLL_MS = 8000;
const STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

function simulatedPrice(at: number, anchor = 3_400): number {
  const t = at / 1000;
  const drift =
    Math.sin(t / 47) * 0.0055 + Math.sin(t / 11.3) * 0.0022 + Math.sin(t / 2.7) * 0.0009;
  return Number((anchor * (1 + drift)).toFixed(2));
}

async function fetchStaticPrice(previous: PriceReading | null): Promise<PriceReading> {
  const at = Date.now();
  try {
    const binance = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT", {
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });
    if (binance.ok) {
      const price = Number(((await binance.json()) as { price?: string }).price);
      if (Number.isFinite(price) && price > 0) return { price, source: "binance", at };
    }
  } catch {}

  try {
    const coingecko = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      { signal: AbortSignal.timeout(2500), cache: "no-store" },
    );
    if (coingecko.ok) {
      const price = Number(((await coingecko.json()) as { ethereum?: { usd?: number } }).ethereum?.usd);
      if (Number.isFinite(price) && price > 0) return { price, source: "coingecko", at };
    }
  } catch {}

  return {
    price: simulatedPrice(at, previous?.price),
    source: "simulated",
    at,
    stale: previous !== null,
  };
}

/**
 * Drives the real playable call.
 *
 * The price feed is polled through our own route handler, so a blocked upstream
 * degrades to the simulated walk server-side and this hook never has to care.
 * The call settles on whatever price is current when the window closes.
 */
export type SceneGameEvent =
  | { type: "commit"; at: number }
  | { type: "settle"; at: number; outcome: Outcome };

export interface CallController {
  state: GameState;
  price: PriceReading | null;
  remaining: number;
  commit: (direction: Direction) => void;
  reset: () => void;
}

export function useCall(): CallController & { eventsRef: React.RefObject<SceneGameEvent[]> } {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [price, setPrice] = useState<PriceReading | null>(null);
  const [remaining, setRemaining] = useState(CALL_WINDOW);
  const { injectPlay } = usePressure();
  const eventsRef = useRef<SceneGameEvent[]>([]);
  const previousPhase = useRef(state.phase);

  // Latest price without re-subscribing timers on every tick.
  const priceRef = useRef<PriceReading | null>(null);
  priceRef.current = price;

  // Poll the feed.
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        if (STATIC_EXPORT) {
          const reading = await fetchStaticPrice(priceRef.current);
          if (alive) setPrice(reading);
        } else {
          const res = await fetch(assetPath("/api/price"), { cache: "no-store" });
          if (res.ok && alive) setPrice((await res.json()) as PriceReading);
        }
      } catch {
        // Route handler already has a fallback; a transient failure here just
        // means we keep the previous reading.
      }
      if (alive) timer = setTimeout(poll, POLL_MS);
    };

    void poll();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  // Countdown + settlement.
  useEffect(() => {
    if (state.phase !== "committed" && state.phase !== "resolving") return;

    const tick = setInterval(() => {
      const left = secondsLeft(state.call, Date.now());
      setRemaining(left);

      if (left <= 3 && state.phase === "committed") dispatch({ type: "resolving" });

      if (left <= 0) {
        const settleAt = priceRef.current?.price ?? state.call?.openPrice ?? 0;
        dispatch({ type: "settle", price: settleAt });
      }
    }, 200);

    return () => clearInterval(tick);
  }, [state.phase, state.call]);

  useEffect(() => {
    if (state.phase === "settled" && previousPhase.current !== "settled" && state.call?.outcome) {
      eventsRef.current.push({ type: "settle", at: performance.now(), outcome: state.call.outcome });
    }
    previousPhase.current = state.phase;
  }, [state.phase, state.call]);

  const commit = useCallback(
    (direction: Direction) => {
      const current = priceRef.current?.price;
      if (!current || state.phase !== "idle") return;
      dispatch({ type: "commit", direction, price: current, at: Date.now() });
      eventsRef.current.push({ type: "commit", at: performance.now() });
      setRemaining(CALL_WINDOW);
      // The player's play is what feeds the pool — this is the whole thesis, so
      // the vessel must react in the same instant the button is pressed.
      injectPlay(1);
      void requestTiltPermission();
    },
    [state.phase, injectPlay],
  );

  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  return { state, price, remaining, commit, reset, eventsRef };
}
