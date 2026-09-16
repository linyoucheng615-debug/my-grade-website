"use client";

import React, { useEffect } from "react";
import { AlertTriangle, HelpCircle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "確定",
  cancelText = "取消",
  isDanger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeInModal 0.2s ease",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#ffffff",
          color: "#0f172a",
          width: "100%",
          maxWidth: "400px",
          borderRadius: "24px",
          padding: "24px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.25)",
          position: "relative",
          animation: "scaleInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            background: "transparent",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "50%",
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div
            style={{
              padding: "10px",
              borderRadius: "14px",
              background: isDanger ? "rgba(239, 68, 68, 0.12)" : "rgba(14, 165, 233, 0.12)",
              color: isDanger ? "#ef4444" : "#0ea5e9",
              display: "flex",
            }}
          >
            {isDanger ? <AlertTriangle size={24} /> : <HelpCircle size={24} />}
          </div>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: "#0f172a" }}>
            {title}
          </h3>
        </div>

        <p
          style={{
            margin: "0 0 24px 0",
            fontSize: "14px",
            color: "#64748b",
            lineHeight: "1.6",
            whiteSpace: "pre-line",
          }}
        >
          {message}
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 18px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              color: "#475569",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "0.2s",
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            style={{
              padding: "10px 20px",
              borderRadius: "12px",
              border: "none",
              background: isDanger ? "#ef4444" : "#0ea5e9",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: isDanger
                ? "0 4px 12px rgba(239, 68, 68, 0.3)"
                : "0 4px 12px rgba(14, 165, 233, 0.3)",
              transition: "0.2s",
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleInModal {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

