"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { Vessel } from "./Vessel";
import { Crowd } from "./Crowd";
import { Path } from "./Path";
import { Podium } from "./Podium";
import { CameraRig } from "./CameraRig";
import { resolveFidelity, HIGH_FIDELITY, type Fidelity } from "@/lib/fidelity";

/**
 * The stage owns the viewport. The DOM overlay scrolls above it; the scene
 * itself never scrolls.
 *
 * Deliberate note on RTL: nothing in here mirrors. The 2D overlay flips for
 * `dir="rtl"`, but world space stays world space — mirroring the camera or
 * scene would invert the key light and flip the bottom-heavy pressure
 * metaphor, which is spatial, not linguistic.
 */
export function Stage() {
  // Fidelity resolves on the client only; SSR renders nothing (no canvas on
  // the server anyway), so there is no hydration mismatch to manage.
  const [fidelity, setFidelity] = useState<Fidelity>(HIGH_FIDELITY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFidelity(resolveFidelity());
    setReady(true);
  }, []);

  return (
    <div
      className="fixed inset-0 z-0"
      // Decorative: the overlay carries the actual content and semantics.
      aria-hidden="true"
    >
      <Canvas
        dpr={fidelity.dpr}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 4.2], fov: 42, near: 0.1, far: 60 }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          scene.fog = new THREE.Fog("#16040d", 8, 26);
        }}
      >
        <color attach="background" args={["#16040d"]} />

        {ready && (
          <>
            <CameraRig fidelity={fidelity} />
            <Vessel fidelity={fidelity} />
            <Path />
            <Podium />
            <Crowd fidelity={fidelity} />
          </>
        )}

        {ready && fidelity.postprocessing && (
          <EffectComposer>
            {/* Bloom is the single most expensive pass; it is what carries the
                brand magenta as light rather than as fill. */}
            <Bloom
              intensity={0.62}
              luminanceThreshold={0.62}
              luminanceSmoothing={0.22}
              mipmapBlur
            />
          </EffectComposer>
        )}
      </Canvas>

      {/* Legibility scrim.
          The vessel is a large, bright, high-frequency surface and Persian text
          sits directly over it. A vertical scrim buys contrast where the copy
          lives without flattening the silhouette at top and bottom, which is
          where the voxel stepping reads most clearly. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, #16040d00 0%, #16040d1a 22%, #16040d99 46%, #16040d99 62%, #16040d1a 84%, #16040d00 100%)",
        }}
      />
    </div>
  );
}
