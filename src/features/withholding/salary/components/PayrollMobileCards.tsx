'use client';

import Label from '@/components/ui/Label';
import DatePicker from '@/components/ui/DatePicker';
import MoneyInput from '@/components/ui/MoneyInput';
import { fmtCurrency } from '@/lib/utils';
import { calculatePayable, paymentDateOf, withPaymentDate } from '../calc';
import type { PayrollItem } from '../types';

interface PayrollMobileCardsProps {
  items: PayrollItem[];
  onChange: (items: PayrollItem[]) => void;
  readOnly?: boolean;
}

function updateItem(items: PayrollItem[], employeeId: string, patch: Partial<PayrollItem>): PayrollItem[] {
  return items.map(item => (item.employeeId === employeeId ? { ...item, ...patch } : item));
}

const FIELD_LABELS: { key: keyof PayrollItem; label: string; deduction?: boolean }[] = [
  { key: 'fixedSalary', label: '固定薪資' },
  { key: 'nonFixedSalary', label: '非固定薪資' },
  { key: 'overtimePay', label: '免稅加班費' },
  { key: 'mealAllowance', label: '免稅伙食費' },
  { key: 'leaveDeduction', label: '請假/遲到/早退', deduction: true },
  { key: 'selfPension', label: '勞退自提', deduction: true },
  { key: 'withholding', label: '薪資扣繳稅款', deduction: true },
  { key: 'laborEmployeeAmount', label: '勞保費(員工)', deduction: true },
  { key: 'nhiEmployeeAmount', label: '健保費(員工)', deduction: true },
  { key: 'secondHealthInsuranceFee', label: '二代健保', deduction: true },
];

/** 手機版薪資明細卡片，欄位順序與桌機表格一致，供 < nav 斷點顯示 */
export default function PayrollMobileCards({ items, onChange, readOnly = false }: PayrollMobileCardsProps) {
  return (
    <div className="flex flex-col gap-4 nav:hidden">
      {items.map(item => (
        <div key={item.employeeId} className="rounded-lg border border-neutral-blue-gray/30 bg-white p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="font-semibold text-neutral-dark">{item.name}</span>
            <span className="font-mono text-xs text-neutral-mid">{item.idNumber}</span>
          </div>

          <div className="mb-3">
            <Label>給薪日期</Label>
            <DatePicker
              value={paymentDateOf(item)}
              onChange={date => onChange(updateItem(items, item.employeeId, withPaymentDate(item, date)))}
              placeholder="選擇給薪日期"
              disabled={readOnly}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FIELD_LABELS.map(field => (
              <div key={String(field.key)}>
                <Label className={field.deduction ? 'text-semantic-error' : undefined}>{field.label}</Label>
                <MoneyInput
                  value={item[field.key] as number}
                  onChange={v => onChange(updateItem(items, item.employeeId, { [field.key]: v } as Partial<PayrollItem>))}
                  disabled={readOnly}
                />
              </div>
            ))}
            {item.customItems.map(col => (
              <div key={col.id}>
                <Label className={col.isDeduction ? 'text-semantic-error' : undefined}>{col.name}</Label>
                <MoneyInput
                  value={col.amount}
                  onChange={v =>
                    onChange(
                      items.map(row =>
                        row.employeeId === item.employeeId
                          ? { ...row, customItems: row.customItems.map(c => (c.id === col.id ? { ...c, amount: v } : c)) }
                          : row,
                      ),
                    )
                  }
                  disabled={readOnly}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-neutral-blue-gray/20 pt-3">
            <span className="text-sm font-medium text-neutral-dark">應付薪資</span>
            <span className="font-mono text-lg font-semibold tabular-nums text-neutral-dark">{fmtCurrency(calculatePayable(item))}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
