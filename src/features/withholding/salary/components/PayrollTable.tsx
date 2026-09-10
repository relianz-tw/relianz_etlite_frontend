'use client';

import DatePicker from '@/components/ui/DatePicker';
import MoneyInput from '@/components/ui/MoneyInput';
import { fmtCurrency } from '@/lib/utils';
import { RefreshCw, X } from 'lucide-react';
import { calculatePayable, paymentDateOf, withPaymentDate } from '../calc';
import type { CustomSalaryItem, PayrollItem } from '../types';

interface PayrollTableProps {
  items: PayrollItem[];
  onChange: (items: PayrollItem[]) => void;
  readOnly?: boolean;
  /** 目前正在重新試算的員工 id，用於該列按鈕顯示載入中 */
  recalculatingEmployeeId?: number | null;
  /** employeeId → 試算失敗訊息 */
  rowCalcErrors?: Record<number, string>;
  /** 清除該列手動覆寫並重新呼叫試算端點 */
  onRecalculateRow?: (employeeId: number) => void;
}

const thBase = 'sticky top-0 z-20 whitespace-nowrap border-r border-neutral-blue-gray/30 bg-surface-off-white px-3 py-3 text-left text-xs font-semibold';
const thNeutral = `${thBase} text-neutral-dark`;
const thDeduction = `${thBase} text-semantic-error`;
const tdBase = 'whitespace-nowrap border-r border-neutral-blue-gray/20 px-3 py-2';

function updateItem(items: PayrollItem[], employeeId: number, patch: Partial<PayrollItem>): PayrollItem[] {
  return items.map(item => (item.employeeId === employeeId ? { ...item, ...patch } : item));
}

/** 開立/編輯薪資明細的可編輯寬表格：姓名/身分證字號 sticky 於左側，其餘欄位可橫向捲動；
 *  應付薪資為前端即時加總，五個減項欄位由後端試算帶入預設值、仍可手動修改（見「重新試算」欄） */
