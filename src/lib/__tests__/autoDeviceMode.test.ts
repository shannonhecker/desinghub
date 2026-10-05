import { describe, it, expect, beforeEach } from "vitest";
import { useBuilder, effectiveDeviceMode } from "@/store/useBuilder";
import { buildSharedCanvas } from "../shareState";
import { captureSnapshot, initBuilderHistory, undo } from "../builderHistory";

/* A phone opens the canvas in its phone frame on its own. That choice is the
   screen's, not the author's: it must not travel in a shared link, and Undo
   must not flip it back. */
beforeEach(() => {
  useBuilder.setState({ deviceMode: "desktop", autoDeviceMode: null } as never);
});

describe("the automatic phone frame", () => {
  it("renders as the phone frame while the saved choice stays desktop", () => {
    useBuilder.getState().setAutoDeviceMode("mobile");
    const s = useBuilder.getState();
    expect(effectiveDeviceMode(s)).toBe("mobile");
    expect(s.deviceMode).toBe("desktop");
  });

  it("is not written into a share link", () => {
    useBuilder.getState().setAutoDeviceMode("mobile");
    expect(buildSharedCanvas(useBuilder.getState()).deviceMode).toBe("desktop");
  });

  it("is not part of the undo history, and the first Undo does not flip it", () => {
    const stop = initBuilderHistory();
    try {
      const before = captureSnapshot();
      useBuilder.getState().setAutoDeviceMode("mobile");
      expect(captureSnapshot()).toEqual(before);
      useBuilder.getState().setBlocks([{ id: "a", type: "SimulatedTitle", props: { text: "Hi" } }]);
      undo();
      expect(effectiveDeviceMode(useBuilder.getState())).toBe("mobile");
    } finally {
      stop();
    }
  });

  it("a device the person picks replaces it, and is what a link carries", () => {
    useBuilder.getState().setAutoDeviceMode("mobile");
    useBuilder.getState().setDeviceMode("tablet");
    const s = useBuilder.getState();
    expect(s.autoDeviceMode).toBeNull();
    expect(effectiveDeviceMode(s)).toBe("tablet");
    expect(buildSharedCanvas(s).deviceMode).toBe("tablet");
  });
});
