import { deleteValue, loadValue, saveValue } from '@/lib/idbFiles';

const IMAGES_KEY = 'reference-images';
const SOURCES_KEY = 'source-files';

/** 營所稅使用者上傳的原始檔案（可多份）。TODO：後端檔案 API 上線後改存後端，這裡只是本機替身 */
export interface SourceFile {
  id: string;
  file: File;
  /** 這份檔案辨識後帶入了哪些文件（畫面上「已帶入：…」用，跟著檔案一直顯示） */
  appliedLabels: string[];
}

/** 對照面板的圖片，以及它是從哪份上傳檔案轉出來的（刪除該檔案時一併清掉） */
export interface ReferenceImages {
  files: File[];
  sourceId: string | null;
}

// 這些資料只是輔助與暫存，瀏覽器不支援或無痕模式寫入失敗時安靜略過，不影響填表

export function saveReferenceImages(value: ReferenceImages): void {
  saveValue(IMAGES_KEY, value).catch(() => {});
}

export async function loadReferenceImages(): Promise<ReferenceImages> {
  const stored = await loadValue<File[] | ReferenceImages>(IMAGES_KEY).catch(() => undefined);
  if (!stored) return { files: [], sourceId: null };
  // 舊版只存 File[]，沒有來源 id
  return Array.isArray(stored) ? { files: stored, sourceId: null } : stored;
}

export function saveSourceFiles(files: SourceFile[]): void {
  saveValue(SOURCES_KEY, files).catch(() => {});
}

export async function loadSourceFiles(): Promise<SourceFile[]> {
  return (await loadValue<SourceFile[]>(SOURCES_KEY).catch(() => undefined)) ?? [];
}

/** 開帳完成或離開流程時清掉本機暫存的上傳檔案與對照圖片 */
export function clearUploadedFiles(): void {
  deleteValue(IMAGES_KEY).catch(() => {});
  deleteValue(SOURCES_KEY).catch(() => {});
}
