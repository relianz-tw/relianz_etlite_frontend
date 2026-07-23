import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 金額格式化：統一加上 $ 與千分位，供各頁面金額顯示使用 */
export const fmtCurrency = (n: number) => `$${n.toLocaleString('en-US')}`;

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
