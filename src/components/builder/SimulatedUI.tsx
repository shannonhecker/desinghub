"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";

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
  initials = "AB",
  size = "md",
  presence,
  src,
}: AvatarProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";

  return (
    <div className={`${prefix}-avatar ${prefix}-avatar-${size}`}>
      {src ? (
        <img src={src} alt="Avatar" className={`${prefix}-avatar-img`} />
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
  children?: React.ReactNode;
}

export function SimulatedCheckbox({
  system,
  label = "Accept terms and conditions",
  defaultChecked = false,
  children,
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
      <span className={`${prefix}-checkbox-label`}>{children || label}</span>
    </label>
  );
}

/* ═══════════════════════════════════════════
   SimulatedSwitch
   ═══════════════════════════════════════════ */

interface SwitchProps extends SimProps {
  label?: string;
  defaultOn?: boolean;
  children?: React.ReactNode;
}

export function SimulatedSwitch({
  system,
  label = "Enable Notifications",
  defaultOn = false,
  children,
}: SwitchProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [toggled, setToggled] = useState(defaultOn);

  return (
    <label
      className={`${prefix}-switch-container`}
      onClick={(e) => { e.preventDefault(); setToggled(!toggled); }}
    >
      <span className={`${prefix}-switch-label`}>{children || label}</span>
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
  value?: number;
}

export function SimulatedProgress({
  system,
  label = "Uploading assets...",
  value = 50,
}: ProgressProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const safeValue = Math.min(Math.max(value, 0), 100);

  return (
    <div
      className={`${prefix}-progress-container`}
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {label && (
        <div className={`${prefix}-progress-label-row`}>
          <span className={`${prefix}-progress-label`}>{label}</span>
          <span className={`${prefix}-progress-value`}>{safeValue}%</span>
        </div>
      )}
      <div className={`${prefix}-progress-track`}>
        <div
          className={`${prefix}-progress-fill`}
          style={{ width: `${safeValue}%` }}
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

/* ═══════════════════════════════════════════
   SimulatedBreadcrumb
   ═══════════════════════════════════════════ */

export function SimulatedBreadcrumb({ system }: SimProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const path = ["Home", "Projects", "Design Hub"];

  return (
    <nav className={`${prefix}-breadcrumb`} aria-label="Breadcrumb">
      <ol className={`${prefix}-breadcrumb-list`}>
        {path.map((item, index) => {
          const isLast = index === path.length - 1;
          return (
            <li key={item} className={`${prefix}-breadcrumb-item`}>
              <a
                href="#"
                className={`${prefix}-breadcrumb-link${isLast ? " active" : ""}`}
                onClick={(e) => e.preventDefault()}
                aria-current={isLast ? "page" : undefined}
              >
                {item}
              </a>
              {!isLast && (
                <span className={`${prefix}-breadcrumb-separator`} aria-hidden="true">
                  {system === "m3" ? "/" : ">"}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ═══════════════════════════════════════════
   SimulatedAccordion
   ═══════════════════════════════════════════ */

export function SimulatedAccordion({ system }: SimProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`${prefix}-accordion`}>
      <button
        className={`${prefix}-accordion-header`}
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
      >
        <span className={`${prefix}-accordion-title`}>Advanced Settings</span>
        <span
          className={`${prefix}-accordion-icon`}
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>
      {isOpen && (
        <div className={`${prefix}-accordion-body`}>
          <p>Configure deployment environments, manage API keys, and set up custom domains for your project here.</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedCard
   ═══════════════════════════════════════════ */

interface CardProps extends SimProps {
  title?: string;
  content?: string;
}

export function SimulatedCard({
  system,
  title = "Card Title",
  content = "Card content goes here.",
}: CardProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";

  return (
    <div className={`${prefix}-sim-card`}>
      <div className={`${prefix}-sim-card-header`}>
        <span className={`${prefix}-sim-card-title`}>{title}</span>
      </div>
      <div className={`${prefix}-sim-card-body`}>
        <p className={`${prefix}-sim-card-content`}>{content}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedBadge
   ═══════════════════════════════════════════ */

type BadgeStatus = "default" | "info" | "success" | "warning" | "error";

interface BadgeProps extends SimProps {
  label?: string;
  status?: BadgeStatus;
}

export function SimulatedBadge({
  system,
  label = "Badge",
  status = "default",
}: BadgeProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";

  return (
    <span className={`${prefix}-sim-badge ${prefix}-sim-badge-${status}`}>
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════
   SimulatedChatMessage
   ═══════════════════════════════════════════ */

interface ChatMessageProps extends SimProps {
  role?: "user" | "system";
  message?: string;
}

export function SimulatedChatMessage({
  system,
  role = "user",
  message,
}: ChatMessageProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const isUser = role === "user";
  const defaultMsg = isUser
    ? "Can you help me build a dashboard?"
    : "Absolutely! I'll generate a layout for you now.";

  return (
    <div
      className={`${prefix}-chat-wrapper ${
        isUser ? `${prefix}-chat-right` : `${prefix}-chat-left`
      }`}
    >
      {!isUser && (
        <div className={`${prefix}-chat-avatar`} aria-hidden="true">AI</div>
      )}
      <div
        className={`${prefix}-chat-bubble ${
          isUser ? `${prefix}-chat-user` : `${prefix}-chat-system`
        }`}
      >
        {message || defaultMsg}
      </div>
      {isUser && (
        <div
          className={`${prefix}-chat-avatar ${prefix}-avatar-user`}
          aria-hidden="true"
        >
          U
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedChart
   ═══════════════════════════════════════════ */

interface ChartProps extends SimProps {
  title?: string;
  dataPoints?: string;
}

export function SimulatedChart({
  system,
  title = "Monthly Revenue",
  dataPoints = "40,70,45,90,65",
}: ChartProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";

  const parsed = dataPoints
    .split(",")
    .map((n) => parseInt(n.trim(), 10))
    .filter((n) => !isNaN(n));
  const safeData = parsed.length > 0 ? parsed : [40, 70, 45, 90, 65];
  const maxVal = Math.max(...safeData) * 1.1;

  return (
    <div className={`${prefix}-chart-container`}>
      <h4 className={`${prefix}-chart-title`}>{title}</h4>
      <div className={`${prefix}-chart-area`}>
        {safeData.map((val, i) => (
          <div key={i} className={`${prefix}-chart-column`}>
            <div
              className={`${prefix}-chart-bar`}
              style={{ height: `${(val / maxVal) * 100}%` }}
              role="presentation"
              aria-label={`Item ${i + 1}: ${val}`}
            />
            <span className={`${prefix}-chart-label`}>Item {i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedRadioGroup
   ═══════════════════════════════════════════ */

interface RadioGroupProps extends SimProps {
  label?: string;
  optionsCsv?: string;
  defaultIndex?: number;
}

export function SimulatedRadioGroup({
  system,
  label = "Select option",
  optionsCsv = "Option A, Option B, Option C",
  defaultIndex = 0,
}: RadioGroupProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const options = optionsCsv.split(",").map((s) => s.trim()).filter(Boolean);
  const [selected, setSelected] = useState(defaultIndex);

  return (
    <fieldset className={`${prefix}-radio-group`}>
      <legend className={`${prefix}-radio-legend`}>{label}</legend>
      {options.map((opt, i) => (
        <label
          key={i}
          className={`${prefix}-radio-item${selected === i ? ` ${prefix}-radio-selected` : ""}`}
          onClick={(e) => { e.preventDefault(); setSelected(i); }}
        >
          <div className={`${prefix}-radio-circle`}>
            {selected === i && <div className={`${prefix}-radio-dot`} />}
          </div>
          <span className={`${prefix}-radio-label`}>{opt}</span>
        </label>
      ))}
    </fieldset>
  );
}

/* ═══════════════════════════════════════════
   SimulatedSlider
   ═══════════════════════════════════════════ */

interface SliderProps extends SimProps {
  label?: string;
  min?: number;
  max?: number;
  value?: number;
}

export function SimulatedSlider({
  system,
  label = "Volume",
  min = 0,
  max = 100,
  value: initialValue = 50,
}: SliderProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [value, setValue] = useState(initialValue);
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={`${prefix}-slider-container`}>
      <div className={`${prefix}-slider-header`}>
        <span className={`${prefix}-slider-label`}>{label}</span>
        <span className={`${prefix}-slider-value`}>{value}</span>
      </div>
      <div className={`${prefix}-slider-track`}>
        <div className={`${prefix}-slider-fill`} style={{ width: `${pct}%` }} />
        <div className={`${prefix}-slider-thumb`} style={{ left: `${pct}%` }} />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className={`${prefix}-slider-input`}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedNumberInput
   ═══════════════════════════════════════════ */

interface NumberInputProps extends SimProps {
  label?: string;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
}

export function SimulatedNumberInput({
  system,
  label = "Quantity",
  value: initialValue = 1,
  min = 0,
  max = 99,
  step = 1,
}: NumberInputProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [value, setValue] = useState(initialValue);

  return (
    <div className={`${prefix}-number-input`}>
      <label className={`${prefix}-number-label`}>{label}</label>
      <div className={`${prefix}-number-controls`}>
        <button className={`${prefix}-number-btn`} onClick={() => setValue((v) => Math.max(min, v - step))} disabled={value <= min}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>remove</span>
        </button>
        <span className={`${prefix}-number-value`}>{value}</span>
        <button className={`${prefix}-number-btn`} onClick={() => setValue((v) => Math.min(max, v + step))} disabled={value >= max}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedMultilineInput
   ═══════════════════════════════════════════ */

interface MultilineInputProps extends SimProps {
  label?: string;
  placeholder?: string;
  rows?: number;
}

export function SimulatedMultilineInput({
  system,
  label = "Description",
  placeholder = "Enter description...",
  rows = 3,
}: MultilineInputProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [value, setValue] = useState("");

  return (
    <div className={`${prefix}-multiline`}>
      <label className={`${prefix}-multiline-label`}>{label}</label>
      <textarea
        className={`${prefix}-multiline-textarea`}
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className={`${prefix}-multiline-footer`}>
        <span className={`${prefix}-multiline-count`}>{value.length} characters</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedPill
   ═══════════════════════════════════════════ */

interface PillProps extends SimProps {
  label?: string;
  status?: "default" | "info" | "success" | "warning" | "error";
  dismissible?: boolean;
}

export function SimulatedPill({
  system,
  label = "Tag",
  status = "default",
  dismissible = true,
}: PillProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <span className={`${prefix}-pill ${prefix}-pill-${status}`}>
      <span className={`${prefix}-pill-text`}>{label}</span>
      {dismissible && (
        <button className={`${prefix}-pill-dismiss`} onClick={() => setDismissed(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>close</span>
        </button>
      )}
    </span>
  );
}

/* ═══════════════════════════════════════════
   SimulatedToggleButton
   ═══════════════════════════════════════════ */

interface ToggleButtonProps extends SimProps {
  label?: string;
  defaultPressed?: boolean;
}

export function SimulatedToggleButton({
  system,
  label = "Bold",
  defaultPressed = false,
}: ToggleButtonProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [pressed, setPressed] = useState(defaultPressed);

  return (
    <button
      className={`${prefix}-toggle-btn${pressed ? ` ${prefix}-toggle-pressed` : ""}`}
      onClick={() => setPressed(!pressed)}
      aria-pressed={pressed}
    >
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════
   SimulatedSegmentedGroup
   ═══════════════════════════════════════════ */

interface SegmentedGroupProps extends SimProps {
  optionsCsv?: string;
  defaultIndex?: number;
}

export function SimulatedSegmentedGroup({
  system,
  optionsCsv = "Day, Week, Month",
  defaultIndex = 0,
}: SegmentedGroupProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const options = optionsCsv.split(",").map((s) => s.trim()).filter(Boolean);
  const [selected, setSelected] = useState(defaultIndex);

  return (
    <div className={`${prefix}-segmented`}>
      {options.map((opt, i) => (
        <button
          key={i}
          className={`${prefix}-segmented-btn${selected === i ? ` ${prefix}-segmented-active` : ""}`}
          onClick={() => setSelected(i)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedLink
   ═══════════════════════════════════════════ */

interface LinkProps extends SimProps {
  text?: string;
  showIcon?: boolean;
}

export function SimulatedLink({
  system,
  text = "Learn more",
  showIcon = true,
}: LinkProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";

  return (
    <span className={`${prefix}-link`}>
      {text}
      {showIcon && (
        <span className="material-symbols-outlined" style={{ fontSize: 14, marginLeft: 2 }}>
          arrow_forward
        </span>
      )}
    </span>
  );
}

/* ═══════════════════════════════════════════
   SimulatedListBox
   ═══════════════════════════════════════════ */

interface ListBoxProps extends SimProps {
  itemsCsv?: string;
  multiSelect?: boolean;
}

export function SimulatedListBox({
  system,
  itemsCsv = "Apple, Banana, Cherry, Date, Elderberry",
  multiSelect = false,
}: ListBoxProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const items = itemsCsv.split(",").map((s) => s.trim()).filter(Boolean);
  const [selected, setSelected] = useState<Set<number>>(new Set([0]));

  const toggle = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (multiSelect) {
        if (next.has(i)) next.delete(i); else next.add(i);
      } else {
        next.clear();
        next.add(i);
      }
      return next;
    });
  };

  return (
    <div className={`${prefix}-listbox`} role="listbox">
      {items.map((item, i) => (
        <div
          key={i}
          role="option"
          aria-selected={selected.has(i)}
          className={`${prefix}-listbox-item${selected.has(i) ? ` ${prefix}-listbox-selected` : ""}`}
          onClick={() => toggle(i)}
        >
          {multiSelect && (
            <div className={`${prefix}-listbox-check`}>
              {selected.has(i) && (
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
              )}
            </div>
          )}
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedComboBox
   ═══════════════════════════════════════════ */

interface ComboBoxProps extends SimProps {
  placeholder?: string;
  itemsCsv?: string;
}

export function SimulatedComboBox({
  system,
  placeholder = "Search...",
  itemsCsv = "United States, United Kingdom, Canada, Australia, Germany",
}: ComboBoxProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const items = itemsCsv.split(",").map((s) => s.trim()).filter(Boolean);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = items.filter((it) => it.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className={`${prefix}-combobox`}>
      <div className={`${prefix}-combobox-input-wrap`}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, opacity: 0.4 }}>search</span>
        <input
          className={`${prefix}-combobox-input`}
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {query && (
          <button className={`${prefix}-combobox-clear`} onClick={() => { setQuery(""); setOpen(false); }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className={`${prefix}-combobox-dropdown`}>
          {filtered.map((item, i) => (
            <div
              key={i}
              className={`${prefix}-combobox-option`}
              onClick={() => { setQuery(item); setOpen(false); }}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedFileDropZone
   ═══════════════════════════════════════════ */

interface FileDropZoneProps extends SimProps {
  label?: string;
  acceptTypes?: string;
}

export function SimulatedFileDropZone({
  system,
  label = "Drag & drop files here",
  acceptTypes = ".png, .jpg, .pdf",
}: FileDropZoneProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={`${prefix}-file-drop${dragOver ? ` ${prefix}-file-drop-active` : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 32, opacity: 0.3 }}>
        cloud_upload
      </span>
      <span className={`${prefix}-file-drop-label`}>{label}</span>
      <span className={`${prefix}-file-drop-hint`}>Accepted: {acceptTypes}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedTree
   ═══════════════════════════════════════════ */

interface TreeProps extends SimProps {
  itemsCsv?: string;
}

export function SimulatedTree({
  system,
  itemsCsv = "Documents > Work > Reports, Documents > Personal, Images > Vacation, Images > Family",
}: TreeProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["Documents", "Images"]));

  /* Parse tree from CSV format: "Parent > Child > Grandchild" */
  const nodes = useMemo(() => {
    const map: Record<string, string[]> = {};
    itemsCsv.split(",").map(s => s.trim()).forEach(path => {
      const parts = path.split(">").map(s => s.trim());
      for (let i = 0; i < parts.length - 1; i++) {
        if (!map[parts[i]]) map[parts[i]] = [];
        if (!map[parts[i]].includes(parts[i + 1])) map[parts[i]].push(parts[i + 1]);
      }
      const leaf = parts[parts.length - 1];
      if (!map[leaf]) map[leaf] = [];
    });
    return map;
  }, [itemsCsv]);

  const roots = Object.keys(nodes).filter(k => !Object.values(nodes).some(children => children.includes(k)));

  function TreeNode({ name, depth }: { name: string; depth: number }) {
    const children = nodes[name] || [];
    const hasChildren = children.length > 0;
    const isExpanded = expanded.has(name);

    return (
      <>
        <div
          className={`${prefix}-tree-item`}
          style={{ paddingLeft: depth * 20 }}
          onClick={() => {
            if (hasChildren) {
              setExpanded(prev => {
                const next = new Set(prev);
                if (next.has(name)) next.delete(name); else next.add(name);
                return next;
              });
            }
          }}
        >
          {hasChildren ? (
            <span className="material-symbols-outlined" style={{ fontSize: 14, transition: "transform 0.15s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>
              chevron_right
            </span>
          ) : (
            <span style={{ width: 14, display: "inline-block" }} />
          )}
          <span className="material-symbols-outlined" style={{ fontSize: 16, opacity: 0.5 }}>
            {hasChildren ? "folder" : "description"}
          </span>
          <span className={`${prefix}-tree-label`}>{name}</span>
        </div>
        {isExpanded && children.map(child => (
          <TreeNode key={child} name={child} depth={depth + 1} />
        ))}
      </>
    );
  }

  return (
    <div className={`${prefix}-tree`} role="tree">
      {roots.map(root => <TreeNode key={root} name={root} depth={0} />)}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedRating
   ═══════════════════════════════════════════ */

interface RatingProps extends SimProps {
  max?: number;
  value?: number;
  label?: string;
}

export function SimulatedRating({
  system,
  max = 5,
  value: initialValue = 3,
  label = "Rating",
}: RatingProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [value, setValue] = useState(initialValue);
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className={`${prefix}-rating`}>
      <span className={`${prefix}-rating-label`}>{label}</span>
      <div className={`${prefix}-rating-stars`}>
        {Array.from({ length: max }, (_, i) => {
          const filled = (hover !== null ? hover : value) >= i + 1;
          return (
            <button
              key={i}
              className={`${prefix}-rating-star${filled ? ` ${prefix}-rating-filled` : ""}`}
              onClick={() => setValue(i + 1)}
              onMouseEnter={() => setHover(i + 1)}
              onMouseLeave={() => setHover(null)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                {filled ? "star" : "star_border"}
              </span>
            </button>
          );
        })}
      </div>
      <span className={`${prefix}-rating-value`}>{value}/{max}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedSkeleton
   ═══════════════════════════════════════════ */

interface SkeletonProps extends SimProps {
  variant?: "text" | "card" | "avatar";
}

export function SimulatedSkeleton({
  system,
  variant = "card",
}: SkeletonProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";

  if (variant === "avatar") {
    return (
      <div className={`${prefix}-skeleton-row`}>
        <div className={`${prefix}-skeleton ${prefix}-skeleton-circle`} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div className={`${prefix}-skeleton ${prefix}-skeleton-text`} style={{ width: "60%" }} />
          <div className={`${prefix}-skeleton ${prefix}-skeleton-text`} style={{ width: "40%" }} />
        </div>
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div className={`${prefix}-skeleton ${prefix}-skeleton-text`} style={{ width: "100%" }} />
        <div className={`${prefix}-skeleton ${prefix}-skeleton-text`} style={{ width: "85%" }} />
        <div className={`${prefix}-skeleton ${prefix}-skeleton-text`} style={{ width: "70%" }} />
      </div>
    );
  }

  return (
    <div className={`${prefix}-skeleton-card`}>
      <div className={`${prefix}-skeleton ${prefix}-skeleton-rect`} />
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <div className={`${prefix}-skeleton ${prefix}-skeleton-text`} style={{ width: "70%" }} />
        <div className={`${prefix}-skeleton ${prefix}-skeleton-text`} style={{ width: "50%" }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedSearchbox
   ═══════════════════════════════════════════ */

interface SearchboxProps extends SimProps {
  placeholder?: string;
}

export function SimulatedSearchbox({
  system,
  placeholder = "Search...",
}: SearchboxProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [query, setQuery] = useState("");

  return (
    <div className={`${prefix}-searchbox`}>
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>search</span>
      <input
        className={`${prefix}-searchbox-input`}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query && (
        <button className={`${prefix}-searchbox-clear`} onClick={() => setQuery("")}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedTokenizedInput
   ═══════════════════════════════════════════ */

interface TokenizedInputProps extends SimProps {
  label?: string;
  tokensCsv?: string;
}

export function SimulatedTokenizedInput({
  system,
  label = "Recipients",
  tokensCsv = "alice@co.com, bob@co.com",
}: TokenizedInputProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [tokens, setTokens] = useState(tokensCsv.split(",").map(s => s.trim()).filter(Boolean));
  const [input, setInput] = useState("");

  const addToken = () => {
    if (input.trim()) {
      setTokens([...tokens, input.trim()]);
      setInput("");
    }
  };

  return (
    <div className={`${prefix}-tokenized`}>
      <label className={`${prefix}-tokenized-label`}>{label}</label>
      <div className={`${prefix}-tokenized-field`}>
        {tokens.map((t, i) => (
          <span key={i} className={`${prefix}-tokenized-chip`}>
            {t}
            <button onClick={() => setTokens(tokens.filter((_, j) => j !== i))} className={`${prefix}-tokenized-remove`}>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>close</span>
            </button>
          </span>
        ))}
        <input
          className={`${prefix}-tokenized-input`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addToken(); } }}
          placeholder={tokens.length === 0 ? "Type and press Enter..." : ""}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedNavDrawer
   ═══════════════════════════════════════════ */

interface NavDrawerProps extends SimProps {
  itemsCsv?: string;
}

export function SimulatedNavDrawer({
  system,
  itemsCsv = "Home, Dashboard, Settings, Profile, Help",
}: NavDrawerProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const items = itemsCsv.split(",").map(s => s.trim()).filter(Boolean);
  const [active, setActive] = useState(0);
  const icons = ["home", "dashboard", "settings", "person", "help"];

  return (
    <div className={`${prefix}-nav-drawer`}>
      {items.map((item, i) => (
        <button
          key={i}
          className={`${prefix}-nav-drawer-item${active === i ? ` ${prefix}-nav-drawer-active` : ""}`}
          onClick={() => setActive(i)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icons[i % icons.length]}</span>
          <span>{item}</span>
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedPopover
   ═══════════════════════════════════════════ */

interface PopoverProps extends SimProps {
  title?: string;
  content?: string;
}

export function SimulatedPopover({
  system,
  title = "Popover Title",
  content = "This is additional information displayed in a popover.",
}: PopoverProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const [open, setOpen] = useState(false);

  return (
    <div className={`${prefix}-popover-wrapper`}>
      <button className={`${prefix}-popover-trigger`} onClick={() => setOpen(!open)}>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>info</span>
        Show Popover
      </button>
      {open && (
        <div className={`${prefix}-popover`}>
          <div className={`${prefix}-popover-header`}>
            <span className={`${prefix}-popover-title`}>{title}</span>
            <button className={`${prefix}-popover-close`} onClick={() => setOpen(false)}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
            </button>
          </div>
          <div className={`${prefix}-popover-body`}>{content}</div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedPersona
   ═══════════════════════════════════════════ */

interface PersonaProps extends SimProps {
  name?: string;
  role?: string;
  presence?: "available" | "busy" | "away" | "offline";
}

export function SimulatedPersona({
  system,
  name = "Jane Doe",
  role = "Senior Designer",
  presence = "available",
}: PersonaProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const presenceColors: Record<string, string> = {
    available: "var(--ds-status-positive, #22c55e)",
    busy: "var(--ds-status-negative, #ef4444)",
    away: "var(--ds-status-warning, #f59e0b)",
    offline: "var(--ds-fg-tertiary, #9ca3af)",
  };

  return (
    <div className={`${prefix}-persona`}>
      <div className={`${prefix}-persona-avatar`}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{name.split(" ").map(n => n[0]).join("")}</span>
        <span className={`${prefix}-persona-presence`} style={{ background: presenceColors[presence] }} />
      </div>
      <div className={`${prefix}-persona-info`}>
        <span className={`${prefix}-persona-name`}>{name}</span>
        <span className={`${prefix}-persona-role`}>{role}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SimulatedAvatarGroup
   ═══════════════════════════════════════════ */

interface AvatarGroupProps extends SimProps {
  namesCsv?: string;
  max?: number;
}

export function SimulatedAvatarGroup({
  system,
  namesCsv = "AB, CD, EF, GH, IJ, KL",
  max = 4,
}: AvatarGroupProps) {
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const names = namesCsv.split(",").map(s => s.trim()).filter(Boolean);
  const visible = names.slice(0, max);
  const overflow = names.length - max;

  return (
    <div className={`${prefix}-avatar-group`}>
      {visible.map((name, i) => (
        <div key={i} className={`${prefix}-avatar-group-item`} style={{ zIndex: visible.length - i }}>
          <span>{name}</span>
        </div>
      ))}
      {overflow > 0 && (
        <div className={`${prefix}-avatar-group-item ${prefix}-avatar-group-overflow`} style={{ zIndex: 0 }}>
          +{overflow}
        </div>
      )}
    </div>
  );
}
