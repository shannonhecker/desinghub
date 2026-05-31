import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  VALID_DESIGN_SYSTEMS,
  type DesignSystem,
} from "../buildSystemPrompt";
import { SYSTEM_PROMPT } from "../chatSystem";

describe("buildSystemPrompt", () => {
  it("includes the Salt addendum for 'salt'", () => {
    const out = buildSystemPrompt("salt");
    expect(out).toContain(SYSTEM_PROMPT);
    expect(out).toContain("--salt-* tokens");
    expect(out).toContain("solid/bordered/transparent");
    expect(out).toContain("SaltProvider");
  });

  it("includes the Material 3 addendum for 'm3'", () => {
    const out = buildSystemPrompt("m3");
    expect(out).toContain("--md-sys-color-* tokens");
    expect(out).toContain("filled/outlined/text/elevated/tonal");
  });

  it("includes the Fluent addendum for 'fluent'", () => {
    const out = buildSystemPrompt("fluent");
    expect(out).toContain("--color* / --fontFamily* tokens");
    expect(out).toContain("primary/default/outline/subtle");
  });

  it("includes the Carbon addendum for 'carbon'", () => {
    const out = buildSystemPrompt("carbon");
    expect(out).toContain("--cds-* tokens");
    expect(out).toContain("Flat, radius 0");
    expect(out).toContain("compact/normal/spacious");
  });

  it("includes the uoaui addendum for 'uoaui'", () => {
    const out = buildSystemPrompt("uoaui");
    expect(out).toContain("--a-* tokens");
    expect(out).toContain("Glass surfaces");
    expect(out).toContain("backdrop-filter");
  });

  it("each canonical DS produces a prompt containing its addendum", () => {
    for (const ds of VALID_DESIGN_SYSTEMS) {
      const out = buildSystemPrompt(ds);
      expect(out).toContain(SYSTEM_PROMPT);
      expect(out).toContain(`## Active Design System: ${ds}`);
    }
  });

  it("defaults to salt when input is undefined", () => {
    const out = buildSystemPrompt(undefined);
    expect(out).toContain("## Active Design System: salt");
    expect(out).toContain("--salt-* tokens");
  });

  it("defaults to salt when input is null", () => {
    const out = buildSystemPrompt(null);
    expect(out).toContain("## Active Design System: salt");
    expect(out).toContain("--salt-* tokens");
  });

  it("returns base prompt (no addendum) for non-canonical strings", () => {
    const out = buildSystemPrompt("not-a-real-ds");
    expect(out).toBe(SYSTEM_PROMPT);
    expect(out).not.toContain("## Active Design System:");
  });

  it("returns base prompt for empty string", () => {
    const out = buildSystemPrompt("");
    expect(out).toBe(SYSTEM_PROMPT);
  });

  it("returns base prompt for prompt-injection-like input", () => {
    const out = buildSystemPrompt("<script>alert(1)</script>");
    expect(out).toBe(SYSTEM_PROMPT);
    expect(out).not.toContain("<script>");
  });

  it("exposes a stable list of valid design systems", () => {
    expect(VALID_DESIGN_SYSTEMS).toEqual([
      "salt",
      "m3",
      "fluent",
      "carbon",
      "uoaui",
    ]);
  });

  it("DesignSystem type accepts each valid value", () => {
    // Compile-time check via const assertion
    const salt: DesignSystem = "salt";
    const m3: DesignSystem = "m3";
    const fluent: DesignSystem = "fluent";
    const carbon: DesignSystem = "carbon";
    const uoaui: DesignSystem = "uoaui";
    expect([salt, m3, fluent, carbon, uoaui]).toHaveLength(5);
  });
});

/* P1 "smarter chatbot": the base prompt now carries a build-first directive,
   intent->block heuristics, and worked exemplars so freeform input ("type
   anything") becomes a meaningful real UI instead of an interrogation. */
describe("buildSystemPrompt — smarter-chatbot enrichment (P1)", () => {
  it("base prompt includes the build-first directive, heuristics, and exemplars", () => {
    const out = buildSystemPrompt("salt");
    expect(out).toContain("Interpreting Freeform Requests");
    expect(out).toContain("Block-Selection Heuristics");
    expect(out).toContain("Worked Exemplars");
  });

  it("heuristics map common intents to concrete blocks", () => {
    expect(SYSTEM_PROMPT).toContain("a single metric / KPI / number -> SimulatedStatCard");
    expect(SYSTEM_PROMPT).toContain("a trend over time -> HighchartLine");
    expect(SYSTEM_PROMPT).toContain("domain-specific records the user will read or act on");
  });

  it("build-first directive biases toward building over interrogating", () => {
    expect(SYSTEM_PROMPT).toContain("Default to BUILDING a sensible first draft");
    expect(SYSTEM_PROMPT).toContain("Ask AT MOST one clarifying question");
    expect(SYSTEM_PROMPT).toContain("fill each row to 100%");
  });

  it("DS addenda carry the real per-DS button prop mapping (matches the registry)", () => {
    expect(buildSystemPrompt("salt")).toContain("sentiment");
    expect(buildSystemPrompt("m3")).toContain("contained");
    expect(buildSystemPrompt("carbon")).toContain("tertiary");
    expect(buildSystemPrompt("uoaui")).toContain("a-btn");
  });
});

/* Simplicity discipline: the build-first prompt now caps block count, fixes
   the reading order (KPIs first), gates questions away from scaffolds, bans
   the generic users table, and pins grid widths so rows don't wrap. These keep
   generated UI simple and aligned instead of noisy. */
describe("buildSystemPrompt — simplicity / de-noise discipline", () => {
  it("caps the block budget so dashboards stay readable", () => {
    expect(SYSTEM_PROMPT).toContain("Block budget: aim for 5-9 blocks");
  });

  it("mandates KPIs-first reading order (not buried at the bottom)", () => {
    expect(SYSTEM_PROMPT).toContain("KPI stat-card row directly under the title");
  });

  it("gates questions away from generating a scaffold", () => {
    expect(SYSTEM_PROMPT).toContain("If the user is ASKING a question");
  });

  it("bans the generic people/users placeholder table", () => {
    expect(SYSTEM_PROMPT).toContain("NEVER emit a generic people/users table");
  });

  it("pins grid widths so equal rows don't silently wrap", () => {
    expect(SYSTEM_PROMPT).toContain('never mix percentage widths and "fill" in the same row');
  });
});
