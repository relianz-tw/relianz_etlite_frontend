/**
 * 交易紀錄呼叫失敗時的統一 log 格式
 * 印出來源路由、動作名稱、實際送出的資料、以及錯誤本身，方便排查是網路問題還是後端 API 尚未支援
 */
export function logTradeRecordError(
  routeTag: string,
  action: string,
  payload: Record<string, unknown>,
  error: unknown
) {
  console.error(
    `[${routeTag}] ${action} 失敗\n` +
      `送出資料: ${JSON.stringify(payload)}\n` +
      `錯誤內容: ${error instanceof Error ? error.message : String(error)}`,
    error
  );
}
