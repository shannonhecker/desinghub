"use client";

import React from "react";

export function ModeIndicator({ value, customColor, border }: { value: string; customColor: string; border: string }) {
  if (value === "custom") return (
    <span style={{ width: 14, height: 14, borderRadius: "50%", background: customColor, flexShrink: 0, border: `1px solid ${border}`, display: "inline-block" }} />
  );
  const isDark = value.startsWith("dark");
  return (
    <span style={{
      width: 14, height: 14, borderRadius: "50%", flexShrink: 0, display: "inline-block",
      background: isDark
        ? "linear-gradient(90deg, #1c1b1f 50%, #e6e0e9 50%)"
        : "linear-gradient(90deg, #e6e0e9 50%, #1c1b1f 50%)",
      border: `1px solid ${border}`,
    }} />
  );
}
