'use client';

import { fetchPayablesPaidSummary, fetchPayablesSummary, fetchReceivablesCollectedSummary, fetchReceivablesSummary } from '@/api/ledgerSummary';
import type { LedgerDailyAmount } from '@/api/types';
import { parseRocDate } from '@/components/ui/DatePicker';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useState } from 'react';
import { buildTopShares, mergeDailyAmounts, mergeShareEntries, type ChannelShareDatum } from './summary';
import { formatYmd } from './transaction/data';
import type { LedgerTotals, Side } from './types';

interface UseLedgerSummaryResult {
  dailyAmounts: LedgerDailyAmount[];
  shares: ChannelShareDatum[];
  /** 交易金額大數字／管道佔比用（chartRange 區間）；載入中維持 null 避免顯示殘留數字 */
  totals: LedgerTotals | null;
  /** 收款／付款狀況卡用（ytdRange，年初至今，恆定不隨 chartRange 變動） */
  ytdTotals: LedgerTotals | null;
  loading: boolean;
  error: string;
}

/** 呼叫同一 side 底下的主端點（未結清）＋已收已付端點（已結清），組出該區間的 LedgerTotals */
function fetchSideSummary(side: Side, body: { dateFrom?: string; dateTo?: string }): Promise<{ dailyAmounts: LedgerDailyAmount[]; shares: ChannelShareDatum[]; totals: LedgerTotals }> {
  return side === 'sales'
    ? Promise.all([fetchReceivablesSummary(body), fetchReceivablesCollectedSummary(body)]).then(([main, collected]) => ({
        dailyAmounts: mergeDailyAmounts(main.dailyAmounts, collected.dailyAmounts),
        // 銷售管道佔比為應收＋已收款兩個口徑加總後的金額，故合併 main 與 collected 各自的 channelShares
        shares: buildTopShares(
          mergeShareEntries(
            main.channelShares.map(c => ({ uuid: c.paymentChannelUuid, label: c.channelName, value: c.amount })),
            collected.channelShares.map(c => ({ uuid: c.paymentChannelUuid, label: c.channelName, value: c.amount })),
          ),
        ),
        totals: {
          transaction: main.issuedVoucherAmount + collected.issuedVoucherAmount,
          outstanding: main.issuedVoucherAmount,
          settled: collected.issuedVoucherAmount,
        },
      }))
    : Promise.all([fetchPayablesSummary(body), fetchPayablesPaidSummary(body)]).then(([main, paid]) => ({
        dailyAmounts: mergeDailyAmounts(main.dailyAmounts, paid.dailyAmounts),
        // 廠商佔比為應付＋已付款兩個口徑加總後的金額，故合併 main 與 paid 各自的 vendorShares
        shares: buildTopShares(
          mergeShareEntries(
            main.vendorShares.map(v => ({ uuid: v.counterpartyUuid, label: v.counterpartyName, value: v.amount })),
            paid.vendorShares.map(v => ({ uuid: v.counterpartyUuid, label: v.counterpartyName, value: v.amount })),
          ),
        ),
        totals: {
          transaction: main.receivedVoucherAmount + paid.receivedVoucherAmount,
          outstanding: main.receivedVoucherAmount,
          settled: paid.receivedVoucherAmount,
        },
      }));
}

/**
 * 帳簿總覽三張卡片（交易金額趨勢／管道·廠商佔比／收款·付款狀況）共用的資料來源。
 * ⚠️ 恆同時呼叫同一 side 底下的兩支端點（不隨子分頁切換）：
 *   - 主端點（receivables/summary、payables/summary，transaction_date 口徑）：未結清原單。
 *   - 已收／已付端點（receivables/collected/summary、payables/paid/summary，entry_date 口徑）：已結清原單。
 *   兩者是互斥的兩批單（非同一份資料拆出的已收/未收兩半），故 totals.transaction／逐日趨勢皆為
 *   前端將兩者相加（見 mergeDailyAmounts、LedgerTotals.transaction），管道／廠商佔比同樣依 uuid
 *   合併加總（見 mergeShareEntries），不是只取主端點單一口徑。
 * ⚠️ 兩組區間各自呼叫一次上述兩支端點：
 *   - chartRange（圖表區間）→ totals／dailyAmounts／shares，供交易金額趨勢卡與佔比卡使用。
 *   - ytdRange（年初至今，恆定）→ ytdTotals，供收款／付款狀況卡使用，不隨 chartRange 變動。
 * ⚠️ 兩組請求都只依 side + range 決定，不吃子分頁，讓卡片呈現「該期間固定的數字」，不會因為切
 * 應收帳款／已收款（或應付帳款／已付款）子分頁而跳動；子分頁只影響下方列表。
 * ⚠️ body 刻意不帶管道／廠商篩選：點了某個管道之後，佔比圖若只剩一根長條會語意錯亂，
 * 使用者也會失去切換到其他管道的入口，故本 hook 恆抓「全部管道／廠商」的區間彙總。
 * ⚠️ chartRange 與列表的日期篩選（filters.advanced）刻意解耦，理由見 LedgerView 內 chartRange 的註解。
 */
export function useLedgerSummary(
  side: Side,
  chartRange: { from: string; to: string },
  ytdRange: { from: string; to: string },
): UseLedgerSummaryResult {
  const [dailyAmounts, setDailyAmounts] = useState<LedgerDailyAmount[]>([]);
  const [shares, setShares] = useState<ChannelShareDatum[]>([]);
  const [totals, setTotals] = useState<LedgerTotals | null>(null);
  const [ytdTotals, setYtdTotals] = useState<LedgerTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setTotals(null);
    setYtdTotals(null);

    const toBody = (range: { from: string; to: string }) => ({
      dateFrom: formatYmd(parseRocDate(range.from)),
      dateTo: formatYmd(parseRocDate(range.to)),
    });

    Promise.all([fetchSideSummary(side, toBody(chartRange)), fetchSideSummary(side, toBody(ytdRange))])
      .then(([chart, ytd]) => {
        if (cancelled) return;
        setDailyAmounts(chart.dailyAmounts);
        setShares(chart.shares);
        setTotals(chart.totals);
        setYtdTotals(ytd.totals);
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
  }, [side, chartRange.from, chartRange.to, ytdRange.from, ytdRange.to]);

  return { dailyAmounts, shares, totals, ytdTotals, loading, error };
}
