"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePressure } from "@/components/PressureProvider";
import type { Fidelity } from "@/lib/fidelity";

function randomFactory() {
  let seed = 0x1234abcd;
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}

export function TreasureMound({ fidelity }: { fidelity: Fidelity }) {
  const count = fidelity.tier === "high" ? 220 : 60;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const { live } = usePressure();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const layout = useMemo(() => {
    const random = randomFactory();
    return Array.from({ length: count }, () => {
      const angle = random() * Math.PI * 2;
      const radius = Math.sqrt(random()) * 1.05;
      const height = (1 - radius / 1.05) * 0.62 + random() * 0.15;
      return [Math.cos(angle) * radius, height, Math.sin(angle) * radius, 0.06 + random() * 0.08] as const;
    });
  }, [count]);

  useEffect(() => {
    if (!mesh.current) return;
    layout.forEach((item, i) => {
      dummy.position.set(item[0], item[1], item[2]);
      dummy.scale.setScalar(item[3]);
      dummy.rotation.set(i * 0.7, i * 1.1, i * 0.3);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [dummy, layout]);

  useFrame((state) => {
    if (!group.current) return;
    const breathe = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.015 + live.current.surge * 0.04;
    group.current.scale.set(breathe, breathe, breathe);
  });

  return (
    <group ref={group} position={[0, -2.85, 0]}>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <boxGeometry />
        <meshStandardMaterial color="#ffbb00" roughness={0.5} flatShading />
      </instancedMesh>
      <group position={[0, 0.85, 0]}>
        <mesh><boxGeometry args={[0.72, 0.12, 0.18]} /><meshStandardMaterial color="#ffc933" roughness={0.45} /></mesh>
        {[-0.28, 0, 0.28].map((x, i) => (
          <mesh key={x} position={[x, 0.25 + (i === 1 ? 0.12 : 0), 0]}>
            <boxGeometry args={[0.16, 0.5 + (i === 1 ? 0.2 : 0), 0.16]} />
            <meshStandardMaterial color="#ffbb00" roughness={0.45} />
          </mesh>
        ))}
      </group>
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.72, 0.35 + (i % 3) * 0.1, Math.sin(angle) * 0.72]} scale={0.12}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={["#266fed", "#00b88a", "#f53d50"][i % 3]} roughness={0.38} />
          </mesh>
        );
      })}
    </group>
  );
}
