"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePressure } from "@/components/PressureProvider";

/**
 * The leaderboard, as furniture.
 *
 * Three voxel plinths sitting below the vessel, seen when the camera pulls back
 * at the crowd beat. Deliberately wordless: rank numbers and masked phone
 * numbers belong in the DOM overlay where they are selectable and legible to a
 * screen reader — putting text in the scene would mean shipping an SDF font
 * atlas for Persian glyphs to say something HTML already says better.
 *
 * The plinths breathe with surge so the podium belongs to the same living system
 * as everything else rather than reading as a static prop.
 */

const PLINTHS = [
  // [x, height, brightness] — centre is first place.
  { x: 0, height: 1.15, tone: 1.0 },
  { x: -0.85, height: 0.82, tone: 0.62 },
  { x: 0.85, height: 0.62, tone: 0.44 },
];

export function Podium() {
  const group = useRef<THREE.Group>(null);
  const { live } = usePressure();
  const elapsed = useRef(0);

  const colors = useMemo(
    () =>
      PLINTHS.map((p) =>
        new THREE.Color("#f42a8f").multiplyScalar(0.35 + p.tone * 0.65),
      ),
    [],
  );

  useFrame((_, delta) => {
    elapsed.current += delta;
    const { surge } = live.current;
    if (!group.current) return;

    group.current.children.forEach((child, i) => {
      const phase = elapsed.current * 1.6 + i * 0.9;
      // Slight vertical bob, amplified briefly by crowd activity.
      child.position.y =
        -3.1 + PLINTHS[i].height / 2 + Math.sin(phase) * (0.02 + surge * 0.06);
    });
  });

  return (
    <group ref={group}>
      {PLINTHS.map((p, i) => (
        <mesh key={i} position={[p.x, -3.1 + p.height / 2, 0]}>
          {/* Chunky and low-segment: same voxel language as vessel and path. */}
          <boxGeometry args={[0.66, p.height, 0.66]} />
          <meshBasicMaterial color={colors[i]} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
