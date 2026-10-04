import { describe, it, expect } from "vitest";
import { dropdownModel, DEFAULT_DROPDOWN_OPTIONS } from "../dropdownModel";

describe("dropdownModel", () => {
  it("reads label, value and options from the block", () => {
    expect(dropdownModel({ label: "Currency", value: "GBP", optionsCsv: "GBP, USD, EUR" })).toEqual({
      label: "Currency",
      value: "GBP",
      placeholder: "Select an option",
      options: ["GBP", "USD", "EUR"],
      inline: false,
      compact: false,
    });
  });

  it("a bare dropdown gets the default choices and no value", () => {
    const m = dropdownModel({});
    expect(m.options).toEqual(DEFAULT_DROPDOWN_OPTIONS);
    expect(m.value).toBe("");
    expect(m.label).toBe("");
  });

  it("a value with no options is the only option (never 'Option 1')", () => {
    expect(dropdownModel({ value: "Last 30 days" }).options).toEqual(["Last 30 days"]);
  });

  it("a value missing from the options is added so it can be shown as chosen", () => {
    expect(dropdownModel({ value: "JPY", optionsCsv: "GBP,USD" }).options).toEqual(["JPY", "GBP", "USD"]);
  });

  it("an options array wins over the csv and may contain commas", () => {
    expect(dropdownModel({ options: ["Fixed income, rates", "Equity"], optionsCsv: "A, B" }).options).toEqual(["Fixed income, rates", "Equity"]);
  });

  it("keeps the caller's placeholder", () => {
    expect(dropdownModel({ placeholder: "Pick a fund" }).placeholder).toBe("Pick a fund");
  });
});
