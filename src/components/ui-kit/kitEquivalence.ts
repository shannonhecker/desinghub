/**
 * One map of "the same thing" across the five design systems.
 *
 * Names and ids differ per system ("Buttons" vs "Button", `text-fields` vs
 * `inputs`, "Banners" vs "Message Bars" vs "Notification"), and some things
 * exist in one system only (FAB is Material's). Every surface that moves
 * between systems reads this module: the system switcher (stay on the same
 * component), the URL, and the Compare view.
 *
 * Pure data. It does not import the registry, so the store can use it; the
 * unit test checks every row against the registry instead.
 */
import type { SystemId } from "@/store/useDesignHub";

export const EQ_SYSTEMS: SystemId[] = ["salt", "m3", "fluent", "uoaui", "carbon"];

export const SYSTEM_LABEL: Record<SystemId, string> = {
  salt: "Salt", m3: "Material 3", fluent: "Fluent 2", uoaui: "uoaui", carbon: "Carbon",
};

type Group = "component" | "pattern" | "foundation" | "tool";

interface Concept {
  /** Short singular name used in the "has no X" line. */
  label: string;
  group: Group;
  /** The registry id in each system that has this concept. */
  ids: Partial<Record<SystemId, string>>;
  /** Concepts to try, in order, where a system lacks this one. */
  fallback?: string[];
  /** True when the real design system has no such thing (Material's FAB).
      Everything else that is missing is a gap in this library, not in the
      system, and the copy must say so. */
  systemOnly?: true;
}

const all = (id: string): Record<SystemId, string> => ({ salt: id, m3: id, fluent: id, uoaui: id, carbon: id });

