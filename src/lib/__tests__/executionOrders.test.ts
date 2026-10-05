import { describe, it, expect } from "vitest";
import { executionDataset, EXECUTION_ORDERS, MINUTE } from "../reportData/executionDataset";
import { EXECUTION_INTERVALS, EXECUTION_KEYS, resolveExecution } from "../executionModel";
import { createTicker, feedBaseView, FEED_SEED, withFeed } from "../executionFeed";
import {
  amendLimit, canAmend, compareOrders, COMPARE_MEASURES, defaultOrderType, draftTicket, formatAmount, parseAmount, parsePrice, tidyAmount,
  groupSampleOrders, sampleOrderLabel,
  percentDoneSeries, PRICE_BAND, priceBand, PRICE_STEP, SAMPLE_CONFIRMATION, snapPrice, stagedTicket, stepPrice, validateAmendment, validateTicket,
  type Amendment, type TicketDraft,
} from "../executionOrders";

const dataset = executionDataset();
const BUY = { [EXECUTION_KEYS.order]: EXECUTION_ORDERS[0] };
const SELL = { [EXECUTION_KEYS.order]: EXECUTION_ORDERS[1] };
const buyView = resolveExecution(dataset, BUY)!;
const sellView = resolveExecution(dataset, SELL)!;
const market = { bid: 1.37648, ask: 1.37656 };
const draft = (over: Partial<TicketDraft> = {}): TicketDraft => ({ ...draftTicket({ side: "BUY", price: 1.3765, market }), ...over });

describe("sample confirmation", () => {
  it("is exactly the sentence the design note asks for", () => {
    expect(SAMPLE_CONFIRMATION).toBe("Sample order. Nothing was sent.");
  });
});

describe("snapPrice and stepPrice", () => {
  it("snaps to a tenth of a pip (0.00001), with no float residue", () => {
    expect(PRICE_STEP).toBe(0.00001);
    expect(snapPrice(1.376543)).toBe(1.37654);
    expect(snapPrice(1.376547)).toBe(1.37655);
    expect(snapPrice(0.1 + 0.2)).toBe(0.3);
    expect(String(snapPrice(1.3765400000000001))).toBe("1.37654");
  });
  it("steps one tenth of a pip, or one pip with the large step, and stays snapped", () => {
    expect(stepPrice(1.37654, 1)).toBe(1.37655);
    expect(stepPrice(1.37654, -1)).toBe(1.37653);
    expect(stepPrice(1.37654, 1, true)).toBe(1.37664);
    expect(stepPrice(1.37654, -1, true)).toBe(1.37644);
  });
});

describe("parseAmount and parsePrice", () => {
  it("reads plain, grouped and m / k amounts; rejects anything else", () => {
    expect(parseAmount("1,000,000")).toBe(1_000_000);
    expect(parseAmount(" 2500000 ")).toBe(2_500_000);
    expect(parseAmount("1.5m")).toBe(1_500_000);
    expect(parseAmount("250k")).toBe(250_000);
    for (const bad of ["", "abc", "1,0,0x", "Infinity", "NaN", "1e400", "--5"]) expect(parseAmount(bad)).toBeNull();
    expect(parseAmount("-5")).toBe(-5);
  });
  it("reads a price; rejects text and non-finite values", () => {
    expect(parsePrice("1.37650")).toBe(1.3765);
    expect(parsePrice(" 1.376501 ")).toBe(1.3765);
    for (const bad of ["", "1.37.6", "abc", "Infinity"]) expect(parsePrice(bad)).toBeNull();
  });
  it("formats an amount with grouping", () => {
    expect(formatAmount(1_000_000)).toBe("1,000,000");
  });
});

describe("priceBand", () => {
  it("is a sane band around the market: one percent either side, snapped", () => {
    expect(PRICE_BAND).toBe(0.01);
    const band = priceBand(market);
    const mid = (market.bid + market.ask) / 2;
    expect(band.min).toBe(snapPrice(mid * 0.99));
    expect(band.max).toBe(snapPrice(mid * 1.01));
    expect(band.min).toBeLessThan(market.bid);
    expect(band.max).toBeGreaterThan(market.ask);
  });
});

describe("draftTicket and defaultOrderType", () => {
  it("defaults the type the way the original does: SELL is a stop, BUY a limit; a caller may pin it", () => {
    expect(defaultOrderType("SELL")).toBe("Stop");
    expect(defaultOrderType("BUY")).toBe("Limit");
    expect(defaultOrderType("SELL", "Take profit")).toBe("Take profit");
  });
  it("prefills the price to five decimals and a one million notional", () => {
    const d = draftTicket({ side: "SELL", price: 1.376501, market });
    expect(d).toMatchObject({ side: "SELL", type: "Stop", price: "1.37650", notional: "1,000,000", start: "Now", goodTill: "GTC" });
  });
});

