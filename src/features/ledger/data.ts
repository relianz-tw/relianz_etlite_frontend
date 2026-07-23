import { generateDailyTrend } from '@/lib/utils';
import type { AllowanceRecord, PurchaseRow, SalesRow } from './types';

export const EXPENSE_CATEGORIES = ['進貨', '文具用品', '修繕費', '雜項購置'];
export const PROJECT_NAMES = ['好長好長的專案名稱', '台北旗艦店擴建', '年度品牌重塑', ''];
export const SALES_CHANNELS = ['現金', '匯票', '國泰信用卡', 'MoMo'];
export const BANK_ACCOUNTS = ['中國信託港墅分行 (822-01256789012)', '國泰世華敦南分行 (013-98765432101)', '現金'];

const TREND_END_DATE = '2026/03/27'; // 對齊既有假資料中最新的交易日期，趨勢圖固定顯示兩個月（62 天）每日金額

export const SALES_DAILY = generateDailyTrend(0, 16000000, 0.9, TREND_END_DATE);
export const PURCHASE_DAILY = generateDailyTrend(3, 14000000, 0.8, TREND_END_DATE);

const SPLIT_CHILDREN = [
  { id: 'S26XH743195003', amount: 500, date: '115/03/26' },
  { id: 'S26XH743195002', amount: 2000, date: '115/03/29' },
  { id: '可折讓餘額（含稅）', label: '可折讓餘額（含稅）', amount: 7500 },
];

const UA40435903_ALLOWANCES: AllowanceRecord[] = [
  { id: 'ALW-UA40435903-01', date: '115/03/28', amount: 500, note: '出貨數量認列錯誤，折讓部分金額' },
  { id: 'ALW-UA40435903-02', date: '115/04/02', amount: 1500, note: '客戶議價後補開折讓' },
  { id: 'ALW-UA40435903-03', date: '115/04/10', amount: 800, note: '瑕疵品部分金額折讓' },
];

export const SALES_RECEIVED: SalesRow[] = [
  { id: 'UA40435900', amount: 999500999, counterparty: '友信創新股份有限公司', date: '115/03/22', channel: '現金', voided: false, allowances: [] },
  { id: 'UA40435901', amount: 6800, counterparty: '台積開發股份有限公司', date: '115/03/23', channel: '匯票', voided: false, allowances: [] },
  { id: 'UA40435902', amount: 999500999, counterparty: '我的另一間公司', date: '115/03/25', channel: '匯票', voided: false, allowances: [] },
  { id: 'UA40435903', amount: 10000, counterparty: '名子很長很長很長很長股份有限公司', date: '115/03/26', channel: '國泰信用卡', voided: false, allowances: UA40435903_ALLOWANCES, children: SPLIT_CHILDREN },
  { id: 'UA40435904', amount: 128000, counterparty: '長榮海運股份有限公司', date: '115/03/27', channel: 'MoMo', voided: true, allowances: [] },
];

export const SALES_RECEIVABLE: SalesRow[] = [
  { id: 'UA40435900', amount: 999500999, counterparty: '友信創新股份有限公司', date: '115/03/22', channel: '', voided: false, allowances: [] },
  { id: 'UA40435901', amount: 6800, counterparty: '台積開發股份有限公司', date: '115/03/23', channel: '', voided: false, allowances: [] },
  { id: 'UA40435902', amount: 999500999, counterparty: '我的另一間公司', date: '115/03/25', channel: '', voided: false, allowances: [] },
  { id: 'UA40435903', amount: 10000, counterparty: '名子很長很長很長很長股份有限公司', date: '115/03/26', channel: '', voided: false, allowances: UA40435903_ALLOWANCES, children: SPLIT_CHILDREN },
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
