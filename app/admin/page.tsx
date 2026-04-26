"use client";

import { useState, useEffect } from "react";
import { LogOut, Pencil, Trash2, User, Lock, BookOpen, MessageSquare, TrendingUp, Filter, Clock, DollarSign, Copy, Check, FileText, Sun, Moon, Home, Coins } from "lucide-react";
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
  onDelete: (id: number) => void;
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

    if (saved) setCurrentTeacher({ name: saved });
    fetchStudents();

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

  // ★ 修正 1：將老師端主題顏色完全對齊學生端的「淺藍色 (Sky Blue)」
  const theme = {
    bg: isDarkMode ? "#0f172a" : "#f8fafc",
    card: isDarkMode ? "#1e293b" : "#ffffff",
    textMain: isDarkMode ? "#f1f5f9" : "#1e293b",
    textMuted: isDarkMode ? "#94a3b8" : "#64748b",
    border: isDarkMode ? "#334155" : "#e2e8f0",
    primary: isDarkMode ? "#38bdf8" : "#0ea5e9",
    primaryLight: isDarkMode ? "rgba(56, 189, 248, 0.1)" : "#f0f9ff",
    shadow: isDarkMode ? "0 10px 30px rgba(0,0,0,0.5)" : "0 10px 30px rgba(14, 165, 233, 0.08)",
    navBg: isDarkMode ? "#1e293b" : "#ffffff",
    inputBg: isDarkMode ? "#0f172a" : "#f8fafc",
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from("students").select("*");
    if (data && data.length > 0) {
      setStudentList(data);
      if (!selectedName) setSelectedName(data[0].name);
    }
  };

  const fetchRates = async () => {
    const { data } = await supabase.from("subject_rates").select("*").eq("student_name", selectedName);
    setSubjectRates(data || []);
  };

  const fetchHistoryData = async () => {
    let tableName = activeTab === "class" ? "class_logs" : activeTab === "grade" ? "grades" : "point_logs";
    if (activeTab === "view" || activeTab === "tuition") tableName = "class_logs"; 

    let query = supabase.from(tableName).select("*").eq("student_name", selectedName);
    if (historyFilter !== "全部" && (activeTab === "class" || activeTab === "grade")) {
        query = query.eq("subject", historyFilter);
    }
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

  const getFilteredGrades = () => chartData.filter((g: any) => g.subject === gradeFilter);
  const getProcessedChartData = () => {
    const list = getFilteredGrades();
    if (list.length === 0) return [];
    return [...list].sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()).map((g:any) => ({ date: g.exam_date, score: g.score }));
  };
  const getSubjectAverage = () => {
    const list = getFilteredGrades();
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

  const resetForm = () => {
    setEditingId(null); setScore(""); setUnit(""); setPoints(""); setReason(""); 
    setProgress(""); setHomework(""); setNote(""); setExpense(""); setBillingText("");
  };

  const handleSubmit = async (e: React.FormEvent, type: string) => {
    e.preventDefault();
    setLoading(true);
    let tableName = type === "class" ? "class_logs" : type === "grade" ? "grades" : "point_logs";
    let payload: any = { student_name: selectedName };

    if (type === "class") {
        payload = { ...payload, class_date: classDate, progress, homework, note, duration: Number(duration), subject, expense: Number(expense) || 0 };
    }
    else if (type === "grade") payload = { ...payload, subject, score: Number(score), exam_date: examDate, unit };
    else if (type === "point") payload = { ...payload, points: Number(points), reason };

    const { error } = editingId 
      ? await supabase.from(tableName).update(payload).eq("id", editingId)
      : await supabase.from(tableName).insert([payload]);

    setLoading(false);
    if (error) alert(error.message);
    else { alert("🎉 儲存成功！"); resetForm(); fetchHistoryData(); if(activeTab==="view") fetchStudentDetails(); }
  };

  const handleTuitionCheck = async () => {
    setLoading(true);
    const { data: classes } = await supabase.from("class_logs").select("*").eq("student_name", selectedName).ilike("class_date", `${tuitionMonth}%`).order("class_date", { ascending: true });
    const { data: rates } = await supabase.from("subject_rates").select("*").eq("student_name", selectedName);
    setLoading(false);
    setBillingText(""); 

    if (!classes || classes.length === 0) { setTuitionDetails([]); return alert("⚠️ 本月無紀錄"); }

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
    if (tuitionDetails.length === 0) {
        alert("請先按「計算」取得資料喔！");
        return;
    }

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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(billingText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const globalContainerStyle = { minHeight: "100vh", background: theme.bg, transition: "background 0.3s ease", color: theme.textMain, fontFamily: "sans-serif" };
  const inputStyle = { width: "100%", padding: "12px", margin: "6px 0", borderRadius: "10px", border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.textMain, boxSizing: "border-box" as const, transition: "0.2s" };
  
  // ★ 修正 2：新增登入專屬的 inputStyle，精準對齊學生端的框線圓角、左邊距與大小
  const loginInputStyle = { width: "100%", padding: "14px 14px 14px 45px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.textMain, fontSize: "16px", outline: "none", boxSizing: "border-box" as const, transition: "0.3s" };
  
  const selectStyle = { ...inputStyle, cursor: "pointer" };
  const formStyle = { background: theme.card, padding: "25px", borderRadius: "15px", border: `1px solid ${theme.border}`, marginBottom: "25px", boxShadow: theme.shadow, transition: "0.3s" };
  
  const cardStyle = { 
    background: theme.card, 
    padding: "20px", 
    borderRadius: "20px", 
    borderTop: `1px solid ${theme.border}`,
    borderRight: `1px solid ${theme.border}`,
    borderBottom: `1px solid ${theme.border}`,
    borderLeft: `1px solid ${theme.border}`,
    boxShadow: theme.shadow, 
    transition: "0.3s ease" 
  };
  
  const btnStyle = (color: string) => ({ background: color, color: "#fff", border: "none", padding: "12px", borderRadius: "10px", cursor: "pointer", width: "100%", marginTop: "10px", fontWeight: "bold", transition: "0.2s" });
  const getTabStyle = (active: boolean, color: string) => ({ flex: 1, padding: "12px", borderRadius: "10px", border: active ? `1px solid ${color}` : `1px solid ${theme.border}`, background: active ? color : theme.card, color: active ? "#fff" : theme.textMuted, fontWeight: "bold", cursor: "pointer", transition: "0.3s" });
  const filterBtnStyle = (active: boolean, color: string = theme.textMain) => ({ padding: "6px 14px", borderRadius: "20px", border: active ? `1px solid ${color}` : `1px solid ${theme.border}`, background: active ? color : theme.card, color: active ? "white" : theme.textMuted, fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" as const, transition: "0.2s" });

  // ★ 修正 3：登入畫面完全與學生端對齊 (包含寬度、副標題、圓角設定、hover效果)
  if (!currentTeacher) return (
    <div style={{ ...globalContainerStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <button onClick={toggleTheme} style={{ position: "absolute", top: 20, right: 20, background: theme.card, border: `1px solid ${theme.border}`, padding: "10px", borderRadius: "50%", color: theme.textMain, cursor: "pointer", boxShadow: theme.shadow }}>{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
      <div style={{ ...cardStyle, width: "100%", maxWidth: "360px", textAlign: "center" }}>
        <h1 style={{ color: theme.primary, fontSize: "28px", marginBottom: "10px", fontWeight: "900" }}>🍎 老師登入</h1>
        <p style={{ color: theme.textMuted, marginBottom: "30px", fontSize: "14px" }}>登入以進入教務管理控制台</p>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ position: "relative" }}>
              <User size={18} style={{ position: "absolute", left: "15px", top: "16px", color: theme.textMuted }} />
              <input type="text" placeholder="帳號" value={loginName} onChange={e => setLoginName(e.target.value)} style={loginInputStyle} />
            </div>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "15px", top: "16px", color: theme.textMuted }} />
              <input type="password" placeholder="密碼" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={loginInputStyle} />
            </div>
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: theme.primary, color: "white", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginTop: "10px", transition: "0.2s" }}>{loading ? "登入中..." : "登入"}</button>
        </form>
        <div style={{ marginTop: "25px", borderTop: `1px solid ${theme.border}`, paddingTop: "20px" }}>
           <button 
             onClick={() => window.location.href = '/'} 
             style={{ background: "transparent", color: theme.textMuted, border: "none", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: "8px", transition: "0.2s" }}
             onMouseOver={(e) => e.currentTarget.style.color = theme.primary}
             onMouseOut={(e) => e.currentTarget.style.color = theme.textMuted}
           >
             🎒 我是學生，切換至前台
           </button>
        </div>
      </div>
    </div>
  );

  const currentChartData = getProcessedChartData();
  const currentAvg = getSubjectAverage();

  return (
    <div style={{ ...globalContainerStyle, paddingBottom: "80px" }}>
      <div style={{ maxWidth: "850px", margin: "auto", padding: "20px" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "26px", color: theme.textMain, fontWeight: "bold" }}>👩‍🏫 {currentTeacher.name}的控制台</h1>
          <div style={{ display: "flex", gap: "10px" }}>
             <button onClick={toggleTheme} style={{ background: theme.card, border: `1px solid ${theme.border}`, padding: "8px", borderRadius: "50%", color: theme.textMain, cursor: "pointer", boxShadow: theme.shadow }}>{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
             <button onClick={handleLogout} style={{ color: "#ef4444", border: "1px solid #ef4444", padding: "8px 16px", borderRadius: "10px", background: theme.card, cursor: "pointer", fontWeight: "bold", boxShadow: theme.shadow }}>登出</button>
          </div>
        </div>
        
        <div style={{ background: theme.inputBg, padding: "20px", borderRadius: "15px", marginBottom: "25px", border: `1px solid ${theme.border}`, boxShadow: theme.shadow }}>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "10px", color: theme.textMain }}>👤 操作學生：</label>
          <select value={selectedName} onChange={e => setSelectedName(e.target.value)} style={selectStyle}>
            {studentList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>

        {activeTab === "class" && (
          <form onSubmit={e => handleSubmit(e, "class")} style={formStyle}>
            <h3 style={{color: theme.textMain}}>📚 新增上課進度</h3>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 2fr 1fr", gap: "10px", alignItems: "center" }}>
              <select value={subject} onChange={e => setSubject(e.target.value)} style={{...selectStyle, width: "100%"}}>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="date" value={classDate} onChange={e => setClassDate(e.target.value)} style={{...inputStyle, width: "100%"}} />
              <div style={{position:"relative"}}>
                   <input type="number" step="0.5" placeholder="時數" value={duration} onChange={e => setDuration(e.target.value)} style={{...inputStyle, width: "100%", textAlign: "center"}} />
                   <span style={{position:"absolute", right: 8, top: 18, fontSize:12, color: theme.textMuted}}>hr</span>
              </div>
            </div>
            <div style={{position:"relative", marginBottom: "10px"}}>
               <DollarSign size={16} style={{position:"absolute", left:10, top:13, color:"#ec4899"}}/>
               <input type="number" placeholder="額外費用 (書費/代購費，無則留空)" value={expense} onChange={e => setExpense(e.target.value)} style={{...inputStyle, paddingLeft: 35, borderColor: isDarkMode ? "#831843" : "#fbcfe8"}} />
            </div>
            <input type="text" placeholder="📝 本日進度" value={progress} onChange={e => setProgress(e.target.value)} style={inputStyle} />
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "10px" }}>
               <input type="text" placeholder="🏠 作業" value={homework} onChange={e => setHomework(e.target.value)} style={inputStyle} />
               <input type="text" placeholder="💡 備註" value={note} onChange={e => setNote(e.target.value)} style={inputStyle} />
            </div>
            <button type="submit" style={btnStyle("#10b981")}>儲存紀錄</button>
          </form>
        )}

        {activeTab === "grade" && (
          <form onSubmit={e => handleSubmit(e, "grade")} style={formStyle}>
            <h3 style={{color: theme.textMain}}>📝 成績輸入</h3>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "10px" }}>
              <select value={subject} onChange={e => setSubject(e.target.value)} style={selectStyle}>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
              <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} style={inputStyle} />
            </div>
            <input type="text" placeholder="📖 考試範圍 / 單元 (如: 第一課)" value={unit} onChange={e => setUnit(e.target.value)} style={inputStyle} />
            <input type="number" placeholder="分數" value={score} onChange={e => setScore(e.target.value)} style={inputStyle} />
            <button type="submit" style={btnStyle("#3b82f6")}>儲存成績</button>
          </form>
        )}

        {activeTab === "point" && (
          <form onSubmit={e => handleSubmit(e, "point")} style={formStyle}>
            <h3 style={{color: theme.textMain}}>💎 點數獎勵</h3>
            <input type="number" placeholder="點數" value={points} onChange={e => setPoints(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="原因" value={reason} onChange={e => setReason(e.target.value)} style={inputStyle} />
            <button type="submit" style={btnStyle("#f59e0b")}>送出</button>
          </form>
        )}

        {activeTab === "tuition" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            <div style={formStyle}>
              <h3 style={{color: theme.textMain}}>💰 薪資學費試算</h3>
              
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <input type="month" value={tuitionMonth} onChange={e => setTuitionMonth(e.target.value)} style={{...inputStyle, width: "auto", flex: 1, minWidth: "120px"}} />
                <button onClick={handleTuitionCheck} style={{...btnStyle("#ec4899"), width: "auto", marginTop: 0, padding: "10px 20px", whiteSpace: "nowrap"}}>計算</button>
                <button onClick={generateBillingText} style={{...btnStyle("#4f46e5"), width: "auto", marginTop: 0, padding: "10px 20px", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap"}}><FileText size={18} /> 生成明細</button>
              </div>
              
              {billingText && (
                <div style={{ marginTop: "20px", position: "relative", animation: "fadeIn 0.3s ease" }}>
                  <label style={{fontWeight: "bold", color: "#6366f1", marginBottom: "5px", display: "block"}}>👇 複製以下內容傳給家長：</label>
                  <textarea 
                    value={billingText} 
                    onChange={(e) => setBillingText(e.target.value)}
                    style={{ width: "100%", height: "200px", padding: "15px", borderRadius: "10px", border: `2px solid ${isDarkMode ? "#4338ca" : "#6366f1"}`, fontSize: "14px", fontFamily: "monospace", resize: "none", background: isDarkMode ? "#1e1b4b" : "#f5f3ff", color: theme.textMain }}
                  />
                  <button onClick={copyToClipboard} style={{ position: "absolute", top: "35px", right: "10px", background: isCopied ? "#10b981" : theme.border, color: isCopied ? "white" : theme.textMain, border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", transition: "0.2s" }}>
                    {isCopied ? <Check size={14}/> : <Copy size={14}/>} {isCopied ? "已複製" : "複製"}
                  </button>
                </div>
              )}

              {tuitionDetails.length > 0 && (
                <div style={{ marginTop: "20px", borderTop: `2px dashed ${isDarkMode ? "#831843" : "#ec4899"}`, paddingTop: "15px" }}>
                  <div style={{ fontSize: "14px", color: theme.textMuted, marginBottom: "10px" }}>計算結果明細：</div>
                  {tuitionDetails.map(t => (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: theme.inputBg, borderRadius: "10px", marginBottom: "8px", border: `1px solid ${theme.border}` }}>
                      <div>
                          <div style={{fontWeight: "bold", fontSize: "15px", color: theme.textMain}}>{t.class_date} <span style={{fontSize: "13px", fontWeight: "normal", color: theme.textMuted}}>({t.subject})</span></div>
                          <div style={{fontSize: "12px", color: theme.textMuted}}>
                              {t.duration} hr × ${t.rate}/hr 
                              {t.extra > 0 && <span style={{color: "#ec4899", fontWeight: "bold"}}> + 書費 ${t.extra}</span>}
                          </div>
                      </div>
                      <span style={{ fontWeight: "bold", color: "#ec4899", display: "flex", alignItems: "center" }}>${t.total}</span>
                    </div>
                  ))}
                  <div style={{ textAlign: "right", fontSize: "24px", fontWeight: "bold", marginTop: "15px", color: "#be185d", borderTop: `2px solid ${theme.border}`, paddingTop: "10px" }}>
                      總計：${tuitionDetails.reduce((a,b)=>a+b.total,0).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            <div style={{ ...formStyle, background: theme.inputBg }}>
              <h3 style={{color: theme.textMain}}>⚙️ 設定分科時薪 ({selectedName})</h3>
              <div key={selectedName} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
                {SUBJECTS.map(sub => {
                  const currentRate = subjectRates.find(r => r.subject === sub)?.rate || 0;
                  return (
                    <div key={sub} style={{ display: "flex", alignItems: "center", gap: "8px", background: theme.card, padding: "10px", borderRadius: "10px", border: `1px solid ${theme.border}` }}>
                      <span style={{ fontSize: "14px", fontWeight: "bold", color: theme.textMain }}>{sub}</span>
                      <input type="number" defaultValue={currentRate} onBlur={e => updateSubjectRate(sub, Number(e.target.value))} style={{ width: "100%", padding: "5px", borderRadius: "5px", border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.textMain }} />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "view" && (
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
               <h3 style={{color: theme.textMain, margin: 0}}>📊 單科成績分析</h3>
               {gradeFilter && <div style={{ fontSize: "14px", fontWeight: "bold", color: theme.textMain, background: theme.inputBg, border: `1px solid ${theme.border}`, padding: "5px 12px", borderRadius: "20px" }}>{gradeFilter}平均：<span style={{ color: COLORS[gradeFilter] || theme.primary, fontSize: "16px" }}>{currentAvg}</span> 分</div>}
            </div>
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "10px", marginBottom: "10px" }}>
               {availableSubjects.map((sub: any) => <button key={sub} onClick={() => setGradeFilter(sub)} style={filterBtnStyle(gradeFilter === sub, COLORS[sub])}>{sub}</button>)}
               {availableSubjects.length === 0 && <span style={{fontSize:"14px", color:theme.textMuted}}>該學生尚無成績資料</span>}
            </div>
            {currentChartData.length > 0 ? (
              <div style={{ height: "300px", marginTop: "20px", marginBottom: "30px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
                    <XAxis dataKey="date" stroke={theme.border} tick={{fill: theme.textMuted}} />
                    <YAxis domain={[0, 100]} stroke={theme.border} tick={{fill: theme.textMuted}} />
                    <Tooltip contentStyle={{backgroundColor: theme.card, borderColor: theme.border, color: theme.textMain}} />
                    <Legend />
                    <Line type="monotone" dataKey="score" name={gradeFilter} stroke={COLORS[gradeFilter] || theme.primary} strokeWidth={3} dot={{ r: 5, fill: theme.card, strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: theme.textMuted }}>尚無圖表數據</div>}
            
            <h4 style={{ color: theme.textMuted, margin: "0 0 10px 0" }}>📜 詳細成績列表</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
               {getFilteredGrades().map((g: any) => (
                   <div key={g.id} style={{ background: theme.inputBg, textAlign: "center", padding: "15px", borderRadius: "12px", borderTop: `4px solid ${COLORS[g.subject] || theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, borderLeft: `1px solid ${theme.border}` }}>
                       <div style={{ fontSize: "12px", color: theme.textMuted, marginBottom: "5px" }}>{g.exam_date}</div>
                       <div style={{ fontSize: "14px", fontWeight: "bold", color: theme.textMain }}>{g.subject}</div>
                       <div style={{ fontSize: "24px", fontWeight: "bold", color: g.score >= 60 ? (COLORS[g.subject] || theme.primary) : "#ef4444", margin: "5px 0" }}>{g.score}</div>
                       <div style={{ fontSize: "12px", color: theme.textMuted }}>{g.unit}</div>
                   </div>
               ))}
            </div>
          </div>
        )}

        {activeTab !== "view" && activeTab !== "tuition" && (
          <>
              {(activeTab === "class" || activeTab === "grade") && (
                  <div style={{ marginTop: "30px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: theme.inputBg, borderRadius: "10px", border: `1px solid ${theme.border}` }}>
                      <Filter size={16} color={theme.textMuted} />
                      <span style={{ fontSize: "14px", color: theme.textMuted, fontWeight: "bold" }}>篩選歷史紀錄：</span>
                      <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)} style={{ ...selectStyle, width: "auto", padding: "8px", margin: 0 }}><option value="全部">全部顯示</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                  </div>
              )}
              <HistoryList data={historyData} type={activeTab} theme={theme} isDarkMode={isDarkMode} onEdit={(item: any) => {
                setEditingId(item.id);
                if (activeTab === "class") { 
                    setProgress(item.progress); setClassDate(item.class_date); setSubject(item.subject); setDuration(item.duration); setHomework(item.homework || ""); setNote(item.note || "");
                    setExpense(item.expense || "");
                }
                if (activeTab === "grade") { setScore(item.score); setExamDate(item.exam_date); setSubject(item.subject); setUnit(item.unit || ""); }
                if (activeTab === "point") { setPoints(item.points); setReason(item.reason); }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} onDelete={async (id: number) => {
                if (!confirm("⚠️ 確定刪除嗎？")) return;
                const table = activeTab === "class" ? "class_logs" : activeTab === "grade" ? "grades" : "point_logs";
                await supabase.from(table).delete().eq("id", id);
                fetchHistoryData(); 
              }} />
          </>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: theme.navBg, borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-around", padding: "12px 0 20px 0", zIndex: 100, boxShadow: theme.shadow }}>
         <button onClick={() => setActiveTab("class")} style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", color: activeTab === "class" ? theme.primary : theme.textMuted, cursor: "pointer", flex: 1, fontWeight: activeTab === "class" ? "bold" : "normal" }}><BookOpen size={22} /><span style={{fontSize: "11px", marginTop: "4px"}}>上課</span></button>
         <button onClick={() => setActiveTab("grade")} style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", color: activeTab === "grade" ? theme.primary : theme.textMuted, cursor: "pointer", flex: 1, fontWeight: activeTab === "grade" ? "bold" : "normal" }}><TrendingUp size={22} /><span style={{fontSize: "11px", marginTop: "4px"}}>成績</span></button>
         <button onClick={() => setActiveTab("point")} style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", color: activeTab === "point" ? theme.primary : theme.textMuted, cursor: "pointer", flex: 1, fontWeight: activeTab === "point" ? "bold" : "normal" }}><Coins size={22} /><span style={{fontSize: "11px", marginTop: "4px"}}>點數</span></button>
         <button onClick={() => setActiveTab("tuition")} style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", color: activeTab === "tuition" ? theme.primary : theme.textMuted, cursor: "pointer", flex: 1, fontWeight: activeTab === "tuition" ? "bold" : "normal" }}><DollarSign size={22} /><span style={{fontSize: "11px", marginTop: "4px"}}>帳單</span></button>
         <button onClick={() => setActiveTab("view")} style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", color: activeTab === "view" ? theme.primary : theme.textMuted, cursor: "pointer", flex: 1, fontWeight: activeTab === "view" ? "bold" : "normal" }}><FileText size={22} /><span style={{fontSize: "11px", marginTop: "4px"}}>報表</span></button>
      </div>
    </div>
  );
}

function HistoryList({ data, type, onEdit, onDelete, theme, isDarkMode }: HistoryListProps) {
  return (
    <div style={{ marginTop: "10px" }}>
      {data.length > 0 ? data.map((item) => (
        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: theme.card, padding: "15px", borderRadius: "12px", border: `1px solid ${theme.border}`, marginBottom: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: "14px", flex: 1, color: theme.textMain }}>
            {type === "grade" ? (
                <span>🏷️ <b>{item.subject}</b>: {item.score}分 <span style={{color:theme.textMuted}}>({item.unit})</span> <span style={{color:theme.textMuted, fontSize:"12px"}}>({item.exam_date})</span></span>
            ) : type === "point" ? (
                <span>💎 {item.reason}: <b style={{color: item.points > 0 ? "#10b981" : "#ef4444"}}>{item.points}點</b></span>
            ) : (
                <div>
                   <div>📂 <b>{item.subject}</b>: {item.progress} <span style={{color:theme.textMuted}}>({item.class_date} | {item.duration} hr)</span></div>
                   {item.expense > 0 && <div style={{fontSize: "13px", color: "#ec4899", fontWeight: "bold", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px"}}><DollarSign size={14}/> 雜費: {item.expense}</div>}
                   
                   <div style={{ display: "flex", gap: "12px", marginTop: "8px", fontSize: "13px", color: theme.textMuted }}>
                      {item.homework && <span style={{display:"flex", alignItems:"center", gap:4, background: isDarkMode ? "#1e3a8a30" : "#dbeafe", padding: "4px 8px", borderRadius: "6px", color: isDarkMode ? "#60a5fa" : "#2563eb"}}><BookOpen size={14}/> {item.homework}</span>}
                      {item.note && <span style={{display:"flex", alignItems:"center", gap:4, background: isDarkMode ? "#14b8a630" : "#ccfbf1", padding: "4px 8px", borderRadius: "6px", color: isDarkMode ? "#2dd4bf" : "#0d9488"}}><MessageSquare size={14}/> {item.note}</span>}
                   </div>
                </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "15px", marginLeft: "10px" }}>
            <button onClick={() => onEdit(item)} style={{ border: "none", background: "none", cursor: "pointer", color: theme.primary }}><Pencil size={18} /></button>
            <button onClick={() => onDelete(item.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}><Trash2 size={18} /></button>
          </div>
        </div>
      )) : <p style={{ textAlign: "center", color: theme.textMuted, padding: "20px" }}>尚無資料 ✨</p>}
    </div>
  );
}