"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { User, Lock, LogOut, TrendingUp, Award, Pencil, Trash2, XCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 科目清單 & 顏色
const SUBJECTS = ["國文", "英文", "數學", "理化", "生物", "地科", "歷史", "地理", "公民"];
const COLORS = {
  "國文": "#ef4444", "英文": "#f59e0b", "數學": "#10b981",
  "理化": "#3b82f6", "生物": "#8b5cf6", "地科": "#ec4899",
  "歷史": "#6366f1", "地理": "#14b8a6", "公民": "#f97316"
};

export default function AdminPage() {
  // --- 登入狀態 ---
  const [currentTeacher, setCurrentTeacher] = useState<any>(null);
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // --- 後台狀態 ---
  const [activeTab, setActiveTab] = useState("class");
  const [loading, setLoading] = useState(false);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [selectedName, setSelectedName] = useState(""); 
  
  // --- ★★★ 編輯模式狀態 ★★★ ---
  const [editingId, setEditingId] = useState<number | null>(null); // 如果有值，代表正在編輯該 ID
  const [historyData, setHistoryData] = useState<any[]>([]); // 該分頁的歷史資料列表

  // --- 表單資料 ---
  const [subject, setSubject] = useState(SUBJECTS[0]);
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

  // 報表用
  const [studentStats, setStudentStats] = useState({ points: 0, average: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentClasses, setRecentClasses] = useState<any[]>([]);

  // 1. 檢查登入
  useEffect(() => {
    const savedTeacher = localStorage.getItem("teacherName");
    if (savedTeacher) setCurrentTeacher({ name: savedTeacher });
  }, []);

  // 2. 抓學生名單
  useEffect(() => {
    if (currentTeacher) {
      const fetchStudents = async () => {
        const { data } = await supabase.from("students").select("id, name, tuition_rate");
        if (data && data.length > 0) {
          setStudentList(data);
          if (!selectedName) setSelectedName(data[0].name);
        }
      };
      fetchStudents();
    }
  }, [currentTeacher]);

  // 3. 切換學生或分頁時：重置表單 + 抓取歷史資料
  useEffect(() => {
    if (currentTeacher && selectedName) {
      resetForm();
      fetchHistoryData();
      if (activeTab === "view") fetchStudentDetails();
    }
  }, [selectedName, activeTab]);

  // --- ★★★ 核心功能：抓取歷史資料 ★★★ ---
  const fetchHistoryData = async () => {
    let tableName = "";
    if (activeTab === "class") tableName = "class_logs";
    if (activeTab === "grade") tableName = "grades";
    if (activeTab === "point") tableName = "point_logs";

    if (!tableName) return;

    // 抓取最近 10 筆，按 ID 倒序 (最新的在上面)
    const { data } = await supabase
      .from(tableName)
      .select("*")
      .eq("student_name", selectedName)
      .order("created_at", { ascending: false }) 
      .limit(10);
    
    if (data) setHistoryData(data);
  };

  // --- ★★★ 核心功能：進入編輯模式 ★★★ ---
  const handleEdit = (item: any) => {
    setEditingId(item.id);
    if (activeTab === "class") {
      setClassDate(item.class_date);
      setProgress(item.progress);
      setHomework(item.homework);
      setDuration(item.duration);
    } else if (activeTab === "grade") {
      setExamDate(item.exam_date);
      setSubject(item.subject);
      setUnit(item.unit);
      setScore(item.score);
    } else if (activeTab === "point") {
      setPoints(item.points);
      setReason(item.reason);
    }
    // 滾動到最上方
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- ★★★ 核心功能：刪除資料 ★★★ ---
  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除這筆資料嗎？(刪除後無法復原)")) return;
    
    let tableName = "";
    if (activeTab === "class") tableName = "class_logs";
    if (activeTab === "grade") tableName = "grades";
    if (activeTab === "point") tableName = "point_logs";

    setLoading(true);
    const { error } = await supabase.from(tableName).delete().eq("id", id);
    setLoading(false);

    if (error) alert("刪除失敗：" + error.message);
    else {
      alert("🗑️ 刪除成功");
      fetchHistoryData(); // 重新整理列表
      if (editingId === id) resetForm(); // 如果剛好在編輯這筆，重置表單
    }
  };

  // 重置表單
  const resetForm = () => {
    setEditingId(null);
    setScore(""); setUnit("");
    setPoints(""); setReason("");
    setProgress(""); setHomework("");
    // 日期不重置，方便連續輸入
  };

  // --- 登入/登出 ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data } = await supabase.from("teachers").select("*").eq("name", loginName.trim()).eq("password", loginPassword.trim()).single();
    setLoading(false);
    if (data) { setCurrentTeacher(data); localStorage.setItem("teacherName", data.name); }
    else alert("登入失敗 ❌");
  };
  const handleLogout = () => { localStorage.removeItem("teacherName"); setCurrentTeacher(null); };

  // --- 送出表單 (新增 或 修改) ---
  const handleSubmit = async (e: React.FormEvent, type: "grade" | "point" | "class") => {
    e.preventDefault();
    setLoading(true);
    let error = null;

    // 準備資料
    let payload: any = {};
    let tableName = "";

    if (type === "grade") {
      if (!selectedName || !score || !examDate || !unit) { setLoading(false); return alert("請填寫完整"); }
      tableName = "grades";
      payload = { student_name: selectedName, subject, score: Number(score), exam_date: examDate, unit };
    } else if (type === "point") {
      if (!selectedName || !points || !reason) { setLoading(false); return alert("請填寫完整"); }
      tableName = "point_logs";
      payload = { student_name: selectedName, points: Number(points), reason };
    } else if (type === "class") {
      if (!selectedName || !classDate || !progress || !homework || !duration) { setLoading(false); return alert("請填寫完整"); }
      tableName = "class_logs";
      payload = { student_name: selectedName, class_date: classDate, progress, homework, duration: Number(duration) };
    }

    // 判斷是 新增 還是 更新
    if (editingId) {
      // 更新模式
      const { error: updateError } = await supabase.from(tableName).update(payload).eq("id", editingId);
      error = updateError;
    } else {
      // 新增模式
      const { error: insertError } = await supabase.from(tableName).insert([payload]);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      alert("操作失敗：" + error.message);
    } else {
      alert(editingId ? "✅ 修改成功！" : "🎉 新增成功！");
      resetForm(); // 清空表單
      fetchHistoryData(); // 更新下方列表
    }
  };

  // --- 報表資料 ---
  const fetchStudentDetails = async () => {
    const { data: pointData } = await supabase.from("point_logs").select("points").eq("student_name", selectedName);
    const totalPoints = pointData?.reduce((sum, item) => sum + item.points, 0) || 0;
    const { data: gradeData } = await supabase.from("grades").select("*").eq("student_name", selectedName).order("exam_date", { ascending: true });
    let chartD: any[] = [];
    let avgScore = 0;
    if (gradeData && gradeData.length > 0) {
      avgScore = Math.round(gradeData.reduce((sum, item) => sum + item.score, 0) / gradeData.length);
      const grouped: any = {};
      gradeData.forEach((g) => {
        if (!grouped[g.exam_date]) grouped[g.exam_date] = { date: g.exam_date };
        grouped[g.exam_date][g.subject] = g.score;
      });
      chartD = Object.values(grouped);
    }
    const { data: classData } = await supabase.from("class_logs").select("*").eq("student_name", selectedName).order("class_date", { ascending: false }).limit(5);
    setStudentStats({ points: totalPoints, average: avgScore });
    setChartData(chartD);
    setRecentClasses(classData || []);
  };
  
  // 算學費
  const handleTuitionCheck = async (e: React.FormEvent) => { /* ...維持原樣... */
    e.preventDefault(); setLoading(true);
    const { data: classData } = await supabase.from("class_logs").select("*").eq("student_name", selectedName).like("class_date", `${tuitionMonth}%`);
    const { data: studentData } = await supabase.from("students").select("tuition_rate").eq("name", selectedName).single();
    setLoading(false);
    if (!studentData) return alert("資料錯誤");
    const totalHours = classData?.reduce((sum, log) => sum + (log.duration || 0), 0) || 0;
    const rate = studentData.tuition_rate || 0;
    setTuitionResult({ hours: totalHours, rate: rate, total: Math.round(totalHours * rate), classes: classData || [] });
    setNewRate(rate.toString());
  };
  const handleUpdateRate = async () => { /* ...維持原樣... */
    setLoading(true);
    const { error } = await supabase.from("students").update({ tuition_rate: Number(newRate) }).eq("name", selectedName);
    setLoading(false); if (error) alert("失敗"); else alert("更新成功");
  };


  // --- 介面 ---
  if (!currentTeacher) return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#111827" }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: "white", padding: "40px", borderRadius: "15px", width: "100%", maxWidth: "350px" }}>
          <h1 style={{ textAlign: "center", marginBottom: "20px" }}>🍎 老師登入</h1>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input type="text" placeholder="老師姓名" value={loginName} onChange={(e) => setLoginName(e.target.value)} style={loginInputStyle} />
            <input type="password" placeholder="密碼" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={loginInputStyle} />
            <button type="submit" disabled={loading} style={{ background: "#2563eb", color: "white", padding: "12px", borderRadius: "8px", border: "none", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}>{loading ? "..." : "進入後台"}</button>
          </form>
          <div style={{ marginTop: "20px", textAlign: "center" }}><a href="/" style={{ color: "#666", textDecoration: "none", fontSize: "14px" }}>← 回首頁</a></div>
        </motion.div>
      </div>
  );

  return (
    <div style={{ maxWidth: "800px", margin: "30px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "24px" }}>👩‍🏫 {currentTeacher.name}的控制台</h1>
        <button onClick={handleLogout} style={{ background: "#fee2e2", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "#ef4444" }}><LogOut size={16} /> 登出</button>
      </div>

      <div style={{ marginBottom: "20px", padding: "15px", background: "#f3f4f6", borderRadius: "10px", borderLeft: "5px solid #2563eb" }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px", color: "#374151" }}>目前操作學生：</label>
        <select value={selectedName} onChange={(e) => { setSelectedName(e.target.value); setTuitionResult(null); }} style={selectStyle}>
          {studentList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", gap: "5px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button onClick={() => setActiveTab("class")} style={getTabStyle(activeTab === "class", "#059669")}>📚 上課</button>
        <button onClick={() => setActiveTab("grade")} style={getTabStyle(activeTab === "grade", "#2563eb")}>📝 成績</button>
        <button onClick={() => setActiveTab("point")} style={getTabStyle(activeTab === "point", "#ca8a04")}>💎 點數</button>
        <button onClick={() => setActiveTab("tuition")} style={getTabStyle(activeTab === "tuition", "#db2777")}>💰 算學費</button>
        <button onClick={() => setActiveTab("view")} style={getTabStyle(activeTab === "view", "#7c3aed")}>🔍 查看報表</button>
      </div>

      {/* 編輯提示條：只有在編輯模式時才會出現 */}
      {editingId && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ background: "#fff7ed", border: "1px solid #fdba74", color: "#c2410c", padding: "10px", borderRadius: "8px", marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠️ 您正在修改資料中 (ID: {editingId})</span>
          <button onClick={resetForm} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#c2410c", display: "flex", alignItems: "center", gap: "4px" }}><XCircle size={16} /> 取消修改</button>
        </motion.div>
      )}

      {/* 1. 上課紀錄 Tab */}
      {activeTab === "class" && (
        <>
          <form onSubmit={(e) => handleSubmit(e, "class")} style={{ ...formStyle, background: "#ecfdf5" }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#059669" }}>{editingId ? "✏️ 修改上課紀錄" : "➕ 新增上課紀錄"}</h3>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 2 }}><label style={labelStyle}>上課日期</label><input type="date" value={classDate} onChange={(e) => setClassDate(e.target.value)} style={inputStyle} /></div>
              <div style={{ flex: 1 }}><label style={labelStyle}>時數 (hr)</label><input type="number" step="0.5" value={duration} onChange={(e) => setDuration(e.target.value)} style={inputStyle} /></div>
            </div>
            <input type="text" value={progress} onChange={(e) => setProgress(e.target.value)} placeholder="進度 (如: 3-1)" style={inputStyle} />
            <textarea value={homework} onChange={(e) => setHomework(e.target.value)} placeholder="作業" style={{ ...inputStyle, height: "80px" }} />
            <button type="submit" disabled={loading} style={btnStyle("#059669", loading)}>{loading ? "..." : (editingId ? "確認修改" : "新增紀錄")}</button>
          </form>
          {/* 歷史列表 */}
          <HistoryList data={historyData} type="class" onEdit={handleEdit} onDelete={handleDelete} />
        </>
      )}

      {/* 2. 成績 Tab */}
      {activeTab === "grade" && (
        <>
          <form onSubmit={(e) => handleSubmit(e, "grade")} style={formStyle}>
            <h3 style={{ margin: "0 0 10px 0", color: "#2563eb" }}>{editingId ? "✏️ 修改考試成績" : "➕ 新增考試成績"}</h3>
            <div style={{ display: "flex", gap: "10px" }}>
              <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} style={inputStyle} />
              <select value={subject} onChange={(e) => setSubject(e.target.value)} style={selectStyle}>
                {SUBJECTS.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
            <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="單元" style={inputStyle} />
            <input type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="分數" style={inputStyle} />
            <button type="submit" disabled={loading} style={btnStyle("#2563eb", loading)}>{loading ? "..." : (editingId ? "確認修改" : "新增成績")}</button>
          </form>
          <HistoryList data={historyData} type="grade" onEdit={handleEdit} onDelete={handleDelete} />
        </>
      )}

      {/* 3. 點數 Tab */}
      {activeTab === "point" && (
        <>
          <form onSubmit={(e) => handleSubmit(e, "point")} style={{ ...formStyle, background: "#fefce8" }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#ca8a04" }}>{editingId ? "✏️ 修改獎勵點數" : "➕ 新增獎勵點數"}</h3>
            <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} placeholder="點數" style={inputStyle} />
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="原因" style={inputStyle} />
            <button type="submit" disabled={loading} style={btnStyle("#ca8a04", loading)}>{loading ? "..." : (editingId ? "確認修改" : "新增點數")}</button>
          </form>
          <HistoryList data={historyData} type="point" onEdit={handleEdit} onDelete={handleDelete} />
        </>
      )}

      {/* 4. 學費 Tab (保持原樣) */}
      {activeTab === "tuition" && (
        <div style={{ ...formStyle, background: "#fdf2f8" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#db2777" }}>學費計算機</h3>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}><label style={labelStyle}>選擇月份</label><input type="month" value={tuitionMonth} onChange={(e) => setTuitionMonth(e.target.value)} style={inputStyle} /></div>
            <button onClick={handleTuitionCheck} disabled={loading} style={{ ...btnStyle("#db2777", loading), padding: "10px 20px" }}>查詢</button>
          </div>
          {tuitionResult && (
            <div style={{ marginTop: "20px", background: "white", padding: "20px", borderRadius: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                <div><div style={{ color: "#888", fontSize: "14px" }}>總時數</div><div style={{ fontSize: "24px", fontWeight: "bold" }}>{tuitionResult.hours} 小時</div></div>
                <div style={{ textAlign: "right" }}><div style={{ color: "#888", fontSize: "14px" }}>本月應收</div><div style={{ fontSize: "32px", fontWeight: "bold", color: "#db2777" }}>${tuitionResult.total}</div></div>
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

      {/* 5. 報表 Tab (保持原樣) */}
      {activeTab === "view" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", gap: "15px" }}>
            <div style={{ flex: 1, background: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e5e7eb", textAlign: "center" }}>
               <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px", color: "#f59e0b" }}><Award /></div>
               <div style={{ color: "#6b7280", fontSize: "14px" }}>現有點數</div><div style={{ fontSize: "28px", fontWeight: "bold", color: "#111827" }}>{studentStats.points}</div>
            </div>
            <div style={{ flex: 1, background: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e5e7eb", textAlign: "center" }}>
               <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px", color: "#3b82f6" }}><TrendingUp /></div>
               <div style={{ color: "#6b7280", fontSize: "14px" }}>平均分數</div><div style={{ fontSize: "28px", fontWeight: "bold", color: "#111827" }}>{studentStats.average}</div>
            </div>
          </div>
          <div style={{ background: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e5e7eb", height: "350px" }}>
            <h3 style={{ marginTop: 0, fontSize: "16px", color: "#374151" }}>📊 成績趨勢圖</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  <Legend />
                  {SUBJECTS.map(sub => <Line key={sub} type="monotone" dataKey={sub} stroke={COLORS[sub as keyof typeof COLORS]} strokeWidth={2} connectNulls dot={{ r: 4 }} />)}
                </LineChart>
              </ResponsiveContainer>
            ) : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>尚無成績資料</div>}
          </div>
          <div style={{ background: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
             <h3 style={{ marginTop: 0, fontSize: "16px", color: "#374151" }}>🕒 最近 5 筆上課紀錄</h3>
             {recentClasses.length > 0 ? (
               <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                 {recentClasses.map((c) => (
                   <div key={c.id} style={{ padding: "12px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                     <div><div style={{ fontWeight: "bold", fontSize: "14px", color: "#111827" }}>{c.class_date}</div><div style={{ fontSize: "13px", color: "#6b7280" }}>{c.progress}</div></div>
                     <div style={{ fontSize: "13px", background: "#f3f4f6", padding: "4px 8px", borderRadius: "6px" }}>{c.duration} hr</div>
                   </div>
                 ))}
               </div>
             ) : <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af" }}>尚無上課紀錄</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// --- 子元件：歷史列表 (顯示最近 10 筆) ---
function HistoryList({ data, type, onEdit, onDelete }: { data: any[], type: string, onEdit: (item: any) => void, onDelete: (id: number) => void }) {
  if (!data || data.length === 0) return null;
  return (
    <div style={{ marginTop: "20px", borderTop: "1px solid #e5e7eb", paddingTop: "20px" }}>
      <h4 style={{ margin: "0 0 10px 0", color: "#6b7280", fontSize: "14px" }}>📜 最近 10 筆紀錄 (可修改/刪除)</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {data.map((item) => (
          <div key={item.id} style={{ background: "white", padding: "12px", borderRadius: "8px", border: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "14px", color: "#374151" }}>
              {type === "class" && (<span><strong>{item.class_date}</strong> - {item.progress} ({item.duration}hr)</span>)}
              {type === "grade" && (<span><strong>{item.exam_date}</strong> - {item.subject} {item.score}分</span>)}
              {type === "point" && (<span>{item.reason} <strong style={{color: item.points > 0 ? "#059669" : "#dc2626"}}>{item.points > 0 ? "+" : ""}{item.points} 點</strong></span>)}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => onEdit(item)} style={{ background: "#eff6ff", color: "#2563eb", border: "none", padding: "6px", borderRadius: "6px", cursor: "pointer" }} title="修改"><Pencil size={16} /></button>
              <button onClick={() => onDelete(item.id)} style={{ background: "#fef2f2", color: "#dc2626", border: "none", padding: "6px", borderRadius: "6px", cursor: "pointer" }} title="刪除"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- 樣式設定 ---
const loginInputStyle = { width: "100%", padding: "12px 12px 12px 40px", borderRadius: "10px", border: "1px solid #ddd", fontSize: "16px", boxSizing: "border-box" as const };
const inputStyle = { width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" as const };
const selectStyle = { width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "16px", boxSizing: "border-box" as const, background: "white" };
const labelStyle = { fontSize: "12px", fontWeight: "bold", marginBottom: "5px", display: "block", color: "#555" };
const formStyle = { display: "flex", flexDirection: "column" as const, gap: "15px", background: "#f9fafb", padding: "20px", borderRadius: "10px" };
const getTabStyle = (active: boolean, color: string) => ({
  flex: "1 0 18%", padding: "10px 5px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: "bold", cursor: "pointer",
  background: active ? color : "#e5e7eb", color: active ? "white" : "#374151", transition: "all 0.2s"
});
const btnStyle = (color: string, loading: boolean) => ({
  background: color, color: "white", padding: "12px", borderRadius: "8px", border: "none", fontSize: "16px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold", marginTop: "10px"
});