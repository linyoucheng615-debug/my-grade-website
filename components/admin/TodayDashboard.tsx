"use client";

import React from "react";
import { AlertTriangle, Calendar as CalendarIcon, Check, TrendingUp } from "lucide-react";
import type { AdminTheme } from "./adminTheme";
import { getCommonStyles, getEventColor } from "./adminTheme";
import { formatDateTime } from "@/lib/dateUtils";

interface TodayDashboardProps {
  isMobile: boolean;
  theme: AdminTheme;
  isDarkMode: boolean;
  todayEvents: any[];
  dashboardMissingLogs: any[];
  recentRedeems: any[];
  dashboardLowGrades: any[];
}

export function TodayDashboard({
  isMobile,
  theme,
  isDarkMode,
  todayEvents,
  dashboardMissingLogs,
  recentRedeems,
  dashboardLowGrades,
}: TodayDashboardProps) {
  const { solidCardStyle } = getCommonStyles(theme);

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "20px",
        }}
      >
        {/* 今日排程 */}
        <div style={solidCardStyle}>
          <h3
            style={{
              margin: "0 0 15px 0",
              color: theme.primary,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CalendarIcon size={20} /> 📌 今日排程
          </h3>
          {todayEvents.filter((e) => !e.isCancelled).length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {todayEvents
                .filter((e) => !e.isCancelled)
                .map((ev, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "12px",
                      background: theme.inputBg,
                      borderRadius: "12px",
                      borderLeft: `4px solid ${getEventColor(ev, isDarkMode, theme.primary)}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "bold", color: theme.textMain }}>
                        {ev.title}
                      </div>
                      <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>
                        對象: {ev.student_name}
                      </div>
                    </div>
                    {ev.start_time && (
                      <div style={{ fontSize: "13px", fontWeight: "bold", color: theme.textMain }}>
                        {ev.start_time}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div
              style={{
                color: theme.textMuted,
                fontSize: "14px",
                textAlign: "center",
                padding: "20px",
                background: theme.inputBg,
                borderRadius: "12px",
                border: `1px dashed ${theme.border}`,
              }}
            >
              今日無排定行程 🎉
            </div>
          )}
        </div>

        {/* 待補進度提醒 */}
        <div style={solidCardStyle}>
          <h3
            style={{
              margin: "0 0 15px 0",
              color: "#f59e0b",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertTriangle size={20} /> 📝 待補進度提醒 (近7日)
          </h3>
          {dashboardMissingLogs.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {dashboardMissingLogs.map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px",
                    background: theme.inputBg,
                    borderRadius: "12px",
                    borderLeft: `4px solid #f59e0b`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: theme.textMain }}>
                      {log.title}
                    </div>
                    <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>
                      對象: {log.student_name}
                    </div>
                  </div>
                  <div style={{ fontSize: "12px", color: theme.danger, fontWeight: "bold" }}>
                    {log.date}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                color: theme.textMuted,
                fontSize: "14px",
                textAlign: "center",
                padding: "20px",
                background: theme.inputBg,
                borderRadius: "12px",
                border: `1px dashed ${theme.border}`,
              }}
            >
              所有紀錄皆已填寫完畢 ✅
            </div>
          )}
        </div>

        {/* 最新核銷通知 */}
        <div style={solidCardStyle}>
          <h3
            style={{
              margin: "0 0 15px 0",
              color: theme.success,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Check size={20} /> 🔔 最新核銷通知
          </h3>
          {recentRedeems.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentRedeems.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px",
                    background: theme.inputBg,
                    borderRadius: "12px",
                    border: `1px solid ${theme.success}`,
                  }}
                >
                  <div style={{ fontSize: "14px", color: theme.textMain }}>
                    <b>{r.student_name}</b> 使用了 <b>{r.reward_title}</b>
                  </div>
                  <div style={{ fontSize: "11px", color: theme.textMuted, marginTop: "4px" }}>
                    使用時間: {formatDateTime(r.used_at)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                color: theme.textMuted,
                fontSize: "14px",
                textAlign: "center",
                padding: "20px",
              }}
            >
              暫無學生核銷獎勵
            </div>
          )}
        </div>

        {/* 近期低分預警 */}
        <div style={solidCardStyle}>
          <h3
            style={{
              margin: "0 0 15px 0",
              color: theme.danger,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <TrendingUp size={20} style={{ transform: "scaleY(-1)" }} /> ⚠️ 近期低分預警 (&lt;60分)
          </h3>
          {dashboardLowGrades.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {dashboardLowGrades.map((g, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px",
                    background: theme.inputBg,
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: theme.textMain }}>
                      {g.student_name} - {g.subject}
                    </div>
                    <div style={{ fontSize: "12px", color: theme.textMuted }}>{g.unit}</div>
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: theme.danger }}>
                    {g.score}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                color: theme.textMuted,
                fontSize: "14px",
                textAlign: "center",
                padding: "20px",
              }}
            >
              近期無低分紀錄 🎊
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

