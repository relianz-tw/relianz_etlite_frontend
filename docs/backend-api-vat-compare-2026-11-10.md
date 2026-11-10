# 申報檔比對：vat/compare 與申報檔 API 調整需求

整理日期：2026-11-10。承接 `backend-api-requests-2026-10-27.md`。

## 背景
最新 OpenAPI 把 `POST /ael/peit/vat/compare` 的說明改成「產申報TXT檔」，回傳只剩
`fileName`／`generatedAt`／`formKind`／`kind`，**不再有 `taxYear`／`cmsPhase`／`filed`／`diffs[]`**。
這與 10-27 需求（compare 保留比對、只加欄；產檔另開 API）不一致，也不在 `開帳文件修改.md` 範圍內。
前端「申報檔比對」任務中心（`/business-tax/reconcile`）整頁依賴 compare 的比對回傳，請確認是否為誤改。
前端目前**仍照舊格式呼叫**，未因這次文件調整而改動；若實際已改成產檔，對帳頁會壞。

## 一、請恢復 `POST /ael/peit/vat/compare` 的比對回傳

body：`companyUuid`、`taxYear`（民國年）、`cmsPhase`（1／3／5／7／9／11）。

| 欄位 | 型別 | 說明 |
|---|---|---|
| `taxYear` | integer | 民國年 |
| `cmsPhase` | integer | 期別 |
| `formKind` | string | 依發票判定 `401`／`403` |
| `filed` | `{ caseUuid, formCode, status } \| null` | 已 confirm 寫入的申報書；該期尚未寫入為 null |
| `diffs[]` | array | 逐欄對帳，見下表 |

`diffs[]`：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `fieldCode` | string | 沿用 form 11／12 metadata 的 fieldCode |
| `fieldName` | string | 欄位名稱 |
| `invoiceValue` | number | 發票試算值（`IN_NONDEDUCT_RATIO` 為 0–1 小數，其餘金額元） |
| `filedValue` | number \| null | 已申報值；尚未申報為 null |
| `delta` | number \| null | `invoiceValue − filedValue` |

## 二、產 TXT 檔另開端點（照 10-27 需求）
- 產生：`POST`，body 同上；重送覆蓋。
- 下載：`GET` 同參數，回傳檔案本體。
- 查詢狀態：回 `fileName`、`generatedAt`、`formKind`；尚未產生回 null。
- 目前 OpenAPI 已有 `/ael/peit/vat/media/*`（txt／tetu／t07…），請說明是否就是這組，以及與 compare 的關係。

## 三、compare 再加欄（10-27 需求，沿用）
`diffs[]` 新增 `fileValue`、`fileDelta`；`data` 新增 `generatedFile: { fileName, generatedAt, formKind } | null`。

## 四、待後端確認
沿用 10-27 文件第三節（與 invoiceCalc 差異、產生時機／過期、期別範圍、錯誤碼）。
