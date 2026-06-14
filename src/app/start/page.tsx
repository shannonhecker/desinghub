"use client";

/* ════════════════════════════════════════════════════════════
   /start: prompt-first cold-start SIBLING (prototype).

   WHY THIS EXISTS
   The live homepage (src/app/page.tsx) opens with a DECORATIVE,
   aria-hidden prompt SVG and static <Link href="/builder"> CTAs.
   There is no real prompt input anywhere in the product.

   This route is a safe place to prototype a REAL prompt-first cold
   start: a controlled textarea that deep-links straight into the
   builder. The live hero is deliberately NOT touched here: two
   prior hero rewrites were reverted, so structural changes to the
   hero are high-risk. Promoting this into the live hero is a
   SEPARATE, owner-gated decision.

   DEEP-LINK CONTRACT (shared with feat/builder-deeplink-prompt)
   On submit we navigate to:
       /builder?prompt=<encodeURIComponent(text)>
   - param name is exactly `prompt`
   - the existing ?ds= convention stays composable, e.g.
       /builder?prompt=...&ds=salt
     (no DS is chosen on this screen yet, so we emit prompt only,
     and the receiving side defaults the system.)

   SCROLL
   globals.css gates page scroll behind :has(.hero). The root here
   carries the `hero` class purely to satisfy that selector so the
   page is not scroll-locked; no live-hero styles leak in because
   every style in start.css is scoped under `.start-*` class names.

   STYLING
   All visuals reference EXISTING root-level design tokens (--dh,
   --aurora, --lsl-text). No --lsl, --dh or --a token is redefined.
   New locals are namespaced --start.
   ════════════════════════════════════════════════════════════ */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "./start.css";

/* Example prompts that prefill the textarea. Kept concrete and
   system-flavoured so the first thing a visitor sees is a real
   product brief, not lorem. No em/en dashes (STOP-class copy rule). */
const EXAMPLES: readonly string[] = [
  "A pricing page with three plan cards and a monthly or yearly toggle",
  "A SaaS dashboard shell: side nav, top bar, and a stats overview row",
  "A sign-up form with email, password, and a primary submit button",
  "A settings page with grouped sections and a save action",
];

export default function StartPage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /* Build the deep link once, so the contract lives in exactly one
     place. Returns null when there is nothing to send. */
  function buildHref(raw: string): string | null {
    const p = raw.trim();
    if (!p) return null;
    return "/builder?prompt=" + encodeURIComponent(p);
  }

  function submit() {
    const href = buildHref(value);
    if (!href) return; // block empty submits
    router.push(href);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit();
  }

  /* Enter submits, Shift+Enter inserts a newline. */
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function useExample(text: string) {
    setValue(text);
    // Return focus to the field so the visitor can edit or send.
    textareaRef.current?.focus();
  }

  const canSend = value.trim().length > 0;

  return (
    // `hero` satisfies globals.css :has(.hero) so the page can scroll.
    // `start-root` is the scoped style namespace for this prototype.
    <main className="hero start-root">
      <div className="start-atmosphere" aria-hidden="true">
        <span className="start-blob start-blob-teal" />
        <span className="start-blob start-blob-purple" />
        <span className="start-blob start-blob-peach" />
      </div>

      <div className="start-shell">
        <p className="start-eyebrow">
          <span className="start-eyebrow-dot" aria-hidden="true" />
          uoaui.ai / start from a prompt
        </p>

        <h1 className="start-headline">
          Describe the screen.
          <br />
          <em>Watch it build.</em>
        </h1>

        <p className="start-lede">
          Type what you want to make. We open the builder with your brief
          already loaded, ready to render real components across five design
          systems.
        </p>

        <form className="start-form" onSubmit={onSubmit}>
          <label className="start-label" htmlFor="start-prompt">
            What do you want to build?
          </label>

          <div className="start-field">
            <textarea
              id="start-prompt"
              ref={textareaRef}
              className="start-textarea"
              name="prompt"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="A landing page for a habit-tracker app, with a hero, a feature grid, and a sign-up form..."
              rows={4}
              autoComplete="off"
              spellCheck
              aria-describedby="start-hint"
            />

            <div className="start-actions">
              <p id="start-hint" className="start-hint">
                Press Enter to open the builder. Shift plus Enter adds a line.
              </p>
              <button
                type="submit"
                className="start-submit"
                disabled={!canSend}
                aria-label="Open the builder with this prompt"
              >
                <span>Open builder</span>
                <svg
                  className="start-submit-arrow"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M5 12h13M13 6l6 6-6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </form>

        <div className="start-examples" role="group" aria-label="Example prompts">
          <p className="start-examples-label">Or start from an example</p>
          <ul className="start-chip-list">
            {EXAMPLES.map((ex) => (
              <li key={ex}>
                <button
                  type="button"
                  className="start-chip"
                  onClick={() => useExample(ex)}
                >
                  {ex}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
