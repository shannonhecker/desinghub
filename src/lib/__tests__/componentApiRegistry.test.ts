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

/* ════════════════════════════════════════════════════════════════════
   Whole-canvas coverage (issue #2): the ~38 blocks beyond the seed five.
   Load-bearing mappings + the honest OMITs, locked to the real emitted JSX.
   ════════════════════════════════════════════════════════════════════ */

describe("componentApiRegistry — Title across DSs (heading primitives diverge)", () => {
  it("Salt level->H2 heading component", () => {
    expect(blockToRealJsx("salt", b("SimulatedTitle", { level: "h2", text: "New Heading" })))
      .toBe("<H2>New Heading</H2>");
  });
  it("M3 Typography variant+component (M3 scale runs large, h2->variant h4)", () => {
    expect(blockToRealJsx("m3", b("SimulatedTitle", { level: "h2", text: "New Heading" })))
      .toBe('<Typography variant="h4" component="h2">New Heading</Typography>');
  });
  it("Fluent fixed-ramp Title2 with semantic `as`", () => {
    expect(blockToRealJsx("fluent", b("SimulatedTitle", { level: "h2", text: "New Heading" })))
      .toBe('<Title2 as="h2">New Heading</Title2>');
  });
  it("uoaui plain heading tag with optional a-title class", () => {
    expect(blockToRealJsx("uoaui", b("SimulatedTitle", { level: "h2", text: "New Heading" })))
      .toBe('<h2 className="a-title">New Heading</h2>');
  });
  it("Carbon OMITS Title (no Heading component, cds--type-* classes only) -> exporter falls back", () => {
    expect(resolveComponentApi("carbon", "SimulatedTitle")).toBeNull();
  });
});

describe("componentApiRegistry — Tabs across DSs", () => {
  it("Salt Tabs/TabBar/TabList/Tab + matching TabPanels", () => {
    const jsx = blockToRealJsx("salt", b("SimulatedTabs", { tabsCsv: "General, Security" }))!;
    expect(jsx).toContain('<Tabs defaultValue="general">');
    expect(jsx).toContain("<TabBar>");
    expect(jsx).toContain('<Tab value="general">General</Tab>');
    expect(jsx).toContain('<TabPanel value="security">Security content</TabPanel>');
  });
  it("M3 Tabs/Tab (label-driven, controlled value)", () => {
    const jsx = blockToRealJsx("m3", b("SimulatedTabs", { tabsCsv: "General, Security" }))!;
    expect(jsx).toContain('<Tabs value={0} aria-label="tabs">');
    expect(jsx).toContain('<Tab label="General" />');
  });
  it("Fluent TabList + Tab (no TabPanel component; panels conditionally rendered)", () => {
    const jsx = blockToRealJsx("fluent", b("SimulatedTabs", { tabsCsv: "General, Security" }))!;
    expect(jsx).toContain('<TabList defaultSelectedValue="general">');
    expect(jsx).toContain('<Tab value="security">Security</Tab>');
    expect(jsx).not.toContain("<TabPanel");
  });
  it("Carbon full v11 Tabs/TabList/Tab/TabPanels(plural)/TabPanel composition", () => {
    const jsx = blockToRealJsx("carbon", b("SimulatedTabs", { tabsCsv: "General, Security" }))!;
    expect(jsx).toContain('<TabList aria-label="Tabs">');
    expect(jsx).toContain("<TabPanels>");
    expect(jsx).toContain("<Tab>General</Tab>");
  });
  it("uoaui role=tablist of a-tab buttons + a tabpanel", () => {
    const jsx = blockToRealJsx("uoaui", b("SimulatedTabs", { tabsCsv: "General, Security" }))!;
    expect(jsx).toContain('<div className="a-tabs" role="tablist"');
    expect(jsx).toContain('className="a-tab active"');
    expect(jsx).toContain('role="tabpanel"');
  });
});

