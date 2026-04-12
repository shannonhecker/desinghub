/* ── Apply parsed AI actions to the Zustand store ── */

import { useBuilder } from "@/store/useBuilder";
import type { AIAction } from "./parseAIResponse";
import type { DesignSystem, BuilderMode } from "@/store/useBuilder";

const VALID_DESIGN_SYSTEMS = ["salt", "m3", "fluent"];
const VALID_MODES = ["light", "dark"];
const VALID_DENSITIES = ["high", "medium", "low", "touch"];

export function applyAIActions(actions: AIAction[]): void {
  const store = useBuilder.getState();

  for (const action of actions) {
    switch (action.action) {
      case "setDesignSystem":
        if (typeof action.value === "string" && VALID_DESIGN_SYSTEMS.includes(action.value)) {
          store.setDesignSystem(action.value as DesignSystem);
        }
        break;

      case "setMode":
        if (typeof action.value === "string" && VALID_MODES.includes(action.value)) {
          store.setMode(action.value as BuilderMode);
        }
        break;

      case "setDensity":
        if (typeof action.value === "string" && VALID_DENSITIES.includes(action.value)) {
          store.setDensity(action.value);
        }
        break;

      case "setComponents":
        if (Array.isArray(action.value)) {
          store.setSelectedComponents(action.value);
        }
        break;
    }
  }
}
