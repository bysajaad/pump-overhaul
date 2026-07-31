"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePressure } from "@/components/PressureProvider";
import type { Fidelity } from "@/lib/fidelity";
import { useInput } from "@/components/InputProvider";

/**
 * The crowd — millions of players as a volumetric field.
 *
 * Instanced voxel cubes (not points) so the field belongs to the same
 * clay-pixelate language as the vessel. Each cube rises, wraps, and brightens
 * on surge, which is what visually connects "people are playing" to "the
 * vessel is filling" — the causal link the current site only states in text.
 *
 * One InstancedMesh, matrices written directly. Nothing here allocates
 * per-frame.
 */
export function Crowd({ fidelity }: { fidelity: Fidelity }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { live } = usePressure();
  const { pointer, tilt } = useInput();

  const count = fidelity.crowdCount;

  // Deterministic layout so the field is identical across reloads.
  const seeds = useMemo(() => {
    const arr = new Float32Array(count * 4);
    // Cheap LCG — no Math.random, so SSR/client and reloads agree.
    let s = 0x9e3779b9;
    const next = () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
    for (let i = 0; i < count; i++) {
      const angle = next() * Math.PI * 2;
      // sqrt keeps the disc evenly filled instead of clustering at the centre.
      // Inner radius clears the vessel so the field never sits in front of it.
      const radius = 4.2 + Math.sqrt(next()) * 9.0;
      arr[i * 4 + 0] = Math.cos(angle) * radius;
      arr[i * 4 + 1] = (next() - 0.5) * 14;
      arr[i * 4 + 2] = Math.sin(angle) * radius;
      arr[i * 4 + 3] = 0.35 + next() * 0.9; // rise speed
    }
    return arr;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    elapsed.current += delta;
    const { surge, pressure } = live.current;

    for (let i = 0; i < count; i++) {
      const x = seeds[i * 4 + 0];
      const baseY = seeds[i * 4 + 1];
      const z = seeds[i * 4 + 2];
      const speed = seeds[i * 4 + 3];

      // Rise and wrap through a 14-unit column.
      let y = baseY + ((elapsed.current * speed) % 14);
      if (y > 7) y -= 14;

      dummy.position.set(x, y, z);

      // Surge makes the whole field swell briefly — the crowd "inhaling".
      const scale = 0.03 + surge * 0.035 + pressure * 0.01;
      dummy.scale.setScalar(scale);
      dummy.rotation.set(0, elapsed.current * 0.25 + i, 0);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;

    const mat = mesh.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.1 + surge * 0.26;
    const inputX = fidelity.parallax ? pointer.current.x + tilt.current.x : 0;
    const inputY = fidelity.parallax ? pointer.current.y + tilt.current.y : 0;
    mesh.current.position.x = inputX * -0.14;
    mesh.current.position.y = inputY * -0.14;
  });

  return (
    // Pushed behind the vessel: the crowd is depth and context, not foreground
    // confetti competing with the hero.
    <instancedMesh
      ref={mesh}
      position={[0, 0, -4]}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#f769b0" transparent opacity={0.2} toneMapped={false} />
    </instancedMesh>
  );
}
