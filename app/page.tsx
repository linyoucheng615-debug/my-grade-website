"use client";

import { useState, useEffect } from "react";
import { User, Lock, BookOpen, MessageSquare, DollarSign, TrendingUp, Home, Calendar, Award, LogOut, Coins, FileText } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Supabase 設定 ---
const supabaseUrl = "https://ynkvxixhiwwnocqybprs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlua3Z4aXhoaXd3bm9jcXlicHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDM5MzYsImV4cCI6MjA4MjA3OTkzNn0.9Z_SKdFXQOrZXEHT4J4wkSXBpt097tOuuXI6IFJN_FA";
const supabase = createClient(supabaseUrl, supabaseKey);

const COLORS: Record<string, string> = {
  "國文": "#ef4444", "英文": "#f59e0b", "數學": "#10b981",
  "理化": "#3b82f6", "生物": "#8b5cf6", "地科": "#ec4899",
  "歷史": "#6366f1", "地理": "#14b8a6", "公民": "#f97316"
};

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

  useEffect(() => {
    const savedLogin = localStorage.getItem("studentLogin");
    if (savedLogin) {
      const { name, password } = JSON.parse(savedLogin);
      setLoginName(name);
      fetchStudentData(name, password);
    }
  }, []);

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

    let totalFee = 0;
    let tDetails: any[] = [];
    if (classLogs && rates) {
        const rateMap: Record<string, number> = {};
        rates.forEach((r: any) => rateMap[r.subject] = r.rate);
        classLogs.forEach((log: any) => {
            if (log.class_date && log.class_date.startsWith(currentMonth)) {
                const sub = log.subject || "數學";
                const rate = rateMap[sub] || 0;
                const fee = log.duration * rate;
                totalFee += fee;
                tDetails.push({ ...log, fee, rate });
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
      availableSubjects: subjects
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

  const getFilteredGrades = () => {
    if (!studentData || !gradeFilter) return [];
    return studentData.grades.filter((g: any) => g.subject === gradeFilter);
  };

  const getChartData = () => {
    const list = getFilteredGrades();
    if (list.length === 0) return [];
    const sortedList = [...list].sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());
    return sortedList.map((g: any) => ({ date: g.exam_date, score: g.score, subject: g.subject }));
  };

  const getSubjectAverage = () => {
    const list = getFilteredGrades();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc: number, curr: any) => acc + curr.score, 0);
    return Math.round(sum / list.length);
  };

  if (!studentData) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "20px" }}>
      <div style={{ background: "white", padding: "40px", borderRadius: "24px", width: "100%", maxWidth: "360px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", textAlign: "center" }}>
        <h1 style={{ color: "#1e3a8a", fontSize: "26px", marginBottom: "10px" }}>🎒 學生登入</h1>
        <p style={{ color: "#64748b", marginBottom: "30px", fontSize: "14px" }}>請輸入姓名與密碼查詢學習歷程</p>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div style={inputContainerStyle}>
            <User size={18} style={iconStyle} />
            <input type="text" placeholder="學生姓名" value={loginName} onChange={e => setLoginName(e.target.value)} style={inputStyle} />
          </div>
          <div style={inputContainerStyle}>
            <Lock size={18} style={iconStyle} />
            <input type="password" placeholder="密碼 (預設 1234)" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={inputStyle} />
          </div>
          <button type="submit" disabled={loading} style={btnStyle}>{loading ? "讀取中..." : "登入查詢"}</button>
        </form>
      </div>
    </div>
  );

  const currentChartData = getChartData();
  const currentAvg = getSubjectAverage();

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "20px 20px 100px 20px", fontFamily: "sans-serif", color: "#334155" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <div>
           <h2 style={{ margin: 0, fontSize: "22px", color: "#1e293b" }}>👋 {studentData.info.name}</h2>
           <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>學習是最好的投資</p>
        </div>
        <button onClick={handleLogout} style={{ background: "#f1f5f9", border: "none", padding: "8px", borderRadius: "50%", color: "#64748b", cursor: "pointer" }}><LogOut size={18} /></button>
      </div>

      {activeView === "home" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
            <h3 style={sectionTitleStyle}>📌 快速功能</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div onClick={() => setActiveView("class")} style={{ ...menuCardStyle, borderLeft: "5px solid #10b981" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}><div style={{ fontWeight: "bold", fontSize: "16px", color: "#334155" }}>上課紀錄</div><Calendar size={20} color="#10b981" /></div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>作業與備註查詢</div>
                </div>
                <div onClick={() => setActiveView("grade")} style={{ ...menuCardStyle, borderLeft: "5px solid #3b82f6" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}><div style={{ fontWeight: "bold", fontSize: "16px", color: "#334155" }}>成績分析</div><TrendingUp size={20} color="#3b82f6" /></div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>分數走勢圖表</div>
                </div>
                <div onClick={() => setActiveView("tuition")} style={{ ...menuCardStyle, borderLeft: "5px solid #ec4899" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}><div style={{ fontWeight: "bold", fontSize: "16px", color: "#334155" }}>應繳學費</div><FileText size={20} color="#ec4899" /></div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>本月明細查詢</div>
                </div>
                <div onClick={() => setActiveView("points")} style={{ ...menuCardStyle, borderLeft: "5px solid #f59e0b" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}><div style={{ fontWeight: "bold", fontSize: "16px", color: "#334155" }}>獎勵點數</div><Coins size={20} color="#f59e0b" /></div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>累積: {studentData.totalPoints} 點</div>
                </div>
            </div>
        </div>
      )}

      {activeView === "class" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
            <h3 style={sectionTitleStyle}>📖 上課紀錄</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {studentData.classLogs.map((log: any) => (
                <div key={log.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px dashed #f1f5f9" }}>
                        <span style={{ fontWeight: "bold", color: "#10b981", fontSize: "15px" }}>📅 {log.class_date}</span>
                        <span style={{ fontSize: "13px", background: "#f1f5f9", padding: "4px 10px", borderRadius: "20px", color: "#475569" }}>{log.subject}</span>
                    </div>
                    <div style={{ fontSize: "16px", color: "#334155", marginBottom: "12px", lineHeight: "1.5" }}>{log.progress}</div>
                    {(log.homework || log.note) && (
                    <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", fontSize: "14px" }}>
                        {log.homework && <div style={{ display: "flex", gap: "8px", marginBottom: log.note ? "8px" : "0" }}><BookOpen size={16} style={{ color: "#3b82f6", minWidth: "16px", marginTop: "2px" }} /><span style={{ color: "#475569" }}><b>作業：</b>{log.homework}</span></div>}
                        {log.note && <div style={{ display: "flex", gap: "8px" }}><MessageSquare size={16} style={{ color: "#f59e0b", minWidth: "16px", marginTop: "2px" }} /><span style={{ color: "#475569" }}><b>備註：</b>{log.note}</span></div>}
                    </div>
                    )}
                </div>
                ))}
            </div>
        </div>
      )}

      {activeView === "grade" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <h3 style={{...sectionTitleStyle, marginBottom: 0}}>📝 成績分析</h3>
                {gradeFilter && <div style={{ fontSize: "14px", fontWeight: "bold", color: "#64748b", background: "#f1f5f9", padding: "5px 12px", borderRadius: "20px" }}>總平均：<span style={{ color: "#3b82f6", fontSize: "16px" }}>{currentAvg}</span> 分</div>}
            </div>
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "10px", marginBottom: "10px" }}>
                {studentData.availableSubjects.map((sub: any) => (
                    <button key={sub} onClick={() => setGradeFilter(sub)} style={filterBtnStyle(gradeFilter === sub)}>{sub}</button>
                ))}
            </div>
            {currentChartData.length > 0 ? (
                <div style={{ ...cardStyle, height: "250px", padding: "10px 10px 0 0", marginBottom: "20px" }}>
                    <ResponsiveContainer width="100%" height={230}>
                        <LineChart data={currentChartData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{fontSize: 10}} /><YAxis domain={[0, 100]} tick={{fontSize: 10}} /><Tooltip /><Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{r:4}} /></LineChart>
                    </ResponsiveContainer>
                </div>
            ) : <div style={{ ...emptyStyle, marginBottom: "20px" }}>尚無此科目成績</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {getFilteredGrades().map((g: any) => (
                    <div key={g.id} style={{ ...cardStyle, textAlign: "center", padding: "15px", borderTop: "3px solid #cbd5e1" }}>
                        <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "5px" }}>{g.exam_date}</div>
                        <div style={{ fontSize: "14px", fontWeight: "bold", color: "#334155" }}>{g.subject}</div>
                        <div style={{ fontSize: "24px", fontWeight: "bold", color: g.score >= 60 ? "#2563eb" : "#ef4444", margin: "5px 0" }}>{g.score}</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>{g.unit}</div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {activeView === "tuition" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
             <h3 style={sectionTitleStyle}>💰 本月學費明細</h3>
             <div style={{ background: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)", color: "white", padding: "30px", borderRadius: "20px", marginBottom: "25px", textAlign: "center", boxShadow: "0 10px 20px rgba(236, 72, 153, 0.2)" }}>
                 <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "5px" }}>{currentMonth} 應繳總額</div>
                 <div style={{ fontSize: "42px", fontWeight: "bold" }}>${tuitionTotal.toLocaleString()}</div>
             </div>
             <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                 <div style={{ padding: "15px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: "bold", fontSize: "14px", color: "#64748b" }}>計算明細 ({tuitionDetails.length} 筆)</div>
                 {tuitionDetails.length > 0 ? tuitionDetails.map((item: any, idx: number) => (
                     <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "15px", borderBottom: idx !== tuitionDetails.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                         <div><div style={{ fontSize: "15px", fontWeight: "bold", color: "#334155" }}>{item.class_date} <span style={{fontSize: "12px", color: "#64748b", fontWeight: "normal"}}>({item.subject})</span></div><div style={{ fontSize: "12px", color: "#94a3b8" }}>{item.duration} hr × ${item.rate}/hr</div></div>
                         <div style={{ fontWeight: "bold", color: "#be185d" }}>${item.fee}</div>
                     </div>
                 )) : <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>本月尚無上課紀錄</div>}
             </div>
        </div>
      )}

      {activeView === "points" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
            <h3 style={sectionTitleStyle}>💎 點數紀錄</h3>
             <div style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "white", padding: "20px", borderRadius: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <div><div style={{ fontSize: "14px", opacity: 0.9 }}>目前累積</div><div style={{ fontSize: "28px", fontWeight: "bold" }}>{studentData.totalPoints} 點</div></div>
                 <Award size={32} color="white" style={{ opacity: 0.8 }} />
             </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {studentData.points.map((point: any) => (
                <div key={point.id} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div><div style={{ fontSize: "14px", color: "#64748b" }}>{new Date(point.created_at).toLocaleDateString()}</div><div style={{ fontSize: "16px", fontWeight: "bold", color: "#334155" }}>{point.reason}</div></div>
                    <div style={{ fontSize: "20px", fontWeight: "bold", color: point.points > 0 ? "#10b981" : "#ef4444" }}>{point.points > 0 ? "+" : ""}{point.points}</div>
                </div>
                ))}
                {studentData.points.length === 0 && <div style={emptyStyle}>目前無點數紀錄</div>}
            </div>
        </div>
      )}

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-around", padding: "10px 0", zIndex: 100, maxWidth: "600px", margin: "auto", boxShadow: "0 -4px 6px -1px rgba(0,0,0,0.05)" }}>
         <button onClick={() => setActiveView("home")} style={navBtnStyle(activeView === "home")}><Home size={22} /><span style={{fontSize: "11px", marginTop: "3px"}}>首頁</span></button>
         <button onClick={() => setActiveView("class")} style={navBtnStyle(activeView === "class")}><BookOpen size={22} /><span style={{fontSize: "11px", marginTop: "3px"}}>上課</span></button>
         <button onClick={() => setActiveView("grade")} style={navBtnStyle(activeView === "grade")}><TrendingUp size={22} /><span style={{fontSize: "11px", marginTop: "3px"}}>成績</span></button>
         <button onClick={() => setActiveView("tuition")} style={navBtnStyle(activeView === "tuition")}><DollarSign size={22} /><span style={{fontSize: "11px", marginTop: "3px"}}>學費</span></button>
         <button onClick={() => setActiveView("points")} style={navBtnStyle(activeView === "points")}><Coins size={22} /><span style={{fontSize: "11px", marginTop: "3px"}}>點數</span></button>
      </div>

      <style jsx>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

const inputContainerStyle = { position: "relative" as const };
const iconStyle = { position: "absolute" as const, left: "15px", top: "14px", color: "#94a3b8" };
const inputStyle = { width: "100%", padding: "12px 12px 12px 45px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "16px", outline: "none", boxSizing: "border-box" as const };
const btnStyle = { width: "100%", padding: "14px", background: "#1e3a8a", color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" };
const sectionTitleStyle = { fontSize: "18px", color: "#1e293b", margin: "0 0 15px 0", fontWeight: "bold", borderLeft: "4px solid #1e3a8a", paddingLeft: "10px" };
const cardStyle = { background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" };
const menuCardStyle = { background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px rgba(0,0,0,0.02)", cursor: "pointer", transition: "transform 0.1s" };
const emptyStyle = { textAlign: "center" as const, color: "#94a3b8", padding: "30px", background: "#f8fafc", borderRadius: "12px" };
const filterBtnStyle = (active: boolean) => ({ padding: "6px 14px", borderRadius: "20px", border: active ? `1px solid #3b82f6` : "1px solid #e2e8f0", background: active ? "#3b82f6" : "white", color: active ? "white" : "#64748b", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" as const, transition: "0.2s" });
const navBtnStyle = (active: boolean) => ({ background: "transparent", border: "none", display: "flex", flexDirection: "column" as const, alignItems: "center", color: active ? "#1e3a8a" : "#94a3b8", cursor: "pointer", flex: 1, fontWeight: active ? "bold" : "normal" });