export const CONCEPTS: Record<string, Concept> = {
  /* ── Components ── */
  button: { label: "Button", group: "component", ids: all("buttons") },
  "icon-button": { label: "Icon button", group: "component", ids: { m3: "icon-buttons", carbon: "icon-button" }, fallback: ["button"] },
  fab: { label: "FAB", group: "component", ids: { m3: "fabs" }, fallback: ["button"], systemOnly: true },
  "toggle-button": { label: "Toggle button", group: "component", ids: { salt: "toggle-btn" }, fallback: ["segmented", "switch"] },
  segmented: { label: "Segmented control", group: "component", ids: { salt: "segmented-btn", m3: "segmented-buttons", carbon: "content-switcher" }, fallback: ["tabs"] },
  link: { label: "Link", group: "component", ids: { salt: "link", fluent: "links", carbon: "link" }, fallback: ["button"] },
  "skip-link": { label: "Skip link", group: "component", ids: { salt: "skip-link", carbon: "skip-link" }, fallback: ["link", "button"] },
  "text-input": { label: "Text input", group: "component", ids: { salt: "inputs", m3: "text-fields", fluent: "inputs", uoaui: "inputs", carbon: "inputs" } },
  textarea: { label: "Multiline input", group: "component", ids: { salt: "multiline-input", carbon: "textarea" }, fallback: ["text-input"] },
  "number-input": { label: "Number input", group: "component", ids: { salt: "number-input" }, fallback: ["text-input"] },
  "form-field": { label: "Form field", group: "component", ids: { salt: "form-field", carbon: "form-field" }, fallback: ["text-input"] },
  search: { label: "Search", group: "component", ids: { m3: "search-bar", carbon: "search" }, fallback: ["text-input"] },
  checkbox: { label: "Checkbox", group: "component", ids: all("checkboxes") },
  radio: { label: "Radio", group: "component", ids: all("radios") },
  switch: { label: "Switch", group: "component", ids: all("switches") },
  slider: { label: "Slider", group: "component", ids: { salt: "slider", m3: "sliders", fluent: "slider", carbon: "slider" }, fallback: ["progress"] },
  dropdown: { label: "Dropdown", group: "component", ids: { salt: "dropdown", uoaui: "dropdowns", carbon: "dropdowns" }, fallback: ["menu", "text-input"] },
  "combo-box": { label: "Combo box", group: "component", ids: { salt: "combo-box", carbon: "combobox" }, fallback: ["dropdown", "menu", "text-input"] },
  multiselect: { label: "Multi-select", group: "component", ids: { carbon: "multiselect" }, fallback: ["combo-box", "dropdown", "menu", "text-input"] },
  "list-box": { label: "List box", group: "component", ids: { salt: "list-box" }, fallback: ["dropdown", "menu", "text-input"] },
  menu: { label: "Menu", group: "component", ids: { salt: "menu", m3: "menus", fluent: "menus", carbon: "overflow-menu" }, fallback: ["dropdown"] },
  calendar: { label: "Calendar", group: "component", ids: { salt: "calendar" }, fallback: ["date-picker", "text-input"] },
  "date-picker": { label: "Date picker", group: "component", ids: { salt: "date-picker", m3: "date-pickers", uoaui: "date-picker", carbon: "date-picker" }, fallback: ["text-input"] },
  "file-upload": { label: "File upload", group: "component", ids: { salt: "file-drop", carbon: "file-uploader" }, fallback: ["text-input"] },
  card: { label: "Card", group: "component", ids: all("cards") },
  "interactable-card": { label: "Interactable card", group: "component", ids: { salt: "interactable-card" }, fallback: ["card"] },
  panel: { label: "Panel", group: "component", ids: { salt: "panel" }, fallback: ["card"] },
  splitter: { label: "Splitter", group: "component", ids: { salt: "splitter" }, fallback: ["card"] },
  carousel: { label: "Carousel", group: "component", ids: { salt: "carousel" }, fallback: ["card"] },
  "code-snippet": { label: "Code snippet", group: "component", ids: { carbon: "code-snippet" }, fallback: ["card"] },
  divider: { label: "Divider", group: "component", ids: { salt: "dividers", m3: "dividers", fluent: "dividers", carbon: "divider" }, fallback: ["card"] },
  accordion: { label: "Accordion", group: "component", ids: { salt: "accordion", uoaui: "accordion", carbon: "accordion" }, fallback: ["tabs"] },
  collapsible: { label: "Collapsible", group: "component", ids: { salt: "collapsible" }, fallback: ["accordion", "tabs"] },
  tabs: { label: "Tabs", group: "component", ids: all("tabs") },
  pagination: { label: "Pagination", group: "component", ids: { salt: "pagination", carbon: "pagination" }, fallback: ["tabs"] },
  stepper: { label: "Stepper", group: "component", ids: { salt: "stepper" }, fallback: ["progress"] },
  breadcrumbs: { label: "Breadcrumbs", group: "component", ids: { uoaui: "breadcrumbs", carbon: "breadcrumbs" }, fallback: ["link", "tabs"] },
  "side-nav": { label: "Side navigation", group: "component", ids: { salt: "vert-nav", carbon: "sidenav" }, fallback: ["nav-bar", "tabs"] },
  "nav-bar": { label: "Navigation bar", group: "component", ids: { m3: "nav-bar", carbon: "bottom-nav" }, fallback: ["side-nav", "tabs"] },
  "nav-item": { label: "Navigation item", group: "component", ids: { salt: "nav-item" }, fallback: ["side-nav", "nav-bar", "tabs"] },
  header: { label: "UI shell header", group: "component", ids: { carbon: "header" }, fallback: ["side-nav", "nav-bar", "tabs"], systemOnly: true },
  tag: { label: "Tag", group: "component", ids: { salt: "pills", m3: "chips", carbon: "tags" }, fallback: ["badge"] },
  "static-tag": { label: "Static tag", group: "component", ids: { salt: "tag" }, fallback: ["tag", "badge"] },
  badge: { label: "Badge", group: "component", ids: { salt: "badges", m3: "badges", fluent: "badges", uoaui: "badges", carbon: "badge" } },
  avatar: { label: "Avatar", group: "component", ids: { salt: "avatars", fluent: "avatars", uoaui: "avatars", carbon: "avatars" }, fallback: ["badge"] },
  tooltip: { label: "Tooltip", group: "component", ids: all("tooltips") },
  popover: { label: "Popover", group: "component", ids: { carbon: "popover" }, fallback: ["tooltip"] },
  overlay: { label: "Overlay", group: "component", ids: { salt: "overlay" }, fallback: ["dialog"] },
  dialog: { label: "Dialog", group: "component", ids: { salt: "dialog", m3: "dialogs", fluent: "dialogs", uoaui: "dialog", carbon: "dialog" } },
  drawer: { label: "Drawer", group: "component", ids: { salt: "drawer", m3: "bottom-sheets", carbon: "drawer" }, fallback: ["dialog"] },
  alert: { label: "Inline message", group: "component", ids: { salt: "banners", m3: "snackbar", fluent: "messagebars", uoaui: "alerts", carbon: "alerts" } },
  toast: { label: "Toast", group: "component", ids: { salt: "toast", carbon: "notification" }, fallback: ["alert"] },
  progress: { label: "Progress", group: "component", ids: all("progress") },
  spinner: { label: "Spinner", group: "component", ids: { salt: "spinner", carbon: "loading" }, fallback: ["progress"] },
  skeleton: { label: "Skeleton", group: "component", ids: { carbon: "skeleton" }, fallback: ["spinner", "progress"] },
  "data-table": { label: "Data table", group: "component", ids: { salt: "table", uoaui: "data-table", carbon: "data-table" }, fallback: ["ag-grid"] },
  "data-grid": { label: "Data grid", group: "component", ids: { salt: "data-grid" }, fallback: ["data-table", "ag-grid"] },
  "ag-grid": { label: "AG Grid", group: "component", ids: { salt: "ag-grid", m3: "ag-grid", fluent: "ag-grid", uoaui: "ag-grid" }, fallback: ["data-table"] },
  "static-list": { label: "Static list", group: "component", ids: { salt: "static-list", carbon: "structured-list" }, fallback: ["data-table", "ag-grid"] },
  charts: { label: "Charts", group: "component", ids: { salt: "charts", m3: "charts", fluent: "charts", uoaui: "charts" }, fallback: ["data-table"] },

  /* ── Patterns ── */
  "pat-dashboard": { label: "Analytical dashboard", group: "pattern", ids: all("pat-dashboard") },
  "pat-form": { label: "Form", group: "pattern", ids: all("pat-form") },
  "pat-list-detail": { label: "List and detail", group: "pattern", ids: all("pat-list-detail") },
  "pat-app-shell": { label: "App shell", group: "pattern", ids: all("pat-app-shell") },
  "pat-login": { label: "Login", group: "pattern", ids: all("pat-login") },
  "pat-settings": { label: "Settings page", group: "pattern", ids: all("pat-settings") },
  "pat-search": { label: "Search results", group: "pattern", ids: all("pat-search") },
  "pat-wizard": { label: "Wizard", group: "pattern", ids: all("pat-wizard") },
  "pat-data-table": { label: "Data table page", group: "pattern", ids: all("pat-data-table") },
  "pat-feed": { label: "Feed", group: "pattern", ids: { m3: "pat-feed" }, fallback: ["pat-list-detail"] },

  /* ── Foundations ── */
  "f-color": { label: "Colour", group: "foundation", ids: { salt: "dl-color", m3: "guide-color-roles", fluent: "dl-color", uoaui: "dl-color", carbon: "dl-color" } },
  "f-palette": { label: "Full palette", group: "foundation", ids: { m3: "guide-palette" }, fallback: ["f-color"] },
  "f-state-layers": { label: "State layers", group: "foundation", ids: { m3: "guide-state-layers" }, fallback: ["f-color"], systemOnly: true },
  "f-icons": { label: "Iconography", group: "foundation", ids: all("dl-icons") },
  "f-type": { label: "Typography", group: "foundation", ids: { salt: "dl-typography", fluent: "dl-typography", uoaui: "dl-typography", carbon: "dl-typography" }, fallback: ["f-color"] },
  "f-elevation": { label: "Elevation", group: "foundation", ids: { salt: "dl-elevation", m3: "guide-surfaces", fluent: "dl-elevation", uoaui: "dl-elevation", carbon: "dl-elevation" } },
  "f-spacing": { label: "Spacing", group: "foundation", ids: { salt: "dl-spacing", fluent: "dl-spacing", uoaui: "dl-spacing", carbon: "dl-spacing" }, fallback: ["f-density"] },
  "f-density": { label: "Density", group: "foundation", ids: { salt: "dl-density", m3: "density-tokens", fluent: "dl-density", uoaui: "dl-density", carbon: "dl-density" } },
  "f-tokens": { label: "Token architecture", group: "foundation", ids: { salt: "dl-tokens", m3: "guide-theming", uoaui: "dl-tokens", carbon: "dl-tokens" }, fallback: ["f-color"] },
  "f-mapping": { label: "Component mapping", group: "foundation", ids: { m3: "guide-mapping" }, fallback: ["f-tokens", "f-color"] },
  "f-a11y": { label: "Accessibility", group: "foundation", ids: { salt: "dl-a11y", m3: "a11y", fluent: "dl-a11y", uoaui: "dl-a11y", carbon: "dl-a11y" } },
  "f-content": { label: "Content design", group: "foundation", ids: { salt: "dl-content", m3: "content-design", fluent: "dl-content", uoaui: "dl-content" }, fallback: ["f-a11y"] },
  "f-shape": { label: "Shape", group: "foundation", ids: { m3: "shape-tokens", fluent: "dl-shapes", carbon: "dl-shape" }, fallback: ["f-elevation"] },
  "f-motion": { label: "Motion", group: "foundation", ids: { fluent: "dl-motion", carbon: "dl-motion" }, fallback: ["f-elevation"] },

  /* ── Tools: the same in every system ── */
  tokens: { label: "Tokens", group: "tool", ids: all("tokens") },
  audit: { label: "Design audit", group: "tool", ids: all("audit") },
  "builder-blocks": { label: "Builder blocks", group: "tool", ids: all("builder-blocks") },
};

