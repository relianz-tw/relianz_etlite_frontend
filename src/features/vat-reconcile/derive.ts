import type { VatCompareDiff, VatCompareResult } from '@/api/peit';

/** 營業稅雙月期別代碼（compare 的 cmsPhase 僅接受這六個） */
export const VAT_PHASES = [1, 3, 5, 7, 9, 11] as const;

export type PeriodStatus = 'matched' | 'pending' | 'notFiled';

export type TaskKind = 'invoiceBook' | 'shortfall' | 'surplus' | 'review';

export interface ReconcileTask {
  id: string;
  kind: TaskKind;
  /** 需補登的交易面向；invoiceBook／review 沒有 */
  side?: 'out' | 'in';
  title: string;
  description: string;
  /** 剩餘金額（元，正數），直接取後端 delta 的絕對值，不在前端加總 */
  amount?: number;
}

export interface PeriodReconcile {
  status: PeriodStatus;
  formKind: string;
  diffs: VatCompareDiff[];
  tasks: ReconcileTask[];
}

/**
 * 各面向用來呈現「剩餘金額」的欄位碼（401／403 共用，見 GET /ael/peit/form/metadata formNo 11／12）。
 * 一律取後端已算好的合計欄位，避免前端自行加總。
 */
const OUT_AMOUNT_FIELD = 'OUT_SALES_GRAND_TOTAL';
const IN_AMOUNT_FIELDS: { fieldCode: string; label: string }[] = [
  { fieldCode: 'IN_PURCHASE_AMT_SUM', label: '進貨及費用' },
  { fieldCode: 'IN_ASSET_AMT_SUM', label: '固定資產' },
];

/** 差額容許誤差：IN_NONDEDUCT_RATIO 為小數，避免浮點雜訊被誤判成有差異 */
const DELTA_EPSILON = 1e-6;

export const hasDelta = (d: VatCompareDiff) => d.delta !== null && Math.abs(d.delta) > DELTA_EPSILON;

/** 期別 → 「07–08 月」 */
export function phaseRangeLabel(phase: number): string {
  return `${String(phase).padStart(2, '0')}–${String(phase + 1).padStart(2, '0')} 月`;
}

/**
 * 依 compare 回傳推導該期狀態與待完成項目。
 * - filed 為 null：尚未上傳申報書，無從比對
 * - delta < 0：帳簿少於申報值，需補登；delta > 0：帳簿多於申報值，需檢查
 * @param bookCount 該期發票本數；僅在銷項不足時用來判斷是否要先建發票本
 */
export function deriveReconcile(result: VatCompareResult, bookCount: number): PeriodReconcile {
  const base = { formKind: result.formKind, diffs: result.diffs };
  if (result.filed === null) return { ...base, status: 'notFiled', tasks: [] };

  const diffOf = (fieldCode: string) => result.diffs.find(d => d.fieldCode === fieldCode);
  const tasks: ReconcileTask[] = [];

  const outDiff = diffOf(OUT_AMOUNT_FIELD);
  if (outDiff && hasDelta(outDiff)) {
    const amount = Math.abs(outDiff.delta as number);
    if ((outDiff.delta as number) < 0) {
      if (bookCount === 0) {
        tasks.push({
          id: 'invoiceBook',
          kind: 'invoiceBook',
          title: '您尚未有本期發票簿',
          description: '補登本期銷項發票前，需要先建立本期發票簿（字軌）。',
        });
      }
      tasks.push({
        id: 'shortfall-out',
        kind: 'shortfall',
        side: 'out',
        title: '銷項發票不足',
        description: '申報的銷售額比帳簿多，請補登本期銷項發票。',
        amount,
      });
    } else {
      tasks.push({
        id: 'surplus-out',
        kind: 'surplus',
        side: 'out',
        title: '帳簿銷項多於申報',
        description: '帳簿的銷售額比申報書多，請檢查是否重複登錄或期別錯置。',
        amount,
      });
    }
  }

  IN_AMOUNT_FIELDS.forEach(({ fieldCode, label }) => {
    const d = diffOf(fieldCode);
    if (!d || !hasDelta(d)) return;
    const amount = Math.abs(d.delta as number);
    if ((d.delta as number) < 0) {
      tasks.push({
        id: `shortfall-${fieldCode}`,
        kind: 'shortfall',
        side: 'in',
        title: `進項憑證不足（${label}）`,
        description: `申報的${label}金額比帳簿多，請補登本期進項憑證。`,
        amount,
      });
    } else {
      tasks.push({
        id: `surplus-${fieldCode}`,
        kind: 'surplus',
        side: 'in',
        title: `帳簿進項多於申報（${label}）`,
        description: `帳簿的${label}金額比申報書多，請檢查是否重複登錄或期別錯置。`,
        amount,
      });
    }
  });

  // 有欄位不符、但金額合計欄都對得上（例如只有稅額欄差異）：交給使用者看明細，不硬湊補登任務
  if (tasks.length === 0 && result.diffs.some(hasDelta)) {
    tasks.push({
      id: 'review',
      kind: 'review',
      title: '部分欄位與申報書不一致',
      description: '金額合計欄位相符，但有其他欄位存在差額，請查看下方對帳明細。',
    });
  }

  return { ...base, status: tasks.length > 0 ? 'pending' : 'matched', tasks };
}

/** 該期是否需要查發票本數：只有「已寫入申報書且銷項帳簿少於申報」才會用到，其餘省一次 API */
export function needsBookCount(result: VatCompareResult): boolean {
  if (result.filed === null) return false;
  const d = result.diffs.find(x => x.fieldCode === OUT_AMOUNT_FIELD);
  return !!d && hasDelta(d) && (d.delta as number) < 0;
}
