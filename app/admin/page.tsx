"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calendar as CalendarIcon,
  Coins,
  DollarSign,
  FileText,
  Home,
  Lock,
  LogOut,
  Settings,
  ShoppingBag,
  Sun,
  TrendingUp,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toDateKey } from "@/lib/dateUtils";
import { useToast } from "@/components/ui/Toast";
import { getAdminTheme, getCommonStyles } from "@/components/admin/adminTheme";

// 子模組匯入
import { TodayDashboard } from "@/components/admin/TodayDashboard";
import { ClassLogSection } from "@/components/admin/ClassLogSection";
import { GradeSection } from "@/components/admin/GradeSection";
import { PointSection } from "@/components/admin/PointSection";
import { RewardShopAdmin } from "@/components/admin/RewardShopAdmin";
import { CalendarSection } from "@/components/admin/CalendarSection";
import { TuitionSection } from "@/components/admin/TuitionSection";
import { ReportSection } from "@/components/admin/ReportSection";
import { CoursePlannerSection } from "@/components/admin/CoursePlannerSection";
import { StudentSettingsSection } from "@/components/admin/StudentSettingsSection";

export default function AdminPage() {
  const { showToast } = useToast();

  // 鑑權與全域狀態
  const [currentTeacher, setCurrentTeacher] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("teacherName");
      return saved ? { name: saved } : null;
    }
    return null;
  });
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("teacherTheme") === "dark";
    }
    return false;
  });
  const [isMobile, setIsMobile] = useState(false);

  // 導覽狀態
  const [mainTab, setMainTab] = useState<"features" | "settings">("features");
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  // 核心資料狀態
  const [studentList, setStudentList] = useState<any[]>([]);
  const [selectedName, setSelectedName] = useState<string>("");
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  // 看板統計資料
  const [dashboardLowGrades, setDashboardLowGrades] = useState<any[]>([]);
  const [dashboardMissingLogs, setDashboardMissingLogs] = useState<any[]>([]);
  const [recentRedeems, setRecentRedeems] = useState<any[]>([]);

  // 主題與樣式物件
  const theme = getAdminTheme(isDarkMode);
  const { solidCardStyle, selectStyle, btnStyle } = getCommonStyles(theme);

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    localStorage.setItem("teacherTheme", nextTheme ? "dark" : "light");
  };

  // 取得學生列表
  const fetchStudents = async () => {
    const { data } = await supabase.from("students").select("*").order("name");
    const list = data || [];
    setStudentList(list);
    if (list.length > 0 && !selectedName) {
      setSelectedName(list[0].name);
    }
  };

  // 取得行事曆事件
  const fetchCalendar = async () => {
    const { data } = await supabase
      .from("calendar_events")
      .select("*")
      .order("event_date", { ascending: true });
    setCalendarEvents(data || []);
  };

  // 載入 Dashboard 預警與核銷通知
  const fetchDashboardData = async () => {
    setLoading(true);
    const { data: grades } = await supabase
      .from("grades")
      .select("*")
      .lt("score", 60)
      .order("exam_date", { ascending: false })
      .limit(5);
    setDashboardLowGrades(grades || []);

    const today = new Date();
    const missing: any[] = [];
    const past7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i - 1);
      return toDateKey(d);
    });

    const { data: recentLogs } = await supabase
      .from("class_logs")
      .select("*")
      .in("class_date", past7Days);
    const logsMap = new Set((recentLogs || []).map((l) => `${l.student_name}_${l.class_date}`));

    past7Days.forEach((dateStr) => {
      const dayOfWeek = new Date(dateStr).getDay();
      const activeEvents = calendarEvents.filter((ev) => {
        const start = ev.event_date;
        if (!ev.is_recurring) {
          return start === dateStr || (ev.end_date && dateStr >= start && dateStr <= ev.end_date);
        }
        if (ev.is_recurring && ev.recurring_pattern === "weekly") {
          if (dateStr < start || (ev.recurring_end_date && dateStr > ev.recurring_end_date)) {
            return false;
          }
          return dayOfWeek === new Date(start).getDay();
        }
        return false;
      });

      activeEvents.forEach((ev) => {
        const isCancelled =
          ev.type === "cancellation" ||
          (ev.cancelled_dates && Array.isArray(ev.cancelled_dates) && ev.cancelled_dates.includes(dateStr));
        if (ev.type === "class" && !isCancelled && ev.student_name !== "全體") {
          if (!logsMap.has(`${ev.student_name}_${dateStr}`)) {
            missing.push({ student_name: ev.student_name, date: dateStr, title: ev.title });
          }
        }
      });
    });
    setDashboardMissingLogs(missing);

    const { data: redeems } = await supabase
      .from("student_inventory")
      .select("*")
      .eq("status", "used")
      .order("used_at", { ascending: false })
      .limit(5);
    setRecentRedeems(redeems || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
    fetchCalendar();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (selectedFeature === "dashboard" && currentTeacher) {
      fetchDashboardData();
    }
  }, [selectedFeature, currentTeacher, calendarEvents]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data } = await supabase
      .from("teachers")
      .select("*")
      .eq("name", loginName.trim())
      .eq("password", loginPassword.trim())
      .single();
    setLoading(false);

    if (data) {
      setCurrentTeacher(data);
      localStorage.setItem("teacherName", data.name);
      showToast(`👋 歡迎回來，${data.name} 老師！`, "success");
    } else {
      showToast("❌ 帳號或密碼錯誤，登入失敗", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("teacherName");
    setCurrentTeacher(null);
    showToast("已安全登出", "info");
  };

  const globalContainerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: theme.bg,
    transition: "background 0.5s ease",
    color: theme.textMain,
    fontFamily: "sans-serif",
  };

  const loginInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 14px 14px 45px",
    borderRadius: "14px",
    border: `1px solid ${theme.border}`,
    background: theme.inputBg,
    color: theme.textMain,
    fontSize: "16px",
    outline: "none",
    boxSizing: "border-box",
    transition: "0.3s",
  };

  // 登入畫面
  if (!currentTeacher) {
    return (
      <div
        style={{
          ...globalContainerStyle,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <style jsx global>{`
          body {
            background-color: ${theme.bodyBg};
            margin: 0;
            transition: background-color 0.5s ease;
          }
        `}</style>
        <button
          onClick={toggleTheme}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: theme.card,
            border: `1px solid ${theme.border}`,
            padding: "10px",
            borderRadius: "50%",
            color: theme.textMain,
            cursor: "pointer",
            boxShadow: theme.shadow,
          }}
        >
          <Sun size={20} />
        </button>
        <div style={{ ...solidCardStyle, width: "100%", maxWidth: "360px", textAlign: "center" }}>
          <h1
            style={{
              color: theme.primary,
              fontSize: "28px",
              marginBottom: "10px",
              fontWeight: "900",
            }}
          >
            🍎 老師登入
          </h1>
          <p style={{ color: theme.textMuted, marginBottom: "30px", fontSize: "14px" }}>
            進入教務管理控制台
          </p>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ position: "relative" }}>
              <User
                size={18}
                style={{ position: "absolute", left: "15px", top: "16px", color: theme.textMuted }}
              />
              <input
                type="text"
                placeholder="帳號"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                style={loginInputStyle}
              />
            </div>
            <div style={{ position: "relative" }}>
              <Lock
                size={18}
                style={{ position: "absolute", left: "15px", top: "16px", color: theme.textMuted }}
              />
              <input
                type="password"
                placeholder="密碼"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                style={loginInputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...btnStyle(theme.primary),
                padding: "14px",
                borderRadius: "14px",
                fontSize: "16px",
              }}
            >
              {loading ? "登入中..." : "登入"}
            </button>
          </form>
          <div
            style={{
              marginTop: "25px",
              borderTop: `1px solid ${theme.border}`,
              paddingTop: "20px",
            }}
          >
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                background: "transparent",
                color: theme.textMuted,
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                gap: "8px",
                transition: "0.2s",
              }}
            >
              🎒 我是學生，切換至前台
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 取得今日未停課事件
  const todayStr = new Date().toLocaleDateString("en-CA");
  const todayEvents = calendarEvents.filter((ev) => {
    const start = ev.event_date;
    const dayOfWeek = new Date(todayStr).getDay();
    if (!ev.is_recurring) {
      return start === todayStr || (ev.end_date && todayStr >= start && todayStr <= ev.end_date);
    }
    if (ev.is_recurring && ev.recurring_pattern === "weekly") {
      if (todayStr < start || (ev.recurring_end_date && todayStr > ev.recurring_end_date)) return false;
      return dayOfWeek === new Date(start).getDay();
    }
    return false;
  });

  return (
    <div style={{ ...globalContainerStyle, paddingBottom: "100px" }}>
      <style jsx global>{`
        body {
          background-color: ${theme.bodyBg};
          margin: 0;
          transition: background-color 0.5s ease;
        }
      `}</style>
      <div style={{ maxWidth: "850px", margin: "auto", padding: "20px" }}>
        {/* 頂部標題與工具 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <h1 style={{ fontSize: "24px", color: theme.textMain, fontWeight: "900" }}>
            👩‍🏫 {currentTeacher.name} 的管理後台
          </h1>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={toggleTheme}
              style={{
                background: theme.activeControl,
                border: `1px solid ${theme.border}`,
                padding: "10px",
                borderRadius: "50%",
                color: theme.textMain,
                cursor: "pointer",
                boxShadow: theme.shadow,
              }}
            >
              <Sun size={18} />
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: theme.activeControl,
                border: `1px solid ${theme.border}`,
                padding: "10px",
                borderRadius: "50%",
                color: theme.danger,
                cursor: "pointer",
                boxShadow: theme.shadow,
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* 核心功能分頁 */}
        {mainTab === "features" && (
          <div>
            {!selectedFeature && (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "900",
                    color: theme.textMain,
                    marginBottom: "20px",
                  }}
                >
                  🚀 請選擇要執行的功能
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: "15px",
                  }}
                >
                  <div
                    onClick={() => setSelectedFeature("dashboard")}
                    style={{
                      ...solidCardStyle,
                      cursor: "pointer",
                      borderLeft: `6px solid ${theme.primary}`,
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      marginBottom: 0,
                      gridColumn: isMobile ? "auto" : "span 2",
                    }}
                  >
                    <div style={{ background: `${theme.primary}20`, padding: "12px", borderRadius: "12px" }}>
                      <Home size={24} color={theme.primary} />
                    </div>
                    <div>
                      <div style={{ fontWeight: "900", fontSize: "16px", color: theme.textMain }}>
                        🏠 老師今日看板
                      </div>
                      <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>
                        今日課表、未填紀錄與低分預警
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedFeature("class")}
                    style={{
                      ...solidCardStyle,
                      cursor: "pointer",
                      borderLeft: `6px solid #10b981`,
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      marginBottom: 0,
                    }}
                  >
                    <div style={{ background: "#10b98120", padding: "12px", borderRadius: "12px" }}>
                      <BookOpen size={24} color="#10b981" />
                    </div>
                    <div>
                      <div style={{ fontWeight: "900", fontSize: "16px", color: theme.textMain }}>
                        📚 登記上課進度
                      </div>
                      <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>
                        進度、作業與雜費紀錄
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedFeature("grade")}
                    style={{
                      ...solidCardStyle,
                      cursor: "pointer",
                      borderLeft: `6px solid #3b82f6`,
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      marginBottom: 0,
                    }}
                  >
                    <div style={{ background: "#3b82f620", padding: "12px", borderRadius: "12px" }}>
                      <TrendingUp size={24} color="#3b82f6" />
                    </div>
                    <div>
                      <div style={{ fontWeight: "900", fontSize: "16px", color: theme.textMain }}>
                        📝 輸入考試成績
                      </div>
                      <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>
                        各校段考與測驗分數
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedFeature("point")}
                    style={{
                      ...solidCardStyle,
                      cursor: "pointer",
                      borderLeft: `6px solid #f59e0b`,
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      marginBottom: 0,
                    }}
                  >
                    <div style={{ background: "#f59e0b20", padding: "12px", borderRadius: "12px" }}>
                      <Coins size={24} color="#f59e0b" />
                    </div>
                    <div>
                      <div style={{ fontWeight: "900", fontSize: "16px", color: theme.textMain }}>
                        💎 獎勵點數發放
                      </div>
                      <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>
                        加扣點數與原因註記
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedFeature("reward")}
                    style={{
                      ...solidCardStyle,
                      cursor: "pointer",
                      borderLeft: `6px solid #14b8a6`,
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      marginBottom: 0,
                    }}
                  >
                    <div style={{ background: "#14b8a620", padding: "12px", borderRadius: "12px" }}>
                      <ShoppingBag size={24} color="#14b8a6" />
                    </div>
                    <div>
                      <div style={{ fontWeight: "900", fontSize: "16px", color: theme.textMain }}>
                        🎁 點數商品管理
                      </div>
                      <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>
                        上架兌換獎勵與設定
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedFeature("calendar")}
                    style={{
                      ...solidCardStyle,
                      cursor: "pointer",
                      borderLeft: `6px solid #8b5cf6`,
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      marginBottom: 0,
                    }}
                  >
                    <div style={{ background: "#8b5cf620", padding: "12px", borderRadius: "12px" }}>
                      <CalendarIcon size={24} color="#8b5cf6" />
                    </div>
                    <div>
                      <div style={{ fontWeight: "900", fontSize: "16px", color: theme.textMain }}>
                        🗓️ 日程與行事曆
                      </div>
                      <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>
                        排定日程與單日停課
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedFeature("tuition")}
                    style={{
                      ...solidCardStyle,
                      cursor: "pointer",
                      borderLeft: `6px solid #ec4899`,
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      marginBottom: 0,
                    }}
                  >
                    <div style={{ background: "#ec489920", padding: "12px", borderRadius: "12px" }}>
                      <DollarSign size={24} color="#ec4899" />
                    </div>
                    <div>
                      <div style={{ fontWeight: "900", fontSize: "16px", color: theme.textMain }}>
                        💰 結算月底學費
                      </div>
                      <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>
                        費用計算與家長請款
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedFeature("report")}
                    style={{
                      ...solidCardStyle,
                      cursor: "pointer",
                      borderLeft: `6px solid #6366f1`,
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      marginBottom: 0,
                    }}
                  >
                    <div style={{ background: "#6366f120", padding: "12px", borderRadius: "12px" }}>
                      <FileText size={24} color="#6366f1" />
                    </div>
                    <div>
                      <div style={{ fontWeight: "900", fontSize: "16px", color: theme.textMain }}>
                        📊 檢視學習報表
                      </div>
                      <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>
                        歷次成績走勢與平均
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedFeature("planner")}
                    style={{
                      ...solidCardStyle,
                      cursor: "pointer",
                      borderLeft: `6px solid #0ea5e9`,
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      marginBottom: 0,
                    }}
                  >
                    <div style={{ background: "#0ea5e920", padding: "12px", borderRadius: "12px" }}>
                      <CalendarIcon size={24} color="#0ea5e9" />
                    </div>
                    <div>
                      <div style={{ fontWeight: "900", fontSize: "16px", color: theme.textMain }}>
                        📅 段考進度規劃
                      </div>
                      <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>
                        連動行事曆堂數與進度檢核
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 子功能詳細頁面 */}
            {selectedFeature && (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                <button
                  onClick={() => setSelectedFeature(null)}
                  style={{
                    background: theme.inputBg,
                    border: `1px solid ${theme.border}`,
                    padding: "8px 16px",
                    borderRadius: "12px",
                    color: theme.textMain,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "20px",
                    fontWeight: "bold",
                    transition: "0.2s",
                  }}
                >
                  <ArrowLeft size={16} /> 返回功能選單
                </button>

                {/* 學生切換橫幅（適用於學科紀錄型功能） */}
                {["class", "grade", "point", "tuition", "report", "planner"].includes(
                  selectedFeature
                ) && (
                  <div style={{ ...solidCardStyle, padding: "20px" }}>
                    <label
                      style={{
                        fontWeight: "900",
                        display: "block",
                        marginBottom: "12px",
                        color: theme.primary,
                        fontSize: "14px",
                        letterSpacing: "1px",
                      }}
                    >
                      👤 指定要操作的學生：
                    </label>
                    <select
                      value={selectedName}
                      onChange={(e) => setSelectedName(e.target.value)}
                      style={{
                        ...selectStyle,
                        background: theme.inputBg,
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: theme.textMain,
                        border: `1px solid ${theme.border}`,
                        padding: "12px 15px",
                        margin: 0,
                      }}
                    >
                      {studentList.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 各模組渲染 */}
                {selectedFeature === "dashboard" && (
                  <TodayDashboard
                    isMobile={isMobile}
                    theme={theme}
                    isDarkMode={isDarkMode}
                    todayEvents={todayEvents}
                    dashboardMissingLogs={dashboardMissingLogs}
                    recentRedeems={recentRedeems}
                    dashboardLowGrades={dashboardLowGrades}
                  />
                )}

                {selectedFeature === "class" && (
                  <ClassLogSection
                    isMobile={isMobile}
                    theme={theme}
                    isDarkMode={isDarkMode}
                    selectedName={selectedName}
                  />
                )}

                {selectedFeature === "grade" && (
                  <GradeSection
                    isMobile={isMobile}
                    theme={theme}
                    isDarkMode={isDarkMode}
                    selectedName={selectedName}
                  />
                )}

                {selectedFeature === "point" && (
                  <PointSection
                    isMobile={isMobile}
                    theme={theme}
                    isDarkMode={isDarkMode}
                    selectedName={selectedName}
                  />
                )}

                {selectedFeature === "reward" && (
                  <RewardShopAdmin isMobile={isMobile} theme={theme} />
                )}

                {selectedFeature === "calendar" && (
                  <CalendarSection
                    isMobile={isMobile}
                    theme={theme}
                    isDarkMode={isDarkMode}
                    studentList={studentList}
                    calendarEvents={calendarEvents}
                    onRefreshCalendar={fetchCalendar}
                  />
                )}

                {selectedFeature === "tuition" && (
                  <TuitionSection
                    theme={theme}
                    isDarkMode={isDarkMode}
                    selectedName={selectedName}
                  />
                )}

                {selectedFeature === "report" && (
                  <ReportSection
                    isMobile={isMobile}
                    theme={theme}
                    selectedName={selectedName}
                  />
                )}

                {selectedFeature === "planner" && (
                  <CoursePlannerSection theme={theme} selectedName={selectedName} />
                )}
              </div>
            )}
          </div>
        )}

        {/* 設定管理分頁 */}
        {mainTab === "settings" && (
          <StudentSettingsSection
            isMobile={isMobile}
            theme={theme}
            studentList={studentList}
            onRefreshStudents={fetchStudents}
            selectedName={selectedName}
            onSelectStudent={setSelectedName}
          />
        )}
      </div>

      {/* 底部導覽列 */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: theme.navBg,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: `1px solid ${theme.border}`,
          display: "flex",
          justifyContent: "space-around",
          padding: "12px 0 25px 0",
          zIndex: 100,
          boxShadow: theme.shadow,
        }}
      >
        <button
          onClick={() => {
            setMainTab("features");
            setSelectedFeature(null);
          }}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: mainTab === "features" ? theme.primary : theme.textMuted,
            cursor: "pointer",
            transition: "0.2s",
          }}
        >
          <Home
            size={26}
            style={{
              marginBottom: "6px",
              transform: mainTab === "features" ? "scale(1.1)" : "scale(1)",
            }}
          />
          <span style={{ fontSize: "12px", fontWeight: mainTab === "features" ? "bold" : "normal" }}>
            🚀 核心功能
          </span>
        </button>
        <button
          onClick={() => setMainTab("settings")}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: mainTab === "settings" ? theme.primary : theme.textMuted,
            cursor: "pointer",
            transition: "0.2s",
          }}
        >
          <Settings
            size={26}
            style={{
              marginBottom: "6px",
              transform: mainTab === "settings" ? "scale(1.1)" : "scale(1)",
            }}
          />
          <span style={{ fontSize: "12px", fontWeight: mainTab === "settings" ? "bold" : "normal" }}>
            ⚙️ 設定管理
          </span>
        </button>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        ::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
      `}</style>
    </div>
  );
}