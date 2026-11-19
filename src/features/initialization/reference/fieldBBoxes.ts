/** 欄位在原件圖片上的位置：page 從 1 起，x／y／w／h 為 0–1 的相對座標（左上角為原點），與圖片實際尺寸無關 */
export interface FieldBBox {
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * TODO：後端辨識 API 回傳欄位座標後，改由辨識結果提供，並刪除這份假資料。
 * 目前只是封面常見欄位的示意位置（key = fieldCode），用來驗證對照面板的放大與紅框。
 */
const MOCK_FIELD_BBOXES: Record<string, FieldBBox> = {
  HDR_VAT_NO: { page: 1, x: 0.2, y: 0.14, w: 0.22, h: 0.03 },
  HDR_COMPANY_NAME: { page: 1, x: 0.2, y: 0.18, w: 0.5, h: 0.03 },
  HDR_OWNER_NAME: { page: 1, x: 0.2, y: 0.22, w: 0.28, h: 0.03 },
  HDR_ADDRESS: { page: 1, x: 0.2, y: 0.26, w: 0.65, h: 0.03 },
  HDR_PHONE: { page: 1, x: 0.2, y: 0.3, w: 0.28, h: 0.03 },
  HDR_TAX_REG_NO: { page: 1, x: 0.55, y: 0.14, w: 0.28, h: 0.03 },
  HDR_INDUSTRY_CODE: { page: 1, x: 0.2, y: 0.34, w: 0.45, h: 0.03 },
};

export function getFieldBBox(fieldCode: string | null): FieldBBox | null {
  return fieldCode ? (MOCK_FIELD_BBOXES[fieldCode] ?? null) : null;
}
