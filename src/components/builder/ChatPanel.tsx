"use client";

import React, { useRef, useEffect } from "react";
import { useBuilder } from "@/store/useBuilder";

const AI_RESPONSES: Record<string, string> = {
  dashboard: "I'll create a dashboard layout with a sidebar navigation, header with user profile, KPI cards across the top, and a data grid with charts below. I'm using the components you've selected and applying your chosen design system tokens.",
  landing: "Building a landing page with a hero section, feature grid, testimonials carousel, and a CTA footer. All styled with your selected design system's tokens and density settings.",
  form: "Creating a multi-step form interface with validation states, input groups, progress stepper, and submission confirmation. Using your design system's form field patterns.",
  ecommerce: "Setting up an e-commerce layout with product grid, filter sidebar, cart drawer, and checkout flow. Applying your theme tokens for consistent styling.",
  blog: "Designing a blog layout with article cards, category navigation, featured post hero, and reading view. Using your typography and spacing tokens.",
  portfolio: "Building a portfolio site with project showcase grid, about section, skills display, and contact form. Applying your design system's card and layout patterns.",
  default: "Got it! I'm updating the preview with your changes. You can fine-tune the design using the settings panel, or tell me what you'd like to adjust.",
};

function getAIResponse(input: string, interfaceType: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("dashboard")) return AI_RESPONSES.dashboard;
  if (lower.includes("landing")) return AI_RESPONSES.landing;
  if (lower.includes("form")) return AI_RESPONSES.form;
  if (lower.includes("ecommerce") || lower.includes("shop") || lower.includes("store")) return AI_RESPONSES.ecommerce;
  if (lower.includes("blog") || lower.includes("article")) return AI_RESPONSES.blog;
  if (lower.includes("portfolio")) return AI_RESPONSES.portfolio;
  if (lower.includes("dark") || lower.includes("light")) return "Switching the theme mode now. The preview will update in real time.";
  if (lower.includes("salt")) return "Switching to Salt Design System by J.P. Morgan. This uses teal accents, Open Sans typography, and 4-level density scaling.";
  if (lower.includes("material") || lower.includes("m3")) return "Switching to Material Design 3 by Google. This features dynamic color, rounded components, and the Roboto type scale.";
  if (lower.includes("fluent")) return "Switching to Fluent 2 by Microsoft. This uses the Segoe UI type ramp, subtle shadows, and the Microsoft brand blue palette.";
  if (lower.includes("download") || lower.includes("export")) return "Your project package is ready! Click the 'Download Package' button below the preview to get your files.";
  if (lower.includes("push") || lower.includes("github") || lower.includes("repo")) return "To push to GitHub, click the 'Push to Repo' button and connect your GitHub account. I'll create a new repository with all your generated files.";
  return AI_RESPONSES.default;
}

export function ChatPanel() {
  const {
    messages, inputText, isVoiceActive, isGenerating,
    setInputText, addMessage, toggleVoice, setGenerating, bumpPreview,
    interfaceType,
  } = useBuilder();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isGenerating) return;
    addMessage("user", text);
    setGenerating(true);

    setTimeout(() => {
      addMessage("ai", getAIResponse(text, interfaceType));
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

  return (
    <>
      <div className="chat-area">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-msg chat-msg-${msg.role}`}>
            {msg.role === "ai" && (
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--b-accent2)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                AI Builder
              </div>
            )}
            {msg.content}
          </div>
        ))}
        {isGenerating && (
          <div className="chat-msg chat-msg-ai">
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--b-accent2)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              AI Builder
            </div>
            <div className="typing-dots">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input-bar">
        <button
          className={`voice-btn ${isVoiceActive ? "active" : ""}`}
          onClick={toggleVoice}
          title={isVoiceActive ? "Stop voice" : "Start voice"}
          aria-label="Toggle voice input"
        >
          {isVoiceActive ? "⏹" : "🎤"}
        </button>

        <div className="chat-input-wrap">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            rows={1}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!inputText.trim() || isGenerating}
            aria-label="Send message"
          >
            ➜
          </button>
        </div>
      </div>
    </>
  );
}
