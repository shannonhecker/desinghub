import { describe, it, expect, beforeEach } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { saveTurnSnapshot, getTurnSnapshot, clearTurnSnapshots } from "@/lib/turnSnapshots";

/* Phase 2 (turn history restore cards): the snapshot layer + the addMessage
   id contract it relies on. */
describe("turn snapshots", () => {
  beforeEach(() => {
    clearTurnSnapshots();
  });

  it("addMessage returns the new message id (contract for keying snapshots)", () => {
    const id = useBuilder.getState().addMessage("user", "make the header blue");
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
    expect(useBuilder.getState().messages.at(-1)?.id).toBe(id);
  });

  it("captures the PRE-turn canvas and retrieves it by message id", () => {
    useBuilder.setState({ blocks: [{ id: "x", type: "SimulatedCard", props: {} }] } as never);
    saveTurnSnapshot("m1");
    const snap = getTurnSnapshot("m1");
    expect(snap).toBeDefined();
    expect(snap?.blocks?.[0]?.id).toBe("x");
  });

  it("is immutable to later canvas changes (snapshot is the pre-turn state)", () => {
    useBuilder.setState({ blocks: [{ id: "before", type: "SimulatedCard", props: {} }] } as never);
    saveTurnSnapshot("m2");
    useBuilder.setState({ blocks: [{ id: "after", type: "SimulatedCard", props: {} }] } as never);
    expect(getTurnSnapshot("m2")?.blocks?.[0]?.id).toBe("before");
  });

  it("returns undefined for an unknown message id (no card rendered)", () => {
    expect(getTurnSnapshot("nope")).toBeUndefined();
  });
});
