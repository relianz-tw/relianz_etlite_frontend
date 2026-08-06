'use client';

import { listBankAccounts } from '@/api/bankAccounts';
import VoucherPreviewCard from '@/components/ui/VoucherPreviewCard';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import BankTransactionSummaryCard from './components/BankTransactionSummaryCard';
import LinkedTransactionList from './components/LinkedTransactionList';
import { getBankTransaction } from './data';
import type { BankTransactionRow } from './types';
import { resolveBankAccountsBackHref } from './urlState';

interface BankTransactionDetailViewProps {
  transactionId: string;
  /** 銀行帳戶 uuid，來自網址 ?account=，供查詢帳戶餘額以重新計算此筆交易的累計餘額 */
  accountUuid: string;
  returnQuery?: string;
}

/**
 * 銀行帳戶交易明細頁：呈現單筆交易的完整資訊，以及與其關聯的帳簿交易清單（一筆銀行交易可能對應
 * 多筆帳簿分錄），每筆關聯交易皆可導向其編輯頁。資料來源見 data.ts 檔首 TODO 說明。
 */
export default function BankTransactionDetailView({ transactionId, accountUuid, returnQuery }: BankTransactionDetailViewProps) {
  const [row, setRow] = useState<BankTransactionRow | null>(null);
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
        const account = accounts.find(a => a.uuid === accountUuid);
        if (!account) {
          if (!cancelled) setError('找不到此銀行帳戶');
          return;
        }
        const result = await getBankTransaction(account.uuid, account.currentBalance, transactionId);
        if (cancelled) return;
        if (!result) {
          setError('找不到此筆交易');
          return;
        }
        setRow(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '操作失敗');
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
          <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">交易明細</h1>
        </div>

        {loading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
        ) : error ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{error}</div>
        ) : row ? (
          <div className="nav:grid nav:grid-cols-[380px_1fr] nav:items-start nav:gap-8">
            <div className="mb-5 nav:sticky nav:top-20 nav:mb-0">
              <VoucherPreviewCard voucherImage={row.voucherImage} />
            </div>
            <div className="flex flex-col gap-5">
              <BankTransactionSummaryCard row={row} />
              <LinkedTransactionList items={row.linkedTransactions} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
