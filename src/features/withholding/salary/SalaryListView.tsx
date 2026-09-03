'use client';

import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import LockedBanner from '../components/LockedBanner';
import { useLock } from '../components/LockContext';
import WithholdingTabs from '../components/WithholdingTabs';
import { fmtCurrency } from '@/lib/utils';
import { FileDown, Pencil, Plus, Trash2, UserCog } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { summarizeMonth } from './calc';
import { availableYears } from './data';
import { deletePayrollMonth, getPayrollMonth, listEmployees } from './mockStore';
import { downloadSalarySlips } from './slip';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DEFAULT_YEAR = availableYears()[0];

export default function SalaryListView() {
  const router = useRouter();
  const { isLocked } = useLock();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const yearParam = Number(searchParams.get('year'));
  const year = availableYears().includes(yearParam) ? yearParam : DEFAULT_YEAR;

  const employees = listEmployees();
  const activeEmployees = employees.filter(e => e.status === 'active');

  // 依賴 getPayrollMonth 的回傳（記憶體假資料），year 或刪除操作變動時需重新讀取
  const [refreshTick, setRefreshTick] = useState(0);
  const monthlyData = useMemo(() => {
    void refreshTick;
    return MONTHS.map(month => ({ month, items: getPayrollMonth(year, month) }));
  }, [year, refreshTick]);

  const [monthToDelete, setMonthToDelete] = useState<number | null>(null);

  const handleYearChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleConfirmDelete = () => {
    if (monthToDelete === null) return;
    deletePayrollMonth(year, monthToDelete);
    setRefreshTick(t => t + 1);
  };

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6 flex flex-col gap-4 nav:flex-row nav:items-start nav:justify-between">
          <div>
            <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">薪資明細</h1>
            <p className="mt-1 text-sm text-neutral-mid">依月份建立薪資明細，資料尚未串接後端，重新整理頁面會重置</p>
          </div>
          <WithholdingTabs active="salary" />
        </div>

        <LockedBanner className="mb-5" />

        <div className="mb-5 flex flex-col gap-3 nav:flex-row nav:items-center">
          <div className="w-40">
            <Select widthClassName="w-full" value={String(year)} onValueChange={handleYearChange}>
              {availableYears().map(y => (
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
          {monthlyData.map(({ month, items }) => {
            const summary = summarizeMonth(items);
            const hasData = items.length > 0;
            const missingCount = activeEmployees.filter(e => !items.some(i => i.employeeId === e.id)).length;
            const allNull = items.length === 0;
            const allFilled = missingCount === 0 && items.length > 0;
            const buttonLabel = allNull ? '新增薪資明細' : allFilled ? '編輯薪資明細' : '新增/編輯薪資明細';

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
                    <Button size="sm" variant="ghost" icon={FileDown} disabled={!hasData} onClick={() => downloadSalarySlips(year, month, items)}>
                      下載薪資條
                    </Button>
                    <Button size="sm" variant="danger" icon={Trash2} disabled={!hasData || isLocked} onClick={() => setMonthToDelete(month)}>
                      刪除薪資
                    </Button>
                  </div>
                </div>

                {hasData ? (
                  <div className="grid grid-cols-1 gap-4 nav:grid-cols-2">
                    <div className="space-y-4 rounded-lg border border-brand-blue/20 bg-brand-blue/5 p-5">
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <div className="text-sm font-medium text-neutral-dark">申報薪資總額</div>
                          <div className="text-xs text-neutral-mid">{items.length} 位人員</div>
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
                  <div className="py-8 text-center">
                    <div className="text-neutral-mid">{missingCount === 0 ? '這月份尚未有員工入職' : '該月份尚未建立薪資明細'}</div>
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
            確定要刪除 {monthToDelete} 月的所有薪資明細嗎？
            <br />
            <span className="font-semibold text-semantic-error">此操作無法復原。</span>
          </>
        }
      />
    </div>
  );
}
