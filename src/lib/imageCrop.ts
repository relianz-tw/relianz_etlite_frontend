import type { Area } from 'react-easy-crop';

export interface InvoiceTemplate {
  id:
    | 'handwritten'
    | 'short-eInvoice'
    | 'long-receipt'
    | 'a4'
    | 'boarding-pass'
    | 'hsr-ticket'
    | 'free';
  label: string;
  /** null 表示自由裁切，不鎖定比例 */
  aspect: number | null;
  spec: string;
  specDetail: string;
}

export const INVOICE_TEMPLATES: InvoiceTemplate[] = [
  {
    id: 'handwritten',
    label: '手開發票及收據',
    aspect: 190 / 105,
    spec: '190 × 105 mm',
    specDetail: '比例 190:105（寬：高）',
  },
  {
    id: 'a4',
    label: '帳單及A4 發票',
    aspect: 210 / 297,
    spec: 'A4 直式 210×297mm',
    specDetail: '發票、帳單、電話費／水電費',
  },
  {
    id: 'short-eInvoice',
    label: '短電子發票',
    aspect: 57 / 150,
    spec: '57 × 150 mm',
    specDetail: '比例 57:150（寬：高）',
  },
  {
    id: 'long-receipt',
    label: '長收銀機',
    aspect: 45 / 190,
    spec: '4.5 × 19 cm',
    specDetail: '比例 4.5:19（寬：高）',
  },
  {
    id: 'boarding-pass',
    label: '登機證',
    aspect: 210 / 99,
    spec: '登機證',
    specDetail: '比例 2.1:1（寬：高）',
  },
  {
    id: 'hsr-ticket',
    label: '高鐵票',
    aspect: 85.6 / 54,
    spec: '高鐵票',
    specDetail: '比例 1.6:1（寬：高）',
  },
  {
    id: 'free',
    label: '其他',
    aspect: null,
    spec: '自由裁切',
    specDetail: '不限制比例',
  },
];

/**
 * 依裁切像素座標與旋轉角度，將來源 File 輸出為裁切後的 JPEG File + base64 preview。
 */
export async function cropImageToFile(
  sourceFile: File,
  cropPixels: Area,
  rotation: number,
  outputName = 'cropped_invoice.jpg',
  useFullImage = false
): Promise<{ file: File; preview: string }> {
  const imageUrl = URL.createObjectURL(sourceFile);
  try {
    const image = await loadImage(imageUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context 建立失敗');

    const rotRad = (rotation * Math.PI) / 180;

    // 計算旋轉後的圖片邊界框
    const sin = Math.abs(Math.sin(rotRad));
    const cos = Math.abs(Math.cos(rotRad));
    const rotatedWidth = Math.floor(image.width * cos + image.height * sin);
    const rotatedHeight = Math.floor(image.width * sin + image.height * cos);

    // 先畫旋轉後的完整圖
    const offscreen = document.createElement('canvas');
    offscreen.width = rotatedWidth;
    offscreen.height = rotatedHeight;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) throw new Error('Offscreen canvas context 建立失敗');

    offCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
    offCtx.rotate(rotRad);
    offCtx.drawImage(image, -image.width / 2, -image.height / 2);

    // zoom < 1 時圖片小於裁切框，直接輸出整張旋轉後的圖不裁切
    if (useFullImage) {
      canvas.width = rotatedWidth;
      canvas.height = rotatedHeight;
      ctx.drawImage(offscreen, 0, 0);
    } else {
      canvas.width = cropPixels.width;
      canvas.height = cropPixels.height;
      ctx.drawImage(
        offscreen,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        cropPixels.width,
        cropPixels.height
      );
    }

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    );
    if (!blob) throw new Error('圖片裁切輸出失敗');

    const file = new File([blob], outputName, { type: 'image/jpeg' });
    const preview = await fileToBase64(file);
    return { file, preview };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
