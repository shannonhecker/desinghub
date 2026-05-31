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

  it("returns null for an intentionally-omitted block (uoaui ships no switch)", () => {
    expect(resolveComponentApi("uoaui", "SimulatedSwitch")).toBeNull();
  });
});

describe("componentApiRegistry — M3 (@mui/material) emits real MUI components", () => {
  it("translates a primary button to MUI variant=contained", () => {
    expect(blockToRealJsx("m3", b("SimulatedButton", { label: "Submit", variant: "primary" })))
      .toBe('<Button variant="contained">Submit</Button>');
  });

  it("maps a danger button to contained + color=error", () => {
    const jsx = blockToRealJsx("m3", b("SimulatedButton", { label: "Delete", variant: "danger" }))!;
    expect(jsx).toContain('variant="contained"');
    expect(jsx).toContain('color="error"');
  });

  it("maps a text input to MUI TextField", () => {
    expect(blockToRealJsx("m3", b("SimulatedTextInput", { label: "Email" }))).toContain('<TextField label="Email"');
  });

  it("maps a switch to MUI FormControlLabel + Switch", () => {
    expect(blockToRealJsx("m3", b("SimulatedSwitch", { label: "Notifications", defaultOn: true })))
      .toBe('<FormControlLabel control={<Switch defaultChecked />} label="Notifications" />');
  });

  it("collects deduped, sorted imports from @mui/material", () => {
    expect(collectImports("m3", ["SimulatedButton", "SimulatedSwitch"]))
      .toContain('import { Button, FormControlLabel, Switch } from "@mui/material";');
  });
});

describe("componentApiRegistry — Fluent (@fluentui/react-components) emits real Fluent components", () => {
  it("translates a primary button to Fluent appearance=primary", () => {
    expect(blockToRealJsx("fluent", b("SimulatedButton", { label: "Submit", variant: "primary" })))
      .toBe('<Button appearance="primary">Submit</Button>');
  });

  it("maps a danger button to subtle + the real red token (Fluent has no native danger appearance)", () => {
    const jsx = blockToRealJsx("fluent", b("SimulatedButton", { label: "Delete", variant: "danger" }))!;
    expect(jsx).toContain('appearance="subtle"');
    expect(jsx).toContain("--colorPaletteRedForeground1");
  });

  it("maps a text input to Fluent's Field + Input composition", () => {
    const jsx = blockToRealJsx("fluent", b("SimulatedTextInput", { label: "Email", placeholder: "you@co" }))!;
    expect(jsx).toContain('<Field label="Email">');
    expect(jsx).toContain('<Input placeholder="you@co" />');
  });

  it("maps a switch (defaultOn) to Fluent Switch defaultChecked", () => {
    expect(blockToRealJsx("fluent", b("SimulatedSwitch", { label: "Notifications", defaultOn: true })))
      .toBe('<Switch label="Notifications" defaultChecked />');
  });

  it("maps a card to Fluent Card + CardHeader", () => {
    const jsx = blockToRealJsx("fluent", b("SimulatedCard", { title: "Stats", content: "Body" }))!;
    expect(jsx).toContain("<Card>");
    expect(jsx).toContain('<CardHeader header="Stats" description="Body" />');
  });

  it("collects deduped, sorted imports from @fluentui/react-components", () => {
    expect(collectImports("fluent", ["SimulatedButton", "SimulatedCheckbox"]))
      .toContain('import { Button, Checkbox } from "@fluentui/react-components";');
  });
});

describe("componentApiRegistry — Carbon (@carbon/react) emits real Carbon components", () => {
  it("translates a primary button to Carbon kind=primary", () => {
    expect(blockToRealJsx("carbon", b("SimulatedButton", { label: "Submit", variant: "primary" })))
      .toBe('<Button kind="primary">Submit</Button>');
  });

  it("maps danger to kind=danger and outline to Carbon's tertiary (its bordered button)", () => {
    expect(blockToRealJsx("carbon", b("SimulatedButton", { variant: "danger" }))).toContain('kind="danger"');
    expect(blockToRealJsx("carbon", b("SimulatedButton", { variant: "outline" }))).toContain('kind="tertiary"');
  });

  it("maps a text input to TextInput with a derived id + labelText (Carbon requires id)", () => {
    expect(blockToRealJsx("carbon", b("SimulatedTextInput", { label: "Work Email", placeholder: "you@co" })))
      .toBe('<TextInput id="work-email" labelText="Work Email" placeholder="you@co" />');
  });

  it("maps the switch block to Carbon's Toggle (its real switch) with defaultToggled", () => {
    expect(blockToRealJsx("carbon", b("SimulatedSwitch", { label: "Notifications", defaultOn: true })))
      .toBe('<Toggle id="notifications" labelText="Notifications" defaultToggled />');
  });

  it("maps the card block to Carbon's Tile (its real card surface)", () => {
    const jsx = blockToRealJsx("carbon", b("SimulatedCard", { title: "Stats", content: "Body" }))!;
    expect(jsx).toContain("<Tile>");
    expect(jsx).toContain("<h3>Stats</h3>");
  });

  it("collects deduped, sorted imports from @carbon/react", () => {
    expect(collectImports("carbon", ["SimulatedButton", "SimulatedTextInput"]))
      .toContain('import { Button, TextInput } from "@carbon/react";');
  });
});

describe("componentApiRegistry — uoaui (in-house, className + --a-* CSS) emits real a-* markup", () => {
  it("translates a primary button to uoaui's a-btn a-btn-primary classes", () => {
    expect(blockToRealJsx("uoaui", b("SimulatedButton", { label: "Submit", variant: "primary" })))
      .toBe('<button className="a-btn a-btn-primary">Submit</button>');
  });

  it("maps outline/ghost to their real a-btn classes; danger -> primary (uoaui has no danger button)", () => {
    expect(blockToRealJsx("uoaui", b("SimulatedButton", { variant: "outline" }))).toContain("a-btn-outline");
    expect(blockToRealJsx("uoaui", b("SimulatedButton", { variant: "ghost" }))).toContain("a-btn-ghost");
    expect(blockToRealJsx("uoaui", b("SimulatedButton", { variant: "danger" }))).toContain("a-btn-primary");
  });

  it("maps a text input to uoaui's a-input-wrap / a-input-label / a-input composition", () => {
    const jsx = blockToRealJsx("uoaui", b("SimulatedTextInput", { label: "Email", placeholder: "you@co" }))!;
    expect(jsx).toContain('className="a-input-wrap"');
    expect(jsx).toContain('<label className="a-input-label">Email</label>');
    expect(jsx).toContain('<input className="a-input" placeholder="you@co" />');
  });

  it("maps a card to uoaui's a-card glass surface", () => {
    expect(blockToRealJsx("uoaui", b("SimulatedCard", { title: "Stats", content: "Body" })))
      .toContain('className="a-card"');
  });

  it("has no switch (uoaui ships none) so it returns null and the exporter falls back", () => {
    expect(resolveComponentApi("uoaui", "SimulatedSwitch")).toBeNull();
  });

  it("collects a single side-effect stylesheet import (no named component imports)", () => {
    expect(collectImports("uoaui", ["SimulatedButton", "SimulatedCard", "SimulatedTextInput"]))
      .toEqual(['import "./uoaui-theme.css";']);
  });
});
