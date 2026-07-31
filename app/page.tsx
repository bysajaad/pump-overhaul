import { PressureProvider } from "@/components/PressureProvider";
import { Stage } from "@/components/scene/Stage";
import { PoolReadout } from "@/components/PoolReadout";
import { CallInstrument } from "@/components/CallInstrument";
import { faCompactToman, faNum } from "@/lib/format";

/**
 * Beat composition.
 *
 * The 3D stage is fixed behind everything; these sections are the DOM overlay
 * scrolling above it. Content and semantics live here — the canvas is
 * aria-hidden — so the page still means something without WebGL even though a
 * dedicated no-WebGL tier is out of scope.
 */
export default function Home() {
  return (
    <PressureProvider>
      <Stage />

      <main className="relative z-10">
        {/* -- Beat 1: Pressure. Playable before anything is explained. ----- */}
        <section className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-16">
          <PoolReadout />
          <CallInstrument />
          <p className="max-w-[27.5rem] text-center text-2xs text-neutral-400">
            نمونهٔ آزمایشی — بدون پول واقعی و بدون جایزهٔ واقعی
          </p>
        </section>

        {/* -- Beat 2: the mechanic, now that it has been felt -------------- */}
        <section className="mx-auto flex min-h-dvh max-w-[36rem] flex-col justify-center gap-5 px-5">
          <h2 className="text-2xl font-extrablack leading-2xl text-neutral-white">
            جایزه را جمع باد می‌کند
          </h2>
          <p className="text-md leading-md text-neutral-850">
            هر بازی که هر کاربری انجام می‌دهد، به فشار مخزن اضافه می‌کند. جایزهٔ هفتگی عدد
            ثابتی نیست که از قبل تعیین شده باشد — با بازی‌کردن همه بزرگ می‌شود، و سهم هر کس
            از آن، به اندازهٔ بازی‌اش است.
          </p>
          <p className="text-md leading-md text-neutral-550">
            این تنها مکانیک محصول است که به‌تنهایی یک تصویر است. مخزنی که همین حالا بالای
            سرت دارد پر می‌شود، همان چیزی است که متن‌ها توضیح می‌دادند.
          </p>
        </section>

        {/* -- Beat 3: even losing pays ------------------------------------- */}
        <section className="mx-auto flex min-h-dvh max-w-[36rem] flex-col justify-center gap-5 px-5">
          <h2 className="text-2xl font-extrablack leading-2xl text-neutral-white">
            باخت هم پامپز دارد
          </h2>
          <p className="text-md leading-md text-neutral-850">
            اگر اشتباه پیش‌بینی کنی، چیزی از دست نمی‌دهی — بازهم پامپز می‌گیری، فقط کمتر. این
            سخاوتمندانه‌ترین قاعدهٔ پامپ است و امروز فقط در پرسش‌های متداول نوشته شده. اینجا
            دیده می‌شود: مخزن در باخت خالی نمی‌شود، فقط فشارش را رها می‌کند.
          </p>
        </section>

        {/* -- Beat 4: the crowd, in numbers -------------------------------- */}
        <section className="mx-auto flex min-h-dvh max-w-[36rem] flex-col justify-center gap-6 px-5">
          <h2 className="text-2xl font-extrablack leading-2xl text-neutral-white">
            این فشار از کجا می‌آید
          </h2>
          <dl className="grid grid-cols-2 gap-4">
            {[
              { label: "کاربر فعال", value: `${faNum(4)}+ میلیون` },
              { label: "بازدید یوتیوب", value: `${faNum(105)}+ میلیون` },
              { label: "مجموع جوایز پرداختی", value: `${faCompactToman(87_455_950_900)} تومان` },
              { label: "نفرات جایزه‌گرفته", value: faNum(1_272_998) },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-glass-white-10 bg-glass-black-40 p-4 backdrop-blur-sm"
              >
                <dd className="text-lg font-extrabold text-primary-600">{stat.value}</dd>
                <dt className="mt-1 text-xs text-neutral-550">{stat.label}</dt>
              </div>
            ))}
          </dl>
          <p className="text-2xs text-neutral-400">
            اعداد از صفحهٔ فعلی pumpgame.ir برداشته شده‌اند.
          </p>
        </section>

        {/* -- Beat 5: the ask, which is just "keep playing" ---------------- */}
        <section className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5 text-center">
          <h2 className="max-w-[30rem] text-2xl font-extrablack leading-2xl text-neutral-white">
            دعوت پایانی، «نصب کن» نیست
          </h2>
          <p className="max-w-[32rem] text-md leading-md text-neutral-850">
            تو از دقیقهٔ اول بازی کردی. چیزی نمانده که برای شروع لازم باشد — فقط ادامه دادن.
          </p>
          <div className="w-full max-w-[27.5rem]">
            <CallInstrument />
          </div>
        </section>

        <footer className="border-t border-glass-white-10 px-5 py-10 text-center text-2xs text-neutral-400">
          نمونهٔ آزمایشی طراحی — وابسته یا منتشرشده توسط پامپ نیست.
        </footer>
      </main>
    </PressureProvider>
  );
}
