"use client";

import React, { useRef, useMemo, useEffect, useCallback, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════
   GPUComputationRenderer — inline slim version for R3F
   We only need: createTexture, addVariable, compute.
   ═══════════════════════════════════════════════════════════ */

class GPUComputationRenderer {
  sizeX: number;
  sizeY: number;
  renderer: THREE.WebGLRenderer;
  variables: {
    name: string;
    initialValueTexture: THREE.DataTexture;
    material: THREE.ShaderMaterial;
    renderTargets: THREE.WebGLRenderTarget[];
    currentTextureIndex: number;
    dependencies: { variable: unknown; textureUniform: string }[];
  }[];
  scene: THREE.Scene;
  camera: THREE.Camera;
  mesh: THREE.Mesh;
  passThruUniforms: { passThruTexture: { value: THREE.Texture | null } };
  passThruShader: THREE.ShaderMaterial;

  constructor(sizeX: number, sizeY: number, renderer: THREE.WebGLRenderer) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.renderer = renderer;
    this.variables = [];
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    this.camera.position.z = 1;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.scene.add(this.mesh);
    this.passThruUniforms = { passThruTexture: { value: null } };
    this.passThruShader = this.createShaderMaterial(
      `void main() { vec2 uv = gl_FragCoord.xy / resolution.xy; gl_FragColor = texture2D( passThruTexture, uv ); }`,
      this.passThruUniforms
    );
  }

  createTexture(): THREE.DataTexture {
    const data = new Float32Array(this.sizeX * this.sizeY * 4);
    const tex = new THREE.DataTexture(data, this.sizeX, this.sizeY, THREE.RGBAFormat, THREE.FloatType);
    tex.needsUpdate = true;
    return tex;
  }

  addVariable(name: string, fragmentShader: string, initialValueTexture: THREE.DataTexture) {
    const material = this.createShaderMaterial(fragmentShader);
    const v = {
      name,
      initialValueTexture,
      material,
      dependencies: [] as { variable: unknown; textureUniform: string }[],
      renderTargets: [] as THREE.WebGLRenderTarget[],
      currentTextureIndex: 0,
    };
    this.variables.push(v);
    return v;
  }

  setVariableDependencies(
    variable: (typeof this.variables)[0],
    deps: (typeof this.variables)[0][]
  ) {
    variable.dependencies = deps.map((d) => ({
      variable: d,
      textureUniform: d.name,
    }));
  }

  init() {
    for (const v of this.variables) {
      v.renderTargets = [this.createRenderTarget(), this.createRenderTarget()];
      this.renderTexture(v.initialValueTexture, v.renderTargets[0]);
      this.renderTexture(v.initialValueTexture, v.renderTargets[1]);
      const mat = v.material;
      mat.uniforms[v.name] = { value: null };
      for (const d of v.dependencies) {
        mat.uniforms[d.textureUniform] = { value: null };
      }
    }
    return null;
  }

  compute() {
    for (const v of this.variables) {
      const ci = v.currentTextureIndex;
      const ni = ci === 0 ? 1 : 0;
      v.material.uniforms[v.name].value = v.renderTargets[ci].texture;
      for (const d of v.dependencies) {
        const dv = d.variable as (typeof this.variables)[0];
        v.material.uniforms[d.textureUniform].value =
          dv.renderTargets[dv.currentTextureIndex].texture;
      }
      this.doRenderTarget(v.material, v.renderTargets[ni]);
      v.currentTextureIndex = ni;
    }
  }

  getCurrentRenderTarget(v: (typeof this.variables)[0]) {
    return v.renderTargets[v.currentTextureIndex];
  }

  dispose() {
    for (const v of this.variables) {
      v.initialValueTexture.dispose();
      v.material.dispose();
      for (const rt of v.renderTargets) {
        rt.texture.dispose();
        rt.dispose();
      }
    }
    this.passThruShader.dispose();
    (this.mesh.geometry as THREE.BufferGeometry).dispose();
  }

  private createRenderTarget() {
    return new THREE.WebGLRenderTarget(this.sizeX, this.sizeY, {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthBuffer: false,
    });
  }

  private createShaderMaterial(
    fragmentShader: string,
    uniforms?: Record<string, { value: unknown }>
  ) {
    return new THREE.ShaderMaterial({
      uniforms: { resolution: { value: new THREE.Vector2(this.sizeX, this.sizeY) }, ...uniforms },
      vertexShader: `void main() { gl_Position = vec4( position, 1.0 ); }`,
      fragmentShader,
    });
  }

  private renderTexture(input: THREE.Texture, output: THREE.WebGLRenderTarget) {
    this.passThruUniforms.passThruTexture.value = input;
    this.doRenderTarget(this.passThruShader, output);
    this.passThruUniforms.passThruTexture.value = null;
  }

  private doRenderTarget(material: THREE.ShaderMaterial, output: THREE.WebGLRenderTarget) {
    (this.mesh as THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>).material = material;
    this.renderer.setRenderTarget(output);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
  }
}