export default function PayrollTable({ items, onChange, readOnly = false, recalculatingEmployeeId, rowCalcErrors, onRecalculateRow }: PayrollTableProps) {
  const customColumns = items[0]?.customItems ?? [];

  const handleRenameCustomItem = (itemId: string, name: string) => {
    onChange(items.map(item => ({ ...item, customItems: item.customItems.map(c => (c.id === itemId ? { ...c, name } : c)) })));
  };

  const handleDeleteCustomItem = (itemId: string) => {
    onChange(items.map(item => ({ ...item, customItems: item.customItems.filter(c => c.id !== itemId) })));
  };

  const handleCustomAmountChange = (employeeId: number, itemId: string, amount: number) => {
    onChange(
      items.map(item =>
        item.employeeId === employeeId
          ? { ...item, customItems: item.customItems.map(c => (c.id === itemId ? { ...c, amount } : c)) }
          : item,
      ),
    );
  };

  return (
    <div className="hidden overflow-auto rounded-md border border-neutral-blue-gray/30 bg-white nav:block" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={`${thNeutral} sticky left-0 z-30 min-w-[140px] bg-surface-off-white`}>姓名</th>
            <th className={`${thNeutral} sticky left-[140px] z-30 min-w-[130px] bg-surface-off-white`}>身分證字號</th>
            <th className={`${thNeutral} min-w-[170px]`}>給薪日期</th>
            <th className={`${thNeutral} min-w-[150px]`}>固定薪資</th>
            <th className={`${thNeutral} min-w-[150px]`}>
              非固定薪資
              <div className="text-[11px] font-normal text-neutral-mid">三節、年終、績效、補貼等</div>
            </th>
            <th className={`${thNeutral} min-w-[150px]`}>
              免稅加班費
              <div className="text-[11px] font-normal text-neutral-mid">符合勞基法規定</div>
            </th>
            <th className={`${thNeutral} min-w-[150px]`}>
              免稅伙食費
              <div className="text-[11px] font-normal text-neutral-mid">符合稅法規定</div>
            </th>
            <th className={`${thDeduction} min-w-[150px]`}>請假/遲到/早退</th>
            {customColumns.map(col => (
              <th key={col.id} className={`${col.isDeduction ? thDeduction : thNeutral} min-w-[150px] group`}>
                <div className="flex items-center justify-between gap-2">
                  {readOnly ? (
                    <span>{col.name}</span>
                  ) : (
                    <input
                      value={col.name}
                      onChange={e => handleRenameCustomItem(col.id, e.target.value)}
                      className="min-w-0 flex-1 bg-transparent outline-none"
                    />
                  )}
                  {!readOnly && (
                    <button type="button" onClick={() => handleDeleteCustomItem(col.id)} className="text-neutral-mid opacity-0 hover:text-semantic-error group-hover:opacity-100">
                      <X size={13} />
                    </button>
                  )}
                </div>
              </th>
            ))}
            <th className={`${thDeduction} min-w-[150px]`}>
              勞退自提
              <div className="text-[11px] font-normal text-neutral-mid">試算帶入，可編輯</div>
            </th>
            <th className={`${thDeduction} min-w-[150px]`}>
              薪資扣繳稅款
              <div className="text-[11px] font-normal text-neutral-mid">員工負擔，試算帶入，可編輯</div>
            </th>
            <th className={`${thDeduction} min-w-[150px]`}>
              勞保費(員工)
              <div className="text-[11px] font-normal text-neutral-mid">員工負擔，試算帶入，可編輯</div>
            </th>
            <th className={`${thDeduction} min-w-[150px]`}>
              健保費(員工)
              <div className="text-[11px] font-normal text-neutral-mid">員工負擔，試算帶入，可編輯</div>
            </th>
            <th className={`${thDeduction} min-w-[150px]`}>
              二代健保
              <div className="text-[11px] font-normal text-neutral-mid">員工負擔，試算帶入，可編輯</div>
            </th>
            <th className={`${thNeutral} min-w-[150px]`}>
              應付薪資
              <div className="text-[11px] font-normal text-neutral-mid">自動計算</div>
            </th>
            {onRecalculateRow && <th className={`${thNeutral} min-w-[110px]`}>試算</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-blue-gray/20">
          {items.map(item => (
            <tr key={item.employeeId}>
              <td className={`${tdBase} sticky left-0 z-10 bg-white font-medium text-neutral-dark`}>{item.name}</td>
              <td className={`${tdBase} sticky left-[140px] z-10 bg-white font-mono text-neutral-mid`}>{item.idNumber}</td>
              <td className={tdBase}>
                <DatePicker
                  value={paymentDateOf(item)}
                  onChange={date => onChange(updateItem(items, item.employeeId, withPaymentDate(item, date)))}
                  placeholder="選擇給薪日期"
                  disabled={readOnly}
                />
              </td>
              <td className={tdBase}>
                <MoneyInput value={item.fixedSalary} onChange={v => onChange(updateItem(items, item.employeeId, { fixedSalary: v }))} disabled={readOnly} />
              </td>
              <td className={tdBase}>
                <MoneyInput value={item.nonFixedSalary} onChange={v => onChange(updateItem(items, item.employeeId, { nonFixedSalary: v }))} disabled={readOnly} />
              </td>
              <td className={tdBase}>
                <MoneyInput value={item.overtimePay} onChange={v => onChange(updateItem(items, item.employeeId, { overtimePay: v }))} disabled={readOnly} />
              </td>
              <td className={tdBase}>
                <MoneyInput value={item.mealAllowance} onChange={v => onChange(updateItem(items, item.employeeId, { mealAllowance: v }))} disabled={readOnly} />
              </td>
              <td className={tdBase}>
                <MoneyInput value={item.leaveDeduction} onChange={v => onChange(updateItem(items, item.employeeId, { leaveDeduction: v }))} disabled={readOnly} />
              </td>
              {item.customItems.map((col: CustomSalaryItem) => (
                <td key={col.id} className={tdBase}>
                  <MoneyInput value={col.amount} onChange={v => handleCustomAmountChange(item.employeeId, col.id, v)} disabled={readOnly} />
                </td>
              ))}
              <td className={tdBase}>
                <MoneyInput value={item.selfPension} onChange={v => onChange(updateItem(items, item.employeeId, { selfPension: v }))} disabled={readOnly} />
              </td>
              <td className={tdBase}>
                <MoneyInput value={item.withholding} onChange={v => onChange(updateItem(items, item.employeeId, { withholding: v }))} disabled={readOnly} />
              </td>
              <td className={tdBase}>
                <MoneyInput value={item.laborEmployeeAmount} onChange={v => onChange(updateItem(items, item.employeeId, { laborEmployeeAmount: v }))} disabled={readOnly} />
              </td>
              <td className={tdBase}>
                <MoneyInput value={item.nhiEmployeeAmount} onChange={v => onChange(updateItem(items, item.employeeId, { nhiEmployeeAmount: v }))} disabled={readOnly} />
              </td>
              <td className={tdBase}>
                <MoneyInput
                  value={item.secondHealthInsuranceFee}
                  onChange={v => onChange(updateItem(items, item.employeeId, { secondHealthInsuranceFee: v }))}
                  disabled={readOnly}
                />
              </td>
              <td className={`${tdBase} bg-surface-cream text-right font-mono font-semibold tabular-nums text-neutral-dark`}>
                {fmtCurrency(calculatePayable(item))}
              </td>
              {onRecalculateRow && (
                <td className={tdBase}>
                  <button
                    type="button"
                    onClick={() => onRecalculateRow(item.employeeId)}
                    disabled={readOnly || recalculatingEmployeeId === item.employeeId}
                    className="flex items-center gap-1 text-xs text-brand-blue hover:underline disabled:cursor-not-allowed disabled:text-neutral-mid disabled:no-underline"
                  >
                    <RefreshCw size={12} className={recalculatingEmployeeId === item.employeeId ? 'animate-spin' : undefined} />
                    重新試算
                  </button>
                  {rowCalcErrors?.[item.employeeId] && <p className="mt-1 text-[11px] text-neutral-mid">{rowCalcErrors[item.employeeId]}</p>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
