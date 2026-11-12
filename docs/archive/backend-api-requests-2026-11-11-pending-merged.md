# 開帳：待後端修改彙整

整理日期：2026-11-11。把財產目錄、401／403、confirm 規格三份尚待後端處理的項目合併成一份。
損益及稅額計算表（表頭順序、有限合夥旗標）另見 `backend-api-requests-2026-11-11.md`，不在這份。

| # | 項目 | 影響 |
|---|------|------|
| 1 | 財產目錄：每組小計儲存、列格式、metadata 小瑕疵 | 格式沒定，前端目前是照辨識回傳結構送 |
| 2 | 401／403：申辦情形改成表格（必要） | 辨識與確認欄位連動改 |
| 3 | `/ael/peit/cit/confirm` 規格與實際不一致 | 需後端確認並更新規格 |
| 4 | 比率欄位精度（詢問） | 辨識實測發現 |

---

## 1. 財產目錄（formNo 8）

整理日期：2026-11-11。對象：`/ael/peit/form/metadata`、`/ael/peit/form/confirm`、`/ael/peit/cit/identify`（formNo 8，財產目錄，taxYear 114，staging 實測）。
對照紙本：`public/form-previews/cit-property.webp`。

### 問題

紙本財產目錄是分類別列示，每個類別（如 1450 運輸設備、1460 辦公設備）底下各有一列「小計」，最後再有一列「總計」。

staging 實測 metadata：

- `tables[0]`（`PROP_DETAIL`）有 `groupBy`（`ROW_CATEGORY_CODE`、`ROW_CATEGORY_NAME`，`subtotalLabel: "小計："`）。
- 小計格是固定欄位（`layout: cell`、`rowNo: SUBTOTAL`）：`PROP_SUB_COST`、`PROP_SUB_IMPROVE`、`PROP_SUB_SALVAGE`、`PROP_SUB_COST_NET`、`PROP_SUB_DEPR`、`PROP_SUB_ACCUM`、`PROP_SUB_BOOK`，
  各自 `formula: SUM(ROW_*)`、`scope: group`，每個欄位**只有一個**。
- 總計格 `PROP_TOTAL_*`（`rowNo: TOTAL`）也是固定欄位，一欄一個，`formula: SUM(ROW_*)`（整張表）。

類別可以有很多個，但小計欄位每欄只有一個，**存不下每一組各自的值**。
產品要求每一組的小計都要能手動輸入（辨識帶入的值為主，沒有帶入也沒輸入時前端依該組各列自動加總顯示），
目前只能顯示唯讀、即時算出的數字，無法輸入也無法送出。

### 需要後端調整

請支援「每一組（每個類別）各自一組小計值」的儲存、辨識回傳與確認送出。做法由後端決定，下列為建議：

1. **metadata**：小計不再是固定欄位（`PROP_SUB_*`），改成與資料列同一種欄位（`isRow: true`、`columnCode` 對應各金額欄），
   例如 `ROW_SUB_COST`、`ROW_SUB_IMPROVE`、…，並標示它們屬於「分組小計列」（例如 `rowKind: "SUBTOTAL"`，或獨立的 `subtotalFields[]`）。
2. **confirm 送出**：每個類別一筆小計列，帶分組鍵（類別編號 `ROW_CATEGORY_CODE` 的值）與各金額欄位的值，
   例如 `rows: [{ rowIndex: 0, rowKind: "DETAIL", ... }, { rowKind: "SUBTOTAL", groupKey: "1450", fields: [{ fieldCode: "ROW_SUB_COST", valueInt: 1000000 }, …] }]`。
3. **identify 回傳**：辨識到的各類別小計同樣以「類別編號 → 各欄位值」回傳，前端帶入各組小計格。
4. **總計**維持固定欄位 `PROP_TOTAL_*`（整張表只有一組），不需要調整；前端已經支援「有帶入以帶入為主，沒有時自動加總整欄」。

### 前端處理

後端確定格式後，前端把各組小計格改成可輸入：有值（辨識帶入或使用者輸入）以該值為主，沒有時依該組各列自動加總顯示。
在後端調整完成之前，各組小計維持唯讀、依該組各列即時加總顯示（沒有數字顯示「—」）。

### 1.1 辨識回傳與確認送出的列格式（請確認）

#### 辨識（identify）實際回傳

`rows[]` 是一張扁平的列表，每個類別依序為「類別列 → 明細列… → 小計列」：

