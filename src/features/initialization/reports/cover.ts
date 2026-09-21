import type { ReportColumnDef } from './types';

/**
 * 封面頁補充欄位（步驟 3）。
 * 公司名稱／統編／代表人／地址／行業別／開業日期／開帳基準日等核心欄位已有既有表單與驗證邏輯
 * （見 Step3Cover.tsx 沿用 companySchema），此處僅補上結算申報書封面頁才有、目前系統其餘功能
 * 尚未用到的欄位，故用通用 ReportField 存放，不逐一在 state 定義強型別欄位。
 * 欄位名稱依使用者提供之截圖示意圖，實際對應表待後端確認後再調整（見 CLAUDE.md 分層架構註記）。
 */
export const COVER_LEFT: ReportColumnDef = {
  sections: [
    {
      title: '營利事業補充資料',
      fields: [
        { key: 'taxRegistrationNo', label: '稅籍編號', type: 'text' },
        { key: 'industryStandardCode', label: '主要行業標準代號', type: 'text' },
        { key: 'filingDate', label: '申報日期', type: 'date' },
      ],
    },
    {
      title: '負責人補充資料',
      fields: [
        { key: 'repIdNumber', label: '身分證字號', type: 'text' },
        { key: 'repEmail', label: 'E-Mail', type: 'text' },
        { key: 'repPhone', label: '電話', type: 'text' },
      ],
    },
  ],
};

export const COVER_RIGHT: ReportColumnDef = {
  sections: [
    {
      title: '營業收入調節說明',
      fields: [
        { key: 'declaredRevenueTotal', label: '本年度結算申報營業收入總額', type: 'money' },
        { key: 'businessTaxSalesTotal', label: '與總分支機構申報營業稅銷售額', type: 'money' },
        { key: 'revenueDiff', label: '相差', type: 'money', allowSign: true, emphasize: true },
      ],
    },
    {
      title: '加',
      fields: [
        { key: 'addUnissuedInvoiceReceivable', label: '本期應收未開立發票金額', type: 'money', indent: 1 },
        { key: 'addOffBookOverseasRevenue', label: '本期採買賣方是列帳之境外應業收入', type: 'money', indent: 1 },
        { key: 'addEntrustedProcessingRevenue', label: '委託國外加工不復運進口實際銷售額', type: 'money', indent: 1 },
        { key: 'addOverseasWarehouseRevenue', label: '本期國外發貨倉庫實際銷售額', type: 'money', indent: 1 },
        { key: 'addOthers', label: '其他', type: 'money', indent: 1 },
      ],
    },
    {
      title: '減',
      fields: [
        { key: 'lessAdvanceReceipts', label: '本期預收款', type: 'money', indent: 1 },
        { key: 'lessPriorPeriodInvoiceIssued', label: '上期應收本期開立發票金額', type: 'money', indent: 1 },
        { key: 'lessDeemedSalesInvoiceIssued', label: '視為銷貨開立發票金額', type: 'money', indent: 1 },
        { key: 'lessVoidedInvoiceAmount', label: '本期專案作廢發票金額', type: 'money', indent: 1 },
        { key: 'lessCommissionRevenue', label: '佣金收入', type: 'money', indent: 1 },
      ],
    },
  ],
};
