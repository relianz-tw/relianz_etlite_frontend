'use client';

import ConfirmDialog from '@/components/ui/ConfirmDialog';
import MoneyInput from '@/components/ui/MoneyInput';
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
import { useMemo, useState } from 'react';
import { useActiveEmployees, useAvailableYears } from './useEmployees';
import { useNhiBurdenSummaries } from './useNhiBurden';
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

  // 只對有薪資資料的月份查詢公司行號負擔二代健保投保總額，避免年度 12 個月都打空查詢
  const monthsWithData = useMemo(() => Object.keys(counts).map(Number), [counts]);
  const { burdens, save: saveBurden, reset: resetBurden, savingMonth } = useNhiBurdenSummaries(year, monthsWithData);

  const [monthToDelete, setMonthToDelete] = useState<number | null>(null);
  const [busyMonth, setBusyMonth] = useState<number | null>(null);
  const [monthMessages, setMonthMessages] = useState<Record<number, string>>({});

  const [editingBurdenMonth, setEditingBurdenMonth] = useState<number | null>(null);
  const [burdenDraft, setBurdenDraft] = useState(0);
  const [burdenResetMonth, setBurdenResetMonth] = useState<number | null>(null);
  const [burdenMessages, setBurdenMessages] = useState<Record<number, string>>({});

  const handleStartBurdenEdit = (month: number) => {
    setEditingBurdenMonth(month);
    setBurdenDraft(burdens[month]?.totalInsuredAmount ?? 0);
    setBurdenMessages(prev => ({ ...prev, [month]: '' }));
  };

  const handleCancelBurdenEdit = () => setEditingBurdenMonth(null);

  const handleSaveBurden = async (month: number) => {
    if (burdenDraft > 100_000_000) {
      setBurdenMessages(prev => ({ ...prev, [month]: '金額超出合理範圍（上限 1 億）' }));
      return;
    }
    try {
      await saveBurden(year, month, burdenDraft);
      setEditingBurdenMonth(null);
    } catch (err) {
      setBurdenMessages(prev => ({ ...prev, [month]: err instanceof Error ? err.message : '儲存失敗' }));
    }
  };

  const handleConfirmResetBurden = async () => {
    if (burdenResetMonth === null) return;
    const month = burdenResetMonth;
    setBurdenResetMonth(null);
    try {
      await resetBurden(month);
    } catch (err) {
      setBurdenMessages(prev => ({ ...prev, [month]: err instanceof Error ? err.message : '刪除失敗' }));
    }
  };

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
      // 一併清掉當月公司行號負擔二代健保投保總額紀錄；失敗不阻斷薪資刪除流程
      resetBurden(month).catch(() => {});
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

            const burden = burdens[month];
            const isEditingBurden = editingBurdenMonth === month;
            const isSavingBurden = savingMonth === month;
            const burdenMessage = burdenMessages[month];

            return (
              <div key={month} className="rounded-lg border border-neutral-blue-gray/30 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-neutral-dark">{month} 月</h3>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/withholding/salary/payroll?year=${year}&month=${month}`} className="inline-flex">
                      <Button size="sm" variant="outline" icon={allFilled ? Pencil : Plus} disabled={(isLocked && !allFilled) || activeEmployees.length === 0}>
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
                    <div className="grid grid-cols-1 gap-4 nav:grid-cols-3">
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
                      <div className="space-y-3 rounded-lg border border-brand-tan/30 bg-surface-warm p-5">
                        <div>
                          <div className="mb-1 text-sm font-medium text-neutral-dark">公司行號負擔二代健保</div>
                          <div className="mb-2 text-xs text-neutral-mid">
                            {burden
                              ? '單位必須要在當月月底前完成繳納'
                              : '請依照您從健保局所收到的『薪資支付月份』【保險費計算表】下方所記載之【受僱者投保金額總額共】填寫。例：如一月薪資為二月五號支付，請使用二月健保局保險費計算表。'}
                          </div>
                        </div>

                        {isEditingBurden ? (
                          <div className="space-y-2">
                            <MoneyInput value={burdenDraft} onChange={setBurdenDraft} />
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="primary" disabled={isSavingBurden} onClick={() => handleSaveBurden(month)}>
                                {isSavingBurden ? '儲存中…' : '儲存'}
                              </Button>
                              <Button size="sm" variant="ghost" disabled={isSavingBurden} onClick={handleCancelBurdenEdit}>
                                取消
                              </Button>
                              {burden && (
                                <Button size="sm" variant="danger" icon={Trash2} disabled={isSavingBurden} onClick={() => setBurdenResetMonth(month)}>
                                  重置
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : burden ? (
                          <div className="space-y-3">
                            <div>
                              <div className="mb-1 flex items-center justify-between">
                                <div className="text-xs text-neutral-mid">受僱者投保總額</div>
                                <button
                                  type="button"
                                  onClick={() => handleStartBurdenEdit(month)}
                                  disabled={isLocked}
                                  title="修正受僱者投保總額"
                                  className="text-neutral-mid hover:text-brand-blue disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                  <Pencil size={14} />
                                </button>
                              </div>
                              <div className="font-mono text-xl font-semibold tracking-wider text-neutral-dark">{fmtCurrency(burden.totalInsuredAmount)}</div>
                            </div>
                            <div className="border-t border-brand-tan/30" />
                            <div>
                              <div className="mb-1 text-xs text-neutral-mid">應繳納</div>
                              <div className="text-sm text-neutral-mid">— 待後端提供計算 API</div>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" icon={Plus} disabled={isLocked} onClick={() => handleStartBurdenEdit(month)}>
                            輸入受僱者投保總額
                          </Button>
                        )}

                        {burdenMessage && <p className="text-xs text-semantic-error">{burdenMessage}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-neutral-mid">{monthErrors[month] || '統計載入中…'}</div>
                  )
                ) : (
                  <div className="py-8 text-center">
                    {activeEmployees.length === 0 ? (
                      <div className="text-xs text-neutral-mid">
                        尚未有員工，請先至
                        <Link href="/withholding/salary/employee" className="mx-1 text-brand-blue hover:underline">
                          員工列表
                        </Link>
                        新增員工
                      </div>
                    ) : (
                      <div className="text-xs text-neutral-mid">該月份尚未建立薪資明細</div>
                    )}
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

      <ConfirmDialog
        open={burdenResetMonth !== null}
        onClose={() => setBurdenResetMonth(null)}
        onConfirm={handleConfirmResetBurden}
        title="確認重置投保總額"
        message={
          <>
            將刪除 {burdenResetMonth} 月的受僱者投保金額總額紀錄，該月將回到「尚未設定」。
            <br />
            <span className="font-semibold text-semantic-error">刪除後無法復原。</span>
          </>
        }
      />
    </div>
  );
}
