import type { SettlementReportId } from '../state/initializationReducer';

/**
 * 紙本對照版型的區塊標題：metadata 只有 sectionCode，沒有中文名稱，先在前端對照
 * （等後端提供 sections[] 名稱後可移除，見 docs/backend-api-requests-2026-10-15.md）。
 * 沒列到的 sectionCode 不顯示標題。
 */
export const SECTION_TITLES: Partial<Record<SettlementReportId, Record<string, string>>> = {
  CIT_INCOME_TAX: {
    HEADER: '表頭',
    OPERATING: '營業收入及毛利',
    OPEX: '營業費用及損失',
    NONOP: '非營業收益及損失',
    TAXABLE: '損益及課稅所得',
    TAX: '稅額計算',
    RECON: '營業收入調節',
    RATES: '營業收入分類',
    DISCLOSE: '其他揭露事項',
  },
  CIT_AMT: {
    HEADER: '表頭',
    BASE: '基本所得額計算',
    LOSS_SEC: '證券及期貨交易淨損失減除金額明細',
    LOSS_OBU: '國際金融業務損失減除金額明細',
    EXEMPT: '免稅所得明細',
    TAX: '基本稅額與一般所得稅額之差額計算',
  },
  CIT_INVESTORS: {
    FLAGS: '填報說明勾選',
    SUMMARY: '本年度已收資本總額',
    DEFER: '增資緩課核備資料',
    TOTALS: '各欄合計',
  },
  CIT_UE: {
    FLAGS: '免填報勾選',
    EARNINGS: '未分配盈餘計算',
    TAX: '未分配盈餘加徵稅額',
    SPR: '87 年度以後特別盈餘公積變動表',
  },
  CIT_WH_RECON: {
    PAY: '表一　各類給付',
    PAY_NOTE: '說明',
    INCOME: '表二　各類收益',
    FOREIGN_TOTAL: '表三　外籍專業人士費用合計',
    RELATED: '表四　關係人檢核',
    FOREIGN: '外籍專業人士明細',
  },
};
