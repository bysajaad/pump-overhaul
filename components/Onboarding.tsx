"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAudio } from "@/components/AudioProvider";
import { useInput } from "@/components/InputProvider";
import { requestTiltPermission } from "@/lib/useTiltPermission";
import { haptic } from "@/lib/haptics";
import { assetPath } from "@/lib/base-path";
import { Smartphone, Vibrate, Volume2 } from "@/components/icons";

const ONBOARDED_KEY = "pump:onboarded";

/**
 * First-visit permission gate.
 *
 * Three capabilities need a user gesture before the page can come alive:
 * audio (autoplay policy), device orientation (iOS permission), and haptics
 * (implicit). Rather than asking later at awkward moments — or never asking
 * and leaving mobile parallax dead — the onboarding asks once, up front, and
 * explains why sound is half the experience. The choice persists; a "full"
 * choice re-arms on the next visit's first tap (autoplay needs a gesture per
 * page load, not per lifetime).
 */
export function Onboarding() {
  const { enter, sfx } = useAudio();
  const { calibrateTilt } = useInput();
  const [mode, setMode] = useState<"pending" | "show" | "hidden">("pending");
  const [videoOk, setVideoOk] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const previous = window.localStorage.getItem(ONBOARDED_KEY);
    if (previous === "full") {
      // Autoplay policy requires a fresh gesture per load; arm on the first
      // touch anywhere and restore the full experience without asking again.
      const rearm = () => {
        window.removeEventListener("pointerdown", rearm);
        void enter(true).then(() => sfx("coin", { gain: 0.4 }));
        void requestTiltPermission();
      };
      window.addEventListener("pointerdown", rearm, { passive: true });
      setMode("hidden");
      return () => window.removeEventListener("pointerdown", rearm);
    }
    if (previous === "mute") {
      setMode("hidden");
      return;
    }
    setMode("show");
  }, [enter, sfx]);

  const begin = async (withSound: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      await enter(withSound);
      // One gesture, two permissions: the orientation prompt must be awaited
      // inside the same tap, then calibration reads the pose the user is
      // actually holding.
      await requestTiltPermission();
      window.setTimeout(calibrateTilt, 350);
      haptic("commit");
      if (withSound) sfx("win", { gain: 0.6 });
      window.localStorage.setItem(ONBOARDED_KEY, withSound ? "full" : "mute");
      setMode("hidden");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {mode === "show" && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary-50/85 px-5 backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.87, 0, 0.13, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="آماده‌سازی تجربه"
        >
          <motion.div
            className="w-full max-w-[24rem] rounded-3xl border border-glass-white-10 bg-glass-black-60 p-6 backdrop-blur-lg"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.87, 0, 0.13, 1] }}
          >
            {videoOk && (
              <div className="mx-auto size-24 overflow-hidden rounded-full border border-glass-white-10">
                <video
                  className="size-full object-cover"
                  src={assetPath("/media/coin-spin.mp4")}
                  autoPlay
                  loop
                  muted
                  playsInline
                  ref={(node) => {
                    if (node && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                      node.pause();
                    }
                  }}
                  onError={() => setVideoOk(false)}
                />
              </div>
            )}
            <h1 className="mt-2 text-center text-xl font-extrablack leading-xl text-neutral-white">
              به پامپ خوش آمدی
            </h1>
            <p className="mt-2 text-center text-sm leading-md text-neutral-850">
              اینجا صفحه فقط دیده نمی‌شود — بازی می‌شود، شنیده می‌شود و در دستت
              پاسخ می‌دهد.
            </p>

            <ul className="mt-5 flex flex-col gap-3">
              {[
                {
                  Icon: Volume2,
                  title: "صدا را روشن کن",
                  body: "موسیقی محیطی و پاسخ صدای هر لمس، نیمی از تجربه است.",
                },
                {
                  Icon: Smartphone,
                  title: "اجازهٔ حسگر حرکت",
                  body: "با چرخش گوشی، صحنه و دوربین جوابت را می‌دهند.",
                },
                {
                  Icon: Vibrate,
                  title: "بازخورد لمسی",
                  body: "هر پیش‌بینی و هر برد، در دستت حس می‌شود.",
                },
              ].map(({ Icon, title, body }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="rounded-xl border border-glass-white-10 bg-glass-black-40 p-2 text-primary-650">
                    <Icon className="size-6" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-neutral-900">{title}</span>
                    <span className="block text-xs leading-xs text-neutral-550">{body}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { src: "/media/img-gamepad.webp", alt: "دستهٔ بازی ووکسل" },
                { src: "/media/img-treasure.webp", alt: "گنج ووکسل" },
                { src: "/media/img-users.webp", alt: "جمعیت ووکسل" },
              ].map((img) => (
                <img
                  key={img.src}
                  src={assetPath(img.src)}
                  alt={img.alt}
                  loading="lazy"
                  className="aspect-[11/6] w-full rounded-xl border border-glass-white-10 object-cover"
                />
              ))}
            </div>

            <button
              onClick={() => void begin(true)}
              disabled={busy}
              className="mt-6 w-full rounded-xl bg-primary-500 py-3 text-md font-extrabold text-neutral-white transition-transform duration-300 hover:scale-[1.02] disabled:opacity-60"
              style={{ transitionTimingFunction: "cubic-bezier(0.87,0,0.13,1)" }}
            >
              شروع با تجربهٔ کامل
            </button>
            <button
              onClick={() => void begin(false)}
              disabled={busy}
              className="mt-2 w-full rounded-xl border border-glass-white-10 bg-glass-black-40 py-3 text-sm font-bold text-neutral-850 transition-colors duration-300 hover:bg-glass-black-60 disabled:opacity-60"
              style={{ transitionTimingFunction: "cubic-bezier(0.87,0,0.13,1)" }}
            >
              ادامه بدون صدا
            </button>
            <p className="mt-4 text-center text-2xs leading-2xs text-neutral-400">
              نمونهٔ آزمایشی — بدون پول واقعی. با شروع، موسیقی محیطی پخش می‌شود
              و می‌توانی هر وقت از بالای صفحه خاموشش کنی.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
