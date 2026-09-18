"use client";

import React, { useState, useEffect } from "react";
import { Check, Lock, Pencil, Shield, Trash2, User, UserCheck, UserPlus, Users, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { parseTeacherPermissions, encodeTeacherRole } from "@/lib/teacherUtils";
import { useToast } from "@/components/ui/Toast";
import type { AdminTheme } from "./adminTheme";
import { getCommonStyles } from "./adminTheme";
import type { Student, Teacher } from "@/types/database";

interface TeacherManagerSectionProps {
  isMobile: boolean;
  theme: AdminTheme;
  allStudents: Student[];
  currentTeacherName: string;
}

export function TeacherManagerSection({
  isMobile,
  theme,
  allStudents,
  currentTeacherName,
}: TeacherManagerSectionProps) {
  const { showToast } = useToast();
  const { solidCardStyle, inputStyle, selectStyle, btnStyle } = getCommonStyles(theme);

  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);

  // 表單狀態
  const [editingTeacherId, setEditingTeacherId] = useState<number | null>(null);
  const [teacherName, setTeacherName] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("1234");
  const [teacherRoleType, setTeacherRoleType] = useState<"admin" | "teacher">("teacher");
  const [assignedStudentNames, setAssignedStudentNames] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fetchTeachers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("teachers").select("*").order("id", { ascending: true });
    setLoading(false);
    if (error) {
      showToast("載入老師名單失敗：" + error.message, "error");
    } else {
      setTeachers(data || []);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const resetForm = () => {
    setEditingTeacherId(null);
    setTeacherName("");
    setTeacherPassword("1234");
    setTeacherRoleType("teacher");
    setAssignedStudentNames([]);
  };

  const handleEditClick = (t: any) => {
    const perm = parseTeacherPermissions(t);
    setEditingTeacherId(t.id);
    setTeacherName(t.name);
    setTeacherPassword(t.password || "");
    setTeacherRoleType(perm.isAdmin ? "admin" : "teacher");
    setAssignedStudentNames(perm.assignedStudents || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleStudent = (studentName: string) => {
    setAssignedStudentNames((prev) =>
      prev.includes(studentName) ? prev.filter((n) => n !== studentName) : [...prev, studentName]
    );
  };

  const handleSelectAllStudents = () => {
    setAssignedStudentNames(allStudents.map((s) => s.name));
  };

  const handleClearAllStudents = () => {
    setAssignedStudentNames([]);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim()) return showToast("請輸入老師帳號/姓名！", "warning");
    if (!teacherPassword.trim()) return showToast("請設定登入密碼！", "warning");

    if (teacherRoleType === "teacher" && assignedStudentNames.length === 0) {
      return showToast("⚠️ 協同老師請至少勾選指派一位學生，否則該老師登入後將無學生可操作！", "warning");
    }

    setLoading(true);

    const encodedRole = encodeTeacherRole(teacherRoleType, assignedStudentNames);
    const payload = {
      name: teacherName.trim(),
      password: teacherPassword.trim(),
      role: encodedRole,
    };

    let error;
    if (editingTeacherId) {
      const res = await supabase.from("teachers").update(payload).eq("id", editingTeacherId);
      error = res.error;
    } else {
      const res = await supabase.from("teachers").insert([payload]);
      error = res.error;
    }

    setLoading(false);

    if (error) {
      showToast("儲存老師帳號失敗: " + error.message, "error");
    } else {
      showToast(editingTeacherId ? "✅ 老師權限設定已成功更新！" : "🎉 協同老師帳號已成功建立！", "success");
      resetForm();
      fetchTeachers();
    }
  };

  const handleDeleteTeacher = async (id: number, name: string) => {
    if (name === currentTeacherName) {
      return showToast("⚠️ 無法刪除目前正在登入的自己帳號！", "error");
    }

    setLoading(true);
    const { error } = await supabase.from("teachers").delete().eq("id", id);
    setLoading(false);

    if (error) {
      showToast("刪除失敗：" + error.message, "error");
    } else {
      showToast(`已刪除「${name}」老師帳號`, "info");
      setConfirmDeleteId(null);
      fetchTeachers();
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* 建立 / 編輯老師表單 */}
      <form onSubmit={handleSaveTeacher} style={solidCardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3
            style={{
              color: theme.textMain,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontWeight: "900",
            }}
          >
            {editingTeacherId ? <Pencil size={20} color={theme.primary} /> : <UserPlus size={20} color={theme.primary} />}
            {editingTeacherId ? `編輯老師資料 (${teacherName})` : "新增協同老師帳號"}
          </h3>
          {editingTeacherId && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                background: "transparent",
                border: "none",
                color: theme.textMuted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "13px",
              }}
            >
              <X size={16} /> 取消編輯
            </button>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: "15px",
            marginBottom: "15px",
          }}
        >
          <div style={{ position: "relative" }}>
            <User size={16} style={{ position: "absolute", left: 12, top: 16, color: theme.textMuted }} />
            <input
              type="text"
              placeholder="老師姓名 / 帳號 (例如: 陳老師)"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              style={{ ...inputStyle, paddingLeft: "40px" }}
            />
          </div>
          <div style={{ position: "relative" }}>
            <Lock size={16} style={{ position: "absolute", left: 12, top: 16, color: theme.textMuted }} />
            <input
              type="text"
              placeholder="登入密碼 (預設 1234)"
              value={teacherPassword}
              onChange={(e) => setTeacherPassword(e.target.value)}
              style={{ ...inputStyle, paddingLeft: "40px" }}
            />
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "13px", fontWeight: "bold", color: theme.primary, display: "block", marginBottom: "8px" }}>
            🛡️ 帳號角色權限
          </label>
          <div style={{ display: "flex", gap: "15px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "12px",
                background: teacherRoleType === "teacher" ? `${theme.primary}20` : theme.inputBg,
                border: teacherRoleType === "teacher" ? `2px solid ${theme.primary}` : `1px solid ${theme.border}`,
                cursor: "pointer",
                color: theme.textMain,
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              <input
                type="radio"
                name="roleType"
                checked={teacherRoleType === "teacher"}
                onChange={() => setTeacherRoleType("teacher")}
                style={{ cursor: "pointer" }}
              />
              協同老師（受指派限制）
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "12px",
                background: teacherRoleType === "admin" ? "#be123c20" : theme.inputBg,
                border: teacherRoleType === "admin" ? "2px solid #be123c" : `1px solid ${theme.border}`,
                cursor: "pointer",
                color: theme.textMain,
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              <input
                type="radio"
                name="roleType"
                checked={teacherRoleType === "admin"}
                onChange={() => setTeacherRoleType("admin")}
                style={{ cursor: "pointer" }}
              />
              系統管理員（看全部學生）
            </label>
          </div>
        </div>

        {/* 指派學生清單（僅協同老師需要） */}
        {teacherRoleType === "teacher" ? (
          <div
            style={{
              marginBottom: "20px",
              background: theme.inputBg,
              padding: "18px",
              borderRadius: "16px",
              border: `1px solid ${theme.border}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "14px", fontWeight: "900", color: theme.textMain, display: "flex", alignItems: "center", gap: "6px" }}>
                <UserCheck size={18} color={theme.primary} />
                指派負責教學的學生 ({assignedStudentNames.length} / {allStudents.length} 位)
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={handleSelectAllStudents}
                  style={{
                    background: "transparent",
                    border: `1px solid ${theme.border}`,
                    color: theme.primary,
                    padding: "4px 10px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  全選
                </button>
                <button
                  type="button"
                  onClick={handleClearAllStudents}
                  style={{
                    background: "transparent",
                    border: `1px solid ${theme.border}`,
                    color: theme.textMuted,
                    padding: "4px 10px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  清空
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr",
                gap: "10px",
              }}
            >
              {allStudents.map((s) => {
                const isChecked = assignedStudentNames.includes(s.name);
                return (
                  <div
                    key={s.id}
                    onClick={() => handleToggleStudent(s.name)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "12px",
                      background: isChecked ? `${theme.primary}25` : theme.card,
                      border: isChecked ? `2px solid ${theme.primary}` : `1px solid ${theme.border}`,
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                      transition: "0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "6px",
                        border: isChecked ? `2px solid ${theme.primary}` : `2px solid ${theme.border}`,
                        background: isChecked ? theme.primary : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                      }}
                    >
                      {isChecked && <Check size={14} />}
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "bold", color: theme.textMain }}>{s.name}</div>
                      {s.school && <div style={{ fontSize: "11px", color: theme.textMuted }}>{s.school}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: "12px", color: theme.textMuted, margin: "12px 0 0 0" }}>
              💡 外部協同老師登入後，**只能存取此處勾選的學生**，不會看見未指派的學生資料與課堂紀錄。
            </p>
          </div>
        ) : (
          <div
            style={{
              marginBottom: "20px",
              background: "#be123c10",
              padding: "14px 18px",
              borderRadius: "14px",
              border: "1px solid #be123c30",
              fontSize: "13px",
              color: theme.textMain,
            }}
          >
            🛡️ <b>系統管理員權限</b>：具備全站最高權限，可管理所有學生、行事曆、財務學費與設定，無需指定學生。
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={btnStyle(editingTeacherId ? theme.success : theme.primary)}
        >
          {loading ? "儲存中..." : editingTeacherId ? "確認儲存修改" : "完成新增老師"}
        </button>
      </form>

      {/* 老師名單展示 */}
      <h3
        style={{
          color: theme.textMain,
          margin: "30px 0 15px 10px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontWeight: "900",
        }}
      >
        <Users size={20} /> 目前老師名單 ({teachers.length} 位)
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {teachers.map((t) => {
          const perm = parseTeacherPermissions(t);
          const isSelf = t.name === currentTeacherName;

          return (
            <div
              key={t.id}
              style={{
                background: theme.activeControl,
                padding: "20px",
                borderRadius: "18px",
                border: `1px solid ${theme.border}`,
                boxShadow: theme.shadow,
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "center",
                gap: "15px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "17px", fontWeight: "900", color: theme.textMain }}>
                    👩‍🏫 {t.name}
                  </span>
                  {isSelf && (
                    <span
                      style={{
                        fontSize: "11px",
                        background: `${theme.primary}20`,
                        color: theme.primary,
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontWeight: "bold",
                      }}
                    >
                      您目前登入中
                    </span>
                  )}
                  {perm.isAdmin ? (
                    <span
                      style={{
                        fontSize: "12px",
                        background: "#be123c20",
                        color: "#be123c",
                        padding: "3px 10px",
                        borderRadius: "8px",
                        fontWeight: "900",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Shield size={12} /> 系統管理員
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "12px",
                        background: `${theme.success}20`,
                        color: theme.success,
                        padding: "3px 10px",
                        borderRadius: "8px",
                        fontWeight: "bold",
                      }}
                    >
                      協同老師
                    </span>
                  )}
                </div>

                <div style={{ fontSize: "13px", color: theme.textMuted, marginTop: "8px" }}>
                  {perm.isAdmin ? (
                    <span>可管理全體學生與所有系統設定</span>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span>負責學生 ({perm.assignedStudents.length} 位)：</span>
                      {perm.assignedStudents.length > 0 ? (
                        perm.assignedStudents.map((sName) => (
                          <span
                            key={sName}
                            style={{
                              background: theme.inputBg,
                              border: `1px solid ${theme.border}`,
                              color: theme.textMain,
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            {sName}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: theme.danger }}>⚠️ 尚未指派學生</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 操作按鈕 */}
              <div style={{ display: "flex", gap: "10px", width: isMobile ? "100%" : "auto" }}>
                <button
                  type="button"
                  onClick={() => handleEditClick(t)}
                  style={{
                    background: `${theme.primary}15`,
                    color: theme.primary,
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flex: isMobile ? 1 : "initial",
                    justifyContent: "center",
                  }}
                >
                  <Pencil size={14} /> 編輯權限 / 密碼
                </button>

                {!isSelf && (
                  <>
                    {confirmDeleteId === t.id ? (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteTeacher(t.id, t.name)}
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
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          style={{
                            background: theme.inputBg,
                            color: theme.textMuted,
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
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(t.id)}
                        style={{
                          background: "#ef444415",
                          color: theme.danger,
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Trash2 size={14} /> 刪除
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

