# `/ael/peit/cit/confirm` 規格與實際不一致處，請後端確認並更新規格

整理日期：2026-11-11。對照：apidog 規格（`POST /ael/peit/cit/confirm`）與 staging 實際回傳（`/ael/peit/cit/identify`、`/ael/peit/form/metadata`）。
前端目前依實際辨識回傳與 metadata 實作，下列各點規格沒寫或與實際不同，請後端確認「confirm 實際接受什麼」，並更新規格。

## 1. 財產目錄（`CIT_PROPERTY`）可重複列的完整格式

### 辨識（identify）實際回傳

`rows[]` 是一張扁平的列表，每個類別依序為「類別列 → 明細列… → 小計列」：

| 列種 | `rowKind` | `groupKey` | `ROW_LINE_TYPE` | 帶的欄位 |
|------|-----------|-----------|-----------------|----------|
| 類別列 | 省略 | 類別編號（如 `1450`） | `category` | `ROW_CATEGORY_CODE`、`ROW_CATEGORY_NAME`（其他欄位皆 null） |
| 明細列 | 省略 | 省略 | `item` | 明細欄位 `ROW_*`；`ROW_CATEGORY_*` 皆 null |
| 小計列 | `SUBTOTAL` | 省略 | `subtotal` | `ROW_SUB_*`；`ROW_CATEGORY_*` 皆 null |

- 明細列、小計列沒有類別欄位，只能靠前面最近的類別列依順序歸組。
- `rowIndex` 從 1 起算。
- metadata 把 `ROW_LINE_TYPE` 標 `hidden: true`，但辨識結果仍每列帶它；`開帳文件修改.md` 8.3 原本寫「移除 `ROW_LINE_TYPE`」。

### 前端目前送出（confirm）的格式

照辨識回傳的結構送回，依畫面上的類別分組整理成「類別列 → 明細列… → 小計列」：

```json
{
  "rows": [
    { "rowIndex": 0, "groupKey": "1450", "fields": [
        { "fieldCode": "ROW_LINE_TYPE", "valueText": "category" },
        { "fieldCode": "ROW_CATEGORY_CODE", "valueText": "1450" },
        { "fieldCode": "ROW_CATEGORY_NAME", "valueText": "運輸設備" } ] },
    { "rowIndex": 1, "fields": [
        { "fieldCode": "ROW_LINE_TYPE", "valueText": "item" },
        { "fieldCode": "ROW_NO", "valueText": "50001" }, { "fieldCode": "ROW_COST", "valueInt": 700000 } ] },
    { "rowIndex": 2, "rowKind": "SUBTOTAL", "fields": [
        { "fieldCode": "ROW_LINE_TYPE", "valueText": "subtotal" },
        { "fieldCode": "ROW_SUB_COST", "valueInt": 1000000 } ] }
  ]
}
```

- 沒填的空白明細列、沒有小計金額的小計列不送。
- `rowIndex` 從 0 起（規格寫 ≥ 0）。

### 請後端確認／更新規格

1. confirm 的 `rows[]` 規格目前只有 `rowIndex` 與 `fields[]`，請補上 `rowKind`（metadata 欄位說明有寫「identify／confirm 的 `rows[].rowKind` 省略視為 DETAIL」）與 `groupKey`，並寫清楚類別列的用法。
2. 上面「前端目前送出」的結構後端是否接受？若不是，請給出實際要的結構（例如：明細列／小計列是否要自己帶 `ROW_CATEGORY_*`、是否要送類別列、是否還要送 `ROW_LINE_TYPE`）。
3. `ROW_LINE_TYPE` 要保留還是移除（目前 metadata 標隱藏、辨識仍回傳）。
4. 小計列與所屬類別的對應方式：靠順序、還是靠小計列自帶的類別欄位？

## 2. 新增第 13 份文件的 `formCode`

規格的 `formCode` 清單只列到 `VAT_403`。第 13 份「各類所得扣繳暨免扣繳憑單申報書」（`formNo: 13`、`formCode: CIT_WH_RETURN`）的 metadata 已上線，
請確認 identify 回傳與 confirm 是否支援 `CIT_WH_RETURN`，並更新規格的 `formCode` 清單與 identify 的 `forms[]`（目前文件寫固定 12 筆）。

## 3. 負金額

`errorCode` 說明寫「0003 驗證（含 dataType 6、**負金額**、日期迄不得早於起…）」，但全域規格（`開帳文件修改.md`）說金額欄位（`dataType: 1`）一律允許負值。
前端目前會送出負值：

- 資產負債表的減項科目（累計折舊、備抵呆帳、庫藏股票等，紙本以（）表示）一律存負值。
- 損益表等的「其他」調整欄位、虧損、差額，使用者可輸入負號。

請確認 confirm 對負金額的實際行為，並修正規格文字：負金額是不是不會被 0003 擋下。若某些欄位仍不允許負值，請列出欄位清單。

## 4. 算式欄位（有 `formula` 的欄位）送了怎麼處理

規格寫「有 `formula` 的小計由後端算出後一併寫入」。前端目前的行為是：

- 算式欄位可編輯，辨識帶入或使用者輸入的值會照常送出（`isManualAdjusted` 依是否人工改過）；沒有值的算式欄位不送，由後端算。

請確認：算式欄位若有送值，後端是（a）以送來的值為準、（b）一律用算式重算覆蓋、還是（c）送來的值與算式不符時回錯。並更新規格說明。

## 5. 跨表驗證錯誤的訊息

規格已寫「財產目錄 `PROP_TOTAL_BOOK` ≠ 資產負債表 1400」「未攤銷費用 `UA_TOTAL_BALANCE` ≠ 資產負債表 1902」會回 0003 並附訊息，前端會把 `message` 原文顯示給使用者。
請確認這兩個驗證現在的觸發條件（例如資產負債表那一欄是空的時候是否也會擋），並保持 `message` 為可直接給使用者看的中文。

## 前端處理

後端回覆之後，若 confirm 實際格式與上面「前端目前送出」不同，前端只需要調整 `reports/confirmPayload.ts` 組列的邏輯。
