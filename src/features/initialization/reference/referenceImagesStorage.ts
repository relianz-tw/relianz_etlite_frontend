import { deleteFiles, loadFiles, saveFiles } from '@/lib/idbFiles';

const REFERENCE_IMAGES_KEY = 'reference-images';

// 對照圖片只是輔助顯示，瀏覽器不支援或無痕模式寫入失敗時安靜略過，不影響填表

export function saveReferenceImages(files: File[]): void {
  saveFiles(REFERENCE_IMAGES_KEY, files).catch(() => {});
}

export function loadReferenceImages(): Promise<File[]> {
  return loadFiles(REFERENCE_IMAGES_KEY).catch(() => []);
}

export function clearReferenceImages(): void {
  deleteFiles(REFERENCE_IMAGES_KEY).catch(() => {});
}
