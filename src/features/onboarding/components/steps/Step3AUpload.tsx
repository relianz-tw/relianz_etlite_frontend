'use client';

import { useOnboarding } from '../../state/OnboardingContext';
import { type InBillType } from '../../state/onboardingReducer';
import { btnTextLink } from '../../styles';
import {
  recognizeInvoice,
  type GuiSubjectCandidate,
  type InvoiceItem,
} from '@/api/onboarding/voucherUpload';
import Button from '@/components/ui/Button';
import { InvoiceCropDialog } from '@/components/ui/InvoiceCropDialog';
import { MobileFixedBottom } from '@/components/onboarding/MobileFixedBottom';
import { ensurePdfWorker } from '@/lib/pdfWorker';
import { type InvoiceTemplate } from '@/lib/imageCrop';
import { useResizeObserver } from '@wojtekmaj/react-hooks';
import { ChevronLeft, Loader2, Paperclip } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DocumentProps, PageProps } from 'react-pdf';
import { toast } from 'sonner';

const Document = dynamic<DocumentProps>(
  () => import('react-pdf').then(mod => mod.Document),
  { ssr: false }
);

const Page = dynamic<PageProps>(
  () => import('react-pdf').then(mod => mod.Page),
  { ssr: false }
);

const resizeObserverOptions = {};

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// document_template 數字對應 InvoiceCropDialog 模板 ID（同 scan.tsx）
const TEMPLATE_MAP: Record<number, InvoiceTemplate['id']> = {
  1: 'handwritten',
  2: 'a4',
  3: 'short-eInvoice',
  4: 'long-receipt',
  5: 'boarding-pass',
  6: 'hsr-ticket',
  7: 'free',
};

