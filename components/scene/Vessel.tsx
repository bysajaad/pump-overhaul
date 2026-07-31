"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePressure } from "@/components/PressureProvider";
import { vesselFragmentShader, vesselVertexShader } from "@/lib/shaders/vessel";
import type { Fidelity } from "@/lib/fidelity";
import { useInput } from "@/components/InputProvider";

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
  const { pointer, tilt, scrollVelocity } = useInput();

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
   * Fit to the smaller screen dimension, measured at a FIXED reference distance.
   *
   * Two traps here. First, `fov` is vertical, so on a narrow portrait viewport
   * the horizontal field is far tighter and an unscaled radius-1 sphere swallows
   * the screen — hence sizing against min(width, height).
   *
   * Second, `useThree().viewport` is derived from the camera's current distance
   * to the origin, so using it would make the vessel visibly grow and shrink as
   * the camera rig flies. Deriving the frame from canvas aspect at a constant
   * reference distance keeps the object a fixed physical size in the world,
   * which is what lets the camera move around it convincingly.
   */
  const size = useThree((s) => s.size);
  const scale = useMemo(() => {
    const REF_DISTANCE = 4.2; // matches the rig's opening pose
    const FOV_DEG = 42;
    const frameHeight = 2 * Math.tan((FOV_DEG / 2) * THREE.MathUtils.DEG2RAD) * REF_DISTANCE;
    const frameWidth = frameHeight * (size.width / Math.max(1, size.height));
    return (0.66 * Math.min(frameWidth, frameHeight)) / 2;
  }, [size.width, size.height]);

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
      const inputX = fidelity.parallax ? pointer.current.x + tilt.current.x : 0;
      const inputY = fidelity.parallax ? pointer.current.y + tilt.current.y : 0;
      group.current.rotation.x = Math.sin(u.uTime.value * 0.21) * 0.08 + inputY * 0.06;
      group.current.rotation.z = -inputX * 0.06;
      const squash = fidelity.parallax ? Math.min(0.03, Math.abs(scrollVelocity.current) * 0.03) : 0;
      const xz = 1 / Math.sqrt(1 - squash);
      group.current.scale.set(scale * xz, scale * (1 - squash), scale * xz);
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
