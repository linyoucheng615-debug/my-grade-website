"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Coins,
  DollarSign,
  HelpCircle,
  Home,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

interface TeacherGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  isAdmin?: boolean;
  theme?: any;
}

export function TeacherGuideModal({
  isOpen,
  onClose,
  isDarkMode,
  isAdmin = true,
}: TeacherGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "class" | "tuition" | "calendar" | "permission">("dashboard");

  if (!isOpen) return null;

  const bgModal = isDarkMode ? "#1e293b" : "#ffffff";
  const textColor = isDarkMode ? "#f8fafc" : "#0f172a";
  const textMuted = isDarkMode ? "#94a3b8" : "#64748b";
  const cardBg = isDarkMode ? "#0f172a" : "#f8fafc";
  const borderColor = isDarkMode ? "#334155" : "#e2e8f0";
  const primaryColor = "#6366f1";

  const tabs = [
    { id: "dashboard", label: "🏠 看板與預警", icon: Home },
    { id: "class", label: "📚 進度與成績", icon: BookOpen },
    { id: "tuition", label: "💰 學費與合併請款", icon: DollarSign },
    { id: "calendar", label: "📅 排課與段考規劃", icon: Calendar },
    { id: "permission", label: "👩‍🏫 協同教學與權限", icon: ShieldCheck },
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
          maxWidth: "700px",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          border: `1px solid ${borderColor}`,
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 頂部標題列 */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${borderColor}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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
                👩‍🏫 老師管理控制台使用手冊
              </h2>
              <p style={{ fontSize: "12px", color: textMuted, margin: "2px 0 0 0" }}>
                教務流程、學費結算、排程規劃與權限指南
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

        {/* 分頁按鈕區 */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            padding: "12px 20px",
            background: cardBg,
            borderBottom: `1px solid ${borderColor}`,
            overflowX: "auto",
            scrollbarWidth: "none",
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

        {/* 內容展示區 */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1, lineHeight: "1.7" }}>
          {activeTab === "dashboard" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", color: primaryColor, marginTop: 0 }}>
                🏠 老師今日看板與智慧預警
              </h3>
              <p style={{ fontSize: "14px", color: textMuted }}>
                每日登入後的首頁戰情中心，自動彙整今日與近期關鍵事項：
              </p>
              <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={16} color={primaryColor} /> 今日授課課表
                  </div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    即時呈現今天有哪些學生上課、上課時間與科目，單日停課課程會自動隱藏或變色標註。
                  </div>
                </div>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={16} color="#ef4444" /> 過去 7 日未填紀錄提醒
                  </div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    智慧比對行事曆堂數與上課進度表，若有已上課卻尚未登記進度的課堂，會精確條列提醒您補填。
                  </div>
                </div>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={16} color="#f59e0b" /> 成績低分預警（&lt;60 分）
                  </div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    列出負責學生近期不及格之段考/平時測驗，讓老師能第一時間介入關心與補強觀念。
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "class" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", color: primaryColor, marginTop: 0 }}>
                📚 登記上課進度、成績與點數
              </h3>
              <p style={{ fontSize: "14px", color: textMuted }}>
                課後常態性行政作業一站式高效完成：
              </p>
              <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>📖 登記上課進度</div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    指定學生、科目、上課時數、講義雜費、教學單元筆記與回家作業。前台學生端會即時同步！
                  </div>
                </div>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>📝 輸入考試成績</div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    記錄各次學校段考、模考與單元測驗分數。系統會自動繪製歷次成績走勢圖並計算平均。
                  </div>
                </div>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>💎 獎勵點數發放</div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    課堂表現優異或作業完成度高時可加發點數，激勵學生學習動力。
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tuition" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", color: primaryColor, marginTop: 0 }}>
                💰 學費月底結算、雙學生合併與受款帳戶
              </h3>
              <p style={{ fontSize: "14px", color: textMuted }}>
                每月結算學費超便利，一鍵生成親切文案供傳送給家長：
              </p>
              <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>🏦 自訂個人匯款受款帳戶</div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    在學費結算面板可輸入您的銀行受款帳戶（如銀行代碼、帳號與戶名），系統會自動保存。若未填寫則該位置直接留白，絕不強制帶入預設帳號！
                  </div>
                </div>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>👥 雙學生合併結算（兄弟姊妹 / 同家長）</div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    勾選「合併第二位學生結算」並挑選第二位學生，點擊「核算學費」即可同時計算兩位學生的課堂堂數與費用，並產出合併合計總金額與詳細條列文案。
                  </div>
                </div>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>📋 一鍵複製請款文字</div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    點擊「生成複製明細」後，可點擊「複製文字」直接將排版好的請款通知貼到 LINE 傳給家長，省時又專業。
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "calendar" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", color: primaryColor, marginTop: 0 }}>
                📅 行事曆排課與段考進度規劃
              </h3>
              <p style={{ fontSize: "14px", color: textMuted }}>
                視覺化日曆與進度表，排課與調課不再混亂：
              </p>
              <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>🗓️ 排定每週常態與加課日程</div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    可設定每週重複課表或單次課程，並支援指定特定學生或全體活動。
                  </div>
                </div>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>❌ 單日停課與請假調課</div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    點擊日曆上的任何課程事件，可直接設定單日停課或順延調課，同時連動進度表日期。
                  </div>
                </div>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>🎯 段考進度規劃表</div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    自動擷取下次段考前的可用課程堂數，引導老師為學生安排每堂課的複習進度。
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "permission" && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", color: primaryColor, marginTop: 0 }}>
                👩‍🏫 協同教學與學生權限隔離系統
              </h3>
              <p style={{ fontSize: "14px", color: textMuted }}>
                支援多位老師共同教學，嚴格保障學生隱私與資料安全：
              </p>
              <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>🔒 嚴格的資料隔離機制</div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    協同老師登入後，下拉選單、上課紀錄、考試成績、學費結算與今日看板，嚴格僅顯示被指派給他的學生，看不到非其負責的學生資料。
                  </div>
                </div>
                <div style={{ background: cardBg, padding: "14px", borderRadius: "14px", border: `1px solid ${borderColor}` }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>⚙️ 總管理員專屬管理面板</div>
                  <div style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
                    僅總管理員可存取「設定管理」➔「協同老師帳號與授課指派」，新增外聘老師帳號並透過複選核取方塊即時分配負責學生。
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${borderColor}`,
            display: "flex",
            justifyContent: "flex-end",
            background: cardBg,
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
            瞭解，返回控制台
          </button>
        </div>
      </div>
    </div>
  );
}

