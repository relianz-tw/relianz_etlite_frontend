import { FORM_LIST } from './formList';
import type { SettlementReportId } from '../state/initializationReducer';

/** 後端訊息不一定寫完整文件名稱時，另外認這幾個說法 */
const ALIASES: Partial<Record<SettlementReportId, string[]>> = {
  CIT_UNAMORTIZED: ['未攤銷'],
  CIT_BALANCE_SHEET: ['資產負債'],
};

/**
 * 從 confirm 回傳的驗證／跨表不符訊息找出該修正哪一份文件，確認頁據此附上「回去修正」按鈕。
 * 跨表訊息會同時提到兩份（如「財產目錄未折減餘額總計與資產負債表 1400 欄不符」），
 * 取最先被提到的那份——要改的是它，後面那份是比對基準。對不到回 null，只顯示訊息。
 */
export function findFormInMessage(message: string): SettlementReportId | null {
  let best: { formCode: SettlementReportId; at: number } | null = null;
  for (const form of FORM_LIST) {
    for (const text of [form.title, ...(ALIASES[form.formCode] ?? [])]) {
      const at = message.indexOf(text);
      if (at >= 0 && (best === null || at < best.at)) best = { formCode: form.formCode, at };
    }
  }
  return best?.formCode ?? null;
}

/** confirm 回傳的 formCode 轉成使用者看得懂的文件名稱；認不得就原樣顯示 */
export function formTitleOf(formCode: string): string {
  return FORM_LIST.find(f => f.formCode === formCode)?.title ?? formCode;
}
