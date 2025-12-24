"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LogOut, Pencil, Trash2, Calendar, TrendingUp, Award, User, Lock, XCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { createClient } from '@supabase/supabase-js';

// --- 1. Supabase 設定 ---
const supabaseUrl = "https://ynkvxixhiwwnocqybprs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlua3Z4aXhoaXd3bm9jcXlicHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDM5MzYsImV4cCI6MjA4MjA3OTkzNn0.9Z_SKdFXQOrZXEHT4J4wkSXBpt097tOuuXI6IFJN_FA";
const supabase = createClient(supabaseUrl, supabaseKey);

const SUBJECTS = ["國文", "英文", "數學", "理化", "生物", "地科", "歷史", "地理", "公民"];
const COLORS: Record<string, string> = {
  "國文": "#ef4444", "英文": "#f59e0b", "數學": "#10b981",
  "理化": "#3b82f6", "生物": "#8b5cf6", "地科": "#ec4899",
  "歷史": "#6366f1", "地理": "#14b8a6", "公民": "#f97316"
};

// --- 2. 定義元件介面 (解決 image_61778f.png 的 TS 報錯) ---
interface HistoryListProps {
  data: any[];
  type: string;
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
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

  // 表單狀態
  const [subject, setSubject] = useState(SUBJECTS[2]);
  const [score, setScore] = useState("");
  const [examDate, setExamDate] = useState("");
  const [unit, setUnit] = useState("");
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [classDate, setClassDate] = useState(new Date().toISOString().slice(0, 10));
  const [progress, setProgress] = useState("");
  const [homework, setHomework] = useState("");
  const [duration, setDuration] = useState("1.5");

