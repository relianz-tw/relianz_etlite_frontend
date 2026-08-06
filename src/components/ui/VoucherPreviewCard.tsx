'use client';

import { ImageOff } from 'lucide-react';

/**
 * 各交易明細頁共用的憑證照片預覽，樣式沿用帳簿交易表單 VoucherUpload 的邊框/尺寸慣例，但為純檢視（無上傳互動）。
 * voucherImage 可為 API 回傳的圖片網址（如 invoicePicUrl）或本地 mock 的 data URI。
 */
export default function VoucherPreviewCard({ voucherImage }: { voucherImage: string | null }) {
  return (
    <div className="flex min-h-[480px] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed border-neutral-blue-gray/50 bg-white text-neutral-mid">
      {voucherImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- 圖片來源可能是遠端 API 網址或本地 data URI，暫不套用 next/image 最佳化
        <img src={voucherImage} alt="交易憑證" className="h-full w-full object-contain p-2" />
      ) : (
        <>
          <ImageOff size={28} strokeWidth={1.5} />
          <span className="text-sm">尚無憑證照片</span>
        </>
      )}
    </div>
  );
}
