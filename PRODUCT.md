# Product

## Register

product

## Users

Design-engineering hybrids — practitioners who design AND ship code. They're typically senior ICs or DS leads inside product orgs, told to pick or defend a design system choice for their team. They don't have weeks to learn five systems deeply, and they don't trust AI tools that hallucinate component APIs. They use uoaui to compare DS code output (component APIs, theming hooks, token shapes) under realistic conditions, then walk away with a defended recommendation they can take to their team. The artifact uoaui produces is the *decision*, not just code.

## Product Purpose

uoaui is an AI Design-System Builder. Users bring one product brief; uoaui produces parallel interface directions in Salt DS, Material Design 3, Fluent 2, Carbon, and uoaui's own system — same brief, five systems, immediately comparable. Success means a user leaves with confidence: "I now know which DS fits my product." Output is the decision artifact, not the code.

## Brand Personality

Expert · calm · committed.

Linear / Raycast lane. The tool that knows more than you and tells you confidently. Visual restraint over flash; substance over showmanship. The aurora and beam stay, but tone down — they're a greeting, not the pitch.

## Anti-references

uoaui must not look like:

- **Generic SaaS dashboards.** Sidebar nav, card grids, purple-to-blue gradients, hero with stat counter, "AI-powered" subheading. The default shape of every YC landing 2024–2026.
- **Tailwind / shadcn default look.** Slate gray on white, rounded-md cards, lucide icons in tiles above headings, Inter-everywhere typography. Signals "I didn't make a typography choice."
- **Crypto / AI neon-on-black glow.** Dark surfaces with neon accents, animated grid backgrounds, "futuristic" chrome. The aesthetic every AI tool pushed to caricature in 2025.
- **Bento-grid template feel.** The Apple-style irregular tile grid every AI tool copied in 2025. Reads as template-y now.

## Design Principles

1. **Output the decision, not the code.** Every surface earns its place by moving the user toward a defendable DS recommendation. Code, comparisons, and visuals are means; the artifact is conviction.

2. **Practice what you preach.** uoaui is a tool about design systems — our own UI must be a credible exemplar of DS rigor. If we can't model it ourselves, we can't sell it.

3. **Expert confidence over showmanship.** Design-engineering hybrids notice flash but respect substance. State the recommendation. Show the evidence. Don't ornament the conclusion.

4. **Five systems coexist; uoaui owns the chrome.** When showing Salt / M3 / Fluent / Carbon previews, respect each system's tokens, density, and conventions faithfully. When the user is in uoaui's own surface (landing, builder chrome, settings), uoaui's identity dominates without compromise.

5. **Reduced motion is a design choice, not a checkbox.** The aurora and beam are decoration; the product still has to read calmly without them. Default to "could this be told without animation?" before adding any motion.

## Accessibility & Inclusion

- **WCAG 2.2 AA baseline.** Text 4.5:1, large text 3:1, focus indicators visible, all interactive targets ≥44×44.
- **`prefers-reduced-motion` is respected fully.** Aurora animation, beam shader, scroll-driven reveals all pause or simplify; no information conveyed by motion alone.
- **Keyboard parity** for the builder canvas, theme builder, and token editor. DnD operations have keyboard alternatives.
- **No information by color alone.** When showing DS palette comparisons, always pair color with label, position, or pattern.
