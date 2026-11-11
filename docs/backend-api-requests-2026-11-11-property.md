# 財產目錄（formNo 8）：每一組的小計要能各自儲存

整理日期：2026-11-11。對象：`/ael/peit/form/metadata`、`/ael/peit/form/confirm`、`/ael/peit/cit/identify`（formNo 8，財產目錄，taxYear 114，staging 實測）。
對照紙本：`public/form-previews/cit-property.webp`。

## 問題

紙本財產目錄是分類別列示，每個類別（如 1450 運輸設備、1460 辦公設備）底下各有一列「小計」，最後再有一列「總計」。

staging 實測 metadata：

- `tables[0]`（`PROP_DETAIL`）有 `groupBy`（`ROW_CATEGORY_CODE`、`ROW_CATEGORY_NAME`，`subtotalLabel: "小計："`）。
- 小計格是固定欄位（`layout: cell`、`rowNo: SUBTOTAL`）：`PROP_SUB_COST`、`PROP_SUB_IMPROVE`、`PROP_SUB_SALVAGE`、`PROP_SUB_COST_NET`、`PROP_SUB_DEPR`、`PROP_SUB_ACCUM`、`PROP_SUB_BOOK`，
  各自 `formula: SUM(ROW_*)`、`scope: group`，每個欄位**只有一個**。
- 總計格 `PROP_TOTAL_*`（`rowNo: TOTAL`）也是固定欄位，一欄一個，`formula: SUM(ROW_*)`（整張表）。

類別可以有很多個，但小計欄位每欄只有一個，**存不下每一組各自的值**。
產品要求每一組的小計都要能手動輸入（辨識帶入的值為主，沒有帶入也沒輸入時前端依該組各列自動加總顯示），
目前只能顯示唯讀、即時算出的數字，無法輸入也無法送出。

## 需要後端調整

請支援「每一組（每個類別）各自一組小計值」的儲存、辨識回傳與確認送出。做法由後端決定，下列為建議：

1. **metadata**：小計不再是固定欄位（`PROP_SUB_*`），改成與資料列同一種欄位（`isRow: true`、`columnCode` 對應各金額欄），
   例如 `ROW_SUB_COST`、`ROW_SUB_IMPROVE`、…，並標示它們屬於「分組小計列」（例如 `rowKind: "SUBTOTAL"`，或獨立的 `subtotalFields[]`）。
2. **confirm 送出**：每個類別一筆小計列，帶分組鍵（類別編號 `ROW_CATEGORY_CODE` 的值）與各金額欄位的值，
   例如 `rows: [{ rowIndex: 0, rowKind: "DETAIL", ... }, { rowKind: "SUBTOTAL", groupKey: "1450", fields: [{ fieldCode: "ROW_SUB_COST", valueInt: 1000000 }, …] }]`。
3. **identify 回傳**：辨識到的各類別小計同樣以「類別編號 → 各欄位值」回傳，前端帶入各組小計格。
4. **總計**維持固定欄位 `PROP_TOTAL_*`（整張表只有一組），不需要調整；前端已經支援「有帶入以帶入為主，沒有時自動加總整欄」。

## 前端處理

後端確定格式後，前端把各組小計格改成可輸入：有值（辨識帶入或使用者輸入）以該值為主，沒有時依該組各列自動加總顯示。
在後端調整完成之前，各組小計維持唯讀、依該組各列即時加總顯示（沒有數字顯示「—」）。
