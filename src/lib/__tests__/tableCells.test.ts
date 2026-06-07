import { describe, it, expect } from "vitest";
import { resolveCell, isStatusColumn, statusToClass } from "../tableCells";

describe("statusToClass", () => {
  it("does NOT throw on undefined/null (the crash that broke generated tables)", () => {
    expect(() => statusToClass(undefined)).not.toThrow();
    expect(() => statusToClass(null)).not.toThrow();
    expect(statusToClass(undefined)).toBe("neutral");
  });

  it("maps positive-ish statuses to success", () => {
    expect(statusToClass("Active")).toBe("success");
    expect(statusToClass("Paid")).toBe("success");
    expect(statusToClass("healthy")).toBe("success");
  });

  it("maps in-progress-ish statuses to warning", () => {
    expect(statusToClass("Pending")).toBe("warning");
    expect(statusToClass("At risk")).toBe("warning");
  });

  it("falls back to neutral for unknown values", () => {
    expect(statusToClass("Archived")).toBe("neutral");
    expect(statusToClass(42)).toBe("neutral");
  });

  it("maps CRM lifecycle stages to a distinct funnel progression", () => {
    expect(statusToClass("Lead")).toBe("neutral");
    expect(statusToClass("Marketing qualified lead")).toBe("info");
    expect(statusToClass("MQL")).toBe("info");
    expect(statusToClass("Sales qualified lead")).toBe("indigo");
    expect(statusToClass("SQL")).toBe("indigo");
    expect(statusToClass("Opportunity")).toBe("warning");
    expect(statusToClass("Customer")).toBe("success");
  });

  it("maps hard-negative states to error (were silently neutral before)", () => {
    expect(statusToClass("Refunded")).toBe("error");
    expect(statusToClass("Churned")).toBe("error");
    expect(statusToClass("Failed")).toBe("error");
    expect(statusToClass("Cancelled")).toBe("error");
  });
});

describe("isStatusColumn", () => {
  it("detects status-like column headers", () => {
    expect(isStatusColumn("Status")).toBe(true);
    expect(isStatusColumn("stage")).toBe(true);
    expect(isStatusColumn("State")).toBe(true);
    expect(isStatusColumn("Customer")).toBe(false);
  });
});

describe("resolveCell", () => {
  it("reads an object keyed by the column header (domain rows from the model)", () => {
    const row = { Plant: "Fern", "Last watered": "2 days ago", Status: "Healthy" };
    expect(resolveCell(row, "Plant", 0)).toBe("Fern");
    expect(resolveCell(row, "Last watered", 1)).toBe("2 days ago");
    expect(resolveCell(row, "Status", 2)).toBe("Healthy");
  });

  it("matches headers case-insensitively", () => {
    expect(resolveCell({ status: "Paid" }, "Status", 1)).toBe("Paid");
  });

  it("falls back to the legacy {name,status,role,date} positional shape", () => {
    const row = { name: "#10472", status: "Paid", role: "Northwind Co.", date: "2h ago" };
    expect(resolveCell(row, "Order", 0)).toBe("#10472");
    expect(resolveCell(row, "Status", 1)).toBe("Paid");
    expect(resolveCell(row, "Customer", 2)).toBe("Northwind Co.");
    expect(resolveCell(row, "Updated", 3)).toBe("2h ago");
  });

  it("reads array rows positionally", () => {
    expect(resolveCell(["Fern", "2d", "Healthy"], "Plant", 0)).toBe("Fern");
    expect(resolveCell(["Fern", "2d", "Healthy"], "Status", 2)).toBe("Healthy");
  });

  it("returns empty string for missing fields instead of crashing", () => {
    expect(resolveCell({ Plant: "Fern" }, "Status", 1)).toBe("");
    expect(resolveCell(null, "Status", 0)).toBe("");
    expect(resolveCell(undefined, "Status", 0)).toBe("");
  });
});
