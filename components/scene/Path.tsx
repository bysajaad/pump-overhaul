"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePressure } from "@/components/PressureProvider";
import { createCoinGeometry } from "@/components/scene/Coin";
import type { Fidelity } from "@/lib/fidelity";

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

export function Path({ fidelity }: { fidelity: Fidelity }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const coins = useRef<THREE.InstancedMesh>(null);
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
  const coinGeometry = useMemo(() => createCoinGeometry(fidelity.coinDetail), [fidelity.coinDetail]);

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
    if (coins.current) {
      layout.forEach((s, i) => {
        dummy.position.copy(s.pos).add(new THREE.Vector3(0, s.scale.y + 0.28, 0));
        dummy.rotation.set(0, s.rotY, 0);
        dummy.scale.setScalar(i === STEPS - 1 ? 0.42 : 0.3);
        dummy.updateMatrix();
        coins.current!.setMatrixAt(i, dummy.matrix);
      });
      coins.current.instanceMatrix.needsUpdate = true;
    }
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
      if (coins.current) {
        scratch.copy(pending).lerp(new THREE.Color("#ffbb00"), THREE.MathUtils.clamp(glow, 0, 1));
        coins.current.setColorAt(i, scratch);
        const s = layout[i];
        dummy.position.copy(s.pos).add(new THREE.Vector3(0, s.scale.y + 0.28, 0));
        dummy.rotation.set(elapsed.current * (0.35 + frontier * 1.8), s.rotY, Math.PI / 2);
        dummy.scale.setScalar(i === STEPS - 1 ? 0.42 : 0.3);
        dummy.updateMatrix();
        coins.current.setMatrixAt(i, dummy.matrix);
      }
    }
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    if (coins.current) {
      coins.current.instanceMatrix.needsUpdate = true;
      if (coins.current.instanceColor) coins.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={mesh} args={[undefined, undefined, STEPS]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={coins} args={[coinGeometry, undefined, STEPS]} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.48} metalness={0.08} flatShading />
      </instancedMesh>
    </group>
  );
}
