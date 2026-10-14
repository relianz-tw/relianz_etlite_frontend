import type { ReportField } from '../state/initializationReducer';

/**
 * CIT_BALANCE_SHEET（資產負債表）欄位 key → /ael/initialization/openbook 期初餘額 API 分組。
 * 僅列出明細科目（不含各分組合計／總計欄位，避免與明細重複計入），供 Step5Confirm 送出用。
 * key 對應官方 field_code（由 GET /ael/peit/form/metadata 取得）。
 * 對應表待後端確認實際 API 欄位需求後可能調整，目前先依既有 openbook 慣例保留三分組結構。
 */
const ASSET_KEYS = [
  'BS_1110', // 現金及約當現金
  'BS_1131', // 應收票據
  'BS_1141', // 應收帳款
  'BS_1150', // 其他應收款
  'BS_1160', // 存貨
  'BS_1170', // 預付款項
  'BS_1312', // 房屋及建築
  'BS_1313', // 減：累計折舊－房屋及建築
  'BS_1321', // 機具設備
  'BS_1322', // 減：累計折舊－機具設備
];
const LIABILITY_KEYS = [
  'BS_2110', // 短期借款
  'BS_2140', // 應付帳款
  'BS_2150', // 其他應付款
  'BS_2210', // 長期借款
];
const EQUITY_KEYS = [
  'BS_3100', // 資本／股本
  'BS_3120', // 資本公積
  'BS_3430', // 未分配盈餘（或累積虧損）
];

function pickFields(fields: Record<string, ReportField>, keys: string[]): Record<string, number> {
  return Object.fromEntries(keys.map(key => [key, Number(fields[key]?.value) || 0]));
}

export function toOpeningBalancePayload(balanceSheetFields: Record<string, ReportField>) {
  return {
    assets: pickFields(balanceSheetFields, ASSET_KEYS),
    liabilities: pickFields(balanceSheetFields, LIABILITY_KEYS),
    equity: pickFields(balanceSheetFields, EQUITY_KEYS),
  };
}