describe("componentApiRegistry — Badge/Tag across DSs (label primitive diverges)", () => {
  it("Salt Badge is a count overlay (value + child Button); status honestly dropped", () => {
    const jsx = blockToRealJsx("salt", b("SimulatedBadge", { label: "New", status: "success" }))!;
    expect(jsx).toContain("<Badge value={1}>");
    expect(jsx).toContain("<Button>New</Button>");
    expect(jsx).not.toContain("sentiment");
  });
  it("M3 routes a labeled Badge to Chip with semantic color (MUI Badge is overlay-only)", () => {
    expect(blockToRealJsx("m3", b("SimulatedBadge", { label: "New", status: "success" })))
      .toBe('<Chip label="New" color="success" size="small" />');
  });
  it("Fluent Badge with appearance + real color enum (success)", () => {
    expect(blockToRealJsx("fluent", b("SimulatedBadge", { label: "Live", status: "success" })))
      .toBe('<Badge appearance="filled" color="success">Live</Badge>');
  });
  it("Carbon labeled badge -> Tag with semantic type (Carbon Badge is count-only)", () => {
    expect(blockToRealJsx("carbon", b("SimulatedBadge", { label: "New", status: "info" })))
      .toBe('<Tag type="blue">New</Tag>');
  });
  it("uoaui a-badge with the real variant class", () => {
    expect(blockToRealJsx("uoaui", b("SimulatedBadge", { label: "New", status: "success" })))
      .toBe('<span className="a-badge a-badge-success">New</span>');
  });
});

describe("componentApiRegistry — Dialog across DSs (Salt Dialog vs Carbon Modal vs Fluent surface)", () => {
  it("Salt Dialog + DialogHeader(header)/DialogContent/DialogActions", () => {
    const jsx = blockToRealJsx("salt", b("SimulatedDialog", { title: "Confirm", message: "Sure?" }))!;
    expect(jsx).toContain("<Dialog open>");
    expect(jsx).toContain('<DialogHeader header="Confirm" />');
    expect(jsx).toContain("<DialogContent>Sure?</DialogContent>");
  });
  it("M3 Dialog/DialogTitle/DialogContentText/DialogActions", () => {
    const jsx = blockToRealJsx("m3", b("SimulatedDialog", { title: "Confirm", message: "Sure?" }))!;
    expect(jsx).toContain("<DialogTitle>Confirm</DialogTitle>");
    expect(jsx).toContain("<DialogContentText>Sure?</DialogContentText>");
  });
  it("Fluent needs DialogSurface + DialogBody wrappers (not bare DialogContent)", () => {
    const jsx = blockToRealJsx("fluent", b("SimulatedDialog", { title: "Confirm", message: "Sure?" }))!;
    expect(jsx).toContain("<DialogSurface>");
    expect(jsx).toContain("<DialogBody>Sure?</DialogBody>");
    expect(jsx).not.toContain("DialogContent");
  });
  it("Carbon's Dialog is named Modal (modalHeading + primary/secondary button text)", () => {
    const jsx = blockToRealJsx("carbon", b("SimulatedDialog", { title: "Confirm", message: "Sure?" }))!;
    expect(jsx).toContain('<Modal open modalHeading="Confirm"');
    expect(jsx).toContain('primaryButtonText="Confirm"');
  });
});

describe("componentApiRegistry — Accordion across DSs", () => {
  it("Salt Accordion + AccordionHeader/AccordionPanel (value optional but valid)", () => {
    const jsx = blockToRealJsx("salt", b("SimulatedAccordion", { title: "Advanced", content: "Body" }))!;
    expect(jsx).toContain('<Accordion value="advanced">');
    expect(jsx).toContain("<AccordionHeader>Advanced</AccordionHeader>");
    expect(jsx).toContain("<AccordionPanel>Body</AccordionPanel>");
  });
  it("M3 Accordion/AccordionSummary/AccordionDetails", () => {
    const jsx = blockToRealJsx("m3", b("SimulatedAccordion", { title: "Advanced", content: "Body" }))!;
    expect(jsx).toContain("<AccordionSummary>");
    expect(jsx).toContain("<AccordionDetails>");
  });
  it("Fluent Accordion/AccordionItem(value)/AccordionHeader/AccordionPanel", () => {
    const jsx = blockToRealJsx("fluent", b("SimulatedAccordion", { title: "Advanced", content: "Body" }))!;
    expect(jsx).toContain("<Accordion collapsible>");
    expect(jsx).toContain('<AccordionItem value="1">');
  });
  it("Carbon Accordion/AccordionItem(title)", () => {
    expect(blockToRealJsx("carbon", b("SimulatedAccordion", { title: "Advanced", content: "Body" })))!
      .toContain('<AccordionItem title="Advanced">');
  });
});

