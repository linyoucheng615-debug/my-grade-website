"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SUBJECTS } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";
import type { AdminTheme } from "./adminTheme";
import { getCommonStyles } from "./adminTheme";

interface CoursePlannerSectionProps {
  isMobile?: boolean;
  theme: AdminTheme;
  selectedName: string;
}

export function CoursePlannerSection({
  isMobile,
  theme,
  selectedName,
}: CoursePlannerSectionProps) {
  const { showToast } = useToast();
  const { solidCardStyle, inputStyle, selectStyle, btnStyle } = getCommonStyles(theme);

  const [isMobileView, setIsMobileView] = useState<boolean>(isMobile ?? false);
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [plannerSubject, setPlannerSubject] = useState<string>("數學");
  const [plannerRows, setPlannerRows] = useState<any[]>([]);
  const [plannerTargetExam, setPlannerTargetExam] = useState<string>("");
  const [plannerLoading, setPlannerLoading] = useState<boolean>(false);

  const loadCoursePlanSchedule = async (studentName: string, subjectName: string) => {
    if (!studentName) return;
    setPlannerLoading(true);

    // 1. 抓取該學生與全體的行事曆事件
    const { data: events, error } = await supabase
      .from("calendar_events")
      .select("*")
      .or(`student_name.eq.${studentName},student_name.eq.全體`)
      .order("event_date", { ascending: true });

    if (error || !events) {
      setPlannerLoading(false);
      return;
    }

    // 2. 僅尋找「未來」的最近段考目標（避免鎖定過去舊段考）
    const todayStr = new Date().toLocaleDateString("en-CA");
    const nextExam = events.find(
      (e: any) =>
        (e.type === "exam" ||
          e.title?.includes("段考") ||
          e.title?.includes("模考") ||
          e.title?.includes("會考") ||
          e.title?.includes("期中") ||
          e.title?.includes("期末") ||
          e.title?.includes("大考")) &&
        e.event_date >= todayStr
    );

    const targetExamDate = nextExam ? nextExam.event_date : null;
    setPlannerTargetExam(
      nextExam
        ? `${nextExam.event_date} ${nextExam.title}`
        : "尚未設定段考目標（預設推算90天）"
    );

    const classDates: { date: string; eventId: number }[] = [];
    const maxScanDays = 90;

    // 比對時間標準化至本地 00:00:00
    let curr = new Date();
    curr.setHours(0, 0, 0, 0);

    // ★ 段考前規劃：課堂進度推算到「段考日前一天」為止（段考當天為考試日，不排課堂進度）
    const scanLimitDate = targetExamDate
      ? new Date(`${targetExamDate}T00:00:00`)
      : new Date(Date.now() + maxScanDays * 86400000);

    while (curr < scanLimitDate) {
      const dStr = curr.toLocaleDateString("en-CA");
      const dayOfWeek = curr.getDay();

      for (const ev of events) {
        // ★ 嚴格排除任何段考、模考與測驗事件（避免因 type 誤設導致考試日被當成上課日）
        const isExam =
          ev.type === "exam" ||
          ev.title?.includes("段考") ||
          ev.title?.includes("模考") ||
          ev.title?.includes("會考") ||
          ev.title?.includes("期中") ||
          ev.title?.includes("期末") ||
          ev.title?.includes("大考");
        if (isExam) continue;

        if (ev.type !== "class" && ev.type !== undefined) continue;
        if (ev.student_name !== studentName && ev.student_name !== "全體") continue;
        if (
          ev.cancelled_dates &&
          Array.isArray(ev.cancelled_dates) &&
          ev.cancelled_dates.includes(dStr)
        )
          continue;

        // ★ 防跨科混淆：若標題明確標註為「其他學科」，則不排入本科進度表
        const isOtherSubject = SUBJECTS.some(
          (sub) => sub !== subjectName && ev.title?.includes(sub)
        );
        if (isOtherSubject) continue;

        if (!ev.is_recurring) {
          if (
            ev.event_date === dStr ||
            (ev.end_date && dStr >= ev.event_date && dStr <= ev.end_date)
          ) {
            classDates.push({ date: dStr, eventId: ev.id });
          }
        } else if (ev.is_recurring && ev.recurring_pattern === "weekly") {
          if (
            dStr >= ev.event_date &&
            (!ev.recurring_end_date || dStr <= ev.recurring_end_date)
          ) {
            const startDay = new Date(`${ev.event_date}T00:00:00`).getDay();
            if (dayOfWeek === startDay) {
              classDates.push({ date: dStr, eventId: ev.id });
            }
          }
        }
      }
      curr.setDate(curr.getDate() + 1);
    }

    // 3. 撈取已儲存的預排進度
    const { data: existingPlans } = await supabase
      .from("course_plans")
      .select("*")
      .eq("student_name", studentName)
      .eq("subject", subjectName);

    // 4. 組合堂數清單
    const rows = classDates.map((item, idx) => {
      const matched = existingPlans?.find(
        (p: any) =>
          p.planned_date === item.date &&
          (p.calendar_event_id === item.eventId || !p.calendar_event_id)
      );
      return {
        sessionIndex: idx + 1,
        calendarEventId: item.eventId,
        date: item.date,
        planId: matched?.id || null,
        plannedContent: matched?.planned_content || "",
        actualContent: matched?.actual_content || "",
        status: matched?.status || "pending",
      };
    });

    setPlannerRows(rows);
    setPlannerLoading(false);
  };

  useEffect(() => {
    if (selectedName) {
      loadCoursePlanSchedule(selectedName, plannerSubject);
    }
  }, [selectedName, plannerSubject]);

  // ★ 優化：改為單次 Batch Upsert 批次儲存，並自動清理過期或無效日期的舊進度
  const handleSaveAllPlans = async () => {
    if (!selectedName) return showToast("請先選擇學生！", "warning");
    setPlannerLoading(true);

    const rowsPayload = plannerRows.map((item) => {
      const rowPayload: any = {
        student_name: selectedName,
        subject: plannerSubject,
        calendar_event_id: item.calendarEventId,
        planned_date: item.date,
        planned_content: item.plannedContent,
        status: item.status,
      };
      if (item.planId) rowPayload.id = item.planId;
      return rowPayload;
    });

    const { error } = await supabase.from("course_plans").upsert(rowsPayload);

    // 同步清理已不在現行排程中的舊孤立紀錄（如已改期、取消或誤排入段考日者）
    const validDates = new Set(plannerRows.map((r) => r.date));
    const { data: currentDbPlans } = await supabase
      .from("course_plans")
      .select("id, planned_date")
      .eq("student_name", selectedName)
      .eq("subject", plannerSubject);

    if (currentDbPlans && currentDbPlans.length > 0) {
      const obsoleteIds = currentDbPlans
        .filter((p) => !validDates.has(p.planned_date))
        .map((p) => p.id);
      if (obsoleteIds.length > 0) {
        await supabase.from("course_plans").delete().in("id", obsoleteIds);
      }
    }

    setPlannerLoading(false);

    if (error) {
      showToast("儲存失敗：" + error.message, "error");
    } else {
      showToast("✅ 進度規劃表已成功批次儲存！", "success");
      loadCoursePlanSchedule(selectedName, plannerSubject);
    }
  };

  return (
    <div style={solidCardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobileView ? "stretch" : "center",
          flexDirection: isMobileView ? "column" : "row",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h3
            style={{
              color: theme.textMain,
              margin: "0 0 6px 0",
              fontWeight: "900",
              fontSize: isMobileView ? "18px" : "20px",
            }}
          >
            📅 {selectedName} - 段考進度規劃
          </h3>
          <span
            style={{
              fontSize: "13px",
              color: theme.primary,
              background: `${theme.primary}15`,
              padding: "4px 10px",
              borderRadius: "8px",
              fontWeight: "bold",
              display: "inline-block",
            }}
          >
            🎯 目標：{plannerTargetExam} (共 {plannerRows.length} 堂課)
          </span>
        </div>
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            width: isMobileView ? "100%" : "auto",
          }}
        >
          <select
            value={plannerSubject}
            onChange={(e) => setPlannerSubject(e.target.value)}
            style={{
              ...selectStyle,
              flex: isMobileView ? 1 : "none",
              width: isMobileView ? "100%" : "auto",
              margin: 0,
              padding: "8px 12px",
              fontWeight: "bold",
            }}
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={handleSaveAllPlans}
            disabled={plannerLoading}
            style={{
              ...btnStyle(theme.primary),
              flex: isMobileView ? 1 : "none",
              width: isMobileView ? "100%" : "auto",
              margin: 0,
              padding: "8px 18px",
              whiteSpace: "nowrap",
            }}
          >
            {plannerLoading ? "儲存中..." : "💾 儲存進度表"}
          </button>
        </div>
      </div>

      {plannerRows.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "35px 20px",
            color: theme.textMuted,
            background: theme.inputBg,
            borderRadius: "14px",
            border: `1px dashed ${theme.border}`,
            fontSize: "14px",
          }}
        >
          目前至下次段考前沒有排定任何課堂，請先至「行事曆」排定課表或段考日期 ✨
        </div>
      ) : isMobileView ? (
        /* 手機版：卡片式流暢排版，輸入框滿版好填寫，絕不跑版 */
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {plannerRows.map((row, idx) => (
            <div
              key={idx}
              style={{
                background: theme.inputBg,
                border: `1px solid ${theme.border}`,
                borderRadius: "14px",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {/* 卡片標頭：堂數、日期與吻合狀態 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      background: `${theme.primary}20`,
                      color: theme.primary,
                      fontSize: "12px",
                      fontWeight: "900",
                      padding: "3px 8px",
                      borderRadius: "8px",
                    }}
                  >
                    第 {row.sessionIndex} 堂
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: theme.textMain }}>
                    📅 {row.date}
                  </span>
                </div>
                <div>
                  {row.status === "on_track" && (
                    <span
                      style={{
                        color: theme.success,
                        fontWeight: "bold",
                        fontSize: "12px",
                        background: `${theme.success}15`,
                        padding: "3px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      🟢 吻合
                    </span>
                  )}
                  {row.status === "modified" && (
                    <span
                      style={{
                        color: "#f59e0b",
                        fontWeight: "bold",
                        fontSize: "12px",
                        background: "rgba(245,158,11,0.15)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      🟡 微調
                    </span>
                  )}
                  {row.status === "pending" && (
                    <span
                      style={{
                        color: theme.textMuted,
                        fontSize: "12px",
                        background: theme.card,
                        padding: "3px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      ⏳ 待上課
                    </span>
                  )}
                </div>
              </div>

              {/* 預計進度輸入框 */}
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: theme.textMuted,
                    marginBottom: "5px",
                    display: "block",
                    fontWeight: "bold",
                  }}
                >
                  預計進度（老師安排）：
                </label>
                <input
                  type="text"
                  value={row.plannedContent}
                  onChange={(e) => {
                    const updated = [...plannerRows];
                    updated[idx].plannedContent = e.target.value;
                    setPlannerRows(updated);
                  }}
                  placeholder="例：1-1 數列與極限"
                  style={{
                    ...inputStyle,
                    width: "100%",
                    margin: 0,
                    padding: "10px 12px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* 實際進度比對 */}
              <div
                style={{
                  fontSize: "12px",
                  color: theme.textMuted,
                  background: theme.card,
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: `1px solid ${theme.border}`,
                  display: "flex",
                  gap: "6px",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>實際進度：</span>
                <span
                  style={{
                    color: row.actualContent ? theme.textMain : theme.textMuted,
                    fontStyle: row.actualContent ? "normal" : "italic",
                    wordBreak: "break-word",
                  }}
                >
                  {row.actualContent || "(尚未登記日誌)"}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 電腦版：經典表格，設置 minWidth 確保橫向捲動安全 */
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: "680px",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: `2px solid ${theme.border}`, color: theme.textMuted }}>
                <th style={{ padding: "10px", width: "80px" }}>堂數</th>
                <th style={{ padding: "10px", width: "120px" }}>上課日期</th>
                <th style={{ padding: "10px" }}>預計進度 (老師安排)</th>
                <th style={{ padding: "10px" }}>實際進度 (自動比對)</th>
                <th style={{ padding: "10px", width: "90px" }}>狀態</th>
              </tr>
            </thead>
            <tbody>
              {plannerRows.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td style={{ padding: "12px 10px", fontWeight: "bold", color: theme.textMain }}>
                    第 {row.sessionIndex} 堂
                  </td>
                  <td style={{ padding: "12px 10px", color: theme.textMuted }}>{row.date}</td>
                  <td style={{ padding: "12px 10px" }}>
                    <input
                      type="text"
                      value={row.plannedContent}
                      onChange={(e) => {
                        const updated = [...plannerRows];
                        updated[idx].plannedContent = e.target.value;
                        setPlannerRows(updated);
                      }}
                      placeholder="例：1-1 數列與極限"
                      style={{
                        ...inputStyle,
                        margin: 0,
                        padding: "8px 12px",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    />
                  </td>
                  <td
                    style={{
                      padding: "12px 10px",
                      color: theme.textMuted,
                      fontStyle: row.actualContent ? "normal" : "italic",
                    }}
                  >
                    {row.actualContent || "(尚未登記日誌)"}
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    {row.status === "on_track" && (
                      <span style={{ color: theme.success, fontWeight: "bold" }}>🟢 吻合</span>
                    )}
                    {row.status === "modified" && (
                      <span style={{ color: "#f59e0b", fontWeight: "bold" }}>🟡 微調</span>
                    )}
                    {row.status === "pending" && (
                      <span style={{ color: theme.textMuted }}>待上課</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

