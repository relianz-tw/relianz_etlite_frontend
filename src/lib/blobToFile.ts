const MIME_BY_EXTENSION: Record<string, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

/**
 * 把從後端下載的 Blob 包成 File。後端的 Content-Type 不一定可靠（可能是 octet-stream），
 * 而預覽要靠 file.type 判斷 PDF 或圖片，所以依副檔名補正類型。
 */
export function blobToFile(blob: Blob, fileName: string): File {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return new File([blob], fileName, { type: MIME_BY_EXTENSION[ext] ?? blob.type });
}
