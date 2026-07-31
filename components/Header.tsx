"use client";

import { WordMark } from "@/components/WordMark";
import { usePressure } from "@/components/PressureProvider";
import { faCompactToman } from "@/lib/format";

export function Header() {
  const { snapshot } = usePressure();
  return (
    <header className="parallax-header pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4">
      <WordMark className="h-7 w-auto fill-primary-500" />
      <div className="rounded-full border border-glass-white-10 bg-glass-black-60 px-4 py-2 text-xs text-neutral-850 backdrop-blur-md tabular-nums">
        استخر زنده: <strong className="text-primary-650">{faCompactToman(snapshot.pool)}</strong>
      </div>
    </header>
  );
}
