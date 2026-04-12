"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

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

/* ═══════════════════════════════════════════
   SimulatedInput
   ═══════════════════════════════════════════ */

interface InputProps extends SimProps {
  label?: string;
  placeholder?: string;
  helperText?: string;
  type?: string;
  error?: boolean;
}

export function SimulatedInput({
  system,
  label = "Email Address",
  placeholder = "name@company.com",
  helperText = "We'll never share your email.",
  type = "text",
  error = false,
}: InputProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  return (
    <div className={`${prefix}-input-container${error ? ` ${prefix}-input-error` : ""}`}>
      <label className={`${prefix}-label${focused ? ` ${prefix}-label-focused` : ""}`}>
        {label}
      </label>
      <div className={`${prefix}-input-wrapper${focused ? ` ${prefix}-input-wrapper-focused` : ""}`}>
        <input
          type={type}
          className={`${prefix}-input`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {system === "fluent" && <div className={`${prefix}-input-bottom-line`} />}
      </div>
      {helperText && (
        <span className={`${prefix}-helper-text`}>{helperText}</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedCheckbox
   ═══════════════════════════════════════════ */

interface CheckboxProps extends SimProps {
  label?: string;
  defaultChecked?: boolean;
}

export function SimulatedCheckbox({
  system,
  label = "Accept terms and conditions",
  defaultChecked = false,
}: CheckboxProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <label
      className={`${prefix}-checkbox-container`}
      onClick={(e) => { e.preventDefault(); setChecked(!checked); }}
    >
      <div className={`${prefix}-checkbox-visual${checked ? ` ${prefix}-checkbox-checked` : ""}`}>
        {checked && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span className={`${prefix}-checkbox-label`}>{label}</span>
    </label>
  );
}

/* ═══════════════════════════════════════════
   SimulatedSwitch
   ═══════════════════════════════════════════ */

interface SwitchProps extends SimProps {
  label?: string;
  defaultOn?: boolean;
}

export function SimulatedSwitch({
  system,
  label = "Enable Notifications",
  defaultOn = false,
}: SwitchProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [toggled, setToggled] = useState(defaultOn);

  return (
    <label
      className={`${prefix}-switch-container`}
      onClick={(e) => { e.preventDefault(); setToggled(!toggled); }}
    >
      <span className={`${prefix}-switch-label`}>{label}</span>
      <div className={`${prefix}-switch-track${toggled ? ` ${prefix}-switch-on` : ""}`}>
        <div className={`${prefix}-switch-thumb`} />
      </div>
    </label>
  );
}

/* ═══════════════════════════════════════════
   SimulatedAlert
   ═══════════════════════════════════════════ */

interface AlertProps extends SimProps {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  message?: string;
}

export function SimulatedAlert({
  system,
  variant = "info",
  title = "Update Available",
  message = "A new version of Design Hub is ready to install.",
}: AlertProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [dismissed, setDismissed] = useState(false);

  const iconMap: Record<string, string> = {
    info: "info",
    success: "check_circle",
    warning: "warning",
    error: "error",
  };

  if (dismissed) return null;

  return (
    <div className={`${prefix}-alert ${prefix}-alert-${variant}`}>
      <div className={`${prefix}-alert-icon`}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          {iconMap[variant]}
        </span>
      </div>
      <div className={`${prefix}-alert-content`}>
        <div className={`${prefix}-alert-title`}>{title}</div>
        <div className={`${prefix}-alert-message`}>{message}</div>
      </div>
      <button
        className={`${prefix}-alert-close`}
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedProgress
   ═══════════════════════════════════════════ */

interface ProgressProps extends SimProps {
  label?: string;
  targetValue?: number;
}

export function SimulatedProgress({
  system,
  label = "Uploading assets...",
  targetValue = 65,
}: ProgressProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(targetValue), 500);
    return () => clearTimeout(timer);
  }, [targetValue]);

  return (
    <div className={`${prefix}-progress-container`}>
      <div className={`${prefix}-progress-label-row`}>
        <span className={`${prefix}-progress-label`}>{label}</span>
        <span className={`${prefix}-progress-value`}>{progress}%</span>
      </div>
      <div className={`${prefix}-progress-track`}>
        <div
          className={`${prefix}-progress-fill`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedTooltip
   ═══════════════════════════════════════════ */

interface TooltipProps extends SimProps {
  text?: string;
  buttonLabel?: string;
}

export function SimulatedTooltip({
  system,
  text = "This is a simulated tooltip",
  buttonLabel = "Hover me",
}: TooltipProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(true), 200);
  }, []);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  return (
    <div className={`${prefix}-tooltip-wrapper`}>
      <button
        className={`${prefix}-btn ${prefix}-btn-secondary`}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {buttonLabel}
      </button>
      <div className={`${prefix}-tooltip${visible ? ` ${prefix}-tooltip-visible` : ""}`}>
        {text}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedTitle
   ═══════════════════════════════════════════ */

interface TitleProps extends SimProps {
  level?: "h1" | "h2" | "h3" | "h4";
  text?: string;
}

export function SimulatedTitle({
  system,
  level = "h2",
  text = "New Heading",
}: TitleProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const cls = `${prefix}-title ${prefix}-title-${level}`;

  switch (level) {
    case "h1": return <h1 className={cls}>{text}</h1>;
    case "h3": return <h3 className={cls}>{text}</h3>;
    case "h4": return <h4 className={cls}>{text}</h4>;
    default:   return <h2 className={cls}>{text}</h2>;
  }
}
