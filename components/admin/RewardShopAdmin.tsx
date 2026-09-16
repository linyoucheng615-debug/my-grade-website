"use client";

import React, { useState, useEffect } from "react";
import { Plus, ShoppingBag, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/Toast";
import type { AdminTheme } from "./adminTheme";
import { getCommonStyles } from "./adminTheme";

interface RewardShopAdminProps {
  isMobile: boolean;
  theme: AdminTheme;
}

export function RewardShopAdmin({ isMobile, theme }: RewardShopAdminProps) {
  const { showToast } = useToast();
  const { solidCardStyle, inputStyle, btnStyle } = getCommonStyles(theme);

  const [loading, setLoading] = useState(false);
  const [rewards, setRewards] = useState<any[]>([]);
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardPoints, setRewardPoints] = useState("");
  const [rewardDesc, setRewardDesc] = useState("");
  const [confirmRewardId, setConfirmRewardId] = useState<number | null>(null);

  const fetchRewards = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("rewards")
      .select("*")
      .order("is_active", { ascending: false })
      .order("points_required", { ascending: true });
    setRewards(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardTitle.trim() || !rewardPoints) {
      return showToast("請輸入商品名稱與所需點數", "warning");
    }
    const pointsNum = Number(rewardPoints);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      return showToast("所需點數必須為大於 0 的正整數", "warning");
    }

    setLoading(true);
    const { error } = await supabase.from("rewards").insert([
      {
        title: rewardTitle.trim(),
        points_required: pointsNum,
        description: rewardDesc.trim() || null,
        is_active: true,
      },
    ]);
    setLoading(false);

    if (error) {
      showToast("上架失敗：" + error.message, "error");
    } else {
      showToast("🎉 獎勵商品已成功上架！", "success");
      setRewardTitle("");
      setRewardPoints("");
      setRewardDesc("");
      fetchRewards();
    }
  };

  const handleToggleReward = async (id: number, currentActive: boolean) => {
    await supabase.from("rewards").update({ is_active: !currentActive }).eq("id", id);
    showToast(!currentActive ? "已重新上架商品" : "已下架隱藏商品", "info");
    fetchRewards();
  };

  const handleDeleteReward = async (id: number) => {
    await supabase.from("rewards").delete().eq("id", id);
    showToast("已刪除該商品", "info");
    fetchRewards();
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <form onSubmit={handleAddReward} style={solidCardStyle}>
        <h3
          style={{
            color: theme.textMain,
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Plus size={20} /> 🎁 上架新點數商品
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
            gap: "15px",
            marginBottom: "15px",
          }}
        >
          <input
            type="text"
            placeholder="商品名稱 (例: 免寫作業券、便利商店飲料)"
            value={rewardTitle}
            onChange={(e) => setRewardTitle(e.target.value)}
            style={{ ...inputStyle, margin: 0 }}
          />
          <div style={{ position: "relative" }}>
            <input
              type="number"
              placeholder="所需點數"
              min="1"
              value={rewardPoints}
              onChange={(e) => setRewardPoints(e.target.value)}
              style={{ ...inputStyle, margin: 0, paddingRight: "40px" }}
            />
            <span
              style={{
                position: "absolute",
                right: 15,
                top: 12,
                fontSize: 13,
                color: theme.textMuted,
              }}
            >
              點
            </span>
          </div>
        </div>
        <input
          type="text"
          placeholder="📝 商品備註說明 (選填，例如：限兌換一次)"
          value={rewardDesc}
          onChange={(e) => setRewardDesc(e.target.value)}
          style={{ ...inputStyle, marginBottom: "15px" }}
        />
        <button type="submit" disabled={loading} style={btnStyle("#14b8a6")}>
          {loading ? "處理中..." : "確認上架商品"}
        </button>
      </form>

      <div style={{ ...solidCardStyle, padding: "20px" }}>
        <h3
          style={{
            color: theme.textMain,
            margin: "0 0 20px 0",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <ShoppingBag size={20} /> 🛒 目前架上與歷史商品
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: "15px",
          }}
        >
          {rewards.map((r) => (
            <div
              key={r.id}
              style={{
                background: theme.inputBg,
                padding: "18px",
                borderRadius: "16px",
                border: `1px solid ${theme.border}`,
                opacity: r.is_active ? 1 : 0.6,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "900",
                      color: theme.textMain,
                      fontSize: "16px",
                      lineHeight: "1.4",
                    }}
                  >
                    {r.title}
                  </div>
                  <span
                    style={{
                      background: `${theme.primary}20`,
                      color: theme.primary,
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                    }}
                  >
                    💎 {r.points_required} 點
                  </span>
                </div>
                {r.description && (
                  <div
                    style={{
                      fontSize: "13px",
                      color: theme.textMuted,
                      lineHeight: "1.5",
                      marginBottom: "15px",
                    }}
                  >
                    {r.description}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                  marginTop: "15px",
                  paddingTop: "15px",
                  borderTop: `1px dashed ${theme.border}`,
                }}
              >
                <button
                  onClick={() => handleToggleReward(r.id, r.is_active)}
                  style={{
                    background: r.is_active ? "transparent" : theme.success,
                    color: r.is_active ? theme.textMuted : "#fff",
                    border: `1px solid ${r.is_active ? theme.border : theme.success}`,
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {r.is_active ? "隱藏下架" : "重新上架"}
                </button>

                {confirmRewardId === r.id ? (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => {
                        handleDeleteReward(r.id);
                        setConfirmRewardId(null);
                      }}
                      style={{
                        background: theme.danger,
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      確定刪除
                    </button>
                    <button
                      onClick={() => setConfirmRewardId(null)}
                      style={{
                        background: theme.card,
                        color: theme.textMain,
                        border: `1px solid ${theme.border}`,
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRewardId(r.id)}
                    style={{
                      background: `${theme.danger}15`,
                      color: theme.danger,
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title="刪除"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {rewards.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: theme.textMuted,
              padding: "30px",
              border: `1px dashed ${theme.border}`,
              borderRadius: "16px",
            }}
          >
            目前沒有設定任何點數商品
          </div>
        )}
      </div>
    </div>
  );
}

