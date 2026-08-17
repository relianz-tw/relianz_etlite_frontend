/**
 * 已知會外洩技術字眼的後端訊息 → 對應的親善化中文說明。
 * 新增規則前請先確認該訊息實際出現於畫面上，避免臆測後端措辭。
 */
const KNOWN_MESSAGE_OVERRIDES: Array<{ match: RegExp; friendly: string }> = [];

/** 技術字眼特徵：英文駝峰命名（如 ledgerUuid、bankAccountUuid）常見於後端訊息中夾帶的欄位／旗標名稱 */
const TECHNICAL_TOKEN = /\b[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*\b/;

/**
 * 將 API 錯誤轉為適合顯示給使用者的中文訊息，避免變數名稱、英文旗標等技術字眼直接外洩到畫面：
 * 1. 非 Error 或空訊息 → 回傳 fallback
 * 2. 命中已知會洩漏技術字眼的訊息 → 改用對應的親善化說明
 * 3. 訊息中仍含疑似變數名稱 → 移除訊息中含技術字眼的括號補充說明，保留前方中文主敘述；
 *    去除後仍含技術字眼或已空白 → 回傳 fallback
 * 4. 其餘視為後端已提供之正常中文訊息，原樣顯示
 */
export function getFriendlyErrorMessage(error: unknown, fallback = '操作失敗'): string {
  if (!(error instanceof Error) || !error.message) return fallback;
  const message = error.message;

  const override = KNOWN_MESSAGE_OVERRIDES.find(rule => rule.match.test(message));
  if (override) return override.friendly;

  if (TECHNICAL_TOKEN.test(message)) {
    const stripped = message.replace(/[（(][^（）()]*[a-zA-Z][^（）()]*[）)]/g, '').trim();
    if (stripped && !TECHNICAL_TOKEN.test(stripped)) return stripped;
    return fallback;
  }

  return message;
}
