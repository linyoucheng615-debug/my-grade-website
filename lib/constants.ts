export const SUBJECTS = [
  "國文",
  "英文",
  "數學",
  "理化",
  "生物",
  "地科",
  "歷史",
  "地理",
  "公民",
] as const;

export type SubjectType = typeof SUBJECTS[number];

export const SUBJECT_COLORS: Record<string, string> = {
  "國文": "#ef4444",
  "英文": "#f59e0b",
  "數學": "#10b981",
  "理化": "#3b82f6",
  "生物": "#8b5cf6",
  "地科": "#ec4899",
  "歷史": "#6366f1",
  "地理": "#14b8a6",
  "公民": "#f97316",
};

export const BANK_ACCOUNT = "";

export const WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"] as const;

