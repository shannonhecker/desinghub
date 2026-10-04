import { describe, it, expect } from "vitest";
import { addMonths, dataDays, monthGrid, monthLabel, moveDay, monthOf } from "../calendarGrid";

describe("monthGrid", () => {
  it("weeks start on Monday; blanks before the first and after the last day", () => {
    /* 1 January 2026 is a Thursday. */
    const weeks = monthGrid("2026-01");
    expect(weeks[0]).toEqual([null, null, null, "2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04"]);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
    expect(weeks[weeks.length - 1].filter(Boolean).pop()).toBe("2026-01-31");
  });
  it("names the month and steps between months across a year", () => {
    expect(monthLabel("2025-10")).toBe("October 2025");
    expect(addMonths("2025-12", 1)).toBe("2026-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(monthOf("2026-01-05")).toBe("2026-01");
  });
});

describe("dataDays", () => {
  it("the days that have bars (UTC)", () => {
    const days = dataDays([Date.UTC(2026, 0, 2, 9), Date.UTC(2026, 0, 2, 15), Date.UTC(2026, 0, 5, 10)]);
    expect([...days]).toEqual(["2026-01-02", "2026-01-05"]);
  });
});

describe("moveDay: the calendar's keys", () => {
  const within = { min: "2025-10-05", max: "2026-01-05" };
  it("arrows move a day or a week; Home and End go to the week's ends; Page Up and Down a month", () => {
    expect(moveDay("2026-01-01", "ArrowRight", within)).toBe("2026-01-02");
    expect(moveDay("2026-01-01", "ArrowLeft", within)).toBe("2025-12-31");
    expect(moveDay("2025-12-31", "ArrowDown", within)).toBe("2026-01-05");
    expect(moveDay("2025-12-24", "ArrowUp", within)).toBe("2025-12-17");
    /* Monday-first weeks: 1 Jan 2026 is a Thursday. */
    expect(moveDay("2026-01-01", "Home", within)).toBe("2025-12-29");
    expect(moveDay("2025-12-29", "End", within)).toBe("2026-01-04");
    expect(moveDay("2025-12-31", "PageUp", within)).toBe("2025-11-30");
    expect(moveDay("2025-11-30", "PageDown", within)).toBe("2025-12-30");
  });
  it("stays inside the data's dates", () => {
    expect(moveDay("2026-01-05", "ArrowRight", within)).toBe("2026-01-05");
    expect(moveDay("2025-10-05", "PageUp", within)).toBe("2025-10-05");
    expect(moveDay("2026-01-04", "ArrowDown", within)).toBe("2026-01-05");
  });
  it("other keys do nothing", () => {
    expect(moveDay("2026-01-01", "a", within)).toBeNull();
  });
});
