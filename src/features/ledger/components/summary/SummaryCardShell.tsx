import type { ReactNode } from 'react';

interface SummaryCardShellProps {
  label: string;
  /** 卡片右上角動作區（日/週切換、展開圖示、示意資料標記等） */
  action?: ReactNode;
  /** 桌機 12 欄 grid 佔的欄數；手機一律單欄。用靜態對照表轉 class，
   *  Tailwind JIT 只掃描原始碼字面量，動態拼接的 class（如 `nav:col-span-${span}`）會被 purge 掉 */
  span: 3 | 6;
  children: ReactNode;
}

const SPAN_CLASS: Record<3 | 6, string> = {
  3: 'nav:col-span-3',
  6: 'nav:col-span-6',
};

export default function SummaryCardShell({ label, action, span, children }: SummaryCardShellProps) {
  return (
    <div className={`flex min-w-0 flex-col rounded-lg border border-neutral-blue-gray/30 bg-white p-5 ${SPAN_CLASS[span]}`}>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-neutral-mid">{label}</span>
        {action}
      </div>
      {/* min-h-0：抵銷 flex item 預設 min-height:auto，讓子項的 flex-1 能依卡片實際高度撐滿（grid stretch 出的高度）*/}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