describe("componentApiRegistry — RadioGroup across DSs (CSV options -> per-DS composition)", () => {
  it("Salt RadioButtonGroup defaultValue + RadioButton per option", () => {
    const jsx = blockToRealJsx("salt", b("SimulatedRadioGroup", { label: "Pick", optionsCsv: "Alpha, Beta", defaultIndex: 1 }))!;
    expect(jsx).toContain('<RadioButtonGroup defaultValue="beta">');
    expect(jsx).toContain('<RadioButton label="Alpha" value="alpha" />');
  });
  it("M3 FormControl/FormLabel/RadioGroup/FormControlLabel/Radio", () => {
    const jsx = blockToRealJsx("m3", b("SimulatedRadioGroup", { label: "Pick", optionsCsv: "Alpha, Beta", defaultIndex: 0 }))!;
    expect(jsx).toContain('<RadioGroup defaultValue="alpha">');
    expect(jsx).toContain('<FormControlLabel value="beta" control={<Radio />} label="Beta" />');
  });
  it("Fluent Field/RadioGroup/Radio", () => {
    const jsx = blockToRealJsx("fluent", b("SimulatedRadioGroup", { label: "Pick", optionsCsv: "Alpha, Beta" }))!;
    expect(jsx).toContain('<RadioGroup defaultValue="alpha">');
    expect(jsx).toContain('<Radio value="beta" label="Beta" />');
  });
  it("Carbon RadioButtonGroup(legendText, defaultSelected) + RadioButton(id/value/labelText)", () => {
    const jsx = blockToRealJsx("carbon", b("SimulatedRadioGroup", { label: "Pick", optionsCsv: "Alpha, Beta", defaultIndex: 1 }))!;
    expect(jsx).toContain('legendText="Pick"');
    expect(jsx).toContain('defaultSelected="beta"');
    expect(jsx).toContain('<RadioButton id="alpha" value="alpha" labelText="Alpha" />');
  });
});

describe("componentApiRegistry — Slider across DSs", () => {
  it("Salt FormField + Slider min/max/defaultValue", () => {
    expect(blockToRealJsx("salt", b("SimulatedSlider", { label: "Volume", value: 30, min: 0, max: 100 })))!
      .toContain("<Slider min={0} max={100} defaultValue={30} />");
  });
  it("M3 Slider defaultValue/min/max/aria-label", () => {
    expect(blockToRealJsx("m3", b("SimulatedSlider", { label: "Volume", value: 30 })))
      .toBe('<Slider defaultValue={30} min={0} max={100} aria-label="Volume" />');
  });
  it("Fluent Field + Slider", () => {
    expect(blockToRealJsx("fluent", b("SimulatedSlider", { label: "Volume", value: 30 })))!
      .toContain("<Slider min={0} max={100} defaultValue={30} />");
  });
  it("Carbon Slider with id/labelText/value/min/max", () => {
    expect(blockToRealJsx("carbon", b("SimulatedSlider", { label: "Volume", value: 30 })))
      .toBe('<Slider id="volume" labelText="Volume" value={30} min={0} max={100} step={1} />');
  });
  it("uoaui OMITS Slider (no real a-slider class) -> exporter falls back", () => {
    expect(resolveComponentApi("uoaui", "SimulatedSlider")).toBeNull();
  });
});

describe("componentApiRegistry — Dropdown across DSs", () => {
  it("Salt Dropdown + Option children", () => {
    const jsx = blockToRealJsx("salt", b("SimulatedDropdown", { placeholder: "Pick one" }))!;
    expect(jsx).toContain('<Dropdown placeholder="Pick one">');
    expect(jsx).toContain('<Option value="option-1">Option 1</Option>');
  });
  it("M3 FormControl/InputLabel/Select/MenuItem", () => {
    const jsx = blockToRealJsx("m3", b("SimulatedDropdown", { placeholder: "Pick one" }))!;
    expect(jsx).toContain('<InputLabel id="sel-label">Pick one</InputLabel>');
    expect(jsx).toContain("<MenuItem value=\"opt1\">Option 1</MenuItem>");
  });
  it("Carbon Dropdown with label/items/itemToString (label is the trigger text)", () => {
    expect(blockToRealJsx("carbon", b("SimulatedDropdown", { placeholder: "Pick one" })))
      .toBe('<Dropdown id="dropdown" titleText="" label="Pick one" items={["Option 1", "Option 2", "Option 3"]} itemToString={(item) => item ?? ""} />');
  });
});

