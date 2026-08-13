export type NavAction = 'newTransaction';

export interface NavChildLink {
  name: string;
  /** 導覽連結路徑，與 action 二擇一 */
  path?: string;
  /** 點擊時開啟彈窗而非導頁，與 path 二擇一 */
  action?: NavAction;
  icon?: 'plus';
}

export interface NavLink {
  name: string;
  path: string;
  icon?: 'plus';
  children?: NavChildLink[];
}

/** 側欄最上方的捷徑按鈕（跨頁面高頻主要動作），與一般導覽項目分開呈現 */
export const navShortcut = { name: '開立電子發票', path: '/einvoice' };

export const navLinks: NavLink[] = [
  {
    name: '帳簿',
    path: '/ledger',
    children: [
      { name: '新增交易', action: 'newTransaction', icon: 'plus' },
      { name: '帳簿總覽', path: '/ledger' },
      { name: '沖帳中心', path: '/ledger/reconciliation' },
    ],
  },
  { name: '銀行帳戶總覽', path: '/bank-accounts' },
  { name: '營業稅中心', path: '/business-tax' },
  {
    name: '各類扣繳中心',
    path: '/withholding',
    children: [
      { name: '薪資', path: '/withholding/salary' },
      { name: '勞報單', path: '/withholding/labor' },
      { name: '其他扣繳', path: '/withholding/other' },
    ],
  },
  { name: '營所稅中心', path: '/income-tax' },
  { name: '檔案紀錄', path: '/files' },
  { name: '報表中心', path: '/reports' },
  { name: '設定', path: '/settings' },
];
