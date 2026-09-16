"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SUBJECTS } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";
import type { AdminTheme } from "./adminTheme";
import { getCommonStyles } from "./adminTheme";

interface CoursePlannerSectionProps {
  theme: AdminTheme;
  selectedName: string;
}

export function CoursePlannerSection({
  theme,
  selectedName,
}: CoursePlannerSectionProps) {
  const { showToast } = useToast();
  const { solidCardStyle, inputStyle, selectStyle, btnStyle } = getCommonStyles(theme);

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
        (e.type === "exam" || e.title?.includes("段考") || e.title?.includes("模考")) &&
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

    // 比對時間標準化至本地 00:00:00 與 23:59:59
    let curr = new Date();
    curr.setHours(0, 0, 0, 0);

    const scanLimitDate = targetExamDate
      ? new Date(`${targetExamDate}T23:59:59`)
      : new Date(Date.now() + maxScanDays * 86400000);
    scanLimitDate.setHours(23, 59, 59, 999);

    while (curr <= scanLimitDate) {
      const dStr = curr.toLocaleDateString("en-CA");
      const dayOfWeek = curr.getDay();

      for (const ev of events) {
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

  // ★ 優化：改為單次 Batch Upsert 批次儲存
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
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h3 style={{ color: theme.textMain, margin: "0 0 6px 0", fontWeight: "900" }}>
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
            }}
          >
            🎯 目標：{plannerTargetExam} (共 {plannerRows.length} 堂課)
          </span>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={plannerSubject}
            onChange={(e) => setPlannerSubject(e.target.value)}
            style={{ ...selectStyle, width: "auto", margin: 0, padding: "8px 12px" }}
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
              width: "auto",
              margin: 0,
              padding: "8px 18px",
              whiteSpace: "nowrap",
            }}
          >
            {plannerLoading ? "儲存中..." : "💾 儲存進度表"}
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "14px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: `2px solid ${theme.border}`, color: theme.textMuted }}>
              <th style={{ padding: "10px", width: "70px" }}>堂數</th>
              <th style={{ padding: "10px", width: "110px" }}>上課日期</th>
              <th style={{ padding: "10px" }}>預計進度 (老師安排)</th>
              <th style={{ padding: "10px" }}>實際進度 (自動比對)</th>
              <th style={{ padding: "10px", width: "90px" }}>狀態</th>
            </tr>
          </thead>
          <tbody>
            {plannerRows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: "center", padding: "30px", color: theme.textMuted }}
                >
                  目前至下次段考前沒有排定任何課堂，請先至「行事曆」排定課表或段考日期 ✨
                </td>
              </tr>
            ) : (
              plannerRows.map((row, idx) => (
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
                      style={{ ...inputStyle, margin: 0, padding: "8px 12px" }}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

