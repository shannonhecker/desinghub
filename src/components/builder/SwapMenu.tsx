"use client";

import React from "react";

export interface BlockTypeOption {
  type: string;
  icon: string;
  label: string;
}

export const BLOCK_TYPES: BlockTypeOption[] = [
  { type: "Alert", icon: "warning", label: "Alert Banner" },
  { type: "DataTable", icon: "table_chart", label: "Data Table" },
  { type: "FormFields", icon: "text_fields", label: "Form Fields" },
  { type: "Buttons", icon: "smart_button", label: "Buttons" },
  { type: "Cards", icon: "dashboard", label: "Cards" },
  { type: "Tabs", icon: "tab", label: "Tabs" },
  { type: "Toggles", icon: "toggle_on", label: "Toggles" },
  { type: "Badges", icon: "new_releases", label: "Badges" },
  { type: "Avatars", icon: "group", label: "Avatars" },
  { type: "Progress", icon: "downloading", label: "Progress Bar" },
  { type: "Tooltips", icon: "info", label: "Tooltips" },
  { type: "StatsCards", icon: "analytics", label: "Stats Cards" },
  { type: "Dropdown", icon: "arrow_drop_down_circle", label: "Dropdown" },
  { type: "DatePicker", icon: "calendar_today", label: "Date Picker" },
  { type: "Dialog", icon: "open_in_new", label: "Dialog" },
];

interface SwapMenuProps {
  onSelect: (type: string) => void;
  onClose: () => void;
}

export function SwapMenu({ onSelect, onClose }: SwapMenuProps) {
  return (
    <>
      {/* Backdrop to close on outside click */}
      <div className="swap-menu-backdrop" onClick={onClose} />

      {/* Menu */}
      <div className="swap-menu">
        {BLOCK_TYPES.map((item) => (
          <button
            key={item.type}
            className="swap-menu-item"
            onClick={() => {
              onSelect(item.type);
              onClose();
            }}
            type="button"
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}
