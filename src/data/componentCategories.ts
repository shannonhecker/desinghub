/** Sub-category mapping for nested sidebar navigation */
export const COMPONENT_SUBCATS: Record<string, string> = {
  /* Actions */
  buttons: "Actions", pills: "Actions", "toggle-btn": "Actions", "segmented-btn": "Actions",
  tag: "Actions", link: "Actions", links: "Actions", fabs: "Actions", "icon-buttons": "Actions",
  chips: "Actions",
  /* Inputs */
  inputs: "Inputs", "text-fields": "Inputs", checkboxes: "Inputs", radios: "Inputs",
  switches: "Inputs", slider: "Inputs", sliders: "Inputs", dropdown: "Inputs", dropdowns: "Inputs",
  "form-field": "Inputs", "list-box": "Inputs", "combo-box": "Inputs",
  "number-input": "Inputs", "multiline-input": "Inputs", calendar: "Inputs",
  "date-picker": "Inputs", "date-pickers": "Inputs", "file-drop": "Inputs",
  /* Navigation */
  tabs: "Navigation", menu: "Navigation", menus: "Navigation", stepper: "Navigation",
  pagination: "Navigation", "vert-nav": "Navigation", "nav-item": "Navigation",
  "skip-link": "Navigation", "nav-bar": "Navigation", breadcrumbs: "Navigation",
  /* Communication */
  banners: "Communication", dialog: "Communication", dialogs: "Communication",
  badges: "Communication", avatars: "Communication", tooltips: "Communication",
  progress: "Communication", toast: "Communication", spinner: "Communication",
  snackbar: "Communication", messagebars: "Communication", alerts: "Communication",
  /* Containment */
  cards: "Containment", accordion: "Containment", dividers: "Containment",
  drawer: "Containment", panel: "Containment", "data-grid": "Containment",
  table: "Containment", "data-table": "Containment", "ag-grid": "Containment",
  overlay: "Containment", splitter: "Containment",
  "static-list": "Containment", carousel: "Containment", "interactable-card": "Containment",
  collapsible: "Containment", "bottom-sheets": "Containment",
};

export const SUBCAT_ORDER = ["Actions", "Inputs", "Navigation", "Communication", "Containment"];
