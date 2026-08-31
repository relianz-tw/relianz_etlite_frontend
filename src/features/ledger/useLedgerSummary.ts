'use client';

import { fetchPayablesPaidSummary, fetchPayablesSummary, fetchReceivablesCollectedSummary, fetchReceivablesSummary } from '@/api/ledgerSummary';
import type { LedgerDailyAmount } from '@/api/types';
import { parseRocDate } from '@/components/ui/DatePicker';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useState } from 'react';
import { buildTopShares, mergeShareEntries, type ChannelShareDatum } from './summary';
import { formatYmd } from './transaction/data';
import type { LedgerTotals, Side } from './types';

interface UseLedgerSummaryResult {
  dailyAmounts: LedgerDailyAmount[];
  shares: ChannelShareDatum[];
  /** 卡片 A（趨勢大數字）／B（入帳狀況）用；載入中維持 null 避免顯示殘留數字 */
  totals: LedgerTotals | null;
  loading: boolean;
  error: string;
}

/**
 * 帳簿總覽三張卡片（趨勢／入帳狀況／管道·廠商佔比）共用的資料來源。
 * ⚠️ 恆同時呼叫同一 side 底下的兩支端點（不隨子分頁切換）：
 *   - 主端點（receivables/summary、payables/summary，transaction_date 口徑）：供趨勢圖逐日金額、
 *     卡片頂部大數字（totals.primary）使用。
 *   - 已收／已付端點（receivables/collected/summary、payables/paid/summary，entry_date 口徑）：
 *     取其 issuedVoucherAmount／receivedVoucherAmount 作為 totals.collected，供入帳狀況卡的第二個
 *     扇形使用。兩者是不同口徑的獨立數字（非同一份資料拆出的已收/未收兩半），故用 Promise.all 平行拉取。
 *   - 管道／廠商佔比另外例外：需求上是「應收/應付＋已收/已付款」加總後的數字，故 shares 由主端點與
 *     已收／已付端點的 channelShares／vendorShares 各自依 uuid 合併加總（見 mergeShareEntries），
 *     不是只取主端點單一口徑。
 * ⚠️ 兩支端點都只依 side + range 決定，不吃子分頁，讓三張卡呈現「該期間固定的數字」，不會因為切
 * 應收帳款／已收款（或應付帳款／已付款）子分頁而跳動；子分頁只影響下方列表。
 * ⚠️ body 刻意不帶管道／廠商篩選：點了某個管道之後，佔比圖若只剩一根長條會語意錯亂，
 * 使用者也會失去切換到其他管道的入口，故本 hook 恆抓「全部管道／廠商」的區間彙總。
 * ⚠️ range 用的是「圖表區間」（LedgerView 的 chartRange），不是列表的日期篩選（filters.advanced），
 * 兩者刻意解耦，理由見 LedgerView 內 chartRange 的註解。
 */
export function useLedgerSummary(side: Side, range: { from: string; to: string }): UseLedgerSummaryResult {
  const [dailyAmounts, setDailyAmounts] = useState<LedgerDailyAmount[]>([]);
  const [shares, setShares] = useState<ChannelShareDatum[]>([]);
  const [totals, setTotals] = useState<LedgerTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setTotals(null);

    const body = {
      dateFrom: formatYmd(parseRocDate(range.from)),
      dateTo: formatYmd(parseRocDate(range.to)),
    };

    const request =
      side === 'sales'
        ? Promise.all([fetchReceivablesSummary(body), fetchReceivablesCollectedSummary(body)]).then(([main, collected]) => ({
            dailyAmounts: main.dailyAmounts,
            // 銷售管道佔比為應收＋已收款兩個口徑加總後的金額，故合併 main 與 collected 各自的 channelShares
            shares: buildTopShares(
              mergeShareEntries(
                main.channelShares.map(c => ({ uuid: c.paymentChannelUuid, label: c.channelName, value: c.amount })),
                collected.channelShares.map(c => ({ uuid: c.paymentChannelUuid, label: c.channelName, value: c.amount })),
              ),
            ),
            totals: { primary: main.issuedVoucherAmount, collected: collected.issuedVoucherAmount },
          }))
        : Promise.all([fetchPayablesSummary(body), fetchPayablesPaidSummary(body)]).then(([main, paid]) => ({
            dailyAmounts: main.dailyAmounts,
            // 廠商佔比為應付＋已付款兩個口徑加總後的金額，故合併 main 與 paid 各自的 vendorShares
            shares: buildTopShares(
              mergeShareEntries(
                main.vendorShares.map(v => ({ uuid: v.counterpartyUuid, label: v.counterpartyName, value: v.amount })),
                paid.vendorShares.map(v => ({ uuid: v.counterpartyUuid, label: v.counterpartyName, value: v.amount })),
              ),
            ),
            totals: { primary: main.receivedVoucherAmount, collected: paid.receivedVoucherAmount },
          }));

    request
      .then(result => {
        if (cancelled) return;
        setDailyAmounts(result.dailyAmounts);
        setShares(result.shares);
        setTotals(result.totals);
      })
      .catch(err => {
        if (cancelled) return;
        setError(getFriendlyErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [side, range.from, range.to]);

  return { dailyAmounts, shares, totals, loading, error };
}
