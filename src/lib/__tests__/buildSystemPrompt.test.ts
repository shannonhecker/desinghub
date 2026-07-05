import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  VALID_DESIGN_SYSTEMS,
  type DesignSystem,
} from "../buildSystemPrompt";
import { SYSTEM_PROMPT, MAX_ADD_BLOCKS_PER_TURN } from "../chatSystem";

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

/* Owner bug (2026-06-08): asked the chat to add a SECOND Data Table; it refused
   because "at most 1 table" read as a hard rule. The block budget and one-table
   limits are defaults for GENERATING a fresh layout, not a cap on what the user
   can explicitly ask to add. The prompt must carve out explicit add-requests so
   a duplicate of any existing block type is honored. */
describe("buildSystemPrompt — explicit add-requests override generation defaults", () => {
  it("frames the budget + one-table limits as generation defaults, not hard caps", () => {
    expect(SYSTEM_PROMPT).toContain("defaults for GENERATING a fresh");
  });

  it("honors an explicit request to add a duplicate block type (incl. a second table)", () => {
    expect(SYSTEM_PROMPT).toContain("explicitly asks to add");
    expect(SYSTEM_PROMPT).toContain("Never refuse to add a block just because");
  });

  it("relaxes the one-table rule when the user explicitly asks for more", () => {
    expect(SYSTEM_PROMPT).toContain("the user explicitly asks for another table");
  });
});

/* Chat add-anything: the prompt must guarantee that ANY block type can go in
   ANY zone, that explicit add-requests (including duplicates and polite
   question-form asks) always produce an addBlock in the same turn, and that
   every composition limit is scoped to auto-generation only. These pins keep
   a future prompt refactor from silently reintroducing refusals. */
describe("buildSystemPrompt — any block, any zone, duplicates always land", () => {
  it("declares any block type can live in any zone", () => {
    expect(SYSTEM_PROMPT).toContain("ANY block type");
    expect(SYSTEM_PROMPT).toContain("can go in ANY zone");
  });

  it("routes a user-named zone into the addBlock zone field", () => {
    expect(SYSTEM_PROMPT).toContain("When the user names a zone");
  });

  it("budget + hard ceiling never block an explicit add-request", () => {
    expect(SYSTEM_PROMPT).toContain("add-request is never blocked by them");
  });

  it("classifies polite question-form change requests as BUILD requests", () => {
    expect(SYSTEM_PROMPT).toContain("is a BUILD request, not a question");
  });

  it("explicit adds always emit addBlock in the same turn", () => {
    expect(SYSTEM_PROMPT).toContain("ALWAYS gets an addBlock");
  });

  it("explicit zone-move requests execute via moveBlock", () => {
    expect(SYSTEM_PROMPT).toContain("do it - emit moveBlock");
  });

  it("scopes the answers-a-real-question test to model-chosen blocks", () => {
    expect(SYSTEM_PROMPT).toContain("is its own justification");
  });

  it("scopes the one-primary-button rule to auto-generation", () => {
    expect(SYSTEM_PROMPT).toContain("explicit ask for more primaries");
  });

  it("explicit table asks derive domain columns and rows from context", () => {
    expect(SYSTEM_PROMPT).toContain("deriving domain columns and rows");
  });
});

/* Honest partial delivery: applyAIActions hard-caps addBlock actions per
   turn, so the prompt must state the cap and forbid claiming quantities
   that were never emitted. The number is interpolated from the shared
   constant so prompt and runtime cannot drift apart. Freeform deixis:
   "could this chart go in the sidebar?" with two charts and nothing
   selected must trigger a which-one question, not an arbitrary move. */
describe("buildSystemPrompt: add-cap honesty + freeform disambiguation", () => {
  it("states the hard per-turn addBlock cap using the runtime constant", () => {
    expect(SYSTEM_PROMPT).toContain(
      `at most ${MAX_ADD_BLOCKS_PER_TURN} addBlock actions per turn`,
    );
  });

  it("forbids claiming a quantity that was not emitted", () => {
    expect(SYSTEM_PROMPT).toContain("Never claim a quantity you did not emit");
  });

  it("guards ambiguous deixis in freeform scope with a which-one question", () => {
    expect(SYSTEM_PROMPT).toContain("ask which one first");
  });
});
