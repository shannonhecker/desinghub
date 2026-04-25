"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Preload, Sparkles as DreiSparkles } from "@react-three/drei";
import * as THREE from "three";

interface LandingScrollFlightProps {
  rootId?: string;
}

const FLIGHT_QUERY = "(min-width: 761px) and (prefers-reduced-motion: no-preference)";

const PANEL_SPECS = [
  { x: -2.5, y: 0.92, z: -4.5, rotateY: 0.22, color: "#5ee7df", width: 2.55, height: 1.28 },
  { x: 2.35, y: -0.34, z: -8.2, rotateY: -0.24, color: "#ffad5c", width: 2.9, height: 1.48 },
  { x: -1.72, y: -0.78, z: -12.4, rotateY: 0.26, color: "#f78ab8", width: 2.35, height: 1.36 },
  { x: 1.88, y: 0.56, z: -16.8, rotateY: -0.22, color: "#b490f5", width: 2.75, height: 1.42 },
  { x: -0.95, y: 0.04, z: -21.2, rotateY: 0.16, color: "#3b82f6", width: 3.1, height: 1.58 },
];

function canUseWebGL(): boolean {
  if (typeof document === "undefined") return false;

  const canvas = document.createElement("canvas");
  try {
    return Boolean(
      canvas.getContext("webgl2", { alpha: true, antialias: true }) ??
        canvas.getContext("webgl", { alpha: true, antialias: true }),
    );
  } catch {
    return false;
  }
}

function readRootProgress(root: HTMLElement | null): number {
  const pageHeight = root?.scrollHeight ?? document.documentElement.scrollHeight;
  const maxScroll = Math.max(1, pageHeight - window.innerHeight);
  return THREE.MathUtils.clamp(window.scrollY / maxScroll, 0, 1);
}

function InterfacePlane({
  color,
  height,
  rotateY,
  width,
  x,
  y,
  z,
}: (typeof PANEL_SPECS)[number]) {
  const accent = useMemo(() => new THREE.Color(color), [color]);
  const rows = useMemo(
    () =>
      Array.from({ length: 4 }, (_, index) => ({
        y: height * 0.27 - index * height * 0.16,
        width: width * (0.42 + index * 0.08),
      })),
    [height, width],
  );
  const chips = useMemo(
    () =>
      Array.from({ length: 3 }, (_, index) => ({
        x: -width * 0.28 + index * width * 0.28,
        width: width * (0.13 + index * 0.025),
      })),
    [width],
  );

  return (
    <group position={[x, y, z]} rotation={[0.08, rotateY, -rotateY * 0.18]}>
      <mesh>
        <planeGeometry args={[width, height, 1, 1]} />
        <meshBasicMaterial color="#dffcff" opacity={0.018} transparent side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <planeGeometry args={[width * 0.96, height * 0.88, 1, 1]} />
        <meshBasicMaterial color={accent} opacity={0.02} transparent side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, height * 0.34, 0.025]}>
        <boxGeometry args={[width * 0.78, 0.035, 0.018]} />
        <meshBasicMaterial color={accent} opacity={0.18} transparent depthWrite={false} />
      </mesh>
      {rows.map((row, index) => (
        <mesh key={index} position={[-width * 0.1, row.y, 0.026]}>
          <boxGeometry args={[row.width, 0.028, 0.018]} />
          <meshBasicMaterial color="#ffffff" opacity={0.11 - index * 0.014} transparent depthWrite={false} />
        </mesh>
      ))}
      {chips.map((chip, index) => (
        <mesh key={index} position={[chip.x, -height * 0.32, 0.03]}>
          <boxGeometry args={[chip.width, 0.13, 0.018]} />
          <meshBasicMaterial
            color={index === 1 ? accent : "#ffffff"}
            opacity={index === 1 ? 0.16 : 0.06}
            transparent
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function ScrollFlightScene({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const eased = useRef(0);
  const rigRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Group>(null);

  useFrame(({ camera, clock }) => {
    eased.current = THREE.MathUtils.lerp(eased.current, progressRef.current, 0.045);
    const progress = eased.current;
    const time = clock.elapsedTime;
    const x = Math.sin(progress * Math.PI * 0.9) * 0.22;
    const y = 0.58 + Math.sin(progress * Math.PI * 1.3) * 0.08;
    const z = 8.4 + progress * 0.9;

    camera.position.set(x, y, z);
    camera.lookAt(
      Math.sin(progress * Math.PI + 0.3) * 0.28,
      0.03 + Math.cos(progress * Math.PI * 1.2) * 0.06,
      -10.5 - progress * 1.6,
    );

    if (rigRef.current) {
      rigRef.current.rotation.y = Math.sin(progress * Math.PI) * 0.018;
      rigRef.current.rotation.z = Math.sin(progress * Math.PI * 2) * 0.008;
      rigRef.current.position.x = Math.sin(time * 0.12) * 0.04;
      rigRef.current.position.y = Math.cos(time * 0.1) * 0.03;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.006;
      particlesRef.current.position.z = THREE.MathUtils.lerp(0.6, -0.45, progress);
    }
  });

  return (
    <>
      <fog attach="fog" args={["#05070d", 10, 38]} />
      <ambientLight intensity={0.55} />
      <pointLight position={[3.5, 3.5, 1.5]} color="#5ee7df" intensity={1.8} distance={18} />
      <pointLight position={[-4, -1.5, -9]} color="#ffad5c" intensity={1.4} distance={20} />
      <group ref={rigRef}>
        {PANEL_SPECS.map((panel) => (
          <InterfacePlane key={`${panel.color}-${panel.z}`} {...panel} />
        ))}
      </group>
      <group ref={particlesRef}>
        <DreiSparkles count={44} scale={[8.5, 4.8, 28]} size={1.1} speed={0.08} opacity={0.14} color="#dffcff" />
      </group>
      <Preload all />
    </>
  );
}

export default function LandingScrollFlight({ rootId = "main-content" }: LandingScrollFlightProps) {
  const progressRef = useRef(0);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const root = document.getElementById(rootId);
    const media = window.matchMedia(FLIGHT_QUERY);
    let frame = 0;

    const updateProgress = () => {
      frame = 0;
      progressRef.current = readRootProgress(root);
    };

    const queueProgress = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(updateProgress);
      }
    };

    const updateEnabled = () => {
      const webglAvailable = canUseWebGL();
      root?.setAttribute("data-flight-webgl", webglAvailable ? "available" : "unavailable");
      queueProgress();
      setEnabled(media.matches && webglAvailable);
    };

    updateEnabled();
    media.addEventListener("change", updateEnabled);
    window.addEventListener("resize", updateEnabled);
    window.addEventListener("scroll", queueProgress, { passive: true });

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      media.removeEventListener("change", updateEnabled);
      window.removeEventListener("resize", updateEnabled);
      window.removeEventListener("scroll", queueProgress);
      root?.removeAttribute("data-flight-webgl");
    };
  }, [rootId]);

  if (!enabled) return null;

  return (
    <div className="landing-flight" aria-hidden="true">
      <Canvas
        camera={{ fov: 46, near: 0.1, far: 60, position: [0, 0.6, 8.4] }}
        dpr={[1, 1.25]}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        onCreated={({ gl }) => {
          gl.setClearAlpha(0);
        }}
      >
        <ScrollFlightScene progressRef={progressRef} />
      </Canvas>
    </div>
  );
}
