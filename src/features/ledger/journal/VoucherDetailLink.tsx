'use client';

import { fetchDailyDetail, fetchSettleEventRelations } from '@/api/ledger';
import type { SettleChannel } from '@/api/types';
import { appendReturnQuery } from '@/features/bank-accounts/urlState';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface VoucherDetailLinkProps {
  ledgerUuid: string;
  className?: string;
}

const baseClass = 'inline-flex items-center rounded p-1 text-neutral-mid hover:text-brand-blue';
const BANK_ACCOUNTS_HREF = '/bank-accounts';

/** 從沖帳事件回應的收／付款管道中找出銀行帳戶那筆；同一事件實務上最多一筆銀行管道 */
function findBankAccountUuid(channels: SettleChannel[] | undefined): string | undefined {
  return channels?.find(c => c.isBankAccount)?.bankAccountUuid;
}

/** window.open 是真的瀏覽器導覽、不會走 Next router，需自行帶上 basePath '/etlite'（見 signLinkFor 同樣作法） */
function openInNewTab(path: string): void {
  window.open(`${window.location.origin}/etlite${path}`, '_blank', 'noopener,noreferrer');
}

/**
 * 日記帳總覽「查看細節」連結，統一導向銀行帳戶總覽。
 *
 * GET /ael/ledger/daily（日記帳總覽列表 API）目前不會回傳 settleEventUuid（實測恆缺，
 * 即便該分錄確實關聯沖帳事件），故無法直接沿用列表資料，點擊時才用 ledgerUuid 反查：
 * 1. GET /ael/ledger/entries/dailyDetail?ledgerUuid=... 取得 settleEventUuids（可靠來源，逐行帶 settleEventUuid）
 * 2. 無 settleEventUuids → 這筆分錄本來就未關聯任何沖帳事件（如純應收/應付調整），退回銀行帳戶總覽列表頁
 * 3. 取第一筆 settleEventUuid，GET /ael/ledger/settle/event 查詳情；
 *    銀行帳戶藏在 depositChannels／paymentChannels 裡 isBankAccount 那筆（回應無扁平 bankAccountUuid 欄位，見 types.ts 註解）
 * 4. 找到銀行帳戶 → 有 bankAccountUuid＋settleEventUuid 即可直接導去該筆交易明細頁
 *    /bank-accounts/{settleEventUuid}?account={bankAccountUuid}（該頁就是靠這兩個 uuid 打
 *    GET /ael/bankAccounts/transactions/detail 查單筆，見 BankTransactionDetailView）
 * 5. 找不到（現金沖帳等非銀行管道）或任一查詢失敗 → 退回銀行帳戶總覽列表頁
 *
 * 目的網址要等查詢完才知道，故不用 <a>，改在 click handler 內用 window.open 以新分頁開啟，
 * 不影響日記帳總覽本身的瀏覽狀態。
 */
export default function VoucherDetailLink({ ledgerUuid, className }: VoucherDetailLinkProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { settleEventUuids } = await fetchDailyDetail({ ledgerUuid });
      const settleEventUuid = settleEventUuids[0];
      if (!settleEventUuid) {
        openInNewTab(BANK_ACCOUNTS_HREF);
        return;
      }

      const relations = await fetchSettleEventRelations({ settleEventUuid });
      const bankAccountUuid = findBankAccountUuid(relations.depositChannels) ?? findBankAccountUuid(relations.paymentChannels);
      if (bankAccountUuid) {
        const href = appendReturnQuery(`/bank-accounts/${settleEventUuid}?account=${bankAccountUuid}`, `account=${bankAccountUuid}`);
        openInNewTab(href);
      } else {
        openInNewTab(BANK_ACCOUNTS_HREF);
      }
    } catch {
      // 查詢失敗時仍開新分頁退回銀行帳戶總覽列表頁，導覽動作不額外顯示錯誤訊息
      openInNewTab(BANK_ACCOUNTS_HREF);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={handleClick} title="查看細節" className={className ?? baseClass}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
    </button>
  );
}
