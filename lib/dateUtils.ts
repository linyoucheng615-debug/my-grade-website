/**
 * 時區與日期處理工具（鎖定 Asia/Taipei UTC+8，杜絕凌晨換日判定為前一天的 Bug）
 */

export const TAIWAN_TIMEZONE = 'Asia/Taipei';

/**
 * 取得今天日期的 YYYY-MM-DD 字串（台灣本地時區）
 */
export function getTodayDateString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TAIWAN_TIMEZONE });
}

/**
 * 取得昨天日期的 YYYY-MM-DD 字串（台灣本地時區）
 */
export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA', { timeZone: TAIWAN_TIMEZONE });
}

/**
 * 取得當前月份的 YYYY-MM 字串（台灣本地時區）
 */
export function getCurrentMonthString(): string {
  const todayStr = getTodayDateString();
  return todayStr.slice(0, 7);
}

/**
 * 將 Date 物件或時間字串安全轉換為 YYYY-MM-DD
 */
export function toDateKey(dateOrStr: Date | string): string {
  if (typeof dateOrStr === 'string') {
    if (dateOrStr.length === 10 && dateOrStr.includes('-')) {
      return dateOrStr;
    }
    const d = new Date(dateOrStr);
    return isNaN(d.getTime()) ? dateOrStr : d.toLocaleDateString('en-CA', { timeZone: TAIWAN_TIMEZONE });
  }
  return dateOrStr.toLocaleDateString('en-CA', { timeZone: TAIWAN_TIMEZONE });
}

/**
 * 格式化顯示時間（例如：2026/09/16 17:30）
 */
export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleString('zh-TW', { timeZone: TAIWAN_TIMEZONE, hour12: false });
}

/**
 * 格式化顯示日期（例如：2026/09/16）
 */
export function formatDate(isoOrDateString?: string | null): string {
  if (!isoOrDateString) return '';
  const d = new Date(isoOrDateString);
  if (isNaN(d.getTime())) return isoOrDateString;
  return d.toLocaleDateString('zh-TW', { timeZone: TAIWAN_TIMEZONE });
}

