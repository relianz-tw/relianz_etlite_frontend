# 開帳：後端調整後待確認問題（2026-11-12 結案）

整理日期：2026-11-12。對照 staging metadata（`/ael/peit/form/metadata`）、apidog 規格（`/ael/peit/cit/confirm`、`/ael/peit/cit/identify`）與實際送出測試，逐項核對後端的調整。

**目前沒有待後端處理的項目。** 下列全部已確認完成。

## 已確認完成

| 項目 | 確認方式 |
|------|----------|
| 財產目錄 confirm 回 0003「含有未定義的 fieldCode：ROW_COST_NET」 | 2026-11-12 同一份資料重送（demo 公司、`taxYear: 114`、兩個類別、三筆明細、兩列小計）：HTTP 200、`errorCode: 0000`、`written: true`、`status: 2`、寫入 47 個欄位（含後端算出的小計） |
| 財產目錄 confirm 列格式 | 前端送「類別列 → 明細列… → 小計列」（帶 `rowKind`、`groupKey`、`ROW_LINE_TYPE`）已被接受；規格也已補 `rowKind`、`groupKey`，且說明 `ROW_LINE_TYPE` 為 hidden 仍可送，維持前端現行送法 |
| `/ael/peit/cit/confirm` 規格 | 已補：`formCode` 清單含 `CIT_WH_RETURN`（明細放 `fields`，不是 `rows`）；金額與百分比允許負值、不會 0003；有 `formula` 的欄位一律後端重算覆蓋；跨表驗證任一方為空不擋、`message` 可直接給使用者看 |
| 比率欄位（dataType 6）值欄位 | identify 與 confirm 皆用 `valueDecimal`（顯示值，79.28＝79.28%，可負、可小數）；前端已改為優先讀寫 `valueDecimal` |
| 401／403 申辦情形改成表格 | 11、12 皆有 `VAT_FILER` 表（列 SELF／AGENT、欄 NAME／ID_NO／PHONE／REG_NO），7 個 `FILER_*` 格子欄位；舊的 `FILING_*`、`FILER_NAME` 等與 `choiceGroups` 的 `VAT_FILER` 已移除 |
| 財產目錄 `column: BOOK` 小瑕疵 | `ROW_BOOK`、`ROW_SUB_BOOK`、`PROP_TOTAL_BOOK` 的 `column` 已為 null、`rowCode` 已等於 `fieldCode` |
| 財產目錄每組小計 | `ROW_SUB_*` 為 `rowKind: SUBTOTAL` |
| 損益表表頭順序、產業創新條例勾選移到 `RATES` 段落 | 已確認 |
| 各表辨識樣本 | 封面、損益表、基本稅額、資產負債表、投資人明細、未分配盈餘、扣繳調節表、財產目錄、未攤銷、第 13 份、401／403 皆已核對，欄位代碼與算式都對得上；股東名簿只上傳檔案 |

## 備註（前端決策，非後端待辦）

- 有 `formula` 的欄位，confirm 時後端一律重算覆蓋：使用者在算式欄位手動改的值，送出後會被後端算出的值取代。畫面目前仍允許使用者編輯這些欄位，是否調整由產品決定。
