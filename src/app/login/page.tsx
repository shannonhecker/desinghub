"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(false);
    setLoading(true);

    try {
      const res = await fetch("/api/staging-login", {
        method: "POST",
        body: new FormData(e.currentTarget),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0b1120 0%, #0d1f2d 30%, #1a1035 65%, #120b20 100%)",
      fontFamily: "'DM Sans', 'Inter', sans-serif",
      overflow: "hidden",
      position: "relative",
    }}>

      {/* Ambient glows */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "10%", left: "15%",
          width: 480, height: 480,
          background: "radial-gradient(circle, rgba(26,140,160,0.18) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "10%",
          width: 400, height: 400,
          background: "radial-gradient(circle, rgba(120,60,200,0.15) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(40px)",
        }} />
      </div>

      {/* Card */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 400,
        margin: "0 16px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 20,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        padding: "40px 36px",
        boxShadow: "0 32px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8,
          }}>
            {/* ausōs dot-mark */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="9" cy="14" r="6" fill="rgba(94,231,223,0.9)" />
              <circle cx="20" cy="14" r="4.5" fill="rgba(255,255,255,0.55)" />
            </svg>
            <span style={{
              fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em",
              color: "rgba(255,255,255,0.92)",
            }}>
              aus<span style={{ opacity: 0.6 }}>ō</span>s
            </span>
          </div>
          <p style={{
            margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 400,
          }}>
            Staging — sign in to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{
              display: "block", marginBottom: 6,
              fontSize: 12, fontWeight: 600, letterSpacing: "0.04em",
              color: "rgba(255,255,255,0.45)", textTransform: "uppercase",
            }}>
              Username
            </label>
            <input
              name="user"
              type="text"
              required
              autoComplete="username"
              autoFocus
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "11px 14px",
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${error ? "rgba(220,80,80,0.5)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 10,
                color: "rgba(255,255,255,0.88)",
                fontSize: 14, fontFamily: "inherit",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = "rgba(94,231,223,0.45)";
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = error ? "rgba(220,80,80,0.5)" : "rgba(255,255,255,0.1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block", marginBottom: 6,
              fontSize: 12, fontWeight: 600, letterSpacing: "0.04em",
              color: "rgba(255,255,255,0.45)", textTransform: "uppercase",
            }}>
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "11px 14px",
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${error ? "rgba(220,80,80,0.5)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 10,
                color: "rgba(255,255,255,0.88)",
                fontSize: 14, fontFamily: "inherit",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = "rgba(94,231,223,0.45)";
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = error ? "rgba(220,80,80,0.5)" : "rgba(255,255,255,0.1)";
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
            />
          </div>

          {/* Error message */}
          {error && (
            <p style={{
              margin: 0, padding: "10px 14px",
              background: "rgba(220,80,80,0.1)",
              border: "1px solid rgba(220,80,80,0.25)",
              borderRadius: 8,
              fontSize: 13, color: "rgba(255,120,120,0.9)",
            }}>
              Incorrect username or password.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              padding: "12px",
              background: loading
                ? "rgba(94,231,223,0.08)"
                : "rgba(94,231,223,0.14)",
              border: "1px solid rgba(94,231,223,0.22)",
              borderRadius: 10,
              color: loading ? "rgba(94,231,223,0.45)" : "rgba(94,231,223,0.92)",
              fontSize: 14, fontWeight: 600, fontFamily: "inherit",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.15s",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.background = "rgba(94,231,223,0.22)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(94,231,223,0.12)";
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = loading
                ? "rgba(94,231,223,0.08)"
                : "rgba(94,231,223,0.14)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
