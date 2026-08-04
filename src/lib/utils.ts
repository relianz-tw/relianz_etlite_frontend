import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 金額格式化：統一加上 $ 與千分位，供各頁面金額顯示使用 */
export const fmtCurrency = (n: number) => `$${n.toLocaleString('en-US')}`;

/** 後端 YYYYMMDD 字串轉為 YYYY/MM/DD 顯示；空字串或格式不符時原樣回傳 */
export function formatYyyymmdd(value: string): string {
  if (!/^\d{8}$/.test(value)) return value;
  return `${value.slice(0, 4)}/${value.slice(4, 6)}/${value.slice(6, 8)}`;
}

/** 回傳今天日期的 YYYYMMDD 字串，供需要送出此格式的 API（如銀行帳戶餘額更新日）使用 */
export function todayYyyymmdd(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

const CHINESE_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

/** 阿拉伯數字（1-99）轉中文數字，供帳戶等列表的流水號大標題（帳戶一、帳戶二…）使用 */
export function numberToChineseNumeral(n: number): string {
  if (n <= 0) return String(n);
  if (n < 10) return CHINESE_DIGITS[n];
  if (n < 20) return `十${n === 10 ? '' : CHINESE_DIGITS[n - 10]}`;
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return `${CHINESE_DIGITS[tens]}十${ones === 0 ? '' : CHINESE_DIGITS[ones]}`;
  }
  return String(n);
}

/** 表格可排序表頭的排序方向；'none' 代表未排序（維持原始順序） */
export type SortDir = 'asc' | 'desc' | 'none';

/**
 * 依 keyFn 取出的值對陣列排序，供帳簿／營業稅中心表格與手機卡片共用。
 * dir 為 'none' 時回傳原陣列（不排序）；數值依大小排序，字串依 localeCompare 排序
 * （民國年 YYY/MM/DD 零補位日期字串本身即符合時間序，無需轉 Date）。
 */
export function sortRows<T>(rows: T[], keyFn: (row: T) => string | number, dir: SortDir): T[] {
  if (dir === 'none') return rows;
  const sign = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = keyFn(a);
    const vb = keyFn(b);
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sign;
    return String(va).localeCompare(String(vb)) * sign;
  });
}

export interface DailyPoint {
  date: string; // 'M/D'
  value: number;
}

/** 產生固定天數的每日金額假資料，供各頁面趨勢圖卡片使用（週末金額較低、每 5 天一個波峰模擬營業週期） */
export function generateDailyTrend(seedOffset: number, base: number, volatility: number, endDate: string, days = 62): DailyPoint[] {
  const end = new Date(endDate);
  const points: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const wave = Math.sin((i + seedOffset) / 5) * 0.5 + 0.5;
    const value = Math.round(base * (isWeekend ? 0.45 : 1) * (0.5 + wave * volatility));
    points.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, value });
  }
  return points;
}
