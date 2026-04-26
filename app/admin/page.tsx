"use client";

import { useState, useEffect } from "react";
import { LogOut, Pencil, Trash2, User, Lock, BookOpen, MessageSquare, TrendingUp, Filter, Clock, DollarSign, Copy, Check, FileText, Sun, Moon, Home, Coins, UserPlus, GraduationCap, Users, X, AlertTriangle } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const supabaseUrl = "https://ynkvxixhiwwnocqybprs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlua3Z4aXhoaXd3bm9jcXlicHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDM5MzYsImV4cCI6MjA4MjA3OTkzNn0.9Z_SKdFXQOrZXEHT4J4wkSXBpt097tOuuXI6IFJN_FA";
const supabase = createClient(supabaseUrl, supabaseKey);

const SUBJECTS = ["國文", "英文", "數學", "理化", "生物", "地科", "歷史", "地理", "公民"];
const COLORS: Record<string, string> = {
  "國文": "#ef4444", "英文": "#f59e0b", "數學": "#10b981",
  "理化": "#3b82f6", "生物": "#8b5cf6", "地科": "#ec4899",
  "歷史": "#6366f1", "地理": "#14b8a6", "公民": "#f97316"
};

const BANK_ACCOUNT = "（822） 129541918532"; 

interface HistoryListProps {
  data: any[];
  type: string;
  onEdit: (item: any) => void;
  onDelete: (id: number, info: string) => void;
  theme: any;
  isDarkMode: boolean;
}

