import type { ReportPageDef } from './types';

/** 09 營利事業投資人明細及分配盈餘表（表格型，逐列新增／刪除） */
export const SHAREHOLDERS_PAGE: ReportPageDef = {
  id: 'shareholders',
  title: '營利事業投資人明細及分配盈餘表',
  hint: '逐位投資人列出出資與分配盈餘明細，欄位為系統示意配置，實際對應表待後端確認後調整。',
  layout: 'table',
  table: {
    addRowLabel: '新增投資人',
    columns: [
      { key: 'investorName', label: '投資人姓名', type: 'text' },
      { key: 'idOrTaxId', label: '統一編號或身分證字號', type: 'text' },
      { key: 'investmentAmount', label: '出資額', type: 'money' },
      { key: 'sharePercentage', label: '持股比例', type: 'text' },
      { key: 'dividendAmount', label: '股利或盈餘分配額', type: 'money' },
      { key: 'withholdingTax', label: '扣繳稅額', type: 'money' },
    ],
  },
};
