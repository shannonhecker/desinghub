"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";

/* ══════════════════════════════════════════════════════
   Interactive Liquid Gradient (WebGL)
   Adapted from CodePen by Cameron Knight
   Full-screen animated gradient with mouse-reactive distortion
   ══════════════════════════════════════════════════════ */

/* ── Vertex shader — simple pass-through ── */
const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vUv = uv;
}`;

/* ── Fragment shader — animated liquid gradient ── */
const FRAG = /* glsl */ `
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;
uniform vec3 uColor6;
uniform float uSpeed;
uniform float uIntensity;
uniform sampler2D uTouchTexture;
uniform float uGrainIntensity;
uniform vec3 uDarkNavy;
uniform float uGradientSize;

varying vec2 vUv;

#define PI 3.14159265359

float grain(vec2 uv, float time) {
  vec2 grainUv = uv * uResolution * 0.5;
  return fract(sin(dot(grainUv + time, vec2(12.9898, 78.233))) * 43758.5453) * 2.0 - 1.0;
}

vec3 getGradientColor(vec2 uv, float time) {
  float gradientRadius = uGradientSize;

  vec2 center1 = vec2(0.5 + sin(time * uSpeed * 0.4) * 0.4, 0.5 + cos(time * uSpeed * 0.5) * 0.4);
  vec2 center2 = vec2(0.5 + cos(time * uSpeed * 0.6) * 0.5, 0.5 + sin(time * uSpeed * 0.45) * 0.5);
  vec2 center3 = vec2(0.5 + sin(time * uSpeed * 0.35) * 0.45, 0.5 + cos(time * uSpeed * 0.55) * 0.45);
  vec2 center4 = vec2(0.5 + cos(time * uSpeed * 0.5) * 0.4, 0.5 + sin(time * uSpeed * 0.4) * 0.4);
  vec2 center5 = vec2(0.5 + sin(time * uSpeed * 0.7) * 0.35, 0.5 + cos(time * uSpeed * 0.6) * 0.35);
  vec2 center6 = vec2(0.5 + cos(time * uSpeed * 0.45) * 0.5, 0.5 + sin(time * uSpeed * 0.65) * 0.5);

  vec2 center7 = vec2(0.5 + sin(time * uSpeed * 0.55) * 0.38, 0.5 + cos(time * uSpeed * 0.48) * 0.42);
  vec2 center8 = vec2(0.5 + cos(time * uSpeed * 0.65) * 0.36, 0.5 + sin(time * uSpeed * 0.52) * 0.44);
  vec2 center9 = vec2(0.5 + sin(time * uSpeed * 0.42) * 0.41, 0.5 + cos(time * uSpeed * 0.58) * 0.39);
  vec2 center10 = vec2(0.5 + cos(time * uSpeed * 0.48) * 0.37, 0.5 + sin(time * uSpeed * 0.62) * 0.43);
  vec2 center11 = vec2(0.5 + sin(time * uSpeed * 0.68) * 0.33, 0.5 + cos(time * uSpeed * 0.44) * 0.46);
  vec2 center12 = vec2(0.5 + cos(time * uSpeed * 0.38) * 0.39, 0.5 + sin(time * uSpeed * 0.56) * 0.41);

  float inf1 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center1));
  float inf2 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center2));
  float inf3 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center3));
  float inf4 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center4));
  float inf5 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center5));
  float inf6 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center6));
  float inf7 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center7));
  float inf8 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center8));
  float inf9 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center9));
  float inf10 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center10));
  float inf11 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center11));
  float inf12 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center12));

  // Counter-rotating radial overlays
  vec2 r1 = uv - 0.5;
  float a1 = time * uSpeed * 0.15;
  r1 = vec2(r1.x * cos(a1) - r1.y * sin(a1), r1.x * sin(a1) + r1.y * cos(a1)) + 0.5;
  vec2 r2 = uv - 0.5;
  float a2 = -time * uSpeed * 0.12;
  r2 = vec2(r2.x * cos(a2) - r2.y * sin(a2), r2.x * sin(a2) + r2.y * cos(a2)) + 0.5;
  float ri1 = 1.0 - smoothstep(0.0, 0.8, length(r1 - 0.5));
  float ri2 = 1.0 - smoothstep(0.0, 0.8, length(r2 - 0.5));

  // Blend with dynamic intensities
  float cw1 = 0.5;  // color 1 weight (teal)
  float cw2 = 1.8;  // color 2 weight (navy)

  vec3 color = vec3(0.0);
  color += uColor1 * inf1 * (0.55 + 0.45 * sin(time * uSpeed)) * cw1;
  color += uColor2 * inf2 * (0.55 + 0.45 * cos(time * uSpeed * 1.2)) * cw2;
  color += uColor3 * inf3 * (0.55 + 0.45 * sin(time * uSpeed * 0.8)) * cw1;
  color += uColor4 * inf4 * (0.55 + 0.45 * cos(time * uSpeed * 1.3)) * cw2;
  color += uColor5 * inf5 * (0.55 + 0.45 * sin(time * uSpeed * 1.1)) * cw1;
  color += uColor6 * inf6 * (0.55 + 0.45 * cos(time * uSpeed * 0.9)) * cw2;

  // Extra gradient centers
  color += uColor1 * inf7 * (0.55 + 0.45 * sin(time * uSpeed * 1.4)) * cw1;
  color += uColor2 * inf8 * (0.55 + 0.45 * cos(time * uSpeed * 1.5)) * cw2;
  color += uColor3 * inf9 * (0.55 + 0.45 * sin(time * uSpeed * 1.6)) * cw1;
  color += uColor4 * inf10 * (0.55 + 0.45 * cos(time * uSpeed * 1.7)) * cw2;
  color += uColor5 * inf11 * (0.55 + 0.45 * sin(time * uSpeed * 1.8)) * cw1;
  color += uColor6 * inf12 * (0.55 + 0.45 * cos(time * uSpeed * 1.9)) * cw2;

  // Radial overlays
  color += mix(uColor1, uColor3, ri1) * 0.45 * cw1;
  color += mix(uColor2, uColor4, ri2) * 0.4 * cw2;

  color = clamp(color, vec3(0.0), vec3(1.0)) * uIntensity;

  // Saturation boost
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(lum), color, 1.48);
  color = pow(color, vec3(0.92));

  // Navy base for dark areas
  float br = length(color);
  float mf = max(br * 1.2, 0.15);
  color = mix(uDarkNavy, color, mf);

  // Cap brightness
  br = length(color);
  if (br > 1.0) color *= 1.0 / br;

  return color;
}

