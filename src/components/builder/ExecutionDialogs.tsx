"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { DesignSystem } from "@/store/useBuilder";
import type { SystemId } from "@/lib/componentApiRegistry";
import { RealComponentRenderer } from "@/components/ui-kit/RealComponentRenderer";
import type { FormDialogModel } from "@/components/ui-kit/RealFormDialog";
import { dayLabel, parseGoTo, type GoToField } from "@/lib/chartViewport";
import { monthOf } from "@/lib/calendarGrid";

/* ══════════════════════════════════════════════════════════
   The FX Execution chart's dialogs, each the active design system's own
   (RealComponentRenderer "FormDialog"). PR B: Go to. Later PRs add
   Compare, Settings and Amend here.

   Go to, as in the original: "Date" (a day on the calendar and a time:
   about ninety minutes around it) or "Custom range" (the calendar fills
   From, then To; each has a time). Only days with sample data can be
   picked; typed dates outside the data get a plain message.
   ══════════════════════════════════════════════════════════ */

const MODES = ["Date", "Custom range"] as const;
type GoToMode = (typeof MODES)[number];

export interface GoToDialogProps {
  system: DesignSystem;
  mode: "light" | "dark";
  open: boolean;
  onClose: () => void;
  launcher: React.RefObject<HTMLElement | null>;
  /** Days with sample data the chart can reach ("YYYY-MM-DD"), sorted. */
  days: readonly string[];
  /** Move the chart to [from, to] (ms). A string is a plain error to show. */
  onGo: (from: number, to: number) => string | null;
}

export function GoToDialog({ system, mode, open, onClose, launcher, days, onGo }: GoToDialogProps) {
  const first = days[0] ?? "";
  const last = days[days.length - 1] ?? "";
  const daySet = useMemo(() => new Set(days), [days]);
  const [goMode, setGoMode] = useState<GoToMode>("Date");
  const [date, setDate] = useState(last);
  const [time, setTime] = useState("10:30");
  const [fromDate, setFromDate] = useState(last);
  const [fromTime, setFromTime] = useState("10:00");
  const [toDate, setToDate] = useState(last);
  const [toTime, setToTime] = useState("11:00");
  const [armed, setArmed] = useState<"from" | "to">("from");
  const [month, setMonth] = useState(monthOf(last || "2026-01-01"));
  const [error, setError] = useState<{ field: GoToField | "form"; text: string } | null>(null);

  /* Each opening starts clean on the latest day with data. */
  useEffect(() => {
    if (!open) return;
    setError(null);
    setArmed("from");
    const inside = (d: string) => Boolean(d) && d >= first && d <= last;
    const shownDate = inside(date) ? date : last;
    const shownFrom = inside(fromDate) ? fromDate : last;
    if (shownDate !== date) setDate(shownDate);
    if (shownFrom !== fromDate) setFromDate(shownFrom);
    if (!inside(toDate)) setToDate(last);
    setMonth(monthOf((goMode === "Date" ? shownDate : shownFrom) || "2026-01-01"));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on open only
  }, [open]);

  const clear = (field: GoToField) => (v: string, set: (v: string) => void) => { set(v); if (error?.field === field || error?.field === "form") setError(null); };
  const typed = (field: GoToField, set: (v: string) => void, followMonth = false) => (v: string) => {
    clear(field)(v, set);
    if (followMonth && /^\d{4}-\d{2}-\d{2}$/.test(v) && v >= first && v <= last) setMonth(monthOf(v));
  };
  const errorOf = (field: GoToField) => (error?.field === field ? error.text : null);

  const submit = () => {
    const r = parseGoTo(goMode === "Date" ? { mode: "date", date, time } : { mode: "range", fromDate, fromTime, toDate, toTime }, { first, last });
    if (!r.ok) {
      setError({ field: r.field, text: r.error });
      document.getElementById(`fx-goto-${r.field}`)?.focus();
      return;
    }
    const refused = onGo(r.from, r.to);
    if (refused) {
      const field: GoToField = goMode === "Date" ? "date" : "fromDate";
      setError({ field, text: refused });
      document.getElementById(`fx-goto-${field}`)?.focus();
      return;
    }
    onClose();
  };

  const pick = (day: string) => {
    setError(null);
    if (goMode === "Date") { setDate(day); return; }
    if (armed === "from") { setFromDate(day); if (toDate < day) setToDate(day); setArmed("to"); return; }
    if (day < fromDate) { setToDate(fromDate); setFromDate(day); } else setToDate(day);
    setArmed("from");
  };

  const field = (id: GoToField, label: string, type: "date" | "time", value: string, set: (v: string) => void) => ({
    id: `fx-goto-${id}`, label, type, value, error: errorOf(id),
    onChange: typed(id, set, type === "date"),
    ...(type === "date" ? { min: first, max: last } : { placeholder: "HH:MM" }),
  });

  const model: FormDialogModel = {
    open,
    title: "Go to",
    note: first ? `Sample data from ${dayLabel(first)} to ${dayLabel(last)}.` : undefined,
    choice: { label: "Go to a", options: [...MODES], value: goMode, onChange: (v) => { setGoMode(v as GoToMode); setError(null); setMonth(monthOf((v === "Date" ? date : fromDate) || last)); } },
    calendar: {
      label: goMode === "Date" ? "Pick a day" : "Pick the start and end days",
      month, onMonth: setMonth,
      selected: goMode === "Date" ? [date] : [fromDate, toDate],
      enabled: (d) => daySet.has(d), onPick: pick, min: first, max: last,
      prompt: goMode === "Date" ? undefined : armed === "from" ? "Pick the start day" : "Pick the end day",
    },
    rows: goMode === "Date"
      ? [[field("date", "Date", "date", date, setDate), field("time", "Time (UTC)", "time", time, setTime)]]
      : [
          [field("fromDate", "From", "date", fromDate, setFromDate), field("fromTime", "Time (UTC)", "time", fromTime, setFromTime)],
          [field("toDate", "To", "date", toDate, setToDate), field("toTime", "Time (UTC)", "time", toTime, setToTime)],
        ],
    primary: { label: "Go to", onClick: submit },
    cancel: { label: "Cancel" },
    onClose,
    returnFocus: launcher,
  };

  return <RealComponentRenderer system={system as SystemId} type="FormDialog" mode={mode} saltDensity="high" props={{ model }} />;
}
