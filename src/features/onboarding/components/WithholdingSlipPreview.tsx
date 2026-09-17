'use client';

import type { WithholdingPreviewData } from '@/api/onboarding/preview';
import { formatTWD } from '@/lib/utils';

interface Props {
  companyName: string;
  taxId: string;
  representative: string;
  address: string;
  phone: string;
  data: WithholdingPreviewData;
}

const INCOME_ROWS = [
  { label: '(1) 每月給付之薪資：選擇按扣繳稅額表扣繳', key: 1 },
  { label: '(2) 每月給付之薪資：選擇按 5％ 扣繳', key: 2 },
  {
    label: '(3) 獎金、津貼、補助費等非每月給付之薪資及兼職所得：按 5％ 扣繳',
    key: 3,
  },
  { label: '(4) 給付非中華民國境內居住之個人薪資按 18％ 扣繳', key: 4 },
  { label: '(5) 給付非中華民國境內居住之個人薪資按 6％ 扣繳', key: 5 },
  {
    label:
      '(6) 政府派駐國外人員之薪資按全月給付總額超過新臺幣 3 萬元部分扣取 5％ 稅款',
    key: 6,
  },
];

export function WithholdingSlipPreview({
  companyName,
  taxId,
  representative,
  address,
  phone,
  data,
}: Props) {
  const {
    fixedSalary,
    fixedSalaryTaxWithheldSum,
    variableSalary,
    nonFixedSalaryTaxWithheldSum,
    incomeYearROC,
    incomeMonth,
    paymentYearROC,
    paymentMonth,
    paymentDay,
    totalSalary,
    totalTaxWithheld,
  } = data;

  const dueDate = `${paymentYearROC} 年 ${String(
    paymentMonth + 1 > 12 ? 1 : paymentMonth + 1
  ).padStart(2, '0')} 月 10 日`;

  function getRowData(key: number) {
    if (key === 1)
      return { income: fixedSalary, tax: fixedSalaryTaxWithheldSum };
    if (key === 3)
      return { income: variableSalary, tax: nonFixedSalaryTaxWithheldSum };
    return null;
  }

  return (
    <div className='text-sm font-[楷體-繁,STKaiti_TC,DFKai-SB,標楷體] text-neutral-dark min-w-[660px]'>
      {/* 頂部資料區 */}
      <div className='grid grid-cols-2 gap-x-8 gap-y-1 border border-neutral-blue-gray/30 p-4 mb-0 text-sm'>
        <div>扣繳單位名稱：{companyName || '示範公司名稱'}</div>
        <div>扣繳單位統一編號：{taxId || '00000000'}</div>
        <div>扣繳單位地址：{address || '示範公司地址'}</div>
        <div>限繳日期：{dueDate}</div>
        <div>扣繳義務人：{representative || '示範負責人姓名'}</div>
        <div>聯絡電話：{phone || '—'}</div>
      </div>

      {/* 主表格 */}
      <table className='w-full border-collapse text-xs'>
        <thead>
          <tr className='bg-surface-cream'>
            <th className='border border-neutral-blue-gray/30 px-2 py-2 text-left w-2/5'>
              員　工　人　數
            </th>
            <th
              className='border border-neutral-blue-gray/30 px-2 py-2 text-center'
              colSpan={2}
            >
              所得所屬
              <div className='flex justify-around text-xs mt-0.5'>
                <span>年</span>
                <span>月</span>
              </div>
            </th>
            <th
              className='border border-neutral-blue-gray/30 px-2 py-2 text-center'
              colSpan={3}
            >
              給付日期
              <div className='flex justify-around text-xs mt-0.5'>
                <span>年</span>
                <span>月</span>
                <span>日</span>
              </div>
            </th>
            <th className='border border-neutral-blue-gray/30 px-2 py-2 text-center'>
              給付所得總額
            </th>
            <th className='border border-neutral-blue-gray/30 px-2 py-2 text-center'>
              應扣繳稅額
            </th>
          </tr>
        </thead>
        <tbody>
          {INCOME_ROWS.map(({ label, key }) => {
            const rowData = getRowData(key);
            return (
              <tr key={key}>
                <td className='border border-neutral-blue-gray/30 px-2 py-1.5 text-xs leading-snug'>
                  <span className='text-neutral-mid mr-1'>應扣繳數</span>
                  {label}
                </td>
                <td className='border border-neutral-blue-gray/30 px-2 py-1.5 text-center'>
                  {rowData ? incomeYearROC : ''}
                </td>
                <td className='border border-neutral-blue-gray/30 px-2 py-1.5 text-center'>
                  {rowData ? String(incomeMonth).padStart(2, '0') : ''}
                </td>
                <td className='border border-neutral-blue-gray/30 px-2 py-1.5 text-center'>
                  {rowData ? paymentYearROC : ''}
                </td>
                <td className='border border-neutral-blue-gray/30 px-2 py-1.5 text-center'>
                  {rowData ? String(paymentMonth).padStart(2, '0') : ''}
                </td>
                <td className='border border-neutral-blue-gray/30 px-2 py-1.5 text-center'>
                  {rowData ? String(paymentDay).padStart(2, '0') : ''}
                </td>
                <td className='border border-neutral-blue-gray/30 px-2 py-1.5 text-right'>
                  {rowData ? formatTWD(rowData.income) : ''}
                </td>
                <td className='border border-neutral-blue-gray/30 px-2 py-1.5 text-right'>
                  {rowData ? formatTWD(rowData.tax) : ''}
                </td>
              </tr>
            );
          })}

          {/* 免扣繳人數 */}
          <tr>
            <td className='border border-neutral-blue-gray/30 px-2 py-1.5 text-center tracking-widest'>
              免　扣　繳　人　數
            </td>
            <td
              className='border border-neutral-blue-gray/30 px-2 py-1.5'
              colSpan={7}
            ></td>
          </tr>

          {/* 合計 */}
          <tr className='font-bold'>
            <td className='border border-neutral-blue-gray/30 px-2 py-1.5 text-center tracking-widest'>
              合　　　　　　　計
            </td>
            <td className='border border-neutral-blue-gray/30 px-2 py-1.5 text-center'>
              0
            </td>
            <td
              className='border border-neutral-blue-gray/30 px-2 py-1.5'
              colSpan={4}
            ></td>
            <td className='border border-neutral-blue-gray/30 px-2 py-1.5 text-right'>
              {formatTWD(totalSalary)}
            </td>
            <td className='border border-neutral-blue-gray/30 px-2 py-1.5 text-right'>
              {formatTWD(totalTaxWithheld)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
