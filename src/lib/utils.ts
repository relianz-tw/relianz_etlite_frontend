import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 金額格式化：統一加上 $ 與千分位；負值依會計慣例以括號表示（-3000 → ($3,000)），
 *  不出現 $-3,000 這種錢字號在負號前的排版，供各頁面金額顯示使用 */
export const fmtCurrency = (n: number) => (n < 0 ? `($${Math.abs(n).toLocaleString('en-US')})` : `$${n.toLocaleString('en-US')}`);

/** 後端 YYYYMMDD 或 ISO 日期時間字串轉為民國年 YYY/MM/DD 顯示，與帳簿/沖帳其餘頁面的日期格式一致；
 *  空字串或格式皆不符時原樣回傳 */
export function formatYyyymmddRoc(value: string): string {
  let year: number;
  let month: string;
  let day: string;
  if (/^\d{8}$/.test(value)) {
    year = Number(value.slice(0, 4));
    month = value.slice(4, 6);
    day = value.slice(6, 8);
  } else {
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!isoMatch) return value;
    year = Number(isoMatch[1]);
    [, , month, day] = isoMatch;
  }
  return `${year - 1911}/${month}/${day}`;
}

/**
 * 月份（1-12）→ 營業稅雙月期別代碼（1/3/5/7/9/11），如 1-2 月為 1、3-4 月為 3……。
 * 統一供所有需要帶入「期別」查詢參數的 API 使用（如 GET /ael/invoice/trackRule 的 phase）。
 */
export function monthToBimonthlyPhase(month: number): number {
  return month % 2 === 0 ? month - 1 : month;
}

/** 純數字千分位格式化，不加 $ 也不用括號表負值；供繳款書等公文格式文件顯示金額使用（與 fmtCurrency 不同用途） */
export function formatTWD(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString('zh-TW');
}

/** 將 Date 物件格式化為 YYYY-MM-DD（本地時區），供 onboarding 薪資試算的給薪日期預設值等使用 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
