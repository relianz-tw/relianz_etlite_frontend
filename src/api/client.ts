/**
 * 帳簿區後端 API 共用 fetch 封裝。
 * 所有回應皆包在固定信封 { success, data, errorCode, message } 中（見 docs/api/ledger-api.md 0.2 節），
 * 這裡統一拆封：成功回傳 data，失敗一律 throw ApiError（帶 errorCode／HTTP status），
 * 由呼叫端 catch 統一呼叫 getFriendlyErrorMessage(err)（見 @/lib/errors）轉為使用者可讀訊息後呈現，
 * 避免後端訊息中可能夾帶的技術字眼（欄位名稱、旗標等）直接外洩到畫面。
 * 網路失敗／回應非 JSON 時同樣包裝為 ApiError（'F0001'／'F0002'），避免原生錯誤直接外洩到畫面。
 */
import { ApiError } from '@/lib/errors';

// 後端已開放 CORS，統一直接打 NEXT_PUBLIC_API_BASE_URL（各環境 .env 檔設定，見 next.config.js 註解），
// 不再依賴 Next.js rewrite 代理；未設定時退回相對路徑，交由 rewrite（若有設定）轉發
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  errorCode: string;
  message: string;
}

/** 組出 query string，自動略過 undefined／空字串參數 */
export function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch {
    // 斷網／CORS／DNS 等 fetch 本身失敗，無 HTTP 回應可言
    throw new ApiError('F0001', '網路連線失敗', 0);
  }

  // 後端固定回傳 JSON 信封（含失敗時），故不特別依賴 HTTP status 判斷成敗，
  // 僅在 body 非合法 JSON（如 500 回 HTML）時才需要仰賴 status 組出錯誤訊息
  let body: ApiEnvelope<T>;
  try {
    body = await res.json();
  } catch {
    throw new ApiError('F0002', `HTTP ${res.status} 回應非 JSON`, res.status);
  }

  if (!body.success || body.errorCode !== '0000') {
    throw new ApiError(body.errorCode ?? '', body.message ?? '', res.status);
  }
  return body.data as T;
}
