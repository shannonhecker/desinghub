"use client";

import React, { useRef, useEffect, useState } from "react";
import { useBuilder } from "@/store/useBuilder";

/* ── AI responses ── */
const AI_RESPONSES: Record<string, string> = {
  dashboard: "I'll create a dashboard with sidebar navigation, KPI cards, and data visualizations using your selected design system.",
  landing: "Building a landing page with hero section, feature grid, and CTA footer.",
  form: "Creating a multi-step form with validation, progress stepper, and submit flow.",
  ecommerce: "Setting up an e-commerce layout with product grid, filters, and cart.",
  blog: "Designing a blog with article cards, category nav, and reading view.",
  portfolio: "Building a portfolio with project showcase and contact form.",
  default: "Got it! I'm updating your design. You can open the preview to see the result.",
};

function getAIResponse(input: string): string {
  const l = input.toLowerCase();
  if (l.includes("dashboard")) return AI_RESPONSES.dashboard;
  if (l.includes("landing")) return AI_RESPONSES.landing;
  if (l.includes("form")) return AI_RESPONSES.form;
  if (l.includes("ecommerce") || l.includes("shop")) return AI_RESPONSES.ecommerce;
  if (l.includes("blog")) return AI_RESPONSES.blog;
  if (l.includes("portfolio")) return AI_RESPONSES.portfolio;
  if (l.includes("dark") || l.includes("light")) return "Switching theme mode now.";
  if (l.includes("salt")) return "Switching to Salt DS — teal accents, Open Sans, 4-level density.";
  if (l.includes("material") || l.includes("m3")) return "Switching to Material 3 — dynamic color, Roboto type scale.";
  if (l.includes("fluent")) return "Switching to Fluent 2 — Segoe UI, brand blue palette.";
  if (l.includes("preview")) return "Opening the live preview in a new window.";
  return AI_RESPONSES.default;
}

/* ── Prompt keyword bubbles ── */
const PROMPT_BUBBLES = [
  "Salt DS", "Material 3", "Fluent 2",
  "Dashboard", "Landing Page", "Form",
  "Dark Mode", "Light Mode",
  "E-Commerce", "Blog", "Portfolio",
  "Open Preview",
];

/* ── Shared input component ── */
function ChatInput({ onSend, isHero }: { onSend: (text: string) => void; isHero?: boolean }) {
  const { inputText, setInputText, isVoiceActive, toggleVoice, isGenerating } = useBuilder();
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const hasText = inputText.trim().length > 0;
  const glowActive = focused || hasText;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (hasText && !isGenerating) onSend(inputText.trim());
    }
  };

  return (
    <div className="input-container">
      <div className={`input-glow ${glowActive ? "active" : ""}`} />
      <div className={`input-box ${focused ? "focused" : ""}`}>
        <textarea
          ref={ref}
          className="input-textarea"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={isHero ? "Ask anything..." : "Type a message..."}
          rows={1}
        />
        <div className="input-actions">
          <button
            className={`mic-btn ${isVoiceActive ? "active" : ""}`}
            onClick={toggleVoice}
            aria-label="Toggle voice"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {isVoiceActive ? "stop" : "mic"}
            </span>
          </button>
          <button
            className="send-btn"
            onClick={() => { if (hasText && !isGenerating) onSend(inputText.trim()); }}
            disabled={!hasText || isGenerating}
            aria-label="Send"
          >
            <span className="btn-icon material-symbols-outlined">arrow_upward</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
export function ChatPanel() {
  const {
    messages, inputText, isGenerating,
    addMessage, setGenerating, bumpPreview,
    designSystem, mode, density, interfaceType, selectedComponents, colorOverrides,
  } = useBuilder();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const isHome = messages.length === 0;
  const isTyping = inputText.trim().length > 0;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text: string) => {
    addMessage("user", text);
    setGenerating(true);

    // Handle "Open Preview" command
    if (text.toLowerCase().includes("preview")) {
      openPreviewWindow();
    }

    setTimeout(() => {
      addMessage("ai", getAIResponse(text));
      setGenerating(false);
      bumpPreview();
    }, 800 + Math.random() * 1200);
  };

  const openPreviewWindow = () => {
    const config = {
      designSystem, mode, density, interfaceType, selectedComponents, colorOverrides,
    };
    const params = encodeURIComponent(JSON.stringify(config));
    // Open preview in new window using the preview page
    const previewUrl = `${window.location.origin}${(window as any).__NEXT_DATA__?.basePath || ''}/builder?preview=1`;
    window.open(previewUrl, 'design-hub-preview', 'width=800,height=600');
  };

  /* ── Orb state ── */
  const orbState = isGenerating ? "generating" : isTyping ? "typing" : "";

  /* ── Hero View ── */
  if (isHome) {
    return (
      <div className="hero-container">
        <div className="orb-container">
          <div className="orb-wrap">
            <div className="orb-glow" />
            <div className="orb-particles" />
            <div className={`orb-sphere ${orbState}`} />
            <div className="orb-shimmer" />
          </div>
        </div>

        <h1 className="hero-title">What would you like to build?</h1>

        <div className="prompt-bubbles">
          {PROMPT_BUBBLES.map((label) => (
            <button
              key={label}
              className="prompt-bubble"
              onClick={() => handleSend(label)}
            >
              {label}
            </button>
          ))}
        </div>

        <ChatInput onSend={handleSend} isHero />
      </div>
    );
  }

  /* ── Chat View ── */
  return (
    <div className="chat-container">
      {/* Small orb at top */}
      <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
        <div className="orb-wrap" style={{ width: 60, height: 60 }}>
          <div className="orb-glow" style={{ filter: "blur(15px)" }} />
          <div className={`orb-sphere ${orbState}`} />
          <div className="orb-shimmer" />
        </div>
      </div>

      <div className="chat-area">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-msg chat-msg-${msg.role}`}>
            {msg.role === "ai" && <div className="chat-msg-label">Design Hub AI</div>}
            {msg.content}
          </div>
        ))}
        {isGenerating && (
          <div className="chat-msg chat-msg-ai">
            <div className="chat-msg-label">Design Hub AI</div>
            <div className="typing-dots"><span /><span /><span /></div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input-bar">
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
