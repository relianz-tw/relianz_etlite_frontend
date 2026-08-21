'use client';

import { fetchDailyDetail, fetchEntryDetail } from '@/api/ledger';
import { listBankAccounts } from '@/api/bankAccounts';
import type { DailyDetailLineDto } from '@/api/types';
import JournalCard from '@/components/ui/JournalCard';
import VoucherPreviewCard from '@/components/ui/VoucherPreviewCard';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { subMonths } from 'date-fns';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import BankTransactionSummaryCard from './components/BankTransactionSummaryCard';
import LinkedTransactionList from './components/LinkedTransactionList';
import { loadBankTransactions, loadLinkedTransactions } from './data';
import type { BankTxnRow, LinkedLedgerTxn } from './types';
import { resolveBankAccountsBackHref } from './urlState';

interface BankTransactionDetailViewProps {
  /** 沖帳事件 uuid（BankTxnRow.settleEventUuid） */
  transactionId: string;
  /** 銀行帳戶 uuid，來自網址 ?account=，供查詢該帳戶的沖帳事件列表 */
  accountUuid: string;
  returnQuery?: string;
}

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/** 從列表頁帶回的查詢字串取出當時的期間篩選；缺值時回退「近一個月」，比照 BankAccountsView 的預設區間 */
function resolveDateRange(returnQuery?: string): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const defaultFrom = toYmd(subMonths(today, 1));
  const defaultTo = toYmd(today);
  if (!returnQuery) return { dateFrom: defaultFrom, dateTo: defaultTo };
  const params = new URLSearchParams(returnQuery);
  return { dateFrom: params.get('dateFrom') || defaultFrom, dateTo: params.get('dateTo') || defaultTo };
}

/**
 * 銀行帳戶交易明細頁：呈現單筆沖帳事件的完整資訊，以及與其關聯的帳簿交易清單、憑證照片與日記帳分錄。
 * 後端無單筆查詢端點，故沿用列表頁同一份資料（依 returnQuery 帶回的期間查詢）以 settleEventUuid 找回該筆。
 */
export default function BankTransactionDetailView({ transactionId, accountUuid, returnQuery }: BankTransactionDetailViewProps) {
  const [row, setRow] = useState<BankTxnRow | null>(null);
  const [linked, setLinked] = useState<LinkedLedgerTxn[]>([]);
  const [linkedLoading, setLinkedLoading] = useState(false);
  const [linkedError, setLinkedError] = useState('');
  const [voucherImage, setVoucherImage] = useState<string | null>(null);
  const [counterpartyName, setCounterpartyName] = useState<string | null>(null);
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
        const accounts = await listBankAccounts();
        const account = accounts.find(a => a.bankAccountUuid === accountUuid);
        if (!account) {
          if (!cancelled) setError('找不到此銀行帳戶');
          return;
        }
        const { dateFrom, dateTo } = resolveDateRange(returnQuery);
        const rows = await loadBankTransactions(account.bankAccountUuid, dateFrom, dateTo);
        const found = rows.find(r => r.settleEventUuid === transactionId);
        if (!found) {
          if (!cancelled) setError('找不到此筆交易，請從銀行帳戶總覽重新進入');
          return;
        }
        if (cancelled) return;
        setRow(found);

        setLinkedLoading(true);
        loadLinkedTransactions(found.originLedgerUuids, found.settleEventUuid)
          .then(items => {
            if (!cancelled) setLinked(items);
          })
          .catch(err => {
            if (!cancelled) setLinkedError(getFriendlyErrorMessage(err));
          })
          .finally(() => {
            if (!cancelled) setLinkedLoading(false);
          });

        if (found.primaryOriginLedgerUuid) {
          fetchEntryDetail({ ledgerUuid: found.primaryOriginLedgerUuid })
            .then(detail => {
              if (cancelled) return;
              setVoucherImage(detail.invoice?.invoicePicUrl || null);
              setCounterpartyName(detail.entry.counterpartyName || null);
            })
            .catch(() => {
              /* 憑證圖載入失敗時維持空狀態即可，不阻擋其餘資訊顯示 */
            });
        }

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
  }, [accountUuid, transactionId, returnQuery]);

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6">
          <Link href={backHref} className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue">
            <ChevronLeft size={16} />
            返回銀行帳戶總覽
          </Link>
          <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">交易明細</h1>
        </div>

        {loading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
        ) : error ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{error}</div>
        ) : row ? (
          <div className="nav:grid nav:grid-cols-[380px_1fr] nav:items-start nav:gap-8">
            <div className="mb-5 nav:sticky nav:top-20 nav:mb-0">
              <VoucherPreviewCard voucherImage={voucherImage} />
            </div>
            <div className="flex flex-col gap-5">
              <BankTransactionSummaryCard row={row} counterpartyName={counterpartyName} />
              <LinkedTransactionList items={linked} loading={linkedLoading} error={linkedError} />
              <JournalCard lines={dailyLines} defaultOpen />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
