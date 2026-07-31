/**
 * The pressure model.
 *
 * This is the spine of the whole page. Pump's real mechanic is that the weekly
 * prize pool grows with the *collective* play count — so the hero vessel is a
 * live readout of that pool, already inflating when you arrive because other
 * people are playing. Every visual in the scene reads from here; nothing owns
 * its own notion of "how full is it".
 *
 * Simulated, not real: this concept has no backend. The simulation is seeded
 * and time-derived so SSR and the client agree on the opening value, and so
 * two viewers at the same moment see roughly the same pool.
 */

/** Fictional starting pool, in Toman. Same register as the real product. */
const BASE_POOL = 87_455_950_900;

/** Target the weekly pool climbs toward, in Toman (~100k USDT). */
const POOL_TARGET = 120_000_000_000;

/** Simulated global plays per second. */
const PLAYS_PER_SECOND = 37;

/** Toman added to the pool per play. */
const TOMAN_PER_PLAY = 2_400;

/** mulberry32 — small deterministic PRNG so "random" activity is reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PressureState {
  /** Prize pool in Toman. */
  pool: number;
  /** Pool as a fraction of target, clamped 0..1 — what the vessel renders. */
  pressure: number;
  /** Cumulative simulated plays this week. */
  plays: number;
  /** Short-lived 0..1 spike from a burst of activity. Drives shimmer/bloom. */
  surge: number;
  /** Player's own contribution, in Toman. Lets "I did that" be legible. */
  contributed: number;
}

export class PressureModel {
  private readonly rand: () => number;
  private elapsed = 0;
  private surge = 0;
  private plays = 0;
  private contributed = 0;
  private nextBurstIn: number;

  constructor(seed = 0x70706d70) {
    this.rand = mulberry32(seed);
    this.nextBurstIn = 1.5 + this.rand() * 2.5;
  }

  /** Advance the simulation. `dt` in seconds. */
  advance(dt: number): void {
    this.elapsed += dt;
    this.plays += PLAYS_PER_SECOND * dt;

    // Bursts: the crowd is lumpy, not a smooth faucet. Without this the vessel
    // reads as a progress bar rather than something alive.
    this.nextBurstIn -= dt;
    if (this.nextBurstIn <= 0) {
      const size = 0.25 + this.rand() * 0.75;
      this.surge = Math.min(1, this.surge + size);
      this.plays += PLAYS_PER_SECOND * (1 + this.rand() * 3);
      this.nextBurstIn = 1.2 + this.rand() * 3.2;
    }

    // Surge decays fast — it is punctuation, not state.
    this.surge *= Math.exp(-dt * 1.9);
  }

  /** The player's own play lands as an unmistakable spike. */
  injectPlay(weight = 1): void {
    this.surge = Math.min(1, this.surge + 0.65 * weight);
    this.plays += 40 * weight;
    this.contributed += TOMAN_PER_PLAY * 40 * weight;
  }

  read(): PressureState {
    const pool = BASE_POOL + this.plays * TOMAN_PER_PLAY + this.contributed;
    return {
      pool,
      pressure: Math.min(1, pool / POOL_TARGET),
      plays: this.plays,
      surge: this.surge,
      contributed: this.contributed,
    };
  }

  /**
   * Deterministic opening value for SSR, so the first paint shows a plausible
   * pool instead of zero and does not fight hydration.
   */
  static initial(): PressureState {
    return {
      pool: BASE_POOL,
      pressure: Math.min(1, BASE_POOL / POOL_TARGET),
      plays: 0,
      surge: 0,
      contributed: 0,
    };
  }
}

export { BASE_POOL, POOL_TARGET, TOMAN_PER_PLAY };
