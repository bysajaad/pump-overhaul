export const flipbookVertexShader = /* glsl */ `
  uniform float uAge;
  uniform float uFrames;
  uniform float uGrid;
  varying vec2 vUv;

  void main() {
    float frame = floor(clamp(uAge, 0.0, 0.999) * uFrames);
    float column = mod(frame, uGrid);
    float row = floor(frame / uGrid);
    vUv = (uv + vec2(column, uGrid - 1.0 - row)) / uGrid;
    vec4 world = instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * world;
  }
`;

export const flipbookFragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform vec3 uTint;
  varying vec2 vUv;

  void main() {
    vec4 texel = texture2D(uMap, vUv);
    float brightness = max(texel.r, max(texel.g, texel.b));
    float alpha = smoothstep(0.38, 0.68, brightness) * texel.a * uOpacity;
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(texel.rgb * uTint, alpha);
  }
`;
