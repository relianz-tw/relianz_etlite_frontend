import { ensurePdfWorker } from '@/lib/pdfWorker';

// 2 倍約 144 dpi，A4 約 1190x1684，足夠在對照面板放大後仍看得清文字
const RENDER_SCALE = 2;
const JPEG_QUALITY = 0.85;

/**
 * 把 PDF 每一頁轉成一張 JPG File（依頁序，檔名 原檔名-1.jpg、原檔名-2.jpg…）。
 * 加密或損毀的 PDF 會 reject，由呼叫端決定怎麼提示。
 */
export async function pdfToImages(file: File): Promise<File[]> {
  await ensurePdfWorker();
  const pdfjsLib = await import('pdfjs-dist');
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  try {
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const images: File[] = [];
    // 逐頁轉，避免多頁 PDF 同時佔用大量 canvas 記憶體
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
      const page = await pdf.getPage(pageNo);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context 建立失敗');
      // JPEG 不支援透明，先鋪白底，避免透明區域轉出來變黑
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
      page.cleanup();
      canvas.width = 0;
      canvas.height = 0;
      if (!blob) throw new Error(`第 ${pageNo} 頁轉圖失敗`);
      images.push(new File([blob], `${baseName}-${pageNo}.jpg`, { type: 'image/jpeg' }));
    }
    return images;
  } finally {
    await pdf.destroy();
  }
}