export default function AdminPage() {
  const [currentTeacher, setCurrentTeacher] = useState<any>(null);
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [activeTab, setActiveTab] = useState("class");
  const [loading, setLoading] = useState(false);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [selectedName, setSelectedName] = useState(""); 
  const [editingId, setEditingId] = useState<number | null>(null); 
  const [historyData, setHistoryData] = useState<any[]>([]); 
  const [historyFilter, setHistoryFilter] = useState("全部");
  const [isMobile, setIsMobile] = useState(false);

  const [subject, setSubject] = useState(SUBJECTS[2]);
  const [score, setScore] = useState("");
  const [examDate, setExamDate] = useState("");
  const [unit, setUnit] = useState(""); 
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  
  const [classDate, setClassDate] = useState(new Date().toISOString().slice(0, 10));
  const [progress, setProgress] = useState("");
  const [homework, setHomework] = useState("");
  const [note, setNote] = useState("");
  const [duration, setDuration] = useState("1.5");
  const [expense, setExpense] = useState(""); 

  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("1234");
  const [newStudentSchool, setNewStudentSchool] = useState("");
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);

  const [tuitionMonth, setTuitionMonth] = useState(new Date().toISOString().slice(0, 7));
  const [tuitionDetails, setTuitionDetails] = useState<any[]>([]);
  const [subjectRates, setSubjectRates] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]); 
  const [gradeFilter, setGradeFilter] = useState("數學"); 
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  
  const [billingText, setBillingText] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("teacherName");
    const savedTheme = localStorage.getItem("teacherTheme");
    if (savedTheme === "dark") setIsDarkMode(true);
    fetchStudents();
    if (saved) setCurrentTeacher({ name: saved });
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (currentTeacher && selectedName) {
      resetForm();
      setHistoryFilter("全部");
      fetchHistoryData();
      fetchRates();
      if (activeTab === "view") fetchStudentDetails();
    }
  }, [selectedName, activeTab, currentTeacher]);

  useEffect(() => {
    if (currentTeacher && selectedName) fetchHistoryData();
  }, [historyFilter]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("teacherTheme", newTheme ? "dark" : "light");
  };

  const theme = {
    bg: isDarkMode ? "linear-gradient(135deg, #0f172a 0%, #020617 100%)" : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    bodyBg: isDarkMode ? "#020617" : "#f1f5f9",
    card: isDarkMode ? "#1e293b" : "#ffffff",
    activeControl: isDarkMode ? "#0f172a" : "#ffffff", 
    inputBg: isDarkMode ? "rgba(15, 23, 42, 0.6)" : "rgba(241, 245, 249, 0.6)",
    textMain: isDarkMode ? "#f8fafc" : "#1e293b",
    textMuted: isDarkMode ? "#94a3b8" : "#64748b",
    border: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
    glowBorder: isDarkMode ? "rgba(56, 189, 248, 0.2)" : "rgba(14, 165, 233, 0.15)",
    primary: isDarkMode ? "#38bdf8" : "#0ea5e9",
    danger: isDarkMode ? "#f87171" : "#ef4444",
    success: isDarkMode ? "#34d399" : "#10b981",
    pillBg: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
    navBg: isDarkMode ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.85)",
    shadow: isDarkMode ? "0 10px 40px rgba(0,0,0,0.5)" : "0 8px 25px rgba(14, 165, 233, 0.08)",
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from("students").select("*").order("name");
    if (data && data.length > 0) {
      setStudentList(data);
      if (!selectedName) setSelectedName(data[0].name);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return alert("請輸入學生姓名");
    setLoading(true);
    const payload = { name: newStudentName, password: newStudentPassword, school: newStudentSchool };
    const { error } = editingStudentId 
      ? await supabase.from("students").update(payload).eq("id", editingStudentId)
      : await supabase.from("students").insert([payload]);
    setLoading(false);
    if (error) { alert("儲存失敗: " + error.message); } 
    else { alert(editingStudentId ? "✨ 修改成功！" : "🎉 學生新增成功！"); resetStudentForm(); fetchStudents(); }
  };

  const resetStudentForm = () => { setNewStudentName(""); setNewStudentSchool(""); setNewStudentPassword("1234"); setEditingStudentId(null); };
  const handleEditStudentClick = (s: any) => { setEditingStudentId(s.id); setNewStudentName(s.name); setNewStudentPassword(s.password); setNewStudentSchool(s.school || ""); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleDeleteStudent = async (id: number, name: string) => {
    const confirmMsg = `❗【刪除警告】❗\n\n確定要永久刪除學生「${name}」的帳號嗎？\n\n此動作無法復原！`;
    if (!window.confirm(confirmMsg)) return;
    setLoading(true);
    const { error } = await supabase.from("students").delete().eq("id", id);
    setLoading(false);
    if (error) alert("刪除失敗: " + error.message);
    else { alert("✅ 已移除"); fetchStudents(); if (selectedName === name) setSelectedName(studentList[0]?.name || ""); }
  };

  const fetchRates = async () => {
    const { data } = await supabase.from("subject_rates").select("*").eq("student_name", selectedName);
    setSubjectRates(data || []);
  };

  const fetchHistoryData = async () => {
    let tableName = activeTab === "class" ? "class_logs" : activeTab === "grade" ? "grades" : "point_logs";
    if (activeTab === "view" || activeTab === "tuition" || activeTab === "student") tableName = "class_logs"; 
    let query = supabase.from(tableName).select("*").eq("student_name", selectedName);
    if (historyFilter !== "全部" && (activeTab === "class" || activeTab === "grade")) { query = query.eq("subject", historyFilter); }
    const { data } = await query.order("created_at", { ascending: false }).limit(20);
    setHistoryData(data || []);
  };

  const fetchStudentDetails = async () => {
    const { data: grades } = await supabase.from("grades").select("*").eq("student_name", selectedName).order("exam_date", { ascending: false });
    if (grades) {
      setChartData(grades);
      const subjects = Array.from(new Set(grades.map((g: any) => g.subject))) as string[];
      setAvailableSubjects(subjects);
      if (subjects.length > 0 && !subjects.includes(gradeFilter)) setGradeFilter(subjects[0]);
    }
  };

  const getProcessedChartData = () => {
    const list = chartData.filter((g: any) => g.subject === gradeFilter);
    if (list.length === 0) return [];
    return [...list].sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()).map((g:any) => ({ date: g.exam_date, score: g.score }));
  };
  const getSubjectAverage = () => {
    const list = chartData.filter((g: any) => g.subject === gradeFilter);
    if (list.length === 0) return 0;
    return Math.round(list.reduce((acc: number, curr: any) => acc + curr.score, 0) / list.length);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data } = await supabase.from("teachers").select("*").eq("name", loginName.trim()).eq("password", loginPassword.trim()).single();
    setLoading(false);
    if (data) { setCurrentTeacher(data); localStorage.setItem("teacherName", data.name); } 
    else alert("❌ 登入失敗");
  };

  const handleLogout = () => { localStorage.removeItem("teacherName"); setCurrentTeacher(null); };
  const resetForm = () => { setEditingId(null); setScore(""); setUnit(""); setPoints(""); setReason(""); setProgress(""); setHomework(""); setNote(""); setExpense(""); setBillingText(""); };

  const handleSubmit = async (e: React.FormEvent, type: string) => {
    e.preventDefault();
    setLoading(true);
    let tableName = type === "class" ? "class_logs" : type === "grade" ? "grades" : "point_logs";
    let payload: any = { student_name: selectedName };
    if (type === "class") { payload = { ...payload, class_date: classDate, progress, homework, note, duration: Number(duration), subject, expense: Number(expense) || 0 }; }
    else if (type === "grade") payload = { ...payload, subject, score: Number(score), exam_date: examDate, unit };
    else if (type === "point") payload = { ...payload, points: Number(points), reason };
    const { error } = editingId ? await supabase.from(tableName).update(payload).eq("id", editingId) : await supabase.from(tableName).insert([payload]);
    setLoading(false);
    if (error) alert(error.message);
    else { alert("🎉 儲存成功！"); resetForm(); fetchHistoryData(); if(activeTab==="view") fetchStudentDetails(); }
  };

  const handleTuitionCheck = async () => {
    setLoading(true);
    const { data: classes } = await supabase.from("class_logs").select("*").eq("student_name", selectedName).ilike("class_date", `${tuitionMonth}%`).order("class_date", { ascending: true });
    const { data: rates = [] } = await supabase.from("subject_rates").select("*").eq("student_name", selectedName);
    setLoading(false);
    setBillingText(""); 
    if (!classes || classes.length === 0) { setTuitionDetails([]); return alert("⚠️ 無紀錄"); }
    const rateMap: Record<string, number> = {};
    rates?.forEach(r => rateMap[r.subject] = r.rate);
    const details = classes.map(c => {
        const sub = c.subject || "數學";
        const rate = rateMap[sub] || 0;
        const extra = c.expense || 0;
        const total = (Number(c.duration) * rate) + extra; 
        return { ...c, rate, total, extra };
    });
    setTuitionDetails(details);
  };

  const updateSubjectRate = async (sub: string, newRate: number) => {
    await supabase.from("subject_rates").upsert({ student_name: selectedName, subject: sub, rate: newRate }, { onConflict: 'student_name,subject' });
    fetchRates();
  };

  const generateBillingText = () => {
    if (tuitionDetails.length === 0) { alert("請先按「計算」取得資料喔！"); return; }
    const month = parseInt(tuitionMonth.split("-")[1], 10);
    const grouped: Record<string, any[]> = {};
    tuitionDetails.forEach(d => {
      const sub = d.subject || "其他";
      if (!grouped[sub]) grouped[sub] = [];
      grouped[sub].push(d);
    });
    let text = `${selectedName}媽媽您好：\n${month}月的課程已經結束囉！\n\n`;
    Object.keys(grouped).forEach(sub => {
      text += `${sub}:\n`;
      grouped[sub].forEach(item => {
        const dObj = new Date(item.class_date);
        const dateStr = `${dObj.getMonth() + 1}/${dObj.getDate()}`;
        const extraText = item.extra > 0 ? ` (+雜費${item.extra})` : "";
        text += `${dateStr} ${item.duration}h${extraText}\n`;
      });
      text += "\n";
    });
    const totalHours = tuitionDetails.reduce((a, b) => a + Number(b.duration), 0);
    const totalCost = tuitionDetails.reduce((a, b) => a + b.total, 0);
    text += `共 ${totalHours}h\n課程費用共 ${totalCost.toLocaleString()} 元\n\n`;
    text += `共 ${totalCost.toLocaleString()} 元，確認無誤後，麻煩媽媽方便的時候幫我匯到以下帳戶：\n${BANK_ACCOUNT}`;
    setBillingText(text);
  };

  const copyToClipboard = () => { navigator.clipboard.writeText(billingText); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); };

  const globalContainerStyle = { minHeight: "100vh", background: theme.bg, transition: "background 0.5s ease", color: theme.textMain, fontFamily: "sans-serif" };
  const inputStyle = { width: "100%", padding: "12px", margin: "6px 0", borderRadius: "10px", border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.textMain, boxSizing: "border-box" as const, transition: "0.2s" };
  const loginInputStyle = { width: "100%", padding: "14px 14px 14px 45px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.textMain, fontSize: "16px", outline: "none", boxSizing: "border-box" as const, transition: "0.3s" };
  const selectStyle = { ...inputStyle, cursor: "pointer" };
  const solidCardStyle = { background: theme.activeControl, padding: "25px", borderRadius: "20px", borderTop: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, borderLeft: `1px solid ${theme.border}`, boxShadow: theme.shadow, marginBottom: "25px", transition: "0.3s ease" };
  const btnStyle = (color: string) => ({ background: color, color: "#ffffff", border: "none", padding: "12px", borderRadius: "10px", cursor: "pointer", width: "100%", marginTop: "10px", fontWeight: "bold", transition: "0.2s" });
  const getTabStyle = (active: boolean, color: string) => ({ flex: 1, padding: "12px", borderRadius: "10px", border: active ? `1px solid ${color}` : `1px solid ${theme.border}`, background: active ? color : theme.inputBg, color: active ? "#fff" : theme.textMuted, fontWeight: "bold", cursor: "pointer", transition: "0.3s" });
  const filterBtnStyle = (active: boolean, colorStr: string = theme.textMain) => ({ padding: "8px 16px", borderRadius: "20px", border: active ? `1px solid ${colorStr}` : `1px solid ${theme.border}`, background: active ? colorStr : theme.activeControl, color: active ? "#ffffff" : theme.textMuted, fontSize: "13px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap" as const, transition: "0.2s" });

  if (!currentTeacher) return (
    <div style={{ ...globalContainerStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <style jsx global>{` body { background-color: ${theme.bodyBg}; margin: 0; transition: background-color 0.5s ease; } `}</style>
      <button onClick={toggleTheme} style={{ position: "absolute", top: 20, right: 20, background: theme.card, border: `1px solid ${theme.border}`, padding: "10px", borderRadius: "50%", color: theme.textMain, cursor: "pointer", boxShadow: theme.shadow }}>{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
      <div style={{ ...solidCardStyle, width: "100%", maxWidth: "360px", textAlign: "center" }}>
        <h1 style={{ color: theme.primary, fontSize: "28px", marginBottom: "10px", fontWeight: "900" }}>🍎 老師登入</h1>
        <p style={{ color: theme.textMuted, marginBottom: "30px", fontSize: "14px" }}>登入以進入教務管理控制台</p>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ position: "relative" }}><User size={18} style={{ position: "absolute", left: "15px", top: "16px", color: theme.textMuted }} /><input type="text" placeholder="帳號" value={loginName} onChange={e => setLoginName(e.target.value)} style={loginInputStyle} /></div>
            <div style={{ position: "relative" }}><Lock size={18} style={{ position: "absolute", left: "15px", top: "16px", color: theme.textMuted }} /><input type="password" placeholder="密碼" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={loginInputStyle} /></div>
            <button type="submit" disabled={loading} style={{ ...btnStyle(theme.primary), padding: "14px", borderRadius: "14px", fontSize: "16px" }}>{loading ? "登入中..." : "登入"}</button>
        </form>
        <div style={{ marginTop: "25px", borderTop: `1px solid ${theme.border}`, paddingTop: "20px" }}>
           <button onClick={() => window.location.href = '/'} style={{ background: "transparent", color: theme.textMuted, border: "none", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: "8px", transition: "0.2s" }}>🎒 我是學生，切換至前台</button>
        </div>
      </div>
    </div>
  );

  // ★ 關鍵修正：在這裡計算圖表與平均數，確保主渲染範圍能抓到
  const currentChartData = getProcessedChartData();
  const currentAvg = getSubjectAverage();

  return (
    <div style={{ ...globalContainerStyle, paddingBottom: "100px" }}>
      <style jsx global>{` body { background-color: ${theme.bodyBg}; margin: 0; transition: background-color 0.5s ease; } `}</style>
      <div style={{ maxWidth: "850px", margin: "auto", padding: "20px" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "26px", color: theme.textMain, fontWeight: "900" }}>👩‍🏫 {currentTeacher.name}</h1>
          <div style={{ display: "flex", gap: "10px" }}>
             <button onClick={toggleTheme} style={{ background: theme.activeControl, border: `1px solid ${theme.border}`, padding: "10px", borderRadius: "50%", color: theme.textMain, cursor: "pointer", boxShadow: theme.shadow }}>{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
             <button onClick={handleLogout} style={{ background: theme.activeControl, border: `1px solid ${theme.border}`, padding: "10px", borderRadius: "50%", color: theme.danger, cursor: "pointer", boxShadow: theme.shadow }}><LogOut size={18} /></button>
          </div>
        </div>
        
        {activeTab !== "student" && (
          <div style={solidCardStyle}>
            <label style={{ fontWeight: "900", display: "block", marginBottom: "12px", color: theme.primary, fontSize: "14px", letterSpacing: "1px" }}>👤 目前正在操作：</label>
            <select value={selectedName} onChange={e => setSelectedName(e.target.value)} style={{ ...selectStyle, background: theme.inputBg, fontSize: "18px", fontWeight: "bold", color: theme.textMain, border: `1px solid ${theme.border}`, padding: "12px 15px" }}>
              {studentList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", marginBottom: "25px", flexWrap: "nowrap", overflowX: "auto", paddingBottom: "10px" }}>
          <button onClick={() => setActiveTab("class")} style={getTabStyle(activeTab === "class", "#10b981")}>📚 上課</button>
          <button onClick={() => setActiveTab("grade")} style={getTabStyle(activeTab === "grade", "#3b82f6")}>📝 成績</button>
          <button onClick={() => setActiveTab("point")} style={getTabStyle(activeTab === "point", "#f59e0b")}>💎 點數</button>
          <button onClick={() => setActiveTab("tuition")} style={getTabStyle(activeTab === "tuition", "#ec4899")}>💰 學費</button>
          <button onClick={() => setActiveTab("view")} style={getTabStyle(activeTab === "view", "#8b5cf6")}>📊 報表</button>
          <button onClick={() => setActiveTab("student")} style={getTabStyle(activeTab === "student", "#0ea5e9")}>👥 學生</button>
        </div>

        {activeTab === "student" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <form onSubmit={handleSaveStudent} style={{...solidCardStyle, position: "relative"}}>
              {editingStudentId && <button onClick={resetStudentForm} style={{position:"absolute", right:15, top:15, background:"none", border:"none", color:theme.textMuted, cursor:"pointer"}}><X size={20}/></button>}
              <h3 style={{color: theme.textMain, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px"}}>
                {editingStudentId ? <Pencil size={20} color={theme.primary}/> : <UserPlus size={20}/>} 
                {editingStudentId ? "編輯學生資料" : "新增學生帳號"}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div style={{position:"relative"}}><User size={16} style={{position:"absolute", left:12, top:16, color:theme.textMuted}}/><input type="text" placeholder="學生姓名" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} style={{...inputStyle, paddingLeft: "40px"}} /></div>
                <div style={{position:"relative"}}><Lock size={16} style={{position:"absolute", left:12, top:16, color:theme.textMuted}}/><input type="text" placeholder="登入密碼" value={newStudentPassword} onChange={e => setNewStudentPassword(e.target.value)} style={{...inputStyle, paddingLeft: "40px"}} /></div>
              </div>
              <div style={{position:"relative", marginBottom: "15px"}}><GraduationCap size={16} style={{position:"absolute", left:12, top:16, color:theme.textMuted}}/><input type="text" placeholder="就讀學校 / 年級" value={newStudentSchool} onChange={e => setNewStudentSchool(e.target.value)} style={{...inputStyle, paddingLeft: "40px"}} /></div>
              <button type="submit" disabled={loading} style={btnStyle(editingStudentId ? theme.success : theme.primary)}>{editingStudentId ? "儲存修改內容" : "確認新增學生"}</button>
            </form>
            <h3 style={{color: theme.textMain, margin: "30px 0 15px 10px", display: "flex", alignItems: "center", gap: "10px"}}><Users size={20}/> 目前學生清單</h3>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "15px" }}>
              {studentList.map(s => (
                <div key={s.id} style={{ ...solidCardStyle, padding: "18px", marginBottom: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{fontWeight: "900", fontSize: "17px", color: theme.textMain}}>{s.name}</div><div style={{fontSize: "13px", color: theme.textMuted, marginTop: "4px"}}>{s.school || "未設定學校"}</div><div style={{fontSize: "12px", color: theme.primary, marginTop: "2px"}}>登入密碼: <span style={{letterSpacing: "2px", fontWeight: "bold"}}>****</span></div></div>
                  <div style={{display:"flex", gap: "10px"}}>
                    <button onClick={() => handleEditStudentClick(s)} style={{ background: `${theme.primary}15`, color: theme.primary, border: "none", padding: "10px", borderRadius: "10px", cursor: "pointer", transition: "0.2s" }}><Pencil size={20} /></button>
                    <button onClick={() => handleDeleteStudent(s.id, s.name)} style={{ background: `${theme.danger}15`, color: theme.danger, border: "none", padding: "10px", borderRadius: "10px", cursor: "pointer", transition: "0.2s" }}><Trash2 size={20} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "class" && (
          <form onSubmit={e => handleSubmit(e, "class")} style={solidCardStyle}>
            <h3 style={{color: theme.textMain, marginBottom: "20px"}}>📚 新增上課進度</h3>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 2fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <select value={subject} onChange={e => setSubject(e.target.value)} style={selectStyle}>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
              <input type="date" value={classDate} onChange={e => setClassDate(e.target.value)} style={inputStyle} />
              <div style={{position:"relative"}}><input type="number" step="0.5" placeholder="時數" value={duration} onChange={e => setDuration(e.target.value)} style={{...inputStyle, textAlign: "center"}} /><span style={{position:"absolute", right: 10, top: 18, fontSize:12, color: theme.textMuted}}>hr</span></div>
            </div>
            <div style={{position:"relative", marginBottom: "15px"}}><DollarSign size={16} style={{position:"absolute", left:12, top:16, color:theme.danger}}/><input type="number" placeholder="額外費用" value={expense} onChange={e => setExpense(e.target.value)} style={{...inputStyle, paddingLeft: 40, border: `1px solid ${isDarkMode ? 'rgba(248,113,113,0.3)' : '#fecaca'}`}} /></div>
            <input type="text" placeholder="📝 本日進度" value={progress} onChange={e => setProgress(e.target.value)} style={inputStyle} />
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "15px", marginTop: "10px" }}><input type="text" placeholder="🏠 作業" value={homework} onChange={e => setHomework(e.target.value)} style={inputStyle} /><input type="text" placeholder="💡 備註" value={note} onChange={e => setNote(e.target.value)} style={inputStyle} /></div>
            <button type="submit" style={btnStyle("#10b981")}>儲存紀錄</button>
          </form>
        )}

        {activeTab === "grade" && (
          <form onSubmit={e => handleSubmit(e, "grade")} style={solidCardStyle}>
            <h3 style={{color: theme.textMain, marginBottom: "20px"}}>📝 成績輸入</h3>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "15px", marginBottom: "10px" }}><select value={subject} onChange={e => setSubject(e.target.value)} style={selectStyle}>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select><input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} style={inputStyle} /></div>
            <input type="text" placeholder="📖 考試範圍 / 單元" value={unit} onChange={e => setUnit(e.target.value)} style={inputStyle} />
            <input type="number" placeholder="分數" value={score} onChange={e => setScore(e.target.value)} style={inputStyle} />
            <button type="submit" style={btnStyle("#3b82f6")}>儲存成績</button>
          </form>
        )}

        {activeTab === "point" && (
          <form onSubmit={e => handleSubmit(e, "point")} style={solidCardStyle}>
            <h3 style={{color: theme.textMain, marginBottom: "20px"}}>💎 點數獎勵</h3>
            <input type="number" placeholder="點數" value={points} onChange={e => setPoints(e.target.value)} style={inputStyle} /><input type="text" placeholder="原因" value={reason} onChange={e => setReason(e.target.value)} style={inputStyle} />
            <button type="submit" style={btnStyle("#f59e0b")}>送出</button>
          </form>
        )}

        {activeTab === "tuition" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            <div style={solidCardStyle}>
              <h3 style={{color: theme.textMain, marginBottom: "20px"}}>💰 薪資學費試算</h3>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}><input type="month" value={tuitionMonth} onChange={e => setTuitionMonth(e.target.value)} style={{...inputStyle, width: "auto", flex: 1, minWidth: "140px"}} /><button onClick={handleTuitionCheck} style={{...btnStyle(theme.danger), width: "auto", marginTop: 0, padding: "12px 24px", whiteSpace: "nowrap"}}>計算</button><button onClick={generateBillingText} style={{...btnStyle("#6366f1"), width: "auto", marginTop: 0, padding: "12px 24px", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap"}}><FileText size={18} /> 生成明細</button></div>
              {billingText && (
                <div style={{ marginTop: "25px", position: "relative", animation: "fadeIn 0.3s ease" }}>
                  <label style={{fontWeight: "bold", color: "#6366f1", marginBottom: "8px", display: "block"}}>👇 複製傳給家長：</label>
                  <textarea value={billingText} onChange={(e) => setBillingText(e.target.value)} style={{ width: "100%", height: "220px", padding: "18px", borderRadius: "16px", border: `2px solid ${isDarkMode ? "#4338ca" : "#6366f1"}`, fontSize: "14px", fontFamily: "monospace", resize: "none", background: isDarkMode ? "#1e1b4b" : "#f5f3ff", color: theme.textMain, lineHeight: "1.6" }} />
                  <button onClick={copyToClipboard} style={{ position: "absolute", top: "40px", right: "12px", background: isCopied ? theme.success : theme.card, color: isCopied ? "white" : theme.textMain, border: `1px solid ${theme.border}`, padding: "8px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", transition: "0.2s", boxShadow: theme.shadow }}>{isCopied ? <Check size={14}/> : <Copy size={14}/>} {isCopied ? "已複製" : "複製"}</button>
                </div>
              )}
              {tuitionDetails.length > 0 && (
                <div style={{ marginTop: "25px", borderTop: `2px dashed ${theme.border}`, paddingTop: "20px" }}>
                  {tuitionDetails.map(t => (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "15px", background: theme.inputBg, borderRadius: "14px", marginBottom: "10px", border: `1px solid ${theme.border}` }}>
                      <div><div style={{fontWeight: "900", fontSize: "15px", color: theme.textMain}}>{t.class_date} <span style={{fontSize: "12px", color: theme.textMuted, fontWeight: "normal"}}>({t.subject})</span></div><div style={{fontSize: "13px", color: theme.textMuted, marginTop: "4px"}}>{t.duration} hr × ${t.rate}/hr {t.extra > 0 && <span style={{color: theme.danger, fontWeight: "bold"}}> + 雜費 {t.extra}</span>}</div></div>
                      <span style={{ fontWeight: "900", color: theme.danger, display: "flex", alignItems: "center", fontSize: "18px" }}>${t.total}</span>
                    </div>
                  ))}
                  <div style={{ textAlign: "right", fontSize: "28px", fontWeight: "900", marginTop: "20px", color: theme.danger, borderTop: `2px solid ${theme.border}`, paddingTop: "15px" }}>總計：${tuitionDetails.reduce((a,b)=>a+b.total,0).toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "view" && (
          <div style={solidCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}><h3 style={{color: theme.textMain, margin: 0, fontWeight: "900"}}>📊 單科成績分析</h3>{gradeFilter && <div style={{ fontSize: "14px", fontWeight: "bold", color: theme.textMain, background: theme.inputBg, border: `1px solid ${theme.border}`, padding: "8px 16px", borderRadius: "20px", boxShadow: theme.shadow }}>{gradeFilter}平均：<span style={{ color: COLORS[gradeFilter] || theme.primary, fontSize: "18px" }}>{currentAvg}</span> 分</div>}</div>
            <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "15px", marginBottom: "15px" }}>{availableSubjects.map((sub: any) => <button key={sub} onClick={() => setGradeFilter(sub)} style={filterBtnStyle(gradeFilter === sub, COLORS[sub])}>{sub}</button>)}</div>
            {currentChartData.length > 0 ? (
              <div style={{ height: "320px", marginBottom: "40px" }}><ResponsiveContainer width="100%" height="100%"><LineChart data={currentChartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} /><XAxis dataKey="date" stroke={theme.border} tick={{fill: theme.textMuted, fontSize: 12}} /><YAxis domain={[0, 100]} stroke={theme.border} tick={{fill: theme.textMuted, fontSize: 12}} /><Tooltip contentStyle={{backgroundColor: theme.activeControl, borderColor: theme.border, color: theme.textMain, borderRadius: "12px"}} /><Legend /><Line type="monotone" dataKey="score" name={gradeFilter} stroke={COLORS[gradeFilter] || theme.primary} strokeWidth={4} dot={{ r: 6, fill: theme.activeControl, strokeWidth: 3 }} /></LineChart></ResponsiveContainer></div>
            ) : <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: theme.textMuted, border: `1px dashed ${theme.border}`, borderRadius: "20px" }}>尚無數據</div>}
            <h4 style={{ color: theme.textMuted, margin: "0 0 15px 0", fontWeight: "bold" }}>📜 詳細成績列表</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px" }}>
               {chartData.filter((g: any) => g.subject === gradeFilter).map((g: any) => (
                   <div key={g.id} style={{ background: theme.inputBg, textAlign: "center", padding: "20px", borderRadius: "16px", borderTop: `4px solid ${COLORS[g.subject] || theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, borderLeft: `1px solid ${theme.border}` }}><div style={{ fontSize: "12px", color: theme.textMuted, marginBottom: "6px" }}>{g.exam_date}</div><div style={{ fontSize: "15px", fontWeight: "bold", color: theme.textMain }}>{g.subject}</div><div style={{ fontSize: "32px", fontWeight: "900", color: g.score >= 60 ? theme.primary : theme.danger, margin: "8px 0" }}>{g.score}</div><div style={{ fontSize: "12px", color: theme.textMuted }}>{g.unit}</div></div>
               ))}
            </div>
          </div>
        )}

        {activeTab !== "view" && activeTab !== "tuition" && activeTab !== "student" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
              {(activeTab === "class" || activeTab === "grade") && (
                  <div style={{ ...solidCardStyle, padding: "12px 20px", display: "flex", alignItems: "center", gap: "12px" }}><Filter size={16} color={theme.textMuted} /><span style={{ fontSize: "14px", color: theme.textMuted, fontWeight: "bold" }}>紀錄篩選：</span><select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)} style={{ ...selectStyle, width: "auto", padding: "6px 12px", margin: 0, background: theme.inputBg, fontSize: "13px" }}><option value="全部">全部顯示</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              )}
              <HistoryList data={historyData} type={activeTab} theme={theme} isDarkMode={isDarkMode} onEdit={(item: any) => { setEditingId(item.id); if (activeTab === "class") { setProgress(item.progress); setClassDate(item.class_date); setSubject(item.subject); setDuration(item.duration); setHomework(item.homework || ""); setNote(item.note || ""); setExpense(item.expense || ""); } if (activeTab === "grade") { setScore(item.score); setExamDate(item.exam_date); setSubject(item.subject); setUnit(item.unit || ""); } if (activeTab === "point") { setPoints(item.points); setReason(item.reason); } window.scrollTo({ top: 0, behavior: 'smooth' }); }} onDelete={async (id: number, info: string) => { 
                const table = activeTab === "class" ? "class_logs" : activeTab === "grade" ? "grades" : "point_logs";
                const typeText = activeTab === "class" ? "上課紀錄" : activeTab === "grade" ? "成績紀錄" : "點數紀錄";
                if (!window.confirm(`⚠️ 確定要刪除這筆「${typeText}」嗎？\n內容：${info}`)) return;
                await supabase.from(table).delete().eq("id", id); 
                fetchHistoryData(); 
              }} />
          </div>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: theme.navBg, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-around", padding: "15px 0 25px 0", zIndex: 100, boxShadow: theme.shadow }}>
         <button onClick={() => setActiveTab("class")} style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", color: activeTab === "class" ? theme.primary : theme.textMuted, cursor: "pointer", flex: 1, fontWeight: activeTab === "class" ? "bold" : "normal", transition: "0.2s" }}><BookOpen size={22} /><span style={{fontSize: "11px", marginTop: "6px"}}>上課</span></button>
         <button onClick={() => setActiveTab("grade")} style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", color: activeTab === "grade" ? theme.primary : theme.textMuted, cursor: "pointer", flex: 1, fontWeight: activeTab === "grade" ? "bold" : "normal", transition: "0.2s" }}><TrendingUp size={22} /><span style={{fontSize: "11px", marginTop: "6px"}}>成績</span></button>
         <button onClick={() => setActiveTab("point")} style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", color: activeTab === "point" ? theme.primary : theme.textMuted, cursor: "pointer", flex: 1, fontWeight: activeTab === "point" ? "bold" : "normal", transition: "0.2s" }}><Coins size={22} /><span style={{fontSize: "11px", marginTop: "6px"}}>點數</span></button>
         <button onClick={() => setActiveTab("tuition")} style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", color: activeTab === "tuition" ? theme.primary : theme.textMuted, cursor: "pointer", flex: 1, fontWeight: activeTab === "tuition" ? "bold" : "normal", transition: "0.2s" }}><DollarSign size={22} /><span style={{fontSize: "11px", marginTop: "6px"}}>帳單</span></button>
         <button onClick={() => setActiveTab("view")} style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", color: activeTab === "view" ? theme.primary : theme.textMuted, cursor: "pointer", flex: 1, fontWeight: activeTab === "view" ? "bold" : "normal", transition: "0.2s" }}><FileText size={22} /><span style={{fontSize: "11px", marginTop: "6px"}}>報表</span></button>
         <button onClick={() => setActiveTab("student")} style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", color: activeTab === "student" ? theme.primary : theme.textMuted, cursor: "pointer", flex: 1, fontWeight: activeTab === "student" ? "bold" : "normal", transition: "0.2s" }}><Users size={22} /><span style={{fontSize: "11px", marginTop: "6px"}}>學生</span></button>
      </div>

      <style jsx>{` @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } ::-webkit-scrollbar { width: 0px; background: transparent; } `}</style>
    </div>
  );
}

function HistoryList({ data, type, onEdit, onDelete, theme, isDarkMode }: HistoryListProps) {
  return (
    <div style={{ marginTop: "10px" }}>
      {data.length > 0 ? data.map((item) => {
        const infoStr = type === "grade" ? `${item.subject} ${item.score}分` : type === "point" ? `${item.reason} ${item.points}點` : `${item.subject} ${item.progress}`;
        return (
        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: theme.activeControl, padding: "18px", borderRadius: "16px", borderTop: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, borderLeft: `1px solid ${theme.border}`, marginBottom: "12px", boxShadow: theme.shadow }}>
          <div style={{ fontSize: "14px", flex: 1, color: theme.textMain }}>
            {type === "grade" ? (<span>🏷️ <b>{item.subject}</b>: {item.score}分 <span style={{color:theme.textMuted}}>({item.unit})</span> <span style={{color:theme.textMuted, fontSize:"12px"}}>({item.exam_date})</span></span>) 
            : type === "point" ? (<span>💎 {item.reason}: <b style={{color: item.points > 0 ? theme.success : theme.danger, fontSize: "18px"}}>{item.points} 點</b></span>) 
            : (<div><div style={{fontWeight: "bold"}}>📂 {item.subject}: {item.progress} <span style={{color:theme.textMuted, fontWeight: "normal"}}>({item.class_date} | {item.duration} hr)</span></div>{item.expense > 0 && <div style={{fontSize: "13px", color: theme.danger, fontWeight: "900", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px"}}><DollarSign size={14}/> 雜費: {item.expense}</div>}<div style={{ display: "flex", gap: "10px", marginTop: "10px", fontSize: "13px" }}>{item.homework && <span style={{display:"flex", alignItems:"center", gap: 5, background: isDarkMode ? "rgba(56,189,248,0.15)" : "#e0f2fe", padding: "4px 10px", borderRadius: "8px", color: theme.primary, fontWeight: "bold"}}><BookOpen size={14}/> {item.homework}</span>}{item.note && <span style={{display:"flex", alignItems:"center", gap: 5, background: isDarkMode ? "rgba(52,211,153,0.15)" : "#dcfce7", padding: "4px 10px", borderRadius: "8px", color: theme.success, fontWeight: "bold"}}><MessageSquare size={14}/> {item.note}</span>}</div></div>)}
          </div>
          <div style={{ display: "flex", gap: "15px", marginLeft: "15px" }}>
            <button onClick={() => onEdit(item)} style={{ border: "none", background: "none", cursor: "pointer", color: theme.primary }}><Pencil size={20} /></button>
            <button onClick={() => onDelete(item.id, infoStr)} style={{ border: "none", background: "none", cursor: "pointer", color: theme.danger }}><Trash2 size={20} /></button>
          </div>
        </div>
      )}) : <p style={{ textAlign: "center", color: theme.textMuted, padding: "30px", border: `1px dashed ${theme.border}`, borderRadius: "20px" }}>尚無資料 ✨</p>}
    </div>
  );
}