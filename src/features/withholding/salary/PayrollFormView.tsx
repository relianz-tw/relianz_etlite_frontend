'use client';

import { fetchSalaryYearMonths } from '@/api/employee';
import { calculateSalaryInsurance, calculateSalaryOther } from '@/api/salary';
import type { SaveSalaryBody } from '@/api/types';
import Button from '@/components/ui/Button';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { ChevronLeft, FileDown, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import LockedBanner from '../components/LockedBanner';
import { useLock } from '../components/LockContext';
import { calculatePayable } from './calc';
import AddSalaryItemDialog from './components/AddSalaryItemDialog';
import PayrollMobileCards from './components/PayrollMobileCards';
import PayrollTable from './components/PayrollTable';
import SalaryPdfManager from './components/SalaryPdfManager';
import type { Employee, PayrollItem } from './types';
import { useActiveEmployees } from './useEmployees';
import { usePayrollMonth, useSavePayrollMonth } from './usePayroll';
import type { SaveSalaryRowFailure } from './usePayroll';

/** 五個原為後端試算結果的欄位；使用者手動改過後不再被試算結果覆寫（見 handleItemsChange） */
const OVERRIDE_FIELDS = ['selfPension', 'withholding', 'laborEmployeeAmount', 'nhiEmployeeAmount', 'secondHealthInsuranceFee'] as const;
type OverrideField = (typeof OVERRIDE_FIELDS)[number];

const OTHER_CALC_DEBOUNCE_MS = 500;

function emptyItem(employee: Employee): PayrollItem {
  return {
    employeeId: employee.id,
    name: employee.name,
    idNumber: employee.idNumber,
    nhiLevelId: employee.nhiLevelId,
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
}

/** 合併在職員工清單與後端已有的薪資列：後端已有的列直接沿用，缺的在職員工補空列；
 *  已離職但仍有薪資列的員工（不在 activeEmployees 內）排在最後，仍可編輯 */
function buildInitialItems(activeEmployees: Employee[], existingItems: PayrollItem[]): PayrollItem[] {
  const remaining = new Map(existingItems.map(item => [item.employeeId, item]));
  const result: PayrollItem[] = [];
  activeEmployees.forEach(employee => {
    const found = remaining.get(employee.id);
    if (found) {
      result.push(found);
      remaining.delete(employee.id);
    } else {
      result.push(emptyItem(employee));
    }
  });
  remaining.forEach(item => result.push(item));
  return result;
}

/** 畫面自訂加減項 → 後端 extraFields（{ 項目名稱: { addSub, value } }）；空名稱不送，無自訂項目時回 undefined */
function buildExtraFields(customItems: PayrollItem['customItems']): SaveSalaryBody['extraFields'] {
  const entries = customItems.filter(c => c.name.trim() !== '').map(c => [c.name.trim(), { addSub: c.isDeduction ? '-' : ('+' as const), value: c.amount }] as const);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/** 上月給薪日期 + 1 個月，供「帶入上月資料」使用；上月未設定給薪日期時原樣回傳 undefined */
function advanceOneMonth(year?: number, month?: number, day?: number): Pick<PayrollItem, 'paymentYear' | 'paymentMonth' | 'paymentDay'> {
  if (!year || !month) return { paymentYear: undefined, paymentMonth: undefined, paymentDay: day };
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return { paymentYear: nextYear, paymentMonth: nextMonth, paymentDay: day };
}

export default function PayrollFormView() {
  const router = useRouter();
  const { isLocked } = useLock();
  const searchParams = useSearchParams();
  const year = Number(searchParams.get('year'));
  const month = Number(searchParams.get('month'));
  const hasValidPeriod = Boolean(year && month);

  const { employees: activeEmployees, loading: employeesLoading } = useActiveEmployees();
  const {
    items: existingItems,
    existingEmployeeIds,
    missingFieldsByEmployee,
    loading: payrollLoading,
    error: payrollError,
  } = usePayrollMonth(year, month, activeEmployees, employeesLoading || !hasValidPeriod);
  const { save, saving } = useSavePayrollMonth();

  // 帶入上月資料：先查上月是否有薪資資料，有的話才撈上月明細（見 handleImportLastMonth）
  const prevMonthNum = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const [canImportLastMonth, setCanImportLastMonth] = useState(false);
  useEffect(() => {
    if (!hasValidPeriod) return;
    let cancelled = false;
    fetchSalaryYearMonths()
      .then(list => {
        if (!cancelled) setCanImportLastMonth(list.some(m => m.year === prevYear && m.month === prevMonthNum));
      })
      .catch(() => {
        if (!cancelled) setCanImportLastMonth(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hasValidPeriod, prevYear, prevMonthNum]);
  const lastMonthPayroll = usePayrollMonth(prevYear, prevMonthNum, activeEmployees, employeesLoading || !canImportLastMonth);

  const [items, setItems] = useState<PayrollItem[]>([]);
  const [snapshot, setSnapshot] = useState<Record<number, string>>({});
  const [initialized, setInitialized] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [saveErrors, setSaveErrors] = useState<SaveSalaryRowFailure[]>([]);
  const [validationError, setValidationError] = useState('');
  const [recalculatingId, setRecalculatingId] = useState<number | null>(null);
  const [rowCalcErrors, setRowCalcErrors] = useState<Record<number, string>>({});

  const overridesRef = useRef<Map<number, Set<OverrideField>>>(new Map());
  const itemsRef = useRef<PayrollItem[]>([]);
  const otherCalcSeqRef = useRef<Map<number, number>>(new Map());
  const otherCalcTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const loading = employeesLoading || payrollLoading;

  const isOverridden = (employeeId: number, field: OverrideField) => overridesRef.current.get(employeeId)?.has(field) ?? false;
  const markOverride = (employeeId: number, field: OverrideField) => {
    const set = overridesRef.current.get(employeeId) ?? new Set<OverrideField>();
    set.add(field);
    overridesRef.current.set(employeeId, set);
  };
  const clearOverrides = (employeeId: number) => overridesRef.current.delete(employeeId);

  // 初始建立表格資料：後端已有的薪資列視為「已確認的值」，預先鎖定五個試算欄位不被自動覆寫
  useEffect(() => {
    if (!hasValidPeriod) {
      router.replace('/withholding/salary');
      return;
    }
    if (loading || initialized) return;
    const initialItems = buildInitialItems(activeEmployees, existingItems);
    initialItems.forEach(item => {
      if (existingEmployeeIds.has(item.employeeId)) {
        OVERRIDE_FIELDS.forEach(field => markOverride(item.employeeId, field));
      }
    });
    setItems(initialItems);
    setSnapshot(Object.fromEntries(initialItems.map(item => [item.employeeId, JSON.stringify(item)])));
    setInitialized(true);
    // 僅在載入完成那一刻建立一次初始資料，後續改動由使用者操作驅動，不需重跑
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasValidPeriod, loading, initialized]);

  // 新列（後端尚無此員工薪資列）建立後，各打一次 calculate/insurance 取得勞健保費／勞退自提試算預設值
  useEffect(() => {
    if (!initialized) return;
    const newEmployeeIds = items.filter(item => !existingEmployeeIds.has(item.employeeId)).map(item => item.employeeId);
    if (newEmployeeIds.length === 0) return;
    let cancelled = false;
    Promise.allSettled(newEmployeeIds.map(employeeId => calculateSalaryInsurance({ employeeId, year, month }).then(result => ({ employeeId, result })))).then(
      results => {
        if (cancelled) return;
        setItems(prev =>
          prev.map(item => {
            const found = results.find(r => r.status === 'fulfilled' && r.value.employeeId === item.employeeId);
            if (!found || found.status !== 'fulfilled') return item;
            const { result } = found.value;
            const patch: Partial<PayrollItem> = {};
            if (!isOverridden(item.employeeId, 'selfPension')) patch.selfPension = result.volPension;
            if (!isOverridden(item.employeeId, 'laborEmployeeAmount')) patch.laborEmployeeAmount = result.laborInsurance;
            if (!isOverridden(item.employeeId, 'nhiEmployeeAmount')) patch.nhiEmployeeAmount = result.healthInsurance;
            return { ...item, ...patch };
          }),
        );
      },
    );
    return () => {
      cancelled = true;
    };
    // 僅在初始化完成那一刻對當下的新列各跑一次；之後改薪資不影響這三欄，不需重跑
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  useEffect(() => {
    return () => {
      otherCalcTimersRef.current.forEach(timer => clearTimeout(timer));
      otherCalcTimersRef.current.clear();
    };
  }, [year, month]);

  const runOtherCalc = async (employeeId: number) => {
    const item = itemsRef.current.find(i => i.employeeId === employeeId);
    if (!item) return;
    if (item.fixedSalary + item.nonFixedSalary <= 0 || !item.paymentYear || !item.paymentMonth || !item.paymentDay) return;

    const seq = (otherCalcSeqRef.current.get(employeeId) ?? 0) + 1;
    otherCalcSeqRef.current.set(employeeId, seq);
    setRowCalcErrors(prev => {
      if (!(employeeId in prev)) return prev;
      const next = { ...prev };
      delete next[employeeId];
      return next;
    });

    try {
      // amount＝本次計入二代健保的「獎金片段」，後端已確認不等於 fixedSalary+nonFixedSalary（會把固定薪也
      // 灌進二代健保費基，金額算高）；畫面上「非固定薪資」對應「三節/年終/績效/補貼等」獎金性質欄位，
      // 故整筆送出，見 SalaryOtherCalcBody 型別註解
      const result = await calculateSalaryOther({ employeeId, year, month, amount: item.nonFixedSalary, salary: item.fixedSalary, nonFixedSalary: item.nonFixedSalary });
      if (otherCalcSeqRef.current.get(employeeId) !== seq) return; // 回應已過期（使用者又改過），丟棄避免覆蓋新輸入
      setItems(prev =>
        prev.map(row => {
          if (row.employeeId !== employeeId) return row;
          const patch: Partial<PayrollItem> = {};
          if (!isOverridden(employeeId, 'withholding')) patch.withholding = result.taxWithheldSum;
          if (!isOverridden(employeeId, 'secondHealthInsuranceFee')) patch.secondHealthInsuranceFee = result.nhiAmount;
          return { ...row, ...patch };
        }),
      );
    } catch (err) {
      if (otherCalcSeqRef.current.get(employeeId) !== seq) return;
      setRowCalcErrors(prev => ({ ...prev, [employeeId]: getFriendlyErrorMessage(err, '試算失敗，請手動填寫') }));
    }
  };

  const scheduleOtherCalc = (employeeId: number) => {
    const existingTimer = otherCalcTimersRef.current.get(employeeId);
    if (existingTimer) clearTimeout(existingTimer);
    const timer = setTimeout(() => {
      otherCalcTimersRef.current.delete(employeeId);
      void runOtherCalc(employeeId);
    }, OTHER_CALC_DEBOUNCE_MS);
    otherCalcTimersRef.current.set(employeeId, timer);
  };

  // 表格／手機卡片的 onChange 統一走這裡：比對前後值標記手動覆寫欄位，並在金額或給薪日期變動時排入試算
  const handleItemsChange = (newItems: PayrollItem[]) => {
    const prevById = new Map(items.map(i => [i.employeeId, i]));
    newItems.forEach(item => {
      const old = prevById.get(item.employeeId);
      if (!old) return;
      OVERRIDE_FIELDS.forEach(field => {
        if (old[field] !== item[field]) markOverride(item.employeeId, field);
      });
      if (
        old.fixedSalary !== item.fixedSalary ||
        old.nonFixedSalary !== item.nonFixedSalary ||
        old.paymentYear !== item.paymentYear ||
        old.paymentMonth !== item.paymentMonth ||
        old.paymentDay !== item.paymentDay
      ) {
        scheduleOtherCalc(item.employeeId);
      }
    });
    setItems(newItems);
  };

  const handleRecalculateRow = async (employeeId: number) => {
    const timer = otherCalcTimersRef.current.get(employeeId);
    if (timer) {
      clearTimeout(timer);
      otherCalcTimersRef.current.delete(employeeId);
    }
    clearOverrides(employeeId);
    setRecalculatingId(employeeId);
    setRowCalcErrors(prev => {
      if (!(employeeId in prev)) return prev;
      const next = { ...prev };
      delete next[employeeId];
      return next;
    });
    try {
      const insuranceResult = await calculateSalaryInsurance({ employeeId, year, month }).catch(() => null);
      if (insuranceResult) {
        setItems(prev =>
          prev.map(item =>
            item.employeeId === employeeId
              ? { ...item, selfPension: insuranceResult.volPension, laborEmployeeAmount: insuranceResult.laborInsurance, nhiEmployeeAmount: insuranceResult.healthInsurance }
              : item,
          ),
        );
      }
      await runOtherCalc(employeeId);
    } finally {
      setRecalculatingId(null);
    }
  };

  const missingFieldsNotice = useMemo(() => {
    if (missingFieldsByEmployee.size === 0) return '';
    const names = [...missingFieldsByEmployee.keys()].map(employeeId => items.find(i => i.employeeId === employeeId)?.name ?? `員工 #${employeeId}`);
    return `部分薪資欄位後端未回傳，已以 0 顯示：${names.join('、')}`;
  }, [missingFieldsByEmployee, items]);

  if (!hasValidPeriod) return null;
  if (!initialized) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-off-white text-sm text-neutral-mid">載入中…</div>;
  }

  const handleAddItem = ({ name, isDeduction }: { name: string; isDeduction: boolean }) => {
    const id = `custom-${Date.now()}`;
    setItems(prev => prev.map(item => ({ ...item, customItems: [...item.customItems, { id, name, amount: 0, isDeduction }] })));
  };

  // 帶入上月資料：比照參考實作（見 relianz_cashflow_frontend），複製上月固定/非固定薪資等欄位，
  // 給薪日期自動加一個月；二代健保不複製、交給 scheduleOtherCalc 依新金額重新試算。
  const handleImportLastMonth = () => {
    const lastByEmployee = new Map(lastMonthPayroll.items.map(i => [i.employeeId, i]));
    const newItems = items.map(item => {
      const match = lastByEmployee.get(item.employeeId);
      if (!match) return item;
      markOverride(item.employeeId, 'selfPension');
      markOverride(item.employeeId, 'withholding');
      markOverride(item.employeeId, 'laborEmployeeAmount');
      markOverride(item.employeeId, 'nhiEmployeeAmount');
      return {
        ...item,
        fixedSalary: match.fixedSalary,
        nonFixedSalary: match.nonFixedSalary,
        overtimePay: match.overtimePay,
        mealAllowance: match.mealAllowance,
        leaveDeduction: match.leaveDeduction,
        selfPension: match.selfPension,
        withholding: match.withholding,
        laborEmployeeAmount: match.laborEmployeeAmount,
        nhiEmployeeAmount: match.nhiEmployeeAmount,
        secondHealthInsuranceFee: 0,
        customItems: match.customItems.map((c, index) => ({ ...c, id: `import-${item.employeeId}-${index}` })),
        ...advanceOneMonth(match.paymentYear, match.paymentMonth, match.paymentDay),
      };
    });
    setItems(newItems);
    newItems.forEach(item => {
      if (lastByEmployee.has(item.employeeId)) scheduleOtherCalc(item.employeeId);
    });
  };

  const handleSave = async () => {
    const dirty = items.filter(item => JSON.stringify(item) !== snapshot[item.employeeId]);
    if (dirty.length === 0) {
      router.push(`/withholding/salary?year=${year}`);
      return;
    }
    const missingDate = dirty.filter(item => !item.paymentYear || !item.paymentMonth || !item.paymentDay);
    if (missingDate.length > 0) {
      setValidationError(`以下人員未填給薪日期：${missingDate.map(i => i.name).join('、')}`);
      return;
    }
    setValidationError('');
    setSaveErrors([]);

    const rows = dirty.map(item => ({
      employeeId: item.employeeId,
      name: item.name,
      body: {
        employeeId: item.employeeId,
        year,
        month,
        paymentYear: item.paymentYear as number,
        paymentMonth: item.paymentMonth as number,
        paymentDay: item.paymentDay as number,
        fixedSalary: item.fixedSalary,
        nonFixedSalary: item.nonFixedSalary,
        overtimePay: item.overtimePay,
        mealAllowance: item.mealAllowance,
        attendanceDeduction: item.leaveDeduction,
        volPension: item.selfPension,
        taxWithheld: item.withholding,
        laborInsurance: item.laborEmployeeAmount,
        healthInsurance: item.nhiEmployeeAmount,
        secondHealthInsuranceFee: item.secondHealthInsuranceFee,
        // 後端已確認（2026-09-10）totalSalary 採信前端傳的值、不會重算，故送前端算好的應付薪資
        totalSalary: calculatePayable(item),
        extraFields: buildExtraFields(item.customItems),
      },
    }));

    const result = await save(rows);
    const succeededIds = new Set(result.succeeded);
    setSnapshot(prev => {
      const next = { ...prev };
      items.forEach(item => {
        if (succeededIds.has(item.employeeId)) next[item.employeeId] = JSON.stringify(item);
      });
      return next;
    });

    if (result.failed.length === 0) {
      router.push(`/withholding/salary?year=${year}`);
      return;
    }
    setSaveErrors(result.failed);
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

        {payrollError && <p className="mb-3 text-sm text-semantic-error">{payrollError}</p>}
        {missingFieldsNotice && <p className="mb-3 text-xs text-neutral-mid">{missingFieldsNotice}</p>}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2 text-sm font-semibold text-neutral-dark">
            民國 {year - 1911} 年 {month} 月
            <span className="text-xs font-normal text-neutral-mid">
              · <span className="text-semantic-error">紅字</span>為減項
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleImportLastMonth} disabled={isLocked || !canImportLastMonth || lastMonthPayroll.items.length === 0}>
              帶入上月資料
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAddDialogOpen(true)} disabled={isLocked}>
              新增薪資條欄位
            </Button>
            <Button size="sm" variant="outline" icon={FileDown} disabled title="薪資條下載尚未串接後端 API">
              下載薪資條
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isLocked || saving}>
              {saving ? '儲存中…' : saveErrors.length > 0 ? '重新儲存失敗項目' : '儲存'}
            </Button>
          </div>
        </div>

        {validationError && <p className="mb-3 text-sm text-semantic-error">{validationError}</p>}
        {saveErrors.length > 0 && (
          <div className="mb-3 rounded-md border border-semantic-error/30 bg-semantic-error/5 p-3 text-sm text-semantic-error">
            <p className="mb-1 font-semibold">部分薪資明細儲存失敗：</p>
            <ul className="list-disc space-y-0.5 pl-5">
              {saveErrors.map(f => (
                <li key={f.employeeId}>
                  {f.name}：{f.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <PayrollTable
          items={items}
          onChange={handleItemsChange}
          readOnly={isLocked}
          recalculatingEmployeeId={recalculatingId}
          rowCalcErrors={rowCalcErrors}
          onRecalculateRow={handleRecalculateRow}
        />
        <PayrollMobileCards
          items={items}
          onChange={handleItemsChange}
          readOnly={isLocked}
          recalculatingEmployeeId={recalculatingId}
          rowCalcErrors={rowCalcErrors}
          onRecalculateRow={handleRecalculateRow}
        />

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

        <SalaryPdfManager items={items} year={year} month={month} readOnly={isLocked} />
      </div>

      <AddSalaryItemDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} onAdd={handleAddItem} />
    </div>
  );
}
