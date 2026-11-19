/**
 * 401／403 某一期在後端原件 API 的 periodKey：民國年-期別起始月（兩位），如 114 年 1–2 月期為 114-01。
 * 格式依後端 API 範例推得，若後端實際格式不同只需改這裡。
 */
export function toVatPeriodKey(period: { rocYear: number; phase: number }): string {
  return `${period.rocYear}-${String(period.phase).padStart(2, '0')}`;
}
