"use client";

import { useState, useEffect } from "react";
import { LogOut, Pencil, Trash2, User, Lock, BookOpen, MessageSquare, TrendingUp, Filter, Clock, DollarSign } from "lucide-react";
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
  const [historyFilter, setHistoryFilter] = useState("全部");

  // 表單資料
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
  const [expense, setExpense] = useState(""); // 書費

  const [tuitionMonth, setTuitionMonth] = useState(new Date().toISOString().slice(0, 7));
  const [tuitionDetails, setTuitionDetails] = useState<any[]>([]);
  const [subjectRates, setSubjectRates] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]); 
  const [gradeFilter, setGradeFilter] = useState("數學"); 
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("teacherName");
    if (saved) setCurrentTeacher({ name: saved });
    fetchStudents();
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
    setProgress(""); setHomework(""); setNote(""); setExpense(""); 
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
    const { data: classes } = await supabase.from("class_logs").select("*").eq("student_name", selectedName).ilike("class_date", `${tuitionMonth}%`).order("class_date", { ascending: false });
    const { data: rates } = await supabase.from("subject_rates").select("*").eq("student_name", selectedName);
    setLoading(false);

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

  if (!currentTeacher) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
      <div style={{ background: "white", padding: "40px", borderRadius: "24px", width: "100%", maxWidth: "380px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
        <h1 style={{ textAlign: "center", marginBottom: "30px", color: "#1e3a8a", fontSize: "28px" }}>🍎 老師登入</h1>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{position:"relative"}}><User size={18} style={{position:"absolute",left:12,top:15,color:"#94a3b8"}}/><input type="text" placeholder="帳號" value={loginName} onChange={e=>setLoginName(e.target.value)} style={loginInputStyle}/></div>
            <div style={{position:"relative"}}><Lock size={18} style={{position:"absolute",left:12,top:15,color:"#94a3b8"}}/><input type="password" placeholder="密碼" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} style={loginInputStyle}/></div>
            <button type="submit" disabled={loading} style={btnStyle("#2563eb")}>登入</button>
        </form>
      </div>
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
          
          {/* ★ 修改重點：使用 grid 來平衡三者寬度 (2:2:1) */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: "10px", alignItems: "center" }}>
            <select value={subject} onChange={e => setSubject(e.target.value)} style={{...selectStyle, width: "100%"}}>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="date" value={classDate} onChange={e => setClassDate(e.target.value)} style={{...inputStyle, width: "100%"}} />
            <div style={{position:"relative"}}>
                 <input type="number" step="0.5" placeholder="時數" value={duration} onChange={e => setDuration(e.target.value)} style={{...inputStyle, width: "100%", textAlign: "center"}} />
                 <span style={{position:"absolute", right: 8, top: 18, fontSize:12, color:"#94a3b8"}}>hr</span>
            </div>
          </div>

          <div style={{position:"relative", marginBottom: "10px"}}>
             <DollarSign size={16} style={{position:"absolute", left:10, top:13, color:"#ec4899"}}/>
             <input type="number" placeholder="額外費用 (書費/代購費，無則留空)" value={expense} onChange={e => setExpense(e.target.value)} style={{...inputStyle, paddingLeft: 35, borderColor: "#fbcfe8"}} />
          </div>

          <input type="text" placeholder="📝 本日進度" value={progress} onChange={e => setProgress(e.target.value)} style={inputStyle} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
             <input type="text" placeholder="🏠 作業" value={homework} onChange={e => setHomework(e.target.value)} style={inputStyle} />
             <input type="text" placeholder="💡 備註" value={note} onChange={e => setNote(e.target.value)} style={inputStyle} />
          </div>
          <button type="submit" style={btnStyle("#10b981")}>儲存紀錄</button>
        </form>
      )}

      {activeTab === "grade" && (
        <form onSubmit={e => handleSubmit(e, "grade")} style={formStyle}>
          <h3>📝 成績輸入</h3>
          <div style={{ display: "flex", gap: "10px" }}>
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
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "white", borderRadius: "10px", marginBottom: "8px", borderBottom: "1px solid #f1f5f9" }}>
                    <div>
                        <div style={{fontWeight: "bold", fontSize: "15px"}}>{t.class_date} <span style={{fontSize: "13px", fontWeight: "normal", color: "#64748b"}}>({t.subject})</span></div>
                        <div style={{fontSize: "12px", color: "#94a3b8"}}>
                            {t.duration} hr × ${t.rate}/hr 
                            {t.extra > 0 && <span style={{color: "#ec4899", fontWeight: "bold"}}> + 書費 ${t.extra}</span>}
                        </div>
                    </div>
                    <span style={{ fontWeight: "bold", color: "#ec4899", display: "flex", alignItems: "center" }}>${t.total}</span>
                  </div>
                ))}
                <div style={{ textAlign: "right", fontSize: "24px", fontWeight: "bold", marginTop: "15px", color: "#be185d", borderTop: "2px solid #fce7f3", paddingTop: "10px" }}>
                    總計：${tuitionDetails.reduce((a,b)=>a+b.total,0).toLocaleString()}
                </div>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
             <h3>📊 單科成績分析</h3>
             {gradeFilter && <div style={{ fontSize: "14px", fontWeight: "bold", color: "#64748b", background: "#f1f5f9", padding: "5px 12px", borderRadius: "20px" }}>{gradeFilter}平均：<span style={{ color: COLORS[gradeFilter] || "#3b82f6", fontSize: "16px" }}>{getSubjectAverage()}</span> 分</div>}
          </div>
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "10px", marginBottom: "10px" }}>
             {availableSubjects.map((sub: any) => <button key={sub} onClick={() => setGradeFilter(sub)} style={filterBtnStyle(gradeFilter === sub, COLORS[sub])}>{sub}</button>)}
             {availableSubjects.length === 0 && <span style={{fontSize:"14px", color:"#94a3b8"}}>該學生尚無成績資料</span>}
          </div>
          {getProcessedChartData().length > 0 ? (
            <div style={{ height: "300px", marginTop: "20px", marginBottom: "30px" }}><ResponsiveContainer width="100%" height="100%"><LineChart data={getProcessedChartData()}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" /><YAxis domain={[0, 100]} /><Tooltip /><Legend /><Line type="monotone" dataKey="score" name={gradeFilter} stroke={COLORS[gradeFilter] || "#3b82f6"} strokeWidth={3} dot={{ r: 5 }} /></LineChart></ResponsiveContainer></div>
          ) : <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>尚無圖表數據</div>}
          <h4 style={{ color: "#64748b", margin: "0 0 10px 0" }}>📜 詳細成績列表</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
             {getFilteredGrades().map((g: any) => (
                 <div key={g.id} style={{ ...cardStyle, textAlign: "center", padding: "15px", borderTop: `3px solid ${COLORS[g.subject] || '#cbd5e1'}` }}>
                     <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "5px" }}>{g.exam_date}</div><div style={{ fontSize: "14px", fontWeight: "bold", color: "#334155" }}>{g.subject}</div><div style={{ fontSize: "24px", fontWeight: "bold", color: g.score >= 60 ? "#2563eb" : "#ef4444", margin: "5px 0" }}>{g.score}</div><div style={{ fontSize: "12px", color: "#64748b" }}>{g.unit}</div>
                 </div>
             ))}
          </div>
        </div>
      )}

      {activeTab !== "view" && activeTab !== "tuition" && (
        <>
            {(activeTab === "class" || activeTab === "grade") && (
                <div style={{ marginTop: "30px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: "#f1f5f9", borderRadius: "10px" }}>
                    <Filter size={16} color="#64748b" />
                    <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "bold" }}>篩選歷史紀錄：</span>
                    <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)} style={{ ...selectStyle, width: "auto", padding: "8px" }}><option value="全部">全部顯示</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                </div>
            )}
            <HistoryList data={historyData} type={activeTab} onEdit={(item: any) => {
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
  );
}

