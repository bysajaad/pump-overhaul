"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import * as THREE from "three";
import { MAP, TINTS } from "@/lib/brand/logo-map";
import { useInput } from "@/components/InputProvider";
import type { Fidelity } from "@/lib/fidelity";

const CELLS = MAP.flatMap((row, y) => [...row].flatMap((cell, x) => cell === "1" ? [{ x, y }] : []));

export function BrandMark({ fidelity }: { fidelity: Fidelity }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const { pointer, tilt } = useInput();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  // Pitch tracks the trace density (40×21) so the mark keeps its world size.
  const geometry = useMemo(() => new RoundedBoxGeometry(0.078, 0.078, 0.06, 2, 0.014), []);

  useEffect(() => {
    if (!mesh.current) return;
    for (let layer = 0; layer < 2; layer++) {
      CELLS.forEach((cell, index) => {
        const i = layer * CELLS.length + index;
        dummy.position.set(
          (cell.x - MAP[0].length / 2) * 0.072 + layer * 0.017,
          (MAP.length / 2 - cell.y) * 0.072,
          layer * -0.05,
        );
        dummy.updateMatrix();
        mesh.current!.setMatrixAt(i, dummy.matrix);
        color.set(TINTS[`${cell.x},${cell.y}`] ?? (layer ? "#941957" : "#f42a8f"));
        mesh.current!.setColorAt(i, color);
      });
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [color, dummy]);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.12;
    const inputX = fidelity.parallax ? pointer.current.x + tilt.current.x : 0;
    const inputY = fidelity.parallax ? pointer.current.y + tilt.current.y : 0;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.45) * 0.04 + inputY * 0.08;
    group.current.rotation.z = inputX * -0.08;
  });

  return (
    <group ref={group} position={[0, 2.35, 0]} scale={0.62}>
      <instancedMesh ref={mesh} args={[geometry, undefined, CELLS.length * 2]}>
        <meshStandardMaterial vertexColors roughness={0.55} flatShading />
      </instancedMesh>
    </group>
  );
}
