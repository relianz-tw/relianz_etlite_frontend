'use client';

import { parseRocDate } from '@/components/ui/DatePicker';
import { dateRangeToPhase } from '@/lib/invoicePeriod';
import { ChevronRight, CircleCheck } from 'lucide-react';
import Link from 'next/link';
import { phaseRangeLabel } from './derive';
import TaskFigures from './TaskFigures';
import { RECONCILE_PATH, useVatReconcile } from './VatReconcileContext';

interface LedgerTaskPanelProps {
  /** 帳簿目前套用的日期區間（民國 YYY/MM/DD） */
  dateFrom: string;
  dateTo: string;
}

/**
 * 帳簿頁的即時任務列表（任務中心精簡版）。
 * 只在帳簿日期區間剛好是某一雙月期別、且該期已載入對帳結果時顯示，
 * 其餘情況（自訂區間、未申報、載入中或失敗）不佔版面。
 */
export default function LedgerTaskPanel({ dateFrom, dateTo }: LedgerTaskPanelProps) {
  const { rocYear, periods } = useVatReconcile();

  const from = parseRocDate(dateFrom);
  const to = parseRocDate(dateTo);
  const target = from && to ? dateRangeToPhase(from, to) : null;
  // Context 目前只載入當年度，其他年度沒有資料可顯示
  if (!target || target.rocYear !== rocYear) return null;

  const data = periods.find(p => p.phase === target.phase)?.data;
  if (!data) return null;

  const shortfalls = data.tasks.filter(task => task.kind === 'shortfall');
  if (data.status === 'notFiled' || (data.status === 'pending' && shortfalls.length === 0)) return null;

  return (
    <section
      aria-label="本期即時任務"
      className="flex flex-col gap-3 rounded-lg border border-neutral-blue-gray/30 bg-white p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-neutral-dark">
          {rocYear} 年 {phaseRangeLabel(target.phase)} 即時任務
        </h2>
        <Link
          href={`${RECONCILE_PATH}?phase=${target.phase}`}
          className="flex items-center gap-0.5 text-sm text-brand-primary hover:underline"
        >
          前往任務中心
          <ChevronRight size={16} />
        </Link>
      </div>

      {data.status === 'matched' ? (
        <p className="flex items-center gap-2 text-sm text-semantic-success">
          <CircleCheck size={16} />
          本期帳簿已與申報書一致
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shortfalls.map(task => (
            <li key={task.id} className="flex items-center justify-between gap-4 rounded-md bg-surface-off-white px-3 py-2">
              <span className="text-sm font-semibold text-neutral-dark">{task.title}</span>
              <TaskFigures amount={task.amount} tax={task.tax} size="sm" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
