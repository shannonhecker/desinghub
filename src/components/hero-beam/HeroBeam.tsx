"use client";

/* ═══════════════════════════════════════════════════════════════
   HeroBeam - WebGL fragment shader light beam
   ───────────────────────────────────────────────────────────────
   Neuform-tier atmospheric beam for the ausos.ai hero. Rendered as
   a full-viewport <canvas> behind the CSS aurora blobs, noise, and
   guilloché wave layers.

   What the shader does:
     - Emits a soft vertical volumetric beam from the top, tinted
       with brand colors that shift subtly along the beam axis.
     - Layers three octaves of value-noise (cheap fbm) over the
       beam for texture + shimmer.
     - Responds to mouse parallax — the beam's x-origin drifts
       toward the pointer, giving a subtle 3D feel.
     - Respects prefers-reduced-motion — renders a single static
       frame instead of animating.

   Performance:
     - Uses an orthographic camera + full-screen quad (1 triangle
       strip, 2 faces). No geometry allocation per frame.
     - DevicePixelRatio clamped to 2 to avoid 4K * retina blow-up.
     - Antialiasing disabled (edge AA irrelevant for a full-screen
       gradient shader).
     - Intersection-observer pauses the RAF loop when the canvas
       scrolls out of the viewport.

   Mounting:
     - Must be dynamically imported in a "use client" ancestor
       because Three.js and WebGL are not SSR-safe.
     - Expected z-index: −1 (below hero-bg blobs). See hero.css.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { isReducedMotion } from "@/lib/motion";

/* ── Shader source ──────────────────────────────────────────────── */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform vec2  u_resolution;
  uniform vec2  u_mouse;       // normalised [0..1]
  uniform float u_time;        // seconds
  uniform vec3  u_colorA;      // beam core color
  uniform vec3  u_colorB;      // beam edge color
  uniform vec3  u_colorBg;     // background color (matches hero bg)
  uniform float u_intensity;   // 0..1 opacity cap

  /* ── Hash / noise helpers (cheap value-noise fbm) ─────────────── */
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    /* Aspect-corrected UV centered on origin. */
    vec2 uv = vUv;
    float aspect = u_resolution.x / u_resolution.y;

    /* Beam origin — drifts slightly with mouse + time. */
    float beamX = 0.5 + (u_mouse.x - 0.5) * 0.08 + sin(u_time * 0.15) * 0.02;

    /* Horizontal distance from beam axis, width narrows from top to bottom. */
    float height = uv.y;
    float beamWidth = mix(0.08, 0.22, 1.0 - height); /* wider at bottom, tighter at top */
    float dx = (uv.x - beamX) * aspect;
    float beamCore = smoothstep(beamWidth, 0.0, abs(dx));
    float beamHalo = smoothstep(beamWidth * 2.6, 0.0, abs(dx)) * 0.6;

    /* Beam dims toward the bottom of the viewport. */
    float verticalFalloff = smoothstep(0.05, 0.95, 1.0 - height);
    float beam = (beamCore + beamHalo) * verticalFalloff;

    /* fbm noise field — animated drift along the beam axis. */
    vec2 np = vec2(uv.x * 3.0 + u_time * 0.05, uv.y * 4.0 - u_time * 0.09);
    float n = fbm(np);
    float shimmer = mix(0.85, 1.15, n);
    beam *= shimmer;

    /* Color: gradient from core → edge → background. */
    vec3 beamColor = mix(u_colorB, u_colorA, smoothstep(0.0, 1.0, beam));
    vec3 col = mix(u_colorBg, beamColor, clamp(beam * u_intensity, 0.0, 1.0));

    /* Subtle vignette to keep corners molten rather than flat. */
    float vignette = smoothstep(1.2, 0.4, length((uv - 0.5) * vec2(aspect, 1.0)));
    col = mix(u_colorBg, col, vignette);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ── Theme-aware color resolution ───────────────────────────────── */

/**
 * Reads CSS custom properties for the beam colors. Falls back to
 * sensible hard-coded values if the vars aren't defined yet (which
 * is fine — they'll land in a later brand-tokens PR).
 *
 * Expected vars (to be added in P4):
 *   --beam-color-a  : beam core   (default #6750a4 — M3 primary / ausos violet)
 *   --beam-color-b  : beam edge   (default #b490f5 — ausos soft violet)
 *   --beam-color-bg : hero bg     (default #0b0e1a — hero bg literal)
 */
function readBeamColors(): { a: THREE.Color; b: THREE.Color; bg: THREE.Color } {
  if (typeof window === "undefined") {
    return {
      a: new THREE.Color("#6750a4"),
      b: new THREE.Color("#b490f5"),
      bg: new THREE.Color("#0b0e1a"),
    };
  }
  const root = getComputedStyle(document.documentElement);
  const read = (prop: string, fallback: string) =>
    new THREE.Color((root.getPropertyValue(prop).trim() || fallback));
  return {
    a: read("--beam-color-a", "#6750a4"),
    b: read("--beam-color-b", "#b490f5"),
    bg: read("--beam-color-bg", "#0b0e1a"),
  };
}

/* ── Component ──────────────────────────────────────────────────── */

export function HeroBeam() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: false,
      powerPreference: "default",
    });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    /* ── Scene ── */
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const colors = readBeamColors();
    const uniforms = {
      u_resolution: { value: new THREE.Vector2(mount.clientWidth, mount.clientHeight) },
      u_mouse:      { value: new THREE.Vector2(0.5, 0.5) },
      u_time:       { value: 0 },
      u_colorA:     { value: colors.a },
      u_colorB:     { value: colors.b },
      u_colorBg:    { value: colors.bg },
      u_intensity:  { value: 0.85 },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    /* ── Resize ── */
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      uniforms.u_resolution.value.set(w, h);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    /* ── Mouse parallax (smoothed toward target) ── */
    let targetMx = 0.5, targetMy = 0.5;
    const onMove = (e: MouseEvent) => {
      targetMx = e.clientX / window.innerWidth;
      targetMy = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    /* ── Pause when off-screen ── */
    let isVisible = true;
    const io = new IntersectionObserver(
      (entries) => { isVisible = entries[0]?.isIntersecting ?? true; },
      { threshold: 0 },
    );
    io.observe(mount);

    /* ── Theme-change listener ── */
    const onThemeChange = () => {
      const c = readBeamColors();
      uniforms.u_colorA.value.copy(c.a);
      uniforms.u_colorB.value.copy(c.b);
      uniforms.u_colorBg.value.copy(c.bg);
    };
    window.addEventListener("theme-changed", onThemeChange);

    /* ── Render loop ── */
    const reduced = isReducedMotion();
    let raf: number | null = null;
    const start = performance.now();

    const tick = (now: number) => {
      if (!isVisible) { raf = requestAnimationFrame(tick); return; }
      const t = (now - start) / 1000;
      uniforms.u_time.value = t;
      // Smooth mouse toward target
      uniforms.u_mouse.value.x += (targetMx - uniforms.u_mouse.value.x) * 0.06;
      uniforms.u_mouse.value.y += (targetMy - uniforms.u_mouse.value.y) * 0.06;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

    if (reduced) {
      /* Single static frame. */
      renderer.render(scene, camera);
    } else {
      raf = requestAnimationFrame(tick);
    }

    /* ── Cleanup ── */
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("theme-changed", onThemeChange);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="hero-beam" aria-hidden="true" />;
}

export default HeroBeam;
