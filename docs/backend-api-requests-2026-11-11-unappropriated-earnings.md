# 未分配盈餘申報書（formNo 6）：特別盈餘公積變動表要在最下方

整理日期：2026-11-11。對象：`/ael/peit/form/metadata`（formNo 6，taxYear 114，staging 實測）。
對照紙本：`public/form-previews/cit-ue.webp`（紙本 `*1100*`）。

## 問題

紙本「87 年度以後特別盈餘公積變動表」在整份文件最下方（備註、簽證會計師之前）。
staging 實測畫面：這張表出現在整份表單最上面，表頭、盈餘計算、稅額計算都在它後面。

## 原因

`sections[]` 只有 `SPR`（87年度以後特別盈餘公積變動表）一個區塊；`tables[]` 的 `UE_SPR` 屬於 `SPR`，`placeAfter` 為 `null`。
這張表的格子（`layout: cell`，一～五欄）是固定欄位，在 `fields[]` 裡排在表頭、盈餘計算（`EARNINGS`）、稅額計算（`TAX`）**之前**。
規格 G1：區塊順序依該區塊第一個欄位在 `fields[]` 出現的位置，前端不調整，所以 `SPR` 排第一。

## 需要後端調整

1. `UE_SPR` 的格子欄位（`layout: cell`、`sectionCode: SPR`）在 `fields[]` 裡移到最後，排在 `TAX`（`UE_23`～`UE_27`）之後。
2. 順序應為：`FLAGS`（`UE_EXEMPT`）、`HEADER`、`EARNINGS`、`TAX`、`SPR`。
   前端另外把 `UE_EXEMPT` 勾選固定排在最上方（見下方「前端處理」），`fields[]` 內 `FLAGS` 與 `HEADER` 的相對順序不影響畫面。

## 前端處理（不需要後端配合）

- 「符合背面申報須知二免申報情形之一，本年度得免填報本申報表」（`UE_EXEMPT`）固定排在表單最上方，勾選後下面的區塊（含表頭的營利事業名稱、統一編號、收件編號）全部收起，只留這個勾選。
- 表格欄標題已經有代號（一、二、三、四、五）時，格子內不再重複顯示代號。
