'use client';

import Badge from '@/components/ui/Badge';
import { formatYyyymmddRoc } from '@/lib/utils';
import type { LaborRecord } from '../types';

interface LaborPdfManagerProps {
  record: LaborRecord;
}

/**
 * 勞報單扣繳／二代健保繳款與申報狀態。
 * ⚠️ 後端目前只有 GET /ael/labour 回傳的唯讀狀態欄位（isRemitWithholding／withholdingRemitDate／
 * isRemitNhi／nhiRemitDate／isNhiDeclare／nhiDeclareDate），沒有任何寫入端點——沒有「產生繳款書」
 * 「標記已繳款」「上傳繳款證明」「申報」對應的 API，故本元件只呈現後端記錄的真實狀態，不提供操作按鈕。
 */
export default function LaborPdfManager({ record }: LaborPdfManagerProps) {
  return (
    <div className="flex flex-col gap-5">
      {record.withholdingTax > 0 && (
        <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-dark">扣繳繳款</h3>
            <Badge tone={record.isRemitWithholding ? 'success' : 'neutral'}>{record.isRemitWithholding ? '已繳納' : '未繳納'}</Badge>
          </div>
          {record.isRemitWithholding && record.withholdingRemitDate && (
            <p className="text-xs text-neutral-mid">繳款日期：{formatYyyymmddRoc(record.withholdingRemitDate)}</p>
          )}
          <p className="mt-2 text-xs text-neutral-mid">繳款書產製與繳款登記尚未串接後端，以上為後端記錄的真實狀態。</p>
        </div>
      )}

      {record.secondHealthInsuranceFee > 0 && (
        <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-neutral-dark">二代健保繳款</h3>
            <div className="flex gap-2">
              <Badge tone={record.isRemitNhi ? 'success' : 'neutral'}>{record.isRemitNhi ? '已繳納' : '未繳納'}</Badge>
              <Badge tone={record.isNhiDeclare ? 'info' : 'neutral'}>{record.isNhiDeclare ? '已申報' : '未申報'}</Badge>
            </div>
          </div>
          {record.isRemitNhi && record.nhiRemitDate && <p className="text-xs text-neutral-mid">繳款日期：{formatYyyymmddRoc(record.nhiRemitDate)}</p>}
          {record.isNhiDeclare && record.nhiDeclareDate && <p className="text-xs text-neutral-mid">申報日期：{formatYyyymmddRoc(record.nhiDeclareDate)}</p>}
          <p className="mt-2 text-xs text-neutral-mid">繳款書產製與申報登記尚未串接後端，以上為後端記錄的真實狀態。</p>
        </div>
      )}
    </div>
  );
}
