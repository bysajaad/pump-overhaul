/**
 * Persian number formatting.
 *
 * Prize amounts, countdowns and ranks must render in Persian digits — never
 * hand-map digits, `Intl` handles the numeral system and grouping correctly.
 */

const fa = new Intl.NumberFormat("fa-IR");
const faCompactCache = new Map<number, string>();

/** 1272998 → «۱٬۲۷۲٬۹۹۸» */
export function faNum(n: number): string {
  return fa.format(Math.round(n));
}

/** Fixed-decimal Persian, for prices: 3421.57 → «۳٬۴۲۱٫۵۷» */
export function faDecimal(n: number, digits = 2): string {
  return new Intl.NumberFormat("fa-IR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

/**
 * Large Toman amounts in Persian words: 87_455_950_900 → «۸۷.۵ میلیارد»
 * The live site writes big numbers this way; keeping it preserves the register.
 */
export function faCompactToman(n: number): string {
  const cached = faCompactCache.get(n);
  if (cached) return cached;

  const units: [number, string][] = [
    [1e12, "هزار میلیارد"],
    [1e9, "میلیارد"],
    [1e6, "میلیون"],
    [1e3, "هزار"],
  ];

  let out = faNum(n);
  for (const [size, label] of units) {
    if (n >= size) {
      const scaled = n / size;
      // One decimal below 100, none above — matches how the numbers read aloud.
      out = `${scaled < 100 ? faDecimal(scaled, 1) : faNum(scaled)} ${label}`;
      break;
    }
  }

  faCompactCache.set(n, out);
  return out;
}

/** Seconds remaining → «۰۰:۳۰» in Persian digits. */
export function faClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return fa.format(Number(mm)).padStart(2, "۰") + ":" + fa.format(Number(ss)).padStart(2, "۰");
}
