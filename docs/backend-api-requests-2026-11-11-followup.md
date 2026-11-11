# 開帳 metadata 複查：還需要後端補的兩項

整理日期：2026-11-11。對象：`/ael/peit/form/metadata`（staging，taxYear 114）。
依先前各份文件逐項複查，除下列兩項外，formNo 1～7 的調整（表頭順序、損益表區塊歸屬與 128 區塊、基本稅額段落鏈、
資產負債表商譽與 `isTotalColumn`、投資人明細增資緩課拆分、扣繳調節揭露情形）都已確認到位。
財產目錄（formNo 8）、401／403（formNo 11、12）仍等後端調整，不在本文件範圍。

## 1. 投資人明細及分配盈餘表（formNo 5）：A 投資額合計要在表格合計列的「合計」欄

先前文件（`backend-api-requests-2026-11-11-investors.md` 第 3 點）請後端把 `INV_A_TOTAL` 改成表格格子。
目前 `INV_A_TOTAL` 已從 `SUMMARY` 區塊移除，但 `fields[]` 裡**沒有**對應的合計列格子：

- `rowNo: TOTAL` 的格子有 `INV_A1`、`INV_A2`、`INV_A3`、`INV_P`、`INV_D3`…，但沒有 `columnCode: INV_SUM`（「合計」欄）的格子。
- `columnCode: INV_SUM` 只有資料列的 `ROW_INV_SUM`。

所以畫面上投資額「合計」欄的最後一格（紙本是 A）現在是斜線，沒有欄位可填。

請後端補回該格子：

- `fieldCode: INV_A_TOTAL`（或自訂）、`officialFieldCode: "A"`
- `layout: "cell"`、`tableCode: "INV_DETAIL"`、`rowNo: "TOTAL"`、`columnCode: "INV_SUM"`、`sectionCode: "INVESTORS"`
- `formula: INV_A1 + INV_A2 + INV_A3`（同原本）、`dataType: 1`

## 2. 未分配盈餘申報書（formNo 6）：特別盈餘公積變動表要在最下方

先前文件（`backend-api-requests-2026-11-11-unappropriated-earnings.md`）請後端把 `UE_SPR` 的格子欄位移到 `fields[]` 最後。
目前這些格子（`sectionCode: SPR`、`layout: cell`）在 `fields[]` 的第 3～7 個，排在 `FLAGS`、`EARNINGS`、`TAX` 欄位之前，
所以畫面上這張表仍然在表頭後面、盈餘計算之前，不在紙本的最下方。

請後端把 `SPR` 的格子欄位移到 `TAX`（`UE_23`～`UE_27`）之後。前端依 `fields[]` 順序排區塊，調整後不需要改前端。
