import type { PurchaseRow, SalesRow } from './types';

export const EXPENSE_CATEGORIES = ['進貨', '文具用品', '修繕費', '雜項購置'];
export const PROJECT_NAMES = ['好長好長的專案名稱', '台北旗艦店擴建', '年度品牌重塑', ''];
export const SALES_CHANNELS = ['現金', '匯票', '國泰信用卡', 'MoMo'];
export const BANK_ACCOUNTS = ['中國信託港墅分行 (822-01256789012)', '國泰世華敦南分行 (013-98765432101)', '現金'];

export const fmtCurrency = (n: number) => `$${n.toLocaleString('en-US')}`;

export interface DailyPoint {
  date: string; // 'M/D'
  value: number;
}

const TREND_DAYS = 62; // 帳簿趨勢圖固定顯示兩個月（62 天）每日金額
const TREND_END_DATE = '2026/03/27'; // 對齊既有假資料中最新的交易日期

// 產生固定兩個月每日金額的假資料，供帳簿卡片趨勢圖使用（週末金額較低、每 5 天一個波峰模擬營業週期）
function generateDailyTrend(seedOffset: number, base: number, volatility: number): DailyPoint[] {
  const end = new Date(TREND_END_DATE);
  const points: DailyPoint[] = [];
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const wave = Math.sin((i + seedOffset) / 5) * 0.5 + 0.5;
    const value = Math.round(base * (isWeekend ? 0.45 : 1) * (0.5 + wave * volatility));
    points.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, value });
  }
  return points;
}

export const SALES_DAILY: DailyPoint[] = generateDailyTrend(0, 16000000, 0.9);
export const PURCHASE_DAILY: DailyPoint[] = generateDailyTrend(3, 14000000, 0.8);

const SPLIT_CHILDREN = [
  { id: 'S26XH743195003', amount: 500, date: '115/03/26' },
  { id: 'S26XH743195002', amount: 2000, date: '115/03/29' },
  { id: '可折讓餘額（含稅）', label: '可折讓餘額（含稅）', amount: 7500 },
];

export const SALES_RECEIVED: SalesRow[] = [
  { id: 'UA40435900', amount: 999500999, counterparty: '友信創新股份有限公司', date: '115/03/22', channel: '現金', voided: false, allowanceCount: 0 },
  { id: 'UA40435901', amount: 6800, counterparty: '台積開發股份有限公司', date: '115/03/23', channel: '匯票', voided: false, allowanceCount: 0 },
  { id: 'UA40435902', amount: 999500999, counterparty: '我的另一間公司', date: '115/03/25', channel: '匯票', voided: false, allowanceCount: 0 },
  { id: 'UA40435903', amount: 10000, counterparty: '名子很長很長很長很長股份有限公司', date: '115/03/26', channel: '國泰信用卡', voided: false, allowanceCount: 3, children: SPLIT_CHILDREN },
  { id: 'UA40435904', amount: 128000, counterparty: '長榮海運股份有限公司', date: '115/03/27', channel: 'MoMo', voided: true, allowanceCount: 0 },
];

export const SALES_RECEIVABLE: SalesRow[] = [
  { id: 'UA40435900', amount: 999500999, counterparty: '友信創新股份有限公司', date: '115/03/22', channel: '', voided: false, allowanceCount: 0 },
  { id: 'UA40435901', amount: 6800, counterparty: '台積開發股份有限公司', date: '115/03/23', channel: '', voided: false, allowanceCount: 0 },
  { id: 'UA40435902', amount: 999500999, counterparty: '我的另一間公司', date: '115/03/25', channel: '', voided: false, allowanceCount: 0 },
  { id: 'UA40435903', amount: 10000, counterparty: '名子很長很長很長很長股份有限公司', date: '115/03/26', channel: '', voided: false, allowanceCount: 3, children: SPLIT_CHILDREN },
];

export const PURCHASE_PAID: PurchaseRow[] = [
  { id: 'UA40435900', amount: 999500999, party: '友信創新股份有限公司', date: '115/03/22', category: '進貨', project: '好長好長的專案名稱', source: 'invoice' },
  { id: 'UA40435901', amount: 6800, party: '', date: '115/03/23', category: '文具用品', project: '', source: 'invoice' },
  { id: 'UA40435902', amount: 999500999, party: '我的另一間公司', date: '115/03/25', category: '修繕費', project: '', source: 'invoice' },
  { id: 'UA40435903', amount: 10000, party: '名子很長很長很長很長股份有限公司', date: '115/03/26', category: '雜項購置', project: '', source: 'invoice', children: SPLIT_CHILDREN },
];

export const PURCHASE_PAYABLE: PurchaseRow[] = [
  { id: 'UA40435900', amount: 999500999, party: '友信創新股份有限公司', date: '115/03/22', category: '進貨', project: '好長好長的專案名稱', source: 'invoice' },
  { id: 'UA40435901', amount: 6800, party: '', date: '115/03/23', category: '文具用品', project: '', source: 'invoice' },
  { id: 'UA40435902', amount: 999500999, party: '名子很長很長很長很長股份有限公司', date: '115/03/25', category: '修繕費', project: '', source: 'invoice' },
  { id: 'WHT-115-A101', amount: 45000, party: '勞報單 - 王小明', date: '115/03/26', category: '勞務費', project: '', source: 'labor' },
  { id: 'WHT-115-A102', amount: 4500, party: '勞報單 - 陳小柬', date: '115/03/26', category: '代扣稅款', project: '', source: 'labor' },
  { id: 'WHT-115-A103', amount: 350000, party: '薪資 - 2月份', date: '115/03/26', category: '員工薪資', project: '', source: 'salary' },
  { id: 'WHT-115-A104', amount: 50000, party: '薪資 - 2月份', date: '115/03/26', category: '勞健保費', project: '', source: 'salary' },
];
