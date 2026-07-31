"use client";

import { motion, AnimatePresence } from "motion/react";
import { useGame } from "@/components/GameProvider";
import { Magnetic } from "@/components/Magnetic";
import { Clock, EthGlyph } from "@/components/icons";
import { faClock, faDecimal, faNum } from "@/lib/format";
import { assetPath } from "@/lib/base-path";

/**
 * The playable call.
 *
 * Sits in the first screenful with no gate in front of it — no account, no
 * install, no scroll. That placement is the argument: the thing the current
 * landing sends you away to do, you can just do.
 *
 * Uses logical properties throughout (ps/pe, start/end) so RTL is structural
 * rather than patched.
 */
export function CallInstrument() {
  const { state, price, remaining, commit, reset } = useGame();
  const open = state.phase === "committed" || state.phase === "resolving";
  const settled = state.phase === "settled";

  return (
    <div className="w-full max-w-[27.5rem] rounded-3xl border border-glass-white-10 bg-glass-black-40 p-5 backdrop-blur-lg">
      {/* Ticker */}
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2 text-xs text-neutral-550"><EthGlyph className="size-8" />قیمت اتریوم</span>
        {/* Persian currency word rather than "$": a Latin symbol beside Persian
            digits forces a bidi direction flip and renders on the wrong side. */}
        <span className="text-lg text-neutral-900 tabular-nums">
          {price ? `${faDecimal(price.price)} دلار` : "…"}
        </span>
      </div>
      {price?.source === "simulated" && (
        <p className="mt-1 text-2xs text-neutral-400">
          فید زنده در دسترس نیست — قیمت شبیه‌سازی شده
        </p>
      )}

      {/* Buttons / state */}
      <AnimatePresence mode="wait">
        {state.phase === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.87, 0, 0.13, 1] }}
          >
            <div className="mt-4 flex items-center gap-3">
              <img
                src={assetPath("/media/img-arrows.webp")}
                alt="نشانه‌های بالا و پایین"
                loading="lazy"
                className="size-10 shrink-0 rounded-xl border border-glass-white-10 object-cover"
              />
              <p className="text-sm text-neutral-850">
                تا ۳۰ ثانیهٔ آینده قیمت بالا می‌رود یا پایین می‌آید؟
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Magnetic><button
                onClick={() => commit("up")}
                disabled={!price}
                className="w-full rounded-xl bg-green-500/15 py-3 text-md font-extrabold text-green-600 transition-colors duration-300 hover:bg-green-500/25 disabled:opacity-40"
                style={{ transitionTimingFunction: "cubic-bezier(0.87,0,0.13,1)" }}
              >
                بالا می‌رود
              </button></Magnetic>
              <Magnetic><button
                onClick={() => commit("down")}
                disabled={!price}
                className="w-full rounded-xl bg-red-500/15 py-3 text-md font-extrabold text-red-600 transition-colors duration-300 hover:bg-red-500/25 disabled:opacity-40"
                style={{ transitionTimingFunction: "cubic-bezier(0.87,0,0.13,1)" }}
              >
                پایین می‌آید
              </button></Magnetic>
            </div>
            <p className="mt-3 text-2xs text-neutral-400">
              بدون ثبت‌نام. همین‌جا، همین حالا.
            </p>
          </motion.div>
        )}

        {open && state.call && (
          <motion.div
            key="open"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.87, 0, 0.13, 1] }}
            className="mt-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-850">
                پیش‌بینی تو:{" "}
                <strong
                  className={
                    state.call.direction === "up" ? "text-green-600" : "text-red-600"
                  }
                >
                  {state.call.direction === "up" ? "بالا" : "پایین"}
                </strong>
              </span>
              <span className="flex items-center gap-2 font-mono text-xl tabular-nums text-primary-600">
                <Clock className="size-8" />
                {faClock(remaining)}
              </span>
            </div>
            {/* Progress uses inset-inline-start so it drains correctly in RTL. */}
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-glass-white-10">
              <motion.div
                className="h-full bg-primary-500"
                initial={{ width: "100%" }}
                animate={{ width: `${(remaining / 30) * 100}%` }}
                transition={{ duration: 0.2, ease: "linear" }}
              />
            </div>
            <p className="mt-3 text-2xs text-neutral-400">
              {state.phase === "resolving" ? "در حال نتیجه‌گیری…" : "بازی تو الان مخزن را باد کرد."}
            </p>
          </motion.div>
        )}

        {settled && state.call?.outcome && (
          <motion.div
            key="settled"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.87, 0, 0.13, 1] }}
            className="mt-4"
          >
            <p className="text-lg font-extrabold text-neutral-900">
              {state.call.outcome === "correct" && "درست گفتی"}
              {state.call.outcome === "wrong" && "این‌بار نشد"}
              {state.call.outcome === "flat" && "بازار تکان نخورد"}
            </p>
            <p className="mt-1 text-sm text-neutral-550" dir="ltr">
              {faDecimal(state.call.openPrice)} → {faDecimal(state.call.closePrice ?? 0)}
            </p>
            <p className="mt-3 text-md text-primary-600">
              <strong className="font-extrablack">
                {faNum(state.call.pumpsEarned ?? 0)}
              </strong>{" "}
              پامپز گرفتی
              {state.call.outcome === "wrong" && " — باخت هم پامپز دارد"}
            </p>
            <Magnetic><button
              onClick={reset}
              className="mt-4 w-full rounded-xl bg-primary-500 py-3 text-md font-extrabold text-neutral-white transition-transform duration-300 hover:scale-[1.02]"
              style={{ transitionTimingFunction: "cubic-bezier(0.87,0,0.13,1)" }}
            >
              یک‌بار دیگر
            </button></Magnetic>
          </motion.div>
        )}
      </AnimatePresence>

      {state.pumps > 0 && (
        <p className="mt-4 border-t border-glass-white-10 pt-3 text-xs text-neutral-550">
          مجموع پامپز تو: <strong className="text-neutral-900">{faNum(state.pumps)}</strong>
        </p>
      )}
    </div>
  );
}
