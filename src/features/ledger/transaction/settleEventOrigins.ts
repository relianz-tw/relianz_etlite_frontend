'use client';

import { fetchEntryDetail, fetchSettleEventRelations } from '@/api/ledger';
import type { EntryDetailResult } from '@/api/types';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { formatYyyymmddRoc } from '@/lib/utils';
import { useEffect, useState } from 'react';

/** 恢復沖帳確認彈窗顯示的關聯業務原單憑證摘要 */
export interface SettleOriginVoucher {
  ledgerUuid: string;
  /** 憑證開立日期，民國 YYY/MM/DD；無發票時退回交易發生日，仍取不到為空字串 */
  voucherDate: string;
  /** 憑證號碼（發票字軌＋號碼）；無發票為空字串 */
  voucherNumber: string;
  /** 銷項＝買受人、進項＝賣方 */
  counterpartyLabel: '買受人' | '賣方';
  counterpartyName: string;
  totalAmount: number;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** entry.entryType：0進項／1進折／2銷項／3銷折；2、3 為銷項，其餘為進項（比照 bank-accounts/data.ts） */
function isSalesEntry(entryType: number): boolean {
  return entryType === 2 || entryType === 3;
}

function mapEntryDetailToOrigin(ledgerUuid: string, detail: EntryDetailResult): SettleOriginVoucher {
  const { entry, invoice } = detail;
  const isSales = isSalesEntry(entry.entryType);
  // invoice.year/month/day 已是民國年，不走 formatYyyymmddRoc（該函式僅接受西元年 YYYYMMDD／ISO）；
  // 無發票（如未開立發票的應收/應付）退回交易發生日
  const voucherDate = invoice
    ? `${invoice.year}/${pad2(invoice.month)}/${pad2(invoice.day)}`
    : entry.transactionDate
      ? formatYyyymmddRoc(entry.transactionDate)
      : '';
  return {
    ledgerUuid,
    voucherDate,
    voucherNumber: invoice ? `${invoice.invoiceTrack}${invoice.invoiceNumber}` : '',
    counterpartyLabel: isSales ? '買受人' : '賣方',
    // 買受人姓名 invoice 明細無此欄位，改取 entry.counterpartyName（比照 TransactionFormView 讀取買家名稱的方式）；
    // 賣方優先用 invoice.companyName（進項適用），查無則同樣退回 entry.counterpartyName
    counterpartyName: (isSales ? entry.counterpartyName : invoice?.companyName || entry.counterpartyName) || '—',
    totalAmount: entry.totalAmount,
  };
}

/** 依沖帳事件 uuid 取得關聯業務原單憑證摘要：先查 settle/event 拿 originLedgerUuids，
 *  再逐筆打 fetchEntryDetail 補齊憑證欄位（該端點本身不含憑證資料） */
async function loadSettleEventOrigins(settleEventUuid: string): Promise<SettleOriginVoucher[]> {
  const relations = await fetchSettleEventRelations({ settleEventUuid });
  const details = await Promise.all(relations.originLedgerUuids.map(uuid => fetchEntryDetail({ ledgerUuid: uuid })));
  return details.map((detail, i) => mapEntryDetailToOrigin(relations.originLedgerUuids[i], detail));
}

/**
 * 懶載入沖帳事件關聯的業務原單憑證清單，供恢復沖帳確認彈窗顯示「本次將恢復的交易」；
 * 僅在 settleEventUuid 非 null（彈窗開啟）時才發出請求，換一筆事件會重新抓取，
 * 已抓過的同一筆不重抓（比照 useLazyLinkedTransactions 寫法）。
 */
export function useSettleEventOrigins(settleEventUuid: string | null) {
  const [origins, setOrigins] = useState<SettleOriginVoucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchedUuid, setFetchedUuid] = useState<string | null>(null);

  useEffect(() => {
    if (!settleEventUuid || fetchedUuid === settleEventUuid) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    loadSettleEventOrigins(settleEventUuid)
      .then(result => {
        if (cancelled) return;
        setOrigins(result);
        setFetchedUuid(settleEventUuid);
      })
      .catch(err => {
        if (!cancelled) setError(getFriendlyErrorMessage(err, '載入關聯交易失敗'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [settleEventUuid, fetchedUuid]);

  // 換一筆沖帳事件時，避免尚未抓完前短暫顯示上一筆的殘留資料
  return { origins: fetchedUuid === settleEventUuid ? origins : [], loading, error };
}