describe("validateTicket", () => {
  it("accepts a positive notional and a price inside the band", () => {
    const r = validateTicket(draft(), market);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.order).toMatchObject({ side: "BUY", type: "Limit", notional: 1_000_000, price: 1.3765 });
  });
  it("rejects a notional that is not a positive finite number", () => {
    for (const notional of ["0", "-1,000", "", "abc", "Infinity", "1e400"]) {
      const r = validateTicket(draft({ notional }), market);
      expect(r.ok, notional).toBe(false);
      if (!r.ok) expect(r.errors.notional).toBeTruthy();
    }
  });
  it("rejects a price outside the band, or missing, and says what the band is", () => {
    const band = priceBand(market);
    for (const price of ["1.2", "1.5", "", "x"]) {
      const r = validateTicket(draft({ price }), market);
      expect(r.ok, price).toBe(false);
      if (!r.ok) expect(r.errors.price).toBeTruthy();
    }
    const r = validateTicket(draft({ price: "1.2" }), market);
    if (!r.ok) expect(r.errors.price).toContain(band.min.toFixed(5));
  });
  it("a market order takes the touch for its side and ignores the price field", () => {
    const buy = validateTicket(draft({ type: "Market", price: "nonsense" }), market);
    const sell = validateTicket(draft({ type: "Market", side: "SELL", price: "" }), market);
    expect(buy.ok && buy.order.price).toBe(market.ask);
    expect(sell.ok && sell.order.price).toBe(market.bid);
  });
  it("an iceberg is optional, but positive and no larger than the notional", () => {
    expect(validateTicket(draft({ iceberg: "" }), market).ok).toBe(true);
    const big = validateTicket(draft({ iceberg: "2,000,000" }), market);
    expect(big.ok).toBe(false);
    const neg = validateTicket(draft({ iceberg: "-1" }), market);
    expect(neg.ok).toBe(false);
  });
});

describe("notional limits and tidyAmount", () => {
  const market = { bid: 1.37627, ask: 1.37635 };
  const draft = (notional: string) => ({ ...draftTicket({ side: "BUY", price: market.ask, market, venue: "Meridian Pool" }), notional });
  it("refuses a notional below 1,000 or above 1,000,000,000, in words", () => {
    for (const [text, message] of [["0.4", /at least 1,000/], ["999", /at least 1,000/], ["1e24", /above zero/], ["1000000000000000000000000", /at most 1,000,000,000/], ["1,000,000,001", /at most 1,000,000,000/]] as const) {
      const r = validateTicket(draft(text), market);
      expect(r.ok, text).toBe(false);
      if (!r.ok) expect(r.errors.notional, text).toMatch(message);
    }
  });
  it("takes the limits themselves", () => {
    expect(validateTicket(draft("1,000"), market).ok).toBe(true);
    expect(validateTicket(draft("1,000,000,000"), market).ok).toBe(true);
  });
  it("tidies an amount on leaving the field, and leaves anything else as typed", () => {
    expect(tidyAmount("2.5m")).toBe("2,500,000");
    expect(tidyAmount("750000")).toBe("750,000");
    expect(tidyAmount("250k")).toBe("250,000");
    expect(tidyAmount("abc")).toBe("abc");
    expect(tidyAmount("0")).toBe("0");
    expect(tidyAmount("")).toBe("");
  });
});

describe("stagedTicket (the BID tag dropped at a price)", () => {
  it("above the market stages a SELL take profit; below, a BUY limit; snapped", () => {
    expect(stagedTicket(1.377004, 1.3765)).toEqual({ side: "SELL", type: "Take profit", price: 1.377 });
    expect(stagedTicket(1.3761, 1.3765)).toEqual({ side: "BUY", type: "Limit", price: 1.3761 });
  });
});

describe("canAmend and validateAmendment", () => {
  it("only a working order can be amended; a filled one cannot", () => {
    expect(canAmend(buyView.order)).toBe(true);
    expect(canAmend(sellView.order)).toBe(false);
    const r = validateAmendment(sellView.order, "1.37650", market);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/filled/i);
  });
  it("snaps the new limit and keeps it in the band", () => {
    const ok = validateAmendment(buyView.order, "1.376543", market);
    expect(ok).toEqual({ ok: true, price: 1.37654 });
    expect(validateAmendment(buyView.order, "1.2", market).ok).toBe(false);
    expect(validateAmendment(buyView.order, "", market).ok).toBe(false);
  });
});

