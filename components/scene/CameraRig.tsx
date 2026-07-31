"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Fidelity } from "@/lib/fidelity";
import { useInput } from "@/components/InputProvider";

/**
 * Scroll-driven camera flight.
 *
 * The page is one continuous world, so scrolling moves a camera rather than
 * swapping sections. Keyframes are sampled by normalised scroll progress and
 * eased, then the camera is damped toward the sampled pose — damping is what
 * separates "cinematic" from "glued to the scrollbar": a trackpad fling moves
 * progress instantly, and without smoothing the camera snaps and reads as a
 * jump cut.
 *
 * RTL note: nothing here mirrors. Camera keyframes are world-space staging, and
 * flipping them for `dir="rtl"` would invert the key light and put the pressure
 * metaphor on its head. Only the DOM overlay flips.
 */

interface Keyframe {
  /** Scroll progress this pose belongs to. */
  at: number;
  pos: [number, number, number];
  look: [number, number, number];
}

/**
 * The flight. Beats, in order: hold on the vessel while it is being played →
 * drift → descend to the foot of the path → climb it → pull back far enough to
 * see the crowd and podium → return to the vessel for the closing ask.
 */
const FLIGHT: Keyframe[] = [
  // Hero: close enough that the vessel is the whole proposition.
  { at: 0.0, pos: [0, 0.3, 4.2], look: [0, 0.38, 0] },
  // Copy beats need distance — a near camera makes the vessel swamp the text.
  { at: 0.18, pos: [1.0, 0.4, 5.4], look: [0, 0, 0] },
  // Foot of the path. Far enough out that the helix reads as one continuous
  // route wrapping the vessel — up close you only see disconnected slabs, and
  // the beat is about the route, not the individual step.
  { at: 0.36, pos: [6.6, -2.6, 6.6], look: [0, -1.5, 0] },
  // Climbing: same framing distance, carried upward past the vessel.
  { at: 0.56, pos: [6.2, 3.4, 6.2], look: [0, 1.4, 0] },
  // Wide enough to hold the crowd field and the podium together.
  { at: 0.78, pos: [0, -1.2, 11.0], look: [0, -2.0, 0] },
  // Return for the closing ask.
  { at: 1.0, pos: [0, 0, 5.0], look: [0, 0, 0] },
];

/** Smoothstep, so arrival at each keyframe decelerates instead of cornering. */
function ease(t: number): number {
  return t * t * (3 - 2 * t);
}

export function CameraRig({ fidelity }: { fidelity: Fidelity }) {
  const { progress, pointer, tilt, scrollVelocity } = useInput();
  const { camera } = useThree();

  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const targetLook = useMemo(() => new THREE.Vector3(), []);
  const currentLook = useRef(new THREE.Vector3(0, 0, 0));
  const currentRoll = useRef(0);

  useFrame((_, delta) => {
    // Reduced motion / low tier: hold the opening pose rather than fly.
    const t = fidelity.cameraOnScroll ? progress.current : 0;

    // Find the segment this progress falls in.
    let i = 0;
    while (i < FLIGHT.length - 2 && t > FLIGHT[i + 1].at) i++;
    const a = FLIGHT[i];
    const b = FLIGHT[i + 1];
    const span = b.at - a.at;
    const local = span > 0 ? ease(Math.min(1, Math.max(0, (t - a.at) / span))) : 0;

    targetPos.set(
      THREE.MathUtils.lerp(a.pos[0], b.pos[0], local),
      THREE.MathUtils.lerp(a.pos[1], b.pos[1], local),
      THREE.MathUtils.lerp(a.pos[2], b.pos[2], local),
    );
    targetLook.set(
      THREE.MathUtils.lerp(a.look[0], b.look[0], local),
      THREE.MathUtils.lerp(a.look[1], b.look[1], local),
      THREE.MathUtils.lerp(a.look[2], b.look[2], local),
    );

    if (fidelity.parallax) {
      const x = THREE.MathUtils.clamp(pointer.current.x + tilt.current.x, -1, 1);
      const y = THREE.MathUtils.clamp(pointer.current.y + tilt.current.y, -1, 1);
      targetPos.x += x * 0.35;
      targetPos.y += y * 0.35;
      targetLook.x += x * 0.08;
      targetLook.y += y * 0.08;
    }

    // Frame-rate independent damping.
    const k = 1 - Math.exp(-delta * 3.4);
    camera.position.lerp(targetPos, k);
    currentLook.current.lerp(targetLook, k);
    camera.lookAt(currentLook.current);
    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov = 42 + (fidelity.parallax ? Math.min(1, Math.abs(scrollVelocity.current)) * 1.5 : 0);
      camera.fov += (targetFov - camera.fov) * k;
      const targetRoll = fidelity.parallax ? -tilt.current.x * THREE.MathUtils.DEG2RAD * 1.5 : 0;
      currentRoll.current += (targetRoll - currentRoll.current) * k;
      camera.rotateZ(currentRoll.current);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
