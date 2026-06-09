"use client";

import React, { useState, useEffect } from "react";
import { LogOut, Pencil, Trash2, User, Lock, BookOpen, MessageSquare, TrendingUp, Filter, Clock, DollarSign, Copy, Check, FileText, Sun, Moon, Home, Coins, UserPlus, GraduationCap, Users, X, AlertTriangle, Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, ArrowLeft, Settings, Search, ShoppingBag } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const supabaseUrl = "https://ynkvxixhiwwnocqybprs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlua3Z4aXhoaXd3bm9jcXlicHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDM5MzYsImV4cCI6MjA4MjA3OTkzNn0.9Z_SKdFXQOrZXEHT4J4wkSXBpt097tOuuXI6IFJN_FA";
const supabase = createClient(supabaseUrl, supabaseKey);

const SUBJECTS = ["國文", "英文", "數學", "理化", "生物", "地科", "歷史", "地理", "公民"];
const COLORS: Record<string, string> = {
  "國文": "#ef4444", "英文": "#f59e0b", "數學": "#10b981",
  "理化": "#3b82f6", "生物": "#8b5cf6", "地科": "#ec4899",
  "歷史": "#6366f1", "地理": "#14b8a6", "公民": "#f97316"
};

const BANK_ACCOUNT = "（822） 129541918532"; 
const WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"];

interface HistoryListProps {
  data: any[];
  type: string;
  onEdit: (item: any) => void;
  onDelete: (id: number, info: string) => void;
  theme: any;
  isDarkMode: boolean;
}

