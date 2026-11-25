import { pickIdentifiedValue, toFieldBBox, type IdentifiedField, type IdentifiedRow } from '@/api/peit';
import type { FieldLocation } from '../state/initializationReducer';

/** 辨識欄位陣列轉成「欄位代碼 → 值」；讀不出值的欄位不收，畫面維持空白 */
export function toValueMap(fields: IdentifiedField[]): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  for (const field of fields) {
    const value = pickIdentifiedValue(field);
    if (value !== undefined) result[field.fieldCode] = value;
  }
  return result;
}

/**
 * 辨識回傳的可重複列轉成畫面的列。財產目錄的列有明細（rowKind 省略）與小計（rowKind=SUBTOTAL），可能另有類別標題列（ROW_LINE_TYPE=category，後端不保證有）；
 * 類別編號取列自己的 ROW_CATEGORY_CODE、groupKey，都沒有就沿用上一列。畫面每一列自己帶類別編號、名稱，類別列本身不當成一列明細。
 * 沒有這些類別欄位的表（如公司登記事項表）走這段等同原樣轉換。
 */
export function toRowValues(rows: IdentifiedRow[]): Record<string, string | number>[] {
  const maps = rows.map(row => ({ row, values: toValueMap(row.fields) }));
  // 類別名稱：同一個類別編號的任一列（類別列或小計列）有帶就沿用到整組
  const names = new Map<string, string | number>();
  for (const { row, values } of maps) {
    const code = values.ROW_CATEGORY_CODE ?? row.groupKey ?? undefined;
    if (code !== undefined && values.ROW_CATEGORY_NAME !== undefined) names.set(String(code), values.ROW_CATEGORY_NAME);
  }
  const result: Record<string, string | number>[] = [];
  let code: string | number | undefined;
  for (const { row, values } of maps) {
    const lineType = values.ROW_LINE_TYPE;
    // 類別編號：列自己帶的 > groupKey > 沿用上一列（後端不保證有獨立類別列）
    code = values.ROW_CATEGORY_CODE ?? row.groupKey ?? code;
    // 類別列只用來更新目前類別，不當成一列明細
    if (lineType === 'category') continue;
    delete values.ROW_LINE_TYPE;
    if (code !== undefined) {
      values.ROW_CATEGORY_CODE = code;
      const name = names.get(String(code));
      if (name !== undefined) values.ROW_CATEGORY_NAME = name;
    }
    // 小計列帶 __kind 標記，畫面才知道它是哪一組的小計格
    result.push(row.rowKind === 'SUBTOTAL' || lineType === 'subtotal' ? { ...values, __kind: 'SUBTOTAL' } : values);
  }
  return result;
}

/** 欄位有值（非 undefined、非空字串）；0 算有值 */
export function hasValue(value: string | number | undefined): value is string | number {
  return value !== undefined && value !== '';
}

/** 值是否相同：文字比對去頭尾空白，兩邊都是數字時以數值比（"1000" 與 1000 視為相同） */
export function sameValue(a: string | number, b: string | number): boolean {
  const x = String(a).trim();
  const y = String(b).trim();
  if (x === y) return true;
  const nx = Number(x);
  const ny = Number(y);
  return x !== '' && y !== '' && !Number.isNaN(nx) && !Number.isNaN(ny) && nx === ny;
}

/**
 * 辨識欄位的座標轉成各欄位在原件上的位置；沒有座標的欄位不收（表格列規格上也沒有座標）。
 *
 * pageOverride：改用後端回的頁面圖時，那張圖就是這張表唯一的一頁，欄位的 page 不該再參與比對。
 * 後端各表回的 page 不一致（損益表回 1，基本稅額表回原件頁次 3），照收會讓對不到 1 的表全部畫不出框。
 */
export function toLocations(fields: IdentifiedField[], sourceId: string, pageOverride?: number): Record<string, FieldLocation> {
  const result: Record<string, FieldLocation> = {};
  for (const field of fields) {
    const box = toFieldBBox(field);
    if (box) result[field.fieldCode] = { ...box, page: pageOverride ?? box.page, sourceId };
  }
  return result;
}
