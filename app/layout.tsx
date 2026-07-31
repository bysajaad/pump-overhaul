import type { Metadata, Viewport } from "next";
import "./globals.css";
import { assetPath } from "@/lib/base-path";

const deploymentHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? (deploymentHost ? `https://${deploymentHost}` : "http://localhost:3000"),
);
const metadataBase = new URL(siteUrl.origin);

export const metadata: Metadata = {
  metadataBase,
  title: "پامپ — فشار جمعی",
  description:
    "نمونهٔ آزمایشی صفحهٔ فرود پامپ: جایزه با بازی‌کردنِ جمع باد می‌کند و از ثانیهٔ اول می‌توانی بازی کنی.",
  openGraph: { images: [assetPath("/media/poster-hero.webp")] },
  other: { "format-detection": "telephone=no" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  // The stage is a fixed 3D viewport; zoom would fight the camera rig.
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa-IR" dir="rtl" translate="no">
      {/* No background utility here — see globals.css: the stage renders behind. */}
      <body className="text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
