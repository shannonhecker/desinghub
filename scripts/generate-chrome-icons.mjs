#!/usr/bin/env node
/**
 * Writes src/lib/chromeIcons/nodes.ts: the drawings of the builder chrome's
 * icons, copied from the installed lucide-react (ISC licence).
 *
 *   node scripts/generate-chrome-icons.mjs
 *
 * The chrome names icons by the Material Symbols names it has always used
 * ("content_copy"); MAP gives each the closest lucide icon. The drawings are
 * copied rather than imported so the SVG carries no `lucide-*` class (the
 * builder's design-system stylesheets match class names by substring, and
 * "lucide-table" or "lucide-link" would pick up their rules), and so code
 * with no React (the toast) can draw the same icons.
 *
 * To add an icon: add a line to MAP, run this script, commit both files.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LUCIDE = join(ROOT, "node_modules/lucide-react");

/** Material Symbols name: lucide icon (file name in lucide-react/dist/esm/icons). */
const MAP = {
  menu: "menu",
  edit_square: "square-pen",
  palette: "palette",
  ios_share: "share",
  share: "share-2",
  expand_less: "chevron-up",
  expand_more: "chevron-down",
  check: "check",
  warning: "triangle-alert",
  link: "link",
  link_off: "unlink",
  hourglass_top: "hourglass",
  hourglass_empty: "hourglass",
  download: "download",
  downloading: "loader",
  code_blocks: "square-code",
  drag_indicator: "grip-vertical",
  forum: "messages-square",
  add_photo_alternate: "image-plus",
  close: "x",
  error: "circle-alert",
  image: "image",
  arrow_forward: "arrow-right",
  dashboard: "layout-dashboard",
  dock_to_left: "panel-left",
  dock_to_right: "panel-right",
  picture_in_picture: "picture-in-picture-2",
  tune: "sliders-horizontal",
  grid_view: "layout-grid",
  edit: "pencil",
  send: "send-horizontal",
  chevron_left: "chevron-left",
  chevron_right: "chevron-right",
  folder_open: "folder-open",
  content_copy: "copy",
  search: "search",
  unfold_less: "chevrons-down-up",
  unfold_more: "chevrons-up-down",
  history: "history",
  check_circle: "circle-check",
  add_circle: "circle-plus",
  chat_bubble: "message-square",
  chat_bubble_outline: "message-square-dashed",
  chat: "message-square-text",
  bookmark_border: "bookmark",
  dark_mode: "moon",
  light_mode: "sun",
  view_quilt: "layout-template",
  auto_awesome: "sparkles",
  bolt: "zap",
  code: "code",
  language: "globe",
  folder_zip: "folder-archive",
  shapes: "shapes",
  category: "shapes",
  data_object: "braces",
  design_services: "pencil-ruler",
  magic_button: "wand-sparkles",
  info: "info",
  terminal: "terminal",
  visibility: "eye",
  undo: "undo-2",
  redo: "redo-2",
  more_horiz: "ellipsis",
  fit_screen: "maximize",
  density_medium: "rows-3",
  view_column: "columns-3",
  view_week: "columns-4",
  compare: "columns-2",
  check_box: "square-check",
  check_box_outline_blank: "square",
  refresh: "refresh-cw",
  open_in_new: "external-link",
  add: "plus",
  table_view: "table-2",
  upload: "upload",
  restart_alt: "rotate-ccw",
  radio_button_checked: "circle-dot",
  delete: "trash-2",
  arrow_upward: "arrow-up",
  arrow_downward: "arrow-down",
  width: "move-horizontal",
  height: "move-vertical",
  width_full: "stretch-horizontal",
  swap_horiz: "arrow-left-right",
  compare_arrows: "arrow-left-right",
  view_agenda: "rows-2",
  call_split: "split",
  open_with: "move",
  drag_pan: "move",
  crop_free: "scan",
  north: "arrow-up-to-line",
  west: "arrow-left-to-line",
  south: "arrow-down-to-line",
  top_panel_open: "panel-top",
  left_panel_open: "panel-left",
  bottom_panel_open: "panel-bottom",
  reorder: "align-justify",
  align_horizontal_left: "align-start-vertical",
  align_horizontal_center: "align-center-vertical",
  align_horizontal_right: "align-end-vertical",
  align_vertical_top: "align-start-horizontal",
  align_vertical_center: "align-center-horizontal",
  align_vertical_bottom: "align-end-horizontal",
  vertical_align_top: "arrow-up-to-line",
  vertical_align_center: "fold-vertical",
  vertical_align_bottom: "arrow-down-to-line",
  expand: "unfold-vertical",
  format_align_left: "text-align-start",
  format_align_center: "text-align-center",
  format_align_right: "text-align-end",
  rocket_launch: "rocket",
  list_alt: "clipboard-list",
  shopping_cart: "shopping-cart",
  article: "newspaper",
  wallpaper: "images",
  smart_button: "rectangle-horizontal",
  table_chart: "table",
  text_fields: "type",
  tab: "app-window",
  toggle_on: "toggle-right",
  new_releases: "badge",
  group: "users",
  analytics: "chart-no-axes-column",
  arrow_drop_down_circle: "circle-chevron-down",
  calendar_today: "calendar",
  ads_click: "mouse-pointer-click",
  title: "heading",
  edit_note: "text-cursor-input",
  add_box: "square-plus",
  remove: "minus",
  block: "ban",
  colorize: "pipette",
  contrast: "contrast",
  delete_sweep: "list-x",
  format_color_fill: "paint-bucket",
  view_module: "grid-3x3",
  widgets: "blocks",
  monitoring: "chart-no-axes-combined",
  settings: "settings",
  contacts: "contact",
  login: "log-in",
  shield: "shield",
  trending_up: "trending-up",
  eco: "leaf",
  thermostat: "thermometer",
  filter_alt: "funnel",
  candlestick_chart: "chart-candlestick",
  report: "octagon-alert",
  fact_check: "clipboard-check",
  home: "house",
  database: "database",
  person: "user",
  notifications: "bell",
  bar_chart: "chart-column",
  account_circle: "circle-user",
  account_tree: "network",
  area_chart: "chart-area",
  badge: "id-card",
  branding_watermark: "stamp",
  circle: "circle",
  contact_page: "file-user",
  counter_1: "hash",
  credit_card: "credit-card",
  donut_large: "circle-dashed",
  grid_on: "grid-2x2",
  insert_chart: "chart-column-big",
  inventory_2: "package",
  label: "tag",
  list: "list",
  menu_open: "panel-left-close",
  multiline_chart: "chart-line",
  notes: "text",
  percent: "percent",
  pie_chart: "chart-pie",
  pin: "binary",
  radar: "radar",
  scatter_plot: "chart-scatter",
  segment: "list-filter",
  sell: "tags",
  short_text: "minus",
  show_chart: "chart-spline",
  space_bar: "space",
  speed: "gauge",
  ssid_chart: "chart-no-axes-combined",
  stacked_bar_chart: "chart-column-stacked",
  star_half: "star-half",
  subject: "text-align-justify",
  table_rows: "table-rows-split",
  timeline: "chart-gantt",
  upload_file: "file-up",
  verified: "badge-check",
  waterfall_chart: "chart-column-decreasing",
  web_asset: "panel-top-dashed",
  input: "text-cursor",
  dashboard_customize: "layout-panel-top",
  build: "wrench",
  format_paint: "paint-roller",
  cancel: "circle-x",
  keyboard: "keyboard",
  hearing: "ear",
};

