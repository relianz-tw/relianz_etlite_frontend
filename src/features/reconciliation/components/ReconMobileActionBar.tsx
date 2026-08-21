'use client';

import Button from '@/components/ui/Button';

interface ReconMobileActionBarProps {
  /** 左側摘要說明文字（如「已選 3 筆」「手續費 -$1,120 · 實際存入」） */
  summaryLabel: string;
  /** 右側金額（已格式化字串，如 $74,190） */
  summaryValue: string;
  actionLabel: string;
  actionDisabled: boolean;
  /** 一律是「開啟底部面板」，真正送出仍是面板內 ReconPoolPanel 既有的主要按鈕（見 ReconciliationView 說明） */
  onAction: () => void;
}

/**
 * 行動版底部固定操作條（Sticky Action Bar，見 DESIGN.md「Sticky Action Bar（行動版底部固定操作條）」）：
 * 手機（< nav 1000px）捲動交易清單時常駐顯示已選摘要與主要動作按鈕，避免使用者捲到清單底部才看得到
 * 沖帳入口。桌機不出現（nav:hidden），主要動作按鈕改置於側欄 ReconPoolPanel 內。
 */
export default function ReconMobileActionBar({ summaryLabel, summaryValue, actionLabel, actionDisabled, onAction }: ReconMobileActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-neutral-blue-gray/30 bg-white px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] nav:hidden">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-neutral-mid">{summaryLabel}</p>
        <p className="truncate font-mono text-sm font-semibold tabular-nums text-neutral-dark">{summaryValue}</p>
      </div>
      <Button variant="primary" onClick={onAction} disabled={actionDisabled} className="shrink-0">
        {actionLabel}
      </Button>
    </div>
  );
}
