"use client";

import React, { useRef, useEffect } from "react";
import { useBuilder } from "@/store/useBuilder";

/* ── AI response logic ── */
const AI_RESPONSES: Record<string, string> = {
  dashboard: "I'll create a dashboard layout with sidebar navigation, KPI cards, and data visualizations. Applying your selected design system tokens now.",
  landing: "Building a landing page with a hero section, feature grid, testimonials, and CTA footer. All styled with your chosen design system.",
  form: "Creating a multi-step form with validation states, input groups, and progress stepper. Using your design system's form patterns.",
  ecommerce: "Setting up an e-commerce layout with product grid, filters, cart drawer, and checkout. Applying your theme tokens.",
  blog: "Designing a blog layout with article cards, category nav, and reading view. Using your typography tokens.",
  portfolio: "Building a portfolio with project showcase, about section, and contact form.",
  default: "Got it! I'm updating the preview with your changes. Open the preview panel to see the result, or keep describing what you'd like.",
};

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("dashboard")) return AI_RESPONSES.dashboard;
  if (lower.includes("landing")) return AI_RESPONSES.landing;
  if (lower.includes("form")) return AI_RESPONSES.form;
  if (lower.includes("ecommerce") || lower.includes("shop")) return AI_RESPONSES.ecommerce;
  if (lower.includes("blog")) return AI_RESPONSES.blog;
  if (lower.includes("portfolio")) return AI_RESPONSES.portfolio;
  if (lower.includes("dark") || lower.includes("light")) return "Switching the theme mode now. The preview will update in real time.";
  if (lower.includes("salt")) return "Switching to Salt Design System by J.P. Morgan — teal accents, Open Sans, 4-level density scaling.";
  if (lower.includes("material") || lower.includes("m3")) return "Switching to Material Design 3 — dynamic color, rounded components, Roboto type scale.";
  if (lower.includes("fluent")) return "Switching to Fluent 2 by Microsoft — Segoe UI, subtle shadows, brand blue palette.";
  if (lower.includes("download") || lower.includes("export")) return "Your project package is ready! Click Export in the top bar to download your configuration.";
  if (lower.includes("preview")) return "Opening the live preview panel. You can see your design rendered in real time.";
  return AI_RESPONSES.default;
}

/* ── Quick action chips for hero ── */
const QUICK_ACTIONS = [
  { label: "Create Dashboard", icon: "monitoring" },
  { label: "Build Landing Page", icon: "web" },
  { label: "Design Form", icon: "edit_note" },
];

/* ── Feature cards for hero ── */
const FEATURE_CARDS = [
  {
    icon: "palette",
    tag: "Build System",
    title: "Design System Builder",
    desc: "Create complete design systems with AI-powered tools.",
    color: "purple",
  },
  {
    icon: "view_quilt",
    tag: "Browse Docs",
    title: "Component Library",
    desc: "Explore components across Salt, M3, and Fluent 2.",
    color: "blue",
  },
  {
    icon: "code",
    tag: "Export Code",
    title: "Code Generator",
    desc: "Generate production-ready React components instantly.",
    color: "pink",
  },
];

/* ── Component ── */
export function ChatPanel() {
  const {
    messages, inputText, isVoiceActive, isGenerating,
    setInputText, addMessage, toggleVoice, setGenerating, bumpPreview, togglePreview,
  } = useBuilder();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isHome = messages.length === 0;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text?: string) => {
    const msg = (text || inputText).trim();
    if (!msg || isGenerating) return;
    addMessage("user", msg);
    setGenerating(true);

    setTimeout(() => {
      addMessage("ai", getAIResponse(msg));
      setGenerating(false);
      bumpPreview();
    }, 800 + Math.random() * 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Hero View ── */
  if (isHome) {
    return (
      <div className="hero-container">
        {/* Orb */}
        <div className="hero-orb-wrap">
          <div className="hero-orb" />
        </div>

        {/* Title */}
        <h1 className="hero-title">Ready to Create Something New?</h1>

        {/* Quick action chips */}
        <div className="hero-chips">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              className="hero-chip"
              onClick={() => handleSend(a.label)}
            >
              <span className="chip-icon material-symbols-outlined">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="hero-input-container">
          <div className="hero-input-box">
            <textarea
              ref={inputRef}
              className="hero-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Anything..."
              rows={1}
            />
            <div className="hero-input-toolbar">
              <div className="hero-toolbar-left">
                <button className="toolbar-btn">
                  <span className="icon material-symbols-outlined">attach_file</span>
                  Attach
                </button>
                <button className="toolbar-btn" onClick={() => useBuilder.getState().toggleSettings()}>
                  <span className="icon material-symbols-outlined">tune</span>
                  Settings
                </button>
                <button className="toolbar-btn" onClick={togglePreview}>
                  <span className="icon material-symbols-outlined">grid_view</span>
                  Preview
                </button>
              </div>
              <div className="hero-toolbar-right">
                <button
                  className={`mic-btn ${isVoiceActive ? "active" : ""}`}
                  onClick={toggleVoice}
                  aria-label="Toggle voice input"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {isVoiceActive ? "stop" : "mic"}
                  </span>
                </button>
                <button
                  className="send-btn"
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || isGenerating}
                  aria-label="Send message"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    arrow_upward
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="feature-cards">
          {FEATURE_CARDS.map((card) => (
            <div key={card.title} className="feature-card">
              <div className="feature-card-top">
                <div className={`feature-card-icon ${card.color}`}>
                  <span className="material-symbols-outlined">{card.icon}</span>
                </div>
                <span className={`feature-card-tag ${card.color}`}>{card.tag}</span>
              </div>
              <div className="feature-card-title">{card.title}</div>
              <div className="feature-card-desc">{card.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Chat View ── */
  return (
    <div className="chat-container">
      <div className="chat-area">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-msg chat-msg-${msg.role}`}>
            {msg.role === "ai" && (
              <div className="chat-msg-label">Design Hub AI</div>
            )}
            {msg.content}
          </div>
        ))}
        {isGenerating && (
          <div className="chat-msg chat-msg-ai">
            <div className="chat-msg-label">Design Hub AI</div>
            <div className="typing-dots">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat input */}
      <div className="chat-input-bar">
        <div className="chat-input-box">
          <textarea
            className="chat-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            rows={1}
          />
          <div className="chat-input-actions">
            <button
              className={`mic-btn ${isVoiceActive ? "active" : ""}`}
              onClick={toggleVoice}
              aria-label="Toggle voice input"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {isVoiceActive ? "stop" : "mic"}
              </span>
            </button>
            <button
              className="send-btn"
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isGenerating}
              aria-label="Send message"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                arrow_upward
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