function HistoryList({ data, type, onEdit, onDelete }: HistoryListProps) {
  return (
    <div style={{ marginTop: "10px" }}>
      {data.length > 0 ? data.map((item) => (
        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "15px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "10px" }}>
          <div style={{ fontSize: "14px", flex: 1 }}>
            {type === "grade" ? (
                <span>🏷️ <b>{item.subject}</b>: {item.score}分 <span style={{color:"#64748b"}}>({item.unit})</span> <span style={{color:"#94a3b8", fontSize:"12px"}}>({item.exam_date})</span></span>
            ) : type === "point" ? (
                <span>💎 {item.reason}: <b>{item.points}點</b></span>
            ) : (
                <div>
                   <div>📂 <b>{item.subject}</b>: {item.progress} <span style={{color:"#94a3b8"}}>({item.class_date} | {item.duration} hr)</span></div>
                   {item.expense > 0 && <div style={{fontSize: "12px", color: "#ec4899", fontWeight: "bold", marginTop: 2}}>💲 額外費用: ${item.expense}</div>}
                   <div style={{ display: "flex", gap: "10px", marginTop: "5px", fontSize: "13px", color: "#64748b" }}>
                      {item.homework && <span style={{display:"flex", alignItems:"center", gap:4}}><BookOpen size={14}/> {item.homework}</span>}
                      {item.note && <span style={{display:"flex", alignItems:"center", gap:4}}><MessageSquare size={14}/> {item.note}</span>}
                   </div>
                </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "15px", marginLeft: "10px" }}>
            <button onClick={() => onEdit(item)} style={{ border: "none", background: "none", cursor: "pointer", color: "#3b82f6" }}><Pencil size={18} /></button>
            <button onClick={() => onDelete(item.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}><Trash2 size={18} /></button>
          </div>
        </div>
      )) : <p style={{ textAlign: "center", color: "#94a3b8" }}>尚無資料 ✨</p>}
    </div>
  );
}

const loginInputStyle = { width: "100%", padding: "12px 12px 12px 40px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "16px", boxSizing: "border-box" as const, background: "#f8fafc" };
const inputStyle = { width: "100%", padding: "12px", margin: "6px 0", borderRadius: "10px", border: "1px solid #cbd5e1", boxSizing: "border-box" as const };
const selectStyle = { padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "white", width: "100%", cursor: "pointer" };
const formStyle = { background: "#ffffff", padding: "25px", borderRadius: "15px", border: "1px solid #e2e8f0", marginBottom: "25px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" };
const btnStyle = (color: string) => ({ background: color, color: "#fff", border: "none", padding: "12px", borderRadius: "10px", cursor: "pointer", width: "100%", marginTop: "10px", fontWeight: "bold" });
const getTabStyle = (active: boolean, color: string) => ({ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: active ? color : "#f1f5f9", color: active ? "#fff" : "#475569", fontWeight: "bold", cursor: "pointer", transition: "0.3s" });
const cardStyle = { background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" };
const filterBtnStyle = (active: boolean, color: string = "#334155") => ({ padding: "6px 14px", borderRadius: "20px", border: active ? `1px solid ${color}` : "1px solid #e2e8f0", background: active ? color : "white", color: active ? "white" : "#64748b", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" as const, transition: "0.2s" });