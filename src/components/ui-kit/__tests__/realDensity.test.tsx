/* ════════════════════════════════════════════════════════════
   Density reaches every real renderer. Salt and uoaui scale their tokens
   through their providers; this proves M3, Fluent and Carbon size their
   real components from the same High/Medium/Low/Touch control instead of
   ignoring it.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, afterEach, beforeAll, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

/* Salt's ViewportProvider observes the wrapper; jsdom has no ResizeObserver. */
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === "undefined") {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

/* Fluent's griffel classes are hashed, so the rendered DOM does not reveal the
   size prop. Swap the two most-used Fluent controls for probes that expose it
   and keep everything else real (provider, Field, Badge, ...). */
vi.mock("@fluentui/react-components", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@fluentui/react-components")>();
  return {
    ...actual,
    Button: ({ size, children }: { size?: string; children?: React.ReactNode }) => <button data-fluent-size={size}>{children}</button>,
    Input: ({ size }: { size?: string }) => <input data-fluent-size={size} readOnly />,
  };
});

import { RealComponentRenderer } from "../RealComponentRenderer";
import { getRealBlockRenderer } from "../realBlockMap";

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function render(ui: React.ReactElement): HTMLDivElement {
  container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container!);
    root.render(ui);
  });
  return container;
}

afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
  container?.remove();
  container = null;
});

type Density = "high" | "medium" | "low" | "touch";
const real = (system: "salt" | "m3" | "fluent" | "carbon", type: string, density: Density, props: Record<string, unknown> = {}) =>
  render(<RealComponentRenderer system={system} type={type} mode="light" saltDensity={density} props={props} />);

describe("Salt real blocks — a scoped provider carries the density", () => {
  it("renders a .salt-provider wrapper with the density class instead of stamping <html>", () => {
    const hi = real("salt", "SimulatedButton", "high", { label: "Go" });
    const scope = hi.querySelector(".salt-provider");
    expect(scope?.classList.contains("salt-density-high")).toBe(true);
    expect(scope?.classList.contains("salt-theme")).toBe(true);
    expect(document.documentElement.className).not.toMatch(/salt-theme|salt-density/);
    const touch = real("salt", "SimulatedButton", "touch", { label: "Go" });
    expect(touch.querySelector(".salt-provider")?.classList.contains("salt-density-touch")).toBe(true);
    expect(document.documentElement.className).not.toMatch(/salt-theme|salt-density/);
  });
});

describe("Carbon real blocks — size follows density", () => {
  const elProps = (type: string, density?: Density) => {
    const r = getRealBlockRenderer("carbon", type)!;
    const el = r({ label: "Go" }, density ? { density } : undefined) as React.ReactElement<{ size?: string }>;
    return el.props;
  };

  it("Button / TextInput / Dropdown / Search / Tag use the sm|md|lg field ladder", () => {
    for (const type of ["SimulatedButton", "SimulatedTextInput", "SimulatedDropdown", "SimulatedSearchbox", "SimulatedBadge", "SimulatedPill", "StatusPill"]) {
      expect(elProps(type, "high").size, type).toBe("sm");
      expect(elProps(type, "medium").size, type).toBe("md");
      expect(elProps(type, "low").size, type).toBe("lg");
      expect(elProps(type, "touch").size, type).toBe("lg");
    }
  });

  it("Toggle has no large variant: low/touch stay md", () => {
    expect(elProps("SimulatedSwitch", "high").size).toBe("sm");
    expect(elProps("SimulatedSwitch", "touch").size).toBe("md");
  });

  it("without a context (older callers) the default is md", () => {
    expect(elProps("SimulatedButton").size).toBe("md");
  });

  it("the rendered @carbon/react button carries the size class", () => {
    const hi = real("carbon", "SimulatedButton", "high", { label: "Go" });
    expect(hi.querySelector("button")?.className).toMatch(/cds--btn--sm/);
    const touch = real("carbon", "SimulatedButton", "touch", { label: "Go" });
    expect(touch.querySelector("button")?.className).toMatch(/cds--btn--lg/);
  });
});

describe("M3 (MUI) real blocks — theme-wide default size follows density", () => {
  it("Button: small / medium / large", () => {
    expect(real("m3", "SimulatedButton", "high", { label: "Go" }).querySelector("button")?.className).toMatch(/MuiButton-sizeSmall/);
    expect(real("m3", "SimulatedButton", "medium", { label: "Go" }).querySelector("button")?.className).toMatch(/MuiButton-sizeMedium/);
    expect(real("m3", "SimulatedButton", "touch", { label: "Go" }).querySelector("button")?.className).toMatch(/MuiButton-sizeLarge/);
  });

  it("two-step components (TextField, Chip, Switch) go small at high and medium otherwise", () => {
    expect(real("m3", "SimulatedTextInput", "high", { label: "Name" }).querySelector(".MuiInputBase-root")?.className).toMatch(/MuiInputBase-sizeSmall/);
    expect(real("m3", "SimulatedTextInput", "low", { label: "Name" }).querySelector(".MuiInputBase-root")?.className).not.toMatch(/sizeSmall/);
    expect(real("m3", "SimulatedBadge", "high", { label: "New" }).querySelector(".MuiChip-root")?.className).toMatch(/MuiChip-sizeSmall/);
    expect(real("m3", "SimulatedBadge", "medium", { label: "New" }).querySelector(".MuiChip-root")?.className).toMatch(/MuiChip-sizeMedium/);
    expect(real("m3", "SimulatedSwitch", "high", { label: "On" }).querySelector(".MuiSwitch-root")?.className).toMatch(/MuiSwitch-sizeSmall/);
  });
});

describe("Fluent real blocks — per-component size follows density", () => {
  it("Button: small / medium / large", () => {
    expect(real("fluent", "SimulatedButton", "high", { label: "Go" }).querySelector("[data-fluent-size]")?.getAttribute("data-fluent-size")).toBe("small");
    expect(real("fluent", "SimulatedButton", "medium", { label: "Go" }).querySelector("[data-fluent-size]")?.getAttribute("data-fluent-size")).toBe("medium");
    expect(real("fluent", "SimulatedButton", "low", { label: "Go" }).querySelector("[data-fluent-size]")?.getAttribute("data-fluent-size")).toBe("large");
  });

  it("Input inside Field: touch → large", () => {
    expect(real("fluent", "SimulatedTextInput", "touch", { label: "Name" }).querySelector("input")?.getAttribute("data-fluent-size")).toBe("large");
  });
});
