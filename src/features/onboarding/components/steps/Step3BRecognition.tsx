'use client';

import { useOnboarding } from '../../state/OnboardingContext';
import { type InBillType } from '../../state/onboardingReducer';
import { btnPrimaryDisableable } from '../../styles';
import Field from '../Field';
import { lookupCompany } from '@/api/onboarding/companyLookup';
import {
  recognizeInvoice,
  type GuiSubjectCandidate,
} from '@/api/onboarding/voucherUpload';
import { MobileFixedBottom } from '@/components/onboarding/MobileFixedBottom';
import DatePicker, {
  formatRocDate,
  parseRocDate,
} from '@/components/ui/DatePicker';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { transportation } from '@/data/transportation';
import { ensurePdfWorker } from '@/lib/pdfWorker';
import { AlertTriangle, ChevronLeft, Loader2, X, Zap } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
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

const VOUCHER_TYPE_LABEL: Record<number, string> = {
  1: '銷項',
  2: '進項',
};

const IN_BILL_TYPES: InBillType[] = [
  '發票',
  '交通票證',
  '水電帳單',
  '進口稅單',
  '其他',
];

function isoToTaiwanDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${Number(y) - 1911}/${m}/${d}`;
}

/** 從 AI 回傳的 gui_type 推導進項憑證類型，沿用 inBillInfo 對應規則 */
function deriveInBillType(guiType: number | undefined): InBillType {
  switch (guiType) {
    case 2:
    case 3:
    case 4:
    case 5:
      return '發票';
    case 6:
      return '交通票證';
    case 7:
      return '水電帳單';
    case 8:
      return '進口稅單';
    default:
      return '其他';
  }
}

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-surface-cream ${className}`} />
  );
}

const initialAiFields = {
  inBillType: false,
  invoicePrefix: false,
  invoiceNumber: false,
  date: false,
  sellerTaxId: false,
  sellerName: false,
  buyerTaxId: false,
  buyerName: false,
  amount: false,
  taxFreeAmount: false,
  tax: false,
  others: false,
  total: false,
  transportationId: false,
};

