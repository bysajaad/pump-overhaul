import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // A stray lockfile one directory up makes Turbopack infer the wrong root.
  turbopack: { root: import.meta.dirname },
  // GLSL lives in .ts template literals, so no loader is needed.
  experimental: {
    // R3F ships ESM-only helpers; keep tree-shaking predictable.
    optimizePackageImports: ["@react-three/drei"],
  },
};

export default nextConfig;
