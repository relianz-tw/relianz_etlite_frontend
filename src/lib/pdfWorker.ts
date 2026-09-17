let workerSetupPromise: Promise<void> | null = null;

// 使用 CDN 載入 PDF.js worker（穩定且簡單的方式）
const PDFJS_VERSION = '4.8.69'; // react-pdf 9.2.1 使用的 pdfjs-dist 版本
const WORKER_SRC = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

/**
 * 初始化 PDF.js worker（使用 CDN 方式）
 * 這是 react-pdf 官方推薦的最簡單穩定的方式
 */
export const ensurePdfWorker = async () => {
  // SSR 檢查 - 只在客戶端執行
  if (typeof window === 'undefined') {
    return;
  }

  if (!workerSetupPromise) {
    workerSetupPromise = (async () => {
      const { pdfjs } = await import('react-pdf');

      // 設定 worker 來源為 CDN
      pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
    })();
  }

  return workerSetupPromise;
};
