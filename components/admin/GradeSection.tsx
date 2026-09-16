"use client";

import React, { useState, useEffect } from "react";
import { Filter, Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { SUBJECTS } from "@/lib/constants";
import { getTodayDateString } from "@/lib/dateUtils";
import { useToast } from "@/components/ui/Toast";
import type { AdminTheme } from "./adminTheme";
import { getCommonStyles } from "./adminTheme";
import { HistoryList } from "./HistoryList";

interface GradeSectionProps {
  isMobile: boolean;
  theme: AdminTheme;
  isDarkMode: boolean;
  selectedName: string;
}

export function GradeSection({
  isMobile,
  theme,
  isDarkMode,
  selectedName,
}: GradeSectionProps) {
  const { showToast } = useToast();
  const { solidCardStyle, inputStyle, selectStyle, btnStyle } = getCommonStyles(theme);

  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [examDate, setExamDate] = useState<string>(getTodayDateString());
  const [unit, setUnit] = useState<string>("");
  const [score, setScore] = useState<string>("");

  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<string>("全部");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  const fetchHistory = async () => {
    if (!selectedName) return;
    let query = supabase.from("grades").select("*").eq("student_name", selectedName);
    if (historyFilter !== "全部") {
      query = query.eq("subject", historyFilter);
    }
    const { data } = await query.order("exam_date", { ascending: false }).limit(50);
    setHistoryData(data || []);
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedName, historyFilter]);

  const resetForm = () => {
    setEditingId(null);
    setUnit("");
    setScore("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedName) return showToast("請先選擇學生！", "warning");
    if (!examDate) return showToast("請選擇考試日期！", "warning");
    if (!unit.trim()) return showToast("請輸入單元範圍！", "warning");

    const numScore = Number(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      return showToast("請輸入 0 ~ 100 之間的合理分數！", "warning");
    }

    setLoading(true);
    const payload = {
      student_name: selectedName,
      subject,
      score: numScore,
      exam_date: examDate,
      unit: unit.trim(),
    };

    const { error } = editingId
      ? await supabase.from("grades").update(payload).eq("id", editingId)
      : await supabase.from("grades").insert([payload]);

    setLoading(false);

    if (error) {
      showToast("儲存失敗：" + error.message, "error");
    } else {
      showToast(editingId ? "✅ 成績已成功更新！" : "✅ 成績已成功登錄！", "success");
      resetForm();
      fetchHistory();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("grades").delete().eq("id", id);
    if (error) {
      showToast("刪除失敗：" + error.message, "error");
    } else {
      showToast("已刪除該筆成績", "info");
      fetchHistory();
    }
  };

  const filteredHistory = historyData.filter((item) => {
    if (!searchKeyword) return true;
    const kw = searchKeyword.toLowerCase();
    const str = `${item.subject || ""} ${item.unit || ""} ${item.score || ""}`.toLowerCase();
    return str.includes(kw);
  });

  return (
    <>
      <form onSubmit={handleSubmit} style={solidCardStyle}>
        <h3 style={{ color: theme.textMain, marginBottom: "20px" }}>
          📝 輸入考試分數 {editingId && <span style={{ fontSize: "12px", color: theme.primary }}>(編輯中)</span>}
        </h3>
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: "15px",
            marginBottom: "10px",
          }}
        >
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={selectStyle}
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        <input
          type="text"
          placeholder="📖 考試範圍 / 單元名稱"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="考試得分 (0 ~ 100)"
          min="0"
          max="100"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          style={inputStyle}
        />

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
              ...btnStyle("#3b82f6"),
              flex: 1,
            }}
          >
            {loading ? "儲存中..." : editingId ? "確認更新成績" : "儲存成績資料"}
          </button>
        </div>
      </form>

      {/* 篩選與搜尋 */}
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
        type="grade"
        theme={theme}
        isDarkMode={isDarkMode}
        onEdit={(item: any) => {
          setEditingId(item.id);
          setScore(String(item.score));
          setExamDate(item.exam_date);
          setSubject(item.subject);
          setUnit(item.unit || "");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onDelete={(id: number) => handleDelete(id)}
      />
    </>
  );
}

