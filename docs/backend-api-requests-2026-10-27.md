# 任務中心申報檔比對：後端 API 需求

整理日期：2026-10-27。

## 背景
任務中心對帳明細目前呼叫 `POST /ael/peit/vat/compare`，逐欄顯示「帳簿試算｜已申報｜差額」。
需新增一組「系統申報檔」數字，畫面變成「申報檔｜已申報｜差額」並列，用來確認系統實際產出要送國稅局的檔案和申報書一致。
前端不自行加總，所有數字與差額由後端算。

## 一、新增 API：產生本期 401／403 申報檔

| 項目 | 說明 |
|---|---|
| 產生 | `POST`，body：`companyUuid`、`taxYear`（民國年）、`cmsPhase`（1／3／5／7／9／11）。依本期發票產出媒體申報檔；重送視為重新產生（覆蓋） |
| 下載 | `GET` 同參數，回傳檔案本體（檔名與副檔名請告知，例如 `.TET`） |
| 查詢狀態 | 回傳 `fileName`、`generatedAt`、`formKind`（401／403）；尚未產生回 null |
| 格式 | 請確認依財政部營業稅媒體申報檔格式，401／403 都支援 |

## 二、調整 API：`POST /ael/peit/vat/compare` 加申報檔欄

`diffs[]` 每列新增：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `fileValue` | number \| null | 系統申報檔該欄數值；尚未產生或檔案無此欄為 null。`IN_NONDEDUCT_RATIO` 比照 `invoiceValue` 規則 |
| `fileDelta` | number \| null | `fileValue − filedValue`；任一側為 null 則 null |

`data` 新增：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `generatedFile` | `{ fileName, generatedAt, formKind } \| null` | 本期申報檔資訊；尚未產生為 null |

- `fieldCode` 沿用現有 metadata（form 11／12），不另立代碼。
- 沒有申報書（`filed = null`）時仍回 `fileValue`，`fileDelta` 為 null。
- 現有 `invoiceValue`／`delta` 不變，避免影響任務判斷（`derive.ts` 依 `delta` 產生待辦）。

## 三、待後端確認

| 項目 | 說明 |
|---|---|
| 與 invoiceCalc 關係 | 申報檔若和 `invoiceCalc` 走同一套計算，兩組數字必然相同，比對就沒有意義。請說明兩者來源差異（例如申報檔是否另外讀發票明細、是否含手動調整） |
| 產生時機 | 手動按鈕產生，還是發票異動後自動重產？若會過期，請回 `isStale` 或讓 `generatedAt` 可和最後發票異動時間比較 |
| 期別範圍 | 是否只支援開帳日之後的期別 |
| 錯誤 | 資料不足無法產生時的 errorCode 與訊息 |
