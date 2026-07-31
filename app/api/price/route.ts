import { NextResponse } from "next/server";

/**
 * ETH spot price for the playable call.
 *
 * Server-side on purpose: the browser never talks to a foreign origin, which
 * keeps CORS out of it and means a blocked upstream degrades on the server
 * instead of breaking the page. Iranian networks reach these hosts
 * inconsistently, so a simulated walk backstops them — the game must stay
 * playable even with no upstream at all, since an unplayable hero would defeat
 * the entire argument of this concept.
 */

// ISR preserves the 15-second server cache while allowing the same route to be
// materialized once during the GitHub Pages static export. The Pages client
// bypasses that static snapshot and reads upstreams directly with simulation as
// its final fallback.
export const dynamic = "force-static";
export const revalidate = 15;

type Source = "binance" | "coingecko" | "simulated";

interface PricePayload {
  price: number;
  source: Source;
  at: number;
  /** True when this is a real price we already had, re-served after a failure. */
  stale?: boolean;
}

const UPSTREAM_TIMEOUT_MS = 2500;

/**
 * Server-side cache.
 *
 * Every client polls this route, and CoinGecko's free tier rate-limits hard —
 * without this, a single open tab is enough to get 429'd into permanent
 * fallback, which is exactly what happened before this existed. One upstream
 * call per window serves all clients, and spot price does not move meaningfully
 * inside it.
 */
const CACHE_TTL_MS = 15_000;
let cached: { payload: PricePayload; expires: number } | null = null;

/**
 * Last real price seen, kept indefinitely.
 *
 * These upstreams fail intermittently, and falling straight through to the
 * simulated walk makes the ticker jump between unrelated values (a real ~1890
 * to a synthetic 3400), which looks broken. A slightly stale real price is far
 * better than a fresh fictional one, so simulated is reserved for the case
 * where we have never had a real reading at all.
 */
let lastGood: PricePayload | null = null;

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fromBinance(): Promise<number | null> {
  const data = await fetchJson("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT");
  const price = Number((data as { price?: string } | null)?.price);
  return Number.isFinite(price) && price > 0 ? price : null;
}

async function fromCoingecko(): Promise<number | null> {
  const data = await fetchJson(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
  );
  const price = Number((data as { ethereum?: { usd?: number } } | null)?.ethereum?.usd);
  return Number.isFinite(price) && price > 0 ? price : null;
}

/**
 * Deterministic pseudo-market, drifting around a given anchor.
 *
 * Time-seeded so successive polls trace one coherent walk rather than jumping.
 * Drift is expressed as a fraction of the anchor, so it stays plausible whether
 * ETH is at 1,900 or 4,000 — a fixed absolute amplitude would be a rounding
 * error at one price and a crash at another.
 *
 * Amplitude is tuned so a 30s window usually produces a decidable move. Too
 * small and every call settles "flat", which pays maximum Pumps every time and
 * quietly stops being a game.
 */
function simulated(at: number, anchor = 3_400): number {
  const t = at / 1000;
  // Three incommensurable periods read as noise without being random.
  const drift =
    Math.sin(t / 47) * 0.0055 + Math.sin(t / 11.3) * 0.0022 + Math.sin(t / 2.7) * 0.0009;
  return Number((anchor * (1 + drift)).toFixed(2));
}

function respond(payload: PricePayload) {
  return NextResponse.json<PricePayload>(payload, {
    headers: { "cache-control": "no-store" },
  });
}

export async function GET() {
  const at = Date.now();

  if (cached && cached.expires > at) return respond(cached.payload);

  for (const [source, get] of [
    ["binance", fromBinance],
    ["coingecko", fromCoingecko],
  ] as const) {
    const price = await get();
    if (price !== null) {
      const payload: PricePayload = { price, source, at };
      cached = { payload, expires: at + CACHE_TTL_MS };
      lastGood = payload;
      return respond(payload);
    }
  }

  // Upstream is down or rate-limited. Re-serving `lastGood` verbatim would
  // freeze the ticker, and a frozen price settles every call as "flat" — the
  // game stops working. So drift around the last real price instead: plausible
  // magnitude, real movement, and still honestly labelled as simulated.
  return respond({
    price: simulated(at, lastGood?.price),
    source: "simulated",
    at,
    stale: lastGood !== null,
  });
}
