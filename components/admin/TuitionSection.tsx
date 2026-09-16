"use client";

import React, { useState, useEffect } from "react";
import { Check, Copy, FileText } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { BANK_ACCOUNT, SUBJECTS } from "@/lib/constants";
import { getCurrentMonthString } from "@/lib/dateUtils";
import { useToast } from "@/components/ui/Toast";
import type { AdminTheme } from "./adminTheme";
import { getCommonStyles } from "./adminTheme";

interface TuitionSectionProps {
  theme: AdminTheme;
  isDarkMode: boolean;
  selectedName: string;
}

export function TuitionSection({
  theme,
  isDarkMode,
  selectedName,
}: TuitionSectionProps) {
  const { showToast } = useToast();
  const { solidCardStyle, inputStyle, btnStyle } = getCommonStyles(theme);

  const [loading, setLoading] = useState(false);
  const [tuitionMonth, setTuitionMonth] = useState(getCurrentMonthString());
  const [tuitionDetails, setTuitionDetails] = useState<any[]>([]);
  const [localRates, setLocalRates] = useState<Record<string, number>>({});
  const [billingText, setBillingText] = useState("");
  const [isCopied, setIsCopied] = useState(false);

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
    setBillingText("");
  }, [selectedName]);

  const handleTuitionCheck = async () => {
    if (!selectedName) return showToast("請先選擇學生！", "warning");
    setLoading(true);
    const { data: classes } = await supabase
      .from("class_logs")
      .select("*")
      .eq("student_name", selectedName)
      .ilike("class_date", `${tuitionMonth}%`)
      .order("class_date", { ascending: true });

    const { data: rates = [] } = await supabase
      .from("subject_rates")
      .select("*")
      .eq("student_name", selectedName);

    setLoading(false);
    setBillingText("");

    if (!classes || classes.length === 0) {
      setTuitionDetails([]);
      return showToast("⚠️ 本月查無該學生的補習紀錄", "info");
    }

    const rateMap: Record<string, number> = {};
    rates?.forEach((r) => (rateMap[r.subject] = r.rate));

    const details = classes.map((c) => {
      const sub = c.subject || "數學";
      const rate = rateMap[sub] || 0;
      const extra = c.expense || 0;
      const total = Number(c.duration) * rate + extra;
      return { ...c, rate, total, extra };
    });

    setTuitionDetails(details);
    showToast(`✅ 已結算出 ${details.length} 堂課程明細`, "success");
  };

  const generateBillingText = () => {
    if (tuitionDetails.length === 0) {
      showToast("請先按「核算學費」取得資料喔！", "warning");
      return;
    }
    const month = parseInt(tuitionMonth.split("-")[1], 10);
    const grouped: Record<string, any[]> = {};
    tuitionDetails.forEach((d) => {
      const sub = d.subject || "其他";
      if (!grouped[sub]) grouped[sub] = [];
      grouped[sub].push(d);
    });

    let text = `${selectedName}媽媽您好：\n${month}月的課程已經結束囉！\n\n`;
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
    text += `共 ${totalCost.toLocaleString()} 元，確認無誤後，麻煩媽媽方便的時候幫我匯到以下帳戶：\n${BANK_ACCOUNT}`;
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

  return (
    <>
      <div style={solidCardStyle}>
        <h3 style={{ color: theme.textMain, marginBottom: "20px" }}>💰 月底學費結算與明細生成</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="month"
            value={tuitionMonth}
            onChange={(e) => setTuitionMonth(e.target.value)}
            style={{ ...inputStyle, width: "auto", flex: 1, minWidth: "140px" }}
          />
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
            {loading ? "計算中..." : "核算學費"}
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
                height: "220px",
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

        {tuitionDetails.length > 0 && (
          <div style={{ marginTop: "25px", borderTop: `2px dashed ${theme.border}`, paddingTop: "20px" }}>
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
                fontSize: "28px",
                fontWeight: "900",
                marginTop: "20px",
                color: theme.danger,
                borderTop: `2px solid ${theme.border}`,
                paddingTop: "15px",
              }}
            >
              本月學費總計：$
              {tuitionDetails.reduce((a, b) => a + b.total, 0).toLocaleString()} 元
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