| 列種 | `rowKind` | `groupKey` | `ROW_LINE_TYPE` | 帶的欄位 |
|------|-----------|-----------|-----------------|----------|
| 類別列 | 省略 | 類別編號（如 `1450`） | `category` | `ROW_CATEGORY_CODE`、`ROW_CATEGORY_NAME`（其他欄位皆 null） |
| 明細列 | 省略 | 省略 | `item` | 明細欄位 `ROW_*`；`ROW_CATEGORY_*` 皆 null |
| 小計列 | `SUBTOTAL` | 省略 | `subtotal` | `ROW_SUB_*`；`ROW_CATEGORY_*` 皆 null |

- 明細列、小計列沒有類別欄位，只能靠前面最近的類別列依順序歸組。
- `rowIndex` 從 1 起算。
- metadata 把 `ROW_LINE_TYPE` 標 `hidden: true`，但辨識結果仍每列帶它；`開帳文件修改.md` 8.3 原本寫「移除 `ROW_LINE_TYPE`」。

#### 前端目前送出（confirm）的格式

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

#### 請後端確認／更新規格

1. confirm 的 `rows[]` 規格目前只有 `rowIndex` 與 `fields[]`，請補上 `rowKind`（metadata 欄位說明有寫「identify／confirm 的 `rows[].rowKind` 省略視為 DETAIL」）與 `groupKey`，並寫清楚類別列的用法。
2. 上面「前端目前送出」的結構後端是否接受？若不是，請給出實際要的結構（例如：明細列／小計列是否要自己帶 `ROW_CATEGORY_*`、是否要送類別列、是否還要送 `ROW_LINE_TYPE`）。
3. `ROW_LINE_TYPE` 要保留還是移除（目前 metadata 標隱藏、辨識仍回傳）。
4. 小計列與所屬類別的對應方式：靠順序、還是靠小計列自帶的類別欄位？

### 1.2 metadata 小瑕疵（不影響畫面，請順手修）

`ROW_BOOK`、`ROW_SUB_BOOK`、`PROP_TOTAL_BOOK` 三個欄位的 `column` 被填成 `BOOK`，`rowCode` 被截成 `ROW`／`ROW_SUB`／`PROP_TOTAL`。
`column` 是損益表等「帳載結算金額欄」的標記，與這裡「未折減餘額」的欄代碼 `BOOK` 撞名：這三個欄位的 `column` 應為 `null`，`rowCode` 應等於 `fieldCode`。

---

## 2. 401／403（formNo 11、12，兩份相同）

紙本是一張表格：

| 申辦情形 | 姓名 | 身分證統一編號 | 電話 | 登錄文(字)號 |
|----------|------|----------------|------|---------------|
| 自行申報 | 可填 | 可填 | 可填 | 斜線（不可填） |
| 委任申報 | 可填 | 可填 | 可填 | 可填 |

目前是兩個勾選（`FILING_SELF`、`FILING_AGENT`）加分開的輸入欄（`FILER_NAME`、`FILER_ID_NO`、`FILER_PHONE`、`FILER_REG_NO`），`FILER_REG_NO` 靠 `visibleWhen: FILING_AGENT checked` 才出現。
畫面和紙本差很多，**請後端改成表格結構**（前端已支援固定列的紙本表格：左欄列標籤、格子依 `rowNo|columnCode` 對應、沒有欄位的格子畫斜線，不需要前端另外開發）。

### 2.1 建議結構（401、403 相同，`tables[]` 新增一張，`sectionCode: DECLARANT`）

- `tableCode: VAT_FILER`、`rowRepeatable: false`、`placeAfter`：接在 `ATTACH` 區塊的申報日期、核收日期之後（紙本順序）。
- `corner`：欄名「申辦情形」可放在左上角表頭格（`column` 欄名、`row` 列名，沿用其他表格的用法）。
- `columns[]`：

| `columnCode` | `title` |
|--------------|---------|
| `NAME` | 姓名 |
| `ID_NO` | 身分證統一編號 |
| `PHONE` | 電話 |
| `REG_NO` | 登錄文(字)號 |

- `rows[]`：`SELF`（`rowLabel: 自行申報`）、`AGENT`（`rowLabel: 委任申報`）。
- 格子欄位（`layout: cell`、`tableCode: VAT_FILER`、`rowNo`、`columnCode`）共 7 個：