/* ═══════════════════════════════════════════════════════════
   GLSL Shaders
   ═══════════════════════════════════════════════════════════ */

const GPGPU_POSITION_FRAG = /* glsl */ `
uniform vec2 resolution;
uniform float uTime;
uniform float uShapeDistort;
uniform float uDistortFreq;
uniform vec3 uMouse3D;
uniform float uMouseInfluence;
uniform sampler2D texturePosition;

//
// Curl noise helpers
//
vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g, l.zxy);
  vec3 i2 = max(g, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

vec3 curlNoise(vec3 p) {
  float e = 0.1;
  float n1, n2;
  vec3 curl;
  n1 = snoise(p + vec3(0.0, e, 0.0));
  n2 = snoise(p - vec3(0.0, e, 0.0));
  curl.x = (n1 - n2) / (2.0 * e);
  n1 = snoise(p + vec3(0.0, 0.0, e));
  n2 = snoise(p - vec3(0.0, 0.0, e));
  curl.x -= (n1 - n2) / (2.0 * e);
  n1 = snoise(p + vec3(0.0, 0.0, e));
  n2 = snoise(p - vec3(0.0, 0.0, e));
  curl.y = (n1 - n2) / (2.0 * e);
  n1 = snoise(p + vec3(e, 0.0, 0.0));
  n2 = snoise(p - vec3(e, 0.0, 0.0));
  curl.y -= (n1 - n2) / (2.0 * e);
  n1 = snoise(p + vec3(e, 0.0, 0.0));
  n2 = snoise(p - vec3(e, 0.0, 0.0));
  curl.z = (n1 - n2) / (2.0 * e);
  n1 = snoise(p + vec3(0.0, e, 0.0));
  n2 = snoise(p - vec3(0.0, e, 0.0));
  curl.z -= (n1 - n2) / (2.0 * e);
  return curl;
}

vec3 safeNormalize(vec3 v) {
  float len = length(v);
  return len > 0.0001 ? v / len : vec3(0.0, 1.0, 0.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 pos = texture2D(texturePosition, uv);
  vec3 p = pos.xyz;
  float life = pos.w;

  // Soft sphere restoration — weaker pull lets tendrils extend
  float r = length(p);
  vec3 toCenter = safeNormalize(p) * 1.0;
  p = mix(p, toCenter, 0.003);

  // Strong multi-octave curl noise for visible tendrils
  float t = uTime * 0.12;
  vec3 curlP = p * uDistortFreq + t;
  vec3 curl = curlNoise(curlP);
  // Second octave at higher frequency for fine detail
  vec3 curl2 = curlNoise(curlP * 2.3 + 7.0);
  p += (curl * 0.7 + curl2 * 0.3) * uShapeDistort * 0.035;

  // Deep organic distortion — creates the bulges and voids
  float distort = snoise(p * uDistortFreq * 0.5 + uTime * 0.15) * uShapeDistort;
  float distort2 = snoise(p * uDistortFreq * 1.2 - uTime * 0.1) * uShapeDistort * 0.4;
  p += safeNormalize(p) * (distort * 0.1 + distort2 * 0.06);

  // Mouse repulsion — stronger push through the cloud
  vec3 toMouse = p - uMouse3D;
  float mouseDist = length(toMouse);
  float mouseForce = smoothstep(1.5, 0.0, mouseDist) * uMouseInfluence;
  p += safeNormalize(toMouse) * mouseForce * 0.08;

  // Slow tumbling orbit on two axes
  float angle1 = uTime * 0.04;
  mat2 rot1 = mat2(cos(angle1), -sin(angle1), sin(angle1), cos(angle1));
  p.xz = rot1 * p.xz;
  float angle2 = uTime * 0.025;
  mat2 rot2 = mat2(cos(angle2), -sin(angle2), sin(angle2), cos(angle2));
  p.yz = rot2 * p.yz;

  p = clamp(p, vec3(-5.0), vec3(5.0));

  life = fract(life + 0.0008);

  gl_FragColor = vec4(p, life);
}
`;

