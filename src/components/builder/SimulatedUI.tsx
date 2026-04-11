"use client";

import React, { useState, useRef, useEffect } from "react";

interface SimProps {
  system: "salt" | "m3" | "fluent";
}

/* ═══════════════════════════════════════════
   SimulatedAvatar
   ═══════════════════════════════════════════ */

interface AvatarProps extends SimProps {
  initials?: string;
  size?: "sm" | "md" | "lg";
  presence?: "available" | "busy" | "away" | "offline";
  src?: string;
}

export function SimulatedAvatar({
  system,
  initials = "DH",
  size = "md",
  presence,
  src,
}: AvatarProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";

  return (
    <div className={`${prefix}-avatar ${prefix}-avatar-${size}`}>
      {src ? (
        <img className={`${prefix}-avatar-img`} src={src} alt={initials} />
      ) : (
        <span className={`${prefix}-avatar-initials`}>{initials}</span>
      )}
      {presence && (
        <div
          className={`${prefix}-avatar-presence ${prefix}-avatar-presence-${presence}`}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedDropdown
   ═══════════════════════════════════════════ */

interface DropdownItem {
  label: string;
  value: string;
  disabled?: boolean;
}

interface DropdownProps extends SimProps {
  items?: DropdownItem[];
  placeholder?: string;
}

const DEFAULT_ITEMS: DropdownItem[] = [
  { label: "Profile", value: "profile" },
  { label: "Settings", value: "settings" },
  { label: "Billing (Locked)", value: "billing", disabled: true },
];

export function SimulatedDropdown({
  system,
  items = DEFAULT_ITEMS,
  placeholder = "Select an option",
}: DropdownProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>("settings");
  const ref = useRef<HTMLDivElement>(null);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (item: DropdownItem) => {
    if (item.disabled) return;
    setSelected(item.value);
    setOpen(false);
  };

  const selectedLabel = items.find((i) => i.value === selected)?.label;

  return (
    <div className={`${prefix}-dropdown ${open ? `${prefix}-dropdown-open` : ""}`} ref={ref}>
      <button
        className={`${prefix}-dropdown-trigger`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className={selected ? "" : `${prefix}-dropdown-placeholder`}>
          {selectedLabel || placeholder}
        </span>
        <span
          className={`material-symbols-outlined ${prefix}-dropdown-chevron`}
          style={{ fontSize: 18 }}
        >
          expand_more
        </span>
      </button>
      {open && (
        <div className={`${prefix}-dropdown-menu`}>
          {items.map((item) => (
            <div
              key={item.value}
              className={`${prefix}-dropdown-item${
                selected === item.value ? ` ${prefix}-dropdown-item-selected` : ""
              }${item.disabled ? ` ${prefix}-dropdown-item-disabled` : ""}`}
              onClick={() => handleSelect(item)}
            >
              {item.label}
              {selected === item.value && (
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  check
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedDataTable
   ═══════════════════════════════════════════ */

type SortDir = "asc" | "desc" | null;

interface DataTableProps extends SimProps {
  columns?: string[];
  data?: { name: string; status: string; role: string; date: string }[];
}

const DEFAULT_COLUMNS = ["Name", "Status", "Role", "Last Active"];
const DEFAULT_DATA = [
  { name: "Jane Doe", status: "Active", role: "Admin", date: "2 hrs ago" },
  { name: "John Smith", status: "Pending", role: "Editor", date: "Yesterday" },
  { name: "Alice Jones", status: "Active", role: "Viewer", date: "5 mins ago" },
];

export function SimulatedDataTable({
  system,
  columns = DEFAULT_COLUMNS,
  data = DEFAULT_DATA,
}: DataTableProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const handleSort = (colIdx: number) => {
    if (sortCol === colIdx) {
      setSortDir(sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc");
      if (sortDir === "desc") setSortCol(null);
    } else {
      setSortCol(colIdx);
      setSortDir("asc");
    }
  };

  const statusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === "active") return "success";
    if (s === "pending") return "warning";
    return "neutral";
  };

  return (
    <div className={`${prefix}-table-container`}>
      <table className={`${prefix}-table`}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th
                key={col}
                className={`${prefix}-th ${sortCol === i ? `${prefix}-th-sorted` : ""}`}
                onClick={() => handleSort(i)}
              >
                <span>{col}</span>
                {sortCol === i && sortDir && (
                  <span className={`material-symbols-outlined ${prefix}-th-icon`} style={{ fontSize: 14 }}>
                    {sortDir === "asc" ? "arrow_upward" : "arrow_downward"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className={`${prefix}-tr${hoveredRow === idx ? ` ${prefix}-tr-hover` : ""}${selectedRow === idx ? ` ${prefix}-tr-selected` : ""}`}
              onMouseEnter={() => setHoveredRow(idx)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => setSelectedRow(selectedRow === idx ? null : idx)}
            >
              <td className={`${prefix}-td ${prefix}-td-name`}>{row.name}</td>
              <td className={`${prefix}-td`}>
                <span className={`${prefix}-status-badge ${prefix}-status-${statusClass(row.status)}`}>
                  {row.status}
                </span>
              </td>
              <td className={`${prefix}-td`}>{row.role}</td>
              <td className={`${prefix}-td ${prefix}-td-muted`}>{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedDatePicker
   ═══════════════════════════════════════════ */

interface DatePickerProps extends SimProps {
  month?: string;
  year?: number;
  today?: number;
}

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function SimulatedDatePicker({
  system,
  month = "October",
  year = 2026,
  today = 11,
}: DatePickerProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [selectedDay, setSelectedDay] = useState<number>(15);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  /* Static grid: 3 empty offset cells + 30 days */
  const calendarGrid: (number | null)[] = [
    ...Array(3).fill(null),
    ...Array.from({ length: 30 }, (_, i) => i + 1),
  ];

  return (
    <div className={`${prefix}-datepicker`}>
      {/* Header */}
      <div className={`${prefix}-datepicker-header`}>
        <button className={`${prefix}-datepicker-nav`} aria-label="Previous month">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
        </button>
        <span className={`${prefix}-datepicker-title`}>{month} {year}</span>
        <button className={`${prefix}-datepicker-nav`} aria-label="Next month">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
        </button>
      </div>

      {/* Weekday labels */}
      <div className={`${prefix}-datepicker-weekdays`}>
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className={`${prefix}-datepicker-weekday`}>{day}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={`${prefix}-datepicker-grid`}>
        {calendarGrid.map((day, idx) => (
          <div key={idx} className={`${prefix}-datepicker-cell`}>
            {day !== null && (
              <button
                className={`${prefix}-datepicker-day${
                  selectedDay === day ? ` ${prefix}-datepicker-day-selected` : ""
                }${today === day ? ` ${prefix}-datepicker-day-today` : ""}${
                  hoveredDay === day && selectedDay !== day ? ` ${prefix}-datepicker-day-hover` : ""
                }`}
                onClick={() => setSelectedDay(day)}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedDialog
   ═══════════════════════════════════════════ */

export function SimulatedDialog({ system }: SimProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button className={`${prefix}-btn ${prefix}-btn-primary`} onClick={() => setIsOpen(true)}>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
        Open Dialog
      </button>

      {isOpen && (
        <div className={`${prefix}-dialog-overlay`} onClick={() => setIsOpen(false)}>
          <div className={`${prefix}-dialog`} onClick={(e) => e.stopPropagation()}>
            <div className={`${prefix}-dialog-header`}>
              <h2 className={`${prefix}-dialog-title`}>Confirm Deletion</h2>
              <button className={`${prefix}-dialog-close`} onClick={() => setIsOpen(false)} aria-label="Close">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
            <div className={`${prefix}-dialog-body`}>
              Are you sure you want to delete this project? This action cannot be undone
              and will remove all associated files.
            </div>
            <div className={`${prefix}-dialog-footer`}>
              <button className={`${prefix}-btn ${prefix}-btn-secondary`} onClick={() => setIsOpen(false)}>
                Cancel
              </button>
              <button className={`${prefix}-btn ${prefix}-btn-danger`} onClick={() => setIsOpen(false)}>
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedTabs
   ═══════════════════════════════════════════ */

interface TabsProps extends SimProps {
  tabs?: string[];
  contents?: string[];
}

const DEFAULT_TABS = ["General", "Security", "Notifications"];
const DEFAULT_CONTENTS = [
  "General settings and workspace configurations live here.",
  "Manage your passwords, 2FA, and active sessions.",
  "Choose how and when you want to be alerted.",
];

export function SimulatedTabs({
  system,
  tabs = DEFAULT_TABS,
  contents = DEFAULT_CONTENTS,
}: TabsProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className={`${prefix}-tabs-container`}>
      <div className={`${prefix}-tab-list`}>
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            className={`${prefix}-tab${activeTab === idx ? ` ${prefix}-tab-active` : ""}`}
            onClick={() => setActiveTab(idx)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className={`${prefix}-tab-panel`}>
        <p>{contents[activeTab]}</p>
      </div>
    </div>
  );
}
