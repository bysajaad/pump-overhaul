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
import { Gamepad, Gift, Play, Users } from "@/components/icons";
import { TiltMicrocopy } from "@/components/TiltMicrocopy";
import { faCompactToman, faNum } from "@/lib/format";
import { assetPath } from "@/lib/base-path";

/**
 * Beat composition.
 *
 * The 3D stage is fixed behind everything; these sections are the DOM overlay
 * scrolling above it, and scroll position drives the camera. Content and
 * semantics live here — the canvas is aria-hidden — so the page still means
 * something without WebGL even though a dedicated no-WebGL tier is out of scope.
 */

/**
 * Copy sits on a glass panel rather than directly on the scene.
 *
 * The vessel is a large, bright, high-frequency surface, and camera distance
 * alone is not a reliable guarantee of contrast at every scroll position. Using
 * the brand's existing glass-over-dark depth model keeps legibility structural
 * instead of hoping the composition cooperates.
 */
function Beat({
  title,
  children,
  align = "center",
  img,
}: {
  title: string;
  children: ReactNode;
  /**
   * `top` parks the panel against the top of the viewport instead of centring
   * it. Used for the wide pull-back beat, where a centred panel sits exactly
   * over the podium and hides the geometry the beat is about.
   */
  align?: "center" | "top";
  /** Regenerated clay motif beside the title — illustration, never chrome. */
  img?: { src: string; alt: string };
}) {
  return (
    <section
      className={`mx-auto flex min-h-dvh max-w-[36rem] flex-col px-5 ${
        align === "top" ? "justify-start pt-[8vh]" : "justify-center"
      }`}
    >
      <div className="parallax-panel rounded-3xl border border-glass-white-10 bg-glass-black-60 p-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          {img && (
            <img
              src={assetPath(img.src)}
              alt={img.alt}
              loading="lazy"
              className="size-16 shrink-0 rounded-2xl border border-glass-white-10 object-cover"
            />
          )}
          <h2 className="text-2xl font-extrablack leading-2xl text-neutral-white">{title}</h2>
        </div>
        <div className="mt-4 flex flex-col gap-4">{children}</div>
      </div>
    </section>
  );
}

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
        {/* -- Beat 1: Pressure. Playable before anything is explained. ----- */}
        <section className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-16">
          <PoolReadout />
          <CallInstrument />
          <TiltMicrocopy />
          <p className="max-w-[27.5rem] text-center text-2xs text-neutral-400">
            نمونهٔ آزمایشی — بدون پول واقعی و بدون جایزهٔ واقعی
          </p>
        </section>

        {/* -- Beat 2: the mechanic, now that it has been felt -------------- */}
        <Beat
          title="جایزه را جمع باد می‌کند"
          img={{ src: "/media/img-treasure.webp", alt: "تپهٔ گنج ووکسل با تاج طلایی" }}
        >
          <p className="text-md leading-md text-neutral-850">
            هر بازی که هر کاربری انجام می‌دهد، به فشار مخزن اضافه می‌کند. جایزهٔ هفتگی عدد
            ثابتی نیست که از قبل تعیین شده باشد — با بازی‌کردن همه بزرگ می‌شود، و سهم هر کس
            از آن، به اندازهٔ بازی‌اش است.
          </p>
          <p className="text-md leading-md text-neutral-550">
            این تنها مکانیک محصول است که به‌تنهایی یک تصویر است. مخزنی که همین حالا بالای
            سرت دارد پر می‌شود، همان چیزی است که متن‌ها توضیح می‌دادند.
          </p>
        </Beat>

        {/* -- Beat 3: even losing pays ------------------------------------- */}
        <Beat
          title="باخت هم پامپز دارد"
          img={{ src: "/media/img-gift.webp", alt: "جعبهٔ هدیهٔ ووکسل با نور طلایی" }}
        >
          <p className="text-md leading-md text-neutral-850">
            اگر اشتباه پیش‌بینی کنی، چیزی از دست نمی‌دهی — بازهم پامپز می‌گیری، فقط کمتر. این
            سخاوتمندانه‌ترین قاعدهٔ پامپ است و امروز فقط در پرسش‌های متداول نوشته شده. اینجا
            دیده می‌شود: مخزن در باخت خالی نمی‌شود، فقط فشارش را رها می‌کند.
          </p>
        </Beat>

        {/* -- Beat 4: the path, which the camera climbs here ---------------- */}
        <Beat
          title="مسیر ۲۵ پله‌ای، این‌بار به‌عنوان ساز"
          img={{ src: "/media/img-coin.webp", alt: "سکهٔ درب‌بطری طلایی با نشان پ" }}
        >
          <p className="text-md leading-md text-neutral-850">
            همان ۲۵ پلهٔ رسیدن به جایزهٔ بزرگ، اما نه به‌شکل یک تصویر ثابت. پله‌ها دور مخزن
            بالا می‌روند و هر کدام با پر شدن استخر روشن می‌شوند — پله‌ای که همین حالا در حال
            به‌دست‌آمدن است، نفس می‌کشد.
          </p>
          <p className="text-md leading-md text-neutral-550">
            تفاوت میان نمودارِ یک مکانیک و خودِ مکانیک، همین است.
          </p>
        </Beat>

        {/* -- Beat 5: the crowd, in numbers -------------------------------- */}
        <Beat
          title="این فشار از کجا می‌آید"
          align="top"
          img={{ src: "/media/img-users.webp", alt: "جمعیت مجسمه‌های ووکسل" }}
        >
          <dl className="grid grid-cols-2 gap-4">
            {[
              { label: "کاربر فعال", value: `${faNum(4)}+ میلیون`, Icon: Users },
              { label: "بازدید یوتیوب", value: `${faNum(105)}+ میلیون`, Icon: Play },
              {
                label: "مجموع جوایز پرداختی",
                value: `${faCompactToman(87_455_950_900)} تومان`,
                Icon: Gift,
              },
              { label: "نفرات جایزه‌گرفته", value: faNum(1_272_998), Icon: Gamepad },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-glass-white-10 bg-glass-black-40 p-4"
              >
                <stat.Icon className="mb-2 size-10 text-primary-650" />
                <dd className="text-lg font-extrabold text-primary-600">{stat.value}</dd>
                <dt className="mt-1 text-xs text-neutral-550">{stat.label}</dt>
              </div>
            ))}
          </dl>
          <p className="text-2xs text-neutral-400">
            اعداد از صفحهٔ فعلی pumpgame.ir برداشته شده‌اند.
          </p>
        </Beat>

        {/* -- Beat 6: the ask, which is just "keep playing" ---------------- */}
        <section className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5 text-center">
          <div className="parallax-panel rounded-3xl border border-glass-white-10 bg-glass-black-60 p-6 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <img
                src={assetPath("/media/img-phone.webp")}
                alt="گوشی ووکسل با صحنهٔ بازی روی صفحه"
                loading="lazy"
                className="size-16 shrink-0 rounded-2xl border border-glass-white-10 object-cover"
              />
              <h2 className="max-w-[30rem] text-2xl font-extrablack leading-2xl text-neutral-white">
                دعوت پایانی، «نصب کن» نیست
              </h2>
            </div>
            <p className="mt-4 max-w-[32rem] text-md leading-md text-neutral-850">
              تو از دقیقهٔ اول بازی کردی. چیزی نمانده که برای شروع لازم باشد — فقط ادامه دادن.
            </p>
          </div>
          <div className="w-full max-w-[27.5rem]">
            <CallInstrument />
          </div>
        </section>

        <footer className="px-5 py-10 text-center text-2xs text-neutral-400">
          نمونهٔ آزمایشی طراحی — وابسته یا منتشرشده توسط پامپ نیست.
        </footer>
          </main>
          </AudioProvider>
        </GameProvider>
      </InputProvider>
    </PressureProvider>
  );
}
