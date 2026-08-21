import { ERROR_MESSAGES } from './errorCodes';

/**
 * 帶有後端業務錯誤碼／HTTP 狀態的錯誤類別，由 apiFetch（見 @/api/client）統一拋出。
 * errorCode 為後端信封內的 4 位數字碼；apiFetch 偵測到網路失敗或回應非 JSON 時
 * 會自產 'F0001'／'F0002'。status 僅供除錯，不參與成敗判斷。
 */
export class ApiError extends Error {
  readonly errorCode: string;
  readonly status: number;

  constructor(errorCode: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.errorCode = errorCode;
    this.status = status;
  }
}

/**
 * 已知會外洩技術字眼的後端訊息 → 對應的親善化中文說明。
 * 新增規則前請先確認該訊息實際出現於畫面上，避免臆測後端措辭。
 */
const KNOWN_MESSAGE_OVERRIDES: Array<{ match: RegExp; friendly: string }> = [];

/** 技術字眼特徵：英文駝峰命名（如 ledgerUuid、bankAccountUuid）常見於後端訊息中夾帶的欄位／旗標名稱 */
const TECHNICAL_TOKEN = /\b[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*\b/;

/** 判斷訊息是否含中文，用於過濾純英文（如 'invalid request'）等不適合直接顯示的後端訊息 */
const HAS_CJK = /[一-鿿]/;

/**
 * 將 API 錯誤轉為適合顯示給使用者的中文訊息，避免變數名稱、英文旗標等技術字眼直接外洩到畫面。
 * 優先序：後端可讀訊息 > 錯誤碼字典 > fallback —— 字典只在後端訊息不可用時接手，
 * 不覆蓋後端已提供的具體說明（例如某些業務規則錯誤的訊息本身就比字典更精確）。
 *
 * 1. 非 Error 或空訊息 → 回傳 fallback
 * 2. ApiError 且為前端自產碼（'F' 開頭，訊息僅供除錯）→ 直接查字典
 * 3. 命中已知會洩漏技術字眼的訊息 → 改用對應的親善化說明
 * 4. 訊息含中文且不含技術字眼 → 視為後端已提供之正常中文訊息，原樣顯示；
 *    含技術字眼則移除訊息中含技術字眼的括號補充說明，去除後仍可用（含中文、無殘留技術字眼）則顯示
 * 5. 以上皆不可用 → ApiError 時查字典，查無則回傳 fallback
 */
export function getFriendlyErrorMessage(error: unknown, fallback = '操作失敗'): string {
  if (!(error instanceof Error) || !error.message) return fallback;
  const message = error.message;

  if (error instanceof ApiError && error.errorCode.startsWith('F')) {
    return ERROR_MESSAGES[error.errorCode] ?? fallback;
  }

  const override = KNOWN_MESSAGE_OVERRIDES.find(rule => rule.match.test(message));
  if (override) return override.friendly;

  const candidate = TECHNICAL_TOKEN.test(message)
    ? message.replace(/[（(][^（）()]*[a-zA-Z][^（）()]*[）)]/g, '').trim()
    : message;
  const usable = candidate && HAS_CJK.test(candidate) && !TECHNICAL_TOKEN.test(candidate);
  if (usable) return candidate;

  if (error instanceof ApiError) {
    return ERROR_MESSAGES[error.errorCode] ?? fallback;
  }
  return fallback;
}
