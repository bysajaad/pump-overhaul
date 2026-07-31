/**
 * The vessel — clay-pixelate in a single material.
 *
 * The art rule from DESIGN.md is "form is voxel-quantized, material is soft
 * clay". Both halves are done in-shader rather than with modelled assets:
 *
 *  - Vertex: displace a sphere by pressure/breath/surge, then snap the result
 *    to a grid. Quantizing after displacement is what produces stepped, blocky
 *    terracing that shifts as the thing inflates — a pre-voxelized mesh would
 *    stay rigid and read as low-poly instead.
 *  - Fragment: derive the normal from screen-space derivatives of view
 *    position, so every quantized facet is genuinely flat and catches light as
 *    its own plane. Then wrap-light it and posterize the diffuse into bands —
 *    wrap for clay's soft falloff, banding for the 8-bit heritage.
 *
 * No noise texture and no external GLSL: everything is layered trigonometry on
 * the surface direction, which keeps it cheap and deterministic.
 */

export const vesselVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPressure;   // 0..1 pool fullness
  uniform float uSurge;      // 0..1 short-lived activity spike
  uniform float uVoxel;      // quantization grid size in object space
  uniform float uPlayerPulse;// 0..1 spike from the viewer's own play

  varying vec3 vViewPos;
  varying vec3 vDir;
  varying float vSwell;

  void main() {
    vec3 dir = normalize(position);

    // Idle breath — present even at rest so the vessel is never inert.
    float breathe = sin(uTime * 0.85 + dir.y * 2.1) * 0.018;

    // Slow asymmetric lobes keep the silhouette from reading as a plain ball.
    float lobes =
      sin(dir.x * 2.7 + uTime * 0.38) *
      cos(dir.z * 3.1 - uTime * 0.29) * 0.032;

    // Pressure is the main event: the vessel visibly fills.
    float swell = uPressure * 0.34;

    // Surge ripples travel bottom-to-top, like something rising through it.
    float ripple = uSurge * sin(dir.y * 13.0 - uTime * 6.5) * 0.055;

    // The viewer's own play hits harder and wider than crowd activity.
    float mine = uPlayerPulse * (0.07 + sin(dir.y * 5.0 - uTime * 9.0) * 0.05);

    float radius = 1.0 + breathe + lobes + swell + ripple + mine;
    vec3 displaced = dir * radius;

    // Snap to a voxel lattice. The grid must be COARSER than the underlying
    // triangle size or the tessellation shows through and the whole thing
    // reads as low-poly crystal instead of stacked cubes.
    // Loosens slightly under pressure, so it looks like it is straining.
    float grid = uVoxel * (1.0 + uPressure * 0.35);
    displaced = floor(displaced / grid + 0.5) * grid;

    vec4 viewPos = modelViewMatrix * vec4(displaced, 1.0);

    vViewPos = viewPos.xyz;
    vDir = dir;
    vSwell = swell + ripple + mine;

    gl_Position = projectionMatrix * viewPos;
  }
`;

export const vesselFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uPressure;
  uniform float uSurge;
  uniform vec3 uCoreColor;    // primary-500
  uniform vec3 uShellColor;   // primary-200, the unlit clay body
  uniform vec3 uRimColor;     // primary-700
  uniform float uBands;       // posterization steps

  varying vec3 vViewPos;
  varying vec3 vDir;
  varying float vSwell;

  void main() {
    // Flat per-facet normal. This is what makes the quantized form legible:
    // each voxel face lights as its own plane instead of being smoothed over.
    vec3 n = normalize(cross(dFdx(vViewPos), dFdy(vViewPos)));

    vec3 viewDir = normalize(-vViewPos);
    // Two-light setup in view space: a key from upper-right, a cool fill.
    vec3 keyDir = normalize(vec3(0.55, 0.75, 0.65));
    vec3 fillDir = normalize(vec3(-0.6, -0.2, 0.35));

    // Wrap lighting — light bleeds past the terminator, which is what reads as
    // soft clay rather than plastic.
    float wrap = 0.45;
    float key = max(0.0, (dot(n, keyDir) + wrap) / (1.0 + wrap));
    float fill = max(0.0, (dot(n, fillDir) + wrap) / (1.0 + wrap)) * 0.35;

    // Posterize into bands for the pixel-art lineage. Applied to the key only,
    // so the fill keeps a smooth base and the banding does not look like an
    // artifact.
    float banded = floor(key * uBands) / uBands;
    float diffuse = banded + fill;

    // Internal glow: the fuller the pool, the more the core burns through.
    // Kept low — the core competing with the rim is what washes the banding
    // out and turns clay into flat saturated plastic.
    float core = smoothstep(0.25, 1.0, uPressure) * 0.42 + uSurge * 0.28;
    // Rising heat concentrated toward the base, where the pressure "sits".
    float heat = smoothstep(0.45, -0.9, vDir.y) * core;

    vec3 color = mix(uShellColor, uCoreColor, clamp(heat + vSwell * 1.6, 0.0, 1.0));
    // Wide dark floor, modest gain: clay is a matte body reading mostly in
    // shadow, with light describing the facets rather than flooding them.
    color *= 0.21 + diffuse * 0.82;

    // Fresnel rim, brightened by surge — this is what selective bloom grabs.
    // Confined to the true silhouette so it outlines rather than fills.
    float fresnel = pow(1.0 - max(0.0, dot(n, viewDir)), 4.0);
    color += uRimColor * fresnel * (0.35 + uSurge * 0.7);

    gl_FragColor = vec4(color, 1.0);
  }
`;
