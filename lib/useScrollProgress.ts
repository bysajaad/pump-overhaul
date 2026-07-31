"use client";

import { useEffect, useRef } from "react";

/**
 * Normalised 0..1 document scroll progress, in a ref.
 *
 * A ref rather than state on purpose: the camera reads this every frame inside
 * useFrame, and putting scroll position in React state would re-render the tree
 * on every wheel event while providing nothing the DOM needs.
 *
 * Listener is passive so it never blocks scrolling, and the value is also
 * recomputed on resize because document height changes with reflow.
 */
export function useScrollProgress() {
  const progress = useRef(0);

  useEffect(() => {
    const read = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.current = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };

    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, []);

  return progress;
}
