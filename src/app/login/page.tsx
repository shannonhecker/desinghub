"use client";

import Link from "next/link";
import React, { useState, FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Sparkles } from "lucide-react";
import "./login.css";

export default function LoginPage() {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(false);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch("/api/staging-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: formData.get("password") }),
      });

      if (res.ok) {
        // Full page navigation so the middleware sees the new cookie
        window.location.href = "/builder";
      } else {
        setError(true);
        setLoading(false);
      }
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <main id="main-content" className="login-shell">
      <div className="login-ambient" aria-hidden="true">
        <div className="login-ambient-field login-ambient-field-1" />
        <div className="login-ambient-field login-ambient-field-2" />
        <div className="login-gridline" />
      </div>

      <div className="login-layout">
        <section className="login-story" aria-labelledby="login-title">
          <Link href="/" className="login-brand-link" aria-label="Back to ausos landing page">
            <span className="login-mark" aria-hidden="true">
              <img src="/aologo.svg" alt="" />
            </span>
            <span>ausos</span>
          </Link>
          <div className="login-kicker">
            <Sparkles size={16} strokeWidth={1.8} aria-hidden="true" />
            Private Studio Access
          </div>
          <h1 id="login-title">Enter the design-system studio.</h1>
          <p>
            Continue into the working builder where prompts become Salt DS, Material 3,
            Fluent 2, Carbon, and ausos interface directions.
          </p>
          <div className="login-proof-row" aria-label="Studio capabilities">
            <span>Prompt</span>
            <span>Compare</span>
            <span>Tune</span>
            <span>Export</span>
          </div>
        </section>

        <section className="login-card" aria-label="Password sign in">
          <div className="login-card-header">
            <div className="login-lock" aria-hidden="true">
              <LockKeyhole size={18} strokeWidth={1.9} />
            </div>
            <div>
              <h2>Studio password</h2>
              <p>Use the staging password to continue.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div>
              <label htmlFor="login-password" className="login-field-label">
                Password
              </label>
              <div className="login-input-wrap">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  aria-invalid={error || undefined}
                  aria-describedby={error ? "login-error" : undefined}
                  className={`login-input${error ? " has-error" : ""}`}
                />
                <button
                  type="button"
                  className="login-pw-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={1.8} aria-hidden="true" />
                  ) : (
                    <Eye size={16} strokeWidth={1.8} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p id="login-error" className="login-error" role="alert">
                Incorrect password, try again. Need access?{" "}
                <a href="mailto:shannonheckerchen@gmail.com">Email Shannon</a>.
              </p>
            )}

            <button type="submit" disabled={loading} className="login-submit">
              <span>{loading ? "Signing in..." : "Enter Studio"}</span>
              <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
            </button>
          </form>

          <p className="login-meta">This preview is under development.</p>
        </section>
      </div>
    </main>
  );
}
