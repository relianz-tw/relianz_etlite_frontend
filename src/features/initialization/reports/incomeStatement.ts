import type { ReportPageDef } from './types';

/** 01 損益及稅額計算表（單欄，不涉及借貸平衡檢查） */
export const INCOME_STATEMENT_PAGE: ReportPageDef = {
  id: 'incomeStatement',
  title: '損益及稅額計算表',
  hint: '對應結算申報書 01 表，欄位為系統示意配置，實際對應表待後端確認後調整。',
  layout: 'twoColumn',
  left: {
    sections: [
      {
        title: '營業損益',
        fields: [
          { key: 'netRevenue', label: '營業收入淨額', type: 'money' },
          { key: 'costOfGoodsSold', label: '營業成本', type: 'money' },
          { key: 'grossProfit', label: '營業毛利', type: 'money', emphasize: true },
          { key: 'operatingExpenses', label: '營業費用', type: 'money' },
          { key: 'operatingIncome', label: '營業淨利', type: 'money', allowSign: true, emphasize: true },
        ],
      },
      {
        title: '非營業損益',
        fields: [
          { key: 'nonOperatingIncome', label: '非營業收益', type: 'money' },
          { key: 'nonOperatingLoss', label: '非營業損失', type: 'money' },
        ],
      },
    ],
  },
  right: {
    sections: [
      {
        title: '課稅所得與稅額',
        fields: [
          { key: 'totalIncome', label: '全年所得額', type: 'money', allowSign: true, emphasize: true },
          { key: 'priorLossDeduction', label: '前十年核定虧損本年度扣除額', type: 'money', indent: 1 },
          { key: 'taxableIncome', label: '課稅所得額', type: 'money', allowSign: true, emphasize: true },
          { key: 'taxPayable', label: '應納稅額', type: 'money' },
        ],
      },
      {
        title: '已納稅額與應補（退）稅額',
        fields: [
          { key: 'withholdingTaxCredit', label: '已扣繳稅額', type: 'money', indent: 1 },
          { key: 'provisionalTaxPaid', label: '暫繳稅額', type: 'money', indent: 1 },
          { key: 'taxDueOrRefund', label: '應補（退）稅額', type: 'money', allowSign: true, emphasize: true },
        ],
      },
    ],
  },
};