const PARTICLE_VERT = /* glsl */ `
attribute vec2 aTexCoord;
uniform sampler2D texturePosition;
uniform float uPointSize;
uniform float uPixelRatio;
varying float vLife;
varying float vDist;

void main() {
  vec4 posData = texture2D(texturePosition, aTexCoord);
  vec3 pos = posData.xyz;
  vLife = posData.w;
  vDist = length(pos);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = uPointSize * uPixelRatio * (1.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const PARTICLE_FRAG = /* glsl */ `
varying float vLife;
varying float vDist;
uniform float uTime;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float alpha = smoothstep(0.5, 0.05, d);

  // Warm nebula palette: deep amber → bright gold → pale white
  vec3 deepAmber = vec3(0.55, 0.28, 0.08);
  vec3 brightGold = vec3(0.95, 0.78, 0.35);
  vec3 paleWhite  = vec3(1.0, 0.95, 0.88);
  vec3 coolGray   = vec3(0.45, 0.42, 0.40);

  float t = fract(vLife * 4.0 + vDist * 0.6 + uTime * 0.03);

  vec3 color;
  if (t < 0.25) {
    color = mix(coolGray, deepAmber, t / 0.25);
  } else if (t < 0.5) {
    color = mix(deepAmber, brightGold, (t - 0.25) / 0.25);
  } else if (t < 0.75) {
    color = mix(brightGold, paleWhite, (t - 0.5) / 0.25);
  } else {
    color = mix(paleWhite, coolGray, (t - 0.75) / 0.25);
  }

  // Hot bright streaks near the core
  float coreBright = smoothstep(1.4, 0.2, vDist);
  color = mix(color, paleWhite, coreBright * 0.6);

  // Dim particles at the fringe for organic falloff
  float fringeAlpha = smoothstep(2.2, 0.6, vDist);
  alpha *= fringeAlpha;

  // Very fine particles — reduce alpha for dusty density feel
  alpha *= 0.55;

  // Boost contrast: core particles pop, edge particles fade
  alpha *= (0.4 + coreBright * 0.6);

  gl_FragColor = vec4(color, alpha);
}
`;

/* ═══════════════════════════════════════════════════════════
   GPU Particle Orb — R3F component
   ═══════════════════════════════════════════════════════════ */

const SIZE = 512;
const COUNT = SIZE * SIZE;

function GpuOrb() {
  const { gl, viewport } = useThree();
  const pointsRef = useRef<THREE.Points>(null);
  const gpuRef = useRef<GPUComputationRenderer | null>(null);
  const posVarRef = useRef<ReturnType<GPUComputationRenderer["addVariable"]> | null>(null);

  // Lerped uniform targets
  const mouseTarget = useRef(new THREE.Vector3(0, 0, 0));
  const mouseCurrent = useRef(new THREE.Vector3(0, 0, 0));
  const distortTarget = useRef(1.6);
  const distortCurrent = useRef(1.6);
  const freqTarget = useRef(2.2);
  const freqCurrent = useRef(2.2);

  const material = useMemo(() => {
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1;
    const m = new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      uniforms: {
        texturePosition: { value: null },
        uPointSize: { value: 1.8 },
        uPixelRatio: { value: dpr },
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return m;
  }, []);

  // Initialize GPGPU
  useEffect(() => {
    const gpu = new GPUComputationRenderer(SIZE, SIZE, gl);

    const posTex = gpu.createTexture();
    const data = posTex.image.data as Float32Array;

    for (let i = 0; i < COUNT; i++) {
      const i4 = i * 4;
      // Volumetric fill — cube root distribution for uniform density inside sphere
      const phi = Math.acos(1 - 2 * (i + 0.5) / COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = Math.pow(Math.random(), 0.33) * 1.15;
      data[i4 + 0] = r * Math.sin(phi) * Math.cos(theta);
      data[i4 + 1] = r * Math.sin(phi) * Math.sin(theta);
      data[i4 + 2] = r * Math.cos(phi);
      data[i4 + 3] = Math.random();
    }

    const posVar = gpu.addVariable("texturePosition", GPGPU_POSITION_FRAG, posTex);
    gpu.setVariableDependencies(posVar, [posVar]);

    posVar.material.uniforms.uTime = { value: 0 };
    posVar.material.uniforms.uShapeDistort = { value: 1.6 };
    posVar.material.uniforms.uDistortFreq = { value: 2.2 };
    posVar.material.uniforms.uMouse3D = { value: new THREE.Vector3(0, 0, 0) };
    posVar.material.uniforms.uMouseInfluence = { value: 0.0 };

    gpu.init();

    gpuRef.current = gpu;
    posVarRef.current = posVar;

    return () => {
      gpu.dispose();
      gpuRef.current = null;
      posVarRef.current = null;
    };
  }, [gl]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const texCoords = new Float32Array(COUNT * 2);
    for (let i = 0; i < COUNT; i++) {
      texCoords[i * 2] = (i % SIZE) / SIZE;
      texCoords[i * 2 + 1] = Math.floor(i / SIZE) / SIZE;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aTexCoord", new THREE.BufferAttribute(texCoords, 2));
    return geo;
  }, []);

  // Mouse tracking
  const onPointerMove = useCallback(
    (e: { clientX: number; clientY: number }) => {
      const x = ((e.clientX / window.innerWidth) * 2 - 1) * viewport.width * 0.5;
      const y = (-(e.clientY / window.innerHeight) * 2 + 1) * viewport.height * 0.5;
      mouseTarget.current.set(x * 0.6, y * 0.6, 0.3);
    },
    [viewport]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [onPointerMove]);

  useFrame(({ clock }, delta) => {
    const gpu = gpuRef.current;
    const posVar = posVarRef.current;
    if (!gpu || !posVar) return;

    const t = clock.getElapsedTime();
    const dt60 = Math.min(delta, 0.1) * 60; // normalize to 60fps baseline, cap spikes

    mouseCurrent.current.lerp(mouseTarget.current, 1 - Math.pow(0.96, dt60));
    distortCurrent.current += (distortTarget.current - distortCurrent.current) * (1 - Math.pow(0.98, dt60));
    freqCurrent.current += (freqTarget.current - freqCurrent.current) * (1 - Math.pow(0.98, dt60));

    const breathe = 1.0 + Math.sin(t * 0.3) * 0.25;

    posVar.material.uniforms.uTime.value = t;
    posVar.material.uniforms.uShapeDistort.value = distortCurrent.current * breathe;
    posVar.material.uniforms.uDistortFreq.value = freqCurrent.current;
    posVar.material.uniforms.uMouse3D.value.copy(mouseCurrent.current);

    const mouseMoving = mouseTarget.current.lengthSq() > 0.01;
    const targetInfluence = mouseMoving ? 1.0 : 0.0;
    posVar.material.uniforms.uMouseInfluence.value +=
      (targetInfluence - posVar.material.uniforms.uMouseInfluence.value) * (1 - Math.pow(0.95, dt60));

    gpu.compute();

    material.uniforms.texturePosition.value = gpu.getCurrentRenderTarget(posVar).texture;
    material.uniforms.uTime.value = t;
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
  );
}

/* ═══════════════════════════════════════════════════════════
   Scene wrapper (R3F Canvas + postprocessing-style glow)
   ═══════════════════════════════════════════════════════════ */

export function OrbScene() {
  return (
    <Canvas
      className="lgh-canvas"
      camera={{ position: [0, 0, 3.8], fov: 50 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
    >
      <GpuOrb />
    </Canvas>
  );
}

/* ═══════════════════════════════════════════════════════════
   Hero Layout — exported component
   ═══════════════════════════════════════════════════════════ */

export function LiquidGpuHero({ darkMode = true }: { darkMode?: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className={`lgh-hero ${darkMode ? "lgh-dark" : "lgh-light"}`}>
      {/* Ambient glow */}
      <div className="lgh-glow" aria-hidden="true" />

      <div className="lgh-content">
        {/* Left — copy */}
        <div className="lgh-copy">
          <div className="lgh-tag">
            <span className="lgh-tag-dot" />
            AI-Powered Design
          </div>
          <h1 className="lgh-headline">
            Build AI Agents That Look as Smart as They Are.
          </h1>
          <p className="lgh-subheadline">
            Deploy high-performance, branded AI agents that automate your
            workflow in under 5 minutes.
          </p>
          <div className="lgh-cta-row">
            <button className="lgh-btn lgh-btn--primary">Get Started Free</button>
            <button className="lgh-btn lgh-btn--ghost">Watch Demo</button>
          </div>
        </div>

        {/* Right — orb */}
        <div className="lgh-orb-container">
          {mounted && <OrbScene />}
        </div>
      </div>
    </section>
  );
}
