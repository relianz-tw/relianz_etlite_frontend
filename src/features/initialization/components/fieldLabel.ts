/** 欄位標籤字級：名稱太長時縮小一級，換行後仍整齊 */
export function fieldLabelClass(label: string): string {
  return label.length > 14 ? 'text-xs' : 'text-[13px]';
}

/** 欄位標籤與輸入框同一行時，標籤的共用寬度與換行樣式 */
export const FIELD_LABEL_BASE = 'w-[38%] shrink-0 break-words font-medium leading-snug text-neutral-dark';
