/** 草稿時間（ISO 字串或毫秒）顯示成 24 小時制「時：分」，如 14:32 */
export function formatDraftTime(value: string | number): string {
  return new Date(value).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
}
