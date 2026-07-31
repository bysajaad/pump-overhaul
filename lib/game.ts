/**
 * The playable call — a real mini-game, not a mock.
 *
 * You pick up or down, a window elapses, and the call is settled against an
 * actual ETH price delta. Scored in fictional Pumps: no accounts, no wagering,
 * no money. Mirrors one true detail of Pump's own rules — a losing call still
 * earns Pumps, just fewer — because that generosity is the nicest thing about
 * the real product and the current site only mentions it in an FAQ.
 */

export type Direction = "up" | "down";
export type Phase = "idle" | "committed" | "resolving" | "settled";

/** Seconds a call stays open before it settles. */
export const CALL_WINDOW = 30;

/** Pumps awarded for playing at all, regardless of outcome. */
export const PUMPS_FOR_PLAYING = 40;

/** Bonus Pumps for a correct call. */
export const PUMPS_FOR_CORRECT = 120;

/** Below this absolute % move the market is treated as flat — nobody loses. */
export const FLAT_THRESHOLD = 0.02;

export type Outcome = "correct" | "wrong" | "flat";

export interface Call {
  direction: Direction;
  /** Price when the call was committed. */
  openPrice: number;
  /** Epoch ms when the call was committed. */
  openedAt: number;
  /** Price at settlement, once known. */
  closePrice?: number;
  outcome?: Outcome;
  pumpsEarned?: number;
}

export interface GameState {
  phase: Phase;
  pumps: number;
  call: Call | null;
  /** Completed calls, newest first. Kept short — this is a landing page. */
  history: Call[];
}

export const initialGameState: GameState = {
  phase: "idle",
  pumps: 0,
  call: null,
  history: [],
};

export function settleOutcome(
  direction: Direction,
  openPrice: number,
  closePrice: number,
): Outcome {
  const changePct = ((closePrice - openPrice) / openPrice) * 100;
  if (Math.abs(changePct) < FLAT_THRESHOLD) return "flat";
  const moved: Direction = changePct > 0 ? "up" : "down";
  return moved === direction ? "correct" : "wrong";
}

export function pumpsFor(outcome: Outcome): number {
  // A flat market is not the player's fault — treat it as a correct call.
  if (outcome === "correct" || outcome === "flat") {
    return PUMPS_FOR_PLAYING + PUMPS_FOR_CORRECT;
  }
  return PUMPS_FOR_PLAYING;
}

export type GameEvent =
  | { type: "commit"; direction: Direction; price: number; at: number }
  | { type: "resolving" }
  | { type: "settle"; price: number }
  | { type: "reset" };

export function gameReducer(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case "commit": {
      if (state.phase !== "idle") return state;
      return {
        ...state,
        phase: "committed",
        call: {
          direction: event.direction,
          openPrice: event.price,
          openedAt: event.at,
        },
      };
    }

    case "resolving": {
      if (state.phase !== "committed") return state;
      return { ...state, phase: "resolving" };
    }

    case "settle": {
      if (!state.call || (state.phase !== "resolving" && state.phase !== "committed")) {
        return state;
      }
      const outcome = settleOutcome(state.call.direction, state.call.openPrice, event.price);
      const pumpsEarned = pumpsFor(outcome);
      const settled: Call = {
        ...state.call,
        closePrice: event.price,
        outcome,
        pumpsEarned,
      };
      return {
        phase: "settled",
        pumps: state.pumps + pumpsEarned,
        call: settled,
        history: [settled, ...state.history].slice(0, 5),
      };
    }

    case "reset": {
      if (state.phase !== "settled") return state;
      return { ...state, phase: "idle", call: null };
    }

    default:
      return state;
  }
}

/** Seconds left in the open call, given a clock reading. */
export function secondsLeft(call: Call | null, now: number): number {
  if (!call) return CALL_WINDOW;
  return Math.max(0, CALL_WINDOW - (now - call.openedAt) / 1000);
}
