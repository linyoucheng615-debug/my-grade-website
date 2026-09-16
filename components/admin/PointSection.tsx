"use client";

import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/Toast";
import type { AdminTheme } from "./adminTheme";
import { getCommonStyles } from "./adminTheme";
import { HistoryList } from "./HistoryList";

interface PointSectionProps {
  isMobile: boolean;
  theme: AdminTheme;
  isDarkMode: boolean;
  selectedName: string;
}

export function PointSection({
  isMobile,
  theme,
  isDarkMode,
  selectedName,
}: PointSectionProps) {
  const { showToast } = useToast();
  const { solidCardStyle, inputStyle, btnStyle } = getCommonStyles(theme);

  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [points, setPoints] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const [historyData, setHistoryData] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  const fetchHistory = async () => {
    if (!selectedName) return;
    const { data } = await supabase
      .from("point_logs")
      .select("*")
      .eq("student_name", selectedName)
      .order("created_at", { ascending: false })
      .limit(50);
    setHistoryData(data || []);
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedName]);

  const resetForm = () => {
    setEditingId(null);
    setPoints("");
    setReason("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedName) return showToast("請先選擇學生！", "warning");
    const numPoints = Number(points);
    if (isNaN(numPoints) || numPoints === 0) {
      return showToast("請輸入非 0 的有效點數值！", "warning");
    }
    if (!reason.trim()) return showToast("請輸入點數異動理由！", "warning");

    setLoading(true);
    const payload = {
      student_name: selectedName,
      points: numPoints,
      reason: reason.trim(),
    };

    const { error } = editingId
      ? await supabase.from("point_logs").update(payload).eq("id", editingId)
      : await supabase.from("point_logs").insert([payload]);

    setLoading(false);

    if (error) {
      showToast("儲存失敗：" + error.message, "error");
    } else {
      showToast(editingId ? "✅ 點數紀錄已成功更新！" : "✅ 點數已成功發放！", "success");
      resetForm();
      fetchHistory();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("point_logs").delete().eq("id", id);
    if (error) {
      showToast("刪除失敗：" + error.message, "error");
    } else {
      showToast("已刪除點數紀錄", "info");
      fetchHistory();
    }
  };

  const filteredHistory = historyData.filter((item) => {
    if (!searchKeyword) return true;
    const kw = searchKeyword.toLowerCase();
    const str = `${item.reason || ""} ${item.points || ""}`.toLowerCase();
    return str.includes(kw);
  });

  return (
    <>
      <form onSubmit={handleSubmit} style={solidCardStyle}>
        <h3 style={{ color: theme.textMain, marginBottom: "20px" }}>
          💎 獎勵與扣除點數 {editingId && <span style={{ fontSize: "12px", color: theme.primary }}>(編輯中)</span>}
        </h3>
        <input
          type="number"
          placeholder="輸入增減點數 (加點輸入正數，扣點輸入負數，如: -5)"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="增減點數的原因註記"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
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
              ...btnStyle("#f59e0b"),
              flex: 1,
            }}
          >
            {loading ? "處理中..." : editingId ? "確認更新點數" : "確認發放點數"}
          </button>
        </div>
      </form>

      <div
        style={{
          ...solidCardStyle,
          padding: "12px 20px",
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "20px",
        }}
      >
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
        type="point"
        theme={theme}
        isDarkMode={isDarkMode}
        onEdit={(item: any) => {
          setEditingId(item.id);
          setPoints(String(item.points));
          setReason(item.reason);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onDelete={(id: number) => handleDelete(id)}
      />
    </>
  );
}

