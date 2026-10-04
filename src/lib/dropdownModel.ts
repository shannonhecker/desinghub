/**
 * dropdownModel - the one reading of a Dropdown block's content.
 *
 * The canvas renderers (five design systems, real + simulated) and the five
 * export emitters each used to invent their own options ("Option 1",
 * "Option 2") and ignore the block's value, so a dropdown authored as
 * "Currency: GBP" rendered and exported as a generic select. They all read
 * this model instead, so what is on the canvas is what gets exported.
 */

export interface DropdownModel {
  /** Field label ("Currency"). Empty when the block has none. */
  label: string;
  /** The chosen value. Empty when nothing is chosen. */
  value: string;
  /** Shown when nothing is chosen. */
  placeholder: string;
  /** Every choice, in order. Always contains `value` when one is set. */
  options: string[];
  /** Draw the smallest form of the control, with no visible label: for a
   *  dropdown inside a toolbar or a panel header. */
  compact: boolean;
}

/** Choices for a bare dropdown dropped from the library with no content yet. */
export const DEFAULT_DROPDOWN_OPTIONS = ["Option 1", "Option 2", "Option 3"];

const text = (v: unknown): string => (v == null ? "" : String(v).trim());

export function dropdownModel(props: Record<string, unknown>): DropdownModel {
  const label = text(props.label);
  const value = text(props.value);
  const placeholder = text(props.placeholder) || "Select an option";
  /* `options` (an array) wins over `optionsCsv`: it can hold a choice that
     itself contains a comma. */
  let options = Array.isArray(props.options)
    ? props.options.map(text).filter(Boolean)
    : text(props.optionsCsv)
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
  if (options.length === 0) options = value ? [value] : [...DEFAULT_DROPDOWN_OPTIONS];
  else if (value && !options.includes(value)) options = [value, ...options];
  return { label, value, placeholder, options, compact: props.compact === true };
}
