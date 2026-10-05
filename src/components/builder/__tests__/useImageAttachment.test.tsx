/* useImageAttachment: paste only takes over a clipboard that carries an
   image and no text; the window guard stops a stray file drop from
   navigating the builder away; errors re-announce and can be cleared. */
import { describe, it, expect, afterEach } from "vitest";
import type React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { shouldInterceptPaste, useImageAttachment } from "../useImageAttachment";

describe("shouldInterceptPaste", () => {
  const clip = (types: string[], fileCount: number, text = "", html = "") => ({ types, fileCount, text, html });
  it("takes over an image-only clipboard", () => {
    expect(shouldInterceptPaste(clip(["Files"], 1))).toBe(true);
  });
  it("leaves Office-style clipboards (text plus a rendered bitmap) to paste as text", () => {
    expect(shouldInterceptPaste(clip(["text/plain", "text/html", "Files"], 1, "Q3 revenue", "<table><tr><td>Q3 revenue</td></tr></table>"))).toBe(false);
    expect(shouldInterceptPaste(clip(["text/plain", "Files"], 1, "Q3 revenue"))).toBe(false);
    expect(shouldInterceptPaste(clip(["text/html", "Files"], 1, "", "<p>Q3 revenue</p>"))).toBe(false);
  });
  it("takes over 'Copy image' from a web page: html that is only an img tag, empty text", () => {
    expect(shouldInterceptPaste(clip(["text/html", "Files"], 1, "", '<meta charset="utf-8"><img src="https://example.com/a.png" alt="">'))).toBe(true);
    expect(shouldInterceptPaste(clip(["text/plain", "text/html", "Files"], 1, "  ", "<html><body><!--StartFragment--><img src=x><!--EndFragment--></body></html>"))).toBe(true);
  });
  it("ignores a clipboard with no files", () => {
    expect(shouldInterceptPaste(clip(["text/plain"], 0, "hi"))).toBe(false);
  });
});

let api: ReturnType<typeof useImageAttachment>;
function Probe({ enabled = true }: { enabled?: boolean }) {
  api = useImageAttachment({ enabled });
  return null;
}
let root: Root | null = null;
function mount(enabled = true) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container);
    root.render(<Probe enabled={enabled} />);
  });
}
afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
});

function fileDragEvent(type: "dragover" | "drop"): Event {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, "dataTransfer", { value: { types: ["Files"], dropEffect: "none" } });
  return ev;
}

describe("window drop guard", () => {
  it("prevents the browser from opening a file dropped outside the composer, while mounted", () => {
    mount();
    const over = fileDragEvent("dragover");
    const drop = fileDragEvent("drop");
    window.dispatchEvent(over);
    window.dispatchEvent(drop);
    expect(over.defaultPrevented).toBe(true);
    expect(drop.defaultPrevented).toBe(true);
  });

  it("removes the guard on unmount", () => {
    mount();
    act(() => root!.unmount());
    root = null;
    const drop = fileDragEvent("drop");
    window.dispatchEvent(drop);
    expect(drop.defaultPrevented).toBe(false);
  });

  it("leaves non-file drags alone", () => {
    mount();
    const ev = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(ev, "dataTransfer", { value: { types: ["text/plain"] } });
    window.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });
});

describe("errors", () => {
  it("bumps a sequence on every error so a repeat is re-announced, and clearError dismisses", () => {
    mount();
    act(() => api.showError("Same message"));
    const first = api.errorSeq;
    act(() => api.showError("Same message"));
    expect(api.errorSeq).toBeGreaterThan(first);
    act(() => api.clearError());
    expect(api.error).toBeNull();
  });

  it("restore does not overwrite a newer attachment", () => {
    mount();
    act(() => api.restore({ mediaType: "image/png", base64: "AAAA", width: 2, height: 2, bytes: 3 }, "newer.png"));
    act(() => api.restore({ mediaType: "image/png", base64: "BBBB", width: 2, height: 2, bytes: 3 }, "older.png"));
    expect(api.attachment?.name).toBe("newer.png");
  });

  it("restore puts an image back after a send could not go through", () => {
    mount();
    act(() =>
      api.restore({ mediaType: "image/png", base64: "AAAA", width: 2, height: 2, bytes: 3 }, "back.png"),
    );
    expect(api.attachment?.name).toBe("back.png");
  });

  it("announces Preparing image while it works", () => {
    mount();
    act(() => {
      api.onFileInputChange({ target: { files: [new File([new Uint8Array([1])], "a.png")], value: "" } } as unknown as React.ChangeEvent<HTMLInputElement>);
    });
    expect(api.busy).toBe(true);
    expect(api.notice).toBe("Preparing image…");
  });
});
