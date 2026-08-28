/**
 * 帳簿總覽三張圖表卡片的純聚合函式：逐日/逐週趨勢點展開、管道/廠商 Top5 + 其他。
 * 放在 feature 層而非 src/lib/：這些函式知道 LedgerDailyAmount 等帳簿領域型別，屬於帳簿業務知識。
 */
import type { LedgerDailyAmount } from '@/api/types';
import { formatRocDate, parseRocDate } from '@/components/ui/DatePicker';
import { CATEGORICAL_SERIES, OTHER_SERIES_COLOR } from '@/components/ui/charts/chartTheme';
import { formatYmd } from './transaction/data';

export type TrendGranularity = 'day' | 'week';

export interface LedgerTrendPoint {
  /** 唯一 key，同時作為選取比對：日 → 西元 'YYYYMMDD'；週 → 'YYYYMMDD~YYYYMMDD' */
  key: string;
  /** X 軸標籤：'3/27' */
  label: string;
  /** tooltip 用的完整區間敘述（民國年），如「115/03/21 – 115/03/27」 */
  tooltipLabel: string;
  value: number;
  /** 可直接寫進 URL 的 ROC 'YYY/MM/DD'；日檢視 from === to */
  from: string;
  to: string;
}

/**
 * 依 ROC 起訖展開逐日/逐週趨勢點。
 * dailyAmounts 的 date 為西元 YYYYMMDD，缺漏日期補 0
 * （趨勢圖不可跳過無交易的日子，否則長條間距失真）。
 * 週檢視自 rangeFrom 起每 7 天一組，最後一組可能不足 7 天，
 * 與既有 src/components/ui/TrendChart.tsx 的 toWeekly 分組方式一致。
 */
export function buildTrendPoints(
  rangeFrom: string,
  rangeTo: string,
  granularity: TrendGranularity,
  dailyAmounts: LedgerDailyAmount[],
): LedgerTrendPoint[] {
  const from = parseRocDate(rangeFrom);
  const to = parseRocDate(rangeTo);
  if (!from || !to || from.getTime() > to.getTime()) return [];

  const amountByYmd = new Map(dailyAmounts.map(p => [p.date, p.issuedAmount]));

  const days: { date: Date; value: number }[] = [];
  for (const cursor = new Date(from); cursor.getTime() <= to.getTime(); cursor.setDate(cursor.getDate() + 1)) {
    const date = new Date(cursor);
    days.push({ date, value: amountByYmd.get(formatYmd(date) ?? '') ?? 0 });
  }

  if (granularity === 'day') {
    return days.map(({ date, value }) => {
      const roc = formatRocDate(date);
      return {
        key: formatYmd(date) ?? roc,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        tooltipLabel: roc,
        value,
        from: roc,
        to: roc,
      };
    });
  }

  const weeks: LedgerTrendPoint[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    const first = chunk[0].date;
    const last = chunk[chunk.length - 1].date;
    const fromRoc = formatRocDate(first);
    const toRoc = formatRocDate(last);
    weeks.push({
      key: `${formatYmd(first)}~${formatYmd(last)}`,
      label: `${first.getMonth() + 1}/${first.getDate()}`,
      tooltipLabel: fromRoc === toRoc ? fromRoc : `${fromRoc} – ${toRoc}`,
      value: chunk.reduce((sum, d) => sum + d.value, 0),
      from: fromRoc,
      to: toRoc,
    });
  }
  return weeks;
}

/** 「其他」彙總項的 uuid 值；第五名以後的項目彙總於此，不可用於篩選 */
export const OTHER_SHARE_KEY = '__other__';

export interface ChannelShareDatum {
  /** === OTHER_SHARE_KEY 時為第五名以後彙總；null 代表未指定管道/廠商。兩者皆不可下鑽 */
  uuid: string | null;
  label: string;
  value: number;
  color: string;
  /** false 代表點擊不應觸發篩選（「其他」與「未指定」） */
  selectable: boolean;
}

/**
 * 依金額由大到小取前 topN(=4)，其餘彙總為「其他」並固定套 OTHER_SERIES_COLOR，
 * 上限共 4 彩色類別 + 1 其他＝5 段（甜甜圈圖分類數，DESIGN.md §11.3）。
 * 金額為 0 的項目不列入（避免出現空白扇形）。不足 topN 筆時不產生「其他」列。
 * ⚠️ uuid 為 null（未指定管道/廠商）的項目維持獨立顯示，但標記為不可下鑽——
 * 後端 filter API 目前只接受實際的管道/廠商 uuid，無法篩選「未指定」這個狀態，
 * 故該項僅顯示金額、處理方式與「其他」相同。
 */
export function buildTopShares(entries: { uuid: string | null; label: string; value: number }[], topN = 4): ChannelShareDatum[] {
  const sorted = entries
    .filter(e => e.value > 0)
    .slice()
    .sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN);

  let colorIndex = 0;
  const result: ChannelShareDatum[] = top.map(e => {
    const isUnassigned = e.uuid === null;
    const datum: ChannelShareDatum = {
      uuid: e.uuid,
      label: e.label,
      value: e.value,
      color: isUnassigned ? OTHER_SERIES_COLOR : CATEGORICAL_SERIES[colorIndex % CATEGORICAL_SERIES.length],
      selectable: !isUnassigned,
    };
    if (!isUnassigned) colorIndex += 1;
    return datum;
  });

  if (rest.length > 0) {
    result.push({
      uuid: OTHER_SHARE_KEY,
      label: '其他',
      value: rest.reduce((sum, e) => sum + e.value, 0),
      color: OTHER_SERIES_COLOR,
      selectable: false,
    });
  }

  return result;
}