void main() {
  vec2 uv = vUv;

  // Touch distortion
  vec4 tt = texture2D(uTouchTexture, uv);
  float vx = -(tt.r * 2.0 - 1.0);
  float vy = -(tt.g * 2.0 - 1.0);
  float intensity = tt.b;
  uv.x += vx * 0.8 * intensity;
  uv.y += vy * 0.8 * intensity;

  // Ripple + wave
  vec2 ctr = vec2(0.5);
  float dist = length(uv - ctr);
  float ripple = sin(dist * 20.0 - uTime * 3.0) * 0.04 * intensity;
  float wave = sin(dist * 15.0 - uTime * 2.0) * 0.03 * intensity;
  uv += vec2(ripple + wave);

  vec3 color = getGradientColor(uv, uTime);

  // Film grain
  color += grain(uv, uTime) * uGrainIntensity;

  // Subtle color shift
  float ts = uTime * 0.5;
  color.r += sin(ts) * 0.02;
  color.g += cos(ts * 1.4) * 0.02;
  color.b += sin(ts * 1.2) * 0.02;

  // Navy base for dark areas
  float br2 = length(color);
  float mf2 = max(br2 * 1.2, 0.15);
  color = mix(uDarkNavy, color, mf2);

  color = clamp(color, vec3(0.0), vec3(1.0));
  float br = length(color);
  if (br > 1.0) color *= 1.0 / br;

  gl_FragColor = vec4(color, 1.0);
}`;

/* ══════════════════════════════════════════════════════
   TouchTexture — encodes mouse movement into a texture
   ══════════════════════════════════════════════════════ */
class TouchTexture {
  size = 64;
  maxAge = 64;
  radius: number;
  speed: number;
  trail: { x: number; y: number; age: number; force: number; vx: number; vy: number }[] = [];
  last: { x: number; y: number } | null = null;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.Texture;

  constructor() {
    this.radius = 0.25 * this.size;
    this.speed = 1 / this.maxAge;
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.canvas.height = this.size;
    this.ctx = this.canvas.getContext("2d")!;
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.size, this.size);
    this.texture = new THREE.Texture(this.canvas);
  }

  update() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.size, this.size);
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const p = this.trail[i];
      const f = p.force * this.speed * (1 - p.age / this.maxAge);
      p.x += p.vx * f;
      p.y += p.vy * f;
      p.age++;
      if (p.age > this.maxAge) {
        this.trail.splice(i, 1);
      } else {
        this.drawPoint(p);
      }
    }
    this.texture.needsUpdate = true;
  }

  addTouch(pt: { x: number; y: number }) {
    let force = 0, vx = 0, vy = 0;
    if (this.last) {
      const dx = pt.x - this.last.x;
      const dy = pt.y - this.last.y;
      if (dx === 0 && dy === 0) return;
      const d = Math.sqrt(dx * dx + dy * dy);
      vx = dx / d;
      vy = dy / d;
      force = Math.min((dx * dx + dy * dy) * 20000, 2.0);
    }
    this.last = { x: pt.x, y: pt.y };
    this.trail.push({ x: pt.x, y: pt.y, age: 0, force, vx, vy });
  }

  private drawPoint(p: { x: number; y: number; age: number; force: number; vx: number; vy: number }) {
    const pos = { x: p.x * this.size, y: (1 - p.y) * this.size };
    let intensity = 1;
    if (p.age < this.maxAge * 0.3) {
      intensity = Math.sin((p.age / (this.maxAge * 0.3)) * (Math.PI / 2));
    } else {
      const t = 1 - (p.age - this.maxAge * 0.3) / (this.maxAge * 0.7);
      intensity = -t * (t - 2);
    }
    intensity *= p.force;
    const color = `${((p.vx + 1) / 2) * 255}, ${((p.vy + 1) / 2) * 255}, ${intensity * 255}`;
    const offset = this.size * 5;
    this.ctx.shadowOffsetX = offset;
    this.ctx.shadowOffsetY = offset;
    this.ctx.shadowBlur = this.radius;
    this.ctx.shadowColor = `rgba(${color},${0.2 * intensity})`;
    this.ctx.beginPath();
    this.ctx.fillStyle = "rgba(255,0,0,1)";
    this.ctx.arc(pos.x - offset, pos.y - offset, this.radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

/* ══════════════════════════════════════════════════════
   LiquidGradient — exported React component
   ══════════════════════════════════════════════════════ */
export function WaveScene() {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    let raf = 0;
    let dead = false;

    /* ── Renderer ── */
    const dpr = Math.min(window.devicePixelRatio, 2);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, stencil: false, depth: false });
    renderer.setPixelRatio(dpr);
    renderer.setSize(box.clientWidth, box.clientHeight);
    box.appendChild(renderer.domElement);

    /* ── Camera ── */
    const camera = new THREE.PerspectiveCamera(45, box.clientWidth / box.clientHeight, 0.1, 10000);
    camera.position.z = 50;

    /* ── Scene ── */
    const scene = new THREE.Scene();

    /* ── Touch texture ── */
    const touchTex = new TouchTexture();

    /* ── View size helper ── */
    const getViewSize = () => {
      const fov = (camera.fov * Math.PI) / 180;
      const h = Math.abs(camera.position.z * Math.tan(fov / 2) * 2);
      return { width: h * camera.aspect, height: h };
    };

    /* ── Gradient plane ── */
    const vs = getViewSize();
    const geo = new THREE.PlaneGeometry(vs.width, vs.height, 1, 1);

    // User's colors:
    // #21F2CF (teal), #0A0E27 (navy), #F15A22 (orange)
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(box.clientWidth, box.clientHeight) },
      uColor1: { value: new THREE.Vector3(0.082, 0.980, 0.855) },  // #15FADA - vivid teal
      uColor2: { value: new THREE.Vector3(0.039, 0.055, 0.153) },  // #0A0E27 - Navy
      uColor3: { value: new THREE.Vector3(0.988, 0.412, 0.098) },  // #FC6919 - vivid orange
      uColor4: { value: new THREE.Vector3(0.039, 0.055, 0.153) },  // #0A0E27 - Navy
      uColor5: { value: new THREE.Vector3(0.988, 0.412, 0.098) },  // #FC6919 - vivid orange
      uColor6: { value: new THREE.Vector3(0.039, 0.055, 0.153) },  // #0A0E27 - Navy
      uSpeed: { value: 1.5 },
      uIntensity: { value: 2.05 },
      uTouchTexture: { value: touchTex.texture },
      uGrainIntensity: { value: 0.07 },
      uDarkNavy: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
      uGradientSize: { value: 0.48 },
    };

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    /* ── Mouse tracking ── */
    const onMouseMove = (e: MouseEvent) => {
      const rect = box.getBoundingClientRect();
      touchTex.addTouch({
        x: (e.clientX - rect.left) / rect.width,
        y: 1 - (e.clientY - rect.top) / rect.height,
      });
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      const rect = box.getBoundingClientRect();
      touchTex.addTouch({
        x: (t.clientX - rect.left) / rect.width,
        y: 1 - (t.clientY - rect.top) / rect.height,
      });
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove);

    /* ── Resize ── */
    const handleResize = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      uniforms.uResolution.value.set(w, h);
      const v = getViewSize();
      mesh.geometry.dispose();
      mesh.geometry = new THREE.PlaneGeometry(v.width, v.height, 1, 1);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(box);

    /* ── Render loop ── */
    let lastTime = 0;
    const tick = (t: number) => {
      if (dead) return;
      const delta = Math.min((t - lastTime) * 0.001, 0.1);
      lastTime = t;
      touchTex.update();
      uniforms.uTime.value += delta;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    /* ── Cleanup ── */
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={boxRef} className="wave-canvas-wrap" />;
}
