'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { fmtCurrency, formatYyyymmddRoc } from '@/lib/utils';
import ReconAllocationTable from './ReconAllocationTable';
import type { ReconAllocationInfo, ReconSettleResult, ReconSide } from '../types';

interface ReconSettleResultModalProps {
  open: boolean;
  side: ReconSide;
  groupLabel: string;
  result: ReconSettleResult | null;
  /** ledgerUuid → 買受人／賣方與憑證號碼，供明細表補上沖帳 API 回應本身沒有的欄位 */
  allocationInfoByUuid: Map<string, ReconAllocationInfo>;
  /** 主沖帳已成功、但電商平台扣款憑證沖銷失敗時的提示（見 ReconciliationView 的 settlePlatformFeeVouchers） */
  warning?: string;
  onClose: () => void;
}

/** 沖帳執行結果：呼叫 settle/summary 成功後，顯示本次實際入帳的摘要（含沖前/沖後餘額）與各原單明細 */
export default function ReconSettleResultModal({ open, side, groupLabel, result, allocationInfoByUuid, warning, onClose }: ReconSettleResultModalProps) {
  if (!open || !result) return null;

  // wrap 'nowrap'：金額／筆數／日期等短值不換行；'break'：結算單號可能很長，逐字斷行避免只在連字號處攔腰折斷
  // 沖前/沖後餘額僅匯總／多筆沖帳（settle/summary API）才有；逐筆沖帳勾 1 筆走手動沖帳 API 無此概念，故留空時整列略過
  const summaryRows: { label: string; value: string; wrap: 'nowrap' | 'break' }[] = [
    { label: side === 'receivable' ? '銷售管道' : '廠商', value: groupLabel, wrap: 'break' as const },
    { label: '沖帳總額', value: fmtCurrency(result.appliedSettleAmount), wrap: 'nowrap' as const },
    { label: '有沖帳筆數', value: `${result.allocations.length} 筆`, wrap: 'nowrap' as const },
    { label: result.balanceBefore !== undefined ? '沖前餘額' : '', value: fmtCurrency(result.balanceBefore ?? 0), wrap: 'nowrap' as const },
    { label: result.balanceAfter !== undefined ? '沖後餘額' : '', value: fmtCurrency(result.balanceAfter ?? 0), wrap: 'nowrap' as const },
    {
      label: result.paymentDate ? (side === 'receivable' ? '收款日' : '付款日') : '',
      value: result.paymentDate ? formatYyyymmddRoc(result.paymentDate) : '',
      wrap: 'nowrap' as const,
    },
    { label: '結算單號', value: result.settlementOrderCode ?? '—', wrap: 'break' as const },
  ].filter(row => row.label);

  return (
    <Modal open onClose={onClose} title="沖帳結果" widthClassName="max-w-[840px]">
      {warning && <p className="mb-3 rounded-md bg-semantic-error/10 px-3 py-2 text-sm text-semantic-error">{warning}</p>}
      <div className="grid grid-cols-1 gap-y-2 text-sm min-[1300px]:grid-cols-3 min-[1300px]:gap-x-6">
        {summaryRows.map(row => (
          <div key={row.label} className="flex items-center justify-between gap-2">
            <span className="shrink-0 text-neutral-mid">{row.label}</span>
            <span className={`font-mono font-semibold tabular-nums text-neutral-dark ${row.wrap === 'nowrap' ? 'whitespace-nowrap' : 'break-all text-right'}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* 避免使用者要捲好幾個螢幕才找得到底部的「關閉」鈕（見下方 sticky 動作列） */}
      <div className="mt-4">
        <ReconAllocationTable allocations={result.allocations} side={side} allocationInfoByUuid={allocationInfoByUuid} />
      </div>

      {/* 手機上筆數多時內容可能高達數千 px，關閉鈕黏在底部，避免使用者要捲到最底才找得到唯一的關閉出口；
          負 margin 對齊 Modal 面板內距（手機 p-4／桌機 p-6，見 Modal.tsx） */}
      <div className="sticky bottom-0 -mx-4 -mb-4 mt-6 flex justify-end border-t border-neutral-blue-gray/30 bg-white px-4 py-3 min-[1300px]:static min-[1300px]:mx-0 min-[1300px]:mb-0 min-[1300px]:mt-6 min-[1300px]:border-0 min-[1300px]:bg-transparent min-[1300px]:px-0 min-[1300px]:py-0">
        <Button variant="primary" onClick={onClose} className="w-full min-[1300px]:w-auto">
          關閉
        </Button>
      </div>
    </Modal>
  );
}
