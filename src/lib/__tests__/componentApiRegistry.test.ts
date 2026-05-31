import { describe, it, expect } from "vitest";
import { blockToRealJsx, collectImports, resolveComponentApi } from "../componentApiRegistry";

const b = (type: string, props: Record<string, unknown> = {}) => ({ type, props });

/* P2 of the layout/codegen roadmap: the ComponentAPIRegistry turns a builder
   block into REAL design-system component JSX (sourced from each DS's official
   API), replacing reactExporter's generic `className="btn"` pseudocode.
   Salt is the seed DS; the prop translator is the interesting part. */
describe("componentApiRegistry — Salt emits real @salt-ds/core components", () => {
  it("translates a primary button to Salt's sentiment + appearance (the official API)", () => {
    expect(blockToRealJsx("salt", b("SimulatedButton", { label: "Submit", variant: "primary" })))
      .toBe('<Button sentiment="accented" appearance="solid">Submit</Button>');
  });

  it("maps a danger button to sentiment=negative", () => {
    expect(blockToRealJsx("salt", b("SimulatedButton", { label: "Delete", variant: "danger" })))
      .toContain('sentiment="negative"');
  });

  it("maps a secondary button to neutral + bordered", () => {
    const jsx = blockToRealJsx("salt", b("SimulatedButton", { variant: "secondary" }))!;
    expect(jsx).toContain('sentiment="neutral"');
    expect(jsx).toContain('appearance="bordered"');
  });

  it("maps a text input to Salt's FormField + Input composition", () => {
    const jsx = blockToRealJsx("salt", b("SimulatedTextInput", { label: "Email", placeholder: "you@co" }))!;
    expect(jsx).toContain("<FormField>");
    expect(jsx).toContain("<FormFieldLabel>Email</FormFieldLabel>");
    expect(jsx).toContain('placeholder="you@co"');
  });

  it("maps a switch (defaultOn) to Salt Switch defaultChecked", () => {
    expect(blockToRealJsx("salt", b("SimulatedSwitch", { label: "Notifications", defaultOn: true })))
      .toBe('<Switch label="Notifications" defaultChecked />');
  });

  it("collects deduped, sorted imports from @salt-ds/core for a set of blocks", () => {
    const imports = collectImports("salt", ["SimulatedButton", "SimulatedTextInput", "SimulatedButton"]);
    expect(imports).toContain('import { Button, FormField, FormFieldLabel, Input } from "@salt-ds/core";');
  });

  it("returns null for an unmapped block so the exporter can fall back", () => {
    expect(resolveComponentApi("salt", "TotallyUnknownBlock")).toBeNull();
    expect(blockToRealJsx("salt", b("TotallyUnknownBlock"))).toBeNull();
  });

  it("returns null for a DS not yet seeded (no fabricated API)", () => {
    expect(resolveComponentApi("carbon", "SimulatedButton")).toBeNull();
  });
});
