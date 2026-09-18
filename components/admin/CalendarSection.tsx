"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Pencil,
  Plus,
  Trash2,
  X,
  Clock,
  RotateCw,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { SUBJECTS, WEEK_DAYS } from "@/lib/constants";
import { getTodayDateString } from "@/lib/dateUtils";
import { useToast } from "@/components/ui/Toast";
import type { AdminTheme } from "./adminTheme";
import { getCommonStyles, getEventColor } from "./adminTheme";

interface CalendarSectionProps {
  isMobile: boolean;
  theme: AdminTheme;
  isDarkMode: boolean;
  studentList: any[];
  calendarEvents: any[];
  onRefreshCalendar: () => void;
  isAdmin?: boolean;
}

export function CalendarSection({
  isMobile,
  theme,
  isDarkMode,
  studentList,
  calendarEvents,
  onRefreshCalendar,
  isAdmin = true,
}: CalendarSectionProps) {
  const { showToast } = useToast();
  const { solidCardStyle, inputStyle, selectStyle, btnStyle } = getCommonStyles(theme);

  const [loading, setLoading] = useState(false);
  const [editingEventId, setEditingEventId] = useState<any>(null);
  const [confirmEvId, setConfirmEvId] = useState<number | null>(null);

  // 日程事件清單搜尋與篩選狀態
  const [eventSearchQuery, setEventSearchQuery] = useState<string>("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all"); // 'all' | 'recurring' | 'single' | 'exam' | 'cancellation'
  const [eventStudentFilter, setEventStudentFilter] = useState<string>("all");
  const [hidePastEvents, setHidePastEvents] = useState<boolean>(true);
  const [expandedCancelEventId, setExpandedCancelEventId] = useState<number | null>(null);
  const [eventListPage, setEventListPage] = useState<number>(1);
  const [showAllEventsWithoutPagination, setShowAllEventsWithoutPagination] = useState<boolean>(false);
  const EVENTS_PER_PAGE = 8;

  // Form states
  const defaultEvStudent = isAdmin ? "全體" : (studentList[0]?.name || "");
  const [evDate, setEvDate] = useState<string>(getTodayDateString());
  const [evEndDate, setEvEndDate] = useState<string>(getTodayDateString());
  const [evTitle, setEvTitle] = useState<string>("");
  const [evType, setEvType] = useState<string>("class");
  const [evStudent, setEvStudent] = useState<string>(defaultEvStudent);
  const [evIsRecurring, setEvIsRecurring] = useState<boolean>(false);
  const [evRecurringEndDate, setEvRecurringEndDate] = useState<string>(getTodayDateString());
  const [evStartTime, setEvStartTime] = useState<string>("18:30");
  const [evEndTime, setEvEndTime] = useState<string>("20:30");

  React.useEffect(() => {
    if (!isAdmin && evStudent === "全體" && studentList.length > 0) {
      setEvStudent(studentList[0].name);
    }
  }, [isAdmin, studentList, evStudent]);

  // Calendar navigation
  const [calYear, setCalYear] = useState<number>(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState<number>(new Date().getMonth());

  // Modal states for single class modification / reschedule
  const [activeEventModal, setActiveEventModal] = useState<{ ev: any; clickedDate: string } | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>("");
  const [rescheduleStartTime, setRescheduleStartTime] = useState<string>("");
  const [rescheduleEndTime, setRescheduleEndTime] = useState<string>("");

  const resetEventForm = () => {
    setEditingEventId(null);
    setEvDate(getTodayDateString());
    setEvEndDate(getTodayDateString());
    setEvTitle("");
    setEvType("class");
    setEvStudent(isAdmin ? "全體" : (studentList[0]?.name || ""));
    setEvIsRecurring(false);
    setEvRecurringEndDate(getTodayDateString());
    setEvStartTime("18:30");
    setEvEndTime("20:30");
  };

  const handleEditEventClick = (ev: any) => {
    setEditingEventId(ev.id);
    setEvDate(ev.event_date);
    setEvEndDate(ev.end_date || ev.event_date);
    setEvTitle(ev.title || "");
    setEvType(ev.type || "class");
    setEvStudent(ev.student_name || "全體");
    setEvIsRecurring(ev.is_recurring || false);
    setEvRecurringEndDate(ev.recurring_end_date || ev.event_date);
    setEvStartTime(ev.start_time || "");
    setEvEndTime(ev.end_time || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const titleTrimmed = evTitle.trim();
    let finalType = evType;
    if (
      finalType === "class" &&
      (titleTrimmed.includes("段考") ||
        titleTrimmed.includes("模考") ||
        titleTrimmed.includes("會考") ||
        titleTrimmed.includes("期中") ||
        titleTrimmed.includes("期末") ||
        titleTrimmed.includes("大考"))
    ) {
      finalType = "exam";
    }

    setLoading(true);
    const payload = {
      event_date: evDate,
      end_date: evEndDate,
      title: titleTrimmed,
      type: finalType,
      student_name: evStudent,
      is_recurring: evIsRecurring,
      recurring_pattern: evIsRecurring ? "weekly" : null,
      recurring_end_date: evIsRecurring ? evRecurringEndDate : null,
      start_time: evStartTime || null,
      end_time: evEndTime || null,
    };

    let error;
    if (editingEventId) {
      const { error: updateError } = await supabase
        .from("calendar_events")
        .update(payload)
        .eq("id", editingEventId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("calendar_events").insert([payload]);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      showToast("操作失敗: " + error.message, "error");
    } else {
      showToast(editingEventId ? "🎉 已經成功修改！" : "🎉 日程事件已成功發布！", "success");
      resetEventForm();
      onRefreshCalendar();
    }
  };

  const handleCancelSingleEvent = async (ev: any, cancelDate: string) => {
    if (ev.cancelled_dates?.includes(cancelDate)) {
      return showToast("此日期已設定為停課囉！", "warning");
    }
    setLoading(true);
    const newCancelled = ev.cancelled_dates ? [...ev.cancelled_dates, cancelDate] : [cancelDate];
    await supabase.from("calendar_events").update({ cancelled_dates: newCancelled }).eq("id", ev.id);
    setLoading(false);
    showToast(`❌ 已設定 ${cancelDate} 停課`, "info");
    onRefreshCalendar();
  };

  const handleRestoreSingleEvent = async (ev: any, restoreDate: string) => {
    setLoading(true);
    const newCancelled = ev.cancelled_dates.filter((d: string) => d !== restoreDate);
    await supabase.from("calendar_events").update({ cancelled_dates: newCancelled }).eq("id", ev.id);
    setLoading(false);
    showToast(`✅ 已恢復 ${restoreDate} 上課`, "success");
    onRefreshCalendar();
  };

  // 單堂改期（調課）核心邏輯
  const handleRescheduleEvent = async () => {
    if (!activeEventModal || !rescheduleDate) {
      return showToast("請先選擇目標改期日期！", "warning");
    }
    const { ev, clickedDate } = activeEventModal;

    setLoading(true);

    if (ev.is_recurring) {
      // 1. 原常態課程：將原日期加入排除清單
      const newCancelled = ev.cancelled_dates ? [...ev.cancelled_dates, clickedDate] : [clickedDate];
      await supabase.from("calendar_events").update({ cancelled_dates: newCancelled }).eq("id", ev.id);

      // 2. 在新日期建立一筆單次補課紀錄（套用新日期與新時間）
      await supabase.from("calendar_events").insert([
        {
          event_date: rescheduleDate,
          end_date: rescheduleDate,
          title: `${ev.title} (調課)`,
          type: ev.type || "class",
          student_name: ev.student_name,
          is_recurring: false,
          start_time: rescheduleStartTime || null,
          end_time: rescheduleEndTime || null,
        },
      ]);
    } else {
      // 單次事件：直接修改日期與時間
      await supabase
        .from("calendar_events")
        .update({
          event_date: rescheduleDate,
          end_date: rescheduleDate,
          start_time: rescheduleStartTime || null,
          end_time: rescheduleEndTime || null,
        })
        .eq("id", ev.id);
    }

    // 同步更新進度表上的日期（防跨科目誤改：若標題含有科目名稱則鎖定該科目）
    const matchedSubject = SUBJECTS.find((sub) => ev.title?.includes(sub));
    let planUpdate = supabase
      .from("course_plans")
      .update({ planned_date: rescheduleDate })
      .eq("student_name", ev.student_name)
      .eq("planned_date", clickedDate);

    if (matchedSubject) {
      planUpdate = planUpdate.eq("subject", matchedSubject);
    }
    await planUpdate;

    setLoading(false);
    showToast(
      `🎉 已成功將課程調整至 ${rescheduleDate} (${rescheduleStartTime} ~ ${rescheduleEndTime})！`,
      "success"
    );
    setActiveEventModal(null);
    setRescheduleDate("");
    setRescheduleStartTime("");
    setRescheduleEndTime("");
    onRefreshCalendar();
  };

  const getEventsForDate = (dateStr: string) => {
    const currentCellDate = new Date(dateStr);
    const dayOfWeek = currentCellDate.getDay();
    return calendarEvents
      .filter((ev) => {
        const start = ev.event_date;
        if (!ev.is_recurring) {
          return start === dateStr || (ev.end_date && dateStr >= start && dateStr <= ev.end_date);
        }
        if (ev.is_recurring && ev.recurring_pattern === "weekly") {
          if (dateStr < start || (ev.recurring_end_date && dateStr > ev.recurring_end_date)) {
            return false;
          }
          return dayOfWeek === new Date(start).getDay();
        }
        return false;
      })
      .map((ev) => {
        const isCancelled =
          ev.type === "cancellation" ||
          (ev.cancelled_dates && Array.isArray(ev.cancelled_dates) && ev.cancelled_dates.includes(dateStr));
        return { ...ev, isCancelled };
      });
  };

  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
  const blanks = Array(firstDayIndex).fill(null);
  const daysInMonth = Array.from({ length: totalDays }, (_, i) => i + 1);
  const calendarCells = [...blanks, ...daysInMonth];

  return (
    <div>
      <form onSubmit={handleAddEvent} style={solidCardStyle}>
        <h3
          style={{
            color: theme.textMain,
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {editingEventId ? <Pencil size={20} color={theme.primary} /> : <Plus size={20} />}
          {editingEventId ? "編輯日程事件" : "發布日程事件"}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: "15px",
            marginBottom: "15px",
          }}
        >
          <div>
            <label style={{ fontSize: "11px", color: theme.textMuted }}>開始日期</label>
            <input
              type="date"
              value={evDate}
              onChange={(e) => setEvDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: "11px", color: theme.textMuted }}>結束日期 (單次跨日適用)</label>
            <input
              type="date"
              value={evEndDate}
              onChange={(e) => setEvEndDate(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: "15px",
            marginBottom: "15px",
            background: theme.inputBg,
            padding: "15px",
            borderRadius: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              id="is_rec"
              checked={evIsRecurring}
              onChange={(e) => setEvIsRecurring(e.target.checked)}
              style={{ width: "18px", height: "18px" }}
            />
            <label htmlFor="is_rec" style={{ fontWeight: "bold", fontSize: "14px", cursor: "pointer" }}>
              🔄 設定為每週重複
            </label>
          </div>
          {evIsRecurring && (
            <div>
              <label style={{ fontSize: "11px", color: theme.textMuted }}>重複截止日期</label>
              <input
                type="date"
                value={evRecurringEndDate}
                onChange={(e) => setEvRecurringEndDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
            marginBottom: "15px",
            background: theme.inputBg,
            padding: "15px",
            borderRadius: "14px",
          }}
        >
          <div>
            <label style={{ fontSize: "12px", fontWeight: "bold", color: theme.primary }}>
              ⏰ 開始時間
            </label>
            <input
              type="time"
              value={evStartTime}
              onChange={(e) => setEvStartTime(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "bold", color: theme.primary }}>
              ⏰ 結束時間
            </label>
            <input
              type="time"
              value={evEndTime}
              onChange={(e) => setEvEndTime(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: "15px",
            marginBottom: "15px",
          }}
        >
          <select value={evType} onChange={(e) => setEvType(e.target.value)} style={inputStyle}>
            <option value="class">📖 補習常態 / 課表</option>
            <option value="exam">🏆 學校段考日程</option>
            <option value="cancellation">❌ 停課 / 請假 (該日變色隱藏)</option>
            <option value="activity">🎈 其他活動安排</option>
          </select>
          <select value={evStudent} onChange={(e) => setEvStudent(e.target.value)} style={inputStyle}>
            {isAdmin && <option value="全體">指定對象：全體學生</option>}
            {studentList.map((s) => (
              <option key={s.id} value={s.name}>
                指定對象：{s.name}
              </option>
            ))}
          </select>
        </div>
        <input
          type="text"
          placeholder="活動名稱 (例: 數學常態複習課、英文第二次段考)"
          value={evTitle}
          onChange={(e) => {
            const val = e.target.value;
            setEvTitle(val);
            if (
              evType === "class" &&
              (val.includes("段考") ||
                val.includes("模考") ||
                val.includes("會考") ||
                val.includes("期中") ||
                val.includes("期末") ||
                val.includes("大考"))
            ) {
              setEvType("exam");
            }
          }}
          style={inputStyle}
        />

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...btnStyle(editingEventId ? theme.success : theme.primary),
              flex: 1,
            }}
          >
            {editingEventId ? "儲存修改" : "發布事件"}
          </button>
          {editingEventId && (
            <button
              type="button"
              onClick={resetEventForm}
              style={{ ...btnStyle(theme.textMuted), flex: 1 }}
            >
              取消編輯
            </button>
          )}
        </div>
      </form>

      {/* 總覽日曆 */}
      <div style={{ ...solidCardStyle, padding: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: "900",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: theme.textMain,
            }}
          >
            <CalendarIcon size={20} color={theme.primary} /> 🗓️ 總覽行事曆 (管理端)
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontWeight: "bold", fontSize: "15px" }}>
              {calYear} 年 {calMonth + 1} 月
            </span>
            <div style={{ display: "flex", gap: "5px" }}>
              <button
                onClick={() => {
                  if (calMonth === 0) {
                    setCalMonth(11);
                    setCalYear(calYear - 1);
                  } else {
                    setCalMonth(calMonth - 1);
                  }
                }}
                style={{
                  background: theme.inputBg,
                  border: "none",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  color: theme.textMain,
                  cursor: "pointer",
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => {
                  setCalYear(new Date().getFullYear());
                  setCalMonth(new Date().getMonth());
                }}
                style={{
                  background: theme.inputBg,
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: theme.textMain,
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                今天
              </button>
              <button
                onClick={() => {
                  if (calMonth === 11) {
                    setCalMonth(0);
                    setCalYear(calYear + 1);
                  } else {
                    setCalMonth(calMonth + 1);
                  }
                }}
                style={{
                  background: theme.inputBg,
                  border: "none",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  color: theme.textMain,
                  cursor: "pointer",
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div
          style={
            isMobile
              ? {
                  overflowX: "auto",
                  paddingBottom: "10px",
                  WebkitOverflowScrolling: "touch",
                }
              : {}
          }
        >
          <div style={isMobile ? { minWidth: "650px" } : {}}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                textAlign: "center",
                marginBottom: "10px",
                fontWeight: "bold",
                fontSize: "12px",
                color: theme.textMuted,
              }}
            >
              {WEEK_DAYS.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gap: "6px",
              }}
            >
              {calendarCells.map((day: any, idx: number) => {
                if (day === null) return <div key={`b-${idx}`} style={{ minHeight: "85px" }} />;
                const mStr = String(calMonth + 1).padStart(2, "0");
                const dStr = String(day).padStart(2, "0");
                const dateKey = `${calYear}-${mStr}-${dStr}`;
                const dayEvents = getEventsForDate(dateKey);
                const isToday = getTodayDateString() === dateKey;

                return (
                  <div
                    key={dateKey}
                    style={{
                      minHeight: "85px",
                      background: theme.inputBg,
                      borderRadius: "12px",
                      padding: "6px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      border: isToday ? `2px solid ${theme.primary}` : `1px solid ${theme.border}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "bold",
                          width: "18px",
                          height: "18px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          background: isToday ? theme.primary : "transparent",
                          color: isToday ? "#ffffff" : theme.textMain,
                        }}
                      >
                        {day}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "3px",
                        flex: 1,
                        overflowY: "auto",
                        scrollbarWidth: "none",
                      }}
                    >
                      {dayEvents.map((ev, eIdx) => {
                        const itemColor = getEventColor(ev, isDarkMode, theme.primary);
                        const timeLabel = ev.start_time ? `${ev.start_time} ` : "";
                        return (
                          <div
                            key={eIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveEventModal({ ev, clickedDate: dateKey });
                              setRescheduleDate(dateKey);
                              setRescheduleStartTime(ev.start_time || "18:30");
                              setRescheduleEndTime(ev.end_time || "20:30");
                            }}
                            style={{
                              fontSize: "9px",
                              padding: "3px 5px",
                              borderRadius: "5px",
                              background: itemColor,
                              color:
                                ev.isCancelled || ev.type === "cancellation"
                                  ? theme.textMuted
                                  : "#ffffff",
                              textDecoration:
                                ev.isCancelled || ev.type === "cancellation"
                                  ? "line-through"
                                  : "none",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              cursor: "pointer",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                              transition: "transform 0.1s",
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                            title="點擊進行調課或停課"
                          >
                            {ev.student_name === "全體" ? "" : `[${ev.student_name}]`}
                            {timeLabel}
                            {ev.type === "cancellation" ? "❌停課" : ev.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 日程整理與管理工具列 */}
      {(() => {
        const todayStr = getTodayDateString();

        const getEventDateLabel = (ev: any) => {
          if (ev.is_recurring) {
            let weekdayText = "";
            if (ev.event_date) {
              const [y, m, d] = ev.event_date.split("-").map(Number);
              const dayIdx = new Date(y, m - 1, d).getDay();
              weekdayText = `每週${WEEK_DAYS[dayIdx]}`;
            } else {
              weekdayText = "每週重複";
            }
            const timeRange = ev.start_time ? ` · ${ev.start_time} ~ ${ev.end_time || ""}` : "";
            return `🔄 ${weekdayText}${timeRange}`;
          }

          const isRange = ev.end_date && ev.end_date !== ev.event_date;
          const dateText = isRange ? `${ev.event_date} ~ ${ev.end_date}` : ev.event_date;
          const timeText = ev.start_time ? ` (${ev.start_time} ~ ${ev.end_time || ""})` : "";
          return `📅 ${dateText}${timeText}`;
        };

        const filteredCalendarEvents = calendarEvents.filter((ev) => {
          // 1. 隱藏過期日程篩選
          if (hidePastEvents) {
            if (ev.is_recurring) {
              if (ev.recurring_end_date && ev.recurring_end_date < todayStr) {
                return false;
              }
            } else {
              const evEnd = ev.end_date || ev.event_date;
              if (evEnd < todayStr) {
                return false;
              }
            }
          }

          // 2. 學生對象篩選
          if (eventStudentFilter !== "all") {
            if (ev.student_name !== eventStudentFilter) return false;
          }

          // 3. 類型分類篩選
          if (eventTypeFilter === "recurring") {
            if (!ev.is_recurring) return false;
          } else if (eventTypeFilter === "single") {
            if (ev.is_recurring || ev.type === "exam" || ev.type === "cancellation") return false;
          } else if (eventTypeFilter === "exam") {
            const isExam =
              ev.type === "exam" ||
              ev.title?.includes("段考") ||
              ev.title?.includes("模考") ||
              ev.title?.includes("會考");
            if (!isExam) return false;
          } else if (eventTypeFilter === "cancellation") {
            if (ev.type !== "cancellation") return false;
          }

          // 4. 關鍵字搜尋
          if (eventSearchQuery.trim()) {
            const q = eventSearchQuery.trim().toLowerCase();
            const matchTitle = (ev.title || "").toLowerCase().includes(q);
            const matchStudent = (ev.student_name || "").toLowerCase().includes(q);
            const matchDate = (ev.event_date || "").includes(q);
            const matchTime = `${ev.start_time || ""} ${ev.end_time || ""}`.includes(q);
            if (!matchTitle && !matchStudent && !matchDate && !matchTime) return false;
          }

          return true;
        });

        const totalPages = Math.ceil(filteredCalendarEvents.length / EVENTS_PER_PAGE) || 1;
        const paginatedEvents = showAllEventsWithoutPagination
          ? filteredCalendarEvents
          : filteredCalendarEvents.slice(
              (eventListPage - 1) * EVENTS_PER_PAGE,
              eventListPage * EVENTS_PER_PAGE
            );

        return (
          <div style={{ marginTop: "25px" }}>
            {/* 頂部搜尋與多功能篩選工具列 */}
            <div
              style={{
                ...solidCardStyle,
                padding: isMobile ? "14px" : "18px 20px",
                marginBottom: "15px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: isMobile ? "flex-start" : "center",
                  flexDirection: isMobile ? "column" : "row",
                  gap: "12px",
                  marginBottom: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <CalendarIcon size={20} color={theme.primary} />
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "900", color: theme.textMain }}>
                    📋 日程事件整理清單
                  </h3>
                  <span
                    style={{
                      fontSize: "12px",
                      color: theme.primary,
                      background: `${theme.primary}15`,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontWeight: "bold",
                    }}
                  >
                    共 {calendarEvents.length} 筆（顯示 {filteredCalendarEvents.length} 筆）
                  </span>
                </div>

                {/* 隱藏過期開關 */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "bold",
                    color: theme.textMuted,
                    background: hidePastEvents ? `${theme.primary}12` : "transparent",
                    padding: "4px 10px",
                    borderRadius: "8px",
                    border: `1px solid ${hidePastEvents ? theme.primary : theme.border}`,
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={hidePastEvents}
                    onChange={(e) => {
                      setHidePastEvents(e.target.checked);
                      setEventListPage(1);
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  隱藏已過期日程
                </label>
              </div>

              {/* 關鍵字搜尋框與學生下拉選單 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
                  gap: "10px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ position: "relative" }}>
                  <Search
                    size={16}
                    color={theme.textMuted}
                    style={{ position: "absolute", left: "12px", top: "12px" }}
                  />
                  <input
                    type="text"
                    placeholder="搜尋日程名稱、學生姓名、日期..."
                    value={eventSearchQuery}
                    onChange={(e) => {
                      setEventSearchQuery(e.target.value);
                      setEventListPage(1);
                    }}
                    style={{
                      ...inputStyle,
                      margin: 0,
                      padding: "10px 12px 10px 36px",
                      fontSize: "13px",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                  {eventSearchQuery && (
                    <button
                      onClick={() => setEventSearchQuery("")}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "10px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: theme.textMuted,
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <select
                  value={eventStudentFilter}
                  onChange={(e) => {
                    setEventStudentFilter(e.target.value);
                    setEventListPage(1);
                  }}
                  style={{
                    ...selectStyle,
                    margin: 0,
                    width: "100%",
                    fontSize: "13px",
                    fontWeight: "bold",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="all">👤 全部學生對象</option>
                  <option value="全體">👥 全體 (公開日程)</option>
                  {studentList.map((s) => (
                    <option key={s.id || s.name} value={s.name}>
                      👤 {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 類型分類切換標籤列 (Pills) */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  overflowX: "auto",
                  paddingBottom: "4px",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {[
                  { id: "all", label: "全部", count: calendarEvents.length },
                  {
                    id: "recurring",
                    label: "🔄 每週常態",
                    count: calendarEvents.filter((e) => e.is_recurring).length,
                  },
                  {
                    id: "single",
                    label: "📌 單次課堂",
                    count: calendarEvents.filter(
                      (e) => !e.is_recurring && e.type !== "exam" && e.type !== "cancellation"
                    ).length,
                  },
                  {
                    id: "exam",
                    label: "📝 段考模考",
                    count: calendarEvents.filter(
                      (e) =>
                        e.type === "exam" ||
                        e.title?.includes("段考") ||
                        e.title?.includes("模考") ||
                        e.title?.includes("會考")
                    ).length,
                  },
                  {
                    id: "cancellation",
                    label: "❌ 停課通知",
                    count: calendarEvents.filter((e) => e.type === "cancellation").length,
                  },
                ].map((tab) => {
                  const active = eventTypeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setEventTypeFilter(tab.id);
                        setEventListPage(1);
                      }}
                      style={{
                        background: active ? theme.primary : theme.inputBg,
                        color: active ? "#fff" : theme.textMuted,
                        border: `1px solid ${active ? theme.primary : theme.border}`,
                        padding: "6px 12px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      {tab.label}
                      <span
                        style={{
                          background: active ? "rgba(255,255,255,0.25)" : theme.activeControl,
                          color: active ? "#fff" : theme.textMuted,
                          fontSize: "10px",
                          padding: "1px 5px",
                          borderRadius: "6px",
                        }}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 卡片清單區塊 */}
            {filteredCalendarEvents.length === 0 ? (
              <div
                style={{
                  ...solidCardStyle,
                  textAlign: "center",
                  padding: "35px 20px",
                  color: theme.textMuted,
                  fontSize: "14px",
                }}
              >
                🔍 沒有符合條件的日程事件
                {hidePastEvents && (
                  <div style={{ marginTop: "8px", fontSize: "12px" }}>
                    （目前已隱藏過期日程，可取消勾選「隱藏已過期日程」查看歷史紀錄）
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {paginatedEvents.map((ev) => {
                  const isCancelOpen = expandedCancelEventId === ev.id;
                  const eventColor = getEventColor(ev, isDarkMode, theme.primary);
                  const cancelCount = ev.cancelled_dates?.length || 0;

                  return (
                    <div
                      key={ev.id}
                      style={{
                        ...solidCardStyle,
                        padding: "14px 16px",
                        marginBottom: 0,
                        borderLeft: `5px solid ${eventColor}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: isMobile ? "flex-start" : "center",
                          flexDirection: isMobile ? "column" : "row",
                          gap: "10px",
                        }}
                      >
                        {/* 事件主要資訊 */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              flexWrap: "wrap",
                              marginBottom: "5px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "bold",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: `${eventColor}20`,
                                color: eventColor,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {getEventDateLabel(ev)}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "bold",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: theme.inputBg,
                                color: theme.textMain,
                                border: `1px solid ${theme.border}`,
                                whiteSpace: "nowrap",
                              }}
                            >
                              👤 {ev.student_name}
                            </span>
                            {cancelCount > 0 && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  background: "rgba(248,113,113,0.15)",
                                  color: theme.danger,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                ⚠️ 已排除 {cancelCount} 日
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontWeight: "900",
                              fontSize: "16px",
                              color: theme.textMain,
                              wordBreak: "break-word",
                            }}
                          >
                            {ev.type === "cancellation" ? `❌【停課通知】${ev.title}` : ev.title}
                          </div>
                        </div>

                        {/* 右側操作按鈕組 */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            alignSelf: isMobile ? "flex-end" : "center",
                            flexShrink: 0,
                          }}
                        >
                          {ev.is_recurring && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedCancelEventId(isCancelOpen ? null : ev.id)
                              }
                              style={{
                                background: isCancelOpen ? `${theme.primary}20` : theme.inputBg,
                                color: isCancelOpen ? theme.primary : theme.textMuted,
                                border: `1px solid ${isCancelOpen ? theme.primary : theme.border}`,
                                padding: "6px 10px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontWeight: "bold",
                                transition: "0.2s",
                              }}
                              title="設定此常態課程的單堂停課或排除日期"
                            >
                              ⚙️ 停課管理
                              {isCancelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}

                          {confirmEvId === ev.id ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <button
                                onClick={async () => {
                                  await supabase.from("calendar_events").delete().eq("id", ev.id);
                                  onRefreshCalendar();
                                  setConfirmEvId(null);
                                }}
                                style={{
                                  background: theme.danger,
                                  color: "#fff",
                                  border: "none",
                                  padding: "6px 10px",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                確定刪除
                              </button>
                              <button
                                onClick={() => setConfirmEvId(null)}
                                style={{
                                  background: theme.inputBg,
                                  color: theme.textMain,
                                  border: `1px solid ${theme.border}`,
                                  padding: "6px 10px",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                取消
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditEventClick(ev)}
                                style={{
                                  background: `${theme.primary}15`,
                                  color: theme.primary,
                                  border: "none",
                                  padding: "7px 10px",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                }}
                                title="編輯此日程"
                              >
                                <Pencil size={15} />
                                {!isMobile && "編輯"}
                              </button>
                              <button
                                onClick={() => setConfirmEvId(ev.id)}
                                style={{
                                  background: `${theme.danger}15`,
                                  color: theme.danger,
                                  border: "none",
                                  padding: "7px 10px",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                }}
                                title="刪除此日程"
                              >
                                <Trash2 size={15} />
                                {!isMobile && "刪除"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 折疊式單堂停課設定區塊 */}
                      {ev.is_recurring && isCancelOpen && (
                        <div
                          style={{
                            marginTop: "6px",
                            background: theme.inputBg,
                            padding: "12px 14px",
                            borderRadius: "12px",
                            border: `1px dashed ${theme.border}`,
                            animation: "fadeIn 0.2s ease",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: theme.textMuted,
                              marginBottom: "8px",
                              fontWeight: "bold",
                            }}
                          >
                            ⚙️ 單堂停課 / 請假管理（僅於指定日期排除此課程，不影響其他週次）：
                          </div>
                          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                            <input
                              type="date"
                              id={`cancel-date-${ev.id}`}
                              style={{
                                ...inputStyle,
                                padding: "6px 12px",
                                margin: 0,
                                width: "auto",
                                minWidth: "140px",
                                fontSize: "13px",
                              }}
                            />
                            <button
                              onClick={() => {
                                const dateInput = document.getElementById(
                                  `cancel-date-${ev.id}`
                                ) as HTMLInputElement;
                                if (!dateInput.value) {
                                  return showToast("請先選擇要排除的日期！", "warning");
                                }
                                handleCancelSingleEvent(ev, dateInput.value);
                                dateInput.value = "";
                              }}
                              style={{
                                background: theme.danger,
                                color: "#fff",
                                border: "none",
                                padding: "7px 16px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                cursor: "pointer",
                                fontWeight: "bold",
                                whiteSpace: "nowrap",
                              }}
                            >
                              排除此日上課
                            </button>
                          </div>

                          {ev.cancelled_dates && ev.cancelled_dates.length > 0 && (
                            <div style={{ marginTop: "10px" }}>
                              <div style={{ fontSize: "11px", color: theme.textMuted, marginBottom: "4px" }}>
                                已設定停課排除之日期：
                              </div>
                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                {ev.cancelled_dates.map((cDate: string) => (
                                  <span
                                    key={cDate}
                                    style={{
                                      background: "rgba(248,113,113,0.15)",
                                      color: theme.danger,
                                      padding: "4px 10px",
                                      borderRadius: "8px",
                                      fontSize: "12px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    ❌ {cDate}
                                    <button
                                      onClick={() => handleRestoreSingleEvent(ev, cDate)}
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        color: theme.danger,
                                        padding: 0,
                                        display: "flex",
                                      }}
                                      title="取消排除，恢復上課"
                                    >
                                      <X size={14} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 分頁器與全部展開切換 */}
            {filteredCalendarEvents.length > EVENTS_PER_PAGE && (
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                  padding: "8px 4px",
                }}
              >
                <div style={{ fontSize: "13px", color: theme.textMuted }}>
                  顯示第 {(eventListPage - 1) * EVENTS_PER_PAGE + 1} ~{" "}
                  {Math.min(eventListPage * EVENTS_PER_PAGE, filteredCalendarEvents.length)} 筆，共{" "}
                  {filteredCalendarEvents.length} 筆
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    onClick={() =>
                      setShowAllEventsWithoutPagination(!showAllEventsWithoutPagination)
                    }
                    style={{
                      background: "transparent",
                      color: theme.primary,
                      border: "none",
                      fontSize: "13px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      marginRight: "8px",
                    }}
                  >
                    {showAllEventsWithoutPagination ? "📑 切換為分頁模式" : "📜 一次展開全部"}
                  </button>

                  {!showAllEventsWithoutPagination && (
                    <>
                      <button
                        disabled={eventListPage <= 1}
                        onClick={() => setEventListPage((p) => Math.max(1, p - 1))}
                        style={{
                          background: eventListPage <= 1 ? theme.inputBg : theme.activeControl,
                          color: eventListPage <= 1 ? theme.textMuted : theme.textMain,
                          border: `1px solid ${theme.border}`,
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          cursor: eventListPage <= 1 ? "not-allowed" : "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        上一頁
                      </button>
                      <span style={{ fontSize: "12px", color: theme.textMuted, fontWeight: "bold" }}>
                        {eventListPage} / {totalPages}
                      </span>
                      <button
                        disabled={eventListPage >= totalPages}
                        onClick={() => setEventListPage((p) => Math.min(totalPages, p + 1))}
                        style={{
                          background:
                            eventListPage >= totalPages ? theme.inputBg : theme.activeControl,
                          color: eventListPage >= totalPages ? theme.textMuted : theme.textMain,
                          border: `1px solid ${theme.border}`,
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          cursor: eventListPage >= totalPages ? "not-allowed" : "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        下一頁
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* 課堂點擊調課/停課彈窗 (Modal) */}
      {activeEventModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              ...solidCardStyle,
              maxWidth: "420px",
              width: "100%",
              margin: 0,
              position: "relative",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            <button
              onClick={() => setActiveEventModal(null)}
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

            <h3
              style={{
                margin: "0 0 15px 0",
                color: theme.textMain,
                fontWeight: "900",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              📌 課堂異動管理
            </h3>

            <div
              style={{
                background: theme.inputBg,
                padding: "14px",
                borderRadius: "14px",
                marginBottom: "18px",
                border: `1px solid ${theme.border}`,
              }}
            >
              <div style={{ fontWeight: "bold", fontSize: "16px", color: theme.primary }}>
                {activeEventModal.ev.title}
              </div>
              <div style={{ color: theme.textMuted, fontSize: "13px", marginTop: "6px" }}>
                📅 原定日期：<b>{activeEventModal.clickedDate}</b>{" "}
                {activeEventModal.ev.start_time
                  ? `(${activeEventModal.ev.start_time} ~ ${activeEventModal.ev.end_time || ""})`
                  : ""}
              </div>
              <div style={{ color: theme.textMuted, fontSize: "13px", marginTop: "2px" }}>
                👤 學生對象：<b>{activeEventModal.ev.student_name}</b>{" "}
                {activeEventModal.ev.is_recurring ? "🔄 (每週常態課)" : "📌 (單次課)"}
              </div>
              {activeEventModal.ev.isCancelled && (
                <div
                  style={{
                    color: theme.danger,
                    fontSize: "12px",
                    fontWeight: "bold",
                    marginTop: "6px",
                  }}
                >
                  ⚠️ 此堂課目前處於停課狀態
                </div>
              )}
            </div>

            {/* 調課操作 */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: theme.textMain,
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                🔄 改移至其他日期與時段（單堂調課）：
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      color: theme.textMuted,
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    調課目標日期
                  </label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    style={{ ...inputStyle, margin: 0 }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label
                      style={{
                        fontSize: "11px",
                        color: theme.textMuted,
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      ⏰ 開始時間
                    </label>
                    <input
                      type="time"
                      value={rescheduleStartTime}
                      onChange={(e) => setRescheduleStartTime(e.target.value)}
                      style={{ ...inputStyle, margin: 0 }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "11px",
                        color: theme.textMuted,
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      ⏰ 結束時間
                    </label>
                    <input
                      type="time"
                      value={rescheduleEndTime}
                      onChange={(e) => setRescheduleEndTime(e.target.value)}
                      style={{ ...inputStyle, margin: 0 }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleRescheduleEvent}
                  disabled={loading}
                  style={{
                    ...btnStyle(theme.primary),
                    marginTop: "5px",
                    padding: "10px",
                  }}
                >
                  確認變更日期與時段
                </button>
              </div>
            </div>

            {/* 請假/停課/恢復 與 完整編輯 */}
            <div
              style={{
                borderTop: `1px dashed ${theme.border}`,
                paddingTop: "15px",
                display: "flex",
                gap: "10px",
              }}
            >
              {activeEventModal.ev.is_recurring &&
                (activeEventModal.ev.isCancelled ? (
                  <button
                    onClick={() => {
                      handleRestoreSingleEvent(activeEventModal.ev, activeEventModal.clickedDate);
                      setActiveEventModal(null);
                    }}
                    style={{
                      ...btnStyle(theme.success),
                      marginTop: 0,
                      flex: 1,
                      fontSize: "12px",
                    }}
                  >
                    恢復該堂上課
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleCancelSingleEvent(activeEventModal.ev, activeEventModal.clickedDate);
                      setActiveEventModal(null);
                    }}
                    style={{
                      ...btnStyle(theme.danger),
                      marginTop: 0,
                      flex: 1,
                      fontSize: "12px",
                    }}
                  >
                    該堂請假 / 停課
                  </button>
                ))}

              <button
                onClick={() => {
                  handleEditEventClick(activeEventModal.ev);
                  setActiveEventModal(null);
                }}
                style={{
                  ...btnStyle(theme.inputBg),
                  color: theme.textMain,
                  border: `1px solid ${theme.border}`,
                  marginTop: 0,
                  flex: 1,
                  fontSize: "12px",
                }}
              >
                編輯常態設定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