/* (system, id) -> concept key, built once. */
const CONCEPT_OF: Record<SystemId, Record<string, string>> = { salt: {}, m3: {}, fluent: {}, uoaui: {}, carbon: {} };
for (const [key, concept] of Object.entries(CONCEPTS)) {
  for (const sys of EQ_SYSTEMS) {
    const id = concept.ids[sys];
    if (id) CONCEPT_OF[sys][id] = key;
  }
}

/** Last resort per group, present in every system. */
const GROUP_ANCHOR: Record<Group, string> = { component: "button", pattern: "pat-dashboard", foundation: "f-color", tool: "tokens" };

export function conceptOf(system: SystemId, id: string): string | null {
  return CONCEPT_OF[system][id] ?? null;
}

export interface Equivalent {
  /** Registry id in the target system, or null when it has no equivalent. */
  id: string | null;
  /** True when the system itself has no such thing; false when only this
      library lacks the page. */
  systemOnly: boolean;
  /** Name of the thing being looked for ("FAB"). */
  label: string;
  /** Closest matches in the target system, same category first. Offered as
      links on the "not in this system" page; never followed automatically. */
  closest: { id: string; label: string }[];
}

/**
 * Where a visitor on (from, id) lands in `to`: the same concept when the
 * target has it. When it does not, `id` is null and the caller shows the
 * "not in this system" state with `closest` as links. One rule for the whole
 * library: the visitor is never redirected and never dropped on the overview.
 */
