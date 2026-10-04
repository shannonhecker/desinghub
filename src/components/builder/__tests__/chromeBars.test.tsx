/* Application chrome as blocks: a top bar, a tab strip, a sidebar group
   label and a page title. They render from props alone, and clicking a
   link or a tab writes the choice back to the block. Uses react-dom/client
   + act() (no RTL in repo). */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useBuilder } from "@/store/useBuilder";
import { TopNavBlock, TabStripBlock, NavGroupBlock, PageTitleBlock } from "../ChromeBars";

let root: Root | null = null;
let container: HTMLDivElement;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  useBuilder.setState({
    headerBlocks: [
      { id: "nav", type: "TopNav", props: { brand: "Meridian Analytics", linksCsv: "Manager, Solutions", active: "Manager" } },
      { id: "tabs", type: "TabStrip", props: { tabsCsv: "Home, Risk", active: "Home" } },
    ],
  } as never);
});

afterEach(() => {
  act(() => { root?.unmount(); });
  container.remove();
  root = null;
});

function render(el: ReactElement): HTMLDivElement {
  act(() => { root?.unmount(); });
  act(() => {
    root = createRoot(container);
    root.render(el);
  });
  return container;
}
const button = (c: HTMLElement, name: string) =>
  [...c.querySelectorAll("button")].find((b) => b.textContent?.trim() === name)!;
const activeOf = (id: string) => useBuilder.getState().headerBlocks.find((b) => b.id === id)?.props.active;

describe("TopNav", () => {
  it("shows the brand, its initial as the mark, and marks the active link", () => {
    const c = render(<TopNavBlock system="salt" blockId="nav" brand="Meridian Analytics" linksCsv="Manager, Solutions" active="Solutions" />);
    expect(c.querySelector(".dh-topnav-name")?.textContent).toBe("Meridian Analytics");
    expect(c.querySelector(".dh-topnav-mark")?.textContent).toBe("M");
    expect(button(c, "Solutions").getAttribute("aria-current")).toBe("page");
    expect(button(c, "Manager").getAttribute("aria-current")).toBeNull();
  });

  it("takes its tone from the block and falls back to dark for an unknown one", () => {
    expect(render(<TopNavBlock system="salt" brand="A" tone="accent" />).querySelector(".dh-topnav")?.className).toContain("dh-tone-accent");
    expect(render(<TopNavBlock system="salt" brand="A" tone="neon" />).querySelector(".dh-topnav")?.className).toContain("dh-tone-dark");
  });

  it("leaves out the mark, the links and the account when told to", () => {
    const c = render(<TopNavBlock system="salt" brand="A" logo="none" account="none" />);
    expect(c.querySelector(".dh-topnav-mark")).toBeNull();
    expect(c.querySelector(".dh-topnav-links")).toBeNull();
    expect(c.querySelector(".dh-topnav-account")).toBeNull();
  });

  it("clicking a link makes it the block's active link", () => {
    const c = render(<TopNavBlock system="salt" blockId="nav" brand="A" linksCsv="Manager, Solutions" active="Manager" />);
    act(() => { button(c, "Solutions").click(); });
    expect(activeOf("nav")).toBe("Solutions");
  });
});

describe("TabStrip", () => {
  it("renders its tabs, the first active by default, and writes a click back", () => {
    const c = render(<TabStripBlock system="carbon" blockId="tabs" tabsCsv="Home, Risk" />);
    expect(button(c, "Home").getAttribute("aria-current")).toBe("page");
    act(() => { button(c, "Risk").click(); });
    expect(activeOf("tabs")).toBe("Risk");
  });

  it("shows the add control only when asked", () => {
    expect(render(<TabStripBlock system="m3" tabsCsv="A" />).querySelector(".dh-tabstrip-add")).toBeNull();
    expect(render(<TabStripBlock system="m3" tabsCsv="A" addButton />).querySelector(".dh-tabstrip-add")).not.toBeNull();
  });
});

describe("NavGroup and PageTitle", () => {
  it("render their text", () => {
    expect(render(<NavGroupBlock system="fluent" label="Reports" />).querySelector(".dh-navgroup")?.textContent).toBe("Reports");
    const c = render(<PageTitleBlock system="fluent" text="Risk" caption="As of Dec 2024" />);
    expect(c.querySelector("h1")?.textContent).toBe("Risk");
    expect(c.querySelector(".dh-page-caption")?.textContent).toBe("As of Dec 2024");
  });
});
