"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabaseClient";
import { SUBJECT_COLORS as COLORS } from "@/lib/constants";
import type { AdminTheme } from "./adminTheme";
import { getCommonStyles } from "./adminTheme";

interface ReportSectionProps {
  isMobile: boolean;
  theme: AdminTheme;
  selectedName: string;
}

export function ReportSection({
  isMobile,
  theme,
  selectedName,
}: ReportSectionProps) {
  const { solidCardStyle, filterBtnStyle } = getCommonStyles(theme);

  const [chartData, setChartData] = useState<any[]>([]);
  const [gradeFilter, setGradeFilter] = useState<string>("數學");
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  const fetchGrades = async () => {
    if (!selectedName) return;
    const { data: grades } = await supabase
      .from("grades")
      .select("*")
      .eq("student_name", selectedName)
      .order("exam_date", { ascending: false });

    if (grades) {
      setChartData(grades);
      const subjects = Array.from(new Set(grades.map((g: any) => g.subject))) as string[];
      setAvailableSubjects(subjects);
      if (subjects.length > 0 && !subjects.includes(gradeFilter)) {
        setGradeFilter(subjects[0]);
      }
    }
  };

  useEffect(() => {
    fetchGrades();
  }, [selectedName]);

  const getProcessedChartData = () => {
    const list = chartData.filter((g: any) => g.subject === gradeFilter);
    if (list.length === 0) return [];
    return [...list]
      .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
      .map((g: any) => ({ date: g.exam_date, score: g.score }));
  };

  const getSubjectAverage = () => {
    const list = chartData.filter((g: any) => g.subject === gradeFilter);
    if (list.length === 0) return 0;
    return Math.round(
      list.reduce((acc: number, curr: any) => acc + curr.score, 0) / list.length
    );
  };

  const currentChartDataArr = getProcessedChartData();
  const currentAvgNum = getSubjectAverage();

  return (
    <div style={solidCardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h3 style={{ color: theme.textMain, margin: 0, fontWeight: "900" }}>
          📊 單科成績分析走勢圖 ({selectedName})
        </h3>
        {gradeFilter && (
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              color: theme.textMain,
              background: theme.inputBg,
              border: `1px solid ${theme.border}`,
              padding: "8px 16px",
              borderRadius: "20px",
              boxShadow: theme.shadow,
            }}
          >
            {gradeFilter}平均：
            <span style={{ color: COLORS[gradeFilter] || theme.primary, fontSize: "18px" }}>
              {currentAvgNum}
            </span>{" "}
            分
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          overflowX: "auto",
          paddingBottom: "15px",
          marginBottom: "15px",
        }}
      >
        {availableSubjects.map((sub: any) => (
          <button
            key={sub}
            onClick={() => setGradeFilter(sub)}
            style={filterBtnStyle(gradeFilter === sub, COLORS[sub])}
          >
            {sub}
          </button>
        ))}
      </div>

      {currentChartDataArr.length > 0 ? (
        <>
          <div style={{ height: "320px", marginBottom: "20px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentChartDataArr}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
                <XAxis
                  dataKey="date"
                  stroke={theme.border}
                  tick={{ fill: theme.textMuted, fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke={theme.border}
                  tick={{ fill: theme.textMuted, fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.activeControl,
                    borderColor: theme.border,
                    color: theme.textMain,
                    borderRadius: "12px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  name={gradeFilter}
                  stroke={COLORS[gradeFilter] || theme.primary}
                  strokeWidth={4}
                  dot={{ r: 6, fill: theme.activeControl, strokeWidth: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr",
              gap: "15px",
            }}
          >
            {chartData
              .filter((g: any) => g.subject === gradeFilter)
              .map((g: any) => (
                <div
                  key={g.id}
                  style={{
                    background: theme.inputBg,
                    padding: "20px",
                    borderRadius: "16px",
                    border: `1px solid ${theme.border}`,
                    borderTop: `4px solid ${COLORS[g.subject] || theme.primary}`,
                    textAlign: "center",
                    boxShadow: theme.shadow,
                  }}
                >
                  <div style={{ fontSize: "12px", color: theme.textMuted, marginBottom: "8px" }}>
                    {g.exam_date}
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: "bold", color: theme.textMain }}>
                    {g.subject}
                  </div>
                  <div
                    style={{
                      fontSize: "32px",
                      fontWeight: "900",
                      margin: "10px 0",
                      color:
                        g.score >= 60 ? COLORS[g.subject] || theme.primary : theme.danger,
                    }}
                  >
                    {g.score}
                  </div>
                  <div style={{ fontSize: "12px", color: theme.textMuted }}>{g.unit}</div>
                </div>
              ))}
          </div>
        </>
      ) : (
        <div
          style={{
            height: "180px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.textMuted,
            border: `1px dashed ${theme.border}`,
            borderRadius: "20px",
          }}
        >
          尚無足夠的考試紀錄
        </div>
      )}
    </div>
  );
}