describe("amendLimit", () => {
  const lastTime = buyView.times[buyView.times.length - 1];
  const at = (price: number, time = lastTime): Amendment => ({ order: buyView.order.id, time, price });

  it("is the view itself with no amendments", () => {
    expect(amendLimit(buyView, [])).toBe(buyView);
  });
  it("steps the limit series from the amended bar on, and moves the LMT tag; the past is untouched", () => {
    const out = amendLimit(buyView, [at(1.3762)]);
    const n = out.limit.length;
    expect(out.limit[n - 1]).toBe(1.3762);
    expect(out.limit.slice(0, n - 1)).toEqual(buyView.limit.slice(0, n - 1));
    expect(out.pills.find((p) => p.key === "limit")?.value).toBe(1.3762);
    /* A copy: the view given is not written to. */
    expect(buyView.limit[n - 1]).not.toBe(1.3762);
  });
  it("the later of two amendments wins from its own bar", () => {
    const earlier = buyView.times[buyView.times.length - 10];
    const out = amendLimit(buyView, [at(1.3761, earlier), at(1.3763)]);
    const n = out.limit.length;
    expect(out.limit[n - 10]).toBe(1.3761);
    expect(out.limit[n - 2]).toBe(1.3761);
    expect(out.limit[n - 1]).toBe(1.3763);
  });
  it("feed bars after the amendment carry the amended limit", () => {
    const ticker = createTicker(feedBaseView(dataset, BUY)!, FEED_SEED);
    const samples = Array.from({ length: 5 }, () => ticker.next());
    const live = resolveExecution(withFeed(dataset, buyView.order.id, samples), BUY)!;
    const out = amendLimit(live, [at(1.3762, samples[1].time)]);
    const n = out.limit.length;
    expect(out.limit.slice(n - 4)).toEqual([1.3762, 1.3762, 1.3762, 1.3762]);
    expect(out.limit[n - 5]).toBe(live.limit[n - 5]);
  });
  it("on a five-minute interval the step lands in the bucket that holds the amended minute", () => {
    const five = resolveExecution(dataset, { ...BUY, [EXECUTION_KEYS.interval]: "5m" })!;
    const out = amendLimit(five, [at(1.3762, lastTime)]);
    expect(out.limit[out.limit.length - 1]).toBe(1.3762);
    expect(out.limit[out.limit.length - 2]).toBe(five.limit[five.limit.length - 2]);
  });
  it("ignores amendments for another order, and any for a filled order", () => {
    expect(amendLimit(sellView, [{ order: sellView.order.id, time: lastTime, price: 1.3762 }])).toBe(sellView);
    expect(amendLimit(buyView, [{ order: sellView.order.id, time: lastTime, price: 1.3762 }])).toBe(buyView);
  });
  it("an amendment after the last bar shown waits (nothing changes yet)", () => {
    expect(amendLimit(buyView, [at(1.3762, lastTime + 5 * MINUTE)]).limit).toEqual(buyView.limit);
  });
});

describe("amendLimit on every interval", () => {
  const lastMinute = buyView.times[buyView.times.length - 1];
  for (const interval of Object.keys(EXECUTION_INTERVALS)) {
    const view = resolveExecution(dataset, { ...BUY, [EXECUTION_KEYS.interval]: interval })!;
    it(`${interval}: an amendment on the latest minute steps the last bar and the LMT tag`, () => {
      const out = amendLimit(view, [{ order: view.order.id, time: lastMinute, price: 1.3762 }]);
      expect(out).not.toBe(view);
      expect(out.limit[out.limit.length - 1]).toBe(1.3762);
      expect(out.pills.find((p) => p.key === "limit")?.value).toBe(1.3762);
    });
    it(`${interval}: an amendment stamped with the last bar's own time does the same`, () => {
      const out = amendLimit(view, [{ order: view.order.id, time: view.times[view.times.length - 1], price: 1.3764 }]);
      expect(out.limit[out.limit.length - 1]).toBe(1.3764);
    });
    it(`${interval}: an amendment a full bar after the view ends is not drawn`, () => {
      const after = view.times[view.times.length - 1] + EXECUTION_INTERVALS[interval] * MINUTE;
      expect(amendLimit(view, [{ order: view.order.id, time: after, price: 1.3762 }])).toBe(view);
    });
  }
});

