'use client';

import Button from '@/components/ui/Button';
import { ChevronLeft, FileDown, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import LockedBanner from '../components/LockedBanner';
import { useLock } from '../components/LockContext';
import AddSalaryItemDialog from './components/AddSalaryItemDialog';
import PayrollMobileCards from './components/PayrollMobileCards';
import PayrollTable from './components/PayrollTable';
import SalaryPdfManager from './components/SalaryPdfManager';
import { getPayrollMonth, listEmployees, savePayrollMonth } from './mockStore';
import { downloadSalarySlips } from './slip';
import type { PayrollItem } from './types';

function buildInitialItems(year: number, month: number): PayrollItem[] {
  const existing = getPayrollMonth(year, month);
  const activeEmployees = listEmployees().filter(e => e.status === 'active');
  const byEmployee = new Map(existing.map(item => [item.employeeId, item]));

  return activeEmployees.map(employee => {
    const found = byEmployee.get(employee.id);
    if (found) return found;
    return {
      employeeId: employee.id,
      name: employee.name,
      idNumber: employee.idNumber,
      fixedSalary: 0,
      nonFixedSalary: 0,
      overtimePay: 0,
      mealAllowance: 0,
      leaveDeduction: 0,
      customItems: [],
      selfPension: 0,
      withholding: 0,
      laborEmployeeAmount: 0,
      nhiEmployeeAmount: 0,
      secondHealthInsuranceFee: 0,
    };
  });
}

export default function PayrollFormView() {
  const router = useRouter();
  const { isLocked } = useLock();
  const searchParams = useSearchParams();
  const year = Number(searchParams.get('year'));
  const month = Number(searchParams.get('month'));
  const hasValidPeriod = Boolean(year && month);

  const [items, setItems] = useState<PayrollItem[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    if (!hasValidPeriod) {
      router.replace('/withholding/salary');
      return;
    }
    setItems(buildInitialItems(year, month));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, hasValidPeriod]);

  if (!hasValidPeriod) return null;

  const handleAddItem = ({ name, isDeduction }: { name: string; isDeduction: boolean }) => {
    const id = `custom-${Date.now()}`;
    setItems(prev => prev.map(item => ({ ...item, customItems: [...item.customItems, { id, name, amount: 0, isDeduction }] })));
  };

  const handleSave = () => {
    savePayrollMonth(year, month, items);
    router.push(`/withholding/salary?year=${year}`);
  };

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1400px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-4 flex items-center gap-3">
          <Link href="/withholding/salary" className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-mid hover:bg-surface-cream hover:text-neutral-dark">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="font-notoSerif text-xl font-semibold text-neutral-dark">開立/編輯薪資明細</h1>
        </div>

        <LockedBanner className="mb-4" />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2 text-sm font-semibold text-neutral-dark">
            民國 {year - 1911} 年 {month} 月
            <span className="text-xs font-normal text-neutral-mid">
              · <span className="text-semantic-error">紅字</span>為減項
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setAddDialogOpen(true)} disabled={isLocked}>
              新增薪資條欄位
            </Button>
            <Button size="sm" variant="outline" icon={FileDown} onClick={() => downloadSalarySlips(year, month, items)}>
              下載薪資條
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isLocked}>
              儲存
            </Button>
          </div>
        </div>

        <PayrollTable items={items} onChange={setItems} readOnly={isLocked} />
        <PayrollMobileCards items={items} onChange={setItems} readOnly={isLocked} />

        <p className="mt-3 text-right text-xs text-neutral-mid">依附加保眷屬超過 3 人時，連同被保險人本人，保險費最多計收 4 人。</p>

        <div className="mt-4 rounded-md border border-brand-tan/30 bg-surface-warm p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-neutral-dark">
            <TriangleAlert size={15} className="text-brand-tan-dark" />
            提醒
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-neutral-mid">
            <li>若單筆固定薪資或獎金未超過財政部訂定當年度扣繳起點，則該筆固定薪資或獎金不會納入扣繳計算，也不會出現在扣繳繳款書上。</li>
            <li>
              員工薪資所得扣繳稅款，請於<span className="font-semibold text-neutral-dark">發薪日後次月 10 日前</span>至銀行或四大超商完成繳納。
            </li>
            <li>
              二代健保保費，請於<span className="font-semibold text-neutral-dark">發薪日後次月月底前</span>至銀行或四大超商完成繳納。
            </li>
          </ul>
        </div>

        <SalaryPdfManager year={year} month={month} items={items} />
      </div>

      <AddSalaryItemDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} onAdd={handleAddItem} />
    </div>
  );
}
