'use client';

import { fetchDailyDetail } from '@/api/ledger';
import type { DailyDetailLineDto } from '@/api/types';
import JournalCard from '@/components/ui/JournalCard';
import VoucherPreviewCard from '@/components/ui/VoucherPreviewCard';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import BankTransactionSummaryCard from './components/BankTransactionSummaryCard';
import LinkedTransactionList from './components/LinkedTransactionList';
import { loadBankTransactionDetail } from './data';
import type { BankTxnRow } from './types';
import { resolveBankAccountsBackHref } from './urlState';

interface BankTransactionDetailViewProps {
  /** 沖帳事件 uuid（BankTxnRow.settleEventUuid） */
  transactionId: string;
  /** 銀行帳戶 uuid，來自網址 ?account=，供查詢該筆沖帳事件明細 */
  accountUuid: string;
  returnQuery?: string;
}

/**
 * 銀行帳戶交易明細頁：呈現單筆沖帳事件的完整資訊，以及與其關聯的帳簿交易清單、憑證照片與日記帳分錄。
 * 改用單筆查詢端點（GET /ael/bankAccounts/transactions/detail），直接分享網址／重新整理皆可查到該筆。
 */
export default function BankTransactionDetailView({ transactionId, accountUuid, returnQuery }: BankTransactionDetailViewProps) {
  const [row, setRow] = useState<BankTxnRow | null>(null);
  const [voucherImage, setVoucherImage] = useState<string | null>(null);
  const [dailyLines, setDailyLines] = useState<DailyDetailLineDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const backHref = resolveBankAccountsBackHref(returnQuery);

  useEffect(() => {
    if (!accountUuid) {
      setError('缺少帳戶資訊，請從銀行帳戶總覽點擊查看');
      setLoading(false);
      return;
    }
    let cancelled = false;

    const load = async () => {
      try {
        const { row: found, invoicePicUrl } = await loadBankTransactionDetail(accountUuid, transactionId);
        if (cancelled) return;
        setRow(found);
        setVoucherImage(invoicePicUrl);

        if (found.mainSettlementLedgerUuid) {
          fetchDailyDetail({ ledgerUuid: found.mainSettlementLedgerUuid })
            .then(detail => {
              if (!cancelled) setDailyLines(detail.lines);
            })
            .catch(() => {
              /* 日記帳載入失敗時維持空清單即可，不阻擋其餘資訊顯示 */
            });
        }
      } catch (err) {
        if (!cancelled) setError(getFriendlyErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    setError('');
    load();

    return () => {
      cancelled = true;
    };
  }, [accountUuid, transactionId]);

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6">
          <Link href={backHref} className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue">
            <ChevronLeft size={16} />
            返回銀行帳戶總覽
          </Link>
          <h1 className="mx-auto max-w-[760px] font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">
            交易明細
          </h1>
        </div>

        {loading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
        ) : error ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{error}</div>
        ) : row ? (
          voucherImage ? (
            <div className="nav:grid nav:grid-cols-[380px_1fr] nav:items-start nav:gap-8">
              <div className="mb-5 nav:sticky nav:top-20 nav:mb-0">
                <VoucherPreviewCard voucherImage={voucherImage} />
              </div>
              <div className="flex flex-col gap-5">
                <BankTransactionSummaryCard row={row} />
                <LinkedTransactionList items={row.details} />
                <JournalCard lines={dailyLines} defaultOpen />
              </div>
            </div>
          ) : (
            // 無憑證圖（多為匯總沖帳，無單一憑證可顯示）時不保留空的憑證欄位，改單欄呈現
            <div className="mx-auto flex max-w-[760px] flex-col gap-5">
              <BankTransactionSummaryCard row={row} />
              <LinkedTransactionList items={row.details} />
              <JournalCard lines={dailyLines} defaultOpen />
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
