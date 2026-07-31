"use client";

import { useEffect, useState } from "react";
import { TILT_GRANTED_EVENT } from "@/lib/useTiltPermission";

export function TiltMicrocopy() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = () => setVisible(true);
    window.addEventListener(TILT_GRANTED_EVENT, show);
    return () => window.removeEventListener(TILT_GRANTED_EVENT, show);
  }, []);
  if (!visible) return null;
  return <p className="text-2xs text-primary-700">دستگاهت را تکان بده — مخزن جواب می‌دهد</p>;
}
