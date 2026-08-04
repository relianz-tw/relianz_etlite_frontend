'use client';

import type { BankAccountDto } from '@/api/types';
import StatCard from '@/components/ui/StatCard';
import { fmtCurrency } from '@/lib/utils';

interface AccountSummaryCardProps {
  account: BankAccountDto;
  /** 目前查詢期間內的存入合計 */
  depositTotal: number;
  /** 目前查詢期間內的支出合計 */
  expenseTotal: number;
}

/** 帳戶餘額摘要：目前餘額取自帳戶本身（不受期間篩選影響），存入/支出合計則依目前查詢期間計算 */
export default function AccountSummaryCard({ account, depositTotal, expenseTotal }: AccountSummaryCardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 nav:grid-cols-3">
      <StatCard
        label="目前餘額"
        value={fmtCurrency(account.currentBalance)}
        caption={`${account.bankName} ${account.branchName} · ${account.accountNo}`}
      />
      <StatCard label="本期存入合計" value={fmtCurrency(depositTotal)} valueClassName="text-semantic-success" />
      <StatCard label="本期支出合計" value={fmtCurrency(expenseTotal)} valueClassName="text-semantic-error" />
    </div>
  );
}
