"use client";

import React, { useState } from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { getComponents, getSystemInfo } from "@/data/registry";

const SALT_CODE: Record<string, { react: string; html: string }> = {
  buttons: {
    react: `import { Button } from "@salt-ds/core";

// Appearances: solid (default), bordered, transparent
// Sentiments: accented (default), neutral, positive, caution, negative
<Button sentiment="accented" appearance="solid">
  Submit
</Button>
<Button sentiment="neutral" appearance="bordered">
  Cancel
</Button>
<Button sentiment="negative" appearance="solid">
  Delete
</Button>`,
    html: `<button class="saltButton saltButton-solid saltButton-accented">
  Submit
</button>

<!-- CSS Variables -->
<style>
  .saltButton {
    height: var(--salt-size-base);
    padding: 0 var(--salt-spacing-100);
    border-radius: var(--salt-palette-corner-weak);
    font-family: var(--salt-text-fontFamily);
  }
</style>`,
  },
  inputs: {
    react: `import { Input, FormField, FormFieldLabel, FormFieldHelperText } from "@salt-ds/core";

<FormField>
  <FormFieldLabel>Label</FormFieldLabel>
  <Input placeholder="Enter text..." />
  <FormFieldHelperText>Helper text</FormFieldHelperText>
</FormField>

// With validation
<FormField validationStatus="error">
  <FormFieldLabel>Email</FormFieldLabel>
  <Input defaultValue="invalid" />
  <FormFieldHelperText>Invalid email address</FormFieldHelperText>
</FormField>`,
    html: `<div class="saltFormField">
  <label class="saltFormFieldLabel">Label</label>
  <input class="saltInput" placeholder="Enter text..." />
  <span class="saltFormFieldHelperText">Helper text</span>
</div>`,
  },
  cards: {
    react: `import { Card, InteractableCard } from "@salt-ds/core";

<Card>
  <h3>Card Title</h3>
  <p>Card content with description text.</p>
</Card>

<InteractableCard onClick={handleClick}>
  <h3>Clickable Card</h3>
  <p>Click to navigate or select.</p>
</InteractableCard>`,
    html: `<div class="saltCard">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>`,
  },
  checkboxes: {
    react: `import { Checkbox, CheckboxGroup } from "@salt-ds/core";

<CheckboxGroup>
  <Checkbox label="Option A" defaultChecked />
  <Checkbox label="Option B" />
  <Checkbox label="Option C" disabled />
</CheckboxGroup>`,
    html: `<div role="group">
  <label><input type="checkbox" checked /> Option A</label>
  <label><input type="checkbox" /> Option B</label>
</div>`,
  },
  switches: {
    react: `import { Switch } from "@salt-ds/core";

<Switch label="Notifications" defaultChecked />
<Switch label="Dark mode" />`,
    html: `<label class="saltSwitch">
  <input type="checkbox" role="switch" checked />
  <span>Notifications</span>
</label>`,
  },
  tabs: {
    react: `import { TabBar, Tab, TabPanel } from "@salt-ds/core";

<TabBar>
  <Tab label="Overview" />
  <Tab label="Details" />
  <Tab label="Settings" />
</TabBar>`,
    html: `<div role="tablist">
  <button role="tab" aria-selected="true">Overview</button>
  <button role="tab">Details</button>
</div>`,
  },
};

const M3_CODE: Record<string, { react: string; html: string }> = {
  buttons: {
    react: `import Button from "@mui/material/Button";

// Variants: contained, outlined, text
<Button variant="contained">Filled</Button>
<Button variant="outlined">Outlined</Button>
<Button variant="text">Text</Button>

// Color: primary, secondary, error, info, success, warning
<Button variant="contained" color="error">Delete</Button>`,
    html: `<button class="mdc-button mdc-button--raised">
  <span class="mdc-button__label">Filled</span>
</button>`,
  },
  cards: {
    react: `import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

<Card variant="elevation">
  <CardContent>Elevated Card</CardContent>
</Card>
<Card variant="outlined">
  <CardContent>Outlined Card</CardContent>
</Card>`,
    html: `<div class="mdc-card mdc-card--elevated">
  <div class="mdc-card__content">Elevated Card</div>
</div>`,
  },
  chips: {
    react: `import Chip from "@mui/material/Chip";

<Chip label="Filter" onClick={handleClick} />
<Chip label="Selected" color="primary" onDelete={handleDelete} />`,
    html: `<span class="mdc-chip">
  <span class="mdc-chip__text">Filter</span>
</span>`,
  },
  switches: {
    react: `import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";

<FormControlLabel control={<Switch defaultChecked />} label="Active" />`,
    html: `<label><input type="checkbox" role="switch" checked /> Active</label>`,
  },
  tabs: {
    react: `import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

<Tabs value={value} onChange={handleChange}>
  <Tab label="Tab 1" />
  <Tab label="Tab 2" />
  <Tab label="Tab 3" />
</Tabs>`,
    html: `<div class="mdc-tab-bar" role="tablist">
  <button class="mdc-tab mdc-tab--active" role="tab">Tab 1</button>
</div>`,
  },
};

