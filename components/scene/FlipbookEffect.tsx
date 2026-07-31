"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "@/components/GameProvider";
import { flipbookFragmentShader, flipbookVertexShader } from "@/lib/shaders/flipbook";
import { usePressure } from "@/components/PressureProvider";

export function FlipbookEffect({
  src,
  count,
  tint,
  trigger = "settle",
}: {
  src: string;
  count: number;
  tint: string;
  trigger?: "settle" | "surge";
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const cursor = useRef(0);
  const startedAt = useRef(-Infinity);
  const { eventsRef } = useGame();
  const { live } = usePressure();
  const surgeActive = useRef(false);
  const camera = useThree((state) => state.camera);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const uniforms = useMemo(() => ({
    uAge: { value: 0 },
    uFrames: { value: 16 },
    uGrid: { value: 4 },
    uMap: { value: null as THREE.Texture | null },
    uOpacity: { value: 0 },
    uTint: { value: new THREE.Color(tint) },
  }), [tint]);

  useEffect(() => {
    let alive = true;
    let loadedTexture: THREE.Texture | null = null;
    void fetch(src, { method: "HEAD" }).then((response) => {
      if (!response.ok || !alive) return;
      new THREE.TextureLoader().load(src, (loaded) => {
        if (!alive) return loaded.dispose();
        loaded.colorSpace = THREE.SRGBColorSpace;
        loadedTexture = loaded;
        uniforms.uMap.value = loaded;
        setTexture(loaded);
      });
    }).catch(() => undefined);
    return () => {
      alive = false;
      loadedTexture?.dispose();
    };
  }, [src, uniforms]);

  useEffect(() => {
    if (!mesh.current) return;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      dummy.position.set(Math.cos(angle) * 0.35, -0.55 + (i % 2) * 0.22, Math.sin(angle) * 0.35);
      dummy.scale.setScalar(0.75 + (i % 3) * 0.16);
      dummy.lookAt(camera.position);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [camera, count, dummy, texture]);

  useFrame((state) => {
    if (mesh.current) {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        dummy.position.set(Math.cos(angle) * 0.35, -0.55 + (i % 2) * 0.22, Math.sin(angle) * 0.35);
        dummy.scale.setScalar(0.75 + (i % 3) * 0.16);
        dummy.lookAt(camera.position);
        dummy.updateMatrix();
        mesh.current.setMatrixAt(i, dummy.matrix);
      }
      mesh.current.instanceMatrix.needsUpdate = true;
    }
    if (trigger === "settle") {
      while (cursor.current < eventsRef.current.length) {
        const event = eventsRef.current[cursor.current++];
        if (event.type === "settle") startedAt.current = state.clock.elapsedTime;
      }
    } else {
      const active = live.current.surge > 0.52;
      if (active && !surgeActive.current) startedAt.current = state.clock.elapsedTime;
      surgeActive.current = active;
    }
    if (!material.current) return;
    const age = state.clock.elapsedTime - startedAt.current;
    material.current.uniforms.uAge.value = age / 1.2;
    material.current.uniforms.uOpacity.value = age >= 0 && age < 1.2 ? 1 - age / 1.2 : 0;
  });

  if (!texture) return null;
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={flipbookVertexShader}
        fragmentShader={flipbookFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
