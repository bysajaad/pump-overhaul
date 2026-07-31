"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePressure } from "@/components/PressureProvider";
import { vesselFragmentShader, vesselVertexShader } from "@/lib/shaders/vessel";
import type { Fidelity } from "@/lib/fidelity";

/**
 * The hero object: the prize pool as a pressure vessel.
 *
 * It reads pressure from a ref every frame and never re-renders. All motion is
 * shader-side, so React is out of the animation path entirely.
 */
export function Vessel({ fidelity }: { fidelity: Fidelity }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const group = useRef<THREE.Group>(null);
  const { live, playerPulse } = usePressure();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPressure: { value: 0 },
      uSurge: { value: 0 },
      uVoxel: { value: 0.105 },
      uPlayerPulse: { value: 0 },
      uCoreColor: { value: new THREE.Color("#f42a8f") }, // primary-500
      uShellColor: { value: new THREE.Color("#601038") }, // primary-200
      uRimColor: { value: new THREE.Color("#f881bd") }, // primary-700
      uBands: { value: 4 },
    }),
    [],
  );

  /**
   * Fit to the smaller viewport dimension.
   *
   * A fixed scale is wrong here: `fov` is vertical, so on a narrow portrait
   * viewport the horizontal field is far tighter and a radius-1 sphere swallows
   * the screen. Sizing against min(width, height) in world units keeps the
   * vessel a hero on desktop and still leaves the copy readable on a phone.
   */
  const { viewport } = useThree();
  const scale = useMemo(
    () => (0.66 * Math.min(viewport.width, viewport.height)) / 2,
    [viewport.width, viewport.height],
  );

  // Detail drives the voxel silhouette: too few segments and quantization has
  // nothing to bite on, so this scales with fidelity rather than being fixed.
  const geometry = useMemo(
    () => new THREE.IcosahedronGeometry(1, fidelity.tier === "high" ? 24 : 10),
    [fidelity.tier],
  );

  useFrame((_, delta) => {
    const p = live.current;
    if (!material.current) return;

    const u = material.current.uniforms;
    u.uTime.value += delta;

    // Ease pressure toward its target: the pool jumps when a burst lands, but
    // the vessel should inflate, not teleport.
    u.uPressure.value += (p.pressure - u.uPressure.value) * Math.min(1, delta * 2.2);
    u.uSurge.value = p.surge;
    u.uPlayerPulse.value = playerPulse.current;

    if (group.current) {
      // A slow drift so the silhouette keeps revealing new facets.
      group.current.rotation.y += delta * 0.075;
      group.current.rotation.x = Math.sin(u.uTime.value * 0.21) * 0.08;
    }
  });

  return (
    <group ref={group} scale={scale}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={vesselVertexShader}
          fragmentShader={vesselFragmentShader}
        />
      </mesh>
    </group>
  );
}
