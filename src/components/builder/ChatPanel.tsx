"use client";

import React, { useRef, useEffect, useState } from "react";
import { useBuilder } from "@/store/useBuilder";

/* ── AI responses ── */
function getAIResponse(input: string): string {
  const l = input.toLowerCase();
  if (l.includes("dashboard")) return "I'll create a dashboard with sidebar navigation, KPI cards, and data visualizations using your selected design system.";
  if (l.includes("landing")) return "Building a landing page with hero section, feature grid, and CTA footer.";
  if (l.includes("form")) return "Creating a multi-step form with validation, progress stepper, and submit flow.";
  if (l.includes("ecommerce") || l.includes("shop")) return "Setting up an e-commerce layout with product grid, filters, and cart.";
  if (l.includes("blog")) return "Designing a blog with article cards, category nav, and reading view.";
  if (l.includes("portfolio")) return "Building a portfolio with project showcase and contact form.";
  if (l.includes("dark") || l.includes("light")) return "Switching theme mode now.";
  if (l.includes("salt")) return "Switching to Salt DS — teal accents, Open Sans, 4-level density.";
  if (l.includes("material") || l.includes("m3")) return "Switching to Material 3 — dynamic color, Roboto type scale.";
  if (l.includes("fluent")) return "Switching to Fluent 2 — Segoe UI, brand blue palette.";
  if (l.includes("preview")) return "Opening the live preview in a new window.";
  return "Got it! I'm updating your design. You can open the preview to see the result.";
}

const PROMPT_BUBBLES = [
  "Salt DS", "Material 3", "Fluent 2",
  "Dashboard", "Landing Page", "Form",
  "Dark Mode", "Light Mode",
  "E-Commerce", "Blog", "Portfolio",
  "Open Preview",
];

export function ChatPanel() {
  const {
    messages, inputText, isVoiceActive, isGenerating,
    setInputText, addMessage, toggleVoice, setGenerating, bumpPreview,
    designSystem, mode, density, interfaceType, selectedComponents, colorOverrides,
  } = useBuilder();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  const hasMessages = messages.length > 0;
  const hasText = inputText.trim().length > 0;
  const glowActive = focused || hasText;
  const orbState = isGenerating ? "generating" : hasText ? "typing" : "";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text?: string) => {
    const msg = (text || inputText).trim();
    if (!msg || isGenerating) return;
    addMessage("user", msg);
    setGenerating(true);

    if (msg.toLowerCase().includes("preview")) {
      const previewUrl = `${window.location.origin}${(window as unknown as Record<string, Record<string, string>>).__NEXT_DATA__?.basePath || ''}/builder?preview=1`;
      window.open(previewUrl, 'design-hub-preview', 'width=800,height=600');
    }

    setTimeout(() => {
      addMessage("ai", getAIResponse(msg));
      setGenerating(false);
      bumpPreview();
    }, 800 + Math.random() * 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (hasText && !isGenerating) handleSend();
    }
  };

  return (
    <div className="chat-layout">
      {/* Scrollable content area */}
      <div className="chat-scroll">
        {/* Orb — always centered, shrinks when chatting */}
        <div className="orb-container">
          <div className="orb-wrap" style={hasMessages ? { width: 70, height: 70 } : undefined}>
            <div className="orb-glow" style={hasMessages ? { filter: "blur(18px)" } : undefined} />
            {!hasMessages && <div className="orb-particles" />}
            <div className={`orb-sphere ${orbState}`} />
            <div className="orb-shimmer" />
          </div>
        </div>

        {/* Title — only before first message */}
        {!hasMessages && (
          <h1 className="hero-title">What would you like to build?</h1>
        )}

        {/* Messages — appear between orb and input */}
        {hasMessages && (
          <div className="messages-area">
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
        )}

        {/* Prompt bubbles — always visible */}
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
      </div>

      {/* Input — always pinned to bottom, same width */}
      <div className="chat-input-bar">
        <div className="input-container">
          <div className={`input-glow ${glowActive ? "active" : ""}`} />
          <div className={`input-box ${focused ? "focused" : ""}`}>
            <textarea
              ref={inputRef}
              className="input-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
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
                onClick={() => handleSend()}
                disabled={!hasText || isGenerating}
                aria-label="Send"
              >
                <span className="btn-icon material-symbols-outlined">arrow_upward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
