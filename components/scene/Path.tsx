"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePressure } from "@/components/PressureProvider";

/**
 * The path to the big prize — 25 steps, the same count the live site ships as
 * `campaign/steps/1..25.png`.
 *
 * Rebuilt as geometry rather than reusing their raster art: a helix of voxel
 * plinths climbing around the vessel, which the camera flies at mid-scroll.
 *
 * Critically it is driven by the *same* pressure model as the vessel, so steps
 * illuminate as the pool fills. That is the whole point — on the current site
 * the path is a static graphic, so it reads as a diagram of the mechanic
 * instead of an instrument of it.
 */

const STEPS = 25;
const RADIUS = 2.6;
const Y_BOTTOM = -2.4;
const Y_TOP = 3.4;

export function Path() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { live } = usePressure();

  // Static layout — computed once, never per frame.
  const layout = useMemo(() => {
    const out: { pos: THREE.Vector3; rotY: number; scale: THREE.Vector3 }[] = [];
    for (let i = 0; i < STEPS; i++) {
      const f = i / (STEPS - 1);
      const angle = f * Math.PI * 2.2;
      // The final step is the 100k goal: give it visible mass.
      const last = i === STEPS - 1;
      out.push({
        pos: new THREE.Vector3(
          Math.cos(angle) * RADIUS,
          THREE.MathUtils.lerp(Y_BOTTOM, Y_TOP, f),
          Math.sin(angle) * RADIUS,
        ),
        rotY: -angle,
        scale: last
          ? new THREE.Vector3(0.52, 0.34, 0.52)
          : new THREE.Vector3(0.34, 0.15, 0.34),
      });
    }
    return out;
  }, []);

  const reached = useMemo(() => new THREE.Color("#f42a8f"), []); // primary-500
  const pending = useMemo(() => new THREE.Color("#30081b"), []); // primary-100
  const scratch = useMemo(() => new THREE.Color(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const elapsed = useRef(0);

  // Matrices are static; write them once on mount.
  useEffect(() => {
    if (!mesh.current) return;
    layout.forEach((s, i) => {
      dummy.position.copy(s.pos);
      dummy.rotation.set(0, s.rotY, 0);
      dummy.scale.copy(s.scale);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [layout, dummy]);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    elapsed.current += delta;
    const { pressure, surge } = live.current;

    for (let i = 0; i < STEPS; i++) {
      const f = i / (STEPS - 1);
      // How far past this step the pool has climbed, softened at the frontier
      // so the leading step glows partially rather than snapping on.
      const fill = THREE.MathUtils.clamp((pressure - f) * 9 + 0.5, 0, 1);
      // The frontier step pulses — it is the one currently being earned.
      const frontier = Math.exp(-Math.abs(pressure - f) * 26);
      const glow = fill + frontier * (0.35 + surge * 0.5) * (0.6 + Math.sin(elapsed.current * 3.1) * 0.4);

      scratch.copy(pending).lerp(reached, THREE.MathUtils.clamp(glow, 0, 1));
      mesh.current.setColorAt(i, scratch);
    }
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, STEPS]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}
