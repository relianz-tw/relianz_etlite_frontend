/**
 * 營業稅 401／403 的區塊編排：metadata 只有 sectionCode，沒有名稱與大分類，先在前端對照
 * （等後端提供 sections[] 後可移除，見 docs/backend-api-requests-2026-10-15.md）。
 * 大區塊（blocks）對應設計稿的「營業人資料／銷項／進項／稅額計算／附件與申辦」，parts 為其下的小節。
 */
export interface VatPartDef {
  /** metadata 的 sectionCode */
  key: string;
  title?: string;
  note?: string;
}

export interface VatBlockDef {
  title: string;
  parts: VatPartDef[];
}

export const VAT_BLOCKS: VatBlockDef[] = [
  { title: '營業人資料', parts: [{ key: 'HEADER' }] },
  {
    title: '銷項',
    parts: [
      { key: 'OUTPUT_TAXABLE', title: '應稅銷售額', note: '依開立的發票種類分列，有幾種填幾種' },
      { key: 'OUTPUT_ZERO', title: '零稅率銷售額', note: '外銷等適用 0% 稅率，須另附零稅率銷售額清單' },
      { key: 'OUTPUT_EXEMPT', title: '免稅銷售額' },
      { key: 'OUTPUT_SPECIAL', title: '特種稅額計算銷售額' },
      { key: 'OUTPUT_TOTAL', title: '銷售額總計' },
    ],
  },
  {
    title: '進項',
    parts: [
      { key: 'INPUT_DEDUCTIBLE', title: '得扣抵進項稅額', note: '已減除營業稅法第 19 條第 1 項第 2–5 款不得扣抵項目' },
      { key: 'INPUT_OTHER', title: '其他進項金額' },
    ],
  },
  { title: '稅額計算', parts: [{ key: 'TAX_COMPUTE' }] },
  {
    title: '附件與申辦',
    parts: [
      { key: 'RECEIPT', title: '收件與申報資訊' },
      { key: 'DECLARANT', title: '申辦情形' },
    ],
  },
];

/** 稅額計算中，只有留抵或退稅時才需要填的欄位（fieldCode）：沒有值時預設收合 */
export const VAT_CREDIT_FIELD_KEYS = ['TAX_CURRENT_CREDIT', 'TAX_REFUND_LIMIT', 'TAX_REFUND', 'TAX_CARRY_CREDIT'];

/** 本期結果卡讀取的欄位：應實繳稅額、累積留抵稅額（值取自欄位，前端不計算） */
export const VAT_PAYABLE_KEY = 'TAX_PAYABLE';
export const VAT_CARRY_CREDIT_KEY = 'TAX_CARRY_CREDIT';
