/** 頁碼清單轉成顯示文字：[1] → 第 1 頁、[2,3,4] → 第 2–4 頁、[1,3] → 第 1、3 頁；沒有頁碼回空字串 */
export function formatPageRange(pages: number[]): string {
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  if (sorted.length === 0) return '';
  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (const n of [...sorted.slice(1), Infinity]) {
    if (n === prev + 1) {
      prev = n;
      continue;
    }
    parts.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = n;
    prev = n;
  }
  return `第 ${parts.join('、')} 頁`;
}