describe("componentApiRegistry — Avatar across DSs (Carbon honestly omits)", () => {
  it("Salt Avatar name + size multiplier", () => {
    expect(blockToRealJsx("salt", b("SimulatedAvatar", { initials: "AB", size: "lg" })))
      .toBe('<Avatar name="AB" size={4} />');
  });
  it("M3 Avatar children + sx sizing", () => {
    expect(blockToRealJsx("m3", b("SimulatedAvatar", { initials: "AB", size: "md" })))
      .toBe('<Avatar sx={{ width: 40, height: 40 }}>AB</Avatar>');
  });
  it("Fluent Avatar name + numeric size + presence badge", () => {
    expect(blockToRealJsx("fluent", b("SimulatedAvatar", { initials: "AB", size: "lg", presence: "available" })))
      .toBe('<Avatar name="AB" size={48} badge={{ status: "available" }} />');
  });
  it("Fluent drops the presence badge when presence is empty", () => {
    expect(blockToRealJsx("fluent", b("SimulatedAvatar", { initials: "AB", size: "md", presence: "" })))
      .toBe('<Avatar name="AB" size={32} />');
  });
  it("Carbon OMITS Avatar (no first-party component) -> exporter falls back", () => {
    expect(resolveComponentApi("carbon", "SimulatedAvatar")).toBeNull();
  });
});

describe("componentApiRegistry — StatCard across DSs (composed; Carbon -> Tile)", () => {
  it("Salt composes lab Metric inside core Card, splitting imports across packages", () => {
    const jsx = blockToRealJsx("salt", b("SimulatedStatCard", { label: "Revenue", value: "$42.8K", pct: 60 }))!;
    expect(jsx).toContain("<Card>");
    expect(jsx).toContain('<MetricHeader title="Revenue" />');
    expect(jsx).toContain('<MetricContent value="$42.8K" />');
    const imports = collectImports("salt", ["SimulatedStatCard"]);
    expect(imports).toContain('import { Card } from "@salt-ds/core";');
    expect(imports).toContain('import { Metric, MetricContent, MetricHeader } from "@salt-ds/lab";');
  });
  it("M3 composes Card/CardContent/Typography/LinearProgress", () => {
    const jsx = blockToRealJsx("m3", b("SimulatedStatCard", { label: "Revenue", value: "$42.8K", pct: 60 }))!;
    expect(jsx).toContain('<Typography variant="h4">$42.8K</Typography>');
    expect(jsx).toContain('<LinearProgress variant="determinate" value={60} sx={{ mt: 1 }} />');
  });
  it("Fluent composes Card/CardHeader/Title3/ProgressBar with fractional 0..1 value", () => {
    const jsx = blockToRealJsx("fluent", b("SimulatedStatCard", { label: "Revenue", value: "$42.8K", pct: 60 }))!;
    expect(jsx).toContain("<Title3>$42.8K</Title3>");
    expect(jsx).toContain("<ProgressBar value={0.6} />");
  });
  it("Carbon StatCard -> Tile with type-scale classes + support token", () => {
    const jsx = blockToRealJsx("carbon", b("SimulatedStatCard", { label: "Revenue", value: "$42.8K", pct: 60 }))!;
    expect(jsx).toContain("<Tile>");
    expect(jsx).toContain('<p className="cds--type-heading-04">$42.8K</p>');
    expect(jsx).toContain("var(--cds-support-success)");
  });
});

describe("componentApiRegistry — Progress across DSs (Fluent fractional value)", () => {
  it("Salt LinearProgress value", () => {
    expect(blockToRealJsx("salt", b("SimulatedProgress", { label: "Upload", value: 50 })))
      .toBe('<LinearProgress aria-label="Upload" value={50} />');
  });
  it("M3 LinearProgress variant=determinate + value", () => {
    expect(blockToRealJsx("m3", b("SimulatedProgress", { label: "Upload", value: 50 })))
      .toBe('<LinearProgress variant="determinate" value={50} />');
  });
  it("Fluent ProgressBar uses a 0..1 fractional value (NOT 0..100)", () => {
    expect(blockToRealJsx("fluent", b("SimulatedProgress", { label: "Upload", value: 50 })))!
      .toContain("<ProgressBar value={0.5} />");
  });
  it("Carbon ProgressBar with label/helperText/value/max", () => {
    expect(blockToRealJsx("carbon", b("SimulatedProgress", { label: "Upload", value: 50 })))
      .toBe('<ProgressBar label="Upload" helperText="50%" value={50} max={100} />');
  });
});