| 列 | `columnCode` | 建議 `fieldCode` | `dataType` |
|----|--------------|------------------|-----------|
| `SELF` | `NAME`、`ID_NO`、`PHONE` | `FILER_SELF_NAME`、`FILER_SELF_ID_NO`、`FILER_SELF_PHONE` | 文字（0） |
| `AGENT` | `NAME`、`ID_NO`、`PHONE`、`REG_NO` | `FILER_AGENT_NAME`、`FILER_AGENT_ID_NO`、`FILER_AGENT_PHONE`、`FILER_AGENT_REG_NO` | 文字（0） |

- `SELF` 列的 `REG_NO` 是紙本斜線：**不要回傳該欄位**，前端會畫斜線。
- 原本的 `FILING_SELF`、`FILING_AGENT` 兩個勾選與 `FILER_NAME`、`FILER_ID_NO`、`FILER_PHONE`、`FILER_REG_NO`：
  申報人是自行還是委任，改由「哪一列有填資料」判斷（辨識也依此回填對應的列），不再需要勾選，請移除，或標 `hidden: true` 保留給後端自用。
  `choiceGroups` 的 `VAT_FILER` 一併移除。
- 辨識（identify）、確認（confirm）請改用新欄位代碼回傳與接收。

欄位代碼與 `placeAfter` 是建議，後端可自訂；重點是「畫面要是紙本那張 2 列 × 4 欄、自行申報列的登錄文(字)號為斜線」。

---

## 3. `/ael/peit/cit/confirm` 規格與實際不一致

對照 apidog 規格（`POST /ael/peit/cit/confirm`）與 staging 實際回傳。前端依實際辨識回傳與 metadata 實作，請後端確認「confirm 實際接受什麼」並更新規格。
財產目錄列格式見 1.1。

### 3.1 新增第 13 份文件的 `formCode`

規格的 `formCode` 清單只列到 `VAT_403`。第 13 份「各類所得扣繳暨免扣繳憑單申報書」（`formNo: 13`、`formCode: CIT_WH_RETURN`）的 metadata 已上線，
請確認 identify 回傳與 confirm 是否支援 `CIT_WH_RETURN`，並更新規格的 `formCode` 清單與 identify 的 `forms[]`（目前文件寫固定 12 筆）。

### 3.2 負金額

`errorCode` 說明寫「0003 驗證（含 dataType 6、**負金額**、日期迄不得早於起…）」，但全域規格（`開帳文件修改.md`）說金額欄位（`dataType: 1`）一律允許負值。
前端目前會送出負值：

- 資產負債表的減項科目（累計折舊、備抵呆帳、庫藏股票等，紙本以（）表示）一律存負值。
- 損益表等的「其他」調整欄位、虧損、差額，使用者可輸入負號。

請確認 confirm 對負金額的實際行為，並修正規格文字：負金額是不是不會被 0003 擋下。若某些欄位仍不允許負值，請列出欄位清單。

### 3.3 算式欄位（有 `formula` 的欄位）送了怎麼處理

規格寫「有 `formula` 的小計由後端算出後一併寫入」。前端目前的行為是：

- 算式欄位可編輯，辨識帶入或使用者輸入的值會照常送出（`isManualAdjusted` 依是否人工改過）；沒有值的算式欄位不送，由後端算。

請確認：算式欄位若有送值，後端是（a）以送來的值為準、（b）一律用算式重算覆蓋、還是（c）送來的值與算式不符時回錯。並更新規格說明。

### 3.4 跨表驗證錯誤的訊息

規格已寫「財產目錄 `PROP_TOTAL_BOOK` ≠ 資產負債表 1400」「未攤銷費用 `UA_TOTAL_BALANCE` ≠ 資產負債表 1902」會回 0003 並附訊息，前端會把 `message` 原文顯示給使用者。
請確認這兩個驗證現在的觸發條件（例如資產負債表那一欄是空的時候是否也會擋），並保持 `message` 為可直接給使用者看的中文。


後端回覆後，若 confirm 實際格式與 1.1「前端目前送出」不同，前端只需調整 `reports/confirmPayload.ts` 組列的邏輯。

---

## 4. 比率欄位精度（詢問）

staging 實測辨識（損益表）：`INC_07_BOOK`（毛利率）、`INC_104_BOOK`（營業淨利率）、`INC_54_ADJ`（純益率）等 `dataType: 6` 欄位只回 `valueInt`（例如 79、-353、6），`valueDecimal` 為 null。
以 89408 ÷ 112771 ≈ 79.28 來看，小數被捨去了。請確認：比率欄位辨識應回 `valueDecimal`（保留小數）還是整數即可？若應保留小數，請改回傳 `valueDecimal`。
