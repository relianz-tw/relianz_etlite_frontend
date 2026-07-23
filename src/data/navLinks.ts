export interface NavChildLink {
  name: string;
  path: string;
}

export interface NavLink {
  name: string;
  path: string;
  icon?: 'plus';
  children?: NavChildLink[];
}

export const navLinks: NavLink[] = [
  { name: '開立電子發票', path: '/einvoice', icon: 'plus' },
  { name: '帳簿', path: '/ledger' },
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
