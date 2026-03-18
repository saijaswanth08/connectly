import { useEffect, useRef } from "react";
import { Renderer, Camera, Geometry, Program, Mesh, Transform } from "ogl";
import "./Particles.css";

// ─── Particle Vertex Shader ───────────────────────────────────────────────────
const particleVert = /* glsl */ `
  attribute vec3  position;
  attribute vec4  random;
  attribute vec3  color;

  uniform mat4  modelMatrix;
  uniform mat4  viewMatrix;
  uniform mat4  projectionMatrix;
  uniform float uTime;
  uniform float uSpread;
  uniform float uBaseSize;
  uniform float uPixelRatio;
  uniform float uSpeed;
  uniform vec2  uMouse;

  varying vec3  vColor;
  varying float vMouseInfluence;
  varying float vGlowFactor;

  void main() {
    vColor = color;

    vec3 pos = position;

    // per-particle orbital drift
    float angle  = uTime * uSpeed * random.x + random.z * 6.28318;
    float radius = 0.25 + random.y * 0.75;
    pos.x += cos(angle) * radius * 0.45;
    pos.y += sin(angle) * radius * 0.45;
    pos.z += sin(angle * 0.5) * radius * 0.2;

    pos *= uSpread;

    vec4 mvPos    = viewMatrix * modelMatrix * vec4(pos, 1.0);
    gl_Position   = projectionMatrix * mvPos;

    // mouse influence
    vec2  ndc          = gl_Position.xy / gl_Position.w;
    float mouseDist    = length(ndc - uMouse);
    vMouseInfluence    = smoothstep(0.7, 0.0, mouseDist);

    // depth-based glow boost (closer = bigger glow)
    vGlowFactor  = clamp(1.0 + random.w * 0.6, 1.0, 1.6);

    float base      = uBaseSize * (random.w * 0.75 + 0.25);
    gl_PointSize    = (base + vMouseInfluence * uBaseSize * 1.1) * vGlowFactor * uPixelRatio / -mvPos.z;
  }
`;

// ─── Glassmorphism Particle Fragment Shader ───────────────────────────────────
const particleFrag = /* glsl */ `
  precision highp float;

  varying vec3  vColor;
  varying float vMouseInfluence;
  varying float vGlowFactor;

  void main() {
    float d    = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    float glow     = smoothstep(0.5, 0.0, d);
    float glowCore = smoothstep(0.15, 0.0, d);

    vec3 base      = vColor * 1.2;
    vec3 glowColor = base + vec3(0.18, 0.12, 0.38);

    // mouse-proximity brightness
    glowColor += vMouseInfluence * vec3(0.5, 0.45, 0.9);
    glowColor  = clamp(glowColor, 0.0, 1.0);

    float alpha = glow * 0.52 + glowCore * 0.38;
    alpha       = clamp(alpha * vGlowFactor, 0.0, 1.0);

    gl_FragColor = vec4(glowColor, alpha);
  }
`;

// ─── Line Vertex Shader ───────────────────────────────────────────────────────
const lineVert = /* glsl */ `
  attribute vec3  position;
  attribute float opacity;

  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;

  varying float vOpacity;

  void main() {
    vOpacity    = opacity;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

// ─── Line Fragment Shader ─────────────────────────────────────────────────────
const lineFrag = /* glsl */ `
  precision highp float;

  uniform vec3  uLineColor;
  varying float vOpacity;

  void main() {
    gl_FragColor = vec4(uLineColor, vOpacity * 0.12);
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r
    ? [parseInt(r[1], 16) / 255, parseInt(r[2], 16) / 255, parseInt(r[3], 16) / 255]
    : [1, 1, 1];
}

// ─── Galaxy layer configs ─────────────────────────────────────────────────────
// share = fraction of particleCount; mouseF = parallax strength
const LAYER_CONFIGS = [
  { label: "far",  spreadMul: 0.50, sizeMul: 0.42, speedMul: 0.30, share: 0.33, mouseF: 0.10, rotFactor: 0.10 },
  { label: "mid",  spreadMul: 0.80, sizeMul: 0.80, speedMul: 0.65, share: 0.42, mouseF: 0.20, rotFactor: 0.18 },
  { label: "near", spreadMul: 1.25, sizeMul: 1.30, speedMul: 1.05, share: 0.25, mouseF: 0.35, rotFactor: 0.28 },
];

