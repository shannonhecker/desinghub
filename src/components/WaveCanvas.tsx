"use client";

import { useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   WaveCanvas — Guilloché wave lines (ported from shannonhecker.com)
   90 sine-wave lines with multi-frequency distortion
   ═══════════════════════════════════════════════════════════════ */

const N          = 90;
const SPEED      = 0.00034;
const PHASE_STEP = 0.17;
const LW         = 0.7;
const BAND_T     = 0.05;
const BAND_B     = 0.95;
const AMPL       = 0.042;
const STEPS      = 480;

interface Line { y0: number; amp: number; ph: number; }

export function WaveCanvas({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lines: Line[] = [];
    let waveGrad: CanvasGradient | null = null;
    let raf: number;
    let t0: number | null = null;

    function buildGrad(W: number) {
      const g = ctx!.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0,    "rgba(255,255,255, 0)");
      g.addColorStop(0.08, "rgba(255,255,255, 0.55)");
      g.addColorStop(0.50, "rgba(255,255,255, 0.60)");
      g.addColorStop(0.92, "rgba(255,255,255, 0.50)");
      g.addColorStop(1,    "rgba(255,255,255, 0)");
      waveGrad = g;
    }

    function build(W: number, H: number) {
      lines = [];
      const bH = H * (BAND_B - BAND_T);
      const sp = bH / (N - 1);
      const am = bH * AMPL;
      for (let i = 0; i < N; i++) {
        const t    = i / (N - 1);
        const bell = 0.35 + 0.65 * Math.sin(t * Math.PI);
        lines.push({ y0: H * BAND_T + i * sp, amp: am * bell, ph: i * PHASE_STEP });
      }
      buildGrad(W);
    }

    function resize() {
      const r = canvas!.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      canvas!.width  = Math.round(r.width  * d);
      canvas!.height = Math.round(r.height * d);
      ctx!.setTransform(d, 0, 0, d, 0, 0);
      ctx!.imageSmoothingEnabled = true;
      ctx!.lineCap  = "round";
      ctx!.lineJoin = "round";
      build(r.width, r.height);
    }

    function edgeFade(W: number, H: number) {
      // Top fade
      const fT = ctx!.createLinearGradient(0, 0, 0, H * 0.1);
      fT.addColorStop(0, "rgba(11,14,26,1)");
      fT.addColorStop(1, "rgba(11,14,26,0)");
      ctx!.fillStyle = fT;
      ctx!.fillRect(0, 0, W, H * 0.1);
      // Bottom fade
      const fB = ctx!.createLinearGradient(0, H * 0.9, 0, H);
      fB.addColorStop(0, "rgba(11,14,26,0)");
      fB.addColorStop(1, "rgba(11,14,26,1)");
      ctx!.fillStyle = fB;
      ctx!.fillRect(0, H * 0.9, W, H * 0.1);
    }

    function draw(ts: number) {
      if (!t0) t0 = ts;
      const el = ts - t0;
      const d  = window.devicePixelRatio || 1;
      const W  = canvas!.width  / d;
      const H  = canvas!.height / d;
      ctx!.clearRect(0, 0, W, H);
      ctx!.lineCap  = "round";
      ctx!.lineJoin = "round";
      ctx!.strokeStyle = waveGrad!;
      ctx!.lineWidth   = LW;
      for (const ln of lines) {
        const phi = el * SPEED + ln.ph;
        ctx!.beginPath();
        for (let s = 0; s <= STEPS; s++) {
          const nx = s / STEPS;
          const px = nx * W;
          const py = ln.y0
                   + ln.amp        * Math.sin(phi       + nx * Math.PI * 4.0)
                   + ln.amp * 0.28 * Math.sin(phi * 1.5 + nx * Math.PI * 8.0 + 1.4)
                   + ln.amp * 0.10 * Math.sin(phi * 2.1 + nx * Math.PI * 12.0 + 2.8);
          s === 0 ? ctx!.moveTo(px, py) : ctx!.lineTo(px, py);
        }
        ctx!.stroke();
      }
      edgeFade(W, H);
      raf = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%", ...style }}
    />
  );
}
