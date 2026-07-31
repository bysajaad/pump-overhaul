"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useInput } from "@/components/InputProvider";
import type { Fidelity } from "@/lib/fidelity";
import { assetPath } from "@/lib/base-path";

export function EnvGlow({ fidelity }: { fidelity: Fidelity }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const sprite = useRef<THREE.Sprite>(null);
  const { pointer, tilt } = useInput();

  useEffect(() => {
    let alive = true;
    let loadedTexture: THREE.Texture | null = null;
    const src = assetPath("/media/env-glow.webp");
    void fetch(src, { method: "HEAD" }).then((response) => {
      if (!response.ok || !alive) return;
      new THREE.TextureLoader().load(src, (loaded) => {
        if (!alive) return loaded.dispose();
        loaded.colorSpace = THREE.SRGBColorSpace;
        loadedTexture = loaded;
        setTexture(loaded);
      });
    }).catch(() => undefined);
    return () => {
      alive = false;
      loadedTexture?.dispose();
    };
  }, []);

  useFrame(() => {
    if (!sprite.current) return;
    sprite.current.position.x = fidelity.parallax ? (pointer.current.x + tilt.current.x) * -0.25 : 0;
    sprite.current.position.y = fidelity.parallax ? (pointer.current.y + tilt.current.y) * -0.2 : 0;
  });

  if (!texture) return null;
  return (
    <sprite ref={sprite} position={[0, 0, -13]} scale={[22, 12, 1]}>
      <spriteMaterial map={texture} transparent opacity={0.6} depthWrite={false} toneMapped={false} />
    </sprite>
  );
}
