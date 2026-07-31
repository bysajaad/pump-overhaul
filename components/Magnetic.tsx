"use client";

import { useRef, type ReactElement } from "react";
import { motion } from "motion/react";

export function Magnetic({ children }: { children: ReactElement<{ className?: string }> }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const node = ref.current;
    const rect = node?.getBoundingClientRect();
    if (!node || !rect) return;
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    node.style.setProperty("--mag-x", `${Math.max(-6, Math.min(6, x * 0.2))}px`);
    node.style.setProperty("--mag-y", `${Math.max(-6, Math.min(6, y * 0.2))}px`);
  };
  const reset = () => {
    ref.current?.style.setProperty("--mag-x", "0px");
    ref.current?.style.setProperty("--mag-y", "0px");
  };
  return (
    <motion.div
      ref={ref}
      className="magnetic"
      onPointerMove={move}
      onPointerLeave={reset}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.div>
  );
}
