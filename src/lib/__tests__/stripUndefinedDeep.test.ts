import { describe, it, expect, beforeEach } from "vitest";
import { stripUndefinedDeep, findUndefinedPaths } from "../stripUndefinedDeep";
import { useBuilder } from "@/store/useBuilder";
import { applyAIActions } from "../applyAIActions";
import { buildProjectSnapshot, buildCloudSnapshot } from "../firebase";

describe("stripUndefinedDeep", () => {
  it("drops undefined object keys at any depth and keeps falsy values", () => {
    const input = { a: undefined, b: 0, c: "", d: false, e: null, f: { g: undefined, h: { i: undefined, j: 1 } } };
    expect(stripUndefinedDeep(input)).toEqual({ b: 0, c: "", d: false, e: null, f: { h: { j: 1 } } });
    expect(findUndefinedPaths(stripUndefinedDeep(input))).toEqual([]);
  });

  it("turns undefined array items into null so positions are kept, and recurses into arrays", () => {
    const input = { list: [1, undefined, { x: undefined, y: [undefined, { z: undefined }] }] };
    expect(stripUndefinedDeep(input)).toEqual({ list: [1, null, { y: [null, {}] }] });
  });

  it("does not mutate its input and leaves class instances alone", () => {
    class Stamp { constructor(public seconds: number, public extra?: number) {} }
    const stamp = new Stamp(5);
    const input = { when: stamp, nested: { k: undefined } };
    const out = stripUndefinedDeep(input) as { when: unknown; nested: object };
    expect(out.when).toBe(stamp);
    expect("k" in input.nested).toBe(true);
    expect(out.nested).toEqual({});
  });

  it("findUndefinedPaths names where undefined sits", () => {
    expect(findUndefinedPaths({ a: [{ b: undefined }], c: undefined })).toEqual([".a[0].b", ".c"]);
  });
});

describe("cloud snapshot after an AI build has no undefined", () => {
  beforeEach(() => {
    useBuilder.setState({ messages: [], blocks: [], headerBlocks: [], sidebarBlocks: [], footerBlocks: [] });
  });

  it("messages from addMessage carry no undefined messageType", () => {
    useBuilder.getState().addMessage("user", "Build this screen", undefined, { attachment: "image" });
    useBuilder.getState().addMessage("ai", "Built it.");
    const msgs = useBuilder.getState().messages;
    expect(msgs.every((m) => !("messageType" in m))).toBe(true);
    expect(findUndefinedPaths(msgs)).toEqual([]);
  });

  it("an AI action list with omitted props, layout and index leaves no undefined in the snapshot", () => {
    useBuilder.getState().addMessage("user", "Build this screen");
    useBuilder.getState().addMessage("ai", "On it.");
    applyAIActions(
      [
        { action: "clearCanvas", value: { zone: "body" } },
        { action: "addBlock", value: { type: "SimulatedStatCard" } },
        { action: "addBlock", value: { type: "SimulatedDataTable", props: { title: "Data sources", subtitle: undefined } } },
        { action: "addBlock", value: { type: "SimulatedCard", props: { title: "Report defaults" }, layout: { width: "fill", maxWidth: undefined } } },
      ] as never,
      "m1",
    );
    const snap = stripUndefinedDeep(buildProjectSnapshot(useBuilder.getState()));
    expect(findUndefinedPaths(snap)).toEqual([]);
  });

  it("the snapshot the cloud save writes is stripped, even when the store holds a stray undefined", () => {
    useBuilder.setState({
      messages: [{ id: "m", role: "user", content: "hi", timestamp: 1, messageType: undefined }],
      blocks: [{ id: "b", type: "SimulatedCard", props: { title: undefined } }],
    } as never);
    expect(findUndefinedPaths(buildProjectSnapshot(useBuilder.getState())).length).toBeGreaterThan(0);
    expect(findUndefinedPaths(buildCloudSnapshot(useBuilder.getState()))).toEqual([]);
  });
});