export function Step3AUpload() {
  const { state, dispatch } = useOnboarding();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [isNotVoucher, setIsNotVoucher] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isPdfWorkerReady, setIsPdfWorkerReady] = useState(false);
  const [pdfContainerRef, setPdfContainerRef] = useState<HTMLElement | null>(
    null
  );
  const [containerWidth, setContainerWidth] = useState<number>();
  const [isEncryptedPdf, setIsEncryptedPdf] = useState(false);

  // 裁切對話框狀態
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);
  // AI 辨識中：鎖定裁切對話框
  const [analyzing, setAnalyzing] = useState(false);
  // AI 回傳的旋轉角度與模板
  const [aiRotation, setAiRotation] = useState<number>(0);
  const [aiTemplateId, setAiTemplateId] =
    useState<InvoiceTemplate['id']>('handwritten');

  // 辨識結果暫存（裁切確認後 dispatch）
  const recognitionResultRef = useRef<InvoiceItem | null>(null);
  // 確認裁切時防止 handleCropCancel 誤觸發
  const cropConfirmedRef = useRef(false);

  const pdfOptions = useMemo(
    () => ({
      cMapUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/cmaps/',
      cMapPacked: true,
      standardFontDataUrl:
        'https://unpkg.com/pdfjs-dist@4.8.69/standard_fonts/',
    }),
    []
  );

  useEffect(() => {
    setIsClient(true);
    ensurePdfWorker().then(() => setIsPdfWorkerReady(true));
  }, []);

  const onResize = useCallback<ResizeObserverCallback>(entries => {
    const [entry] = entries;
    if (entry) setContainerWidth(entry.contentRect.width);
  }, []);

  useResizeObserver(pdfContainerRef, resizeObserverOptions, onResize);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type))
      return '不支援的檔案格式，請上傳 JPG / PNG / PDF';
    if (file.size > MAX_SIZE_BYTES) return `檔案大小超過 ${MAX_SIZE_MB}MB 上限`;
    return null;
  };

  const dispatchRecognitionResult = (item: InvoiceItem) => {
    dispatch({
      type: 'SET_VOUCHER_RECOGNITION_RESULT',
      payload: {
        recognizedData: {
          voucherType: item.invoice_direction === 'buy' ? 2 : 1,
          inBillType: '發票' as InBillType,
          invoicePrefix: item.gui_alphabetic_letter
            ? item.gui_number?.slice(0, 2) ?? ''
            : '',
          invoiceNumber: item.gui_alphabetic_letter
            ? item.gui_number?.slice(2) ?? ''
            : item.gui_number ?? '',
          date: `${item.gui_date_year + 1911}-${String(
            item.gui_date_month
          ).padStart(2, '0')}-${String(item.gui_date_day).padStart(2, '0')}`,
          sellerTaxId: item.seller_tax_id ?? '',
          sellerName: item.seller_name ?? '',
          buyerTaxId: item.buyer_tax_id ?? '',
          buyerName: item.buyer_name ?? '',
          amount: item.subtotal,
          taxFreeAmount: item.tax_free_amount ?? 0,
          tax: item.tax,
          others: item.others ?? 0,
          total: item.total_amount,
          transportationId: '',
        },
        suggestions: (item.gui_subject_candidates ?? []).map(
          (c: GuiSubjectCandidate, idx: number) => ({
            id: idx,
            category: c.gui_subject_category,
            accountSubject: c.gui_subject,
            taxInfo: '',
            advice: c.reason,
          })
        ),
      },
    });
  };

  const handleFile = async (file: File) => {
    setFileError('');
    setIsNotVoucher(false);
    setIsEncryptedPdf(false);
    const err = validateFile(file);
    if (err) {
      setFileError(err);
      return;
    }

    setPreviewName(file.name);

    if (file.type === 'application/pdf') {
      // 檢查是否為加密 PDF
      let isEncrypted = false;
      try {
        await ensurePdfWorker();
        const pdfjsLib = await import('pdfjs-dist');
        const loadingTask = pdfjsLib.getDocument({
          data: await file.arrayBuffer(),
        });
        try {
          await loadingTask.promise;
        } catch (pdfErr: unknown) {
          if ((pdfErr as { name?: string })?.name === 'PasswordException') {
            isEncrypted = true;
          }
        }
      } catch {
        // pdfjs 無法載入，繼續正常流程
      }

      if (isEncrypted) {
        setIsEncryptedPdf(true);
        toast.error('這是一份加密的 PDF 無法進行辨識');
        return;
      }

      // 非加密 PDF - 正常辨識流程
      setIsPdf(true);
      setPdfFile(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const pdfUrl = URL.createObjectURL(file);
      setPreviewUrl(pdfUrl);
      dispatch({
        type: 'SET_VOUCHER_PREVIEW',
        payload: { previewUrl: pdfUrl, isPdf: true },
      });

      setUploading(true);
      try {
        const data = await recognizeInvoice({
          file,
          companyDescription: state.company.description || undefined,
          companySalesMode: state.company.salesMode || undefined,
        });
        const item = data.items?.[0];
        if (!item) {
          setIsNotVoucher(true);
          throw new Error('辨識結果為空，請重試');
        }
        dispatchRecognitionResult(item);
        dispatch({ type: 'GO_TO_STEP', payload: { step: 3, subStep: 'B' } });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : '憑證辨識失敗，請重試'
        );
      } finally {
        setUploading(false);
      }
    } else {
      // 圖片檔案：立即開啟裁切對話框並同步執行辨識
      setIsPdf(false);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // 重設 AI 建議值
      recognitionResultRef.current = null;
      setAiRotation(0);
      setAiTemplateId('handwritten');

      // 以 isAnalyzing=true 鎖定對話框，等辨識完成後解鎖
      setAnalyzing(true);
      setPendingCropFile(file);
      setIsCropOpen(true);

      try {
        const data = await recognizeInvoice({
          file,
          companyDescription: state.company.description || undefined,
          companySalesMode: state.company.salesMode || undefined,
        });
        const item = data.items?.[0];

        if (!item) {
          setIsNotVoucher(true);
          toast.error('辨識結果為空，請重試');
          // 辨識失敗，關閉對話框
          setIsCropOpen(false);
          setPendingCropFile(null);
          URL.revokeObjectURL(url);
          setPreviewUrl(null);
          setPreviewName(null);
        } else {
          // 儲存辨識結果供裁切確認後使用
          recognitionResultRef.current = item;

          // 套用 AI 建議的旋轉角度（補角轉回正向）
          if (typeof item.angle === 'number') {
            setAiRotation((360 - item.angle) % 360);
          }
          // 套用 AI 建議的模板
          const mappedTemplate = TEMPLATE_MAP[item.document_template as number];
          if (mappedTemplate) setAiTemplateId(mappedTemplate);
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : '憑證辨識失敗，請重試'
        );
        // 辨識失敗，關閉對話框
        setIsCropOpen(false);
        setPendingCropFile(null);
        URL.revokeObjectURL(url);
        setPreviewUrl(null);
        setPreviewName(null);
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleCropConfirm = (croppedFile: File, croppedPreview: string) => {
    cropConfirmedRef.current = true;
    setPendingCropFile(null);

    // 更新預覽為裁切後版本
    if (previewUrl && previewUrl.startsWith('blob:'))
      URL.revokeObjectURL(previewUrl);
    setPreviewUrl(croppedPreview);
    dispatch({
      type: 'SET_VOUCHER_PREVIEW',
      payload: { previewUrl: croppedPreview, isPdf: false },
    });

    const item = recognitionResultRef.current;
    if (!item) {
      toast.error('辨識結果為空，請重試');
      recognitionResultRef.current = null;
      return;
    }

    dispatchRecognitionResult(item);
    dispatch({ type: 'GO_TO_STEP', payload: { step: 3, subStep: 'B' } });
    recognitionResultRef.current = null;
  };

  const handleCropCancel = () => {
    setIsCropOpen(false);
    setPendingCropFile(null);
    if (previewUrl && previewUrl.startsWith('blob:'))
      URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewName(null);
    setAnalyzing(false);
    recognitionResultRef.current = null;
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <>
      {/* 裁切對話框移至 flex 容器外，避免影響 flex 子元素排列 */}
      <InvoiceCropDialog
        open={isCropOpen}
        onOpenChange={open => {
          if (!open) {
            if (cropConfirmedRef.current) {
              // 裁切確認後對話框關閉，重設旗標即可
              cropConfirmedRef.current = false;
            } else {
              // 使用者主動取消（Escape / 背景點擊）
              handleCropCancel();
            }
          }
        }}
        sourceFile={pendingCropFile}
        onConfirm={handleCropConfirm}
        onReupload={() => {
          handleCropCancel();
          setTimeout(() => inputRef.current?.click(), 50);
        }}
        isAnalyzing={analyzing}
        defaultTemplateId={aiTemplateId}
        defaultRotation={aiRotation}
      />

      <div className='flex flex-col md:flex-row min-h-full md:flex-1 md:min-h-0'>
        {/* 左欄：宣傳圖片 */}
        <div className='md:order-1 h-[260px] md:h-auto shrink-0 md:shrink md:flex-none w-full md:w-2/5 relative overflow-hidden bg-semantic-success-deep'>
          {/* 全站慣例用原生 img，不使用 next/image */}
          <img
            src='/etlite/promotional2.webp'
            alt='Easytax 服務宣傳圖'
            className='absolute inset-0 w-full h-full object-cover object-center'
          />
          <div className='absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent pointer-events-none' />
          <button
            onClick={() => dispatch({ type: 'PREV_STEP' })}
            className='flex items-center gap-1 text-sm text-white hover:text-white/80 transition-colors absolute top-6 left-6 bg-black/30 backdrop-blur-sm rounded px-2 py-1'
          >
            <ChevronLeft size={16} /> 上一頁
          </button>
        </div>

        {/* 右欄：操作區 */}
        <div className='flex-1 md:order-2 w-full md:w-3/5 bg-white flex flex-col p-5 md:p-12 md:overflow-y-auto'>
          <div className='flex flex-col gap-6 md:mt-8'>
            <div>
              <h2 className='text-xl md:text-2xl font-semibold text-neutral-dark mb-3 font-notoSerif'>
                自動憑證辨識
              </h2>
              <p className='text-sm md:text-base'>
                如何取得合法憑證是一間公司合法節稅的核心觀念，但憑證有百百種，什麼才是合法，什麽憑證才可以抵稅？
                EasyTax
                可以大幅降低日常立帳時遇到的資料輸入煩惱，也可以針對您的憑證類別及業態去建議
                適合的會計科目， 請上傳一張憑證看看 EasyTax 如何幫到您。
              </p>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={e => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => !uploading && inputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg overflow-hidden flex flex-col items-center gap-4 cursor-pointer transition-colors ${
                dragging
                  ? 'border-brand-blue bg-brand-blue/5'
                  : previewUrl || isPdf
                    ? 'border-brand-blue'
                    : 'border-neutral-blue-gray/50 hover:border-brand-blue'
              }`}
            >
              {previewUrl ? (
                /* 圖片預覽 */
                <div className='relative w-full'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt='憑證預覽'
                    className='w-full max-h-72 object-contain bg-surface-off-white'
                  />
                </div>
              ) : isPdf ? (
                /* PDF 預覽 */
                <div
                  ref={el => setPdfContainerRef(el)}
                  className='relative w-full overflow-hidden bg-surface-off-white'
                >
                  {isClient && isPdfWorkerReady && pdfFile && (
                    <Document
                      file={pdfFile}
                      options={pdfOptions}
                      loading={
                        <div className='flex items-center justify-center h-48'>
                          <Loader2
                            size={24}
                            className='text-brand-blue animate-spin'
                          />
                        </div>
                      }
                      error={
                        <div className='flex items-center justify-center h-48 text-sm text-semantic-error'>
                          PDF 無法載入，請重新上傳
                        </div>
                      }
                    >
                      <Page
                        pageNumber={1}
                        width={containerWidth || 400}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Document>
                  )}
                  {uploading && (
                    <div className='absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-2'>
                      <Loader2
                        size={28}
                        className='text-brand-blue animate-spin'
                      />
                      <p className='text-sm font-medium text-brand-blue'>
                        辨識中...
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* 預設空狀態 */
                <div className='p-5 md:p-10 flex flex-col items-center gap-3 md:gap-4'>
                  <Paperclip
                    size={24}
                    className='text-neutral-mid md:w-9 md:h-9'
                  />
                  <p className='text-sm font-medium text-neutral-dark'>
                    請將憑證檔案拉到這裡
                  </p>
                  <p className='text-xs text-neutral-dark/50 text-center'>
                    或是上傳照片/檔案（{MAX_SIZE_MB}MB 以內 - JPG/PNG/PDF）
                  </p>
                  <Button variant='outline' size='sm' type='button'>
                    選擇上傳檔案
                  </Button>
                </div>
              )}
              <input
                ref={inputRef}
                type='file'
                accept='.jpg,.jpeg,.png,.pdf'
                className='hidden'
                onChange={onInputChange}
              />
            </div>

            {fileError && (
              <p className='text-sm text-semantic-error'>{fileError}</p>
            )}
            {isEncryptedPdf && (
              <p className='text-sm text-semantic-error'>
                這是一份加密的 PDF，無法進行辨識
              </p>
            )}
            {isNotVoucher && (
              <p className='text-sm text-neutral-dark/60'>
                （此張可能不是一張憑證發票）
              </p>
            )}
          </div>

          <MobileFixedBottom className='flex justify-center md:justify-center'>
            <button
              type='button'
              onClick={() => dispatch({ type: 'SKIP_VOUCHER' })}
              className={btnTextLink}
            >
              我沒有憑證，請直接跳過
            </button>
          </MobileFixedBottom>
        </div>
      </div>
    </>
  );
}
