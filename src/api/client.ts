/**
 * 帳簿區後端 API 共用 fetch 封裝。
 * 所有回應皆包在固定信封 { success, data, errorCode, message } 中（見 docs/api/ledger-api.md 0.2 節），
 * 這裡統一拆封：成功回傳 data，失敗一律 throw Error(message)，由呼叫端 catch 統一呼叫
 * getFriendlyErrorMessage(err)（見 @/lib/errors）轉為使用者可讀訊息後呈現，避免後端訊息中
 * 可能夾帶的技術字眼（欄位名稱、旗標等）直接外洩到畫面。
 */

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
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  // 後端固定回傳 JSON 信封（含失敗時），故不特別依賴 HTTP status，統一以 body 內 success 判斷
  const body: ApiEnvelope<T> = await res.json();

  if (!body.success || body.errorCode !== '0000') {
    throw new Error(body.message || '操作失敗');
  }
  return body.data as T;
}
