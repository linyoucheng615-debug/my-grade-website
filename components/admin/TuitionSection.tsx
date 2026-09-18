"use client";

import React, { useState, useEffect } from "react";
import { Check, Copy, FileText, Users, CreditCard } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { SUBJECTS } from "@/lib/constants";
import { getCurrentMonthString } from "@/lib/dateUtils";
import { useToast } from "@/components/ui/Toast";
import type { AdminTheme } from "./adminTheme";
import { getCommonStyles } from "./adminTheme";

interface TuitionSectionProps {
  theme: AdminTheme;
  isDarkMode: boolean;
  selectedName: string;
  studentList?: any[];
  currentTeacherName?: string;
}

export function TuitionSection({
  theme,
  isDarkMode,
  selectedName,
  studentList = [],
  currentTeacherName = "",
}: TuitionSectionProps) {
  const { showToast } = useToast();
  const { solidCardStyle, inputStyle, selectStyle, btnStyle } = getCommonStyles(theme);

  const [loading, setLoading] = useState(false);
  const [tuitionMonth, setTuitionMonth] = useState(getCurrentMonthString());
  const [tuitionSubject, setTuitionSubject] = useState<string>("ALL");
  const [tuitionDetails, setTuitionDetails] = useState<any[]>([]);
  const [localRates, setLocalRates] = useState<Record<string, number>>({});
  const [billingText, setBillingText] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // 自訂個人匯款帳號（留空則留白，絕不強制帶入死帳號）
  const [customBankAccount, setCustomBankAccount] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const key = currentTeacherName ? `teacherBankAccount_${currentTeacherName}` : "teacherBankAccount";
      return localStorage.getItem(key) || "";
    }
    return "";
  });

  // 當切換老師時同步讀取對應的個人受款帳號
  useEffect(() => {
    if (typeof window !== "undefined") {
      const key = currentTeacherName ? `teacherBankAccount_${currentTeacherName}` : "teacherBankAccount";
      setCustomBankAccount(localStorage.getItem(key) || "");
    }
  }, [currentTeacherName]);

  // 雙學生合併結算狀態
  const candidateSecondStudents = (studentList || []).filter((s) => s.name !== selectedName);
  const [isCombinedMode, setIsCombinedMode] = useState<boolean>(false);
  const [secondStudentName, setSecondStudentName] = useState<string>(
    candidateSecondStudents[0]?.name || ""
  );
  const [student2Details, setStudent2Details] = useState<any[]>([]);

  // 當主要學生變更時，若第二位學生與主要學生相同，自動切換至其他候選學生
  useEffect(() => {
    if (secondStudentName === selectedName && candidateSecondStudents.length > 0) {
      setSecondStudentName(candidateSecondStudents[0].name);
    }
  }, [selectedName]);

  const fetchRates = async () => {
    if (!selectedName) return;
    setLocalRates({});
    const { data } = await supabase
      .from("subject_rates")
      .select("*")
      .eq("student_name", selectedName);
    const ratesMap: Record<string, number> = {};
    data?.forEach((r: any) => (ratesMap[r.subject] = r.rate));
    setLocalRates(ratesMap);
  };

  useEffect(() => {
    fetchRates();
    setTuitionDetails([]);
    setStudent2Details([]);
    setBillingText("");
  }, [selectedName]);

  // 查詢單一學生指定月份與指定科目的課程與學費明細
  const fetchStudentTuition = async (studentName: string) => {
    if (!studentName) return [];
    const { data: classes } = await supabase
      .from("class_logs")
      .select("*")
      .eq("student_name", studentName)
      .ilike("class_date", `${tuitionMonth}%`)
      .order("class_date", { ascending: true });

    const { data: rates = [] } = await supabase
      .from("subject_rates")
      .select("*")
      .eq("student_name", studentName);

    const rateMap: Record<string, number> = {};
    rates?.forEach((r: any) => (rateMap[r.subject] = r.rate));

    const details = (classes || [])
      .map((c: any) => {
        const sub = c.subject || "數學";
        const rate = rateMap[sub] || 0;
        const extra = c.expense || 0;
        const total = Number(c.duration) * rate + extra;
        return { ...c, subject: sub, rate, total, extra };
      })
      .filter((c: any) => {
        if (tuitionSubject === "ALL") return true;
        return c.subject === tuitionSubject;
      });

    return details;
  };

  const handleTuitionCheck = async () => {
    if (!selectedName) return showToast("請先選擇學生！", "warning");
    if (isCombinedMode && !secondStudentName) {
      return showToast("請選擇第二位要合併結算的學生！", "warning");
    }

    setLoading(true);
    setBillingText("");

    const details1 = await fetchStudentTuition(selectedName);
    setTuitionDetails(details1);

    const subLabel = tuitionSubject === "ALL" ? "全部科目" : tuitionSubject;

    if (isCombinedMode) {
      const details2 = await fetchStudentTuition(secondStudentName);
      setStudent2Details(details2);
      setLoading(false);

      if (details1.length === 0 && details2.length === 0) {
        return showToast(`⚠️ ${selectedName} 與 ${secondStudentName} 本月【${subLabel}】均查無補習紀錄`, "info");
      }
      showToast(
        `✅ 已合併結算【${subLabel}】：${selectedName} (${details1.length} 堂) 與 ${secondStudentName} (${details2.length} 堂)`,
        "success"
      );
    } else {
      setStudent2Details([]);
      setLoading(false);
      if (details1.length === 0) {
        return showToast(`⚠️ 本月查無該學生【${subLabel}】的補習紀錄`, "info");
      }
      showToast(`✅ 已結算出【${subLabel}】共 ${details1.length} 堂課程明細`, "success");
    }
  };

  const generateBillingText = () => {
    if (tuitionDetails.length === 0 && (!isCombinedMode || student2Details.length === 0)) {
      showToast("請先按「核算學費」取得資料喔！", "warning");
      return;
    }

    const month = parseInt(tuitionMonth.split("-")[1], 10);
    const subjectPrefix = tuitionSubject === "ALL" ? "" : `【${tuitionSubject}】`;

    const formatStudentClasses = (name: string, details: any[]) => {
      if (details.length === 0) return `【${name}】\n本月無上課紀錄\n`;
      const grouped: Record<string, any[]> = {};
      details.forEach((d) => {
        const sub = d.subject || "其他";
        if (!grouped[sub]) grouped[sub] = [];
        grouped[sub].push(d);
      });

      let subText = `【${name}】\n`;
      Object.keys(grouped).forEach((sub) => {
        subText += `${sub}:\n`;
        grouped[sub].forEach((item) => {
          const dObj = new Date(item.class_date);
          const dateStr = `${dObj.getMonth() + 1}/${dObj.getDate()}`;
          const extraText = item.extra > 0 ? ` (+雜費${item.extra})` : "";
          subText += `${dateStr} ${item.duration}h${extraText}\n`;
        });
        subText += "\n";
      });

      const hours = details.reduce((a, b) => a + Number(b.duration), 0);
      const cost = details.reduce((a, b) => a + b.total, 0);
      subText += `共 ${hours}h，費用 ${cost.toLocaleString()} 元\n`;
      return subText;
    };

    let text = "";
    // 受款帳號位置：若有填寫則條列，若留白則直接留白不帶任何預設
    const bankSection = customBankAccount.trim()
      ? `確認無誤後，麻煩家長方便的時候幫我匯到以下帳戶：\n${customBankAccount.trim()}`
      : `確認無誤後，麻煩家長方便的時候再幫我匯款，謝謝您！\n`;

    if (!isCombinedMode) {
      const grouped: Record<string, any[]> = {};
      tuitionDetails.forEach((d) => {
        const sub = d.subject || "其他";
        if (!grouped[sub]) grouped[sub] = [];
        grouped[sub].push(d);
      });

      text = `${selectedName} 家長您好：\n${month}月的${subjectPrefix}課程已經結束囉！\n\n`;
      Object.keys(grouped).forEach((sub) => {
        text += `${sub}:\n`;
        grouped[sub].forEach((item) => {
          const dObj = new Date(item.class_date);
          const dateStr = `${dObj.getMonth() + 1}/${dObj.getDate()}`;
          const extraText = item.extra > 0 ? ` (+雜費${item.extra})` : "";
          text += `${dateStr} ${item.duration}h${extraText}\n`;
        });
        text += "\n";
      });

      const totalHours = tuitionDetails.reduce((a, b) => a + Number(b.duration), 0);
      const totalCost = tuitionDetails.reduce((a, b) => a + b.total, 0);
      text += `共 ${totalHours}h\n課程費用共 ${totalCost.toLocaleString()} 元\n\n`;
      text += bankSection;
    } else {
      const s1Hours = tuitionDetails.reduce((a, b) => a + Number(b.duration), 0);
      const s1Cost = tuitionDetails.reduce((a, b) => a + b.total, 0);
      const s2Hours = student2Details.reduce((a, b) => a + Number(b.duration), 0);
      const s2Cost = student2Details.reduce((a, b) => a + b.total, 0);
      const grandTotalHours = s1Hours + s2Hours;
      const grandTotalCost = s1Cost + s2Cost;

      text = `${selectedName}、${secondStudentName} 家長您好：\n${month}月的${subjectPrefix}課程已經結束囉！以下為兩位同學的課程費用明細：\n\n`;
      text += formatStudentClasses(selectedName, tuitionDetails) + "\n";
      text += formatStudentClasses(secondStudentName, student2Details) + "\n";
      text += `------------------------\n`;
      text += `合計總時數：${grandTotalHours}h\n`;
      text += `兩位同學費用總計：${grandTotalCost.toLocaleString()} 元\n\n`;
      text += bankSection;
    }

    setBillingText(text);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(billingText);
    setIsCopied(true);
    showToast("📋 帳單明細已複製到剪貼簿！", "success");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveAllRates = async () => {
    if (!selectedName) return showToast("請先選擇學生！", "warning");
    setLoading(true);
    const payload = SUBJECTS.map((sub) => ({
      student_name: selectedName,
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
      fetchRates();
    }
  };

  const s1Hours = tuitionDetails.reduce((a, b) => a + Number(b.duration), 0);
  const s1Total = tuitionDetails.reduce((a, b) => a + b.total, 0);
  const s2Hours = student2Details.reduce((a, b) => a + Number(b.duration), 0);
  const s2Total = student2Details.reduce((a, b) => a + b.total, 0);

  return (
    <>
      <div style={solidCardStyle}>
        <h3 style={{ color: theme.textMain, marginBottom: "20px" }}>💰 月底學費結算與明細生成</h3>

        {/* 雙學生合併結算勾選開關 */}
        <div
          style={{
            marginBottom: "18px",
            background: isCombinedMode ? `${theme.primary}12` : theme.inputBg,
            padding: "14px 16px",
            borderRadius: "14px",
            border: `1px solid ${isCombinedMode ? theme.primary : theme.border}`,
            transition: "all 0.2s ease",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              color: theme.textMain,
            }}
          >
            <input
              type="checkbox"
              checked={isCombinedMode}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsCombinedMode(checked);
                if (checked && !secondStudentName && candidateSecondStudents.length > 0) {
                  setSecondStudentName(candidateSecondStudents[0].name);
                }
              }}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <Users size={18} color={theme.primary} /> 合併第二位學生結算（兄弟姊妹 / 同家長）
          </label>

          {isCombinedMode && (
            <div
              style={{
                marginTop: "12px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                animation: "fadeIn 0.2s ease",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: "bold", color: theme.primary }}>
                第二位學生：
              </span>
              {candidateSecondStudents.length === 0 ? (
                <span style={{ fontSize: "13px", color: theme.danger }}>
                  ⚠️ 目前名單中無其他可合併的學生
                </span>
              ) : (
                <select
                  value={secondStudentName}
                  onChange={(e) => setSecondStudentName(e.target.value)}
                  style={{
                    ...selectStyle,
                    margin: 0,
                    width: "auto",
                    minWidth: "160px",
                    fontWeight: "bold",
                  }}
                >
                  {candidateSecondStudents.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* 月份與科目選擇與操作按鈕 */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="month"
            value={tuitionMonth}
            onChange={(e) => {
              setTuitionMonth(e.target.value);
              setTuitionDetails([]);
              setStudent2Details([]);
              setBillingText("");
            }}
            style={{ ...inputStyle, width: "auto", flex: 1, minWidth: "140px", margin: 0 }}
          />
          <select
            value={tuitionSubject}
            onChange={(e) => {
              setTuitionSubject(e.target.value);
              setTuitionDetails([]);
              setStudent2Details([]);
              setBillingText("");
            }}
            style={{
              ...selectStyle,
              width: "auto",
              minWidth: "130px",
              margin: 0,
              fontWeight: "bold",
            }}
          >
            <option value="ALL">📚 全部科目</option>
            {SUBJECTS.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
          <button
            onClick={handleTuitionCheck}
            disabled={loading}
            style={{
              ...btnStyle(theme.danger),
              width: "auto",
              marginTop: 0,
              padding: "12px 24px",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "計算中..." : isCombinedMode ? "核算雙人學費" : "核算學費"}
          </button>
          <button
            onClick={generateBillingText}
            style={{
              ...btnStyle("#6366f1"),
              width: "auto",
              marginTop: 0,
              padding: "12px 24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
            }}
          >
            <FileText size={18} /> 生成複製明細
          </button>
        </div>

        {/* 自訂受款帳號設定（留白則不帶入死帳號） */}
        <div
          style={{
            marginTop: "20px",
            background: theme.inputBg,
            padding: "14px 16px",
            borderRadius: "14px",
            border: `1px solid ${theme.border}`,
          }}
        >
          <label
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              color: theme.primary,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <CreditCard size={16} /> 匯款受款帳戶（留白則訊息位置直接留空，不帶入任何帳號）：
          </label>
          <input
            type="text"
            value={customBankAccount}
            onChange={(e) => {
              const val = e.target.value;
              setCustomBankAccount(val);
              const key = currentTeacherName
                ? `teacherBankAccount_${currentTeacherName}`
                : "teacherBankAccount";
              localStorage.setItem(key, val);
            }}
            placeholder="輸入您的銀行代碼、帳號與戶名（未填寫此處請款訊息將直接留空）"
            style={inputStyle}
          />
          <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "6px" }}>
            💡 系統會為您自動儲存此帳號；若不填寫，請款訊息將直接留白，絕不出現預設帳號。
          </div>
        </div>

        {/* 請款文案預覽與複製區塊 */}
        {billingText && (
          <div style={{ marginTop: "25px", position: "relative", animation: "fadeIn 0.3s ease" }}>
            <label style={{ fontWeight: "bold", color: "#6366f1", marginBottom: "8px", display: "block" }}>
              👇 點擊右側按鈕一鍵複製文字傳給家長：
            </label>
            <textarea
              value={billingText}
              onChange={(e) => setBillingText(e.target.value)}
              style={{
                width: "100%",
                height: isCombinedMode ? "280px" : "220px",
                padding: "18px",
                borderRadius: "16px",
                border: `2px solid ${isDarkMode ? "#4338ca" : "#6366f1"}`,
                fontSize: "14px",
                fontFamily: "monospace",
                resize: "none",
                background: isDarkMode ? "#1e1b4b" : "#f5f3ff",
                color: theme.textMain,
                lineHeight: "1.6",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={copyToClipboard}
              style={{
                position: "absolute",
                top: "40px",
                right: "12px",
                background: isCopied ? theme.success : theme.card,
                color: isCopied ? "white" : theme.textMain,
                border: `1px solid ${theme.border}`,
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                transition: "0.2s",
                boxShadow: theme.shadow,
              }}
            >
              {isCopied ? <Check size={14} /> : <Copy size={14} />} {isCopied ? "已複製" : "複製文字"}
            </button>
          </div>
        )}

        {/* 單一學生明細展示 */}
        {!isCombinedMode && tuitionDetails.length > 0 && (
          <div style={{ marginTop: "25px", borderTop: `2px dashed ${theme.border}`, paddingTop: "20px" }}>
            <h4 style={{ margin: "0 0 15px 0", color: theme.textMain, fontWeight: "bold" }}>
              👤 {selectedName} 的課程明細 ({tuitionDetails.length} 堂)
              {tuitionSubject !== "ALL" && (
                <span style={{ marginLeft: "8px", color: theme.primary, fontSize: "14px" }}>
                  【{tuitionSubject}】
                </span>
              )}
            </h4>
            {tuitionDetails.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "15px",
                  background: theme.inputBg,
                  borderRadius: "14px",
                  marginBottom: "10px",
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div>
                  <div style={{ fontWeight: "900", fontSize: "15px", color: theme.textMain }}>
                    {t.class_date}{" "}
                    <span style={{ fontSize: "12px", color: theme.textMuted, fontWeight: "normal" }}>
                      ({t.subject})
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: theme.textMuted, marginTop: "4px" }}>
                    {t.duration} hr × ${t.rate}/hr{" "}
                    {t.extra > 0 && (
                      <span style={{ color: theme.danger, fontWeight: "bold" }}> + 雜費 {t.extra}</span>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    fontWeight: "900",
                    color: theme.danger,
                    display: "flex",
                    alignItems: "center",
                    fontSize: "18px",
                  }}
                >
                  ${t.total}
                </span>
              </div>
            ))}
            <div
              style={{
                textAlign: "right",
                fontSize: "24px",
                fontWeight: "900",
                marginTop: "20px",
                color: theme.danger,
                borderTop: `2px solid ${theme.border}`,
                paddingTop: "15px",
              }}
            >
              本月學費總計：$
              {s1Total.toLocaleString()} 元 ({s1Hours} hr)
            </div>
          </div>
        )}

        {/* 雙學生合併明細展示 */}
        {isCombinedMode && (tuitionDetails.length > 0 || student2Details.length > 0) && (
          <div style={{ marginTop: "25px", borderTop: `2px dashed ${theme.border}`, paddingTop: "20px" }}>
            {/* 學生一卡片區 */}
            <div style={{ marginBottom: "25px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <h4 style={{ margin: 0, color: theme.textMain, fontWeight: "900", fontSize: "16px" }}>
                  👤 學生一：{selectedName} ({tuitionDetails.length} 堂)
                  {tuitionSubject !== "ALL" && (
                    <span style={{ marginLeft: "8px", color: theme.primary, fontSize: "13px" }}>
                      【{tuitionSubject}】
                    </span>
                  )}
                </h4>
                <span style={{ fontWeight: "bold", color: theme.primary, fontSize: "15px" }}>
                  小計：${s1Total.toLocaleString()} 元 ({s1Hours} hr)
                </span>
              </div>
              {tuitionDetails.length === 0 ? (
                <div style={{ padding: "12px", background: theme.inputBg, borderRadius: "10px", color: theme.textMuted, fontSize: "13px" }}>
                  本月無上課紀錄
                </div>
              ) : (
                tuitionDetails.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px 15px",
                      background: theme.inputBg,
                      borderRadius: "12px",
                      marginBottom: "8px",
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "14px", color: theme.textMain }}>
                        {t.class_date} ({t.subject})
                      </div>
                      <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "2px" }}>
                        {t.duration} hr × ${t.rate}/hr {t.extra > 0 && `+ 雜費 ${t.extra}`}
                      </div>
                    </div>
                    <span style={{ fontWeight: "bold", color: theme.textMain, fontSize: "15px" }}>
                      ${t.total}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* 學生二卡片區 */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <h4 style={{ margin: 0, color: theme.textMain, fontWeight: "900", fontSize: "16px" }}>
                  👤 學生二：{secondStudentName} ({student2Details.length} 堂)
                  {tuitionSubject !== "ALL" && (
                    <span style={{ marginLeft: "8px", color: theme.primary, fontSize: "13px" }}>
                      【{tuitionSubject}】
                    </span>
                  )}
                </h4>
                <span style={{ fontWeight: "bold", color: theme.primary, fontSize: "15px" }}>
                  小計：${s2Total.toLocaleString()} 元 ({s2Hours} hr)
                </span>
              </div>
              {student2Details.length === 0 ? (
                <div style={{ padding: "12px", background: theme.inputBg, borderRadius: "10px", color: theme.textMuted, fontSize: "13px" }}>
                  本月無上課紀錄
                </div>
              ) : (
                student2Details.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px 15px",
                      background: theme.inputBg,
                      borderRadius: "12px",
                      marginBottom: "8px",
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "14px", color: theme.textMain }}>
                        {t.class_date} ({t.subject})
                      </div>
                      <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "2px" }}>
                        {t.duration} hr × ${t.rate}/hr {t.extra > 0 && `+ 雜費 ${t.extra}`}
                      </div>
                    </div>
                    <span style={{ fontWeight: "bold", color: theme.textMain, fontSize: "15px" }}>
                      ${t.total}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* 雙人合併總計橫幅 */}
            <div
              style={{
                textAlign: "right",
                fontSize: "24px",
                fontWeight: "900",
                marginTop: "20px",
                color: theme.danger,
                borderTop: `2px solid ${theme.border}`,
                paddingTop: "15px",
              }}
            >
              兩位學生合計總學費：${(s1Total + s2Total).toLocaleString()} 元 (共 {s1Hours + s2Hours} hr)
            </div>
          </div>
        )}
      </div>

      {/* 客製化時薪快捷面板 */}
      <div style={{ ...solidCardStyle, marginTop: "25px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: theme.textMain, margin: 0 }}>⚙️ 客製化各學科時薪設定 ({selectedName})</h3>
          <button
            onClick={handleSaveAllRates}
            disabled={loading}
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
          }}
        >
          {SUBJECTS.map((sub) => (
            <div
              key={`${selectedName}-${sub}`}
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
    </>
  );
}
