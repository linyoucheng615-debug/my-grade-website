"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Trophy, LineChart, LogOut, User, Lock, BookOpen, Filter } from "lucide-react";
import { LineChart as ReChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// --- 定義所有科目清單 ---
const SUBJECTS = ["國文", "英文", "數學", "理化", "生物", "地科", "歷史", "地理", "公民"];

// --- Dashboard ---
function Dashboard({ studentName, onLogout }: { studentName: string; onLogout: () => void }) {
  const [activeView, setActiveView] = useState("menu");
  const [grades, setGrades] = useState<any[]>([]);
  const [points, setPoints] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [tuitionInfo, setTuitionInfo] = useState({ hours: 0, total: 0 });

  // ★★★ 新增：目前選擇要查看趨勢的科目 ★★★
  const [selectedSubject, setSelectedSubject] = useState("數學");

  useEffect(() => {
    const fetchData = async () => {
      // 1. 抓成績 (全部抓回來，前端再過濾)
      const { data: gradeData } = await supabase.from("grades").select("*").eq("student_name", studentName).order("exam_date", { ascending: true });
      // 2. 抓點數
      const { data: pointData } = await supabase.from("point_logs").select("*").eq("student_name", studentName).order("created_at", { ascending: false });
      // 3. 抓上課紀錄
      const { data: classData } = await supabase.from("class_logs").select("*").eq("student_name", studentName).order("class_date", { ascending: false });
      // 4. 抓時薪
      const { data: studentData } = await supabase.from("students").select("tuition_rate").eq("name", studentName).single();

      if (gradeData) setGrades(gradeData);
      if (pointData) setPoints(pointData);
      if (classData) setClasses(classData);

      if (classData && studentData) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const thisMonthClasses = classData.filter((c: any) => c.class_date.startsWith(currentMonth));
        const totalHours = thisMonthClasses.reduce((sum: number, c: any) => sum + (c.duration || 0), 0);
        setTuitionInfo({ hours: totalHours, total: Math.round(totalHours * (studentData.tuition_rate || 0)) });
      }
    };
    fetchData();
  }, [studentName]);

  const totalPoints = points.reduce((sum, p) => sum + p.points, 0);

  // ★★★ 過濾出「目前選擇科目」的成績數據 ★★★
  const filteredGrades = grades.filter((g) => g.subject === selectedSubject);

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      
      {/* 頂部 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>👋 嗨，{studentName}</h2>
        <button onClick={onLogout} style={{ background: "#fee2e2", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "#ef4444" }}>
          <LogOut size={16} /> 登出
        </button>
      </div>

      {/* 資訊卡片 */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "30px" }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ flex: 1, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "20px", borderRadius: "15px", color: "white", boxShadow: "0 5px 15px rgba(118, 75, 162, 0.3)" }}>
          <div style={{ fontSize: "12px", opacity: 0.9 }}>累積點數</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>💎 {totalPoints}</div>
        </motion.div>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} style={{ flex: 1, background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)", padding: "20px", borderRadius: "15px", color: "white", boxShadow: "0 5px 15px rgba(219, 39, 119, 0.3)" }}>
          <div style={{ fontSize: "12px", opacity: 0.9 }}>本月應繳 ({tuitionInfo.hours}hr)</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>$ {tuitionInfo.total}</div>
        </motion.div>
      </div>

      {/* 主選單 */}
      {activeView === "menu" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
             <MenuButton onClick={() => setActiveView("classes")} icon={<BookOpen size={32} />} color="#059669" bg="#ecfdf5" label="上課與作業紀錄" />
          </div>
          <MenuButton onClick={() => setActiveView("grades")} icon={<LineChart size={32} />} color="#0ea5e9" bg="#e0f2fe" label="成績趨勢" />
          <MenuButton onClick={() => setActiveView("points")} icon={<Trophy size={32} />} color="#ca8a04" bg="#fef9c3" label="點數明細" />
        </div>
      )}

      {/* 內頁：成績趨勢 (大升級) */}
      {activeView === "grades" && (
        <PageView title="📈 科目成績趨勢" onBack={() => setActiveView("menu")}>
          
          {/* 1. 科目選擇器 */}
          <div style={{ padding: "0 20px 20px 20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "10px", fontWeight: "bold", color: "#555" }}>
              <Filter size={16} /> 選擇科目：
            </label>
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px", background: "#f9fafb" }}
            >
              {SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* 2. 圖表區域 */}
          <div style={{ height: "300px", position: "relative" }}>
            {filteredGrades.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ReChart data={filteredGrades} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="exam_date" tick={{fontSize: 12}} tickFormatter={(val) => val.slice(5)} /> {/* 只顯示 月-日 */}
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
                    labelFormatter={(label) => `日期: ${label}`} 
                  />
                  {/* ★★★ 動畫設定：animationDuration 設定流線速度 ★★★ */}
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#2563eb" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: "#2563eb", strokeWidth: 0 }} 
                    activeDot={{ r: 7 }}
                    animationDuration={2000} // 2秒畫完
                    animationEasing="ease-in-out" // 起步慢、中間快、結尾慢
                  />
                </ReChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#999", flexDirection: "column", gap: "10px" }}>
                <LineChart size={40} color="#ddd" />
                <p>這個科目目前還沒有成績紀錄喔！</p>
              </div>
            )}
          </div>
        </PageView>
      )}

      {/* 內頁：點數 */}
      {activeView === "points" && (
        <PageView title="📜 點數變動紀錄" onBack={() => setActiveView("menu")}>
          {points.map((p, i) => (
            <div key={i} style={listItemStyle}>
              <div>
                <div style={{ fontWeight: "bold" }}>{p.reason}</div>
                <div style={{ fontSize: "12px", color: "#999" }}>{new Date(p.created_at).toLocaleDateString()}</div>
              </div>
              <div style={{ fontWeight: "bold", color: p.points > 0 ? "#16a34a" : "#dc2626" }}>{p.points > 0 ? "+" : ""}{p.points}</div>
            </div>
          ))}
        </PageView>
      )}

      {/* 內頁：上課紀錄 */}
      {activeView === "classes" && (
        <PageView title="📚 上課與作業紀錄" onBack={() => setActiveView("menu")}>
          {classes.length === 0 ? <div style={{textAlign:'center', color:'#999', padding:'20px'}}>目前沒有紀錄</div> : null}
          {classes.map((c, i) => (
            <div key={i} style={{ ...listItemStyle, flexDirection: "column", alignItems: "flex-start", gap: "5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <div style={{ fontWeight: "bold", color: "#059669", fontSize:"18px" }}>{new Date(c.class_date).toLocaleDateString()}</div>
                <div style={{ fontSize: "14px", background:"#dcfce7", color:"#166534", padding:"2px 8px", borderRadius:"10px", fontWeight:"bold" }}>
                   ⏱️ {c.duration || 0} 小時
                </div>
              </div>
              <div style={{ marginTop: "5px" }}>
                <span style={{ fontWeight: "bold", color: "#555" }}>📖 進度：</span> {c.progress}
              </div>
              <div style={{ background: "#fffbeb", padding: "8px", width: "100%", borderRadius: "5px", borderLeft: "3px solid #f59e0b", fontSize: "14px", boxSizing: "border-box" }}>
                <span style={{ fontWeight: "bold", color: "#d97706" }}>✍️ 作業：</span> {c.homework}
              </div>
            </div>
          ))}
        </PageView>
      )}
    </div>
  );
}

// --- Login 頁面 (保持不變) ---
export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [inputName, setInputName] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("studentName");
    if (savedName) {
      setInputName(savedName);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanName = inputName.trim();
    const cleanPassword = inputPassword.trim();
    const { data } = await supabase.from("students").select("*").eq("name", cleanName).eq("password", cleanPassword);
    setLoading(false);
    if (data && data.length > 0) {
      localStorage.setItem("studentName", cleanName);
      setIsLoggedIn(true);
    } else {
      alert("登入失敗 ❌ (請確認名字或密碼)");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("studentName");
    setIsLoggedIn(false);
    setInputName(""); 
    setInputPassword("");
  };

  if (isLoggedIn) return <Dashboard studentName={inputName} onLogout={handleLogout} />;

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6" }}>
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: "white", padding: "40px", borderRadius: "20px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", width: "100%", maxWidth: "350px" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ margin: 0, fontSize: "24px" }}>🔐 家長專區</h1>
          <p style={{ color: "#666", margin: "10px 0 0 0" }}>輸入資訊查詢成績與紀錄</p>
        </div>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div style={{ position: "relative" }}>
            <User size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#999" }} />
            <input type="text" placeholder="學生姓名" value={inputName} onChange={(e) => setInputName(e.target.value)} style={loginInputStyle} />
          </div>
          <div style={{ position: "relative" }}>
            <Lock size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#999" }} />
            <input type="password" placeholder="密碼" value={inputPassword} onChange={(e) => setInputPassword(e.target.value)} style={loginInputStyle} />
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} style={{ padding: "12px", borderRadius: "10px", border: "none", background: "#2563eb", color: "white", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" }}>
            {loading ? "登入中..." : "登入系統"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

const loginInputStyle = { width: "100%", padding: "12px 12px 12px 40px", borderRadius: "10px", border: "1px solid #ddd", fontSize: "16px", boxSizing: "border-box" as const };
const listItemStyle = { display: "flex", justifyContent: "space-between", padding: "15px 20px", borderBottom: "1px solid #f0f0f0" };

function MenuButton({ onClick, icon, color, bg, label }: any) {
  return (
    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClick} style={{ padding: "20px", border: "none", borderRadius: "15px", background: "white", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "100%" }}>
      <div style={{ padding: "15px", background: bg, borderRadius: "50%", color: color }}>{icon}</div>
      <span style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}>{label}</span>
    </motion.button>
  );
}

function PageView({ title, onBack, children }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <button onClick={onBack} style={{ marginBottom: "15px", border: "none", background: "none", color: "#666", cursor: "pointer" }}>← 回選單</button>
      <div style={{ background: "white", borderRadius: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", overflow: "hidden", paddingBottom: "20px" }}>
        <h3 style={{ margin: "20px", borderBottom: "1px solid #eee", paddingBottom: "15px" }}>{title}</h3>
        {children}
      </div>
    </motion.div>
  );
}