describe("compareOrders", () => {
  it("gives the ten measures, in order, for both orders", () => {
    const table = compareOrders(dataset);
    expect(COMPARE_MEASURES).toHaveLength(10);
    expect(table.orders.map((o) => o.id)).toEqual([...EXECUTION_ORDERS]);
    expect(table.rows.map((r) => r.measure)).toEqual([...COMPARE_MEASURES]);
    expect(COMPARE_MEASURES).toEqual([
      "Status", "Duration", "Amount done", "Fills", "Passive %", "Slippage vs arrival", "Avg fill vs TWAP", "Avg spread capture", "Avg 1-bar markout", "Top venue",
    ]);
    for (const r of table.rows) expect(r.values).toHaveLength(2);
  });
  it("reads the orders table and averages the fills", () => {
    const table = compareOrders(dataset);
    const row = (m: string) => table.rows.find((r) => r.measure === m)!;
    expect(row("Status").values).toEqual(["Working", "Filled"]);
    expect(row("Fills").values[0]).toMatch(/^\d+$/);
    expect(row("Slippage vs arrival").values[0]).toMatch(/^[+-]\d+\.\d{2} pips$/);
    expect(row("Passive %").values[1]).toMatch(/^\d+\.\d %$/);
    expect(row("Top venue").values[0]).toMatch(/ \d+\.\d%$/);
    /* Signed measures carry a tone for colour, and a sign in the text. */
    for (const m of ["Slippage vs arrival", "Avg fill vs TWAP", "Avg spread capture", "Avg 1-bar markout"]) {
      const r = row(m);
      r.values.forEach((v, i) => expect(r.tones?.[i]).toBe(v.startsWith("-") ? "down" : v.startsWith("+") ? "up" : "flat"));
    }
  });
  it("follows the feed: the shown order's figures include the feed's fills", () => {
    const ticker = createTicker(feedBaseView(dataset, BUY)!, FEED_SEED);
    const samples = Array.from({ length: 80 }, () => ticker.next());
    const fed = compareOrders(withFeed(dataset, EXECUTION_ORDERS[0], samples));
    const base = compareOrders(dataset);
    const fills = (t: typeof base) => Number(t.rows.find((r) => r.measure === "Fills")!.values[0]);
    expect(fills(fed)).toBeGreaterThan(fills(base));
  });
});

describe("percentDoneSeries", () => {
  it("one series per order over the session, never falling, ending at the order's percent done", () => {
    const series = percentDoneSeries(dataset);
    expect(series.map((s) => s.id)).toEqual([...EXECUTION_ORDERS]);
    for (const s of series) {
      const ys = s.points.map(([, y]) => y);
      ys.forEach((y, i) => { if (i) expect(y).toBeGreaterThanOrEqual(ys[i - 1]); });
    }
    expect(series[1].points.at(-1)?.[1]).toBe(100);
  });
});

describe("sample orders on the plot: one label per side and price", () => {
  it("an order on its own keeps its plain label", () => {
    const groups = groupSampleOrders([{ side: "BUY", price: 1.3765 }]);
    expect(groups).toEqual([{ side: "BUY", price: 1.3765, count: 1 }]);
    expect(sampleOrderLabel(groups[0])).toBe("SAMPLE BUY 1.37650");
  });

  it("the same side at the same price is one group, counted", () => {
    const groups = groupSampleOrders([
      { side: "BUY", price: 1.37635 }, { side: "BUY", price: 1.37635 }, { side: "BUY", price: 1.37635 }, { side: "BUY", price: 1.37635 },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(4);
    expect(sampleOrderLabel(groups[0])).toBe("SAMPLE BUY 1.37635 \u00d74");
  });

  it("the other side at that price, and another price, are groups of their own, in the order first placed", () => {
    const groups = groupSampleOrders([
      { side: "BUY", price: 1.37635 }, { side: "SELL", price: 1.37635 }, { side: "BUY", price: 1.3764 }, { side: "BUY", price: 1.37635 }, { side: "SELL", price: 1.37635 },
    ]);
    expect(groups.map(sampleOrderLabel)).toEqual(["SAMPLE BUY 1.37635 \u00d72", "SAMPLE SELL 1.37635 \u00d72", "SAMPLE BUY 1.37640"]);
  });

  it("prices that print the same are the same price (a float's last digits do not split a group)", () => {
    const groups = groupSampleOrders([{ side: "SELL", price: 1.37635 }, { side: "SELL", price: 1.3763500000001 }, { side: "SELL", price: 0.1 + 0.2 }, { side: "SELL", price: 0.3 }]);
    expect(groups.map((g) => g.count)).toEqual([2, 2]);
  });

  it("nothing placed is nothing drawn, and the input is not changed", () => {
    expect(groupSampleOrders([])).toEqual([]);
    const placed = [{ side: "BUY" as const, price: 1.2 }, { side: "BUY" as const, price: 1.2 }];
    groupSampleOrders(placed);
    expect(placed).toHaveLength(2);
  });
});
