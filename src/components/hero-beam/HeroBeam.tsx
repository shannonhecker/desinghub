"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { isReducedMotion } from "@/lib/motion";

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
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_time;
  uniform vec3 u_bg;
  uniform vec3 u_cyan;
  uniform vec3 u_blue;
  uniform vec3 u_violet;
  uniform vec3 u_amber;
  uniform vec3 u_rose;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
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
    float value = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amp * noise(p);
      p *= 2.07;
      amp *= 0.5;
    }
    return value;
  }

  mat2 rotate2d(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
  }

  float auroraBand(vec2 p, float center, float width, float halo, float phase) {
    float organic = fbm(vec2(p.x * 1.25 + phase * 0.08, p.y * 2.4 - phase * 0.05));
    float drift = sin(p.x * 1.4 + phase) * 0.105;
    drift += sin(p.x * 3.2 - phase * 0.42) * 0.054;
    drift += (organic - 0.5) * 0.18;
    float d = abs(p.y - center + drift);
    float veil = smoothstep(width + halo, 0.0, d);
    float body = smoothstep(width, 0.0, d) * 0.34;
    return (veil * 0.54 + body) * mix(0.78, 1.16, organic);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    vec2 parallax = (u_mouse - 0.5) * vec2(0.14, -0.08);
    vec2 q = rotate2d(-0.58) * (p + parallax);
    vec2 flow = q + vec2(u_time * 0.024, -u_time * 0.012);

    float field = fbm(flow * vec2(1.35, 2.8));
    float shimmer = mix(0.86, 1.08, field);
    float bandMask = smoothstep(-1.62, -1.0, q.x) * (1.0 - smoothstep(0.78, 1.46, q.x));

    float lowerVeil = auroraBand(q, -0.24, 0.105, 0.36, u_time * 0.18) * 0.52;
    float mainVeil = auroraBand(q, -0.06, 0.135, 0.46, u_time * 0.22 + 1.4) * 0.72;
    float upperVeil = auroraBand(q, 0.22, 0.12, 0.40, u_time * 0.16 + 3.2) * 0.36;
    float warmVeil = auroraBand(q, 0.04, 0.16, 0.50, -u_time * 0.14 + 2.1) * 0.22;

    lowerVeil *= shimmer * bandMask;
    mainVeil *= (0.92 + field * 0.18) * bandMask;
    upperVeil *= (0.86 + field * 0.2) * bandMask;
    warmVeil *= (0.82 + field * 0.16) * bandMask;

    float broadSweep = smoothstep(0.58, 0.0, abs(q.y + sin(q.x * 1.6 - u_time * 0.12) * 0.24 + (field - 0.5) * 0.24));
    broadSweep *= smoothstep(-1.38, -0.72, q.x) * (1.0 - smoothstep(0.58, 1.3, q.x));

    vec3 coolBlend = mix(u_cyan, u_blue, smoothstep(-0.38, 0.2, q.y + field * 0.18));
    coolBlend = mix(coolBlend, u_violet, smoothstep(0.08, 0.52, q.y + field * 0.2) * 0.52);
    vec3 warmBlend = mix(u_amber, u_rose, smoothstep(-0.08, 0.46, q.y + field * 0.16));

    vec3 col = u_bg;
    col += coolBlend * mainVeil * 0.58;
    col += mix(u_cyan, u_blue, 0.42) * lowerVeil * 0.34;
    col += mix(u_violet, u_rose, 0.36) * upperVeil * 0.22;
    col += warmBlend * warmVeil * 0.18;
    col += mix(coolBlend, warmBlend, smoothstep(-0.18, 0.42, q.y)) * broadSweep * 0.13;

    float vignette = smoothstep(1.12, 0.32, length((uv - 0.5) * vec2(aspect, 1.0)));
    col = mix(u_bg, col, vignette);

    float grain = hash(uv * u_resolution + floor(u_time * 24.0)) - 0.5;
    col += grain * 0.006;

    gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
  }
