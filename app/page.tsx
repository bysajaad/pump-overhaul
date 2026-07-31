import type { ReactNode } from "react";
import { PressureProvider } from "@/components/PressureProvider";
import { Stage } from "@/components/scene/Stage";
import { PoolReadout } from "@/components/PoolReadout";
import { CallInstrument } from "@/components/CallInstrument";
import { GameProvider } from "@/components/GameProvider";
import { InputProvider } from "@/components/InputProvider";
import { AudioProvider } from "@/components/AudioProvider";
import { Onboarding } from "@/components/Onboarding";
import { Header } from "@/components/Header";
import { AnimMedia } from "@/components/AnimMedia";
import { Chevron } from "@/components/icons";
import { TiltMicrocopy } from "@/components/TiltMicrocopy";
import { faCompactToman, faNum } from "@/lib/format";
import { assetPath } from "@/lib/base-path";

/**
 * Beat composition.
 *
 * The 3D stage is fixed behind everything; these sections are the DOM overlay
 * scrolling above it, and scroll position drives the camera. Content mirrors
 * the live pumpgame.ir landing — same sections, same illustrations (the
 * animated ones are generated loops seeded from the production rasters) —
 * staged inside the brand's glass-over-dark depth model.
 */

/** Glass panel shared by every beat; contrast is structural, not hoped for. */
function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`parallax-panel rounded-3xl border border-glass-white-10 bg-glass-black-60 p-6 backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

function Beat({
  children,
  align = "center",
  wide = false,
}: {
  children: ReactNode;
  align?: "center" | "top";
  wide?: boolean;
}) {
  return (
    <section
      className={`mx-auto flex min-h-dvh w-full flex-col px-5 ${
        wide ? "max-w-[46rem]" : "max-w-[36rem]"
      } ${align === "top" ? "justify-start pt-[10vh]" : "justify-center"}`}
    >
      {children}
    </section>
  );
}

/** The 25 prize steps, exactly as the live site's campaign carousel. */
const STEPS = [
  "ذره", "قاشق", "فنجون", "کتری", "کاسه", "ماهی‌تابه", "قابلمه", "سینی", "سطل",
  "ساک", "سامسونت", "گونی", "چرخ دستی", "فرغون", "بشکه", "موتور", "سه چرخه",
  "وانت", "نیسان", "خاور", "کامیون", "کانتینر", "قایق", "کشتی", "کوه",
];

const FAQ = [
  {
    q: "جایزه این هفته چطور بیشتر می‌شه؟",
    a: "با هر بازی‌ای که کاربران انجام می‌دن، به جایزهٔ هفتگی اضافه می‌شه. عدد از قبل ثابت نیست — هرچه بیشتر بازی بشه، جایزه بزرگتر می‌شه.",
  },
  {
    q: "چطوری می‌تونم جایزه بگیرم؟",
    a: "بازی کن و پامپز جمع کن. سهم هر کس از جایزهٔ هفتگی به اندازهٔ بازی‌ها و پامپزهاییه که جمع کرده.",
  },
  {
    q: "چطوری با بازی کردن پامپز بگیرم؟",
    a: "هر پیش‌بینی پامپز داره — حتی اگه اشتباه پیش‌بینی کنی، چیزی از دست نمی‌دی و فقط پامپز کمتری می‌گیری.",
  },
  {
    q: "چرا در بازی‌های بعدی پامپز بیشتری می‌گیرم؟",
    a: "بازیِ پیوسته پاداش داره: هرچه بیشتر بازی کنی، پامپزهای هر دور بیشتر می‌شه.",
  },
  {
    q: "با دعوت از دوستان هم پامپز می‌گیرم؟",
    a: "بله، دعوت از دوستان و انجام ماموریت‌ها هم پامپز اضافه می‌کنه.",
  },
  {
    q: "جایزه چه زمانی واریز می‌شه؟",
    a: "بعد از پایان مسابقهٔ هفتگی و مشخص شدن سهم هر کاربر.",
  },
];

export default function Home() {
  return (
    <PressureProvider>
      <InputProvider>
        <GameProvider>
          <AudioProvider>
          <Header />
          <Stage />
          <Onboarding />

      <main className="relative z-10">
        {/* -- Beat 1: Hero. Playable before anything is explained. --------- */}
        <section id="play" className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 pb-16 pt-[12vh]">
          <div className="parallax-panel flex flex-col items-center gap-2 text-center">
            <h1 className="max-w-[30rem] text-2xl font-extrablack leading-2xl text-neutral-white">
              بازی کن، پامپز بگیر و هر هفته جایزه ببر
            </h1>
            <p className="text-md text-neutral-850">
              تا <strong className="font-extrablack text-primary-600">{faNum(100_000)} تتر</strong> جایزه
            </p>
          </div>
          <PoolReadout />
          <CallInstrument />
          <TiltMicrocopy />
          <p className="max-w-[27.5rem] text-center text-2xs text-neutral-400">
            نمونهٔ آزمایشی — بدون پول واقعی و بدون جایزهٔ واقعی
          </p>
        </section>

        {/* -- Beat 2: the 25-step prize path, as the live site stages it --- */}
        <Beat wide>
          <Panel>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrablack leading-2xl text-neutral-white">
                  مسیر رسیدن به <span className="whitespace-nowrap">{faNum(100_000)} تتر</span>
                </h2>
                <p className="mt-1 text-sm text-neutral-550">
                  بازی بیشتر، جایزه بزرگتر — جایزهٔ هفتگی با تعداد کل بازی‌ها افزایش پیدا می‌کنه.
                </p>
              </div>
              <img
                src={assetPath("/media/original/pumps-coin.png")}
                alt="سکهٔ پامپز"
                loading="lazy"
                className="size-16 shrink-0"
              />
            </div>
            <div
              className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
              aria-label="پله‌های جایزه"
            >
              {STEPS.map((name, index) => (
                <figure
                  key={name}
                  className={`flex w-20 shrink-0 snap-center flex-col items-center gap-1 rounded-2xl border p-2 ${
                    index === 0
                      ? "border-glass-primary-50 bg-glass-primary-10"
                      : "border-glass-white-10 bg-glass-black-40"
                  }`}
                >
                  <img
                    src={assetPath(`/media/original/steps/${index + 1}.png`)}
                    alt={name}
                    loading="lazy"
                    className="size-12 object-contain"
                  />
                  <figcaption className="text-2xs text-neutral-850">{name}</figcaption>
                  {index === 0 && (
                    <span className="rounded-full bg-primary-500 px-2 text-[0.5625rem] font-bold text-neutral-white">
                      فعال شده
                    </span>
                  )}
                </figure>
              ))}
            </div>
            <p className="mt-2 text-2xs text-neutral-400">
              پلهٔ اول: {faNum(100)} تتر جایزهٔ اولیه — از یک ذره شروع می‌شه و به کوه می‌رسه.
            </p>
          </Panel>
        </Beat>

        {/* -- Beat 3: the games, with the live site's own cards ------------ */}
        <Beat wide>
          <Panel>
            <h2 className="text-2xl font-extrablack leading-2xl text-neutral-white">
              بازی کن و پامپز بگیر
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {/* Coin price — playable right here */}
              <article className="flex flex-col overflow-hidden rounded-2xl border border-glass-primary-30 bg-glass-black-40">
                <AnimMedia
                  video="/media/eth-loop.mp4"
                  poster="/media/original/bitcoin-up-down.png"
                  alt="سکهٔ اتریوم با پیکان‌های سبز بالا و قرمز پایین"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="flex grow flex-col gap-2 p-4">
                  <div className="flex items-center gap-2">
                    <img src={assetPath("/media/original/eth-logo.png")} alt="" className="size-8 rounded-lg" />
                    <h3 className="text-md font-extrabold text-neutral-white">پیش‌بینی قیمت کوین</h3>
                  </div>
                  <p className="grow text-xs leading-sm text-neutral-550">
                    قیمت اتریوم رو پیش‌بینی کن و پامپز بگیر. اگه درست بگی، بازم پامپز جایزه می‌گیری.
                  </p>
                  <a
                    href="#play"
                    className="mt-1 rounded-xl bg-primary-500 py-2 text-center text-sm font-extrabold text-neutral-white transition-transform duration-300 hover:scale-[1.03]"
                    style={{ transitionTimingFunction: "cubic-bezier(0.87,0,0.13,1)" }}
                  >
                    همین‌جا بازی کن
                  </a>
                </div>
              </article>

              {/* Footpump — static original art: video models cannot preserve
                  real-player likeness (filtered), so a loop would not be the
                  same illustration. */}
              <article className="flex flex-col overflow-hidden rounded-2xl border border-glass-white-10 bg-glass-black-40">
                <img
                  src={assetPath("/media/original/footpump.webp")}
                  alt="کارت‌های فوتبالی رونالدو و مسی روبه‌روی هم"
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="flex grow flex-col gap-2 p-4">
                  <div className="flex items-center gap-2">
                    <img src={assetPath("/media/original/footpump-logo.png")} alt="" className="size-8 rounded-lg" />
                    <h3 className="text-md font-extrabold text-neutral-white">فوتپامپ</h3>
                  </div>
                  <p className="grow text-xs leading-sm text-neutral-550">
                    بازی کارتی فوتبالی رو شروع کن و پامپز بگیر؛ اگه برنده بشی بازم پامپز جایزه می‌گیری.
                  </p>
                  <span className="mt-1 rounded-xl border border-glass-white-10 py-2 text-center text-xs text-neutral-400">
                    در اپ پامپ
                  </span>
                </div>
              </article>

              {/* Football prediction */}
              <article className="flex flex-col overflow-hidden rounded-2xl border border-glass-white-10 bg-glass-black-40">
                <div className="flex aspect-[4/3] w-full items-center justify-center gap-6 bg-glass-primary-10">
                  <img
                    src={assetPath("/media/original/esteghlal.png")}
                    alt="استقلال"
                    loading="lazy"
                    className="size-24 object-contain"
                  />
                  <img
                    src={assetPath("/media/original/persepolis.png")}
                    alt="پرسپولیس"
                    loading="lazy"
                    className="size-24 object-contain"
                  />
                </div>
                <div className="flex grow flex-col gap-2 p-4">
                  <div className="flex items-center gap-2">
                    <img src={assetPath("/media/original/football-logo.png")} alt="" className="size-8 rounded-lg" />
                    <h3 className="text-md font-extrabold text-neutral-white">پیش‌بینی فوتبال</h3>
                  </div>
                  <p className="grow text-xs leading-sm text-neutral-550">
                    نتیجه بازی رو پیش‌بینی کن و پامپز بگیر. اگه درست بگی، بازم پامپز جایزه می‌گیری.
                  </p>
                  <span className="mt-1 rounded-xl border border-glass-white-10 py-2 text-center text-xs text-neutral-400">
                    در اپ پامپ
                  </span>
                </div>
              </article>
            </div>
          </Panel>
        </Beat>

        {/* -- Beat 4: the crowd, in the live site's own numbers ------------ */}
        <Beat align="top" wide>
          <Panel>
            <h2 className="text-2xl font-extrablack leading-2xl text-neutral-white">
              پامپ در یک نگاه
            </h2>
            <dl className="mt-5 grid grid-cols-2 gap-4">
              {[
                {
                  img: "/media/original/total-prize-1.png",
                  alt: "مجموع جوایز پرداختی",
                  value: `${faCompactToman(87_455_950_900)} تومان`,
                  label: `مجموع جوایز پرداختی برای ${faNum(1_293_082)} نفر`,
                },
                {
                  img: "/media/original/users-2.png",
                  alt: "کاربران فعال",
                  value: `${faNum(4)}+ میلیون`,
                  label: "کاربر فعال در پامپ",
                },
                {
                  img: "/media/original/youtube.png",
                  alt: "بازدید یوتیوب",
                  value: `${faNum(105)}+ میلیون`,
                  label: "بازدید یوتیوب پامپ",
                },
                {
                  img: "/media/original/steps/25.png",
                  alt: "بزرگترین پله",
                  value: `${faNum(100_000)} تتر`,
                  label: "سقف جایزهٔ هفتگی",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-glass-white-10 bg-glass-black-40 p-4"
                >
                  <img src={assetPath(stat.img)} alt={stat.alt} loading="lazy" className="mb-2 size-12 object-contain" />
                  <dd className="text-lg font-extrabold text-primary-600">{stat.value}</dd>
                  <dt className="mt-1 text-xs text-neutral-550">{stat.label}</dt>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-2xs text-neutral-400">
              اعداد از صفحهٔ فعلی pumpgame.ir برداشته شده‌اند.
            </p>
          </Panel>
        </Beat>

        {/* -- Beat 5: the live site's FAQ ---------------------------------- */}
        <Beat>
          <Panel>
            <div className="flex items-center gap-3">
              <img
                src={assetPath("/media/original/question-mark.svg")}
                alt=""
                className="size-10"
              />
              <h2 className="text-2xl font-extrablack leading-2xl text-neutral-white">
                سوالات پرتکرار
              </h2>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-glass-white-10 bg-glass-black-40 px-4 py-3 open:border-glass-primary-30"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-neutral-900 [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <Chevron className="size-5 shrink-0 text-primary-650 transition-transform duration-300 group-open:rotate-90" />
                  </summary>
                  <p className="mt-2 text-xs leading-sm text-neutral-550">{item.a}</p>
                </details>
              ))}
            </div>
          </Panel>
        </Beat>

        {/* -- Beat 6: the ask, staged like the live site's app CTA --------- */}
        <Beat>
          <Panel className="text-center">
            <h2 className="text-2xl font-extrablack leading-2xl text-neutral-white">
              برای شروع آماده‌ای؟
            </h2>
            <p className="mt-2 text-sm text-neutral-550">
              برای تجربه بهتر، اپ پامپ را نصب کنید.
            </p>
            <div className="mx-auto mt-4 max-w-[16rem] overflow-hidden rounded-3xl border border-glass-white-10">
              <img
                src={assetPath("/media/original/application-2.png")}
                alt="اپلیکیشن پامپ روی گوشی"
                loading="lazy"
                className="w-full object-cover"
              />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <a
                href="https://cafebazaar.ir/app/ir.pumpgame"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-primary-500 py-3 text-sm font-extrabold text-neutral-white transition-transform duration-300 hover:scale-[1.03]"
                style={{ transitionTimingFunction: "cubic-bezier(0.87,0,0.13,1)" }}
              >
                دانلود نسخه اندروید
              </a>
              <a
                href="https://pwa.pumpgame.ir/"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-glass-white-10 bg-glass-black-40 py-3 text-sm font-bold text-neutral-850 transition-colors duration-300 hover:bg-glass-black-60"
              >
                نسخه وب‌اپلیکیشن
              </a>
            </div>
            <p className="mt-3 text-2xs text-neutral-400">
              اینجا هم از دقیقهٔ اول می‌شود بازی کرد — <a href="#play" className="text-primary-650 underline underline-offset-4">برگرد به پیش‌بینی</a>.
            </p>
          </Panel>
        </Beat>

        <footer className="safe-bottom px-5 pt-4 text-center">
          {/* Footer copy sits over the bright path geometry at the bottom of
              the flight — a brand-dark gradient keeps it readable. */}
          <div
            className="flex flex-col items-center gap-3 rounded-3xl px-4 py-5"
            style={{ background: "linear-gradient(to top, #16040df2 55%, #16040d00)" }}
          >
            <img
              src={assetPath("/media/original/word-mark.png")}
              alt="پامپ"
              className="h-8 w-auto"
            />
            <p className="text-xs text-neutral-550">پلتفرم سرگرمی</p>
            <nav className="flex items-center gap-4 text-2xs text-neutral-400">
              <a href="https://t.me/pump_vod" target="_blank" rel="noreferrer" className="hover:text-primary-650">تلگرام</a>
              <a href="https://www.youtube.com/@pump_vod" target="_blank" rel="noreferrer" className="hover:text-primary-650">یوتیوب</a>
              <a href="https://www.instagram.com/pump_vod" target="_blank" rel="noreferrer" className="hover:text-primary-650">اینستاگرام</a>
              <a href="https://linkedin.com/company/pump_vod" target="_blank" rel="noreferrer" className="hover:text-primary-650">لینکدین</a>
            </nav>
            <p className="text-2xs text-neutral-400">
              نمونهٔ آزمایشی طراحی — وابسته یا منتشرشده توسط پامپ نیست.
            </p>
          </div>
        </footer>
          </main>
          </AudioProvider>
        </GameProvider>
      </InputProvider>
    </PressureProvider>
  );
}
