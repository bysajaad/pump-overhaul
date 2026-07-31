"use client";

import { usePressure } from "@/components/PressureProvider";
import { faCompactToman, faNum } from "@/lib/format";

/**
 * The pool, in words.
 *
 * The vessel says "filling" faster than any number can; this says "by how
 * much". It reads the throttled snapshot, not the live ref — five updates a
 * second is past the point where a human reads a changing figure anyway.
 */
export function PoolReadout() {
  const { snapshot } = usePressure();

  return (
    <div className="text-center">
      <p className="text-xs text-neutral-550">جایزهٔ این هفته، همین لحظه</p>
      <p
        className="mt-1 text-3xl font-extrablack leading-3xl text-neutral-white tabular-nums"
        // Live region, but polite and infrequent — an assertive one would make
        // this unusable with a screen reader.
        aria-live="polite"
      >
        {faCompactToman(snapshot.pool)}
        <span className="ps-2 text-lg font-normal text-neutral-550">تومان</span>
      </p>
      <p className="mt-2 text-xs text-neutral-400">
        با هر بازیِ هر کاربر، بزرگ‌تر می‌شود
      </p>
      {snapshot.contributed > 0 && (
        <p className="mt-2 text-xs text-primary-600">
          سهم تو از این عدد: {faCompactToman(snapshot.contributed)} تومان
        </p>
      )}
      <p className="mt-1 text-2xs text-neutral-400">
        {faNum(snapshot.plays)} بازی از شروع این هفته
      </p>
    </div>
  );
}
