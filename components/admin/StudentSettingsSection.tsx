"use client";

import React, { useState, useEffect } from "react";
import { GraduationCap, Lock, Pencil, Trash2, User, UserPlus, Users, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { SUBJECTS } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";
import type { AdminTheme } from "./adminTheme";
import { getCommonStyles } from "./adminTheme";

interface StudentSettingsSectionProps {
  isMobile: boolean;
  theme: AdminTheme;
  studentList: any[];
  onRefreshStudents: () => void;
  selectedName: string;
  onSelectStudent: (name: string) => void;
}

export function StudentSettingsSection({
  isMobile,
  theme,
  studentList,
  onRefreshStudents,
  selectedName,
  onSelectStudent,
}: StudentSettingsSectionProps) {
  const { showToast } = useToast();
  const { solidCardStyle, inputStyle, selectStyle, btnStyle } = getCommonStyles(theme);

  const [loading, setLoading] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("1234");
  const [newStudentSchool, setNewStudentSchool] = useState("");
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [confirmStudentId, setConfirmStudentId] = useState<number | null>(null);

  // Hourly rates state
  const [rateTargetStudent, setRateTargetStudent] = useState(selectedName || (studentList[0]?.name || ""));
  const [localRates, setLocalRates] = useState<Record<string, number>>({});

  useEffect(() => {
    if (selectedName) {
      setRateTargetStudent(selectedName);
    } else if (studentList.length > 0 && !rateTargetStudent) {
      setRateTargetStudent(studentList[0].name);
    }
  }, [selectedName, studentList]);

  const fetchRates = async (studentName: string) => {
    if (!studentName) return;
    setLocalRates({});
    const { data } = await supabase
      .from("subject_rates")
      .select("*")
      .eq("student_name", studentName);
    const ratesMap: Record<string, number> = {};
    data?.forEach((r: any) => (ratesMap[r.subject] = r.rate));
    setLocalRates(ratesMap);
  };

  useEffect(() => {
    if (rateTargetStudent) {
      fetchRates(rateTargetStudent);
    }
  }, [rateTargetStudent]);

  const resetStudentForm = () => {
    setNewStudentName("");
    setNewStudentSchool("");
    setNewStudentPassword("1234");
    setEditingStudentId(null);
  };

  const handleEditStudentClick = (s: any) => {
    setEditingStudentId(s.id);
    setNewStudentName(s.name);
    setNewStudentPassword(s.password || "1234");
    setNewStudentSchool(s.school || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return showToast("請輸入學生姓名", "warning");

    setLoading(true);
    const payload = {
      name: newStudentName.trim(),
      password: newStudentPassword.trim() || "1234",
      school: newStudentSchool.trim(),
    };

    const { error } = editingStudentId
      ? await supabase.from("students").update(payload).eq("id", editingStudentId)
      : await supabase.from("students").insert([payload]);

    setLoading(false);

    if (error) {
      showToast("儲存學生失敗: " + error.message, "error");
    } else {
      showToast(editingStudentId ? "✅ 學生資料已更新！" : "✅ 學生已成功新增！", "success");
      resetStudentForm();
      onRefreshStudents();
    }
  };

  const handleDeleteStudent = async (id: number) => {
    setLoading(true);
    const { error } = await supabase.from("students").delete().eq("id", id);
    setLoading(false);

    if (error) {
      showToast("刪除失敗：" + error.message, "error");
    } else {
      showToast("已刪除該學生帳號", "info");
      onRefreshStudents();
    }
  };

  const handleSaveAllRates = async () => {
    if (!rateTargetStudent) return showToast("請先選擇學生！", "warning");
    setLoading(true);
    const payload = SUBJECTS.map((sub) => ({
      student_name: rateTargetStudent,
      subject: sub,
      rate: localRates[sub] || 0,
    }));
    const { error } = await supabase
      .from("subject_rates")
      .upsert(payload, { onConflict: "student_name,subject" });
    setLoading(false);

    if (error) {
      showToast("時薪儲存失敗: " + error.message, "error");
    } else {
      showToast("✅ 各學科時薪已經成功儲存！", "success");
      fetchRates(rateTargetStudent);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h2
        style={{
          fontSize: "20px",
          fontWeight: "900",
          color: theme.textMain,
          marginBottom: "20px",
        }}
      >
        ⚙️ 系統設定與名單管理
      </h2>

      {/* 註冊 / 編輯學生表單 */}
      <form onSubmit={handleSaveStudent} style={{ ...solidCardStyle, position: "relative" }}>
        {editingStudentId && (
          <button
            type="button"
            onClick={resetStudentForm}
            style={{
              position: "absolute",
              right: 15,
              top: 15,
              background: "none",
              border: "none",
              color: theme.textMuted,
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        )}
        <h3
          style={{
            color: theme.textMain,
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {editingStudentId ? (
            <Pencil size={20} color={theme.primary} />
          ) : (
            <UserPlus size={20} />
          )}{" "}
          {editingStudentId ? "編輯學生帳號資料" : "註冊全新學生帳號"}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: "15px",
            marginBottom: "15px",
          }}
        >
          <div style={{ position: "relative" }}>
            <User
              size={16}
              style={{ position: "absolute", left: 12, top: 16, color: theme.textMuted }}
            />
            <input
              type="text"
              placeholder="學生姓名"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              style={{ ...inputStyle, paddingLeft: "40px" }}
            />
          </div>
          <div style={{ position: "relative" }}>
            <Lock
              size={16}
              style={{ position: "absolute", left: 12, top: 16, color: theme.textMuted }}
            />
            <input
              type="text"
              placeholder="預設登入密碼"
              value={newStudentPassword}
              onChange={(e) => setNewStudentPassword(e.target.value)}
              style={{ ...inputStyle, paddingLeft: "40px" }}
            />
          </div>
        </div>
        <div style={{ position: "relative", marginBottom: "15px" }}>
          <GraduationCap
            size={16}
            style={{ position: "absolute", left: 12, top: 16, color: theme.textMuted }}
          />
          <input
            type="text"
            placeholder="就讀學校 / 年級"
            value={newStudentSchool}
            onChange={(e) => setNewStudentSchool(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "40px" }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={btnStyle(editingStudentId ? theme.success : theme.primary)}
        >
          {editingStudentId ? "確認儲存修改" : "完成新增並註冊"}
        </button>
      </form>

      {/* 學生名單管理 */}
      <h3
        style={{
          color: theme.textMain,
          margin: "30px 0 15px 10px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Users size={20} /> 學生名單管理 ({studentList.length} 位)
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "15px",
        }}
      >
        {studentList.map((s) => (
          <div
            key={s.id}
            style={{
              ...solidCardStyle,
              padding: "18px",
              marginBottom: 0,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: "900", fontSize: "17px", color: theme.textMain }}>
                {s.name}
              </div>
              <div style={{ fontSize: "13px", color: theme.textMuted, marginTop: "4px" }}>
                {s.school || "未設定學校"}
              </div>
              <div style={{ fontSize: "12px", color: theme.primary, marginTop: "2px" }}>
                登入密碼: <span style={{ letterSpacing: "2px", fontWeight: "bold" }}>****</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {confirmStudentId === s.id ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    onClick={() => {
                      handleDeleteStudent(s.id);
                      setConfirmStudentId(null);
                    }}
                    style={{
                      background: theme.danger,
                      color: "#fff",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    確定刪除
                  </button>
                  <button
                    onClick={() => setConfirmStudentId(null)}
                    style={{
                      background: theme.inputBg,
                      color: theme.textMain,
                      border: `1px solid ${theme.border}`,
                      padding: "8px 12px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    取消
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleEditStudentClick(s)}
                    style={{
                      background: `${theme.primary}15`,
                      color: theme.primary,
                      border: "none",
                      padding: "10px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      transition: "0.2s",
                    }}
                    title="編輯"
                  >
                    <Pencil size={20} />
                  </button>
                  <button
                    onClick={() => setConfirmStudentId(s.id)}
                    style={{
                      background: `${theme.danger}15`,
                      color: theme.danger,
                      border: "none",
                      padding: "10px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      transition: "0.2s",
                    }}
                    title="刪除"
                  >
                    <Trash2 size={20} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 各學科時薪設定 */}
      <div style={{ ...solidCardStyle, marginTop: "30px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: theme.textMain, margin: 0 }}>💰 客製化各學科時薪設定</h3>
          <button
            onClick={handleSaveAllRates}
            disabled={!rateTargetStudent || loading}
            style={{
              background: theme.primary,
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "10px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "0.2s",
            }}
          >
            💾 儲存時薪設定
          </button>
        </div>
        <label
          style={{
            fontWeight: "900",
            display: "block",
            marginBottom: "12px",
            color: theme.primary,
            fontSize: "13px",
          }}
        >
          選擇要設定時薪的學生：
        </label>
        <select
          value={rateTargetStudent}
          onChange={(e) => {
            setRateTargetStudent(e.target.value);
            onSelectStudent(e.target.value);
          }}
          style={{ ...selectStyle, marginBottom: "20px", fontWeight: "bold" }}
        >
          {studentList.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
          }}
        >
          {SUBJECTS.map((sub) => (
            <div
              key={`${rateTargetStudent}-${sub}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: theme.inputBg,
                padding: "12px",
                borderRadius: "12px",
                border: `1px solid ${theme.border}`,
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: "bold", color: theme.textMain, minWidth: "40px" }}>
                {sub}
              </span>
              <input
                type="number"
                value={localRates[sub] !== undefined ? localRates[sub] : ""}
                onChange={(e) =>
                  setLocalRates({ ...localRates, [sub]: Number(e.target.value) })
                }
                placeholder="0"
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.border}`,
                  background: theme.activeControl,
                  color: theme.textMain,
                  textAlign: "center",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

