"use client";

import React, { useState, useEffect } from "react";
import { User, Lock, BookOpen, MessageSquare, DollarSign, TrendingUp, Home, Calendar, Award, LogOut, Coins, FileText, ChevronDown, ChevronUp, Sun, Moon, Filter, Bell, Clock, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const supabaseUrl = "https://ynkvxixhiwwnocqybprs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlua3Z4aXhoaXd3bm9jcXlicHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDM5MzYsImV4cCI6MjA4MjA3OTkzNn0.9Z_SKdFXQOrZXEHT4J4wkSXBpt097tOuuXI6IFJN_FA";
const supabase = createClient(supabaseUrl, supabaseKey);

const COLORS: Record<string, string> = {
  "國文": "#ef4444", "英文": "#f59e0b", "數學": "#10b981",
  "理化": "#3b82f6", "生物": "#8b5cf6", "地科": "#ec4899",
  "歷史": "#6366f1", "地理": "#14b8a6", "公民": "#f97316"
};

const WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"];

export default function StudentPortal() {
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [tuitionTotal, setTuitionTotal] = useState(0);
  const [tuitionDetails, setTuitionDetails] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const [activeView, setActiveView] = useState("home");
  const [gradeFilter, setGradeFilter] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [logFilter, setLogFilter] = useState("全部");
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  useEffect(() => {
    const savedLogin = localStorage.getItem("studentLogin");
    const savedTheme = localStorage.getItem("studentTheme");
    if (savedTheme === "dark") setIsDarkMode(true);
    
    if (savedLogin) {
      const { name, password } = JSON.parse(savedLogin);
      setLoginName(name);
      fetchStudentData(name, password);
    }
  }, []);

  useEffect(() => {
    if (studentData?.classLogs) {
      const filtered = logFilter === "全部" 
        ? studentData.classLogs 
        : studentData.classLogs.filter((log: any) => log.subject === logFilter);
      setExpandedLogId(filtered.length > 0 ? filtered[0].id : null);
    }
  }, [logFilter, studentData]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("studentTheme", newTheme ? "dark" : "light");
  };

  const theme = {
    bg: isDarkMode ? "linear-gradient(135deg, #0f172a 0%, #020617 100%)" : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    bodyBg: isDarkMode ? "#020617" : "#f1f5f9", 
    card: isDarkMode ? "#1e293b" : "#ffffff",
    inputBg: isDarkMode ? "rgba(15, 23, 42, 0.6)" : "rgba(241, 245, 249, 0.6)",
    textMain: isDarkMode ? "#f8fafc" : "#1e293b",
    textMuted: isDarkMode ? "#94a3b8" : "#64748b",
    border: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
    primary: isDarkMode ? "#38bdf8" : "#0ea5e9",
    danger: isDarkMode ? "#f87171" : "#ef4444",
    success: isDarkMode ? "#34d399" : "#10b981",
    pillBg: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
    navBg: isDarkMode ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.85)",
    shadow: isDarkMode ? "0 10px 40px rgba(0,0,0,0.5)" : "0 10px 40px rgba(14, 165, 233, 0.05)",
  };

  const fetchStudentData = async (name: string, password: string) => {
    setLoading(true);
    const { data: student } = await supabase.from("students").select("*")
      .eq("name", name.trim()).eq("password", password.trim()).single();
    
    if (!student) {
      setLoading(false);
      localStorage.removeItem("studentLogin");
      return alert("登入失敗");
    }

    localStorage.setItem("studentLogin", JSON.stringify({ name, password }));

    const { data: classLogs } = await supabase.from("class_logs").select("*").eq("student_name", student.name).order("class_date", { ascending: false }).limit(40);
    const { data: grades } = await supabase.from("grades").select("*").eq("student_name", student.name).order("exam_date", { ascending: false });
    const { data: points } = await supabase.from("point_logs").select("*").eq("student_name", student.name).order("created_at", { ascending: false });
    const { data: rates } = await supabase.from("subject_rates").select("*").eq("student_name", student.name);

    const { data: manualEvents } = await supabase.from("calendar_events").select("*").or(`student_name.eq.${student.name},student_name.eq.全體`);
    setCalendarEvents(manualEvents || []);

    let totalFee = 0;
    let tDetails: any[] = [];
    
    if (classLogs && rates) {
        const rateMap: Record<string, number> = {};
        rates.forEach((r: any) => rateMap[r.subject] = r.rate);
        
        classLogs.forEach((log: any) => {
            if (log.class_date && log.class_date.startsWith(currentMonth)) {
                const sub = log.subject || "數學";
                const rate = rateMap[sub] || 0;
                const extra = log.expense || 0; 
                const fee = (log.duration * rate) + extra; 
                totalFee += fee;
                tDetails.push({ ...log, fee, rate, extra });
            }
        });
    }

    const subjects = Array.from(new Set(grades?.map((g: any) => g.subject))) as string[];
    if (subjects.length > 0) setGradeFilter(subjects[0]);

    setStudentData({
      info: student,
      classLogs: classLogs || [],
      grades: grades || [],
      points: points || [],
      totalPoints: points?.reduce((sum: number, p: any) => sum + p.points, 0) || 0,
      availableSubjects: subjects,
      logSubjects: ["全部", ...Array.from(new Set(classLogs?.map((l: any) => l.subject)))]
    });
    setTuitionTotal(totalFee);
    setTuitionDetails(tDetails);
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginName.trim() || !loginPassword.trim()) return alert("請輸入姓名和密碼");
    fetchStudentData(loginName, loginPassword);
  };

  const handleLogout = () => {
    localStorage.removeItem("studentLogin");
    setStudentData(null);
    setLoginName("");
    setLoginPassword("");
    setActiveView("home");
  };

  const getEventsForDate = (dateStr: string) => {
    const currentCellDate = new Date(dateStr);
    const dayOfWeek = currentCellDate.getDay(); 

    const activeManualEvents = calendarEvents.filter(ev => {
      const start = ev.event_date;
      if (!ev.is_recurring) {
        const end = ev.end_date || ev.event_date;
        return dateStr >= start && dateStr <= end;
      }
      if (ev.is_recurring && ev.recurring_pattern === 'weekly') {
        if (dateStr < start) return false;
        if (ev.recurring_end_date && dateStr > ev.recurring_end_date) return false;
        return dayOfWeek === new Date(start).getDay();
      }
      return false;
    });

    const isCancelledDay = activeManualEvents.some(ev => ev.type === 'cancellation');
    const dayEvents: any[] = [];

    if (!isCancelledDay && studentData?.info?.weekly_schedule) {
        const fixedClasses = studentData.info.weekly_schedule.filter((item: any) => item.day === dayOfWeek);
        fixedClasses.forEach((c: any) => {
            dayEvents.push({ title: `${c.subject} (固定)`, time: c.time, type: 'class', isCancelled: false });
        });
    }

    activeManualEvents.filter(ev => ev.type !== 'cancellation').forEach(ev => {
        const isSingleCancelled = ev.cancelled_dates?.includes(dateStr);
        let timeStr = "";
        if (ev.start_time) {
            timeStr = ev.end_time ? `${ev.start_time}~${ev.end_time}` : ev.start_time;
        }
        dayEvents.push({ title: ev.title, type: ev.type, time: timeStr, isCancelled: isSingleCancelled });
    });

    activeManualEvents.filter(ev => ev.type === 'cancellation').forEach(ev => {
         dayEvents.push({ title: ev.title || '停課', type: 'cancellation', isCancelled: true });
    });

    return dayEvents;
  };

  const globalContainerStyle: React.CSSProperties = { minHeight: "100vh", background: theme.bg, transition: "background 0.5s ease", color: theme.textMain, fontFamily: "sans-serif" };
  const cardStyle: React.CSSProperties = { background: theme.card, padding: "20px", borderRadius: "20px", borderTop: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, borderLeft: `1px solid ${theme.border}`, boxShadow: theme.shadow, transition: "all 0.3s ease" };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "14px 14px 14px 45px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.textMain, fontSize: "16px", outline: "none", boxSizing: "border-box", transition: "0.3s" };
  const filterBtnStyle = (active: boolean, colorStr: string = theme.primary): React.CSSProperties => ({ padding: "8px 18px", borderRadius: "20px", border: `1px solid ${active ? colorStr : theme.border}`, background: active ? colorStr : theme.inputBg, color: active ? "#ffffff" : theme.textMuted, fontSize: "13px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s ease", boxShadow: active ? `0 4px 12px ${colorStr}40` : "none" });

  if (!studentData) return (
    <div style={{ ...globalContainerStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <style jsx global>{` body { background-color: ${theme.bodyBg}; margin: 0; transition: background-color 0.5s ease; } `}</style>
      <button onClick={toggleTheme} style={{ position: "absolute", top: 20, right: 20, background: theme.card, border: `1px solid ${theme.border}`, padding: "10px", borderRadius: "50%", color: theme.textMain, cursor: "pointer", boxShadow: theme.shadow }}>{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
      <div style={{ ...cardStyle, width: "100%", maxWidth: "360px", textAlign: "center" }}>
        <h1 style={{ color: theme.primary, fontSize: "28px", marginBottom: "10px", fontWeight: "900" }}>🎒 學習儀表板</h1>
        <p style={{ color: theme.textMuted, marginBottom: "30px", fontSize: "14px" }}>登入以查詢專屬進度與成績</p>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div style={{ position: "relative" }}><User size={18} style={{ position: "absolute", left: "15px", top: "16px", color: theme.textMuted }} /><input type="text" placeholder="學生姓名" value={loginName} onChange={e => setLoginName(e.target.value)} style={inputStyle} /></div>
          <div style={{ position: "relative" }}><Lock size={18} style={{ position: "absolute", left: "15px", top: "16px", color: theme.textMuted }} /><input type="password" placeholder="密碼 (預設 1234)" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={inputStyle} /></div>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: theme.primary, color: "#ffffff", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginTop: "10px", transition: "0.2s", boxShadow: `0 4px 15px ${theme.primary}50` }}>{loading ? "讀取中..." : "登入"}</button>
        </form>
        <div style={{ marginTop: "25px", borderTop: `1px solid ${theme.border}`, paddingTop: "20px" }}>
           <button onClick={() => window.location.href = '/admin'} style={{ background: "transparent", color: theme.textMuted, border: "none", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: "8px", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.color = theme.primary} onMouseOut={(e) => e.currentTarget.style.color = theme.textMuted}>👨‍🏫 我是老師，切換至後台</button>
        </div>
      </div>
    </div>
  );

  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
  const blanks = Array(firstDayIndex).fill(null);
  const daysInMonth = Array.from({ length: totalDays }, (_, i) => i + 1);
  const calendarCells = [...blanks, ...daysInMonth];

  const getFilteredGrades = () => studentData.grades.filter((g: any) => g.subject === gradeFilter);
  const currentChartData = [...getFilteredGrades()].reverse().map((g: any) => ({ date: g.exam_date, score: g.score }));
  const currentAvg = Math.round(getFilteredGrades().reduce((acc:any, curr:any) => acc + curr.score, 0) / (getFilteredGrades().length || 1));

  return (
    <div style={{ ...globalContainerStyle, paddingBottom: "100px" }}>
      <style jsx global>{` body { background-color: ${theme.bodyBg}; margin: 0; transition: background-color 0.5s ease; } `}</style>

      <div style={{ maxWidth: "650px", margin: "auto", padding: "20px" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div>
             <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "900", color: theme.textMain }}>👋 {studentData.info.name}</h2>
             <p style={{ margin: "5px 0 0 0", color: theme.textMuted, fontSize: "13px" }}>分數無法決定價值，只有你自己可以</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
             <button onClick={toggleTheme} style={{ background: theme.card, border: `1px solid ${theme.border}`, padding: "10px", borderRadius: "50%", color: theme.textMain, cursor: "pointer", boxShadow: theme.shadow, transition: "0.2s" }}>{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
             <button onClick={handleLogout} style={{ background: theme.card, border: `1px solid ${theme.border}`, padding: "10px", borderRadius: "50%", color: theme.danger, cursor: "pointer", boxShadow: theme.shadow, transition: "0.2s" }}><LogOut size={18} /></button>
          </div>
        </div>

        {activeView === "home" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
              <h3 style={{ fontSize: "18px", margin: "0 0 15px 0", fontWeight: "bold", color: theme.textMain }}>📌 快速功能導覽</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "30px" }}>
                  <div onClick={() => setActiveView("class")} style={{ ...cardStyle, cursor: "pointer", borderLeftWidth: "5px", borderLeftColor: COLORS["英文"] }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}><div style={{ fontWeight: "bold", fontSize: "16px", color: theme.textMain }}>上課紀錄</div><BookOpen size={20} color={COLORS["英文"]} /></div>
                      <div style={{ fontSize: "12px", color: theme.textMuted }}>追蹤作業與進度</div>
                  </div>
                  <div onClick={() => setActiveView("grade")} style={{ ...cardStyle, cursor: "pointer", borderLeftWidth: "5px", borderLeftColor: COLORS["數學"] }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}><div style={{ fontWeight: "bold", fontSize: "16px", color: theme.textMain }}>成績分析</div><TrendingUp size={20} color={COLORS["數學"]} /></div>
                      <div style={{ fontSize: "12px", color: theme.textMuted }}>各科走勢圖表</div>
                  </div>
                  <div onClick={() => setActiveView("tuition")} style={{ ...cardStyle, cursor: "pointer", borderLeftWidth: "5px", borderLeftColor: COLORS["理化"] }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}><div style={{ fontWeight: "bold", fontSize: "16px", color: theme.textMain }}>學費明細</div><FileText size={20} color={COLORS["理化"]} /></div>
                      <div style={{ fontSize: "12px", color: theme.textMuted }}>本月應繳查詢</div>
                  </div>
                  <div onClick={() => setActiveView("points")} style={{ ...cardStyle, cursor: "pointer", borderLeftWidth: "5px", borderLeftColor: COLORS["國文"] }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}><div style={{ fontWeight: "bold", fontSize: "16px", color: theme.textMain }}>獎勵點數</div><Coins size={20} color={COLORS["國文"]} /></div>
                      <div style={{ fontSize: "12px", color: theme.textMuted }}>累積: {studentData.totalPoints} 點</div>
                  </div>
              </div>

              <div style={{ ...cardStyle, padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                      <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "900", display: "flex", alignItems: "center", gap: "8px", color: theme.textMain }}>
                          <Calendar size={20} color={theme.primary} /> 🗓️ 專屬行事曆
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontWeight: "bold", fontSize: "15px", color: theme.textMain }}>{calYear} 年 {calMonth + 1} 月</span>
                          <div style={{ display: "flex", gap: "5px" }}>
                              <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else { setCalMonth(calMonth - 1); } }} style={{ background: theme.inputBg, border: "none", padding: "6px 10px", borderRadius: "8px", color: theme.textMain, cursor: "pointer" }}><ChevronLeft size={16} /></button>
                              <button onClick={() => { setCalYear(new Date().getFullYear()); setCalMonth(new Date().getMonth()); }} style={{ background: theme.inputBg, border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", color: theme.textMain, fontWeight: "bold", cursor: "pointer" }}>今天</button>
                              <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else { setCalMonth(calMonth + 1); } }} style={{ background: theme.inputBg, border: "none", padding: "6px 10px", borderRadius: "8px", color: theme.textMain, cursor: "pointer" }}><ChevronRight size={16} /></button>
                          </div>
                      </div>
                  </div>

                  {/* ★ 手機版防跑版：加入可水平滑動的容器限制最小寬度 */}
                  <div style={{ overflowX: "auto", paddingBottom: "10px", WebkitOverflowScrolling: "touch" }}>
                    <div style={{ minWidth: "600px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: "10px", fontWeight: "bold", fontSize: "12px", color: theme.textMuted }}>
                          {WEEK_DAYS.map(d => <div key={d} style={{ padding: "5px 0" }}>{d}</div>)}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
                          {calendarCells.map((day, idx) => {
                              if (day === null) return <div key={`blank-${idx}`} style={{ minHeight: "75px", background: "transparent" }} />;
                              
                              const monthStr = String(calMonth + 1).padStart(2, '0');
                              const dayStr = String(day).padStart(2, '0');
                              const dateKey = `${calYear}-${monthStr}-${dayStr}`;
                              const dayEvents = getEventsForDate(dateKey);
                              const isToday = new Date().toISOString().slice(0, 10) === dateKey;

                              return (
                                  <div key={dateKey} style={{ minHeight: "75px", background: theme.inputBg, borderRadius: "12px", padding: "6px", display: "flex", flexDirection: "column", gap: "4px", border: isToday ? `2px solid ${theme.primary}` : `1px solid ${theme.border}` }}>
                                      <div style={{ display: "flex", justifyContent: "center" }}>
                                          <span style={{ fontSize: "12px", fontWeight: "bold", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: isToday ? theme.primary : "transparent", color: isToday ? "#ffffff" : theme.textMain }}>
                                              {day}
                                          </span>
                                      </div>
                                      <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
                                          {dayEvents.map((ev, eIdx) => {
                                              let bgColor = theme.primary;
                                              if (ev.isCancelled) bgColor = isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
                                              else if (ev.type === 'exam') bgColor = theme.danger;
                                              else if (ev.title && COLORS[ev.title.split(' ')[0]]) bgColor = COLORS[ev.title.split(' ')[0]];

                                              return (
                                                  <div key={eIdx} style={{ fontSize: "10px", padding: "3px 5px", borderRadius: "4px", background: bgColor, color: ev.isCancelled ? theme.textMuted : "#ffffff", textDecoration: ev.isCancelled ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "2px" }}>
                                                      {ev.isCancelled ? `❌ ${ev.title}` : `${ev.time ? '[' + ev.time + '] ' : ''}${ev.title}`}
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                    </div>
                  </div>
              </div>
          </div>
        )}

        {/* 上課紀錄 */}
        {activeView === "class" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: theme.textMain }}>📖 上課紀錄</h3>
              </div>
              
              <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "15px", marginBottom: "10px", scrollbarWidth: "none" }}>
                  <div style={{display: "flex", alignItems: "center", color: theme.textMuted, marginRight: "5px"}}><Filter size={16}/></div>
                  {studentData.logSubjects.map((sub: string) => (
                      <button key={sub} onClick={() => setLogFilter(sub)} style={filterBtnStyle(logFilter === sub, sub === "全部" ? theme.primary : COLORS[sub])}>{sub}</button>
                  ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  {studentData.classLogs.filter((l:any) => logFilter === "全部" || l.subject === logFilter).map((log: any) => {
                      const isExpanded = expandedLogId === log.id;
                      const subColor = COLORS[log.subject] || theme.primary;
                      return (
                      <div key={log.id} style={{ ...cardStyle, padding: "0", overflow: "hidden", borderLeftWidth: "6px", borderLeftColor: subColor }}>
                          <div onClick={() => setExpandedLogId(isExpanded ? null : log.id)} style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: isExpanded ? theme.inputBg : theme.card }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}><span style={{ fontSize: "13px", background: `${subColor}20`, color: subColor, padding: "6px 12px", borderRadius: "10px", fontWeight: "bold" }}>{log.subject}</span><span style={{ fontWeight: "bold", color: theme.textMain, fontSize: "15px" }}>{log.class_date}</span></div>
                              {isExpanded ? <ChevronUp size={20} color={theme.textMuted}/> : <ChevronDown size={20} color={theme.textMuted}/>}
                          </div>
                          <div style={{ display: "grid", gridTemplateRows: isExpanded ? "1fr" : "0fr", transition: "grid-template-rows 0.3s ease-out", background: theme.inputBg }}>
                              <div style={{ overflow: "hidden" }}>
                                  <div style={{ padding: "0 20px 20px 20px" }}>
                                      <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: "20px" }}>
                                          {log.expense > 0 && <div style={{fontSize: "13px", color: theme.danger, fontWeight: "bold", marginBottom: "12px", display: "flex", alignItems: "center", gap: "5px"}}><DollarSign size={14}/> 雜費: {log.expense}</div>}
                                          <div style={{ fontSize: "15px", color: theme.textMain, marginBottom: "15px", lineHeight: "1.7" }}>{log.progress}</div>
                                          {(log.homework || log.note) && (
                                          <div style={{ background: theme.card, padding: "18px", borderRadius: "16px", border: `1px solid ${theme.border}`, boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
                                              {log.homework && (
                                                  <div style={{ display: "flex", gap: "12px", marginBottom: log.note ? "15px" : "0", alignItems: "flex-start" }}>
                                                      <div style={{ background: theme.pillBg, padding: "10px", borderRadius: "12px" }}><BookOpen size={18} style={{ color: theme.primary }} /></div>
                                                      <div><div style={{ fontSize: "12px", color: theme.textMuted, fontWeight: "bold", marginBottom: "4px" }}>回家作業</div><div style={{ color: theme.textMain, fontSize: "14px", lineHeight: "1.5" }}>{log.homework}</div></div>
                                                  </div>
                                              )}
                                              {log.note && (
                                                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginTop: log.homework ? "15px" : "0", paddingTop: log.homework ? "15px" : "0", borderTop: log.homework ? `1px dashed ${theme.border}` : "none" }}>
                                                      <div style={{ background: theme.pillBg, padding: "10px", borderRadius: "12px" }}><MessageSquare size={18} style={{ color: theme.success }} /></div>
                                                      <div><div style={{ fontSize: "12px", color: theme.textMuted, fontWeight: "bold", marginBottom: "4px" }}>老師叮嚀</div><div style={{ color: theme.textMain, fontSize: "14px", lineHeight: "1.5" }}>{log.note}</div></div>
                                                  </div>
                                              )}
                                          </div>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )})}
                  {studentData.classLogs.filter((l:any) => logFilter === "全部" || l.subject === logFilter).length === 0 && <div style={{textAlign: "center", padding: "40px", color: theme.textMuted}}>尚無紀錄</div>}
              </div>
          </div>
        )}

        {/* 成績分析 */}
        {activeView === "grade" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}><h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: theme.textMain }}>📝 成績分析</h3>{gradeFilter && <div style={{ fontSize: "14px", fontWeight: "bold", background: theme.card, border: `1px solid ${theme.border}`, padding: "6px 14px", borderRadius: "20px", boxShadow: theme.shadow }}>總平均：<span style={{ color: COLORS[gradeFilter] || theme.primary, fontSize: "16px" }}>{currentAvg}</span> 分</div>}</div>
              <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "10px", marginBottom: "15px" }}>{studentData.availableSubjects.map((sub: any) => (<button key={sub} onClick={() => setGradeFilter(sub)} style={filterBtnStyle(gradeFilter === sub, COLORS[sub])}>{sub}</button>))}</div>
              {currentChartData.length > 0 ? (
                <>
                  <div style={{ ...cardStyle, height: "260px", padding: "20px 10px 0 0", marginBottom: "20px" }}>
                      <ResponsiveContainer width="100%" height="100%"><LineChart data={currentChartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} /><XAxis dataKey="date" tick={{fontSize: 10, fill: theme.textMuted}} stroke={theme.border} /><YAxis domain={[0, 100]} tick={{fontSize: 10, fill: theme.textMuted}} stroke={theme.border} /><Tooltip contentStyle={{backgroundColor: theme.card, borderColor: theme.border, color: theme.textMain, borderRadius: "12px", boxShadow: theme.shadow}} itemStyle={{color: theme.textMain}} /><Line type="monotone" dataKey="score" stroke={COLORS[gradeFilter]} strokeWidth={4} dot={{r:6, fill: theme.card, strokeWidth: 2}} /></LineChart></ResponsiveContainer>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>{getFilteredGrades().map((g: any) => (<div key={g.id} style={{ ...cardStyle, textAlign: "center", borderTopWidth: "4px", borderTopColor: COLORS[g.subject] || theme.primary }}><div style={{ fontSize: "12px", color: theme.textMuted, marginBottom: "8px" }}>{g.exam_date}</div><div style={{ fontSize: "15px", fontWeight: "bold", color: theme.textMain }}>{g.subject}</div><div style={{ fontSize: "32px", fontWeight: "900", margin: "10px 0", color: g.score >= 60 ? (COLORS[g.subject] || theme.primary) : theme.danger }}>{g.score}</div><div style={{ fontSize: "12px", color: theme.textMuted }}>{g.unit}</div></div>))}</div>
                </>
              ) : <div style={{...cardStyle, textAlign: "center", padding: "40px", color: theme.textMuted}}>尚無資料紀錄</div>}
          </div>
        )}

        {/* 學費明細 */}
        {activeView === "tuition" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
               <h3 style={{ margin: "0 0 15px 0", fontSize: "18px", fontWeight: "bold", color: theme.textMain }}>💰 本月學費明細</h3>
               <div style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, #0284c7 100%)`, color: "#ffffff", padding: "40px 20px", borderRadius: "24px", marginBottom: "25px", textAlign: "center", boxShadow: `0 15px 35px ${theme.primary}40` }}>
                   <div style={{ fontSize: "15px", opacity: 0.9, marginBottom: "8px" }}>{currentMonth} 應繳總額</div>
                   <div style={{ fontSize: "52px", fontWeight: "900", letterSpacing: "1px" }}>${tuitionTotal.toLocaleString()}</div>
               </div>
               <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                   <div style={{ padding: "20px", background: theme.inputBg, borderBottom: `1px solid ${theme.border}`, fontWeight: "bold", fontSize: "14px", color: theme.textMuted }}>計算明細 ({tuitionDetails.length} 筆)</div>
                   {tuitionDetails.length > 0 ? tuitionDetails.map((item: any, idx: number) => (
                       <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "20px", background: theme.card, borderBottom: idx !== tuitionDetails.length - 1 ? `1px solid ${theme.border}` : "none" }}>
                           <div>
                               <div style={{ fontSize: "15px", fontWeight: "bold", color: theme.textMain }}>{item.class_date} <span style={{fontSize: "12px", color: theme.textMuted, fontWeight: "normal"}}>({item.subject})</span></div>
                               <div style={{ fontSize: "13px", color: theme.textMuted, marginTop: "6px" }}>
                                  {item.duration} hr × ${item.rate}/hr
                                  {item.extra > 0 && <span style={{color: theme.danger, fontWeight: "bold", marginLeft: "6px"}}>+ 雜費 {item.extra}</span>}
                               </div>
                           </div>
                           <div style={{ fontWeight: "bold", color: theme.textMain, fontSize: "18px" }}>${item.fee}</div>
                       </div>
                   )) : <div style={{ padding: "40px", textAlign: "center", color: theme.textMuted, background: theme.card }}>本月尚無上課紀錄</div>}
               </div>
          </div>
        )}

        {/* 點數紀錄 */}
        {activeView === "points" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
              <h3 style={{ margin: "0 0 15px 0", fontSize: "18px", fontWeight: "bold", color: theme.textMain }}>💎 點數紀錄</h3>
               <div style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#ffffff", padding: "30px", borderRadius: "24px", marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 15px 35px rgba(245, 158, 11, 0.4)" }}>
                   <div><div style={{ fontSize: "15px", opacity: 0.9, marginBottom: "5px" }}>目前累積</div><div style={{ fontSize: "42px", fontWeight: "900" }}>{studentData.totalPoints} <span style={{fontSize: "20px", fontWeight: "normal", opacity: 0.8}}>點</span></div></div>
                   <Award size={56} color="white" style={{ opacity: 0.8 }} />
               </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  {studentData.points.map((point: any) => (
                  <div key={point.id} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px" }}>
                      <div>
                          <div style={{ fontSize: "13px", color: theme.textMuted, marginBottom: "6px" }}>{new Date(point.created_at).toLocaleDateString()}</div>
                          <div style={{ fontSize: "16px", fontWeight: "bold", color: theme.textMain }}>{point.reason}</div>
                      </div>
                      <div style={{ fontSize: "24px", fontWeight: "900", color: point.points > 0 ? theme.success : theme.danger }}>{point.points > 0 ? "+" : ""}{point.points}</div>
                  </div>
                  ))}
                  {studentData.points.length === 0 && <div style={{textAlign: "center", color: theme.textMuted, padding: "40px"}}>目前無點數紀錄</div>}
              </div>
          </div>
        )}

      </div>
      
      {/* 底部導覽列 */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: theme.navBg, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-around", padding: "15px 0 25px 0", zIndex: 100, boxShadow: theme.shadow }}>
         <button onClick={() => setActiveView("home")} style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", color: activeView === "home" ? theme.primary : theme.textMuted, cursor: "pointer", flex: 1, fontWeight: activeView === "home" ? "bold" : "normal", transition: "0.2s", transform: activeView === "home" ? "scale(1.1)" : "scale(1)" }}><Home size={22} /><span style={{fontSize: "11px", marginTop: "6px"}}>首頁</span></button>
         <button onClick={() => setActiveView("class")} style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", color: activeView === "class" ? theme.primary : theme.textMuted, cursor: "pointer", flex: 1, fontWeight: activeView === "class" ? "bold" : "normal", transition: "0.2s", transform: activeView === "class" ? "scale(1.1)" : "scale(1)" }}><BookOpen size={22} /><span style={{fontSize: "11px", marginTop: "6px", whiteSpace: "nowrap"}}>紀錄</span></button>
         <button onClick={() => setActiveView("grade")} style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", color: activeView === "grade" ? theme.primary : theme.textMuted, cursor: "pointer", flex: 1, fontWeight: activeView === "grade" ? "bold" : "normal", transition: "0.2s", transform: activeView === "grade" ? "scale(1.1)" : "scale(1)" }}><TrendingUp size={22} /><span style={{fontSize: "11px", marginTop: "6px"}}>成績</span></button>
         <button onClick={() => setActiveView("tuition")} style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", color: activeView === "tuition" ? theme.primary : theme.textMuted, cursor: "pointer", flex: 1, fontWeight: activeView === "tuition" ? "bold" : "normal", transition: "0.2s", transform: activeView === "tuition" ? "scale(1.1)" : "scale(1)" }}><DollarSign size={22} /><span style={{fontSize: "11px", marginTop: "6px"}}>帳單</span></button>
         <button onClick={() => setActiveView("points")} style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", color: activeView === "points" ? theme.primary : theme.textMuted, cursor: "pointer", flex: 1, fontWeight: activeView === "points" ? "bold" : "normal", transition: "0.2s", transform: activeView === "points" ? "scale(1.1)" : "scale(1)" }}><Coins size={22} /><span style={{fontSize: "11px", marginTop: "6px"}}>點數</span></button>
      </div>

      <style jsx>{` @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } ::-webkit-scrollbar { width: 0px; background: transparent; } `}</style>
    </div>
  );
}