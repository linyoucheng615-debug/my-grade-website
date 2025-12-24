"use client"; // 這行很重要，代表這是互動元件

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard({ grades }: { grades: any[] }) {
  const [activeTab, setActiveTab] = useState("parent"); // 'parent' | 'leaderboard'
  const [searchName, setSearchName] = useState("");
  const [searchSubject, setSearchSubject] = useState("數學");

  // --- 邏輯區 ---

  // 1. 家長查詢邏輯：過濾出該學生的該科成績，並只取最近 10 次
  const studentGrades = grades
    .filter(
      (g) =>
        g.student_name === searchName && // 名字要對
        g.subject === searchSubject // 科目要對
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // 依照時間排序
    .slice(-10); // 只拿最後 10 筆

  // 2. 排行榜邏輯：計算每個人的總分 (點數)
  // 這邊我們假設「總分」就是「點數」
  const leaderboardData = Object.values(
    grades.reduce((acc, curr) => {
      if (!acc[curr.student_name]) {
        acc[curr.student_name] = { 
            name: curr.student_name, 
            totalPoints: 0, 
            count: 0 
        };
      }
      acc[curr.student_name].totalPoints += curr.score;
      acc[curr.student_name].count += 1;
      return acc;
    }, {} as Record<string, any>)
  ).sort((a: any, b: any) => b.totalPoints - a.totalPoints); // 分數高的排前面

  return (
    <div style={{ padding: "20px", background: "#fff", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
      
      {/* 切換按鈕 (Tabs) */}
      <div style={{ display: "flex", marginBottom: "20px", borderBottom: "1px solid #ddd" }}>
        <button
          onClick={() => setActiveTab("parent")}
          style={{
            padding: "10px 20px",
            border: "none",
            background: "none",
            fontSize: "16px",
            fontWeight: "bold",
            color: activeTab === "parent" ? "#0070f3" : "#666",
            borderBottom: activeTab === "parent" ? "2px solid #0070f3" : "none",
            cursor: "pointer",
          }}
        >
          👨‍👩‍👧 家長查成績
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          style={{
            padding: "10px 20px",
            border: "none",
            background: "none",
            fontSize: "16px",
            fontWeight: "bold",
            color: activeTab === "leaderboard" ? "#0070f3" : "#666",
            borderBottom: activeTab === "leaderboard" ? "2px solid #0070f3" : "none",
            cursor: "pointer",
          }}
        >
          🏆 點數排行榜
        </button>
      </div>

      {/* 內容區 A: 家長查詢 */}
      {activeTab === "parent" && (
        <div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="請輸入學生姓名 (如: 王曉明)"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px", flex: 1 }}
            />
            <select
              value={searchSubject}
              onChange={(e) => setSearchSubject(e.target.value)}
              style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
            >
              <option value="數學">數學</option>
              <option value="英文">英文</option>
              <option value="理化">理化</option>
            </select>
          </div>

          {searchName && studentGrades.length > 0 ? (
            <div style={{ height: "300px", width: "100%" }}>
              <h3 style={{ textAlign: "center" }}>📈 {searchName} 的 {searchSubject} 成績走勢</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={studentGrades}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="created_at" tickFormatter={(tick) => new Date(tick).toLocaleDateString()} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip labelFormatter={(label) => new Date(label).toLocaleString()} />
                  <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ color: "#999", textAlign: "center", padding: "20px" }}>
              {searchName ? "找不到該學生的成績資料，請確認名字是否正確。" : "請輸入姓名以開始查詢"}
            </div>
          )}
        </div>
      )}

      {/* 內容區 B: 排行榜 */}
      {activeTab === "leaderboard" && (
        <div>
           <div style={{ display: 'flex', padding: '10px', background: '#f0f0f0', fontWeight: 'bold' }}>
            <div style={{ flex: 1 }}>排名</div>
            <div style={{ flex: 2 }}>姓名</div>
            <div style={{ flex: 2 }}>總點數 (累積總分)</div>
          </div>
          {leaderboardData.map((student: any, index: number) => (
            <div key={student.name} style={{ 
                display: 'flex', 
                padding: '15px 10px', 
                borderBottom: '1px solid #eee',
                background: index === 0 ? '#fffae6' : 'white'
            }}>
                <div style={{ flex: 1, fontWeight: 'bold' }}>{index + 1}</div>
                <div style={{ flex: 2 }}>{student.name}</div>
                <div style={{ flex: 2, fontWeight: 'bold', color: '#d46b08' }}>{student.totalPoints} pts</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}