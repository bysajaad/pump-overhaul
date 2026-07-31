"use client";

import { useMemo, type RefObject } from "react";
import type { ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const PE = ["00110", "01110", "11010", "11110", "01110", "00010", "00010"];

export function createCoinGeometry(detail = 24) {
  const parts: THREE.BufferGeometry[] = [];
  const body = new THREE.CylinderGeometry(0.5, 0.5, 0.16, detail, 1, false);
  body.rotateX(Math.PI / 2);
  parts.push(body);

  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const flute = new THREE.BoxGeometry(0.09, 0.14, 0.21);
    flute.rotateZ(-angle);
    flute.translate(Math.cos(angle) * 0.49, Math.sin(angle) * 0.49, 0);
    parts.push(flute);
  }

  PE.forEach((row, y) => [...row].forEach((cell, x) => {
    if (cell !== "1") return;
    for (const face of [-1, 1]) {
      const relief = new THREE.BoxGeometry(0.075, 0.075, 0.035);
      relief.translate((x - 2) * 0.075, (3 - y) * 0.075, face * 0.095);
      parts.push(relief);
    }
  }));

  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  merged.computeVertexNormals();
  return merged;
}

export function CoinMesh({
  color = "#ffbb00",
  detail = 24,
  materialRef,
  ...props
}: { color?: string; detail?: number; materialRef?: RefObject<THREE.MeshStandardMaterial | null> } & ThreeElements["mesh"]) {
  const geometry = useMemo(() => createCoinGeometry(detail), [detail]);
  return (
    <mesh geometry={geometry} {...props}>
      <meshStandardMaterial ref={materialRef} color={color} roughness={0.48} metalness={0.08} flatShading />
    </mesh>
  );
}
