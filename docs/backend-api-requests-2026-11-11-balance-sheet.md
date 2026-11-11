# 資產負債表（formNo 4）：無形資產與「所含商譽金額」要放在同一列

整理日期：2026-11-11。對象：`/ael/peit/form/metadata`（formNo 4，資產負債表，taxYear 114，staging 實測）。
對照紙本：`public/form-previews/cit-balance-sheet.webp`。

## 問題

紙本 1510 那一列是一行字，商譽金額直接填在標題裡的空格：

> 1510　無形資產（包括商譽金額 ＿＿＿＿ 元）

staging 實測：

| 欄位 | `fieldCode` | 現況 |
|------|-------------|------|
| 無形資產 | `BS_1510`（`officialFieldCode: "1510"`） | `layout: row`、`labelTemplate: null` |
| 無形資產所含商譽金額 | `BS_1510_GOODWILL`（`officialFieldCode: null`） | `layout: row`、`parentFieldCode: BS_1510`、`labelTemplate: null`，在 `fields[]` 排第 90，離 1510 很遠 |

所以畫面上它是區塊最下面獨立的一列「無形資產所含商譽金額」，與 1510 隔很遠。

## 需要後端調整（依 `開帳文件修改.md` G1：`layout: inline`、`labelTemplate`、`parentRowCode`）

1. `BS_1510_GOODWILL`：
   - `layout` 改為 `"inline"`
   - `parentRowCode` 設為 `BS_1510`（`parentFieldCode` 維持 `BS_1510`）
2. `BS_1510`：`labelTemplate` 設為
   `無形資產（包括商譽金額 {{field:BS_1510_GOODWILL}} 元）`（`displayName` 維持「無形資產」）。
3. `BS_1510_GOODWILL` 不需要在 `fields[]` 排在 1510 旁邊（它嵌進 1510 的標題裡），但請維持值的讀寫與送出不變。

## 前端處理

前端已支援資產負債表列的 `labelTemplate`：標題裡的 `{{field:}}` 畫成嵌在文字中的輸入框，
被模板引用的欄位不再單獨成列。後端補上以上兩點後不需再改前端；補上之前畫面維持現狀（獨立一列）。