  // 學費與報表
  const [tuitionMonth, setTuitionMonth] = useState(new Date().toISOString().slice(0, 7));
  const [tuitionDetails, setTuitionDetails] = useState<any[]>([]);
  const [subjectRates, setSubjectRates] = useState<any[]>([]);
  const [subjectAverages, setSubjectAverages] = useState<Record<string, number>>({});
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("teacherName");
    if (saved) setCurrentTeacher({ name: saved });
    fetchStudents();
  }, []);

  useEffect(() => {
    if (currentTeacher && selectedName) {
      resetForm();
      fetchHistoryData();
      fetchRates();
      if (activeTab === "view") fetchStudentDetails();
    }
  }, [selectedName, activeTab, currentTeacher]);

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

    const { data } = await supabase.from(tableName).select("*").eq("student_name", selectedName).order("created_at", { ascending: false }).limit(10);
    setHistoryData(data || []);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data } = await supabase.from("teachers").select("*").eq("name", loginName.trim()).eq("password", loginPassword.trim()).single();
    setLoading(false);
    if (data) { 
      setCurrentTeacher(data); 
      localStorage.setItem("teacherName", data.name); 
    } else {
      alert("❌ 登入失敗：姓名或密碼錯誤");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("teacherName");
    setCurrentTeacher(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setScore(""); setUnit(""); setPoints(""); setReason(""); setProgress(""); setHomework("");
  };

  const handleSubmit = async (e: React.FormEvent, type: string) => {
    e.preventDefault();
    setLoading(true);
    let tableName = type === "class" ? "class_logs" : type === "grade" ? "grades" : "point_logs";
    let payload: any = { student_name: selectedName };

    if (type === "class") payload = { ...payload, class_date: classDate, progress, homework, duration: Number(duration), subject };
    else if (type === "grade") payload = { ...payload, subject, score: Number(score), exam_date: examDate, unit };
    else if (type === "point") payload = { ...payload, points: Number(points), reason };

    const { error } = editingId 
      ? await supabase.from(tableName).update(payload).eq("id", editingId)
      : await supabase.from(tableName).insert([payload]);

    setLoading(false);
    if (error) alert(error.message);
    else { alert("🎉 儲存成功！"); resetForm(); fetchHistoryData(); fetchStudentDetails(); }
  };

  const handleTuitionCheck = async () => {
    setLoading(true);
    const { data: classes } = await supabase.from("class_logs").select("*").eq("student_name", selectedName).ilike("class_date", `${tuitionMonth}%`);
    const { data: rates } = await supabase.from("subject_rates").select("*").eq("student_name", selectedName);
    setLoading(false);

    if (!classes || classes.length === 0) return alert("⚠️ 本月無紀錄");
    const rateMap: Record<string, number> = {};
    rates?.forEach(r => rateMap[r.subject] = r.rate);

    const summary: Record<string, { hours: number; rate: number }> = {};
    classes.forEach(c => {
      const sub = c.subject || "未分類";
      if (!summary[sub]) summary[sub] = { hours: 0, rate: rateMap[sub] || 0 };
      summary[sub].hours += Number(c.duration);
    });

    setTuitionDetails(Object.entries(summary).map(([sub, val]) => ({
      subject: sub, hours: val.hours, rate: val.rate, total: val.hours * val.rate
    })));
  };

  const updateSubjectRate = async (sub: string, newRate: number) => {
    await supabase.from("subject_rates").upsert({ student_name: selectedName, subject: sub, rate: newRate }, { onConflict: 'student_name,subject' });
    fetchRates();
  };

  const fetchStudentDetails = async () => {
    const { data: gData } = await supabase.from("grades").select("*").eq("student_name", selectedName).order("exam_date", { ascending: true });
    if (gData) {
      const grouped: any = {};
      const avgs: any = {};
      gData.forEach(g => {
        if (!grouped[g.exam_date]) grouped[g.exam_date] = { date: g.exam_date };
        grouped[g.exam_date][g.subject] = g.score;
        if (!avgs[g.subject]) avgs[g.subject] = { t: 0, c: 0 };
        avgs[g.subject].t += g.score;
        avgs[g.subject].c += 1;
      });
      setChartData(Object.values(grouped));
      const finalAvgs: any = {};
      Object.keys(avgs).forEach(k => finalAvgs[k] = Math.round(avgs[k].t / avgs[k].c));
      setSubjectAverages(finalAvgs);
    }
  };

  // --- 🌸 登入介面 (Login UI) ---
  if (!currentTeacher) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: "white", padding: "40px", borderRadius: "24px", width: "100%", maxWidth: "380px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
        <h1 style={{ textAlign: "center", marginBottom: "30px", color: "#1e3a8a", fontSize: "28px" }}>🍎 老師登入</h1>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ position: "relative" }}>
            <User size={18} style={{ position: "absolute", left: "12px", top: "15px", color: "#94a3b8" }} />
            <input type="text" placeholder="老師姓名" value={loginName} onChange={(e) => setLoginName(e.target.value)} style={loginInputStyle} required />
          </div>
          <div style={{ position: "relative" }}>
            <Lock size={18} style={{ position: "absolute", left: "12px", top: "15px", color: "#94a3b8" }} />
            <input type="password" placeholder="登入密碼" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={loginInputStyle} required />
          </div>
          <button type="submit" disabled={loading} style={btnStyle("#2563eb")}>{loading ? "登入中..." : "進入管理系統"}</button>
        </form>
      </motion.div>
    </div>
  );

  return (
    <div style={{ maxWidth: "850px", margin: "auto", padding: "20px", fontFamily: "sans-serif", color: "#334155" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ fontSize: "26px", color: "#1e3a8a" }}>👩‍🏫 {currentTeacher.name}的控制台</h1>
        <button onClick={handleLogout} style={{ color: "#ef4444", border: "1px solid #ef4444", padding: "8px 16px", borderRadius: "10px", background: "white", cursor: "pointer", fontWeight: "bold" }}>登出</button>
      </div>
      
      <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "15px", marginBottom: "25px", border: "1px solid #e2e8f0" }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: "10px" }}>👤 操作學生：</label>
        <select value={selectedName} onChange={e => setSelectedName(e.target.value)} style={selectStyle}>
          {studentList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "25px", flexWrap: "wrap" }}>
        <button onClick={() => setActiveTab("class")} style={getTabStyle(activeTab === "class", "#10b981")}>📚 上課</button>
        <button onClick={() => setActiveTab("grade")} style={getTabStyle(activeTab === "grade", "#3b82f6")}>📝 成績</button>
        <button onClick={() => setActiveTab("point")} style={getTabStyle(activeTab === "point", "#f59e0b")}>💎 點數</button>
        <button onClick={() => setActiveTab("tuition")} style={getTabStyle(activeTab === "tuition", "#ec4899")}>💰 學費</button>
        <button onClick={() => setActiveTab("view")} style={getTabStyle(activeTab === "view", "#8b5cf6")}>📊 報表</button>
      </div>

      {activeTab === "class" && (
        <form onSubmit={e => handleSubmit(e, "class")} style={formStyle}>
          <h3>📚 新增上課進度</h3>
          <div style={{ display: "flex", gap: "10px" }}>
            <select value={subject} onChange={e => setSubject(e.target.value)} style={selectStyle}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="date" value={classDate} onChange={e => setClassDate(e.target.value)} style={inputStyle} />
          </div>
          <input type="text" placeholder="進度內容" value={progress} onChange={e => setProgress(e.target.value)} style={inputStyle} />
          <button type="submit" style={btnStyle("#10b981")}>儲存紀錄</button>
        </form>
      )}

      {activeTab === "grade" && (
        <form onSubmit={e => handleSubmit(e, "grade")} style={formStyle}>
          <h3>📝 成績輸入</h3>
          <div style={{ display: "flex", gap: "10px" }}>
            <select value={subject} onChange={e => setSubject(e.target.value)} style={selectStyle}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} style={inputStyle} />
          </div>
          <input type="number" placeholder="分數" value={score} onChange={e => setScore(e.target.value)} style={inputStyle} />
          <button type="submit" style={btnStyle("#3b82f6")}>儲存成績</button>
        </form>
      )}

      {activeTab === "point" && (
        <form onSubmit={e => handleSubmit(e, "point")} style={formStyle}>
          <h3>💎 點數獎勵</h3>
          <input type="number" placeholder="點數" value={points} onChange={e => setPoints(e.target.value)} style={inputStyle} />
          <input type="text" placeholder="原因" value={reason} onChange={e => setReason(e.target.value)} style={inputStyle} />
          <button type="submit" style={btnStyle("#f59e0b")}>送出</button>
        </form>
      )}

      {activeTab === "tuition" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          <div style={formStyle}>
            <h3>💰 薪資學費試算</h3>
            <div style={{ display: "flex", gap: "10px" }}>
              <input type="month" value={tuitionMonth} onChange={e => setTuitionMonth(e.target.value)} style={inputStyle} />
              <button onClick={handleTuitionCheck} style={btnStyle("#ec4899")}>計算</button>
            </div>
            {tuitionDetails.length > 0 && (
              <div style={{ marginTop: "15px", borderTop: "2px dashed #ec4899", paddingTop: "15px" }}>
                {tuitionDetails.map(t => (
                  <div key={t.subject} style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "white", borderRadius: "10px", marginBottom: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <span><b>{t.subject}</b> ({t.hours}hr × ${t.rate})</span>
                    <span style={{ fontWeight: "bold", color: "#ec4899" }}>${t.total}</span>
                  </div>
                ))}
                <div style={{ textAlign: "right", fontSize: "24px", fontWeight: "bold", marginTop: "10px", color: "#be185d" }}>總計：${tuitionDetails.reduce((a,b)=>a+b.total,0)}</div>
              </div>
            )}
          </div>
          <div style={{ ...formStyle, background: "#f8fafc" }}>
            <h3>⚙️ 設定分科時薪 ({selectedName})</h3>
            <div key={selectedName} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
              {SUBJECTS.map(sub => {
                const currentRate = subjectRates.find(r => r.subject === sub)?.rate || 0;
                return (
                  <div key={sub} style={{ display: "flex", alignItems: "center", gap: "8px", background: "white", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "14px", fontWeight: "bold" }}>{sub}</span>
                    <input type="number" defaultValue={currentRate} onBlur={e => updateSubjectRate(sub, Number(e.target.value))} style={{ width: "100%", padding: "5px", borderRadius: "5px", border: "1px solid #cbd5e1" }} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "view" && (
        <div style={{ background: "white", padding: "20px", borderRadius: "15px", border: "1px solid #e2e8f0" }}>
          <h3>📊 成績趨勢圖</h3>
          <div style={{ height: "400px", marginTop: "20px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                {SUBJECTS.map(sub => (
                  <Line key={sub} type="monotone" dataKey={sub} stroke={COLORS[sub]} strokeWidth={3} connectNulls={true} dot={{ r: 5 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab !== "view" && activeTab !== "tuition" && (
        <HistoryList data={historyData} type={activeTab} onEdit={(item: any) => {
          setEditingId(item.id);
          if (activeTab === "class") { setProgress(item.progress); setClassDate(item.class_date); setSubject(item.subject); }
          if (activeTab === "grade") { setScore(item.score); setExamDate(item.exam_date); setSubject(item.subject); }
          if (activeTab === "point") { setPoints(item.points); setReason(item.reason); }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} onDelete={async (id: number) => {
          if (!confirm("⚠️ 確定刪除嗎？")) return;
          const table = activeTab === "class" ? "class_logs" : activeTab === "grade" ? "grades" : "point_logs";
          await supabase.from(table).delete().eq("id", id);
          fetchHistoryData(); fetchStudentDetails();
        }} />
      )}
    </div>
  );
}

// --- 輔助元件 (已修正型別報錯) ---
function HistoryList({ data, type, onEdit, onDelete }: HistoryListProps) {
  return (
    <div style={{ marginTop: "30px" }}>
      {data.length > 0 ? data.map((item) => (
        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "15px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: "14px" }}>
            {type === "grade" ? (<span>🏷️ <b>{item.subject}</b>: {item.score}分 <span style={{color:"#94a3b8"}}>({item.exam_date})</span></span>) : 
             type === "point" ? (<span>💎 {item.reason}: <b>{item.points}點</b></span>) : 
             (<span>📂 <b>{item.subject}</b>: {item.progress} <span style={{color:"#94a3b8"}}>({item.class_date})</span></span>)}
          </div>
          <div style={{ display: "flex", gap: "15px" }}>
            <button onClick={() => onEdit(item)} style={{ border: "none", background: "none", cursor: "pointer", color: "#3b82f6" }}><Pencil size={18} /></button>
            <button onClick={() => onDelete(item.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}><Trash2 size={18} /></button>
          </div>
        </div>
      )) : <p style={{ textAlign: "center", color: "#94a3b8" }}>尚無資料 ✨</p>}
    </div>
  );
}

// --- 樣式與通用參數 ---
const loginInputStyle = { width: "100%", padding: "12px 12px 12px 40px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "16px", boxSizing: "border-box" as const, background: "#f8fafc" };
const inputStyle = { width: "100%", padding: "12px", margin: "6px 0", borderRadius: "10px", border: "1px solid #cbd5e1", boxSizing: "border-box" as const };
const selectStyle = { padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "white", width: "100%", cursor: "pointer" };
const formStyle = { background: "#ffffff", padding: "25px", borderRadius: "15px", border: "1px solid #e2e8f0", marginBottom: "25px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" };
const btnStyle = (color: string) => ({ background: color, color: "#fff", border: "none", padding: "12px", borderRadius: "10px", cursor: "pointer", width: "100%", marginTop: "10px", fontWeight: "bold" });
const getTabStyle = (active: boolean, color: string) => ({ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: active ? color : "#f1f5f9", color: active ? "#fff" : "#475569", fontWeight: "bold", cursor: "pointer", transition: "0.3s" });