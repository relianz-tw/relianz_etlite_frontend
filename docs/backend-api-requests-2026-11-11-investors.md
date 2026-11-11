# 營利事業投資人明細及分配盈餘表（formNo 5）：區塊順序與紙本不同

整理日期：2026-11-11。對象：`/ael/peit/form/metadata`（formNo 5，taxYear 114，staging 實測）。
對照紙本：`public/form-previews/cit-investors.webp`（紙本 `*0900*`）。

## 實測 metadata 現況

- `sections[]` 只有一個區塊：`DEFER`（增資緩課核備資料，有標題）。
  `HEADER`、`FLAGS`、`SUMMARY`、`INVESTORS` 都不在 `sections[]` 內（無標題，符合紙本）。
- `fields[]` 順序（固定欄位）：`INV_DEFER_*`（`DEFER`）→ `HDR_COMPANY_NAME`、`HDR_VAT_NO`、`HDR_RECEIPT_NO`（`HEADER`）→
  `INV_NEED_TRANSFER_REPORT`、`INV_NO_PAR_VALUE`、`INV_SKIP_FORM`、`INV_FINAL_NO_PRIOR`（`FLAGS`）→
  `INV_PAID_IN_CAPITAL`(A)、B、C、D、M、F2、G、I、K、L、J、H、`INV_A_TOTAL`（`SUMMARY`）。
- `textBlocks[]`：`TB_INV_DEFER`（`DEFER`，`placeAfter: null`）。
- `tables[]`：`INV_DETAIL`（`INVESTORS`，22 欄，`placeAfter: null`），22 個 `isRow` 欄位都有 `tableCode`、`columnCode`（先前記載的缺 `tableCode` 已修正）。

依規格 G1，區塊順序是「該區塊第一個欄位在 `fields[]` 出現的位置」，所以畫面順序為：
增資緩課核備資料 → 表頭（名稱、統編、收件編號）→ 四個勾選 → 本年度已收資本總額 A–H → 投資人明細表。

## 紙本順序

1. 最上方的勾選：應填報第 C4 頁轉讓通報表、股份有限公司採行無票面金額股
2. 營利事業名稱欄所在的方框：符合填寫須知二免填勾選、辦理決算申報尚未辦理上年度結算勾選、營利事業名稱（以及統一編號、收件編號）
3. 本年度已收資本總額 A、上年度已收資本總額 B、增資各類別 C、D、M、F2、G、I、K、L、J、減資 H
4. 增資緩課核備資料（擴建計畫名稱、核准日期、文號、預計完工日期）
5. 投資人明細及分配盈餘表（含合計列 A1、A2、A3、A、P…）

## 需要後端調整

1. `fields[]` 順序改為：
   `HEADER`（`HDR_COMPANY_NAME`、`HDR_VAT_NO`、`HDR_RECEIPT_NO`）→ `FLAGS`（四個勾選，依紙本順序）→ `SUMMARY`（A–H）→ `DEFER`（`INV_DEFER_*`）。
   表頭在最前面且收件編號在表頭內（每份文件統一，見 `backend-api-requests-2026-11-11.md` 最後一段）。
2. `INV_DETAIL` 的 `placeAfter` 維持 `null`（放在最後，即 `DEFER` 之後），不用調整。
3. `TB_INV_DEFER` 屬於 `DEFER` 區塊，維持現況即可。

紙本勾選（FLAGS）與營利事業名稱的相對位置：紙本是勾選在名稱上方。
如果產品希望「表頭一律在最上面」（包含收件編號），請以產品決定為準；兩種都只需調整 `fields[]` 順序，前端不需改動。

前端只依 `sections[]`、`fields[]` 順序與 `placeAfter` 排版，不自行調整。
