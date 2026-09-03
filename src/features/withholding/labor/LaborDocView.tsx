'use client';

import Button from '@/components/ui/Button';
import { fmtCurrency } from '@/lib/utils';
import { ChevronLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import { getLaborRecord } from './mockStore';

function rocDate(year: number, month: number, day: number): string {
  return `${year - 1911}/${month}/${day}`;
}

// 公司名稱尚未串接「基本設定」API，暫以佔位文字呈現，待後端提供公司資料查詢後串接
const PLACEHOLDER_COMPANY_NAME = '友信創新股份有限公司';

/** A4 列印版勞務報酬單，比照原專案 pageOne.tsx 版面精簡而成 */
export default function LaborDocView({ uuid }: { uuid: string }) {
  const record = getLaborRecord(uuid);

  if (!record) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-off-white text-sm text-neutral-mid">找不到此勞報單資料</div>;
  }

  const withholdingRateLabel = record.serviceType === '50' ? '5% 兼職人員扣稅' : '10% 執行業務扣稅';

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[900px] px-4 pt-4 pb-10 print:hidden">
        <div className="mb-4 flex items-center justify-between">
          <Link href={`/withholding/labor/${uuid}`} className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-mid hover:bg-surface-cream hover:text-neutral-dark">
            <ChevronLeft size={20} />
          </Link>
          <Button icon={Printer} onClick={() => window.print()}>
            列印
          </Button>
        </div>
      </div>

      <div className="mx-auto w-[210mm] bg-white p-12 text-neutral-dark">
        <div className="text-center text-2xl font-semibold">{PLACEHOLDER_COMPANY_NAME} 勞務報酬單</div>

        <div className="mt-6 border-2 border-neutral-dark text-sm">
          <div className="border-b-2 border-neutral-dark bg-surface-cream p-2 text-center font-semibold">支領內容摘要</div>
          <div className="p-4 leading-relaxed">
            茲證明 <span className="font-semibold">{record.name}</span> 確實領取下列款項無誤
            <br />
            勞務期間：{rocDate(record.serviceYear, record.serviceMonth, record.serviceDay)}
            <br />
            專案名稱勞務內容：{record.serviceName}
          </div>
          <table className="w-full border-t-2 border-neutral-dark text-center">
            <thead>
              <tr className="border-b border-neutral-dark">
                <th className="border-r border-neutral-dark p-2">應付金額</th>
                <th className="border-r border-neutral-dark p-2">代扣二代健保／所得稅（2.11% 二代健保扣費 · {withholdingRateLabel}）</th>
                <th className="p-2">實付金額</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-r border-neutral-dark p-3 font-mono">{fmtCurrency(record.payableAmount)}</td>
                <td className="border-r border-neutral-dark p-3 font-mono">{fmtCurrency(record.withholdingTax + record.secondHealthInsuranceFee)}</td>
                <td className="p-3 font-mono">{fmtCurrency(record.actualPaymentAmount)}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex items-center gap-6 border-t-2 border-neutral-dark p-3">
            <span className="font-semibold">所得格式代號：</span>
            {(['50', '9A', '9B'] as const).map(code => (
              <span key={code} className="flex items-center gap-1.5">
                <span
                  className={`inline-block h-3 w-3 rounded-full border border-neutral-dark ${record.serviceType === code ? 'bg-neutral-dark' : ''}`}
                />
                {code}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t-2 border-neutral-dark p-4">
            <div>所得人姓名：{record.name}</div>
            <div>身分證統一編號：{record.idNumber || '-'}</div>
            <div className="col-span-2">聯絡電話：{record.phone}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
