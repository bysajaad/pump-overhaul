"use client";

import { useState } from "react";
import { assetPath } from "@/lib/base-path";

/**
 * An animated original illustration: a generated video loop seeded from the
 * production raster, with the static raster as poster and fallback. If the
 * video file is absent (originals stay local to the prototype) or the user
 * prefers reduced motion, the still renders instead.
 */
export function AnimMedia({
  video,
  poster,
  alt,
  className = "",
}: {
  /** Path under public/, e.g. /media/hero-loop.mp4 */
  video: string;
  /** Static original raster, shown until/if the video cannot play. */
  poster: string;
  alt: string;
  className?: string;
}) {
  const [videoOk, setVideoOk] = useState(true);

  if (!videoOk) {
    return <img src={assetPath(poster)} alt={alt} loading="lazy" className={className} />;
  }
  return (
    <video
      className={className}
      poster={assetPath(poster)}
      src={assetPath(video)}
      autoPlay
      loop
      muted
      playsInline
      aria-label={alt}
      ref={(el) => {
        if (el && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          el.pause();
        }
      }}
      onError={() => setVideoOk(false)}
    />
  );
}