/** Drawn for a name with no entry: a neutral mark, never the name's letters. */
const FALLBACK = "circle-dashed";

function nodeOf(icon) {
  const text = readFileSync(join(LUCIDE, "dist/esm/icons", `${icon}.js`), "utf8");
  /* An older name is a file that re-exports the icon under its new name. */
  const alias = text.match(/export \{[^}]*\} from '\.\/([a-z0-9-]+)\.js'/);
  if (alias) return nodeOf(alias[1]);
  const literal = text.match(/const __iconNode = (\[[\s\S]*?\]);\n/);
  if (!literal) throw new Error(`lucide icon "${icon}" has no drawing`);
  const node = new Function(`return ${literal[1]}`)();
  return node.map(([tag, attrs]) => {
    const { key, ...rest } = attrs;
    void key;
    return [tag, rest];
  });
}

const version = JSON.parse(readFileSync(join(LUCIDE, "package.json"), "utf8")).version;
const icons = [...new Set([...Object.values(MAP), FALLBACK])].sort();
const constName = (icon) => icon.replace(/[^a-z0-9]+/g, "_").toUpperCase();

const out = [];
out.push(`/* Generated by scripts/generate-chrome-icons.mjs from lucide-react ${version}. Do not edit.`);
out.push(``);
out.push(`   The drawings are lucide's (https://lucide.dev), used under the ISC licence.`);
out.push(`   Copyright (c) 2026 Lucide Icons and Contributors. Some icons derive from`);
out.push(`   Feather, copyright (c) 2013-present Cole Bemis (MIT). Permission to use,`);
out.push(`   copy, modify, and/or distribute this software for any purpose with or`);
out.push(`   without fee is hereby granted, provided that the above copyright notice`);
out.push(`   and this permission notice appear in all copies. Full text, kept beside`);
out.push(`   this file: LICENSE-lucide.txt. */`);
out.push(``);
out.push(`export type ChromeIconNode = readonly (readonly [tag: string, attrs: Readonly<Record<string, string>>])[];`);
out.push(``);
for (const icon of icons) out.push(`const ${constName(icon)}: ChromeIconNode = ${JSON.stringify(nodeOf(icon))};`);
out.push(``);
out.push(`/** Drawn for a name with no entry. */`);
out.push(`export const CHROME_ICON_FALLBACK: ChromeIconNode = ${constName(FALLBACK)};`);
out.push(``);
out.push(`/** Material Symbols name: the drawing of the closest lucide icon. */`);
out.push(`export const CHROME_ICON_NODES: Readonly<Record<string, ChromeIconNode>> = {`);
for (const [name, icon] of Object.entries(MAP)) out.push(`  ${name}: ${constName(icon)}, // ${icon}`);
out.push(`};`);
out.push(``);

const target = join(ROOT, "src/lib/chromeIcons/nodes.ts");
writeFileSync(target, out.join("\n"));
writeFileSync(join(ROOT, "src/lib/chromeIcons/LICENSE-lucide.txt"), readFileSync(join(LUCIDE, "LICENSE"), "utf8"));
console.log(`${Object.keys(MAP).length} names, ${icons.length} drawings -> ${target}`);
