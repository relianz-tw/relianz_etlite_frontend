interface StepNumberProps {
  value: number;
}

/**
 * 操作順序編號徽章：同一頁面有多個依序完成的操作區塊時，標示在各區塊標題前
 * （見 DESIGN.md「Step Number Badge」）。純顯示、無互動，順序資訊已由視覺呈現，
 * 不重複報讀給螢幕閱讀器。
 */
export default function StepNumber({ value }: StepNumberProps) {
  return (
    <span aria-hidden="true" className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-blue text-xs font-semibold tabular-nums text-white">
      {value}
    </span>
  );
}
