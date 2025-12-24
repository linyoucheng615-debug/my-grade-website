"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion"; // 借用一下動畫庫讓後台也漂亮點
import { User, Lock, LogOut } from "lucide-react";

export default function AdminPage() {
  // --- 登入狀態管理 ---
  const [currentTeacher, setCurrentTeacher] = useState<any>(null); // 存現在是哪位老師登入
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // --- 後台功能狀態 ---
  const [activeTab, setActiveTab] = useState("class");
  const [loading, setLoading] = useState(false);
  const [studentList, setStudentList] = useState<any[]>([]);
  
  // 表單共用
  const [selectedName, setSelectedName] = useState(""); 
  
  // 各功能欄位
  const [subject, setSubject] = useState("數學");
  const [score, setScore] = useState("");
  const [examDate, setExamDate] = useState("");
  const [unit, setUnit] = useState("");
  
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");

  const [classDate, setClassDate] = useState(new Date().toISOString().slice(0, 10));
  const [progress, setProgress] = useState("");
  const [homework, setHomework] = useState("");
  const [duration, setDuration] = useState("1");

  const [tuitionMonth, setTuitionMonth] = useState(new Date().toISOString().slice(0, 7));
  const [tuitionResult, setTuitionResult] = useState<any>(null);
  const [newRate, setNewRate] = useState("");

  // ★★★ 1. 檢查是否有登入紀錄 (讓老師重整網頁不用重登) ★★★
  useEffect(() => {
    const savedTeacher = localStorage.getItem("teacherName");
    if (savedTeacher) {
      setCurrentTeacher({ name: savedTeacher });
    }
  }, []);

  // ★★★ 2. 登入後，才去抓學生名單 ★★★
  useEffect(() => {
    if (currentTeacher) {
      const fetchStudents = async () => {
        const { data } = await supabase.from("students").select("id, name, tuition_rate");
        if (data) {
          setStudentList(data);
          if (data.length > 0) setSelectedName(data[0].name);
        }
      };
      fetchStudents();
    }
  }, [currentTeacher]);

  // --- 老師登入邏輯 ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanName = loginName.trim();
    const cleanPass = loginPassword.trim();

    const { data } = await supabase
      .from("teachers")
      .select("*")
      .eq("name", cleanName)
      .eq("password", cleanPass)
      .single();

    setLoading(false);

    if (data) {
      setCurrentTeacher(data);
      localStorage.setItem("teacherName", data.name); // 記住老師
    } else {
      alert("登入失敗：名字或密碼錯誤 ❌");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("teacherName");
    setCurrentTeacher(null);
    setLoginName("");
    setLoginPassword("");
  };

  // --- 送出功能 (現在不用再檢查 1234 密碼了，因為已經登入了) ---

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedName || !score || !examDate || !unit) return alert("請填寫完整！");
    setLoading(true);
    const { error } = await supabase.from("grades").insert([
      { student_name: selectedName, subject, score: Number(score), exam_date: examDate, unit },
    ]);
    setLoading(false);
    if (error) alert("錯誤：" + error.message);
    else { alert("✅ 成績新增成功！"); setScore(""); setUnit(""); }
  };

  const handlePointSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedName || !points || !reason) return alert("請填寫完整！");
    setLoading(true);
    const { error } = await supabase.from("point_logs").insert([
      { student_name: selectedName, points: Number(points), reason },
    ]);
    setLoading(false);
    if (error) alert("錯誤：" + error.message);
    else { alert("💎 點數新增成功！"); setPoints(""); setReason(""); }
  };

  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedName || !classDate || !progress || !homework || !duration) return alert("請填寫完整！");
    setLoading(true);
    const { error } = await supabase.from("class_logs").insert([
      { student_name: selectedName, class_date: classDate, progress, homework, duration: Number(duration) },
    ]);
    setLoading(false);
    if (error) alert("錯誤：" + error.message);
    else { alert("📚 上課紀錄新增成功！"); setProgress(""); setHomework(""); }
  };

  const handleTuitionCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: classData } = await supabase.from("class_logs").select("*").eq("student_name", selectedName).like("class_date", `${tuitionMonth}%`);
    const { data: studentData } = await supabase.from("students").select("tuition_rate").eq("name", selectedName).single();
    setLoading(false);

    if (!studentData) return alert("資料錯誤");
    const totalHours = classData?.reduce((sum, log) => sum + (log.duration || 0), 0) || 0;
    const rate = studentData.tuition_rate || 0;

    setTuitionResult({ hours: totalHours, rate: rate, total: Math.round(totalHours * rate), classes: classData || [] });
    setNewRate(rate.toString());
  };

  const handleUpdateRate = async () => {
    setLoading(true);
    const { error } = await supabase.from("students").update({ tuition_rate: Number(newRate) }).eq("name", selectedName);
    setLoading(false);
    if (error) alert("更新失敗：" + error.message);
    else alert("✅ 時薪已更新！");
  };

  // --- 畫面渲染：如果沒登入，顯示登入框 ---
  if (!currentTeacher) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#111827" }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: "white", padding: "40px", borderRadius: "15px", width: "100%", maxWidth: "350px" }}>
          <h1 style={{ textAlign: "center", marginBottom: "20px" }}>🍎 老師登入</h1>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ position: "relative" }}>
              <User size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#999" }} />
              <input type="text" placeholder="老師姓名" value={loginName} onChange={(e) => setLoginName(e.target.value)} style={loginInputStyle} />
            </div>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "#999" }} />
              <input type="password" placeholder="密碼" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={loginInputStyle} />
            </div>
            <button type="submit" disabled={loading} style={{ background: "#2563eb", color: "white", padding: "12px", borderRadius: "8px", border: "none", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}>
              {loading ? "驗證中..." : "進入後台"}
            </button>
          </form>
          <div style={{ marginTop: "20px", textAlign: "center" }}><a href="/" style={{ color: "#666", textDecoration: "none", fontSize: "14px" }}>← 回首頁</a></div>
        </motion.div>
      </div>
    );
  }

  // --- 畫面渲染：已登入，顯示控制台 ---
  return (
    <div style={{ maxWidth: "600px", margin: "30px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "24px" }}>👩‍🏫 {currentTeacher.name}的控制台</h1>
        <button onClick={handleLogout} style={{ background: "#fee2e2", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "#ef4444" }}>
          <LogOut size={16} /> 登出
        </button>
      </div>

      {/* 學生選單 */}
      <div style={{ marginBottom: "20px", padding: "15px", background: "#f3f4f6", borderRadius: "10px" }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>目前操作學生</label>
        <select value={selectedName} onChange={(e) => { setSelectedName(e.target.value); setTuitionResult(null); }} style={selectStyle}>
          {studentList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      {/* 分頁按鈕 */}
      <div style={{ display: "flex", gap: "5px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button onClick={() => setActiveTab("class")} style={getTabStyle(activeTab === "class", "#059669")}>📚 上課</button>
        <button onClick={() => setActiveTab("grade")} style={getTabStyle(activeTab === "grade", "#2563eb")}>📝 成績</button>
        <button onClick={() => setActiveTab("point")} style={getTabStyle(activeTab === "point", "#ca8a04")}>💎 點數</button>
        <button onClick={() => setActiveTab("tuition")} style={getTabStyle(activeTab === "tuition", "#db2777")}>💰 算學費</button>
      </div>

      {/* 各功能區塊 (省略重複的樣式細節，邏輯與之前相同) */}
      {activeTab === "class" && (
        <form onSubmit={handleClassSubmit} style={{ ...formStyle, background: "#ecfdf5" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>上課日期</label>
              <input type="date" value={classDate} onChange={(e) => setClassDate(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>時數 (hr)</label>
              <input type="number" step="0.5" value={duration} onChange={(e) => setDuration(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <input type="text" value={progress} onChange={(e) => setProgress(e.target.value)} placeholder="進度 (如: 3-1)" style={inputStyle} />
          <textarea value={homework} onChange={(e) => setHomework(e.target.value)} placeholder="作業" style={{ ...inputStyle, height: "80px" }} />
          <button type="submit" disabled={loading} style={btnStyle("#059669", loading)}>{loading ? "..." : "新增紀錄"}</button>
        </form>
      )}

      {activeTab === "grade" && (
        <form onSubmit={handleGradeSubmit} style={formStyle}>
          <div style={{ display: "flex", gap: "10px" }}>
            <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} style={inputStyle} />
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={selectStyle}>
              <option value="數學">數學</option>
              <option value="英文">英文</option>
              <option value="理化">理化</option>
            </select>
          </div>
          <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="單元" style={inputStyle} />
          <input type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="分數" style={inputStyle} />
          <button type="submit" disabled={loading} style={btnStyle("#2563eb", loading)}>{loading ? "..." : "新增成績"}</button>
        </form>
      )}

      {activeTab === "point" && (
        <form onSubmit={handlePointSubmit} style={{ ...formStyle, background: "#fefce8" }}>
          <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} placeholder="點數" style={inputStyle} />
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="原因" style={inputStyle} />
          <button type="submit" disabled={loading} style={btnStyle("#ca8a04", loading)}>{loading ? "..." : "新增點數"}</button>
        </form>
      )}

      {activeTab === "tuition" && (
        <div style={{ ...formStyle, background: "#fdf2f8" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>選擇月份</label>
              <input type="month" value={tuitionMonth} onChange={(e) => setTuitionMonth(e.target.value)} style={inputStyle} />
            </div>
            <button onClick={handleTuitionCheck} disabled={loading} style={{ ...btnStyle("#db2777", loading), padding: "10px 20px" }}>查詢</button>
          </div>
          {tuitionResult && (
            <div style={{ marginTop: "20px", background: "white", padding: "20px", borderRadius: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                <div>
                  <div style={{ color: "#888", fontSize: "14px" }}>總時數</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>{tuitionResult.hours} 小時</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#888", fontSize: "14px" }}>本月應收</div>
                  <div style={{ fontSize: "32px", fontWeight: "bold", color: "#db2777" }}>${tuitionResult.total}</div>
                </div>
              </div>
               <div style={{ borderTop: "1px solid #eee", paddingTop: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "14px" }}>目前時薪:</span>
                <input type="number" value={newRate} onChange={(e) => setNewRate(e.target.value)} style={{ width: "80px", padding: "5px", border: "1px solid #ddd" }} />
                <button onClick={handleUpdateRate} style={{ background: "#666", color: "white", border: "none", padding: "5px 10px", borderRadius: "5px", cursor: "pointer", fontSize: "12px" }}>更新</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 樣式區
const loginInputStyle = { width: "100%", padding: "12px 12px 12px 40px", borderRadius: "10px", border: "1px solid #ddd", fontSize: "16px", boxSizing: "border-box" as const };
const inputStyle = { width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" as const };
const selectStyle = { width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "16px", boxSizing: "border-box" as const };
const labelStyle = { fontSize: "12px", fontWeight: "bold", marginBottom: "5px", display: "block", color: "#555" };
const formStyle = { display: "flex", flexDirection: "column" as const, gap: "15px", background: "#f9fafb", padding: "20px", borderRadius: "10px" };
const getTabStyle = (active: boolean, color: string) => ({
  flex: "1 0 20%", padding: "10px", borderRadius: "8px", border: "none", fontSize: "14px", fontWeight: "bold", cursor: "pointer",
  background: active ? color : "#e5e7eb", color: active ? "white" : "#374151"
});
const btnStyle = (color: string, loading: boolean) => ({
  background: color, color: "white", padding: "10px", borderRadius: "8px", border: "none", fontSize: "16px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold"
});