`;

interface BeamColors {
  bg: THREE.Color;
  cyan: THREE.Color;
  blue: THREE.Color;
  violet: THREE.Color;
  amber: THREE.Color;
  rose: THREE.Color;
}

function readBeamColors(scope: Element): BeamColors {
  const styles = getComputedStyle(scope);
  const read = (prop: string, fallback: string) =>
    new THREE.Color(styles.getPropertyValue(prop).trim() || fallback);

  return {
    bg: read("--landing-bg", "#05070d"),
    cyan: read("--landing-cyan", "#5ee7df"),
    blue: read("--landing-blue", "#3b82f6"),
    violet: read("--landing-violet", "#b490f5"),
    amber: read("--landing-amber", "#ffad5c"),
    rose: read("--landing-rose", "#f78ab8"),
  };
}

function createWebGLRenderer(mount: HTMLElement): THREE.WebGLRenderer | null {
  const canvas = document.createElement("canvas");
  let context: WebGLRenderingContext | WebGL2RenderingContext | null = null;

  try {
    context =
      canvas.getContext("webgl2", {
        alpha: false,
        antialias: false,
        powerPreference: "default",
      }) ??
      canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        powerPreference: "default",
      });

    if (!context) {
      mount.dataset.webgl = "unavailable";
      return null;
    }

    return new THREE.WebGLRenderer({
      canvas,
      context,
      alpha: false,
      antialias: false,
      powerPreference: "default",
    });
  } catch {
    mount.dataset.webgl = "unavailable";
    return null;
  }
}

export function HeroBeam() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;

    const renderer = createWebGLRenderer(mount);
    if (!renderer) return;

    mount.dataset.webgl = "available";
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const colors = readBeamColors(mount);
    const uniforms = {
      u_resolution: { value: new THREE.Vector2(1, 1) },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_time: { value: 0 },
      u_bg: { value: colors.bg },
      u_cyan: { value: colors.cyan },
      u_blue: { value: colors.blue },
      u_violet: { value: colors.violet },
      u_amber: { value: colors.amber },
      u_rose: { value: colors.rose },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });
    scene.add(new THREE.Mesh(geometry, material));

    let targetMx = 0.5;
    let targetMy = 0.5;
    let isVisible = true;
    let raf: number | null = null;
    const reduced = isReducedMotion();
    const start = performance.now();

    const resize = () => {
      const w = Math.max(1, mount.clientWidth);
      const h = Math.max(1, mount.clientHeight);
      renderer.setSize(w, h, false);
      uniforms.u_resolution.value.set(w, h);
      if (reduced) render(performance.now());
    };

    const render = (now: number) => {
      uniforms.u_time.value = (now - start) / 1000;
      uniforms.u_mouse.value.x += (targetMx - uniforms.u_mouse.value.x) * 0.055;
      uniforms.u_mouse.value.y += (targetMy - uniforms.u_mouse.value.y) * 0.055;
      renderer.render(scene, camera);
    };

    const tick = (now: number) => {
      raf = null;
      if (!isVisible) return;
      render(now);
      raf = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (!reduced && raf === null) {
        raf = requestAnimationFrame(tick);
      }
    };

    const stopLoop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };

    const onMove = (event: MouseEvent) => {
      targetMx = event.clientX / window.innerWidth;
      targetMy = event.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    const io = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
        if (isVisible) {
          render(performance.now());
          startLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0 },
    );
    io.observe(mount);

    const onThemeChange = () => {
      const next = readBeamColors(mount);
      uniforms.u_bg.value.copy(next.bg);
      uniforms.u_cyan.value.copy(next.cyan);
      uniforms.u_blue.value.copy(next.blue);
      uniforms.u_violet.value.copy(next.violet);
      uniforms.u_amber.value.copy(next.amber);
      uniforms.u_rose.value.copy(next.rose);
      render(performance.now());
    };
    window.addEventListener("theme-changed", onThemeChange);

    if (reduced) {
      render(performance.now());
    } else {
      startLoop();
    }

    return () => {
      stopLoop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("theme-changed", onThemeChange);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="hero-beam" aria-hidden="true" />;
}

export default HeroBeam;
