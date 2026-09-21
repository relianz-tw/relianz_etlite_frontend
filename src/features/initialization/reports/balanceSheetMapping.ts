import type { ReportField } from '../state/initializationReducer';

/**
 * 資產負債表欄位 key → /ael/initialization/openbook 期初餘額 API 分組。
 * 僅列出明細科目（不含各分組合計／總計欄位，避免與明細重複計入），供 Step5Confirm 送出用。
 * 對應表待後端確認實際 API 欄位需求後可能調整，目前先依既有 openbook 慣例保留三分組結構。
 */
const ASSET_KEYS = ['cash', 'bankDeposits', 'accountsReceivable', 'businessTaxCredit', 'fixedAssetsCost', 'accumulatedDepreciation', 'otherAssets'];
const LIABILITY_KEYS = ['accountsPayable', 'shortTermLoans', 'longTermLiabilities'];
const EQUITY_KEYS = ['registeredCapital', 'ownerCurrentAccount', 'retainedEarnings'];

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
