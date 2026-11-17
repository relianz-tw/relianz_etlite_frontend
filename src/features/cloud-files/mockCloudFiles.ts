// ⚠️ 假資料：後端尚無「列出／儲存使用者上傳檔案」API，上線後只需替換此檔的函式實作，
// 介面（slotKey → CloudFile）保持不變，畫面層不用動。

export interface CloudFile {
  uuid: string;
  /** 檔案 URL（相對或絕對）；空字串代表假資料無實體檔案 */
  url: string;
  fileName: string;
  /** yyyy-MM-dd HH:mm */
  uploadTime: string;
}

/** slotKey 格式：登記資料 `reg:{code}`、營業稅 `vat:{year}:{phase}:{code}`、營所稅 `cit:{year}:{code}` */
export type CloudFileMap = Record<string, CloudFile>;

export const MOCK_YEARS = [2026, 2025];

function nowText(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export async function fetchCloudFiles(): Promise<CloudFileMap> {
  return {
    'reg:APPROVAL_LETTER': { uuid: 'm1', url: '', fileName: '設立核准函.pdf', uploadTime: '2026-03-02 10:12' },
    'vat:2026:1:VAT_RETURN': { uuid: 'm2', url: '', fileName: '401申報書_1-2月.pdf', uploadTime: '2026-03-14 09:30' },
    'vat:2026:1:VAT_PAYMENT_PROOF': { uuid: 'm3', url: '', fileName: '收據.pdf', uploadTime: '2026-03-15 05:51' },
    'cit:2026:CIT_RETURN': { uuid: 'm4', url: '', fileName: '營所稅申報書.pdf', uploadTime: '2026-07-08 09:34' },
  };
}

export async function uploadCloudFile(slotKey: string, file: File): Promise<CloudFile> {
  return { uuid: `${slotKey}:${Date.now()}`, url: '', fileName: file.name, uploadTime: nowText() };
}