const FLUENT_CODE: Record<string, { react: string; html: string }> = {
  buttons: {
    react: `import { Button } from "@fluentui/react-components";

// appearance: primary, secondary, outline, subtle, transparent
// size: small, medium (default), large
<Button appearance="primary">Primary</Button>
<Button appearance="secondary">Default</Button>
<Button appearance="outline">Outline</Button>
<Button appearance="subtle">Subtle</Button>

<Button appearance="primary" size="small">Small</Button>
<Button appearance="primary" size="large">Large</Button>`,
    html: `<button class="fui-Button fui-Button--primary">Primary</button>`,
  },
  inputs: {
    react: `import { Input, Label, Field } from "@fluentui/react-components";

<Field label="Full name">
  <Input placeholder="Enter your name" />
</Field>

<Field label="Email" validationState="error" validationMessage="Invalid email">
  <Input defaultValue="invalid" />
</Field>`,
    html: `<div class="fui-Field">
  <label class="fui-Label">Full name</label>
  <input class="fui-Input" placeholder="Enter your name" />
</div>`,
  },
  cards: {
    react: `import { Card, CardHeader, CardPreview } from "@fluentui/react-components";

<Card>
  <CardPreview>
    <img src="preview.png" alt="Preview" />
  </CardPreview>
  <CardHeader header="Card Title" description="Description text" />
</Card>`,
    html: `<div class="fui-Card">
  <div class="fui-CardHeader">Card Title</div>
</div>`,
  },
  switches: {
    react: `import { Switch } from "@fluentui/react-components";

<Switch label="Notifications" defaultChecked />`,
    html: `<label><input type="checkbox" role="switch" /> Notifications</label>`,
  },
  tabs: {
    react: `import { TabList, Tab } from "@fluentui/react-components";

<TabList>
  <Tab value="home">Home</Tab>
  <Tab value="activity">Activity</Tab>
  <Tab value="settings">Settings</Tab>
</TabList>`,
    html: `<div role="tablist">
  <button role="tab" aria-selected="true">Home</button>
</div>`,
  },
};

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple syntax highlighting
  const highlighted = code
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/(\/\/.+)/g, '<span style="color:#6a737d">$1</span>')
    .replace(/(".*?")/g, '<span style="color:#a5d6ff">$1</span>')
    .replace(/\b(import|from|const|let|function|return|export|default)\b/g, '<span style="color:#ff7b72">$1</span>')
    .replace(/(&lt;\/?[A-Z]\w*)/g, '<span style="color:#7ee787">$1</span>')
    .replace(/\b(\w+)=/g, '<span style="color:#d2a8ff">$1</span>=');

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={copy}
        style={{
          position: "absolute", top: 8, right: 8, background: "#2a2a4a", color: "#a0a0b0",
          border: "none", borderRadius: 4, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
        }}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre style={{
        background: "#0d1117", borderRadius: 6, padding: 16, overflow: "auto",
        fontSize: 12, lineHeight: 1.6, fontFamily: "'SF Mono', 'Fira Code', monospace",
        border: "1px solid #2a2a4a", color: "#e6edf3",
      }}>
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}

export function CodePanel({ componentId }: { componentId: string }) {
  const { activeSystem } = useDesignHub();
  const [codeTab, setCodeTab] = useState<"react" | "html">("react");
  const components = getComponents(activeSystem);
  const comp = components.find((c) => c.id === componentId);
  const sysInfo = getSystemInfo(activeSystem);

  const codeMap = activeSystem === "salt" ? SALT_CODE : activeSystem === "m3" ? M3_CODE : FLUENT_CODE;
  const snippets = codeMap[componentId];

  return (
    <div style={{ padding: 24 }}>
      <button
        onClick={() => useDesignHub.getState().setSelectedComponent(null)}
        style={{ background: "none", border: "none", color: "#4fc3f7", cursor: "pointer", fontSize: 12, fontFamily: "inherit", padding: 0, marginBottom: 8 }}
      >
        ← Back to all
      </button>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{comp?.name} — Code</h2>
      <p style={{ fontSize: 12, color: "#707080", marginBottom: 16 }}>
        {sysInfo.name} implementation with correct imports and API
      </p>

      {snippets ? (
        <>
          <div style={{ display: "flex", gap: 0, marginBottom: 12 }}>
            {(["react", "html"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setCodeTab(t)}
                style={{
                  padding: "6px 16px", fontSize: 12, fontWeight: codeTab === t ? 600 : 400,
                  color: codeTab === t ? "#4fc3f7" : "#707080", background: "none", border: "none",
                  borderBottom: codeTab === t ? "2px solid #4fc3f7" : "2px solid transparent",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {t === "react" ? "React + TypeScript" : "HTML + CSS"}
              </button>
            ))}
          </div>
          <CodeBlock code={snippets[codeTab]} language={codeTab === "react" ? "tsx" : "html"} />
        </>
      ) : (
        <div style={{ padding: 32, textAlign: "center", color: "#707080", fontSize: 13 }}>
          Code snippets for <strong>{comp?.name}</strong> coming soon.
          <br />
          <span style={{ fontSize: 11 }}>
            Check the {sysInfo.name} documentation for current API reference.
          </span>
        </div>
      )}
    </div>
  );
}
