'use client';

import { createPayable, createReceivable, fetchEntryDetail } from '@/api/ledger';
import type { CreatePayableBody, CreateReceivableBody, EntryDetailEntryDto, EntryDetailSettlementDto } from '@/api/types';
import Button from '@/components/ui/Button';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import VoidConfirmDialog from '../components/VoidConfirmDialog';
import type { Side } from '../types';
import { appendReturnQuery, resolveLedgerBackHref } from '../urlState';
import TransactionAllowanceCard from './components/TransactionAllowanceCard';
import TransactionAmountCard from './components/TransactionAmountCard';
import TransactionMetaCard from './components/TransactionMetaCard';
import TransactionSettlementHistory from './components/TransactionSettlementHistory';
import TransactionSettlementStatus from './components/TransactionSettlementStatus';
import TransactionStatusSummary from './components/TransactionStatusSummary';
import VoucherUpload from './components/VoucherUpload';
import { EMPTY_TRANSACTION_FORM, formatYmd, mapInvoiceDetailToForm, VOUCHER_KIND_MAP, VOUCHER_TYPES } from './data';
import type { TransactionFormState, TransactionMode } from './types';

interface TransactionFormViewProps {
  mode: TransactionMode;
  side: Side;
  transactionId?: string;
  returnQuery?: string;
}

const SIDE_LABEL: Record<Side, string> = { sales: '銷項', purchase: '進項' };
const IMPORT_VOUCHER_TYPE = VOUCHER_TYPES[3]; // 進口稅單

/** 送出前檢查必填欄位，回傳第一個錯誤訊息；全部通過回傳 null */
function validateForm(side: Side, form: TransactionFormState): string | null {
  const counterpartyName = side === 'purchase' ? form.sellerName : form.buyerName;
  if (!counterpartyName.trim()) return side === 'purchase' ? '請輸入賣家名稱' : '請輸入交易對象名稱';
  if (!form.issueDate) return '請選擇開立日期';
  if (!form.expenseCategory?.id) return side === 'purchase' ? '請選擇費用類別' : '請選擇收入科目';
  if (side === 'purchase') {
    const isImport = form.voucherType === IMPORT_VOUCHER_TYPE;
    const invoiceNum = form.voucherType === VOUCHER_TYPES[0] ? form.invoiceSerial : form.invoiceNumber;
    if (!isImport && !invoiceNum.trim()) return '請輸入發票號碼';
  } else if (!form.invoiceSerial.trim()) {
    return '請輸入發票號碼';
  }
  return null;
}

/** 進項發票號碼組裝：一般發票拆為字軌+流水號，其他憑證種類以憑證編號當純號碼 */
function buildPayableInvoice(form: TransactionFormState): Pick<CreatePayableBody, 'alphabeticLetter' | 'invoiceNum'> {
  if (form.voucherType === VOUCHER_TYPES[0]) {
    return { alphabeticLetter: form.invoiceTrack || undefined, invoiceNum: form.invoiceSerial || undefined };
  }
  return { invoiceNum: form.invoiceNumber || undefined };
}

function buildPayableBody(form: TransactionFormState): Omit<CreatePayableBody, 'companyUuid'> {
  const isImport = form.voucherType === IMPORT_VOUCHER_TYPE;
  return {
    ...buildPayableInvoice(form),
    counterpartyName: form.sellerName,
    counterpartyTaxId: form.sellerTaxId || undefined,
    // 有填統編視為廠商(0)，否則視為個人(1)
    counterpartyType: form.sellerTaxId ? 0 : 1,
    datetime: formatYmd(form.issueDate)!,
    deductible: form.deductible,
    entryDate: formatYmd(form.payDate),
    ifDebit: form.isAllowance,
    importTaxNumber: isImport ? form.importTaxNumber || undefined : undefined,
    invoiceDate: formatYmd(form.issueDate)!,
    isReturnGoods: isImport ? false : undefined,
    memo: form.note || undefined,
    netAmount: form.salesAmount,
    officialAccountingSubjectId: form.expenseCategory!.id!,
    others: isImport ? form.others : undefined,
    taxAmount: form.taxAmount,
    taxFreeAmount: form.exemptSalesAmount,
    totalAmount: form.salesAmount + form.exemptSalesAmount + form.taxAmount,
    unreportedReason: form.deductible ? undefined : form.unreportedReason || undefined,
    voucherKind: VOUCHER_KIND_MAP[form.voucherType] ?? 1,
  };
}

/** 銷項發票號碼組裝：字軌（invoiceTrack）+ 流水號（invoiceSerial），與進項一般發票輸入模式一致 */
function buildReceivableInvoice(form: TransactionFormState): Pick<CreateReceivableBody, 'alphabeticLetter' | 'invoiceNum'> {
  return { alphabeticLetter: form.invoiceTrack || undefined, invoiceNum: form.invoiceSerial };
}

function buildReceivableBody(form: TransactionFormState): Omit<CreateReceivableBody, 'companyUuid'> {
  return {
    ...buildReceivableInvoice(form),
    counterpartyName: form.buyerName,
    counterpartyTaxId: form.buyerTaxId || undefined,
    counterpartyType: form.buyerTaxId ? 0 : 1,
    datetime: formatYmd(form.issueDate)!,
    entryDate: formatYmd(form.payDate),
    ifDebit: form.isAllowance,
    invoiceDate: formatYmd(form.issueDate)!,
    memo: form.note || undefined,
    netAmount: form.salesAmount,
    officialAccountingSubjectId: form.expenseCategory!.id!,
    paymentChannelUuid: form.channel || undefined,
    taxAmount: form.taxAmount,
    taxFreeAmount: form.exemptSalesAmount,
    totalAmount: form.salesAmount + form.exemptSalesAmount + form.taxAmount,
    voucherKind: 1,
  };
}

