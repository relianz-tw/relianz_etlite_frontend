# 開帳：後端調整後仍待確認的問題

整理日期：2026-11-12。對照 staging metadata（`/ael/peit/form/metadata`）與 apidog 規格（`/ael/peit/cit/confirm`、`/ael/peit/cit/identify`）逐項核對後端上一輪的調整。

## 阻擋中（優先）

### 0. 財產目錄 confirm 一律回 0003「含有未定義的 fieldCode：ROW_COST_NET」

2026-11-12 對 staging 實測 `POST /ael/peit/cit/confirm`（`companyUuid` 用 demo 公司，`taxYear: 114`、`formCode: CIT_PROPERTY`）：

- 送完整資料（兩個類別、三筆明細、兩列小計），回 `errorCode: 0003`，`message`：「資料格式、規則驗證錯誤：CIT_PROPERTY：含有未定義的 fieldCode：ROW_COST_NET」。
- 只送一列、一個欄位（`ROW_NO`）也是同樣錯誤；明確帶 `ROW_COST_NET` 也一樣。

`ROW_COST_NET` 存在於 `/ael/peit/form/metadata?formNo=8&taxYear=114`（`formula: ROW_COST - ROW_SALVAGE`），request 內容也沒有送它，
推測是後端重算列算式欄位時，用來驗證的欄位清單缺少 `ROW_COST_NET`。請確認並修正，修好前財產目錄無法確認送出。

## 已確認完成（不需要再處理）

| 項目 | 確認方式 |
|------|----------|
| 401／403 申辦情形改成表格 | 11、12 皆有 `VAT_FILER` 表（`rowRepeatable: false`、列 SELF／AGENT、欄 NAME／ID_NO／PHONE／REG_NO），7 個 `FILER_*` 格子欄位，舊的 `FILING_*`、`FILER_NAME` 等與 `choiceGroups` 的 `VAT_FILER` 已移除；`placeAfter: RCPT_RECEIVE_AT` 版面順序正確 |
| 財產目錄 `column: BOOK` 小瑕疵 | `ROW_BOOK`、`ROW_SUB_BOOK`、`PROP_TOTAL_BOOK` 的 `column` 已為 null、`rowCode` 已等於 `fieldCode` |
| 財產目錄每組小計 | `ROW_SUB_*` 為 `rowKind: SUBTOTAL`（先前已確認） |
| 損益表表頭順序、產業創新條例勾選移到 `RATES` 段落 | 先前已確認 |
| 各表辨識樣本 | 封面、損益表、基本稅額、資產負債表、投資人明細、未分配盈餘、扣繳調節表、財產目錄、未攤銷、第 13 份、401／403 皆已收到並核對，欄位代碼與算式都對得上；股東名簿只上傳檔案 |

## 仍待確認

### 1. `/ael/peit/cit/confirm` 規格看起來沒更新

重新匯出 apidog 規格比對，以下幾點仍與先前相同。若實際行為已改，請更新規格；若沒改，請回覆實際行為：

1. **`formCode` 清單**：`forms[].formCode` 說明仍只列到 `VAT_403`；`CIT_WH_RETURN` 只出現在範例回應，沒有列在 request 的清單。請確認 confirm 支援 `CIT_WH_RETURN` 並補進清單。identify 的 `forms[]` 則已含第 13 份。
2. **`rows[]` 欄位**：request schema 的 `rows[]` 只有 `rowIndex`、`fields`，沒有 `rowKind`、`groupKey`。財產目錄（含每組小計）會送這兩個欄位，請補進規格並確認後端有處理。
3. **負金額**：`errorCode` 的 0003 說明仍寫「含 dataType 6、負金額…」。資產負債表減項、損益表虧損與差額一律會送負值，請確認不會被 0003 擋，並刪除或更正這句。
4. **算式欄位**：回應說明仍寫「有 formula 的小計由後端算出後一併寫入」。前端會把使用者輸入或辨識帶入的算式欄位值照常送出，請確認：送來的值是以送來為準、一律重算覆蓋、還是不符時回錯。
5. **跨表驗證**：財產目錄 `PROP_TOTAL_BOOK` ≠ 資產負債表 1400、未攤銷 `UA_TOTAL_BALANCE` ≠ 1902 的觸發條件（資產負債表該欄為空時是否也擋），以及 `message` 是否保持可直接給使用者看的中文。

### 2. 財產目錄 confirm 的列格式

前端目前依辨識回傳結構送回，依類別分組為「類別列 → 明細列… → 小計列」，並帶 `rowKind`、`groupKey`、`ROW_LINE_TYPE`（細節見 `archive/backend-api-requests-2026-11-11-pending-merged.md` 1.1）。請確認：

1. 後端是否接受這個結構；若不是，請給實際要的格式（小計列靠順序還是靠自帶類別欄位對應所屬類別、是否要送類別列）。
2. `ROW_LINE_TYPE`：metadata 仍存在（`hidden: true`），辨識也仍每列帶。要保留還是移除？

### 3. 比率欄位（dataType 6）的值欄位

規格 `valueInt` 寫「dataType=1」、`valueDecimal` 寫「dataType=2」，**沒有寫 dataType 5、6 該用哪個欄位**。
辨識實測（損益表）dataType 6（毛利率、營業淨利率、純益率）只回 `valueInt`，例如 79、-353、6，`valueDecimal` 為 null。前端 confirm 也照此以 `valueInt` 送。

1. dataType 5、6 在 identify、confirm 該用哪個值欄位，請補進規格。
2. 比率要不要保留小數（例如 79.28）？若要，請改用 `valueDecimal`，並告知 metadata 要用哪個 dataType 表示（目前 2 是小數、6 是百分比）。
