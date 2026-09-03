/** 模擬產出的文件（繳款書／繳款證明／申報明細等）。無後端可產生真實 PDF，
 *  以「查看」開預覽彈窗、「下載」存成純文字檔案的方式模擬檔案存在，待後端提供真實檔案 API 後改為串接。 */
export interface MockFile {
  id: string;
  name: string;
  /** 產生／上傳時間，格式 '民國年/MM/DD HH:mm' */
  timeLabel: string;
  /** 預覽彈窗顯示的內容列（label/value 對） */
  summary: { label: string; value: string }[];
}

function nowTimeLabel(): string {
  const d = new Date();
  const year = d.getFullYear() - 1911;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

let counter = 0;
export function createMockFile(name: string, summary: { label: string; value: string }[]): MockFile {
  counter += 1;
  return { id: `mf-${Date.now()}-${counter}`, name, timeLabel: nowTimeLabel(), summary };
}

/** 將檔案摘要存成純文字檔下載，模擬「下載」動作（無真實 PDF 內容，僅示意） */
export function downloadMockFile(file: MockFile): void {
  const lines = [file.name, `產生時間：${file.timeLabel}`, '', ...file.summary.map(s => `${s.label}：${s.value}`)];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${file.name}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