export function Step3BRecognition() {
  const { state, dispatch } = useOnboarding();
  const { voucher, company, taxId } = state;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isPdfWorkerReady, setIsPdfWorkerReady] = useState(false);

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
  const [aiFields, setAiFields] = useState(initialAiFields);
  const [localFields, setLocalFields] = useState({
    voucherType: 0,
    inBillType: '發票' as InBillType,
    invoicePrefix: '',
    invoiceNumber: '',
    transportationId: '',
    date: '',
    sellerTaxId: '',
    sellerName: '',
    buyerTaxId: '',
    buyerName: '',
    amount: '',
    taxFreeAmount: '',
    tax: '',
    others: '',
    total: '',
  });

  const fetchRecognition = async () => {
    if (!voucher.voucherId) return;
    setError(false);
    setLoading(true);
    try {
      const data = await recognizeInvoice({
        file: voucher.voucherId,
        companyDescription: company.description ?? undefined,
        companySalesMode: company.salesMode ?? undefined,
      });
      const item = data.items[0];
      if (!item) throw new Error('辨識結果為空，請重試');

      const isUnknown = item.invoice_direction === 'unknown';
      const isBuy = item.invoice_direction === 'buy' || isUnknown;

      const inBillType = isBuy ? deriveInBillType(item.gui_type) : '發票';

      // 交通票證：從 seller_tax_id 比對 transportation 找出交通工具 id
      const matchedTransportation = transportation.find(
        t => t.id === item.seller_tax_id
      );
      const transportationId =
        isBuy && inBillType === '交通票證'
          ? matchedTransportation
            ? matchedTransportation.id
            : '0'
          : '';

      dispatch({
        type: 'SET_VOUCHER_RECOGNITION_RESULT',
        payload: {
          recognizedData: {
            voucherType: isBuy ? 2 : 1,
            inBillType,
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
            transportationId,
            isUnknownDirection: isUnknown,
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
    } catch (err) {
      setError(true);
      toast.error(err instanceof Error ? err.message : '憑證辨識失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecognition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 辨識完成後填入欄位，並將所有欄位標記為 AI 帶入
  useEffect(() => {
    if (!voucher.recognizedData) return;
    const d = voucher.recognizedData;
    setLocalFields({
      voucherType: d.voucherType,
      inBillType: d.inBillType ?? '發票',
      invoicePrefix: d.invoicePrefix ?? '',
      invoiceNumber: d.invoiceNumber ?? '',
      transportationId: d.transportationId ?? '',
      date: d.date ? isoToTaiwanDate(d.date) : '',
      sellerTaxId: d.sellerTaxId ?? '',
      sellerName: d.sellerName ?? '',
      buyerTaxId: d.buyerTaxId ?? '',
      buyerName: d.buyerName ?? '',
      amount: String(d.amount ?? ''),
      taxFreeAmount: String(d.taxFreeAmount ?? ''),
      tax: String(d.tax ?? ''),
      others: String(d.others ?? ''),
      total: String(d.total ?? ''),
    });
    setAiFields({
      inBillType: !!d.inBillType,
      invoicePrefix: !!d.invoicePrefix,
      invoiceNumber: !!d.invoiceNumber,
      transportationId: !!d.transportationId,
      date: !!d.date,
      sellerTaxId: !!d.sellerTaxId,
      sellerName: !!d.sellerName,
      buyerTaxId: !!d.buyerTaxId,
      buyerName: !!d.buyerName,
      amount: d.amount != null,
      taxFreeAmount: d.taxFreeAmount != null && d.taxFreeAmount !== 0,
      tax: d.tax != null,
      others: !!d.others,
      total: d.total != null,
    });
  }, [voucher.recognizedData]);

  // 背景查詢辨識結果中缺少的買/賣家公司名稱
  useEffect(() => {
    if (!voucher.recognizedData) return;
    const d = voucher.recognizedData;

    if (d.sellerTaxId && !d.sellerName) {
      lookupCompany(d.sellerTaxId)
        .then(result => {
          if (!result.companyName) return;
          const name = result.companyName;
          setLocalFields(prev => {
            if (prev.sellerName) return prev; // 使用者已手動填入，不覆蓋
            return { ...prev, sellerName: name };
          });
          setAiFields(prev => ({ ...prev, sellerName: true }));
        })
        .catch(() => {}); // 靜默失敗，不打擾用戶
    }

    if (d.buyerTaxId && !d.buyerName) {
      lookupCompany(d.buyerTaxId)
        .then(result => {
          if (!result.companyName) return;
          const name = result.companyName;
          setLocalFields(prev => {
            if (prev.buyerName) return prev; // 使用者已手動填入，不覆蓋
            return { ...prev, buyerName: name };
          });
          setAiFields(prev => ({ ...prev, buyerName: true }));
        })
        .catch(() => {}); // 靜默失敗，不打擾用戶
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voucher.recognizedData]);

  const setField = (key: keyof typeof localFields, value: string) => {
    setLocalFields(prev => ({ ...prev, [key]: value }));
    setAiFields(prev => ({ ...prev, [key]: false }));
  };

  // 追蹤哪個金額欄位正在編輯（聚焦顯示原始數字，失焦帶千分位）
  const [focusedAmountField, setFocusedAmountField] = useState<string | null>(
    null
  );

  const amountDisplay = (key: string, raw: string) => {
    if (focusedAmountField === key || !raw) return raw;
    const num = Number(raw);
    return isNaN(num) ? raw : num.toLocaleString('zh-TW');
  };

  const handleAmountChange = (
    key: keyof typeof localFields,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setField(key, e.target.value.replace(/,/g, ''));
  };

  const handleInBillTypeChange = (type: InBillType) => {
    setLocalFields(prev => ({
      ...prev,
      inBillType: type,
      // 切換類型時清掉交通工具與其他稅費，但保留發票號碼
      transportationId: '',
      others: '',
    }));
    setAiFields(prev => ({
      ...prev,
      inBillType: false,
      transportationId: false,
      others: false,
    }));
  };

  const handleTransportationChange = (v: string) => {
    setField('transportationId', v);
    // 選已知交通工具時自動帶入賣家資訊
    const t = transportation.find(item => item.id === v);
    if (t && v !== '0') {
      setLocalFields(prev => ({
        ...prev,
        transportationId: v,
        sellerTaxId: t.id,
        sellerName: t.name,
      }));
      setAiFields(prev => ({
        ...prev,
        transportationId: false,
        sellerTaxId: false,
        sellerName: false,
      }));
    }
  };

  const isInProgress = loading;
  const isInBill = localFields.voucherType === 2;
  const inBillType = localFields.inBillType;

  // 根據辨識到的統編與使用者公司統編對比決定標題
  const recognizedSellerTaxId = voucher.recognizedData?.sellerTaxId ?? '';
  const recognizedBuyerTaxId = voucher.recognizedData?.buyerTaxId ?? '';
  const invoiceTitle = (() => {
    if (!voucher.recognizedData) return '';
    if (taxId && recognizedSellerTaxId === taxId) return '這是一張銷項發票';
    if (taxId && recognizedBuyerTaxId === taxId)
      return `這是一張進項${
        isInBill && inBillType !== '發票' ? inBillType : '發票'
      }`;
    return '這有可能不是屬於你的發票喔！';
  })();

  // 交通票證：若選非 '0' 的交通工具，自動帶入賣家資訊
  const selectedTransportation = transportation.find(
    t => t.id === localFields.transportationId
  );
  const isOtherTransportation =
    localFields.transportationId === '0' || !localFields.transportationId;

  const canProceed = !loading && voucher.recognizedData !== null;

  // 金額不符警告：正確公式 總金額 = 銷售額 + 免稅銷售額 + 稅額（+ 其他稅費）
  const showAmountWarning = (() => {
    if (!localFields.total) return false;
    const amount = Number(localFields.amount || 0);
    const taxFreeAmount = Number(localFields.taxFreeAmount || 0);
    const tax = Number(localFields.tax || 0);
    const total = Number(localFields.total);

    if (inBillType === '其他' || !isInBill) {
      return total !== amount + taxFreeAmount + tax;
    }
    if (inBillType === '進口稅單') {
      return (
        total !== amount + taxFreeAmount + tax + Number(localFields.others || 0)
      );
    }
    return total !== amount + taxFreeAmount + tax;
  })();

  return (
    <div className='flex flex-col md:flex-row min-h-full md:flex-1 md:min-h-0'>
      {/* Lightbox：fixed 掛在最外層，手機/桌機都有效 */}
      {lightboxOpen && voucher.previewUrl && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/80'
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className='absolute top-4 right-4 text-white/80 hover:text-white'
          >
            <X size={28} />
          </button>
          {voucher.isPdf ? (
            isClient &&
            isPdfWorkerReady && (
              <div
                onClick={e => e.stopPropagation()}
                className='max-w-[90vw] max-h-[90vh] overflow-auto rounded-lg bg-white'
              >
                <Document file={voucher.previewUrl} options={pdfOptions}>
                  <Page
                    pageNumber={1}
                    width={700}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>
              </div>
            )
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={voucher.previewUrl}
              alt='憑證預覽'
              onClick={e => e.stopPropagation()}
              className='max-w-[90vw] max-h-[90vh] object-contain rounded-lg'
            />
          )}
        </div>
      )}
      {/* 左欄：費用類別建議面板 */}
      <div className='order-2 md:order-1 w-full md:w-2/5 bg-surface-off-white text-neutral-dark flex flex-col md:flex-none px-5 pt-4 pb-4 md:p-12 md:overflow-y-auto gap-4'>
        <button
          onClick={() => dispatch({ type: 'PREV_STEP' })}
          className='hidden md:flex items-center gap-1 text-sm text-neutral-dark/50 hover:text-neutral-dark transition-colors'
        >
          <ChevronLeft size={16} /> 上一頁
        </button>
        {/* 上傳圖片預覽（桌面版）*/}
        <div className='hidden md:contents'>
          {voucher.previewUrl &&
            (voucher.isPdf ? (
              isClient &&
              isPdfWorkerReady && (
                <div
                  onClick={() => setLightboxOpen(true)}
                  className='w-full rounded-lg overflow-hidden bg-surface-cream cursor-zoom-in'
                >
                  <Document file={voucher.previewUrl} options={pdfOptions}>
                    <Page
                      pageNumber={1}
                      width={320}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                </div>
              )
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={voucher.previewUrl}
                alt='憑證預覽'
                onClick={() => setLightboxOpen(true)}
                className='w-full rounded-lg object-contain max-h-[30rem] bg-surface-cream cursor-zoom-in'
              />
            ))}
        </div>

        <h2 className='text-lg font-semibold font-notoSerif'>
          費用類別及稅務資訊
        </h2>
        <p className='text-sm text-neutral-dark/60 leading-relaxed'>
          以下是系統自動依照發票內容以及您的業務範圍所判斷的可能費用類別，請您選擇最符合的類別。成功入帳後仍可以變更費用類別。
        </p>

        {loading && (
          <div className='flex items-center gap-2 text-sm text-neutral-dark/60'>
            <Loader2 size={14} className='animate-spin' /> 分析中...
          </div>
        )}

        {error && !loading && (
          <div className='flex flex-col gap-3'>
            <p className='text-sm text-neutral-dark/70'>AI 分析載入失敗</p>
            <button
              onClick={fetchRecognition}
              className='rounded border border-neutral-dark/30 text-neutral-dark text-sm px-4 py-2 hover:bg-neutral-dark/5'
            >
              重試
            </button>
          </div>
        )}

        {/* 費用類別推薦卡片 */}
        {voucher.suggestions.map(s => {
          const isSelected = voucher.selectedSuggestionId === s.id;
          return (
            <button
              key={s.id}
              type='button'
              onClick={() =>
                dispatch({ type: 'SELECT_SUGGESTION', payload: s.id })
              }
              className={`w-full text-left rounded-lg p-4 bg-white transition-all border ${
                isSelected
                  ? 'ring-2 ring-brand-blue border-brand-blue'
                  : 'border-surface-cream'
              }`}
            >
              {/* 標題列：編號 + 科目名稱（大項） + radio */}
              <div className='flex items-start justify-between gap-2 mb-3'>
                <p className='text-sm font-semibold text-neutral-dark leading-snug'>
                  {s.id + 1}. {s.accountSubject}（{s.category}）
                </p>
                <div
                  className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center ${
                    isSelected ? 'border-brand-blue' : 'border-neutral-blue-gray/50'
                  }`}
                >
                  {isSelected && (
                    <div className='w-2.5 h-2.5 rounded-full bg-brand-blue' />
                  )}
                </div>
              </div>
              {/* 內容 */}
              <div className='flex flex-col gap-1 text-xs text-neutral-dark/80 leading-relaxed'>
                <p>
                  <span className='font-medium'>科目：</span>
                  {s.accountSubject}
                </p>
                {s.taxInfo && (
                  <p>
                    <span className='font-medium'>節稅：</span>
                    {s.taxInfo}
                  </p>
                )}
                <p>
                  <span className='font-medium'>建議：</span>
                  {s.advice}
                </p>
              </div>
            </button>
          );
        })}

        <p className='text-xs text-neutral-dark/40 pt-4'>
          * AI 辨識有可能會出錯，請確認內容無誤
        </p>
      </div>

      {/* 右欄：辨識結果表單 */}
      <div className='order-1 md:order-2 w-full md:w-3/5 bg-white flex flex-col p-5 md:p-12 md:overflow-y-auto'>
        {/* 手機版憑證照片（白色區塊頂端）*/}
        <div className='md:hidden pb-4'>
          {voucher.previewUrl &&
            (voucher.isPdf ? (
              isClient &&
              isPdfWorkerReady && (
                <div
                  onClick={() => setLightboxOpen(true)}
                  className='w-full rounded-lg overflow-hidden bg-surface-cream cursor-zoom-in'
                >
                  <Document file={voucher.previewUrl} options={pdfOptions}>
                    <Page
                      pageNumber={1}
                      width={320}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                </div>
              )
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={voucher.previewUrl}
                alt='憑證預覽'
                onClick={() => setLightboxOpen(true)}
                className='w-full rounded-lg object-contain max-h-[22rem] bg-surface-cream cursor-zoom-in'
              />
            ))}
        </div>
        <div className='flex flex-col gap-4'>
          <div>
            <h1 className='text-xl font-bold text-neutral-dark font-notoSerif'>
              {invoiceTitle}
            </h1>
            <p className='text-xs text-neutral-dark/50 mt-1 flex items-center gap-1'>
              <Zap
                size={11}
                className='text-semantic-success'
                fill='currentColor'
              />
              表示由 AI 自動帶入，可手動修改
            </p>
          </div>

          {!voucher.recognizedData ? (
            <div className='flex flex-col gap-3'>
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          ) : (
            <div className='flex flex-col gap-4'>
              {/* 進項憑證類型切換器（僅進項時顯示） */}
              {isInBill && (
                <div className='flex flex-col gap-1'>
                  <label className='text-sm font-medium text-neutral-dark'>
                    憑證類型
                  </label>
                  {/* 手機版：flex-wrap 多行排列 */}
                  <div className='flex flex-wrap gap-2 md:hidden'>
                    {IN_BILL_TYPES.map(type => (
                      <button
                        key={type}
                        type='button'
                        onClick={() => handleInBillTypeChange(type)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          inBillType === type
                            ? 'bg-brand-blue text-white border-brand-blue'
                            : 'bg-white text-neutral-dark border-neutral-blue-gray/50 hover:border-brand-blue'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  {/* 桌機版：等寬分段切換 */}
                  <div className='hidden md:block'>
                    <SegmentedControl
                      options={IN_BILL_TYPES.map(t => ({ value: t, label: t }))}
                      value={inBillType}
                      onChange={handleInBillTypeChange}
                    />
                  </div>
                </div>
              )}

              {/* 發票：號碼（字軌合併顯示在號碼欄位前） */}
              {(!isInBill || inBillType === '發票') && (
                <Field
                  label='發票號碼'
                  value={localFields.invoicePrefix + localFields.invoiceNumber}
                  onChange={e => {
                    setLocalFields(prev => ({
                      ...prev,
                      invoicePrefix: '',
                      invoiceNumber: e.target.value,
                    }));
                    setAiFields(prev => ({
                      ...prev,
                      invoicePrefix: false,
                      invoiceNumber: false,
                    }));
                  }}
                  placeholder='AB12345678'
                  aiFilled={aiFields.invoicePrefix || aiFields.invoiceNumber}
                />
              )}

              {/* 交通票證：票號 */}
              {isInBill && inBillType === '交通票證' && (
                <Field
                  label='票號'
                  value={localFields.invoiceNumber}
                  onChange={e => setField('invoiceNumber', e.target.value)}
                  placeholder='請輸入 10 碼票號'
                  inputMode='numeric'
                  aiFilled={aiFields.invoiceNumber}
                />
              )}

              {/* 水電帳單：變動載具號碼 */}
              {isInBill && inBillType === '水電帳單' && (
                <Field
                  label='變動載具號碼'
                  value={localFields.invoiceNumber}
                  onChange={e => setField('invoiceNumber', e.target.value)}
                  placeholder='請輸入 10 碼載具號碼'
                  inputMode='numeric'
                  aiFilled={aiFields.invoiceNumber}
                />
              )}

              {/* 進口稅單：海關代徵號碼 */}
              {isInBill && inBillType === '進口稅單' && (
                <Field
                  label='海關代徵營業稅繳納證號碼'
                  value={localFields.invoiceNumber}
                  onChange={e => setField('invoiceNumber', e.target.value)}
                  placeholder='前三碼英文，共 14 碼'
                  aiFilled={aiFields.invoiceNumber}
                />
              )}

              {/* 開立日期（全部類型都顯示） */}
              <div className='flex flex-col gap-1'>
                <label className='text-sm font-medium text-neutral-dark'>
                  {isInBill && inBillType === '進口稅單'
                    ? '進口貨物日期'
                    : '開立日期'}
                </label>
                <DatePicker
                  value={parseRocDate(localFields.date)}
                  onChange={date => setField('date', formatRocDate(date))}
                  placeholder='115/02/09'
                  aiFilled={aiFields.date}
                />
              </div>

              {/* 交通票證：交通工具選擇 */}
              {isInBill && inBillType === '交通票證' && (
                <div className='flex flex-col gap-2'>
                  <label className='text-sm font-medium text-neutral-dark'>
                    交通工具
                  </label>
                  <SegmentedControl
                    options={transportation.map(t => ({
                      value: t.id,
                      label: t.label,
                    }))}
                    value={localFields.transportationId}
                    onChange={handleTransportationChange}
                    fit
                  />
                </div>
              )}

              {/* 賣家統一編號（發票、水電、其他、交通票證選「其他」時顯示） */}
              {(!isInBill ||
                inBillType === '發票' ||
                inBillType === '水電帳單' ||
                inBillType === '其他' ||
                (inBillType === '交通票證' && isOtherTransportation)) && (
                <Field
                  label='賣家統一編號'
                  maxLength={8}
                  inputMode='numeric'
                  value={localFields.sellerTaxId}
                  onChange={e =>
                    setField(
                      'sellerTaxId',
                      e.target.value.replace(/\D/g, '').slice(0, 8)
                    )
                  }
                  aiFilled={aiFields.sellerTaxId}
                />
              )}

              {/* 交通票證選已知交通工具時，賣家統編唯讀 */}
              {isInBill &&
                inBillType === '交通票證' &&
                !isOtherTransportation && (
                  <Field
                    label='賣家統一編號'
                    value={localFields.sellerTaxId}
                    onChange={e => setField('sellerTaxId', e.target.value)}
                    aiFilled={aiFields.sellerTaxId}
                    disabled
                  />
                )}

              {/* 賣家名稱（發票、水電、其他、交通票證選「其他」時顯示） */}
              {(!isInBill ||
                inBillType === '發票' ||
                inBillType === '水電帳單' ||
                inBillType === '其他' ||
                (inBillType === '交通票證' && isOtherTransportation)) && (
                <Field
                  label='賣家名稱'
                  value={localFields.sellerName}
                  onChange={e => setField('sellerName', e.target.value)}
                  aiFilled={aiFields.sellerName}
                />
              )}

              {/* 交通票證選已知交通工具時，賣家名稱唯讀 */}
              {isInBill &&
                inBillType === '交通票證' &&
                !isOtherTransportation && (
                  <Field
                    label='賣家名稱'
                    value={selectedTransportation?.name ?? ''}
                    onChange={e => setField('sellerName', e.target.value)}
                    aiFilled={aiFields.sellerName}
                    disabled
                  />
                )}

              {/* 買家統一編號（非進口稅單才顯示） */}
              {(!isInBill || inBillType !== '進口稅單') && (
                <Field
                  label='買家統一編號'
                  maxLength={8}
                  inputMode='numeric'
                  value={localFields.buyerTaxId}
                  onChange={e =>
                    setField(
                      'buyerTaxId',
                      e.target.value.replace(/\D/g, '').slice(0, 8)
                    )
                  }
                  aiFilled={aiFields.buyerTaxId}
                />
              )}

              {/* 買家名稱（非進口稅單才顯示） */}
              {(!isInBill || inBillType !== '進口稅單') && (
                <Field
                  label='買家名稱'
                  value={localFields.buyerName}
                  onChange={e => setField('buyerName', e.target.value)}
                  aiFilled={aiFields.buyerName}
                />
              )}

              {/* 銷售額（「其他」類型不顯示） */}
              {(!isInBill || inBillType !== '其他') && (
                <Field
                  label={
                    isInBill && inBillType === '進口稅單'
                      ? '銷售額（營業稅稅基）'
                      : '銷售額'
                  }
                  inputMode='numeric'
                  prefix='$'
                  value={amountDisplay('amount', localFields.amount)}
                  onFocus={() => setFocusedAmountField('amount')}
                  onBlur={() => setFocusedAmountField(null)}
                  onChange={e => handleAmountChange('amount', e)}
                  aiFilled={aiFields.amount}
                />
              )}

              {/* 免稅銷售額（「其他」類型不顯示） */}
              {(!isInBill || inBillType !== '其他') && (
                <Field
                  label='免稅銷售額'
                  inputMode='numeric'
                  prefix='$'
                  value={amountDisplay(
                    'taxFreeAmount',
                    localFields.taxFreeAmount
                  )}
                  onFocus={() => setFocusedAmountField('taxFreeAmount')}
                  onBlur={() => setFocusedAmountField(null)}
                  onChange={e => handleAmountChange('taxFreeAmount', e)}
                  aiFilled={aiFields.taxFreeAmount}
                />
              )}

              {/* 稅額（「其他」類型不顯示） */}
              {(!isInBill || inBillType !== '其他') && (
                <Field
                  label={
                    isInBill && inBillType === '進口稅單'
                      ? '稅額（營業稅）'
                      : '稅額'
                  }
                  inputMode='numeric'
                  prefix='$'
                  value={amountDisplay('tax', localFields.tax)}
                  onFocus={() => setFocusedAmountField('tax')}
                  onBlur={() => setFocusedAmountField(null)}
                  onChange={e => handleAmountChange('tax', e)}
                  aiFilled={aiFields.tax}
                />
              )}

              {/* 其他稅費（僅進口稅單） */}
              {isInBill && inBillType === '進口稅單' && (
                <Field
                  label='其他稅費'
                  inputMode='numeric'
                  prefix='$'
                  value={amountDisplay('others', localFields.others)}
                  onFocus={() => setFocusedAmountField('others')}
                  onBlur={() => setFocusedAmountField(null)}
                  onChange={e => handleAmountChange('others', e)}
                  aiFilled={aiFields.others}
                />
              )}

              {/* 總金額（全部類型都顯示） */}
              <div className='flex flex-col gap-1'>
                <Field
                  label='總金額'
                  inputMode='numeric'
                  prefix='$'
                  value={amountDisplay('total', localFields.total)}
                  onFocus={() => setFocusedAmountField('total')}
                  onBlur={() => setFocusedAmountField(null)}
                  onChange={e => handleAmountChange('total', e)}
                  aiFilled={aiFields.total}
                />
                {showAmountWarning && (
                  <p className='flex items-center gap-1 text-xs text-semantic-error'>
                    <AlertTriangle size={12} className='shrink-0' />
                    {isInBill && inBillType === '進口稅單'
                      ? '總金額與銷售額 + 免稅銷售額 + 稅額 + 其他稅費不符，請確認'
                      : '總金額與銷售額 + 免稅銷售額 + 稅額不符，請確認'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <MobileFixedBottom>
          <button
            disabled={!canProceed}
            onClick={() => dispatch({ type: 'NEXT_STEP' })}
            className={`${btnPrimaryDisableable} w-full`}
          >
            {isInProgress ? '分析中，請稍候...' : '下一步'}
          </button>
        </MobileFixedBottom>
      </div>
    </div>
  );
}
