"use client";

import React, { useState, useEffect } from "react";
import { Clock, DollarSign, Filter, Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { SUBJECTS } from "@/lib/constants";
import { getTodayDateString, getYesterdayDateString } from "@/lib/dateUtils";
import { useToast } from "@/components/ui/Toast";
import type { AdminTheme } from "./adminTheme";
import { getCommonStyles } from "./adminTheme";
import { HistoryList } from "./HistoryList";

interface ClassLogSectionProps {
  isMobile: boolean;
  theme: AdminTheme;
  isDarkMode: boolean;
  selectedName: string;
}

export function ClassLogSection({
  isMobile,
  theme,
  isDarkMode,
  selectedName,
}: ClassLogSectionProps) {
  const { showToast } = useToast();
  const { solidCardStyle, inputStyle, selectStyle, btnStyle } = getCommonStyles(theme);

  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [classDate, setClassDate] = useState<string>(getTodayDateString());
  const [duration, setDuration] = useState<string>("1.5");
  const [expense, setExpense] = useState<string>("");
  const [progress, setProgress] = useState<string>("");
  const [homework, setHomework] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const [lastRecord, setLastRecord] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<string>("全部");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  const fetchHistory = async () => {
    if (!selectedName) return;
    let query = supabase.from("class_logs").select("*").eq("student_name", selectedName);
    if (historyFilter !== "全部") {
      query = query.eq("subject", historyFilter);
    }
    const { data } = await query.order("created_at", { ascending: false }).limit(50);
    setHistoryData(data || []);
  };

  const fetchLastRecord = async () => {
    if (!selectedName || !subject) return;
    const { data } = await supabase
      .from("class_logs")
      .select("*")
      .eq("student_name", selectedName)
      .eq("subject", subject)
      .order("class_date", { ascending: false })
      .limit(1);
    setLastRecord(data && data.length > 0 ? data[0] : null);
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedName, historyFilter]);

  useEffect(() => {
    fetchLastRecord();
  }, [selectedName, subject]);

  const resetForm = () => {
    setEditingId(null);
    setProgress("");
    setHomework("");
    setNote("");
    setExpense("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedName) return showToast("請先選擇學生！", "warning");
    if (!progress.trim()) return showToast("請輸入上課進度描述！", "warning");

    setLoading(true);
    const payload = {
      student_name: selectedName,
      class_date: classDate,
      progress: progress.trim(),
      homework: homework.trim(),
      note: note.trim(),
      duration: Number(duration),
      subject,
      expense: Number(expense) || 0,
    };

    const { error } = editingId
      ? await supabase.from("class_logs").update(payload).eq("id", editingId)
      : await supabase.from("class_logs").insert([payload]);

    setLoading(false);

    if (error) {
      showToast("儲存失敗：" + error.message, "error");
    } else {
      showToast(editingId ? "✅ 紀錄已成功更新！" : "✅ 紀錄已成功登記！", "success");
      resetForm();
      fetchHistory();
      fetchLastRecord();

      // 自動連動更新 course_plans 進度表（安全比對學科與日期）
      const { data: matchedPlan } = await supabase
        .from("course_plans")
        .select("*")
        .eq("student_name", selectedName)
        .eq("subject", subject)
        .eq("planned_date", classDate)
        .maybeSingle();

      if (matchedPlan) {
        const planContent = (matchedPlan.planned_content || "").trim();
        const currentProgress = (progress || "").trim();
        const isMatch = planContent.length > 0 && planContent === currentProgress;

        await supabase
          .from("course_plans")
          .update({
            actual_content: currentProgress,
            status: isMatch ? "on_track" : "modified",
          })
          .eq("id", matchedPlan.id);
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("class_logs").delete().eq("id", id);
    if (error) {
      showToast("刪除失敗：" + error.message, "error");
    } else {
      showToast("已刪除紀錄", "info");
      fetchHistory();
      fetchLastRecord();
    }
  };

  const filteredHistory = historyData.filter((item) => {
    if (!searchKeyword) return true;
    const kw = searchKeyword.toLowerCase();
    const str = `${item.subject || ""} ${item.progress || ""} ${item.homework || ""} ${item.note || ""}`.toLowerCase();
    return str.includes(kw);
  });

  return (
    <>
      <form onSubmit={handleSubmit} style={solidCardStyle}>
        <h3 style={{ color: theme.textMain, marginBottom: "20px" }}>
          📚 登記上課進度 {editingId && <span style={{ fontSize: "12px", color: theme.primary }}>(編輯中)</span>}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.5fr 2fr 1fr",
            gap: "15px",
            marginBottom: "15px",
          }}
        >
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{ ...selectStyle, margin: 0 }}
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="date"
              value={classDate}
              onChange={(e) => setClassDate(e.target.value)}
              style={{ ...inputStyle, margin: 0, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => setClassDate(getTodayDateString())}
              style={{
                background: theme.activeControl,
                color: theme.textMain,
                border: `1px solid ${theme.border}`,
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "bold",
                padding: "0 12px",
                whiteSpace: "nowrap",
              }}
            >
              今天
            </button>
            <button
              type="button"
              onClick={() => setClassDate(getYesterdayDateString())}
              style={{
                background: theme.activeControl,
                color: theme.textMain,
                border: `1px solid ${theme.border}`,
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "bold",
                padding: "0 12px",
                whiteSpace: "nowrap",
              }}
            >
              昨天
            </button>
          </div>

          <div style={{ position: "relative" }}>
            <input
              type="number"
              step="0.5"
              placeholder="時數"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              style={{ ...inputStyle, margin: 0, textAlign: "center" }}
            />
            <span style={{ position: "absolute", right: 12, top: 14, fontSize: 12, color: theme.textMuted }}>
              hr
            </span>
          </div>
        </div>

        <div style={{ position: "relative", marginBottom: "15px" }}>
          <DollarSign
            size={16}
            style={{ position: "absolute", left: 12, top: 16, color: theme.danger }}
          />
          <input
            type="number"
            placeholder="課堂雜費金額 (選填)"
            value={expense}
            onChange={(e) => setExpense(e.target.value)}
            style={{
              ...inputStyle,
              paddingLeft: 40,
              border: `1px solid ${isDarkMode ? "rgba(248,113,113,0.3)" : "#fecaca"}`,
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <input
            type="text"
            placeholder="📝 輸入本日上課進度詳細描述"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            style={{ ...inputStyle, margin: 0 }}
          />
          {lastRecord && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "8px",
                marginLeft: "5px",
              }}
            >
              <Clock size={14} color={theme.primary} />
              <span style={{ fontSize: "12px", color: theme.textMuted }}>
                上次進度：{lastRecord.progress}
              </span>
              <button
                type="button"
                onClick={() => setProgress(lastRecord.progress)}
                style={{
                  background: `${theme.primary}20`,
                  color: theme.primary,
                  border: "none",
                  borderRadius: "6px",
                  padding: "2px 8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "11px",
                }}
              >
                接續填寫
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: "15px",
            marginTop: "10px",
          }}
        >
          <input
            type="text"
            placeholder="🏠 出題回家作業"
            value={homework}
            onChange={(e) => setHomework(e.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="💡 給家長或學生的叮嚀備註"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                ...btnStyle(theme.inputBg),
                color: theme.textMain,
                border: `1px solid ${theme.border}`,
                width: "30%",
              }}
            >
              取消編輯
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...btnStyle(theme.success),
              flex: 1,
            }}
          >
            {loading ? "儲存中..." : editingId ? "確認更新紀錄" : "確認儲存紀錄"}
          </button>
        </div>
      </form>

      {/* 篩選與搜尋工具列 */}
      <div
        style={{
          ...solidCardStyle,
          padding: "12px 20px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "15px",
          marginTop: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", width: isMobile ? "100%" : "auto" }}>
          <Filter size={16} color={theme.textMuted} />
          <span style={{ fontSize: "14px", color: theme.textMuted, fontWeight: "bold", whiteSpace: "nowrap" }}>
            篩選：
          </span>
          <select
            value={historyFilter}
            onChange={(e) => setHistoryFilter(e.target.value)}
            style={{
              ...selectStyle,
              width: "auto",
              padding: "6px 12px",
              margin: 0,
              background: theme.inputBg,
              fontSize: "13px",
              flex: 1,
            }}
          >
            <option value="全部">全部科目顯示</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div style={{ position: "relative", width: isMobile ? "100%" : "250px" }}>
          <Search
            size={16}
            color={theme.textMuted}
            style={{ position: "absolute", left: "12px", top: "10px" }}
          />
          <input
            type="text"
            placeholder="關鍵字搜尋紀錄..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{
              ...inputStyle,
              margin: 0,
              padding: "8px 12px 8px 36px",
              fontSize: "13px",
            }}
          />
        </div>
      </div>

      <HistoryList
        data={filteredHistory}
        type="class"
        theme={theme}
        isDarkMode={isDarkMode}
        onEdit={(item: any) => {
          setEditingId(item.id);
          setProgress(item.progress);
          setClassDate(item.class_date);
          setSubject(item.subject);
          setDuration(String(item.duration));
          setHomework(item.homework || "");
          setNote(item.note || "");
          setExpense(item.expense || "");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onDelete={(id: number) => handleDelete(id)}
      />
    </>
  );
}

