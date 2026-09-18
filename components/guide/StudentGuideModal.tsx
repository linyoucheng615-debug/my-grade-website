"use client";

import React, { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Coins,
  HelpCircle,
  Home,
  Target,
  TrendingUp,
  X,
} from "lucide-react";

interface StudentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  theme?: any;
}

export function StudentGuideModal({ isOpen, onClose, isDarkMode }: StudentGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"quick" | "class" | "grade" | "planner" | "points">("quick");

  if (!isOpen) return null;

  const bgModal = isDarkMode ? "#1e293b" : "#ffffff";
  const textColor = isDarkMode ? "#f8fafc" : "#0f172a";
  const textMuted = isDarkMode ? "#94a3b8" : "#64748b";
  const cardBg = isDarkMode ? "#0f172a" : "#f8fafc";
  const borderColor = isDarkMode ? "#334155" : "#e2e8f0";
  const primaryColor = "#6366f1";

  const tabs = [
    { id: "quick", label: "🏠 系統導覽", icon: Home },
    { id: "class", label: "📚 上課與作業", icon: BookOpen },
    { id: "grade", label: "📝 成績與弱點", icon: TrendingUp },
    { id: "planner", label: "📅 段考與日程", icon: Target },
    { id: "points", label: "💎 點數與兌換", icon: Coins },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        boxSizing: "border-box",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: bgModal,
          color: textColor,
          borderRadius: "24px",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          border: `1px solid ${borderColor}`,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 頂部標題列 (固定不被壓縮) */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: `1px solid ${borderColor}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                background: `${primaryColor}20`,
                padding: "8px",
                borderRadius: "12px",
                color: primaryColor,
              }}
            >
              <HelpCircle size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "900", margin: 0 }}>
                🎒 學生學習平台使用手冊
              </h2>
              <p style={{ fontSize: "12px", color: textMuted, margin: "2px 0 0 0" }}>
                帶你快速熟悉各項貼心學習功能
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: textMuted,
              cursor: "pointer",
              padding: "6px",
              borderRadius: "10px",
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* 分頁按鈕區 (固定不被壓縮，支援橫滑) */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            padding: "10px 18px",
            background: cardBg,
            borderBottom: `1px solid ${borderColor}`,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            flexShrink: 0,
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  background: isActive ? primaryColor : "transparent",
                  color: isActive ? "#ffffff" : textMuted,
                  border: `1px solid ${isActive ? primaryColor : "transparent"}`,
                  borderRadius: "12px",
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                  transition: "0.2s",
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 內容展示區 (彈性縮放，支援滾動，不遮蓋按鈕) */}
        <div
          style={{
            padding: "20px 22px",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            flex: "1 1 auto",
            minHeight: 0,
            lineHeight: "1.7",
            boxSizing: "border-box",
          }}
        >
          {activeTab === "quick" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", color: primaryColor, marginTop: 0 }}>
                💡 歡迎使用學習儀表板！
              </h3>
              <p style={{ fontSize: "14px", color: textMuted }}>
                本平台是老師為你量身打造的學習紀錄小幫手，隨時隨地用手機或電腦登入，都能掌握最新學習動態：
              </p>
              <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={16} color={primaryColor} /> 自動記住登入
                  </div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    只要第一次登入後，系統會在你的手機/電腦自動保存登入狀態，下次開啟直接進入！
                  </div>
                </div>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={16} color={primaryColor} /> 護眼深色模式切換
                  </div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    點擊右上角的太陽 / 月亮按鈕，可以在黑夜深色模式與白天淺色模式間自由切換。
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "class" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", color: primaryColor, marginTop: 0 }}>
                📚 課堂進度與指派作業追蹤
              </h3>
              <p style={{ fontSize: "14px", color: textMuted }}>
                每次上完課後，老師都會在系統登記當天的課程紀錄：
              </p>
              <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>📝 上課進度與筆記</div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    清楚記錄每次上課複習與講授的單元重點，複習時不再找不到方向。
                  </div>
                </div>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>✏️ 回家作業與練習</div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    標註下週上課前需要完成的習作章節或題本頁數，養成自律的好習慣。
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "grade" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", color: primaryColor, marginTop: 0 }}>
                📝 考試成績與弱點分析
              </h3>
              <p style={{ fontSize: "14px", color: textMuted }}>
                分數無法定義你的價值，但能幫我們找到最值得加強的方向：
              </p>
              <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>📈 各科成績曲線走勢</div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    選擇各學科標籤，即可查看歷次段考與平時測驗的分數折線圖，見證自己的進步。
                  </div>
                </div>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>🎯 各次段考單元明細</div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    每筆成績都標明了考試日期與章節單元，考後能清楚知道哪一章節觀念需要重溫。
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "planner" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", color: primaryColor, marginTop: 0 }}>
                📅 段考規劃與日程行事曆
              </h3>
              <p style={{ fontSize: "14px", color: textMuted }}>
                提前規劃考前步調，臨考前不再慌亂：
              </p>
              <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>🎯 段考進度規劃表</div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    老師為你制定的段考進度計畫，依照每堂課日期安排要複習的章節進度，進度完成打勾超有成就感！
                  </div>
                </div>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>🗓️ 個人課表與停課提醒</div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    可切換月曆、週曆或議程模式，若有臨時調課或停課，日曆上會即時標記提醒。
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "points" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", color: primaryColor, marginTop: 0 }}>
                💎 獎勵點數與禮品兌換
              </h3>
              <p style={{ fontSize: "14px", color: textMuted }}>
                認真學習、準時繳交作業或進步顯著時，老師會發放獎勵點數：
              </p>
              <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>🎁 點數商城兌換</div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    累積點數後可至「獎品商城」兌換喜歡的文具、飲品或特別獎品。
                  </div>
                </div>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>🎟️ 我的兌換背包</div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    兌換成功後獎品會放入「我的背包」，上課時出示給老師確認並點擊使用即可兌換實體獎品！
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部按鈕 (固定於底部，絕不被蓋住) */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: `1px solid ${borderColor}`,
            display: "flex",
            justifyContent: "flex-end",
            background: cardBg,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: primaryColor,
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "0.2s",
            }}
          >
            我瞭解了！開始學習
          </button>
        </div>
      </div>
    </div>
  );
}
