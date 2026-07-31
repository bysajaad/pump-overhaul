"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "@/components/GameProvider";
import { CoinMesh } from "@/components/scene/Coin";
import type { Fidelity } from "@/lib/fidelity";

export function CoinFlip({ fidelity }: { fidelity: Fidelity }) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const { state } = useGame();
  const visibility = useRef(0);

  useFrame((clock, delta) => {
    if (!group.current) return;
    const active = state.phase !== "idle";
    visibility.current += ((active ? 1 : 0) - visibility.current) * (1 - Math.exp(-delta * 7));
    const settled = state.phase === "settled";
    if (!settled) {
      group.current.rotation.x += delta * 7;
      group.current.rotation.y += delta * 3.5;
      if (material.current) {
        material.current.emissive.set("#000000");
        material.current.emissiveIntensity = 0;
      }
    } else {
      const wrong = state.call?.outcome === "wrong";
      group.current.rotation.x += ((wrong ? Math.PI / 2.7 : 0) - group.current.rotation.x) * (1 - Math.exp(-delta * 5));
      group.current.rotation.y += (0 - group.current.rotation.y) * (1 - Math.exp(-delta * 5));
      if (material.current) {
        material.current.emissive.set(wrong ? "#f53d50" : "#00b88a");
        material.current.emissiveIntensity = 0.7 + Math.sin(clock.clock.elapsedTime * 5) * 0.18;
      }
    }
    const deflate = settled && state.call?.outcome === "wrong" ? 0.72 : 1;
    group.current.scale.setScalar(visibility.current * deflate * 0.74);
    group.current.position.y = 1.35 + Math.sin(clock.clock.elapsedTime * 1.8) * 0.08;
  });

  return (
    <group ref={group} visible={state.phase !== "idle"}>
      <CoinMesh detail={fidelity.coinDetail} materialRef={material} />
    </group>
  );
}