export function resolveEquivalent(from: SystemId, id: string, to: SystemId): Equivalent {
  const key = conceptOf(from, id);
  const concept = key ? CONCEPTS[key] : null;
  if (from === to) return { id, label: concept?.label ?? id, systemOnly: false, closest: [] };
  if (!concept) {
    return { id: null, label: id, systemOnly: false, closest: [{ id: CONCEPTS.button.ids[to]!, label: CONCEPTS.button.label }] };
  }
  const same = concept.ids[to];
  if (same) return { id: same, label: concept.label, systemOnly: false, closest: [] };
  const closest: { id: string; label: string }[] = [];
  for (const alt of [...(concept.fallback ?? []), GROUP_ANCHOR[concept.group]]) {
    const target = CONCEPTS[alt]?.ids[to];
    if (target && !closest.some((c) => c.id === target)) closest.push({ id: target, label: CONCEPTS[alt].label });
  }
  return { id: null, label: concept.label, systemOnly: concept.systemOnly === true, closest: closest.slice(0, 3) };
}

/** The id of this concept in each system that has it (for Compare). */
export function idsAcrossSystems(system: SystemId, id: string): Partial<Record<SystemId, string>> {
  const key = conceptOf(system, id);
  return key ? CONCEPTS[key].ids : { [system]: id };
}

/* ── URL: the place is shareable and survives reload ── */
export interface KitPlace {
  ds: SystemId;
  /** Selected entry. With `from`, an id of THAT system which `ds` lacks. */
  c?: string | null;
  /** Set only on the "not in this system" state: the system `c` belongs to. */
  from?: SystemId | null;
  tab?: string | null;
  q?: string | null;
  show?: string | null;
}

export function kitHref(place: KitPlace): string {
  const p = new URLSearchParams();
  p.set("ds", place.ds);
  if (place.c) p.set("c", place.c);
  if (place.c && place.from && place.from !== place.ds) p.set("from", place.from);
  if (place.c && place.tab && place.tab !== "overview") p.set("tab", place.tab);
  if (!place.c && place.q) p.set("q", place.q);
  if (!place.c && place.show && place.show !== "all") p.set("show", place.show);
  return `/ui-kit?${p.toString()}`;
}

/** The place a switch to `to` leads to: the equivalent entry, or the same
    entry marked as coming from the system that has it. */
export function switchPlace(place: KitPlace, to: SystemId): KitPlace {
  if (!place.c) return { ...place, ds: to, from: null };
  const source = place.from && place.from !== place.ds ? place.from : place.ds;
  const eq = resolveEquivalent(source, place.c, to);
  return eq.id
    ? { ...place, ds: to, c: eq.id, from: null }
    : { ...place, ds: to, c: place.c, from: source };
}

/** The link a system switcher entry points at from the current place. */
export function switchHref(place: KitPlace, to: SystemId): string {
  return kitHref(switchPlace(place, to));
}
