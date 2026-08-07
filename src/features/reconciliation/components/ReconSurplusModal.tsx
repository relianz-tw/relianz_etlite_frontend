"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { fmtCurrency } from "@/lib/utils";

interface ReconSurplusModalProps {
  open: boolean;
  groupLabel: string;
  /** 本次沖帳金額（使用者輸入的對帳單金額） */
  settleAmount: number;
  /** 待沖帳金額（該管道/廠商目前所有待沖總額） */
  totalBeforeRemaining: number;
  /** 尚未沖入的差額：少沖時為仍欠的錢，超沖時為多付/多收的錢 */
  diff: number;
  submitting?: boolean;
  submitError?: string;
  /** A：回去檢查，不呼叫任何 API，停留原畫面 */
  onBack: () => void;
  /** B：留在餘額上，帶下次沖帳使用（isBalance=true） */
  onKeepOnBalance: () => void;
  /** C：將差額沖入最後一筆交易（isBalance=false） */
  onSettleToLast: () => void;
}

/**
 * 預覽拆帳後發現有超沖或少沖差額時的三選一提示：
 * A 回去檢查金額／交易資料是否輸入錯誤；B 差額記入餘額，留待下次沖帳使用；C 差額直接沖入最後一筆交易。
 * B／C 選擇後會直接呼叫執行沖帳 API（非預覽），故需顯示送出中狀態與錯誤訊息。
 */
export default function ReconSurplusModal({
  open,
  groupLabel,
  settleAmount,
  totalBeforeRemaining,
  diff,
  submitting,
  submitError,
  onBack,
  onKeepOnBalance,
  onSettleToLast,
}: ReconSurplusModalProps) {
  if (!open) return null;

  return (
    <Modal
      open
      onClose={onBack}
      title="沖帳金額有差額"
      widthClassName="max-w-[480px]"
    >
      <p className="text-sm leading-relaxed text-neutral-dark">
        本次「{groupLabel}」沖帳金額{" "}
        <span className="font-mono font-semibold tabular-nums">
          {fmtCurrency(settleAmount)}
        </span>{" "}
        元，待沖帳金額{" "}
        <span className="font-mono font-semibold tabular-nums">
          {fmtCurrency(totalBeforeRemaining)}
        </span>{" "}
        元，仍有{" "}
        <span className="font-mono font-semibold tabular-nums text-semantic-error">
          {fmtCurrency(diff)}
        </span>{" "}
        元尚未沖入，請問希望：
      </p>
      {submitError && (
        <p className="mt-3 text-sm text-semantic-error">{submitError}</p>
      )}
      <div className="mt-6 flex flex-col gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={submitting}
          className="w-full justify-center"
        >
          回去檢查
        </Button>
        <Button
          variant="primary"
          onClick={onKeepOnBalance}
          disabled={submitting}
          className="w-full justify-center"
        >
          {submitting ? "送出中…" : "留在餘額上，帶下次沖帳使用"}
        </Button>
        <Button
          variant="outline"
          onClick={onSettleToLast}
          disabled={submitting}
          className="w-full justify-center"
        >
          {submitting ? "送出中…" : "將金額沖入最後一筆交易"}
        </Button>
      </div>
    </Modal>
  );
}
