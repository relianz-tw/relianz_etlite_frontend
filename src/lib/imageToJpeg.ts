import { loadImage } from '@/lib/imageCrop';

const JPEG_QUALITY = 0.92;

function getExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function toJpgName(name: string): string {
  return name.replace(/\.[^.]+$/, '') + '.jpg';
}

async function pngToJpegBlob(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context 建立失敗');
    // JPEG 不支援透明，先鋪白底，避免透明區域轉出來變黑
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob) throw new Error('圖片轉檔輸出失敗');
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function heicToJpegBlob(file: File): Promise<Blob> {
  // heic2any 載入時會存取 window，改在使用時動態載入，避免 SSR 報錯並減少首屏 bundle
  const { default: heic2any } = await import('heic2any');
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: JPEG_QUALITY });
  return Array.isArray(result) ? result[0] : result;
}

/**
 * 將使用者上傳的圖片統一轉成 JPG File：jpg 原檔回傳，png／heic／heif 轉檔。
 * 瀏覽器對 HEIC 常給空的 file.type，所以一律用副檔名判斷。
 * 失敗時拋出 Error（heic2any 本身 reject 的是 {code, message}，這裡統一包成 Error）。
 */
export async function toJpegFile(file: File): Promise<File> {
  const ext = getExtension(file.name);
  if (ext === 'jpg' || ext === 'jpeg') return file;

  try {
    const blob = ext === 'png' ? await pngToJpegBlob(file) : await heicToJpegBlob(file);
    return new File([blob], toJpgName(file.name), { type: 'image/jpeg' });
  } catch (err) {
    const reason = err instanceof Error ? err.message : (err as { message?: string })?.message;
    throw new Error(reason ? `圖片轉檔失敗：${reason}` : '圖片轉檔失敗');
  }
}
