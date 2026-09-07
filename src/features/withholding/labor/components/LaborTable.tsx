'use client';

import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { fmtCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signLinkFor } from '../data';
import type { LaborRecord } from '../types';

interface LaborTableProps {
  rows: LaborRecord[];
  isLocked: boolean;
  onPaymentDateChange: (uuid: string, date: Date) => Promise<void>;
}

const thClass = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid';
const tdClass = 'whitespace-nowrap px-4 py-3.5 text-sm text-neutral-dark';

function rocDate(year: number, month: number, day: number): string {
  return `${year - 1911}/${month}/${day}`;
}

function rocDateTime(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear() - 1911;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function LaborTable({ rows, isLocked, onPaymentDateChange }: LaborTableProps) {
  const router = useRouter();
  const [copiedUuid, setCopiedUuid] = useState<string | null>(null);
  const [updatingUuid, setUpdatingUuid] = useState<string | null>(null);
  const [dateErrors, setDateErrors] = useState<Record<string, string>>({});

  const handleCopyLink = async (row: LaborRecord) => {
    await navigator.clipboard.writeText(signLinkFor(row.uuid, row.serviceType));
    setCopiedUuid(row.uuid);
    setTimeout(() => setCopiedUuid(prev => (prev === row.uuid ? null : prev)), 2000);
  };

  const handleDateChange = async (row: LaborRecord, date: Date | undefined) => {
    if (!date) return;
    setUpdatingUuid(row.uuid);
    setDateErrors(prev => {
      const next = { ...prev };
      delete next[row.uuid];
      return next;
    });
    try {
      await onPaymentDateChange(row.uuid, date);
    } catch (err) {
      setDateErrors(prev => ({ ...prev, [row.uuid]: getFriendlyErrorMessage(err) }));
    } finally {
      setUpdatingUuid(null);
    }
  };

  return (
    <div className="hidden overflow-hidden rounded-md border border-neutral-blue-gray/30 bg-white nav:block">
      <table className="w-full border-collapse">
        <thead className="bg-surface-off-white">
          <tr className="border-b border-neutral-blue-gray/40">
            <th className={thClass}>交易編號</th>
            <th className={thClass}>姓名</th>
            <th className={thClass}>專案名稱</th>
            <th className={`${thClass} text-right`}>總金額</th>
            <th className={`${thClass} text-right`}>扣繳稅金</th>
            <th className={`${thClass} text-right`}>二代健保費</th>
            <th className={thClass}>勞務提供日期</th>
            <th className={thClass}>勞務付款日期</th>
            <th className={thClass}>簽署狀態</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-10 text-center text-sm text-neutral-mid">
                此期間沒有更多的資料了
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row.uuid}
                onClick={() => router.push(`/withholding/labor/${row.uuid}?ic=${row.serviceType}`)}
                className={`cursor-pointer border-b border-neutral-blue-gray/20 last:border-0 hover:bg-brand-blue/5 ${i % 2 === 1 ? 'bg-surface-warm/30' : ''}`}
              >
                <td className={`${tdClass} font-mono`}>{row.orderCode || '-'}</td>
                <td className={tdClass}>{row.name}</td>
                <td className={tdClass}>{row.serviceName}</td>
                <td className={`${tdClass} text-right font-mono tabular-nums`}>{fmtCurrency(row.payableAmount)}</td>
                <td className={`${tdClass} text-right font-mono tabular-nums`}>{fmtCurrency(row.withholdingTax)}</td>
                <td className={`${tdClass} text-right font-mono tabular-nums`}>{fmtCurrency(row.secondHealthInsuranceFee)}</td>
                <td className={`${tdClass} font-mono`}>{rocDate(row.serviceYear, row.serviceMonth, row.serviceDay)}</td>
                <td className={tdClass} onClick={e => e.stopPropagation()}>
                  <div className="w-40">
                    <DatePicker
                      value={new Date(row.paymentYear, row.paymentMonth - 1, row.paymentDay)}
                      onChange={date => handleDateChange(row, date)}
                      disabled={isLocked || updatingUuid === row.uuid}
                    />
                  </div>
                  {updatingUuid === row.uuid && <p className="mt-1 text-xs text-neutral-mid">更新中…</p>}
                  {dateErrors[row.uuid] && <p className="mt-1 text-xs text-semantic-error">{dateErrors[row.uuid]}</p>}
                </td>
                <td className={tdClass} onClick={e => e.stopPropagation()}>
                  {row.signStatus === 1 ? (
                    <span className="font-mono text-xs text-neutral-mid">{rocDateTime(row.signTime)}</span>
                  ) : (
                    <Button size="sm" variant="outline" disabled={isLocked} onClick={() => handleCopyLink(row)}>
                      {copiedUuid === row.uuid ? '已複製連結' : '複製簽署連結'}
                    </Button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
