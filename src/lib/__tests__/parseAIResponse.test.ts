import { describe, it, expect, vi, afterEach } from "vitest";
import { parseAIResponse } from "../parseAIResponse";

describe("parseAIResponse", () => {
  it("returns text unchanged when no JSON blocks", () => {
    const text = "Here is a simple response with no actions.";
    const { displayText, actions } = parseAIResponse(text);
    expect(displayText).toBe(text);
    expect(actions).toEqual([]);
  });

  it("extracts a single action block", () => {
    const text = 'I\'ll set that up.\n\n```json\n{"action": "setDesignSystem", "value": "m3"}\n```\n\nDone!';
    const { displayText, actions } = parseAIResponse(text);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toEqual({ action: "setDesignSystem", value: "m3" });
    expect(displayText).not.toContain("```json");
    expect(displayText).toContain("Done!");
  });

  it("extracts multiple action blocks", () => {
    const text = [
      "Setting up your config.",
      '```json\n{"action": "setDesignSystem", "value": "salt"}\n```',
      '```json\n{"action": "setMode", "value": "dark"}\n```',
      "All done!",
    ].join("\n\n");

    const { displayText, actions } = parseAIResponse(text);
    expect(actions).toHaveLength(2);
    expect(actions[0].action).toBe("setDesignSystem");
    expect(actions[1].action).toBe("setMode");
    expect(displayText).toContain("Setting up");
    expect(displayText).toContain("All done!");
  });

  it("skips malformed JSON blocks", () => {
    const text = 'Hello\n\n```json\n{this is not valid json}\n```\n\nBye';
    const { displayText, actions } = parseAIResponse(text);
    expect(actions).toEqual([]);
    expect(displayText).toContain("Hello");
  });

  it("skips JSON blocks without an action field", () => {
    const text = '```json\n{"data": "not an action"}\n```';
    const { displayText, actions } = parseAIResponse(text);
    expect(actions).toEqual([]);
  });

  it("collapses excessive newlines after stripping blocks", () => {
    const text = 'Start\n\n\n\n\n```json\n{"action": "setMode", "value": "dark"}\n```\n\n\n\n\nEnd';
    const { displayText } = parseAIResponse(text);
    expect(displayText).not.toMatch(/\n{3,}/);
  });

  describe("hard-reject unknown action types", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("drops unknown action types and warns", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const text = [
        '```json\n{"action": "addBlock", "value": {"type": "button"}}\n```',
        '```json\n{"action": "nonsense", "value": "foo"}\n```',
      ].join("\n\n");

      const { actions } = parseAIResponse(text);

      expect(actions).toHaveLength(1);
      expect(actions[0].action).toBe("addBlock");
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain("nonsense");
    });

    it("preserves valid actions in mixed input and warns once per unknown", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const text = [
        '```json\n{"action": "setDesignSystem", "value": "salt"}\n```',
        '```json\n{"action": "setLayout", "value": "grid"}\n```',
        '```json\n{"action": "setMode", "value": "dark"}\n```',
      ].join("\n\n");

      const { actions } = parseAIResponse(text);

      expect(actions).toHaveLength(2);
      expect(actions.map((a) => a.action)).toEqual(["setDesignSystem", "setMode"]);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain("setLayout");
    });

    it("returns empty array when every action is unknown", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const text = [
        '```json\n{"action": "doTheThing", "value": 1}\n```',
        '```json\n{"action": "anotherFake", "value": 2}\n```',
      ].join("\n\n");

      const { actions } = parseAIResponse(text);

      expect(actions).toEqual([]);
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });

    it("does not warn when JSON is structurally malformed (no regression)", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const text = '```json\n{this is not valid json}\n```';

      const { actions } = parseAIResponse(text);

      expect(actions).toEqual([]);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
