/**
 * 通用非同步重試工具
 * 適用於伺服器端與客戶端，公用底層可適度使用 any
 */

export interface RetryOptions {
  /** 總嘗試次數（含首次），預設 3 */
  maxAttempts?: number;
  /** 每次重試之間的間隔（毫秒），預設 1000 */
  delayMs?: number;
  /** 自訂是否應該重試，預設永遠重試 */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** 每次重試前的回呼（可用於 log） */
  onRetry?: (error: unknown, attempt: number) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 以重試機制執行非同步函式
 * 失敗後依 delayMs 間隔重試，達 maxAttempts 次後拋出最後一次的錯誤
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 3;
  const delayMs = options?.delayMs ?? 1000;
  const shouldRetry = options?.shouldRetry ?? (() => true);
  const onRetry = options?.onRetry;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 最後一次失敗或不需重試，直接拋出
      if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }

      if (onRetry) {
        onRetry(error, attempt);
      }

      await sleep(delayMs);
    }
  }

  // 理論上不會到這，但 TypeScript 需要
  throw lastError;
}

/**
 * 判斷現在是否落在綠界「每日自動關帳」時段
 * 時段：台北時間 20:15 ~ 20:30（含邊界）
 * 此時段內應禁止呼叫信用卡請退款 API
 */
export function isWithinAutoCloseBlackout(): boolean {
  // 取台北時間的小時與分鐘，不依賴伺服器本地時區
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    hour12: false,
    hour: 'numeric',
    minute: 'numeric',
  });

  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(
    parts.find(p => p.type === 'minute')?.value ?? '0',
    10
  );

  const totalMinutes = hour * 60 + minute;
  const blackoutStart = 20 * 60 + 15; // 20:15
  const blackoutEnd = 20 * 60 + 30; // 20:30

  return totalMinutes >= blackoutStart && totalMinutes <= blackoutEnd;
}
