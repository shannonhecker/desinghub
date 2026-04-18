"use client";

import React, { useMemo } from "react";

/* ══════════════════════════════════════════════════════════
   FadingWords - renders text one word at a time, each word
   fading in via CSS animation.

   Behaviour:
   - Splits `text` on whitespace (preserving punctuation +
     markdown markers attached to words).
   - Each word is a <span className="chat-word"> with an
     `animation-delay` proportional to its index (20ms per
     word, capped at 800ms so long messages fully reveal
     in under a second on first paint).
   - React stable keys (positional `i`) mean that on streamed
     updates, previously-rendered words keep their final
     state; only newly-appended spans at the tail animate.
     This produces the ChatGPT/Claude.ai "words appearing
     as the model speaks" feel without re-flashing old text.

   Respect for reduced-motion lives in the CSS side: when
   prefers-reduced-motion is set, .chat-word has no
   animation (kills the stagger, words appear instantly).
   ══════════════════════════════════════════════════════════ */

const STAGGER_MS = 20;
const STAGGER_CAP_MS = 800;

export function FadingWords({ text }: { text: string }) {
  /* Memoise the split so we don't re-tokenise on every parent
   *  render (ChatPanel's messages array triggers a lot of
   *  re-renders through the streaming lifecycle). */
  const words = useMemo(() => {
    return text.split(/(\s+)/); // keep whitespace as its own token for faithful layout
  }, [text]);

  return (
    <>
      {words.map((w, i) => {
        if (/^\s+$/.test(w)) {
          /* Whitespace tokens - render as plain text so spaces
             don't get their own fade animation (would look odd). */
          return <React.Fragment key={`ws-${i}`}>{w}</React.Fragment>;
        }
        const delay = Math.min(i * STAGGER_MS, STAGGER_CAP_MS);
        return (
          <span
            key={`w-${i}`}
            className="chat-word"
            style={{ animationDelay: `${delay}ms` }}
          >
            {w}
          </span>
        );
      })}
    </>
  );
}