export default function AdminPage() {
  const [currentTeacher, setCurrentTeacher] = useState<any>(null);
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  const [mainTab, setMainTab] = useState("features"); 
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null); 
  const [selectedName, setSelectedName] = useState(""); 
  
  const [loading, setLoading] = useState(false);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null); 
  const [historyData, setHistoryData] = useState<any[]>([]); 
  const [historyFilter, setHistoryFilter] = useState("全部");
  const [isMobile, setIsMobile] = useState(false);

  const [confirmStudentId, setConfirmStudentId] = useState<number | null>(null);
  const [confirmEvId, setConfirmEvId] = useState<number | null>(null);

  const [subject, setSubject] = useState(SUBJECTS[2]);
  const [score, setScore] = useState("");
  const [examDate, setExamDate] = useState("");
  const [unit, setUnit] = useState(""); 
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  
  const [classDate, setClassDate] = useState(new Date().toISOString().slice(0, 10));
  const [progress, setProgress] = useState("");
  const [homework, setHomework] = useState("");
  const [note, setNote] = useState("");
  const [duration, setDuration] = useState("1.5");
  const [expense, setExpense] = useState(""); 

  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("1234");
  const [newStudentSchool, setNewStudentSchool] = useState("");
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);

  const [tuitionMonth, setTuitionMonth] = useState(new Date().toISOString().slice(0, 7));
  const [tuitionDetails, setTuitionDetails] = useState<any[]>([]);
  const [subjectRates, setSubjectRates] = useState<any[]>([]);
  const [localRates, setLocalRates] = useState<Record<string, number>>({});

  const [chartData, setChartData] = useState<any[]>([]); 
  const [gradeFilter, setGradeFilter] = useState("數學"); 
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  
  const [billingText, setBillingText] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [editingEventId, setEditingEventId] = useState<any>(null);
  const [evDate, setEvDate] = useState(new Date().toISOString().slice(0, 10));
  const [evEndDate, setEvEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [evTitle, setEvTitle] = useState("");
  const [evType, setEvType] = useState("class");
  const [evStudent, setEvStudent] = useState("全體");
  const [evIsRecurring, setEvIsRecurring] = useState(false);
  const [evRecurringEndDate, setEvRecurringEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [evStartTime, setEvStartTime] = useState("18:30");
  const [evEndTime, setEvEndTime] = useState("20:30");

  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  const [searchKeyword, setSearchKeyword] = useState("");
  const [lastRecord, setLastRecord] = useState<any>(null);

  const [dashboardLowGrades, setDashboardLowGrades] = useState<any[]>([]);
  const [dashboardMissingLogs, setDashboardMissingLogs] = useState<any[]>([]);
  
  // ★ 核銷通知狀態
  const [recentRedeems, setRecentRedeems] = useState<any[]>([]);

  // 點數商品狀態
  const [rewards, setRewards] = useState<any[]>([]);
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardPoints, setRewardPoints] = useState("");
  const [rewardDesc, setRewardDesc] = useState("");
  const [confirmRewardId, setConfirmRewardId] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("teacherName");
    const savedTheme = localStorage.getItem("teacherTheme");
    if (savedTheme === "dark") setIsDarkMode(true);
    fetchStudents();
    fetchCalendar();
    if (saved) setCurrentTeacher({ name: saved });
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (currentTeacher && selectedName) {
      fetchRates();
    }
    if (currentTeacher && selectedName && selectedFeature && selectedFeature !== 'dashboard' && selectedFeature !== 'reward') {
      resetForm();
      setHistoryFilter("全部");
      setSearchKeyword(""); 
      fetchHistoryData();
      if (selectedFeature === "report") fetchStudentDetails();
    }
  }, [selectedName, selectedFeature, currentTeacher]);

  useEffect(() => {
    if (currentTeacher && selectedName && selectedFeature && selectedFeature !== 'dashboard' && selectedFeature !== 'reward') fetchHistoryData();
  }, [historyFilter]);

  useEffect(() => {
    if (selectedFeature === 'class' && selectedName && subject) {
        const fetchLast = async () => {
            const { data } = await supabase.from("class_logs")
                .select("*").eq("student_name", selectedName).eq("subject", subject)
                .order("class_date", { ascending: false }).limit(1);
            setLastRecord(data && data.length > 0 ? data[0] : null);
        };
        fetchLast();
    }
  }, [selectedFeature, selectedName, subject]);

  useEffect(() => {
    if (selectedFeature === 'dashboard' && currentTeacher) {
        fetchDashboardData();
    }
    if (selectedFeature === 'reward' && currentTeacher) {
        fetchRewards();
    }
  }, [selectedFeature, calendarEvents]);

  const fetchDashboardData = async () => {
      setLoading(true);
      const { data: grades } = await supabase.from("grades")
          .select("*").lt("score", 60).order("exam_date", { ascending: false }).limit(10);
      setDashboardLowGrades(grades || []);

      const today = new Date();
      const missing: any[] = [];
      const past7Days = Array.from({length: 7}, (_, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() - i - 1); 
          return d.toISOString().slice(0, 10);
      });

      const { data: recentLogs } = await supabase.from("class_logs").select("*").in("class_date", past7Days);
      const logsMap = new Set((recentLogs || []).map(l => `${l.student_name}_${l.class_date}`));

      past7Days.forEach(dateStr => {
          const dayEvents = getEventsForDate(dateStr);
          dayEvents.forEach(ev => {
              if (ev.type === 'class' && !ev.isCancelled && ev.student_name !== '全體') {
                  if (!logsMap.has(`${ev.student_name}_${dateStr}`)) {
                      missing.push({ student_name: ev.student_name, date: dateStr, title: ev.title });
                  }
              }
          });
      });
      setDashboardMissingLogs(missing);

      // ★ 撈取最近 5 筆「已使用」的兌換券 (核銷通知)
      const { data: redeems } = await supabase.from("student_inventory")
          .select("*").eq("status", "used").order("used_at", { ascending: false }).limit(5);
      setRecentRedeems(redeems || []);

      setLoading(false);
  };

  const fetchRewards = async () => {
      setLoading(true);
      const { data } = await supabase.from("rewards").select("*").order("is_active", { ascending: false }).order("points_required", { ascending: true });
      setRewards(data || []);
      setLoading(false);
  };

  const handleAddReward = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!rewardTitle.trim() || !rewardPoints) return alert("請輸入商品名稱與所需點數");
      setLoading(true);
      const { error } = await supabase.from("rewards").insert([{
          title: rewardTitle.trim(),
          points_required: Number(rewardPoints),
          description: rewardDesc.trim() || null,
          is_active: true
      }]);
      setLoading(false);
      if (error) {
          alert("上架失敗：" + error.message);
      } else {
          setRewardTitle("");
          setRewardPoints("");
          setRewardDesc("");
          fetchRewards();
      }
  };

  const handleToggleReward = async (id: number, currentStatus: boolean) => {
      setLoading(true);
      await supabase.from("rewards").update({ is_active: !currentStatus }).eq("id", id);
      fetchRewards();
  };

  const handleDeleteReward = async (id: number) => {
      setLoading(true);
      await supabase.from("rewards").delete().eq("id", id);
      fetchRewards();
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("teacherTheme", newTheme ? "dark" : "light");
  };

  const theme = {
    bg: isDarkMode ? "linear-gradient(135deg, #0f172a 0%, #020617 100%)" : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    bodyBg: isDarkMode ? "#020617" : "#f1f5f9",
    card: isDarkMode ? "#1e293b" : "#ffffff",
    activeControl: isDarkMode ? "#0f172a" : "#ffffff", 
    inputBg: isDarkMode ? "rgba(15, 23, 42, 0.6)" : "rgba(241, 245, 249, 0.6)",
    textMain: isDarkMode ? "#f8fafc" : "#1e293b",
    textMuted: isDarkMode ? "#94a3b8" : "#64748b",
    border: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
    primary: isDarkMode ? "#38bdf8" : "#0ea5e9",
    danger: isDarkMode ? "#f87171" : "#ef4444",
    success: isDarkMode ? "#34d399" : "#10b981",
    shadow: isDarkMode ? "0 10px 40px rgba(0,0,0,0.5)" : "0 8px 25px rgba(14, 165, 233, 0.08)",
    navBg: isDarkMode ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.85)",
  };

  const getEventColor = (ev: any) => {
    if (ev.isCancelled || ev.type === 'cancellation') return isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
    if (ev.type === 'exam') return "#be123c"; 
    if (ev.type === 'activity') return "#0891b2"; 
    
    if (ev.title) {
        for (const sub of SUBJECTS) {
            if (ev.title.includes(sub)) return COLORS[sub];
        }
    }
    return theme.primary;
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from("students").select("*").order("name");
    if (data && data.length > 0) {
      setStudentList(data);
      if (!selectedName) setSelectedName(data[0].name);
    }
  };

  const fetchCalendar = async () => {
    const { data } = await supabase.from("calendar_events").select("*").order("event_date", { ascending: true });
    setCalendarEvents(data || []);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return alert("請輸入學生姓名");
    setLoading(true);
    const payload = { name: newStudentName, password: newStudentPassword, school: newStudentSchool };
    const { error } = editingStudentId 
      ? await supabase.from("students").update(payload).eq("id", editingStudentId)
      : await supabase.from("students").insert([payload]);
    setLoading(false);
    if (!error) { alert("操作成功！"); resetStudentForm(); fetchStudents(); }
  };

  const resetStudentForm = () => { setNewStudentName(""); setNewStudentSchool(""); setNewStudentPassword("1234"); setEditingStudentId(null); };
  const handleEditStudentClick = (s: any) => { setEditingStudentId(s.id); setNewStudentName(s.name); setNewStudentPassword(s.password); setNewStudentSchool(s.school || ""); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleDeleteStudent = async (id: number) => {
    setLoading(true);
    await supabase.from("students").delete().eq("id", id);
    setLoading(false);
    fetchStudents();
  };

  const resetEventForm = () => {
    setEditingEventId(null);
    setEvDate(new Date().toISOString().slice(0, 10));
    setEvEndDate(new Date().toISOString().slice(0, 10));
    setEvTitle("");
    setEvType("class");
    setEvStudent("全體");
    setEvIsRecurring(false);
    setEvRecurringEndDate(new Date().toISOString().slice(0, 10));
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle.trim()) return alert("請輸入活動標題");
    setLoading(true);
    const payload = {
      event_date: evDate, end_date: evEndDate, title: evTitle, type: evType, student_name: evStudent,
      is_recurring: evIsRecurring, recurring_pattern: evIsRecurring ? 'weekly' : null, recurring_end_date: evIsRecurring ? evRecurringEndDate : null,
      start_time: evStartTime || null, end_time: evEndTime || null
    };
    let error;
    if (editingEventId) { const { error: updateError } = await supabase.from("calendar_events").update(payload).eq("id", editingEventId); error = updateError; } 
    else { const { error: insertError } = await supabase.from("calendar_events").insert([payload]); error = insertError; }
    setLoading(false);
    if (error) alert("操作失敗: " + error.message);
    else { alert(editingEventId ? "🎉 已經成功修改！" : "🎉 日程事件已成功發布！"); resetEventForm(); fetchCalendar(); }
  };

  const handleCancelSingleEvent = async (ev: any, cancelDate: string) => {
    if (ev.cancelled_dates?.includes(cancelDate)) return alert("此日期已設定為停課囉！");
    setLoading(true);
    const newCancelled = ev.cancelled_dates ? [...ev.cancelled_dates, cancelDate] : [cancelDate];
    await supabase.from("calendar_events").update({ cancelled_dates: newCancelled }).eq("id", ev.id);
    setLoading(false);
    fetchCalendar();
  };

  const handleRestoreSingleEvent = async (ev: any, restoreDate: string) => {
    setLoading(true);
    const newCancelled = ev.cancelled_dates.filter((d: string) => d !== restoreDate);
    await supabase.from("calendar_events").update({ cancelled_dates: newCancelled }).eq("id", ev.id);
    setLoading(false);
    fetchCalendar();
  };

  const fetchRates = async () => {
    setLocalRates({});
    const { data } = await supabase.from("subject_rates").select("*").eq("student_name", selectedName);
    setSubjectRates(data || []);
    const ratesMap: Record<string, number> = {};
    data?.forEach((r: any) => ratesMap[r.subject] = r.rate);
    setLocalRates(ratesMap);
  };

  const handleSaveAllRates = async () => {
    if (!selectedName) return alert("請先選擇學生！");
    setLoading(true);
    const payload = SUBJECTS.map(sub => ({
      student_name: selectedName,
      subject: sub,
      rate: localRates[sub] || 0
    }));
    const { error } = await supabase.from("subject_rates").upsert(payload, { onConflict: 'student_name,subject' });
    setLoading(false);
    if (error) {
      alert("時薪儲存失敗: " + error.message);
    } else {
      alert("✅ 各學科時薪已經成功儲存！");
      fetchRates(); 
    }
  };

  const fetchHistoryData = async () => {
    if (!selectedName || !selectedFeature) return;
    let tableName = selectedFeature === "class" ? "class_logs" : selectedFeature === "grade" ? "grades" : selectedFeature === "point" ? "point_logs" : null;
    if (!tableName) return;
    let query = supabase.from(tableName).select("*").eq("student_name", selectedName);
    if (historyFilter !== "全部" && (selectedFeature === "class" || selectedFeature === "grade")) { query = query.eq("subject", historyFilter); }
    const { data } = await query.order("created_at", { ascending: false }).limit(50);
    setHistoryData(data || []);
  };

  const fetchStudentDetails = async () => {
    const { data: grades } = await supabase.from("grades").select("*").eq("student_name", selectedName).order("exam_date", { ascending: false });
    if (grades) {
      setChartData(grades);
      const subjects = Array.from(new Set(grades.map((g: any) => g.subject))) as string[];
      setAvailableSubjects(subjects);
      if (subjects.length > 0 && !subjects.includes(gradeFilter)) setGradeFilter(subjects[0]);
    }
  };

  const getProcessedChartData = () => {
    const list = chartData.filter((g: any) => g.subject === gradeFilter);
    if (list.length === 0) return [];
    return [...list].sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()).map((g:any) => ({ date: g.exam_date, score: g.score }));
  };
  const getSubjectAverage = () => {
    const list = chartData.filter((g: any) => g.subject === gradeFilter);
    if (list.length === 0) return 0;
    return Math.round(list.reduce((acc: number, curr: any) => acc + curr.score, 0) / list.length);
  };

  const getEventsForDate = (dateStr: string) => {
    const currentCellDate = new Date(dateStr);
    const dayOfWeek = currentCellDate.getDay(); 
    return calendarEvents.filter(ev => {
      const start = ev.event_date;
      if (!ev.is_recurring) return start === dateStr || (ev.end_date && dateStr >= start && dateStr <= ev.end_date);
      if (ev.is_recurring && ev.recurring_pattern === 'weekly') {
        if (dateStr < start || (ev.recurring_end_date && dateStr > ev.recurring_end_date)) return false;
        return dayOfWeek === new Date(start).getDay();
      }
      return false;
    }).map(ev => {
      const isCancelled = ev.type === 'cancellation' || (ev.cancelled_dates && Array.isArray(ev.cancelled_dates) && ev.cancelled_dates.includes(dateStr));
      return { ...ev, isCancelled };
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data } = await supabase.from("teachers").select("*").eq("name", loginName.trim()).eq("password", loginPassword.trim()).single();
    setLoading(false);
    if (data) { setCurrentTeacher(data); localStorage.setItem("teacherName", data.name); } 
    else alert("❌ 登入失敗");
  };

  const handleLogout = () => { localStorage.removeItem("teacherName"); setCurrentTeacher(null); };
  const resetForm = () => { setEditingId(null); setScore(""); setUnit(""); setPoints(""); setReason(""); setProgress(""); setHomework(""); setNote(""); setExpense(""); setBillingText(""); };

  const handleSubmit = async (e: React.FormEvent, type: string) => {
    e.preventDefault();
    setLoading(true);
    let tableName = type === "class" ? "class_logs" : type === "grade" ? "grades" : "point_logs";
    let payload: any = { student_name: selectedName };
    if (type === "class") { payload = { ...payload, class_date: classDate, progress, homework, note, duration: Number(duration), subject, expense: Number(expense) || 0 }; }
    else if (type === "grade") payload = { ...payload, subject, score: Number(score), exam_date: examDate, unit };
    else if (type === "point") payload = { ...payload, points: Number(points), reason };
    const { error } = editingId ? await supabase.from(tableName).update(payload).eq("id", editingId) : await supabase.from(tableName).insert([payload]);
    setLoading(false);
    if (error) alert(error.message);
    else { 
      resetForm(); 
      fetchHistoryData(); 
      fetchStudentDetails();
      if (selectedFeature === 'class') {
         const { data } = await supabase.from("class_logs").select("*").eq("student_name", selectedName).eq("subject", subject).order("class_date", { ascending: false }).limit(1);
         setLastRecord(data && data.length > 0 ? data[0] : null);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTuitionCheck = async () => {
    setLoading(true);
    const { data: classes } = await supabase.from("class_logs").select("*").eq("student_name", selectedName).ilike("class_date", `${tuitionMonth}%`).order("class_date", { ascending: true });
    const { data: rates = [] } = await supabase.from("subject_rates").select("*").eq("student_name", selectedName);
    setLoading(false);
    setBillingText(""); 
    if (!classes || classes.length === 0) { setTuitionDetails([]); return alert("⚠️ 本月查無該學生的補習紀錄"); }
    const rateMap: Record<string, number> = {};
    rates?.forEach(r => rateMap[r.subject] = r.rate);
    const details = classes.map(c => {
        const sub = c.subject || "數學";
        const rate = rateMap[sub] || 0;
        const extra = c.expense || 0;
        const total = (Number(c.duration) * rate) + extra; 
        return { ...c, rate, total, extra };
    });
    setTuitionDetails(details);
  };

  const generateBillingText = () => {
    if (tuitionDetails.length === 0) { alert("請先按「計算」取得資料喔！"); return; }
    const month = parseInt(tuitionMonth.split("-")[1], 10);
    const grouped: Record<string, any[]> = {};
    tuitionDetails.forEach(d => {
      const sub = d.subject || "其他";
      if (!grouped[sub]) grouped[sub] = [];
      grouped[sub].push(d);
    });
    let text = `${selectedName}媽媽您好：\n${month}月的課程已經結束囉！\n\n`;
    Object.keys(grouped).forEach(sub => {
      text += `${sub}:\n`;
      grouped[sub].forEach(item => {
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

  const copyToClipboard = () => { navigator.clipboard.writeText(billingText); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); };

  const filteredHistory = historyData.filter(item => {
    if (!searchKeyword) return true;
    const kw = searchKeyword.toLowerCase();
    const str = `${item.subject || ''} ${item.progress || ''} ${item.homework || ''} ${item.note || ''} ${item.unit || ''} ${item.reason || ''}`.toLowerCase();
    return str.includes(kw);
  });

  const globalContainerStyle: React.CSSProperties = { minHeight: "100vh", background: theme.bg, transition: "background 0.5s ease", color: theme.textMain, fontFamily: "sans-serif" };
  const cardStyle: React.CSSProperties = { background: theme.card, padding: "20px", borderRadius: "20px", borderTop: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, borderLeft: `1px solid ${theme.border}`, boxShadow: theme.shadow, marginBottom: "25px", transition: "0.3s ease" };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px", margin: "6px 0", borderRadius: "10px", border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.textMain, boxSizing: "border-box", transition: "0.2s" };
  const loginInputStyle: React.CSSProperties = { width: "100%", padding: "14px 14px 14px 45px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.textMain, fontSize: "16px", outline: "none", boxSizing: "border-box", transition: "0.3s" };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };
  const solidCardStyle: React.CSSProperties = { background: theme.activeControl, padding: "25px", borderRadius: "20px", borderTop: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, borderLeft: `1px solid ${theme.border}`, boxShadow: theme.shadow, marginBottom: "25px", transition: "0.3s ease" };
  const btnStyle = (color: string): React.CSSProperties => ({ background: color, color: "#ffffff", border: "none", padding: "12px", borderRadius: "10px", cursor: "pointer", width: "100%", marginTop: "10px", fontWeight: "bold", transition: "0.2s" });
  const filterBtnStyle = (active: boolean, colorStr: string = theme.textMain): React.CSSProperties => ({ padding: "8px 16px", borderRadius: "20px", border: active ? `1px solid ${colorStr}` : `1px solid ${theme.border}`, background: active ? colorStr : theme.activeControl, color: active ? "#ffffff" : theme.textMuted, fontSize: "13px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap", transition: "0.2s" });

  if (!currentTeacher) return (
    <div style={{ ...globalContainerStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <style jsx global>{` body { background-color: ${theme.bodyBg}; margin: 0; transition: background-color 0.5s ease; } `}</style>
      <button onClick={toggleTheme} style={{ position: "absolute", top: 20, right: 20, background: theme.card, border: `1px solid ${theme.border}`, padding: "10px", borderRadius: "50%", color: theme.textMain, cursor: "pointer", boxShadow: theme.shadow }}><Sun size={20} /></button>
      <div style={{ ...solidCardStyle, width: "100%", maxWidth: "360px", textAlign: "center" }}>
        <h1 style={{ color: theme.primary, fontSize: "28px", marginBottom: "10px", fontWeight: "900" }}>🍎 老師登入</h1>
        <p style={{ color: theme.textMuted, marginBottom: "30px", fontSize: "14px" }}>進入教務管理控制台</p>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ position: "relative" }}><User size={18} style={{ position: "absolute", left: "15px", top: "16px", color: theme.textMuted }} /><input type="text" placeholder="帳號" value={loginName} onChange={e => setLoginName(e.target.value)} style={loginInputStyle} /></div>
            <div style={{ position: "relative" }}><Lock size={18} style={{ position: "absolute", left: "15px", top: "16px", color: theme.textMuted }} /><input type="password" placeholder="密碼" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={loginInputStyle} /></div>
            <button type="submit" disabled={loading} style={{ ...btnStyle(theme.primary), padding: "14px", borderRadius: "14px", fontSize: "16px" }}>{loading ? "登入中..." : "登入"}</button>
        </form>
        <div style={{ marginTop: "25px", borderTop: `1px solid ${theme.border}`, paddingTop: "20px" }}>
           <button onClick={() => window.location.href = '/'} style={{ background: "transparent", color: theme.textMuted, border: "none", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: "8px", transition: "0.2s" }}>🎒 我是學生，切換至前台</button>
        </div>
      </div>
    </div>
  );

  const currentChartDataArr = getProcessedChartData();
  const currentAvgNum = getSubjectAverage();

  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
  const blanks = Array(firstDayIndex).fill(null);
  const daysInMonth = Array.from({ length: totalDays }, (_, i) => i + 1);
  const calendarCells = [...blanks, ...daysInMonth];

  return (
    <div style={{ ...globalContainerStyle, paddingBottom: "100px" }}>
      <style jsx global>{` body { background-color: ${theme.bodyBg}; margin: 0; transition: background-color 0.5s ease; } `}</style>
      <div style={{ maxWidth: "850px", margin: "auto", padding: "20px" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "24px", color: theme.textMain, fontWeight: "900" }}>👩‍🏫 {currentTeacher.name} 的管理後台</h1>
          <div style={{ display: "flex", gap: "10px" }}>
             <button onClick={toggleTheme} style={{ background: theme.activeControl, border: `1px solid ${theme.border}`, padding: "10px", borderRadius: "50%", color: theme.textMain, cursor: "pointer", boxShadow: theme.shadow }}><Sun size={18} /></button>
             <button onClick={handleLogout} style={{ background: theme.activeControl, border: `1px solid ${theme.border}`, padding: "10px", borderRadius: "50%", color: theme.danger, cursor: "pointer", boxShadow: theme.shadow }}><LogOut size={18} /></button>
          </div>
        </div>

        {mainTab === "features" && (
          <div>
            {!selectedFeature && (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "900", color: theme.textMain, marginBottom: "20px" }}>🚀 請選擇要執行的功能</h2>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "15px" }}>
                    
                    <div onClick={() => setSelectedFeature('dashboard')} style={{ ...solidCardStyle, cursor: "pointer", borderLeft: `6px solid ${theme.primary}`, display: "flex", alignItems: "center", gap: "15px", marginBottom: 0, gridColumn: isMobile ? "auto" : "span 2" }}>
                        <div style={{ background: `${theme.primary}20`, padding: "12px", borderRadius: "12px" }}><Home size={24} color={theme.primary} /></div>
                        <div><div style={{ fontWeight: "900", fontSize: "16px", color: theme.textMain }}>🏠 老師今日看板</div><div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>今日課表、未填紀錄與低分預警</div></div>
                    </div>

                    <div onClick={() => setSelectedFeature('class')} style={{ ...solidCardStyle, cursor: "pointer", borderLeft: `6px solid #10b981`, display: "flex", alignItems: "center", gap: "15px", marginBottom: 0 }}>
                        <div style={{ background: "#10b98120", padding: "12px", borderRadius: "12px" }}><BookOpen size={24} color="#10b981" /></div>
                        <div><div style={{ fontWeight: "900", fontSize: "16px", color: theme.textMain }}>📚 登記上課進度</div><div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>進度、作業與雜費紀錄</div></div>
                    </div>
                    <div onClick={() => setSelectedFeature('grade')} style={{ ...solidCardStyle, cursor: "pointer", borderLeft: `6px solid #3b82f6`, display: "flex", alignItems: "center", gap: "15px", marginBottom: 0 }}>
                        <div style={{ background: "#3b82f620", padding: "12px", borderRadius: "12px" }}><TrendingUp size={24} color="#3b82f6" /></div>
                        <div><div style={{ fontWeight: "900", fontSize: "16px", color: theme.textMain }}>📝 輸入考試成績</div><div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>各校段考與測驗分數</div></div>
                    </div>
                    <div onClick={() => setSelectedFeature('point')} style={{ ...solidCardStyle, cursor: "pointer", borderLeft: `6px solid #f59e0b`, display: "flex", alignItems: "center", gap: "15px", marginBottom: 0 }}>
                        <div style={{ background: "#f59e0b20", padding: "12px", borderRadius: "12px" }}><Coins size={24} color="#f59e0b" /></div>
                        <div><div style={{ fontWeight: "900", fontSize: "16px", color: theme.textMain }}>💎 獎勵點數發放</div><div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>加扣點數與原因註記</div></div>
                    </div>

                    <div onClick={() => setSelectedFeature('reward')} style={{ ...solidCardStyle, cursor: "pointer", borderLeft: `6px solid #14b8a6`, display: "flex", alignItems: "center", gap: "15px", marginBottom: 0 }}>
                        <div style={{ background: "#14b8a620", padding: "12px", borderRadius: "12px" }}><ShoppingBag size={24} color="#14b8a6" /></div>
                        <div><div style={{ fontWeight: "900", fontSize: "16px", color: theme.textMain }}>🎁 點數商品管理</div><div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>上架兌換獎勵與設定</div></div>
                    </div>

                    <div onClick={() => setSelectedFeature('calendar')} style={{ ...solidCardStyle, cursor: "pointer", borderLeft: `6px solid #8b5cf6`, display: "flex", alignItems: "center", gap: "15px", marginBottom: 0 }}>
                        <div style={{ background: "#8b5cf620", padding: "12px", borderRadius: "12px" }}><CalendarIcon size={24} color="#8b5cf6" /></div>
                        <div><div style={{ fontWeight: "900", fontSize: "16px", color: theme.textMain }}>🗓️ 日程與行事曆</div><div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>排定日程與單日停課</div></div>
                    </div>
                    <div onClick={() => setSelectedFeature('tuition')} style={{ ...solidCardStyle, cursor: "pointer", borderLeft: `6px solid #ec4899`, display: "flex", alignItems: "center", gap: "15px", marginBottom: 0 }}>
                        <div style={{ background: "#ec489920", padding: "12px", borderRadius: "12px" }}><DollarSign size={24} color="#ec4899" /></div>
                        <div><div style={{ fontWeight: "900", fontSize: "16px", color: theme.textMain }}>💰 結算月底學費</div><div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>費用計算與家長請款</div></div>
                    </div>
                    <div onClick={() => setSelectedFeature('report')} style={{ ...solidCardStyle, cursor: "pointer", borderLeft: `6px solid #6366f1`, display: "flex", alignItems: "center", gap: "15px", marginBottom: 0 }}>
                        <div style={{ background: "#6366f120", padding: "12px", borderRadius: "12px" }}><FileText size={24} color="#6366f1" /></div>
                        <div><div style={{ fontWeight: "900", fontSize: "16px", color: theme.textMain }}>📊 檢視學習報表</div><div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>歷次成績走勢與平均</div></div>
                    </div>
                </div>
              </div>
            )}

            {selectedFeature && (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                <button onClick={() => setSelectedFeature(null)} style={{ background: theme.inputBg, border: `1px solid ${theme.border}`, padding: "8px 16px", borderRadius: "12px", color: theme.textMain, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", fontWeight: "bold", transition: "0.2s" }} onMouseOver={(e)=>e.currentTarget.style.background=theme.activeControl} onMouseOut={(e)=>e.currentTarget.style.background=theme.inputBg}>
                    <ArrowLeft size={16} /> 返回功能選單
                </button>

                {selectedFeature !== 'calendar' && selectedFeature !== 'dashboard' && selectedFeature !== 'reward' && (
                    <div style={{ ...solidCardStyle, padding: "20px" }}>
                        <label style={{ fontWeight: "900", display: "block", marginBottom: "12px", color: theme.primary, fontSize: "14px", letterSpacing: "1px" }}>👤 指定要操作的學生：</label>
                        <select value={selectedName} onChange={e => setSelectedName(e.target.value)} style={{ ...selectStyle, background: theme.inputBg, fontSize: "18px", fontWeight: "bold", color: theme.textMain, border: `1px solid ${theme.border}`, padding: "12px 15px", margin: 0 }}>
                            {studentList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                )}

                {/* ★ 老師 Dashboard：新增核銷通知欄位 */}
                {selectedFeature === 'dashboard' && (
                  <div style={{ animation: "fadeIn 0.4s ease" }}>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "20px" }}>
                          
                          <div style={solidCardStyle}>
                             <h3 style={{ margin: "0 0 15px 0", color: theme.primary, display: "flex", alignItems: "center", gap: "8px" }}><CalendarIcon size={20}/> 📌 今日排程</h3>
                             {getEventsForDate(new Date().toISOString().slice(0, 10)).filter(e => !e.isCancelled).length > 0 ? (
                                 <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                     {getEventsForDate(new Date().toISOString().slice(0, 10)).filter(e => !e.isCancelled).map((ev, idx) => (
                                         <div key={idx} style={{ padding: "12px", background: theme.inputBg, borderRadius: "12px", borderLeft: `4px solid ${getEventColor(ev)}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                             <div>
                                                 <div style={{ fontSize: "14px", fontWeight: "bold", color: theme.textMain }}>{ev.title}</div>
                                                 <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>對象: {ev.student_name}</div>
                                             </div>
                                             {ev.start_time && <div style={{ fontSize: "13px", fontWeight: "bold", color: theme.textMain }}>{ev.start_time}</div>}
                                         </div>
                                     ))}
                                 </div>
                             ) : <div style={{ color: theme.textMuted, fontSize: "14px", textAlign: "center", padding: "20px", background: theme.inputBg, borderRadius: "12px", border: `1px dashed ${theme.border}` }}>今日無排定行程 🎉</div>}
                          </div>

                          <div style={solidCardStyle}>
                             <h3 style={{ margin: "0 0 15px 0", color: "#f59e0b", display: "flex", alignItems: "center", gap: "8px" }}><AlertTriangle size={20}/> 📝 待補進度提醒 (近7日)</h3>
                             {dashboardMissingLogs.length > 0 ? (
                                 <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                     {dashboardMissingLogs.map((log, idx) => (
                                         <div key={idx} style={{ padding: "12px", background: theme.inputBg, borderRadius: "12px", borderLeft: `4px solid #f59e0b`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                             <div>
                                                 <div style={{ fontSize: "14px", fontWeight: "bold", color: theme.textMain }}>{log.title}</div>
                                                 <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>對象: {log.student_name}</div>
                                             </div>
                                             <div style={{ fontSize: "12px", color: theme.danger, fontWeight: "bold" }}>{log.date}</div>
                                         </div>
                                     ))}
                                 </div>
                             ) : <div style={{ color: theme.textMuted, fontSize: "14px", textAlign: "center", padding: "20px", background: theme.inputBg, borderRadius: "12px", border: `1px dashed ${theme.border}` }}>所有紀錄皆已填寫完畢 ✅</div>}
                          </div>

                          {/* ★ 新增：最新核銷通知區塊 */}
                          <div style={{...solidCardStyle}}>
                             <h3 style={{ margin: "0 0 15px 0", color: theme.success, display: "flex", alignItems: "center", gap: "8px" }}><Check size={20}/> 🔔 最新核銷通知</h3>
                             {recentRedeems.length > 0 ? (
                                 <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                     {recentRedeems.map((r, idx) => (
                                         <div key={idx} style={{ padding: "12px", background: theme.inputBg, borderRadius: "12px", border: `1px solid ${theme.success}` }}>
                                             <div style={{ fontSize: "14px", color: theme.textMain }}>
                                                 <b>{r.student_name}</b> 使用了 <b>{r.reward_title}</b>
                                             </div>
                                             <div style={{ fontSize: "11px", color: theme.textMuted, marginTop: "4px" }}>使用時間: {new Date(r.used_at).toLocaleString()}</div>
                                         </div>
                                     ))}
                                 </div>
                             ) : <div style={{ color: theme.textMuted, fontSize: "14px", textAlign: "center", padding: "20px" }}>暫無學生核銷獎勵</div>}
                          </div>

                          <div style={{...solidCardStyle}}>
                             <h3 style={{ margin: "0 0 15px 0", color: theme.danger, display: "flex", alignItems: "center", gap: "8px" }}><TrendingUp size={20} style={{transform: "scaleY(-1)"}}/> ⚠️ 近期低分預警 (&lt;60分)</h3>
                             {dashboardLowGrades.length > 0 ? (
                                 <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                     {dashboardLowGrades.map((g, idx) => (
                                         <div key={idx} style={{ padding: "12px", background: theme.inputBg, borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                             <div>
                                                 <div style={{ fontSize: "14px", fontWeight: "bold", color: theme.textMain }}>{g.student_name} - {g.subject}</div>
                                                 <div style={{ fontSize: "12px", color: theme.textMuted }}>{g.unit}</div>
                                             </div>
                                             <div style={{ fontSize: "20px", fontWeight: "900", color: theme.danger }}>{g.score}</div>
                                         </div>
                                     ))}
                                 </div>
                             ) : <div style={{ color: theme.textMuted, fontSize: "14px", textAlign: "center", padding: "20px" }}>近期無低分紀錄 🎊</div>}
                          </div>
                      </div>
                  </div>
                )}

                {selectedFeature === 'class' && (
                  <>
                    <form onSubmit={e => handleSubmit(e, "class")} style={solidCardStyle}>
                      <h3 style={{color: theme.textMain, marginBottom: "20px"}}>📚 登記上課進度</h3>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.5fr 2fr 1fr", gap: "15px", marginBottom: "15px" }}>
                        <select value={subject} onChange={e => setSubject(e.target.value)} style={{...selectStyle, margin: 0}}>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select>
                        
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input type="date" value={classDate} onChange={e => setClassDate(e.target.value)} style={{...inputStyle, margin: 0, flex: 1}} />
                          <button type="button" onClick={() => setClassDate(new Date().toISOString().slice(0, 10))} style={{ background: theme.activeControl, color: theme.textMain, border: `1px solid ${theme.border}`, borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", padding: "0 12px", whiteSpace: "nowrap" }}>今天</button>
                          <button type="button" onClick={() => { const d = new Date(); d.setDate(d.getDate()-1); setClassDate(d.toISOString().slice(0, 10)); }} style={{ background: theme.activeControl, color: theme.textMain, border: `1px solid ${theme.border}`, borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", padding: "0 12px", whiteSpace: "nowrap" }}>昨天</button>
                        </div>

                        <div style={{position:"relative"}}><input type="number" step="0.5" placeholder="時數" value={duration} onChange={e => setDuration(e.target.value)} style={{...inputStyle, margin: 0, textAlign: "center"}} /><span style={{position:"absolute", right: 12, top: 14, fontSize:12, color: theme.textMuted}}>hr</span></div>
                      </div>
                      <div style={{position:"relative", marginBottom: "15px"}}><DollarSign size={16} style={{position:"absolute", left:12, top:16, color:theme.danger}}/><input type="number" placeholder="課堂雜費金額 (選填)" value={expense} onChange={e => setExpense(e.target.value)} style={{...inputStyle, paddingLeft: 40, border: `1px solid ${isDarkMode ? 'rgba(248,113,113,0.3)' : '#fecaca'}`}} /></div>
                      
                      <div style={{ marginBottom: "15px" }}>
                         <input type="text" placeholder="📝 輸入本日上課進度詳細描述" value={progress} onChange={e => setProgress(e.target.value)} style={{...inputStyle, margin: 0}} />
                         {lastRecord && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", marginLeft: "5px" }}>
                               <Clock size={14} color={theme.primary} />
                               <span style={{ fontSize: "12px", color: theme.textMuted }}>上次進度：{lastRecord.progress}</span>
                               <button type="button" onClick={() => setProgress(lastRecord.progress)} style={{ background: `${theme.primary}20`, color: theme.primary, border: "none", borderRadius: "6px", padding: "2px 8px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>接續填寫</button>
                            </div>
                         )}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "15px", marginTop: "10px" }}><input type="text" placeholder="🏠 出題回家作業" value={homework} onChange={e => setHomework(e.target.value)} style={inputStyle} /><input type="text" placeholder="💡 給家長或學生的叮嚀備註" value={note} onChange={e => setNote(e.target.value)} style={inputStyle} /></div>
                      <button type="submit" style={btnStyle("#10b981")}>確認儲存紀錄</button>
                    </form>

                    <div style={{ ...solidCardStyle, padding: "12px 20px", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", justifyContent: "space-between", gap: "15px", marginTop: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", width: isMobile ? "100%" : "auto" }}>
                            <Filter size={16} color={theme.textMuted} />
                            <span style={{ fontSize: "14px", color: theme.textMuted, fontWeight: "bold", whiteSpace: "nowrap" }}>篩選：</span>
                            <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)} style={{ ...selectStyle, width: "auto", padding: "6px 12px", margin: 0, background: theme.inputBg, fontSize: "13px", flex: 1 }}>
                                <option value="全部">全部科目顯示</option>
                                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div style={{ position: "relative", width: isMobile ? "100%" : "250px" }}>
                            <Search size={16} color={theme.textMuted} style={{ position: "absolute", left: "12px", top: "10px" }} />
                            <input type="text" placeholder="關鍵字搜尋紀錄..." value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} style={{ ...inputStyle, margin: 0, padding: "8px 12px 8px 36px", fontSize: "13px" }} />
                        </div>
                    </div>
                    <HistoryList data={filteredHistory} type="class" theme={theme} isDarkMode={isDarkMode} onEdit={(item: any) => { setEditingId(item.id); setProgress(item.progress); setClassDate(item.class_date); setSubject(item.subject); setDuration(item.duration); setHomework(item.homework || ""); setNote(item.note || ""); setExpense(item.expense || ""); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onDelete={async (id: number, info: string) => { await supabase.from("class_logs").delete().eq("id", id); fetchHistoryData(); }} />
                  </>
                )}

                {selectedFeature === 'grade' && (
                  <>
                    <form onSubmit={e => handleSubmit(e, "grade")} style={solidCardStyle}>
                      <h3 style={{color: theme.textMain, marginBottom: "20px"}}>📝 輸入考試分數</h3>
                      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "15px", marginBottom: "10px" }}><select value={subject} onChange={e => setSubject(e.target.value)} style={selectStyle}>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select><input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} style={inputStyle} /></div>
                      <input type="text" placeholder="📖 考試範圍 / 單元名稱" value={unit} onChange={e => setUnit(e.target.value)} style={inputStyle} />
                      <input type="number" placeholder="考試得分" value={score} onChange={e => setScore(e.target.value)} style={inputStyle} />
                      <button type="submit" style={btnStyle("#3b82f6")}>儲存成績資料</button>
                    </form>
                    
                    <div style={{ ...solidCardStyle, padding: "12px 20px", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", justifyContent: "space-between", gap: "15px", marginTop: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", width: isMobile ? "100%" : "auto" }}>
                            <Filter size={16} color={theme.textMuted} />
                            <span style={{ fontSize: "14px", color: theme.textMuted, fontWeight: "bold", whiteSpace: "nowrap" }}>篩選：</span>
                            <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)} style={{ ...selectStyle, width: "auto", padding: "6px 12px", margin: 0, background: theme.inputBg, fontSize: "13px", flex: 1 }}>
                                <option value="全部">全部科目顯示</option>
                                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div style={{ position: "relative", width: isMobile ? "100%" : "250px" }}>
                            <Search size={16} color={theme.textMuted} style={{ position: "absolute", left: "12px", top: "10px" }} />
                            <input type="text" placeholder="關鍵字搜尋紀錄..." value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} style={{ ...inputStyle, margin: 0, padding: "8px 12px 8px 36px", fontSize: "13px" }} />
                        </div>
                    </div>
                    <HistoryList data={filteredHistory} type="grade" theme={theme} isDarkMode={isDarkMode} onEdit={(item: any) => { setEditingId(item.id); setScore(item.score); setExamDate(item.exam_date); setSubject(item.subject); setUnit(item.unit || ""); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onDelete={async (id: number, info: string) => { await supabase.from("grades").delete().eq("id", id); fetchHistoryData(); }} />
                  </>
                )}

                {selectedFeature === 'point' && (
                  <>
                    <form onSubmit={e => handleSubmit(e, "point")} style={solidCardStyle}>
                      <h3 style={{color: theme.textMain, marginBottom: "20px"}}>💎 獎勵與扣除點數</h3>
                      <input type="number" placeholder="輸入增減點數 (加點輸入正數，扣點輸入負數，如: -5)" value={points} onChange={e => setPoints(e.target.value)} style={inputStyle} /><input type="text" placeholder="增減點數的原因註記" value={reason} onChange={e => setReason(e.target.value)} style={inputStyle} />
                      <button type="submit" style={btnStyle("#f59e0b")}>確認發放點數</button>
                    </form>
                    
                    <div style={{ ...solidCardStyle, padding: "12px 20px", display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                        <div style={{ position: "relative", width: isMobile ? "100%" : "250px" }}>
                            <Search size={16} color={theme.textMuted} style={{ position: "absolute", left: "12px", top: "10px" }} />
                            <input type="text" placeholder="關鍵字搜尋紀錄..." value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} style={{ ...inputStyle, margin: 0, padding: "8px 12px 8px 36px", fontSize: "13px" }} />
                        </div>
                    </div>
                    <HistoryList data={filteredHistory} type="point" theme={theme} isDarkMode={isDarkMode} onEdit={(item: any) => { setEditingId(item.id); setPoints(item.points); setReason(item.reason); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onDelete={async (id: number, info: string) => { await supabase.from("point_logs").delete().eq("id", id); fetchHistoryData(); }} />
                  </>
                )}

                {/* ★ 點數商品管理區塊 */}
                {selectedFeature === 'reward' && (
                  <div style={{ animation: "fadeIn 0.4s ease" }}>
                      <form onSubmit={handleAddReward} style={solidCardStyle}>
                          <h3 style={{color: theme.textMain, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px"}}><Plus size={20}/> 🎁 上架新點數商品</h3>
                          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: "15px", marginBottom: "15px" }}>
                              <input type="text" placeholder="商品名稱 (例: 免寫作業券、便利商店飲料)" value={rewardTitle} onChange={e => setRewardTitle(e.target.value)} style={{...inputStyle, margin: 0}} />
                              <div style={{position:"relative"}}>
                                  <input type="number" placeholder="所需點數" value={rewardPoints} onChange={e => setRewardPoints(e.target.value)} style={{...inputStyle, margin: 0, paddingRight: "40px"}} />
                                  <span style={{position:"absolute", right: 15, top: 12, fontSize: 13, color: theme.textMuted}}>點</span>
                              </div>
                          </div>
                          <input type="text" placeholder="📝 商品備註說明 (選填，例如：限兌換一次)" value={rewardDesc} onChange={e => setRewardDesc(e.target.value)} style={{...inputStyle, marginBottom: "15px"}} />
                          <button type="submit" disabled={loading} style={btnStyle("#14b8a6")}>確認上架商品</button>
                      </form>

                      <div style={{ ...solidCardStyle, padding: "20px" }}>
                          <h3 style={{color: theme.textMain, margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px"}}><ShoppingBag size={20}/> 🛒 目前架上與歷史商品</h3>
                          
                          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "15px" }}>
                              {rewards.map(r => (
                                  <div key={r.id} style={{ background: theme.inputBg, padding: "18px", borderRadius: "16px", border: `1px solid ${theme.border}`, opacity: r.is_active ? 1 : 0.6, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                      <div>
                                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                              <div style={{ fontWeight: "900", color: theme.textMain, fontSize: "16px", lineHeight: "1.4" }}>{r.title}</div>
                                              <span style={{ background: `${theme.primary}20`, color: theme.primary, padding: "4px 10px", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", whiteSpace: "nowrap" }}>💎 {r.points_required} 點</span>
                                          </div>
                                          {r.description && <div style={{ fontSize: "13px", color: theme.textMuted, lineHeight: "1.5", marginBottom: "15px" }}>{r.description}</div>}
                                      </div>
                                      
                                      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "15px", paddingTop: "15px", borderTop: `1px dashed ${theme.border}` }}>
                                          <button onClick={() => handleToggleReward(r.id, r.is_active)} style={{ background: r.is_active ? "transparent" : theme.success, color: r.is_active ? theme.textMuted : "#fff", border: `1px solid ${r.is_active ? theme.border : theme.success}`, padding: "6px 12px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: "bold" }}>
                                              {r.is_active ? "隱藏下架" : "重新上架"}
                                          </button>
                                          
                                          {confirmRewardId === r.id ? (
                                              <div style={{ display: "flex", gap: "6px" }}>
                                                  <button onClick={() => { handleDeleteReward(r.id); setConfirmRewardId(null); }} style={{ background: theme.danger, color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: "bold" }}>確定刪除</button>
                                                  <button onClick={() => setConfirmRewardId(null)} style={{ background: theme.card, color: theme.textMain, border: `1px solid ${theme.border}`, padding: "6px 12px", borderRadius: "8px", fontSize: "12px", cursor: "pointer" }}>取消</button>
                                              </div>
                                          ) : (
                                              <button onClick={() => setConfirmRewardId(r.id)} style={{ background: `${theme.danger}15`, color: theme.danger, border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center" }}><Trash2 size={16}/></button>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                          {rewards.length === 0 && <div style={{ textAlign: "center", color: theme.textMuted, padding: "30px", border: `1px dashed ${theme.border}`, borderRadius: "16px" }}>目前沒有設定任何點數商品</div>}
                      </div>
                  </div>
                )}

                {selectedFeature === 'calendar' && (
                  <div>
                    <form onSubmit={handleAddEvent} style={solidCardStyle}>
                        <h3 style={{color: theme.textMain, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px"}}>
                            {editingEventId ? <Pencil size={20} color={theme.primary} /> : <Plus size={20} />} 
                            {editingEventId ? "編輯日程事件" : "發布日程事件"}
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                            <div><label style={{fontSize:"11px", color:theme.textMuted}}>開始日期</label><input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} style={inputStyle} /></div>
                            <div><label style={{fontSize:"11px", color:theme.textMuted}}>結束日期 (單次跨日適用)</label><input type="date" value={evEndDate} onChange={e => setEvEndDate(e.target.value)} style={inputStyle} /></div>
                        </div>
                        
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "15px", marginBottom: "15px", background: theme.inputBg, padding: "15px", borderRadius: "14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <input type="checkbox" id="is_rec" checked={evIsRecurring} onChange={e => setEvIsRecurring(e.target.checked)} style={{ width: "18px", height: "18px" }} />
                                <label htmlFor="is_rec" style={{ fontWeight: "bold", fontSize: "14px", cursor: "pointer" }}>🔄 設定為每週重複</label>
                            </div>
                            {evIsRecurring && (
                                <div><label style={{fontSize:"11px", color:theme.textMuted}}>重複截止日期</label><input type="date" value={evRecurringEndDate} onChange={e => setEvRecurringEndDate(e.target.value)} style={inputStyle} /></div>
                            )}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px", background: theme.inputBg, padding: "15px", borderRadius: "14px" }}>
                            <div><label style={{fontSize:"12px", fontWeight: "bold", color:theme.primary}}>⏰ 開始時間</label><input type="time" value={evStartTime} onChange={e => setEvStartTime(e.target.value)} style={inputStyle} /></div>
                            <div><label style={{fontSize:"12px", fontWeight: "bold", color:theme.primary}}>⏰ 結束時間</label><input type="time" value={evEndTime} onChange={e => setEvEndTime(e.target.value)} style={inputStyle} /></div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                            <select value={evType} onChange={e => setEvType(e.target.value)} style={inputStyle}>
                                <option value="class">📖 補習常態 / 課表</option>
                                <option value="exam">🏆 學校段考日程</option>
                                <option value="cancellation">❌ 停課 / 請假 (該日變色隱藏)</option>
                                <option value="activity">🎈 其他活動安排</option>
                            </select>
                            <select value={evStudent} onChange={e => setEvStudent(e.target.value)} style={inputStyle}>
                                <option value="全體">指定對象：全體學生</option>
                                {studentList.map(s => <option key={s.id} value={s.name}>指定對象：{s.name}</option>)}
                            </select>
                        </div>
                        <input type="text" placeholder="活動名稱 (例: 數學常態複習課、英文第二次段考)" value={evTitle} onChange={e => setEvTitle(e.target.value)} style={inputStyle} />
                        
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button type="submit" disabled={loading} style={{...btnStyle(editingEventId ? theme.success : theme.primary), flex: 1}}>
                                {editingEventId ? "儲存修改" : "發布事件"}
                            </button>
                            {editingEventId && (
                                <button type="button" onClick={resetEventForm} style={{...btnStyle(theme.textMuted), flex: 1}}>取消編輯</button>
                            )}
                        </div>
                    </form>

                    <div style={{ ...solidCardStyle, padding: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "900", display: "flex", alignItems: "center", gap: "8px", color: theme.textMain }}>
                              <CalendarIcon size={20} color={theme.primary} /> 🗓️ 總覽行事曆 (管理端)
                          </h3>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ fontWeight: "bold", fontSize: "15px" }}>{calYear} 年 {calMonth + 1} 月</span>
                              <div style={{ display: "flex", gap: "5px" }}>
                                  <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else { setCalMonth(calMonth - 1); } }} style={{ background: theme.inputBg, border: "none", padding: "6px 10px", borderRadius: "8px", color: theme.textMain, cursor: "pointer" }}><ChevronLeft size={16} /></button>
                                  <button onClick={() => { setCalYear(new Date().getFullYear()); setCalMonth(new Date().getMonth()); }} style={{ background: theme.inputBg, border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", color: theme.textMain, fontWeight: "bold", cursor: "pointer" }}>今天</button>
                                  <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else { setCalMonth(calMonth + 1); } }} style={{ background: theme.inputBg, border: "none", padding: "6px 10px", borderRadius: "8px", color: theme.textMain, cursor: "pointer" }}><ChevronRight size={16} /></button>
                              </div>
                          </div>
                      </div>

                      <div style={isMobile ? { overflowX: "auto", paddingBottom: "10px", WebkitOverflowScrolling: "touch" } : {}}>
                        <div style={isMobile ? { minWidth: "650px" } : {}}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", textAlign: "center", marginBottom: "10px", fontWeight: "bold", fontSize: "12px", color: theme.textMuted }}>
                              {WEEK_DAYS.map(d => <div key={d}>{d}</div>)}
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "6px" }}>
                              {calendarCells.map((day: any, idx: number) => {
                                  if (day === null) return <div key={`b-${idx}`} style={{ minHeight: "85px" }} />;
                                  const mStr = String(calMonth + 1).padStart(2, '0');
                                  const dStr = String(day).padStart(2, '0');
                                  const dateKey = `${calYear}-${mStr}-${dStr}`;
                                  const dayEvents = getEventsForDate(dateKey);
                                  const isToday = new Date().toISOString().slice(0, 10) === dateKey;

                                  return (
                                      <div key={dateKey} style={{ minHeight: "85px", background: theme.inputBg, borderRadius: "12px", padding: "6px", display: "flex", flexDirection: "column", gap: "4px", border: isToday ? `2px solid ${theme.primary}` : `1px solid ${theme.border}` }}>
                                          <div style={{ display: "flex", justifyContent: "center" }}>
                                              <span style={{ fontSize: "11px", fontWeight: "bold", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: isToday ? theme.primary : "transparent", color: isToday ? "#ffffff" : theme.textMain }}>{day}</span>
                                          </div>
                                          <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
                                              {dayEvents.map((ev, eIdx) => {
                                                  const itemColor = getEventColor(ev);
                                                  const timeLabel = ev.start_time ? `${ev.start_time} ` : "";
                                                  return (
                                                      <div key={eIdx} style={{ fontSize: "9px", padding: "2px 4px", borderRadius: "4px", background: itemColor, color: (ev.isCancelled || ev.type === 'cancellation') ? theme.textMuted : "#ffffff", textDecoration: (ev.isCancelled || ev.type === 'cancellation') ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                          {ev.student_name === "全體" ? "" : `[${ev.student_name}]`}{timeLabel}{ev.type === 'cancellation' ? "❌停課" : ev.title}
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

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
                      {calendarEvents.map(ev => (
                          <div key={ev.id} style={{ ...solidCardStyle, padding: "18px", marginBottom: 0, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: `6px solid ${getEventColor(ev)}` }}>
                              <div style={{ width: "100%" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                                      <div>
                                          <div style={{fontSize: "12px", color: theme.textMuted}}>
                                            {ev.event_date}{ev.end_date && ev.end_date !== ev.event_date ? ` ~ ${ev.end_date}` : ""} 
                                            {ev.start_time && ` (${ev.start_time} ~ ${ev.end_time || ""})`} · 對象：{ev.student_name} {ev.is_recurring ? "🔄 每週重複" : ""}
                                          </div>
                                          <div style={{fontWeight: "900", fontSize: "17px", color: theme.textMain, marginTop: "4px"}}>{ev.type === 'cancellation' ? `❌【停課通知】${ev.title}` : ev.title}</div>
                                      </div>
                                      
                                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                          {confirmEvId === ev.id ? (
                                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                  <button onClick={async () => { await supabase.from("calendar_events").delete().eq("id", ev.id); fetchCalendar(); setConfirmEvId(null); }} style={{ background: theme.danger, color: "#fff", border: "none", padding: "8px 12px", borderRadius: "10px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>確定刪除</button>
                                                  <button onClick={() => setConfirmEvId(null)} style={{ background: theme.inputBg, color: theme.textMain, border: `1px solid ${theme.border}`, padding: "8px 12px", borderRadius: "10px", cursor: "pointer", fontSize: "12px" }}>取消</button>
                                              </div>
                                          ) : (
                                              <>
                                                  <button onClick={() => handleEditEventClick(ev)} style={{ background: `${theme.primary}15`, color: theme.primary, border: "none", padding: "10px", borderRadius: "10px", cursor: "pointer", height: "40px" }}><Pencil size={20}/></button>
                                                  <button onClick={() => setConfirmEvId(ev.id)} style={{ background: `${theme.danger}15`, color: theme.danger, border: "none", padding: "10px", borderRadius: "10px", cursor: "pointer", height: "40px" }}><Trash2 size={20}/></button>
                                              </>
                                          )}
                                      </div>

                                  </div>
                                  
                                  {ev.is_recurring && (
                                      <div style={{ marginTop: "15px", background: theme.inputBg, padding: "12px", borderRadius: "12px", border: `1px dashed ${theme.border}` }}>
                                          <div style={{ fontSize: "12px", color: theme.textMuted, marginBottom: "8px", fontWeight: "bold" }}>⚙️ 單堂停課 / 請假管理 (僅於該日排除此課程)</div>
                                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                              <input type="date" id={`cancel-date-${ev.id}`} style={{ ...inputStyle, padding: "6px 12px", margin: 0, width: "auto", fontSize: "13px" }} />
                                              <button onClick={() => {
                                                  const dateInput = document.getElementById(`cancel-date-${ev.id}`) as HTMLInputElement;
                                                  if(!dateInput.value) return alert("請先選擇要排除的日期！");
                                                  handleCancelSingleEvent(ev, dateInput.value);
                                                  dateInput.value = "";
                                              }} style={{ background: theme.danger, color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: "bold", whiteSpace: "nowrap" }}>排除此日</button>
                                          </div>
                                          {ev.cancelled_dates && ev.cancelled_dates.length > 0 && (
                                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                                                  {ev.cancelled_dates.map((cDate: string) => (
                                                      <span key={cDate} style={{ background: "rgba(248,113,113,0.15)", color: theme.danger, padding: "4px 10px", borderRadius: "8px", fontSize: "11px", display: "flex", alignItems: "center", gap: "6px", fontWeight: "bold" }}>
                                                          ❌ {cDate} 
                                                          <button onClick={() => handleRestoreSingleEvent(ev, cDate)} style={{ background: "transparent", border: "none", cursor: "pointer", color: theme.danger, padding: 0, display: "flex" }} title="取消排除，恢復上課"><X size={14} /></button>
                                                      </span>
                                                  ))}
                                              </div>
                                          )}
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedFeature === 'tuition' && (
                  <>
                    <div style={solidCardStyle}>
                      <h3 style={{color: theme.textMain, marginBottom: "20px"}}>💰 月底學費結算與明細生成</h3>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}><input type="month" value={tuitionMonth} onChange={e => setTuitionMonth(e.target.value)} style={{...inputStyle, width: "auto", flex: 1, minWidth: "140px"}} /><button onClick={handleTuitionCheck} style={{...btnStyle(theme.danger), width: "auto", marginTop: 0, padding: "12px 24px", whiteSpace: "nowrap"}}>核算學費</button><button onClick={generateBillingText} style={{...btnStyle("#6366f1"), width: "auto", marginTop: 0, padding: "12px 24px", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap"}}><FileText size={18} /> 生成複製明細</button></div>
                      {billingText && (
                        <div style={{ marginTop: "25px", position: "relative", animation: "fadeIn 0.3s ease" }}>
                          <label style={{fontWeight: "bold", color: "#6366f1", marginBottom: "8px", display: "block"}}>👇 點擊右側按鈕一鍵複製文字傳給家長：</label>
                          <textarea value={billingText} onChange={(e) => setBillingText(e.target.value)} style={{ width: "100%", height: "220px", padding: "18px", borderRadius: "16px", border: `2px solid ${isDarkMode ? "#4338ca" : "#6366f1"}`, fontSize: "14px", fontFamily: "monospace", resize: "none", background: isDarkMode ? "#1e1b4b" : "#f5f3ff", color: theme.textMain, lineHeight: "1.6" }} />
                          <button onClick={copyToClipboard} style={{ position: "absolute", top: "40px", right: "12px", background: isCopied ? theme.success : theme.card, color: isCopied ? "white" : theme.textMain, border: `1px solid ${theme.border}`, padding: "8px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", transition: "0.2s", boxShadow: theme.shadow }}>{isCopied ? <Check size={14}/> : <Copy size={14}/>} {isCopied ? "已複製" : "複製文字"}</button>
                        </div>
                      )}
                      {tuitionDetails.length > 0 && (
                        <div style={{ marginTop: "25px", borderTop: `2px dashed ${theme.border}`, paddingTop: "20px" }}>
                          {tuitionDetails.map(t => (
                            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "15px", background: theme.inputBg, borderRadius: "14px", marginBottom: "10px", border: `1px solid ${theme.border}` }}>
                              <div><div style={{fontWeight: "900", fontSize: "15px", color: theme.textMain}}>{t.class_date} <span style={{fontSize: "12px", color: theme.textMuted, fontWeight: "normal"}}>({t.subject})</span></div><div style={{fontSize: "13px", color: theme.textMuted, marginTop: "4px"}}>{t.duration} hr × ${t.rate}/hr {t.extra > 0 && <span style={{color: theme.danger, fontWeight: "bold"}}> + 雜費 {t.extra}</span>}</div></div>
                              <span style={{ fontWeight: "900", color: theme.danger, display: "flex", alignItems: "center", fontSize: "18px" }}>${t.total}</span>
                            </div>
                          ))}
                          <div style={{ textAlign: "right", fontSize: "28px", fontWeight: "900", marginTop: "20px", color: theme.danger, borderTop: `2px solid ${theme.border}`, paddingTop: "15px" }}>本月學費總計：${tuitionDetails.reduce((a,b)=>a+b.total,0).toLocaleString()} 元</div>
                        </div>
                      )}
                    </div>

                    <div style={{ ...solidCardStyle, marginTop: "25px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 style={{color: theme.textMain, margin: 0}}>⚙️ 客製化各學科時薪設定</h3>
                        <button onClick={handleSaveAllRates} disabled={loading} style={{ background: theme.primary, color: "#fff", border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }}>💾 儲存時薪設定</button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                        {SUBJECTS.map(sub => (
                          <div key={`${selectedName}-${sub}`} style={{ display: "flex", alignItems: "center", gap: "10px", background: theme.inputBg, padding: "12px", borderRadius: "12px", border: `1px solid ${theme.border}` }}>
                              <span style={{ fontSize: "14px", fontWeight: "bold", color: theme.textMain, minWidth: "40px" }}>{sub}</span>
                              <input type="number" value={localRates[sub] !== undefined ? localRates[sub] : ''} onChange={e => setLocalRates({...localRates, [sub]: Number(e.target.value)})} placeholder="0" style={{ width: "100%", padding: "8px", borderRadius: "8px", border: `1px solid ${theme.border}`, background: theme.activeControl, color: theme.textMain, textAlign: "center" }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {selectedFeature === 'report' && (
                  <div style={solidCardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}><h3 style={{color: theme.textMain, margin: 0, fontWeight: "900"}}>📊 單科成績分析走勢圖</h3>{gradeFilter && <div style={{ fontSize: "14px", fontWeight: "bold", color: theme.textMain, background: theme.inputBg, border: `1px solid ${theme.border}`, padding: "8px 16px", borderRadius: "20px", boxShadow: theme.shadow }}>{gradeFilter}平均：<span style={{ color: COLORS[gradeFilter] || theme.primary, fontSize: "18px" }}>{currentAvgNum}</span> 分</div>}</div>
                    <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "15px", marginBottom: "15px" }}>{availableSubjects.map((sub: any) => <button key={sub} onClick={() => setGradeFilter(sub)} style={filterBtnStyle(gradeFilter === sub, COLORS[sub])}>{sub}</button>)}</div>
                    {currentChartDataArr.length > 0 ? (
                      <>
                        <div style={{ height: "320px", marginBottom: "20px" }}><ResponsiveContainer width="100%" height="100%"><LineChart data={currentChartDataArr}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} /><XAxis dataKey="date" stroke={theme.border} tick={{fill: theme.textMuted, fontSize: 12}} /><YAxis domain={[0, 100]} stroke={theme.border} tick={{fill: theme.textMuted, fontSize: 12}} /><Tooltip contentStyle={{backgroundColor: theme.activeControl, borderColor: theme.border, color: theme.textMain, borderRadius: "12px"}} /><Legend /><Line type="monotone" dataKey="score" name={gradeFilter} stroke={COLORS[gradeFilter] || theme.primary} strokeWidth={4} dot={{ r: 6, fill: theme.activeControl, strokeWidth: 3 }} /></LineChart></ResponsiveContainer></div>
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: "15px" }}>
                            {chartData.filter((g: any) => g.subject === gradeFilter).map((g: any) => (
                                <div key={g.id} style={{ background: theme.inputBg, padding: "20px", borderRadius: "16px", border: `1px solid ${theme.border}`, borderTop: `4px solid ${COLORS[g.subject] || theme.primary}`, textAlign: "center", boxShadow: theme.shadow }}>
                                    <div style={{ fontSize: "12px", color: theme.textMuted, marginBottom: "8px" }}>{g.exam_date}</div>
                                    <div style={{ fontSize: "15px", fontWeight: "bold", color: theme.textMain }}>{g.subject}</div>
                                    <div style={{ fontSize: "32px", fontWeight: "900", margin: "10px 0", color: g.score >= 60 ? (COLORS[g.subject] || theme.primary) : theme.danger }}>{g.score}</div>
                                    <div style={{ fontSize: "12px", color: theme.textMuted }}>{g.unit}</div>
                                </div>
                            ))}
                        </div>
                      </>
                    ) : <div style={{ height: "180px", display: "flex", alignItems: "center", justifyContent: "center", color: theme.textMuted, border: `1px dashed ${theme.border}`, borderRadius: "20px" }}>尚無足夠的考試紀錄</div>}
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* ======================= 【設定管理 (Settings)】 ======================= */}
        {mainTab === "settings" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "900", color: theme.textMain, marginBottom: "20px" }}>⚙️ 系統設定與名單管理</h2>

            <form onSubmit={handleSaveStudent} style={{...solidCardStyle, position: "relative"}}>
              {editingStudentId && <button onClick={resetStudentForm} style={{position:"absolute", right:15, top:15, background:"none", border:"none", color:theme.textMuted, cursor:"pointer"}}><X size={20}/></button>}
              <h3 style={{color: theme.textMain, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px"}}>{editingStudentId ? <Pencil size={20} color={theme.primary}/> : <UserPlus size={20}/>} {editingStudentId ? "編輯學生帳號資料" : "註冊全新學生帳號"}</h3>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div style={{position:"relative"}}><User size={16} style={{position:"absolute", left:12, top:16, color:theme.textMuted}}/><input type="text" placeholder="學生姓名" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} style={{...inputStyle, paddingLeft: "40px"}} /></div>
                <div style={{position:"relative"}}><Lock size={16} style={{position:"absolute", left:12, top:16, color:theme.textMuted}}/><input type="text" placeholder="預設登入密碼" value={newStudentPassword} onChange={e => setNewStudentPassword(e.target.value)} style={{...inputStyle, paddingLeft: "40px"}} /></div>
              </div>
              <div style={{position:"relative", marginBottom: "15px"}}><GraduationCap size={16} style={{position:"absolute", left:12, top:16, color:theme.textMuted}}/><input type="text" placeholder="就讀學校 / 年級" value={newStudentSchool} onChange={e => setNewStudentSchool(e.target.value)} style={{...inputStyle, paddingLeft: "40px"}} /></div>
              <button type="submit" disabled={loading} style={btnStyle(editingStudentId ? theme.success : theme.primary)}>{editingStudentId ? "確認儲存修改" : "完成新增並註冊"}</button>
            </form>

            <h3 style={{color: theme.textMain, margin: "30px 0 15px 10px", display: "flex", alignItems: "center", gap: "10px"}}><Users size={20}/> 學生名單管理</h3>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "15px" }}>
              {studentList.map(s => (
                <div key={s.id} style={{ ...solidCardStyle, padding: "18px", marginBottom: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{fontWeight: "900", fontSize: "17px", color: theme.textMain}}>{s.name}</div><div style={{fontSize: "13px", color: theme.textMuted, marginTop: "4px"}}>{s.school || "未設定學校"}</div><div style={{fontSize: "12px", color: theme.primary, marginTop: "2px"}}>登入密碼: <span style={{letterSpacing: "2px", fontWeight: "bold"}}>****</span></div></div>
                  
                  <div style={{display:"flex", gap: "10px", alignItems: "center"}}>
                    {confirmStudentId === s.id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button onClick={() => { handleDeleteStudent(s.id); setConfirmStudentId(null); }} style={{ background: theme.danger, color: "#fff", border: "none", padding: "8px 12px", borderRadius: "10px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>確定刪除</button>
                            <button onClick={() => setConfirmStudentId(null)} style={{ background: theme.inputBg, color: theme.textMain, border: `1px solid ${theme.border}`, padding: "8px 12px", borderRadius: "10px", cursor: "pointer", fontSize: "12px" }}>取消</button>
                        </div>
                    ) : (
                        <>
                            <button onClick={() => handleEditStudentClick(s)} style={{ background: `${theme.primary}15`, color: theme.primary, border: "none", padding: "10px", borderRadius: "10px", cursor: "pointer", transition: "0.2s" }}><Pencil size={20} /></button>
                            <button onClick={() => setConfirmStudentId(s.id)} style={{ background: `${theme.danger}15`, color: theme.danger, border: "none", padding: "10px", borderRadius: "10px", cursor: "pointer", transition: "0.2s" }}><Trash2 size={20} /></button>
                        </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ ...solidCardStyle, marginTop: "30px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                 <h3 style={{color: theme.textMain, margin: 0}}>💰 客製化各學科時薪設定</h3>
                 <button onClick={handleSaveAllRates} disabled={!selectedName || loading} style={{ background: theme.primary, color: "#fff", border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }}>💾 儲存時薪設定</button>
              </div>
              <label style={{ fontWeight: "900", display: "block", marginBottom: "12px", color: theme.primary, fontSize: "13px" }}>選擇要設定時薪的學生：</label>
              <select value={selectedName} onChange={e => setSelectedName(e.target.value)} style={{ ...selectStyle, marginBottom: "20px", fontWeight: "bold" }}>
                  {studentList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                {SUBJECTS.map(sub => (
                  <div key={`${selectedName}-${sub}`} style={{ display: "flex", alignItems: "center", gap: "10px", background: theme.inputBg, padding: "12px", borderRadius: "12px", border: `1px solid ${theme.border}` }}>
                      <span style={{ fontSize: "14px", fontWeight: "bold", color: theme.textMain, minWidth: "40px" }}>{sub}</span>
                      <input type="number" value={localRates[sub] !== undefined ? localRates[sub] : ''} onChange={e => setLocalRates({...localRates, [sub]: Number(e.target.value)})} placeholder="0" style={{ width: "100%", padding: "8px", borderRadius: "8px", border: `1px solid ${theme.border}`, background: theme.activeControl, color: theme.textMain, textAlign: "center" }} />
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: theme.navBg, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-around", padding: "12px 0 25px 0", zIndex: 100, boxShadow: theme.shadow }}>
         <button onClick={() => { setMainTab("features"); setSelectedFeature(null); }} style={{ flex: 1, background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", color: mainTab === "features" ? theme.primary : theme.textMuted, cursor: "pointer", transition: "0.2s" }}>
             <Home size={26} style={{ marginBottom: "6px", transform: mainTab === "features" ? "scale(1.1)" : "scale(1)" }} />
             <span style={{ fontSize: "12px", fontWeight: mainTab === "features" ? "bold" : "normal" }}>🚀 核心功能</span>
         </button>
         <button onClick={() => setMainTab("settings")} style={{ flex: 1, background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", color: mainTab === "settings" ? theme.primary : theme.textMuted, cursor: "pointer", transition: "0.2s" }}>
             <Settings size={26} style={{ marginBottom: "6px", transform: mainTab === "settings" ? "scale(1.1)" : "scale(1)" }} />
             <span style={{ fontSize: "12px", fontWeight: mainTab === "settings" ? "bold" : "normal" }}>⚙️ 設定管理</span>
         </button>
      </div>
      <style jsx>{` @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } ::-webkit-scrollbar { width: 0px; background: transparent; } `}</style>
    </div>
  );
}

function HistoryList({ data, type, onEdit, onDelete, theme, isDarkMode }: HistoryListProps) {
  const [confirmId, setConfirmId] = useState<number | null>(null);

  return (
    <div style={{ marginTop: "10px" }}>
      {data.length > 0 ? data.map((item) => {
        const infoStr = type === "grade" ? `${item.subject} ${item.score}分` : type === "point" ? `${item.reason} ${item.points}點` : `${item.subject} ${item.progress}`;
        return (
        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: theme.activeControl, padding: "18px", borderRadius: "16px", borderTop: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, borderLeft: `1px solid ${theme.border}`, marginBottom: "12px", boxShadow: theme.shadow }}>
          <div style={{ fontSize: "14px", flex: 1, color: theme.textMain }}>
            {type === "grade" ? (<span>🏷️ <b>{item.subject}</b>: {item.score}分 <span style={{color:theme.textMuted}}>({item.unit})</span> <span style={{color:theme.textMuted, fontSize:"12px"}}>({item.exam_date})</span></span>) 
            : type === "point" ? (<span>💎 {item.reason}: <b style={{color: item.points > 0 ? theme.success : theme.danger, fontSize: "17px"}}>{item.points} 點</b></span>) 
            : (<div><div style={{fontWeight: "bold"}}>📂 {item.subject}: {item.progress} <span style={{color:theme.textMuted, fontWeight: "normal"}}>({item.class_date} | {item.duration} hr)</span></div>{item.expense > 0 && <div style={{fontSize: "13px", color: theme.danger, fontWeight: "900", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px"}}><DollarSign size={14}/> 雜費: {item.expense}</div>}<div style={{ display: "flex", gap: "10px", marginTop: "10px", fontSize: "13px" }}>{item.homework && <span style={{display:"flex", alignItems:"center", gap: 5, background: isDarkMode ? "rgba(56,189,248,0.15)" : "#e0f2fe", padding: "4px 10px", borderRadius: "8px", color: theme.primary, fontWeight: "bold"}}><BookOpen size={14}/> {item.homework}</span>}{item.note && <span style={{display:"flex", alignItems:"center", gap: 5, background: isDarkMode ? "rgba(52,211,153,0.15)" : "#dcfce7", padding: "4px 10px", borderRadius: "8px", color: theme.success, fontWeight: "bold"}}><MessageSquare size={14}/> {item.note}</span>}</div></div>)}
          </div>
          <div style={{ display: "flex", gap: "15px", marginLeft: "15px" }}>
            {confirmId === item.id ? (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button onClick={() => { onDelete(item.id, infoStr); setConfirmId(null); }} style={{ background: theme.danger, color: "#fff", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>確定</button>
                    <button onClick={() => setConfirmId(null)} style={{ background: theme.inputBg, color: theme.textMain, border: `1px solid ${theme.border}`, padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>取消</button>
                </div>
            ) : (
                <>
                    <button onClick={() => onEdit(item)} style={{ border: "none", background: "none", cursor: "pointer", color: theme.primary }}><Pencil size={20} /></button>
                    <button onClick={() => setConfirmId(item.id)} style={{ border: "none", background: "none", cursor: "pointer", color: theme.danger }}><Trash2 size={20} /></button>
                </>
            )}
          </div>
        </div>
      )}) : <p style={{ textAlign: "center", color: theme.textMuted, padding: "30px", border: `1px dashed ${theme.border}`, borderRadius: "20px" }}>目前沒有相關歷史數據紀錄 ✨</p>}
    </div>
  );
}