describe("componentApiRegistry — multi-package + prop-aware imports", () => {
  it("M3 Tree pulls SimpleTreeView + TreeItem from two @mui/x-tree-view entry points", () => {
    const imports = collectImports("m3", [{ type: "SimulatedTree", props: { itemsCsv: "Docs > Work" } }]);
    expect(imports).toContain('import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";');
    expect(imports).toContain('import { TreeItem } from "@mui/x-tree-view/TreeItem";');
  });
  it("Fluent NavItem imports the icon component matching the block's icon prop", () => {
    const imports = collectImports("fluent", [{ type: "NavItem", props: { label: "Search", icon: "search" } }]);
    expect(imports).toContain('import { NavItem } from "@fluentui/react-nav-preview";');
    expect(imports).toContain('import { Search24Regular } from "@fluentui/react-icons";');
  });
  it("Salt DatePicker is sourced from the lab package", () => {
    expect(collectImports("salt", ["SimulatedDatePicker"]))
      .toContain('import { DatePicker, DatePickerOverlay, DatePickerSingleInput, DatePickerSinglePanel } from "@salt-ds/lab";');
  });
  it("M3 NumberInput emits slotProps.htmlInput (verify fix: inputProps is deprecated/removed)", () => {
    const jsx = blockToRealJsx("m3", b("SimulatedNumberInput", { label: "Qty", value: 1, min: 0, max: 99, step: 1 }))!;
    expect(jsx).toContain("slotProps={{ htmlInput: { min: 0, max: 99, step: 1 } }}");
    expect(jsx).not.toContain("inputProps");
  });
});

describe("componentApiRegistry — honest OMITs (no fabricated component) per the verified blueprint", () => {
  it("Salt omits AvatarGroup, Skeleton, ChatMessage (no real core/lab component)", () => {
    expect(resolveComponentApi("salt", "SimulatedAvatarGroup")).toBeNull();
    expect(resolveComponentApi("salt", "SimulatedSkeleton")).toBeNull();
    expect(resolveComponentApi("salt", "SimulatedChatMessage")).toBeNull();
  });
  it("M3 omits FileDropZone + ChatMessage (no @mui/material component)", () => {
    expect(resolveComponentApi("m3", "SimulatedFileDropZone")).toBeNull();
    expect(resolveComponentApi("m3", "SimulatedChatMessage")).toBeNull();
  });
  it("Fluent omits FileDropZone + ChatMessage (no core component)", () => {
    expect(resolveComponentApi("fluent", "SimulatedFileDropZone")).toBeNull();
    expect(resolveComponentApi("fluent", "SimulatedChatMessage")).toBeNull();
  });
  it("Carbon omits Title/ToggleButton/Rating/ListBox/Avatar/AvatarGroup/Persona/ChatMessage/FooterText", () => {
    for (const t of [
      "SimulatedTitle", "SimulatedToggleButton", "SimulatedRating", "SimulatedListBox",
      "SimulatedAvatar", "SimulatedAvatarGroup", "SimulatedPersona", "SimulatedChatMessage", "FooterText",
    ]) {
      expect(resolveComponentApi("carbon", t)).toBeNull();
    }
  });
  it("uoaui omits Slider/Rating/FileDropZone/Skeleton (no real a-* class or demo)", () => {
    expect(resolveComponentApi("uoaui", "SimulatedSlider")).toBeNull();
    expect(resolveComponentApi("uoaui", "SimulatedRating")).toBeNull();
    expect(resolveComponentApi("uoaui", "SimulatedFileDropZone")).toBeNull();
    expect(resolveComponentApi("uoaui", "SimulatedSkeleton")).toBeNull();
  });
  it("omitted blocks make blockToRealJsx return null so reactExporter falls back to generic markup", () => {
    expect(blockToRealJsx("carbon", b("SimulatedAvatar", { initials: "AB" }))).toBeNull();
    expect(blockToRealJsx("uoaui", b("SimulatedSlider", { value: 50 }))).toBeNull();
  });
});
