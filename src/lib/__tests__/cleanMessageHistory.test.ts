import { describe, it, expect } from "vitest";
import { cleanHistoryForAPI } from "../cleanMessageHistory";
import type { ChatMessage } from "@/store/useBuilder";

const msg = (
  role: "user" | "ai",
  content: string,
  i: number = 0,
): ChatMessage => ({
  id: `m${i}`,
  role,
  content,
  timestamp: 1700000000000 + i,
});

describe("cleanHistoryForAPI", () => {
  it("strips the [Current state: ...]\\n\\n prefix from a prior user turn", () => {
    const out = cleanHistoryForAPI([
      msg(
        "user",
        "[Current state: design_system=salt, mode=dark, density=medium, interface_type=dashboard, selected_components=[buttons]]\n\nadd a hero",
        0,
      ),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({ role: "user", content: "add a hero" });
  });

  it("leaves content without the prefix untouched", () => {
    const out = cleanHistoryForAPI([
      msg("user", "plain user message", 0),
      msg("ai", "plain assistant reply", 1),
    ]);
    expect(out).toEqual([
      { role: "user", content: "plain user message" },
      { role: "assistant", content: "plain assistant reply" },
    ]);
  });

  it("caps history to the last 20 turns", () => {
    const many: ChatMessage[] = [];
    for (let i = 0; i < 30; i++) {
      many.push(msg(i % 2 === 0 ? "user" : "ai", `turn ${i}`, i));
    }
    const out = cleanHistoryForAPI(many);
    expect(out).toHaveLength(20);
    // Should be the LAST 20 - first surviving turn should be #10
    expect(out[0].content).toBe("turn 10");
    expect(out[19].content).toBe("turn 29");
  });

  it("handles an empty messages array", () => {
    expect(cleanHistoryForAPI([])).toEqual([]);
  });

  it("preserves message order within the trimmed window", () => {
    const seq: ChatMessage[] = [
      msg("user", "first", 0),
      msg("ai", "second", 1),
      msg("user", "third", 2),
      msg("ai", "fourth", 3),
    ];
    const out = cleanHistoryForAPI(seq);
    expect(out.map((m) => m.content)).toEqual([
      "first",
      "second",
      "third",
      "fourth",
    ]);
    expect(out.map((m) => m.role)).toEqual([
      "user",
      "assistant",
      "user",
      "assistant",
    ]);
  });

  it("strips a prefix that includes a selected_block payload with JSON braces", () => {
    const out = cleanHistoryForAPI([
      msg(
        "user",
        `[Current state: design_system=m3, mode=light, density=medium, interface_type=dashboard, selected_components=[buttons,cards], selected_block={id:"b-1", type:"Button", zone:"body", props:{"label":"Save"}}]\n\nrename to Submit`,
        0,
      ),
    ]);
    expect(out[0].content).toBe("rename to Submit");
  });
});
