import React from "react";
import { SUBJECTS, SUBJECT_COLORS as COLORS } from "@/lib/constants";

export interface AdminTheme {
  bg: string;
  bodyBg: string;
  card: string;
  activeControl: string;
  inputBg: string;
  textMain: string;
  textMuted: string;
  border: string;
  primary: string;
  danger: string;
  success: string;
  shadow: string;
  navBg: string;
}

export function getAdminTheme(isDarkMode: boolean): AdminTheme {
  return {
    bg: isDarkMode
      ? "linear-gradient(135deg, #0f172a 0%, #020617 100%)"
      : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    bodyBg: isDarkMode ? "#020617" : "#f1f5f9",
    card: isDarkMode ? "#1e293b" : "#ffffff",
    activeControl: isDarkMode ? "#0f172a" : "#ffffff",
    inputBg: isDarkMode ? "rgba(15, 23, 42, 0.6)" : "rgba(241, 245, 249, 0.6)",
    textMain: isDarkMode ? "#f8fafc" : "#1e293b",
    textMuted: isDarkMode ? "#94a3b8" : "#64748b",
    border: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
    primary: isDarkMode ? "#38bdf8" : "#0ea5e9",
    danger: isDarkMode ? "#f87171" : "#ef4444",
    success: isDarkMode ? "#34d399" : "#10b981",
    shadow: isDarkMode ? "0 10px 40px rgba(0,0,0,0.5)" : "0 8px 25px rgba(14, 165, 233, 0.08)",
    navBg: isDarkMode ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.85)",
  };
}

export function getCommonStyles(theme: AdminTheme) {
  const cardStyle: React.CSSProperties = {
    background: theme.card,
    padding: "20px",
    borderRadius: "20px",
    border: `1px solid ${theme.border}`,
    boxShadow: theme.shadow,
    marginBottom: "25px",
    transition: "0.3s ease",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    margin: "6px 0",
    borderRadius: "10px",
    border: `1px solid ${theme.border}`,
    background: theme.inputBg,
    color: theme.textMain,
    boxSizing: "border-box",
    transition: "0.2s",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
  };

  const solidCardStyle: React.CSSProperties = {
    background: theme.activeControl,
    padding: "25px",
    borderRadius: "20px",
    border: `1px solid ${theme.border}`,
    boxShadow: theme.shadow,
    marginBottom: "25px",
    transition: "0.3s ease",
  };

  const btnStyle = (color: string): React.CSSProperties => ({
    background: color,
    color: "#ffffff",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    cursor: "pointer",
    width: "100%",
    marginTop: "10px",
    fontWeight: "bold",
    transition: "0.2s",
  });

  const filterBtnStyle = (active: boolean, colorStr: string = theme.textMain): React.CSSProperties => ({
    padding: "8px 16px",
    borderRadius: "20px",
    border: active ? `1px solid ${colorStr}` : `1px solid ${theme.border}`,
    background: active ? colorStr : theme.activeControl,
    color: active ? "#ffffff" : theme.textMuted,
    fontSize: "13px",
    fontWeight: "bold",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "0.2s",
  });

  return {
    cardStyle,
    inputStyle,
    selectStyle,
    solidCardStyle,
    btnStyle,
    filterBtnStyle,
  };
}

export function getEventColor(ev: any, isDarkMode: boolean, primaryColor: string) {
  if (ev.isCancelled || ev.type === "cancellation") {
    return isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
  }
  if (ev.type === "exam") return "#be123c";
  if (ev.type === "activity") return "#0891b2";

  if (ev.title) {
    for (const sub of SUBJECTS) {
      if (ev.title.includes(sub)) return COLORS[sub];
    }
  }
  return primaryColor;
}

