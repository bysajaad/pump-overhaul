"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "@/components/GameProvider";
import { createCoinGeometry } from "@/components/scene/Coin";
import type { Fidelity } from "@/lib/fidelity";
import { FlipbookEffect } from "@/components/scene/FlipbookEffect";
import { assetPath } from "@/lib/base-path";

const LIFE = 1.6;

export function CoinBurst({ fidelity }: { fidelity: Fidelity }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { eventsRef } = useGame();
  const cursor = useRef(0);
  const startedAt = useRef(-Infinity);
  const outcome = useRef<"correct" | "wrong" | "flat">("correct");
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(() => createCoinGeometry(fidelity.coinDetail), [fidelity.coinDetail]);
  const trajectories = useMemo(() => {
    const data = new Float32Array(fidelity.burstCount * 6);
    let seed = 0x51f15e;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < fidelity.burstCount; i++) {
      const angle = random() * Math.PI * 2;
      const speed = 1.2 + random() * 1.8;
      data.set([Math.cos(angle) * speed, 2.2 + random() * 2.4, Math.sin(angle) * speed, random() * 6, random() * 5, 0.08 + random() * 0.1], i * 6);
    }
    return data;
  }, [fidelity.burstCount]);

  useFrame((state) => {
    if (!mesh.current) return;
    while (cursor.current < eventsRef.current.length) {
      const event = eventsRef.current[cursor.current++];
      if (event.type === "settle") {
        startedAt.current = state.clock.elapsedTime;
        outcome.current = event.outcome;
      }
    }
    const age = state.clock.elapsedTime - startedAt.current;
    const count = outcome.current === "wrong" ? Math.ceil(fidelity.burstCount * 0.45) : fidelity.burstCount;
    for (let i = 0; i < fidelity.burstCount; i++) {
      const base = i * 6;
      if (age < 0 || age > LIFE || i >= count) {
        dummy.scale.setScalar(0);
      } else {
        dummy.position.set(
          trajectories[base] * age,
          -0.2 + trajectories[base + 1] * age - 3.8 * age * age,
          trajectories[base + 2] * age,
        );
        dummy.rotation.set(age * trajectories[base + 3], age * trajectories[base + 4], i);
        dummy.scale.setScalar(trajectories[base + 5] * Math.sin((age / LIFE) * Math.PI));
      }
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    const material = mesh.current.material as THREE.MeshStandardMaterial;
    material.color.set(outcome.current === "wrong" ? "#f769b0" : "#ffbb00");
    material.opacity = age >= 0 && age <= LIFE ? Math.max(0, 1 - age / LIFE) : 0;
  });

  return (
    <group>
      <instancedMesh ref={mesh} args={[geometry, undefined, fidelity.burstCount]} frustumCulled={false}>
        <meshStandardMaterial transparent depthWrite={false} roughness={0.5} flatShading />
      </instancedMesh>
      {fidelity.spriteSheets && <FlipbookEffect src={assetPath("/media/puff-sheet.webp")} count={4} tint="#f881bd" />}
      {fidelity.spriteSheets && <FlipbookEffect src={assetPath("/media/spark-sheet.webp")} count={6} tint="#ffbb00" />}
    </group>
  );
}
