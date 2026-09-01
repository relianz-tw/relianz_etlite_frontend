'use client';

import { fetchEntryDetail } from '@/api/ledger';
import type { EntryDetailAllowanceDto, EntryDetailEntryDto } from '@/api/types';
import { buttonClassName } from '@/components/ui/Button';
import { getFriendlyErrorMessage } from '@/lib/errors';
import TransactionAllowanceListCard from '@/features/ledger/transaction/components/TransactionAllowanceListCard';
import TransactionMetaCard from '@/features/ledger/transaction/components/TransactionMetaCard';
import TransactionOriginCard from '@/features/ledger/transaction/components/TransactionOriginCard';
import VoucherUpload from '@/features/ledger/transaction/components/VoucherUpload';
import { EMPTY_TRANSACTION_FORM, mapInvoiceDetailToForm, resolveExpenseCategory } from '@/features/ledger/transaction/data';
import type { TransactionFormState } from '@/features/ledger/transaction/types';
import type { Side } from '@/features/ledger/types';
import InvoiceDeclareStatusCard from './components/InvoiceDeclareStatusCard';
import { ChevronLeft, SquarePen } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface VatInvoiceDetailViewProps {
  side: Side;
  ledgerUuid: string;
  isVoid: boolean;
}

const SIDE_LABEL: Record<Side, string> = { sales: '銷項', purchase: '進項' };

/** 營業稅中心「憑證細節」內頁：與帳簿交易細節頁（TransactionFormView）架構相同，
 *  但收斂為純檢視——不顯示沖帳狀態／日記帳、折讓紀錄唯讀不可新增、交易資訊全唯讀，
 *  需要編輯一律導向 /ledger/{id}。不呼叫 fetchDailyDetail（日記帳不顯示，省去無用請求）。 */
export default function VatInvoiceDetailView({ side, ledgerUuid, isVoid }: VatInvoiceDetailViewProps) {
  const [form, setForm] = useState<TransactionFormState>(EMPTY_TRANSACTION_FORM);
  const [entryDetail, setEntryDetail] = useState<EntryDetailEntryDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState('');

  const [isAllowance, setIsAllowance] = useState(false);
  const [allowances, setAllowances] = useState<EntryDetailAllowanceDto[]>([]);
  // invoice.ourInvoiceType（憑證種類代號，值域 1~7）：僅此範圍內才顯示「折讓紀錄」區塊
  const [ourInvoiceType, setOurInvoiceType] = useState<number | null>(null);
  const [originLedgerUuid, setOriginLedgerUuid] = useState('');
  const [originEntry, setOriginEntry] = useState<EntryDetailEntryDto | null>(null);
  const [originLoading, setOriginLoading] = useState(false);
  const [originError, setOriginError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setDetailLoading(true);
    setDetailError('');
    fetchEntryDetail({ ledgerUuid })
      .then(async result => {
        if (cancelled) return;
        const expenseCategory = await resolveExpenseCategory(result.entry);
        if (cancelled) return;
        const allowanceFlag = result.isAllowance ?? result.invoice?.isAllowance ?? false;
        setForm({
          ...mapInvoiceDetailToForm(side, result.invoice),
          expenseCategory,
          channel: result.entry.paymentChannelUuid ?? '',
          isAllowance: allowanceFlag,
          ...(side === 'sales' ? { buyerName: result.entry.counterpartyName ?? '' } : {}),
        });
        setEntryDetail(result.entry);
        setIsAllowance(allowanceFlag);
        setAllowances(result.allowances ?? []);
        setOurInvoiceType(result.invoice?.ourInvoiceType ?? null);
        setOriginLedgerUuid(allowanceFlag ? result.originLedgerUuid ?? '' : '');
      })
      .catch(err => {
        if (cancelled) return;
        setDetailError(getFriendlyErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [side, ledgerUuid]);

  // 折讓單追加查詢一次原單完整資訊，供「原始交易憑證」卡片顯示；失敗僅記錄錯誤，不阻擋主畫面
  useEffect(() => {
    if (!originLedgerUuid) {
      setOriginEntry(null);
      setOriginError('');
      return;
    }
    let cancelled = false;
    setOriginLoading(true);
    setOriginError('');
    fetchEntryDetail({ ledgerUuid: originLedgerUuid })
      .then(result => {
        if (cancelled) return;
        setOriginEntry(result.entry);
      })
      .catch(err => {
        if (cancelled) return;
        setOriginEntry(null);
        setOriginError(getFriendlyErrorMessage(err, '載入原始交易憑證失敗'));
      })
      .finally(() => {
        if (!cancelled) setOriginLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [originLedgerUuid]);

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6">
          <Link href="/business-tax" className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue">
            <ChevronLeft size={16} />
            返回營業稅中心
          </Link>
          <p className="text-sm text-neutral-mid">營業稅中心 / {SIDE_LABEL[side]}憑證細節</p>
        </div>

        {detailLoading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
        ) : detailError ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{detailError}</div>
        ) : (
          <div className="nav:grid nav:grid-cols-[380px_1fr] nav:items-start nav:gap-8">
            <div className="mb-5 flex flex-col gap-4 nav:sticky nav:top-20 nav:mb-0">
              <VoucherUpload mode="edit" fileName={form.voucherFileName} previewUrl={form.voucherPreviewUrl} onFileChange={() => {}} readOnly />
            </div>

            <div className="flex flex-col gap-5">
              {entryDetail && (
                <InvoiceDeclareStatusCard
                  declarePeriod={form.declarePeriod}
                  declared={form.declared}
                  isVoid={isVoid}
                  side={side}
                  deductible={form.deductible}
                  unreportedReason={form.unreportedReason}
                />
              )}

              <TransactionMetaCard
                side={side}
                mode="edit"
                form={form}
                onChange={() => {}}
                readOnly
                headerAction={
                  <Link href={`/ledger/${ledgerUuid}?side=${side}`} className={buttonClassName('outline', 'sm')}>
                    <SquarePen size={14} />
                    前往交易頁編輯
                  </Link>
                }
              />

              {isAllowance && (
                <TransactionOriginCard
                  side={side}
                  originLedgerUuid={originLedgerUuid}
                  loading={originLoading}
                  error={originError}
                  entry={originEntry}
                  basePath="/business-tax"
                />
              )}

              {!isAllowance && entryDetail && ourInvoiceType !== null && ourInvoiceType >= 1 && ourInvoiceType <= 7 && (
                <TransactionAllowanceListCard side={side} entry={entryDetail} allowances={allowances} basePath="/business-tax" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
