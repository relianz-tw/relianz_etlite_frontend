'use client';

import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { getFriendlyErrorMessage } from '@/lib/errors';
import LockedBanner from '../components/LockedBanner';
import { useLock } from '../components/LockContext';
import WithholdingTabs from '../components/WithholdingTabs';
import { fmtCurrency } from '@/lib/utils';
import { FileDown, Pencil, Plus, Trash2, UserCog } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useActiveEmployees, useAvailableYears } from './useEmployees';
import { useDeletePayrollMonth, usePayrollYearSummaries } from './usePayroll';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function SalaryListView() {
  const router = useRouter();
  const { isLocked } = useLock();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { years } = useAvailableYears();
  const yearParam = Number(searchParams.get('year'));
  const year = years.includes(yearParam) ? yearParam : years[0];

  const { employees: activeEmployees } = useActiveEmployees();
  const { summaries, counts, monthErrors, reload } = usePayrollYearSummaries(year);
  const { deleteMonth } = useDeletePayrollMonth();

  const [monthToDelete, setMonthToDelete] = useState<number | null>(null);
  const [busyMonth, setBusyMonth] = useState<number | null>(null);
  const [monthMessages, setMonthMessages] = useState<Record<number, string>>({});

  const handleYearChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  // DELETE /ael/salary/month 為整月原子刪除（2026-09-11 後端新增），取代舊版逐筆刪除
  const handleConfirmDelete = async () => {
    if (monthToDelete === null) return;
    const month = monthToDelete;
    setMonthToDelete(null);
    setBusyMonth(month);
    setMonthMessages(prev => ({ ...prev, [month]: '' }));
    try {
      await deleteMonth(year, month);
      reload();
    } catch (err) {
      setMonthMessages(prev => ({ ...prev, [month]: getFriendlyErrorMessage(err, '刪除失敗') }));
    } finally {
      setBusyMonth(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6 flex flex-col gap-4 nav:flex-row nav:items-start nav:justify-between">
          <div>
            <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">薪資明細</h1>
            <p className="mt-1 text-sm text-neutral-mid">依月份建立薪資明細</p>
          </div>
          <WithholdingTabs active="salary" />
        </div>

        <LockedBanner className="mb-5" />

        <div className="mb-5 flex flex-col gap-3 nav:flex-row nav:items-center">
          <div className="w-40">
            <Select widthClassName="w-full" value={String(year)} onValueChange={handleYearChange}>
              {years.map(y => (
                <option key={y} value={String(y)}>
                  {y - 1911} 年
                </option>
              ))}
            </Select>
          </div>
          <Link href="/withholding/salary/employee" className="inline-flex">
            <Button variant="outline" icon={UserCog}>
              員工列表
            </Button>
          </Link>
        </div>

        <div className="flex flex-col gap-5">
          {MONTHS.map(month => {
            const summary = summaries[month];
            const count = counts[month] ?? 0;
            const hasData = count > 0;
            // 近似值：後端未提供該月確切員工清單，以在職員工數 − 該月筆數估算尚未新增的人數
            const missingCount = Math.max(0, activeEmployees.length - count);
            const allFilled = hasData && missingCount === 0;
            const buttonLabel = !hasData ? '新增薪資明細' : allFilled ? '編輯薪資明細' : '新增/編輯薪資明細';
            const isBusy = busyMonth === month;
            const message = monthMessages[month];

            return (
              <div key={month} className="rounded-lg border border-neutral-blue-gray/30 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-neutral-dark">{month} 月</h3>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/withholding/salary/payroll?year=${year}&month=${month}`} className="inline-flex">
                      <Button size="sm" variant="outline" icon={allFilled ? Pencil : Plus} disabled={isLocked && !allFilled}>
                        {buttonLabel}
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost" icon={FileDown} disabled title="薪資條下載尚未串接後端 API">
                      下載薪資條
                    </Button>
                    <Button size="sm" variant="danger" icon={Trash2} disabled={!hasData || isLocked || isBusy} onClick={() => setMonthToDelete(month)}>
                      {isBusy ? '處理中…' : '刪除薪資'}
                    </Button>
                  </div>
                </div>

                {message && <p className="mb-3 text-xs text-semantic-error">{message}</p>}

                {hasData ? (
                  summary ? (
                    <div className="grid grid-cols-1 gap-4 nav:grid-cols-2">
                      <div className="space-y-4 rounded-lg border border-brand-blue/20 bg-brand-blue/5 p-5">
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <div className="text-sm font-medium text-neutral-dark">申報薪資總額</div>
                            <div className="text-xs text-neutral-mid">{count} 位人員</div>
                          </div>
                          <div className="mb-2 text-xs text-neutral-mid">固定＋非固定＋自訂加項－請假－勞退自提－自訂減項</div>
                          <div className="font-mono text-2xl font-semibold tracking-wider text-brand-blue">{fmtCurrency(summary.declareSalaryTotal)}</div>
                        </div>
                        <div className="border-t border-brand-blue/20" />
                        <div>
                          <div className="mb-1 text-sm font-medium text-neutral-dark">應付薪資總計</div>
                          <div className="mb-2 text-xs text-neutral-mid">固定＋非固定＋自訂加項＋伙食費＋加班費－請假－勞退自提－自訂減項－勞健保員工負擔－二代健保員工負擔</div>
                          <div className="font-mono text-2xl font-semibold tracking-wider text-brand-blue">{fmtCurrency(summary.payableSalaryTotal)}</div>
                        </div>
                      </div>
                      <div className="space-y-4 rounded-lg border border-brand-blue/20 bg-brand-blue/5 p-5">
                        <div>
                          <div className="mb-1 text-sm font-medium text-neutral-dark">固定薪資總計</div>
                          <div className="mb-2 text-xs text-neutral-mid">固定薪資－請假</div>
                          <div className="font-mono text-2xl font-semibold tracking-wider text-brand-blue">{fmtCurrency(summary.fixedSalaryTotal)}</div>
                        </div>
                        <div className="border-t border-brand-blue/20" />
                        <div>
                          <div className="mb-1 text-sm font-medium text-neutral-dark">非固定薪資總計</div>
                          <div className="mb-2 text-xs text-neutral-mid">非固定薪資</div>
                          <div className="font-mono text-2xl font-semibold tracking-wider text-brand-blue">{fmtCurrency(summary.nonFixedSalaryTotal)}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-neutral-mid">{monthErrors[month] || '統計載入中…'}</div>
                  )
                ) : (
                  <div className="py-8 text-center">
                    <div className="text-neutral-mid">{activeEmployees.length === 0 ? '這月份尚未有員工入職' : '該月份尚未建立薪資明細'}</div>
                    {missingCount > 0 && <div className="mt-2 text-[11px] text-neutral-mid">目前還有 {missingCount} 位在職員工尚未新增薪資明細</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmDialog
        open={monthToDelete !== null}
        onClose={() => setMonthToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="確認刪除薪資明細"
        message={
          <>
            將刪除 {monthToDelete} 月的所有薪資明細（共 {monthToDelete !== null ? (counts[monthToDelete] ?? 0) : 0} 筆）。
            <br />
            <span className="font-semibold text-semantic-error">刪除後無法復原。</span>
          </>
        }
      />
    </div>
  );
}
