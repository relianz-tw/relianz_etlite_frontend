/** 草稿時間（ISO 字串或毫秒）顯示成 24 小時制「時：分」，如 14:32 */
export function formatDraftTime(value: string | number): string {
  return new Date(value).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * 完整日期時間「2026-11-25 10:43」。跨裝置的草稿衝突、文件匯入時間可能不是今天，
 * 只寫時分看不出是哪一天，所以這兩處用完整日期；底部操作列的「上次儲存」維持只寫時分。
 */
export function formatDraftDateTime(value: string | number): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
