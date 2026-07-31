"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  CALL_WINDOW,
  gameReducer,
  initialGameState,
  secondsLeft,
  type Direction,
} from "@/lib/game";
import { usePressure } from "@/components/PressureProvider";

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

/**
 * Drives the real playable call.
 *
 * The price feed is polled through our own route handler, so a blocked upstream
 * degrades to the simulated walk server-side and this hook never has to care.
 * The call settles on whatever price is current when the window closes.
 */
export function useCall() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [price, setPrice] = useState<PriceReading | null>(null);
  const [remaining, setRemaining] = useState(CALL_WINDOW);
  const { injectPlay } = usePressure();

  // Latest price without re-subscribing timers on every tick.
  const priceRef = useRef<PriceReading | null>(null);
  priceRef.current = price;

  // Poll the feed.
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const res = await fetch("/api/price", { cache: "no-store" });
        if (res.ok && alive) setPrice((await res.json()) as PriceReading);
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

  const commit = useCallback(
    (direction: Direction) => {
      const current = priceRef.current?.price;
      if (!current || state.phase !== "idle") return;
      dispatch({ type: "commit", direction, price: current, at: Date.now() });
      setRemaining(CALL_WINDOW);
      // The player's play is what feeds the pool — this is the whole thesis, so
      // the vessel must react in the same instant the button is pressed.
      injectPlay(1);
    },
    [state.phase, injectPlay],
  );

  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  return { state, price, remaining, commit, reset };
}
