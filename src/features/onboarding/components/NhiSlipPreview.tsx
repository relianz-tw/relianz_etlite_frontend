'use client';

import type { NhiPreviewData } from '@/api/onboarding/preview';
import { formatTWD } from '@/lib/utils';

interface Props {
  companyName: string;
  taxId: string;
  data: NhiPreviewData;
}

function calcNhiDueROC(yearROC: number, month: number): string {
  const gregYear = yearROC + 1911;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? gregYear + 1 : gregYear;
  const lastDay = new Date(nextYear, nextMonth, 0).getDate();
  const nextMonthROC = nextYear - 1911;
  return `${nextMonthROC}/${String(nextMonth).padStart(2, '0')}/${String(
    lastDay
  ).padStart(2, '0')}`;
}

export function NhiSlipPreview({ companyName, taxId, data }: Props) {
  const { incomeCode, incomeCategory, incomeYearROC, incomeMonth, insuranceFee } =
    data;
  const paymentYM = `${incomeYearROC}/${String(incomeMonth).padStart(2, '0')}`;
  const dueDate = calcNhiDueROC(incomeYearROC, incomeMonth);

  return (
    <div className='text-sm font-[楷體-繁,STKaiti_TC,DFKai-SB,標楷體] text-neutral-dark min-w-[380px]'>
      {/* 單位資訊 */}
      <div className='border border-neutral-blue-gray/30 border-b-0 px-4 py-2 text-sm'>
        單位統一編號：{taxId || '00000000'}
      </div>
      <div className='border border-neutral-blue-gray/30 px-4 py-2 text-sm mb-0'>
        單位名稱：{companyName || '示範公司名稱'}
      </div>

      {/* 主表格 */}
      <table className='w-full border-collapse text-sm'>
        <thead>
          <tr className='bg-surface-cream'>
            <th className='border border-neutral-blue-gray/30 px-4 py-2 text-center tracking-widest'>
              所　得　類　別　及　代　號
            </th>
            <th className='border border-neutral-blue-gray/30 px-4 py-2 text-center tracking-widest'>
              給　付　年　月
            </th>
            <th className='border border-neutral-blue-gray/30 px-4 py-2 text-center tracking-widest'>
              繳　納　期　限
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className='border border-neutral-blue-gray/30 px-4 py-3 text-center'>
              <div className='font-bold'>{incomeCode}</div>
              <div>{incomeCategory}</div>
            </td>
            <td className='border border-neutral-blue-gray/30 px-4 py-3 text-center font-bold text-base'>
              {paymentYM}
            </td>
            <td className='border border-neutral-blue-gray/30 px-4 py-3 text-center font-bold text-base'>
              {dueDate}
            </td>
          </tr>
          <tr className='font-bold'>
            <td className='border border-neutral-blue-gray/30 px-4 py-3 text-center tracking-widest'>
              應　　　繳　　　金　　　額
            </td>
            <td
              className='border border-neutral-blue-gray/30 px-4 py-3 text-right text-base'
              colSpan={2}
            >
              {formatTWD(insuranceFee)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