const CONN_THRESHOLD    = 1.2;
const CONN_THRESHOLD_SQ = CONN_THRESHOLD * CONN_THRESHOLD;
const MAX_CONN          = 2;          // max connections per particle
const LINE_COLOR        = [0.42, 0.38, 0.90]; // soft purple-blue

// ─── Component ────────────────────────────────────────────────────────────────
export default function Particles({
  particleColors       = ["#8b5cf6", "#6366f1", "#a78bfa", "#c4b5fd"],
  particleCount        = 600,
  particleSpread       = 40,
  speed                = 0.05,
  particleBaseSize     = 100,
  moveParticlesOnHover = true,
  alphaParticles       = true,
  disableRotation      = false,
  pixelRatio           = 1,
}) {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const mouseRef     = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const container = containerRef.current;
    const canvas    = canvasRef.current;
    if (!canvas || !container) return;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new Renderer({ canvas, alpha: true, premultipliedAlpha: false, antialias: false });
    const gl       = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const camera = new Camera(gl, { fov: 35 });
    camera.position.set(0, 0, 22);

    const onResize = () => {
      const w = container.offsetWidth  || window.innerWidth;
      const h = container.offsetHeight || window.innerHeight;
      renderer.setSize(w, h);
      camera.perspective({ aspect: w / h });
    };
    onResize();
    window.addEventListener("resize", onResize);

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene = new Transform();

    // ── Build galaxy depth layers ─────────────────────────────────────────────
    const layers = LAYER_CONFIGS.map((cfg, li) => {
      const count  = Math.max(4, Math.round(particleCount * cfg.share));
      const spread = particleSpread  * cfg.spreadMul;
      const size   = particleBaseSize * cfg.sizeMul;
      const spd    = speed * cfg.speedMul;

      const positions = new Float32Array(count * 3);
      const basePos   = new Float32Array(count * 3);
      const randoms   = new Float32Array(count * 4);
      const colors    = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        // Distribute on a sphere for galaxy feel
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        const r     = 0.3 + Math.random() * 0.7;
        const px = r * Math.sin(phi) * Math.cos(theta);
        const py = r * Math.sin(phi) * Math.sin(theta);
        const pz = r * Math.cos(phi);
        positions[i*3]=basePos[i*3]=px;
        positions[i*3+1]=basePos[i*3+1]=py;
        positions[i*3+2]=basePos[i*3+2]=pz;

        randoms[i*4]   = Math.random();
        randoms[i*4+1] = Math.random();
        randoms[i*4+2] = Math.random();
        randoms[i*4+3] = Math.random();

        const rgb = hexToRgb(particleColors[Math.floor(Math.random() * particleColors.length)]);
        colors[i*3]=rgb[0]; colors[i*3+1]=rgb[1]; colors[i*3+2]=rgb[2];
      }

      const geometry = new Geometry(gl, {
        position: { size: 3, data: positions },
        random:   { size: 4, data: randoms },
        color:    { size: 3, data: colors },
      });

      const program = new Program(gl, {
        vertex:   particleVert,
        fragment: particleFrag,
        uniforms: {
          uTime:       { value: 0 },
          uSpread:     { value: spread },
          uBaseSize:   { value: size * pixelRatio * 1.8 },
          uPixelRatio: { value: pixelRatio },
          uSpeed:      { value: spd },
          uMouse:      { value: [0, 0] },
        },
        transparent: true,
        depthTest:   false,
      });

      const mesh = new Mesh(gl, { mode: gl.POINTS, geometry, program });
      mesh.setParent(scene);

      return { mesh, program, basePos, count, spread, mouseF: cfg.mouseF, speedMul: cfg.speedMul, rotFactor: cfg.rotFactor };
    });

    // ── Connection lines ──────────────────────────────────────────────────────
    // Only run connections on the mid layer (index 1) to avoid clutter
    const midLayer     = layers[1];
    const maxLines     = midLayer.count * MAX_CONN;
    const linePosData  = new Float32Array(maxLines * 6);
    const lineOpaData  = new Float32Array(maxLines * 2);

    const lineGeo = new Geometry(gl, {
      position: { size: 3, data: linePosData },
      opacity:  { size: 1, data: lineOpaData },
    });
    const lineProg = new Program(gl, {
      vertex:   lineVert,
      fragment: lineFrag,
      uniforms: { uLineColor: { value: LINE_COLOR } },
      transparent: true,
      depthTest:   false,
    });
    const lineMesh = new Mesh(gl, { mode: gl.LINES, geometry: lineGeo, program: lineProg });
    lineMesh.setParent(scene);

    // Pre-allocated world pos buffer for mid layer
    const midWorldPos = new Float32Array(midLayer.count * 3);

    // ── Mouse ─────────────────────────────────────────────────────────────────
    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.tx =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouseRef.current.ty = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── Animation ─────────────────────────────────────────────────────────────
    let animId;
    let t       = 0;
    let lastNow = performance.now();

    const animate = (now) => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min((now - lastNow) / 1000, 0.05);
      lastNow = now;
      t += delta * speed * 10;

      // Smooth mouse
      const ms = mouseRef.current;
      ms.x += (ms.tx - ms.x) * 0.06;
      ms.y += (ms.ty - ms.y) * 0.06;

      // Update all layers
      layers.forEach(({ mesh, program, basePos, count, spread, mouseF, speedMul, rotFactor }, li) => {
        program.uniforms.uTime.value  = t;
        program.uniforms.uMouse.value = [ms.x, ms.y];

        // Depth-scaled parallax
        if (moveParticlesOnHover) {
          const targetX = ms.x * mouseF * 8;
          const targetY = ms.y * mouseF * 8;
          mesh.position.x += (targetX - mesh.position.x) * 0.04;
          mesh.position.y += (targetY - mesh.position.y) * 0.04;
        }

        // Gentle rotation per layer
        if (!disableRotation) {
          mesh.rotation.y += delta * speed * speedMul * rotFactor;
          mesh.rotation.x += delta * speed * speedMul * rotFactor * 0.5;
          mesh.rotation.z += delta * speed * speedMul * rotFactor * 0.2;
        }

        // Compute mid-layer world positions for lines
        if (li === 1) {
          for (let i = 0; i < count; i++) {
            const angle  = t * speedMul * basePos[i*3] + basePos[i*3+2] * 6.28318;
            const radius = 0.25 + Math.abs(basePos[i*3+1]) * 0.75;
            midWorldPos[i*3]   = basePos[i*3]   * spread + Math.cos(angle) * radius * spread * 0.45 + mesh.position.x;
            midWorldPos[i*3+1] = basePos[i*3+1] * spread + Math.sin(angle) * radius * spread * 0.45 + mesh.position.y;
            midWorldPos[i*3+2] = basePos[i*3+2] * spread;
          }
        }
      });

      // Build minimal connection lines (mid layer only, skip alternate particles)
      let lIdx = 0;
      const n = midLayer.count;
      for (let i = 0; i < n && lIdx < maxLines; i += 2) { // skip alternate
        const ax = midWorldPos[i*3], ay = midWorldPos[i*3+1], az = midWorldPos[i*3+2];
        let conns = 0;
        for (let j = i + 1; j < n && conns < MAX_CONN && lIdx < maxLines; j += 2) {
          const dx = ax - midWorldPos[j*3];
          const dy = ay - midWorldPos[j*3+1];
          const dz = az - midWorldPos[j*3+2];
          const d2 = dx*dx + dy*dy + dz*dz;
          if (d2 < CONN_THRESHOLD_SQ) {
            const opa = 1.0 - Math.sqrt(d2) / CONN_THRESHOLD;
            linePosData[lIdx*6]   = ax;   linePosData[lIdx*6+1] = ay;   linePosData[lIdx*6+2] = az;
            linePosData[lIdx*6+3] = midWorldPos[j*3]; linePosData[lIdx*6+4] = midWorldPos[j*3+1]; linePosData[lIdx*6+5] = midWorldPos[j*3+2];
            lineOpaData[lIdx*2]   = opa;
            lineOpaData[lIdx*2+1] = opa;
            lIdx++;
            conns++;
          }
        }
      }
      // zero unused
      for (let i = lIdx; i < maxLines; i++) {
        linePosData[i*6]=linePosData[i*6+1]=linePosData[i*6+2]=0;
        linePosData[i*6+3]=linePosData[i*6+4]=linePosData[i*6+5]=0;
        lineOpaData[i*2]=lineOpaData[i*2+1]=0;
      }
      lineGeo.attributes.position.needsUpdate = true;
      lineGeo.attributes.opacity.needsUpdate  = true;
      lineGeo.setDrawRange(0, lIdx * 2);

      renderer.render({ scene, camera });
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [
    particleColors, particleCount, particleSpread, speed,
    particleBaseSize, moveParticlesOnHover, alphaParticles,
    disableRotation, pixelRatio,
  ]);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      className="particles-container"
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}
