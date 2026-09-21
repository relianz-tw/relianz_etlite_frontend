import type { ReportPageDef } from './types';

/** 08 年度各類給付扣繳、股利憑單金額與申報金額調節表（各類所得 × 憑單/帳列/差異三欄） */
export const WITHHOLDING_RECONCILIATION_PAGE: ReportPageDef = {
  id: 'withholdingReconciliation',
  title: '年度各類給付扣繳、股利憑單金額與申報金額調節表',
  hint: '各類所得的憑單金額與帳列金額若有差異請填入差異欄，欄位為系統示意配置，實際對應表待後端確認後調整。',
  layout: 'twoColumn',
  left: {
    sections: [
      {
        title: '薪資所得',
        fields: [
          { key: 'salaryVoucherAmount', label: '憑單金額', type: 'money' },
          { key: 'salaryBookAmount', label: '帳列金額', type: 'money' },
          { key: 'salaryDiffAmount', label: '差異', type: 'money', allowSign: true },
        ],
      },
      {
        title: '租金所得',
        fields: [
          { key: 'rentVoucherAmount', label: '憑單金額', type: 'money' },
          { key: 'rentBookAmount', label: '帳列金額', type: 'money' },
          { key: 'rentDiffAmount', label: '差異', type: 'money', allowSign: true },
        ],
      },
      {
        title: '權利金所得',
        fields: [
          { key: 'royaltyVoucherAmount', label: '憑單金額', type: 'money' },
          { key: 'royaltyBookAmount', label: '帳列金額', type: 'money' },
          { key: 'royaltyDiffAmount', label: '差異', type: 'money', allowSign: true },
        ],
      },
      {
        title: '執行業務所得',
        fields: [
          { key: 'professionalVoucherAmount', label: '憑單金額', type: 'money' },
          { key: 'professionalBookAmount', label: '帳列金額', type: 'money' },
          { key: 'professionalDiffAmount', label: '差異', type: 'money', allowSign: true },
        ],
      },
    ],
  },
  right: {
    sections: [
      {
        title: '利息所得',
        fields: [
          { key: 'interestVoucherAmount', label: '憑單金額', type: 'money' },
          { key: 'interestBookAmount', label: '帳列金額', type: 'money' },
          { key: 'interestDiffAmount', label: '差異', type: 'money', allowSign: true },
        ],
      },
      {
        title: '股利所得',
        fields: [
          { key: 'dividendVoucherAmount', label: '憑單金額', type: 'money' },
          { key: 'dividendBookAmount', label: '帳列金額', type: 'money' },
          { key: 'dividendDiffAmount', label: '差異', type: 'money', allowSign: true },
        ],
      },
      {
        title: '其他所得',
        fields: [
          { key: 'otherVoucherAmount', label: '憑單金額', type: 'money' },
          { key: 'otherBookAmount', label: '帳列金額', type: 'money' },
          { key: 'otherDiffAmount', label: '差異', type: 'money', allowSign: true },
        ],
      },
      {
        title: '合計',
        fields: [
          { key: 'totalVoucherAmount', label: '憑單金額合計', type: 'money', emphasize: true },
          { key: 'totalBookAmount', label: '帳列金額合計', type: 'money', emphasize: true },
          { key: 'totalDiffAmount', label: '差異合計', type: 'money', allowSign: true, emphasize: true },
        ],
      },
    ],
  },
};
