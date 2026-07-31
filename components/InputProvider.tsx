"use client";

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { TILT_GRANTED_EVENT } from "@/lib/useTiltPermission";

interface Point { x: number; y: number }

interface InputContextValue {
  pointer: RefObject<Point>;
  tilt: RefObject<Point>;
  progress: RefObject<number>;
  scrollVelocity: RefObject<number>;
  reducedMotion: RefObject<boolean>;
  tiltGranted: RefObject<boolean>;
}

const InputContext = createContext<InputContextValue | null>(null);

export function InputProvider({ children }: { children: ReactNode }) {
  const pointerTarget = useRef<Point>({ x: 0, y: 0 });
  const tiltTarget = useRef<Point>({ x: 0, y: 0 });
  const pointer = useRef<Point>({ x: 0, y: 0 });
  const tilt = useRef<Point>({ x: 0, y: 0 });
  const progress = useRef(0);
  const velocityTarget = useRef(0);
  const scrollVelocity = useRef(0);
  const reducedMotion = useRef(false);
  const tiltGranted = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const readMotion = () => { reducedMotion.current = media.matches; };
    const readPointer = (event: PointerEvent) => {
      pointerTarget.current.x = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      pointerTarget.current.y = -((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
    };
    let previousProgress = 0;
    let previousTime = performance.now();
    const readScroll = () => {
      const now = performance.now();
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const next = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const dt = Math.max(16, now - previousTime) / 1000;
      velocityTarget.current = (next - previousProgress) / dt;
      progress.current = next;
      previousProgress = next;
      previousTime = now;
    };
    const readTilt = (event: DeviceOrientationEvent) => {
      tiltTarget.current.x = Math.max(-1, Math.min(1, (event.gamma ?? 0) / 25));
      tiltTarget.current.y = Math.max(-1, Math.min(1, -((event.beta ?? 0) - 45) / 25));
    };
    const grantTilt = () => {
      if (tiltGranted.current) return;
      tiltGranted.current = true;
      window.addEventListener("deviceorientation", readTilt, { passive: true });
    };

    readMotion();
    readScroll();
    media.addEventListener("change", readMotion);
    window.addEventListener("pointermove", readPointer, { passive: true });
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", readScroll);
    window.addEventListener(TILT_GRANTED_EVENT, grantTilt);
    const orientation = (window as typeof window & { DeviceOrientationEvent?: typeof DeviceOrientationEvent }).DeviceOrientationEvent;
    if (orientation && !("requestPermission" in orientation)) grantTilt();

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const k = 1 - Math.exp(-dt * 7);
      const disabled = reducedMotion.current;
      pointer.current.x += ((disabled ? 0 : pointerTarget.current.x) - pointer.current.x) * k;
      pointer.current.y += ((disabled ? 0 : pointerTarget.current.y) - pointer.current.y) * k;
      tilt.current.x += ((disabled ? 0 : tiltTarget.current.x) - tilt.current.x) * k;
      tilt.current.y += ((disabled ? 0 : tiltTarget.current.y) - tilt.current.y) * k;
      scrollVelocity.current += ((disabled ? 0 : velocityTarget.current) - scrollVelocity.current) * k;
      velocityTarget.current *= Math.exp(-dt * 8);
      document.documentElement.style.setProperty("--par-x", `${(pointer.current.x + tilt.current.x) * 5}px`);
      document.documentElement.style.setProperty("--par-y", `${(pointer.current.y + tilt.current.y) * -5}px`);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener("change", readMotion);
      window.removeEventListener("pointermove", readPointer);
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", readScroll);
      window.removeEventListener(TILT_GRANTED_EVENT, grantTilt);
      window.removeEventListener("deviceorientation", readTilt);
    };
  }, []);

  const value = useMemo(() => ({ pointer, tilt, progress, scrollVelocity, reducedMotion, tiltGranted }), []);
  return <InputContext.Provider value={value}>{children}</InputContext.Provider>;
}

export function useInput() {
  const value = useContext(InputContext);
  if (!value) throw new Error("useInput must be used inside <InputProvider>");
  return value;
}
