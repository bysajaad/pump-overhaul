import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_PAGES === "true";
const basePath = githubPages ? "/pump-overhaul" : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(githubPages && {
    output: "export",
    basePath,
    assetPrefix: basePath,
    trailingSlash: true,
  }),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_STATIC_EXPORT: githubPages ? "true" : "false",
  },
  // A stray lockfile one directory up makes Turbopack infer the wrong root.
  turbopack: { root: import.meta.dirname },
  // GLSL lives in .ts template literals, so no loader is needed.
  experimental: {
    // R3F ships ESM-only helpers; keep tree-shaking predictable.
    optimizePackageImports: ["@react-three/drei"],
  },
};

export default nextConfig;
