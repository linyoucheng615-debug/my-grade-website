"use client";

import React, { useState } from "react";
import { BookOpen, DollarSign, MessageSquare, Pencil, Trash2 } from "lucide-react";
import type { AdminTheme } from "./adminTheme";

export interface HistoryListProps {
  data: any[];
  type: string; // 'class' | 'grade' | 'point'
  onEdit: (item: any) => void;
  onDelete: (id: number, info: string) => void;
  theme: AdminTheme;
  isDarkMode: boolean;
}

export function HistoryList({ data, type, onEdit, onDelete, theme, isDarkMode }: HistoryListProps) {
  const [confirmId, setConfirmId] = useState<number | null>(null);

  return (
    <div style={{ marginTop: "10px" }}>
      {data.length > 0 ? (
        data.map((item) => {
          const infoStr =
            type === "grade"
              ? `${item.subject} ${item.score}分`
              : type === "point"
              ? `${item.reason} ${item.points}點`
              : `${item.subject} ${item.progress}`;

          return (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: theme.activeControl,
                padding: "18px",
                borderRadius: "16px",
                border: `1px solid ${theme.border}`,
                marginBottom: "12px",
                boxShadow: theme.shadow,
              }}
            >
              <div style={{ fontSize: "14px", flex: 1, color: theme.textMain }}>
                {type === "grade" ? (
                  <span>
                    🏷️ <b>{item.subject}</b>: {item.score}分{" "}
                    <span style={{ color: theme.textMuted }}>({item.unit})</span>{" "}
                    <span style={{ color: theme.textMuted, fontSize: "12px" }}>({item.exam_date})</span>
                  </span>
                ) : type === "point" ? (
                  <span>
                    💎 {item.reason}:{" "}
                    <b
                      style={{
                        color: item.points > 0 ? theme.success : theme.danger,
                        fontSize: "17px",
                      }}
                    >
                      {item.points} 點
                    </b>
                  </span>
                ) : (
                  <div>
                    <div style={{ fontWeight: "bold" }}>
                      📂 {item.subject}: {item.progress}{" "}
                      <span style={{ color: theme.textMuted, fontWeight: "normal" }}>
                        ({item.class_date} | {item.duration} hr)
                      </span>
                    </div>
                    {item.expense > 0 && (
                      <div
                        style={{
                          fontSize: "13px",
                          color: theme.danger,
                          fontWeight: "900",
                          marginTop: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <DollarSign size={14} /> 雜費: {item.expense}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "10px", marginTop: "10px", fontSize: "13px" }}>
                      {item.homework && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            background: isDarkMode ? "rgba(56,189,248,0.15)" : "#e0f2fe",
                            padding: "4px 10px",
                            borderRadius: "8px",
                            color: theme.primary,
                            fontWeight: "bold",
                          }}
                        >
                          <BookOpen size={14} /> {item.homework}
                        </span>
                      )}
                      {item.note && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            background: isDarkMode ? "rgba(52,211,153,0.15)" : "#dcfce7",
                            padding: "4px 10px",
                            borderRadius: "8px",
                            color: theme.success,
                            fontWeight: "bold",
                          }}
                        >
                          <MessageSquare size={14} /> {item.note}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "15px", marginLeft: "15px" }}>
                {confirmId === item.id ? (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                      onClick={() => {
                        onDelete(item.id, infoStr);
                        setConfirmId(null);
                      }}
                      style={{
                        background: theme.danger,
                        color: "#fff",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      確定
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      style={{
                        background: theme.inputBg,
                        color: theme.textMain,
                        border: `1px solid ${theme.border}`,
                        padding: "8px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => onEdit(item)}
                      style={{ border: "none", background: "none", cursor: "pointer", color: theme.primary }}
                      title="編輯"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => setConfirmId(item.id)}
                      style={{ border: "none", background: "none", cursor: "pointer", color: theme.danger }}
                      title="刪除"
                    >
                      <Trash2 size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <p
          style={{
            textAlign: "center",
            color: theme.textMuted,
            padding: "30px",
            border: `1px dashed ${theme.border}`,
            borderRadius: "20px",
          }}
        >
          目前沒有相關歷史數據紀錄 ✨
        </p>
      )}
    </div>
  );
}

