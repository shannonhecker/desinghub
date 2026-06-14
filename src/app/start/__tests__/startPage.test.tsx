/* ════════════════════════════════════════════════════════════
   /start cold-start sibling — behaviour + copy contract.

   Verifies the deep-link contract shared with feat/builder-deeplink-
   prompt: submit pushes /builder?prompt=<encodeURIComponent(text)>,
   empty submits are blocked, Enter submits, and chips prefill the
   textarea. Also guards the STOP-class no-em/en-dash copy rule.

   Uses react-dom/client + act() directly (no RTL in this repo),
   matching landingPolish.test.tsx.
   ════════════════════════════════════════════════════════════ */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterEach,
  beforeEach,
  vi,
} from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/* Mock next/navigation BEFORE importing the page so useRouter is
   replaced. push() is a shared spy we assert on. */
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
}));

import StartPage from "../page";

const PAGE_PATH = resolve(process.cwd(), "src/app/start/page.tsx");
const CSS_PATH = resolve(process.cwd(), "src/app/start/start.css");

beforeAll(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
});

let root: Root | null = null;
let container: HTMLDivElement | null = null;

beforeEach(() => {
  push.mockReset();
});

afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
  container?.remove();
  container = null;
});

function render(): HTMLElement {
  container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container!);
    root.render(<StartPage />);
  });
  return container;
}

/* React tracks the textarea value via its own setter; dispatching a
   native input event after calling the native value setter is the
   canonical way to drive a controlled input without RTL. */
function setTextarea(el: HTMLElement, text: string): HTMLTextAreaElement {
  const ta = el.querySelector<HTMLTextAreaElement>("#start-prompt")!;
  const proto = Object.getPrototypeOf(ta);
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  act(() => {
    setter?.call(ta, text);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  });
  return ta;
}

describe("/start structure + a11y", () => {
  it("renders a form with a visible label bound to the textarea", () => {
    const el = render();
    const ta = el.querySelector<HTMLTextAreaElement>("#start-prompt");
    const label = el.querySelector<HTMLLabelElement>('label[for="start-prompt"]');
    expect(ta).not.toBeNull();
    expect(label).not.toBeNull();
    expect((label?.textContent ?? "").trim().length).toBeGreaterThan(0);
    expect(el.querySelector("form")).not.toBeNull();
  });

  it("carries the hero class so globals.css :has(.hero) unlocks scroll", () => {
    const el = render();
    expect(el.querySelector(".start-root.hero")).not.toBeNull();
  });

  it("renders example-prompt chips as buttons", () => {
    const el = render();
    const chips = el.querySelectorAll(".start-chip");
    expect(chips.length).toBeGreaterThanOrEqual(3);
    chips.forEach((c) => expect(c.getAttribute("type")).toBe("button"));
  });
});

describe("/start deep-link contract", () => {
  it("submit pushes /builder?prompt=<encodeURIComponent(text)>", () => {
    const el = render();
    const text = "A pricing page with three cards & a toggle";
    setTextarea(el, text);
    act(() => {
      el.querySelector<HTMLFormElement>("form")!.requestSubmit();
    });
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(
      "/builder?prompt=" + encodeURIComponent(text),
    );
  });

  it("trims surrounding whitespace before encoding", () => {
    const el = render();
    setTextarea(el, "   hello world   ");
    act(() => {
      el.querySelector<HTMLFormElement>("form")!.requestSubmit();
    });
    expect(push).toHaveBeenCalledWith(
      "/builder?prompt=" + encodeURIComponent("hello world"),
    );
  });

  it("blocks empty / whitespace-only submits", () => {
    const el = render();
    setTextarea(el, "    ");
    act(() => {
      el.querySelector<HTMLFormElement>("form")!.requestSubmit();
    });
    expect(push).not.toHaveBeenCalled();
  });

  it("Enter submits, Shift+Enter does not", () => {
    const el = render();
    const ta = setTextarea(el, "build a dashboard");

    act(() => {
      ta.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    expect(push).not.toHaveBeenCalled();

    act(() => {
      ta.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });
    expect(push).toHaveBeenCalledWith(
      "/builder?prompt=" + encodeURIComponent("build a dashboard"),
    );
  });

  it("a chip prefills the textarea", () => {
    const el = render();
    const chip = el.querySelector<HTMLButtonElement>(".start-chip")!;
    act(() => chip.click());
    const ta = el.querySelector<HTMLTextAreaElement>("#start-prompt")!;
    expect(ta.value.length).toBeGreaterThan(0);
    expect(ta.value).toBe(chip.textContent);
  });
});

describe("/start copy rule (STOP-class)", () => {
  it("page source has no em or en dashes in visible copy", () => {
    const src = readFileSync(PAGE_PATH, "utf8");
    expect(src).not.toMatch(/[—–]/);
  });
  it("start.css comments use no em or en dashes that could ship", () => {
    // CSS comments do not render, but keep the file dash-clean too.
    const css = readFileSync(CSS_PATH, "utf8");
    expect(css).not.toMatch(/[—–]/);
  });
});