export default function TransactionFormView({ mode, side, transactionId, returnQuery }: TransactionFormViewProps) {
  const router = useRouter();
  const [form, setForm] = useState<TransactionFormState>(EMPTY_TRANSACTION_FORM);
  const [voidConfirmOpen, setVoidConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const backHref = resolveLedgerBackHref(returnQuery);

  // 編輯畫面掛載時向 GET /ael/ledger/entries/detail 取得真實資料；新增畫面不需要，維持 EMPTY_TRANSACTION_FORM
  const [detailLoading, setDetailLoading] = useState(mode === 'edit');
  const [detailError, setDetailError] = useState('');
  const [entryDetail, setEntryDetail] = useState<EntryDetailEntryDto | null>(null);
  const [settlements, setSettlements] = useState<EntryDetailSettlementDto[]>([]);

  useEffect(() => {
    if (mode !== 'edit' || !transactionId) return;
    let cancelled = false;
    setDetailLoading(true);
    setDetailError('');
    fetchEntryDetail({ ledgerUuid: transactionId })
      .then(result => {
        if (cancelled) return;
        setForm(mapInvoiceDetailToForm(side, result.invoice));
        setEntryDetail(result.entry);
        setSettlements(result.settlements);
      })
      .catch(err => {
        if (cancelled) return;
        setDetailError(err instanceof Error ? err.message : '操作失敗');
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, side, transactionId]);

  const handleChange = (patch: Partial<TransactionFormState>) => setForm(f => ({ ...f, ...patch }));
  const handleFileChange = (fileName: string, previewUrl: string) =>
    handleChange({ voucherFileName: fileName, voucherPreviewUrl: previewUrl });

  const handleSideChange = (next: Side) => router.push(appendReturnQuery(`/ledger/new?side=${next}`, returnQuery));

  // 編輯畫面（更新/作廢/刪除）本次未串接後端，維持既有視覺模擬
  const backToLedger = () => router.push(backHref);
  const totalAmount = form.salesAmount + form.exemptSalesAmount + form.taxAmount;

  const handleCreate = async () => {
    const error = validateForm(side, form);
    if (error) {
      setSubmitError(error);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      if (side === 'purchase') {
        await createPayable(buildPayableBody(form));
      } else {
        await createReceivable(buildReceivableBody(form));
      }
      router.push(backHref);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '操作失敗');
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumb = mode === 'create' ? `帳簿 / 新增${SIDE_LABEL[side]}交易` : `帳簿 / ${SIDE_LABEL[side]}交易細節`;

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 py-7 nav:px-7">
        <div className="mb-6 flex flex-col gap-4 nav:flex-row nav:items-start nav:justify-between">
          <div>
            <Link href={backHref} className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue">
              <ChevronLeft size={16} />
              返回帳簿
            </Link>
            <p className="text-sm text-neutral-mid">{breadcrumb}</p>
          </div>
          {mode === 'create' && (
            <div className="w-full nav:w-64">
              <SegmentedControl
                options={[
                  { value: 'sales', label: '銷項' },
                  { value: 'purchase', label: '進項' },
                ]}
                value={side}
                onChange={handleSideChange}
                size="md"
              />
            </div>
          )}
        </div>

        {detailLoading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
        ) : detailError ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{detailError}</div>
        ) : (
          <div className="nav:grid nav:grid-cols-[380px_1fr] nav:items-start nav:gap-8">
            <div className="mb-5 flex flex-col gap-4 nav:sticky nav:top-20 nav:mb-0">
              <VoucherUpload mode={mode} fileName={form.voucherFileName} previewUrl={form.voucherPreviewUrl} onFileChange={handleFileChange} />
            </div>

            <div className="flex flex-col gap-5">
              {mode === 'edit' && <TransactionStatusSummary side={side} declarePeriod={form.declarePeriod} />}
              {mode === 'edit' && entryDetail && <TransactionSettlementStatus entry={entryDetail} />}
              <TransactionMetaCard side={side} mode={mode} form={form} onChange={handleChange} />
              <TransactionAmountCard side={side} mode={mode} form={form} onChange={handleChange} />
              {side === 'sales' && mode === 'edit' && <TransactionAllowanceCard />}
              {mode === 'edit' && <TransactionSettlementHistory settlements={settlements} />}

              {mode === 'create' && submitError && <p className="text-sm text-semantic-error">{submitError}</p>}

              <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-neutral-blue-gray/20 bg-surface-off-white px-4 py-4 nav:static nav:mx-0 nav:border-0 nav:bg-transparent nav:px-0 nav:py-0">
                {mode === 'create' && (
                  <Button variant="primary" className="w-full nav:w-auto" onClick={handleCreate} disabled={submitting}>
                    {submitting ? '建立中…' : '建立交易'}
                  </Button>
                )}
                {mode === 'edit' && (
                  <>
                    <Button
                      variant="danger"
                      className="flex-1 nav:flex-none"
                      onClick={side === 'sales' ? () => setVoidConfirmOpen(true) : backToLedger}
                    >
                      {side === 'sales' ? '作廢' : '刪除'}
                    </Button>
                    <Button variant="primary" className="flex-1 nav:flex-none" onClick={backToLedger}>
                      更新
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {mode === 'edit' && side === 'sales' && (
        <VoidConfirmDialog
          open={voidConfirmOpen}
          onClose={() => setVoidConfirmOpen(false)}
          onConfirm={backToLedger}
          transactionId={form.invoiceNumber}
          amount={totalAmount}
        />
      )}
    </div>
  );
}
