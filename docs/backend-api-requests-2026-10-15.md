# 開帳文件頁改版：後端 API 需求

整理日期：2026-10-15。metadata 本次修改已逐項驗證到位（其他選項移除、DEP_YEARS、INV_CAP_*、INV_DEFER_*、UE_*、choiceGroups、名稱前綴、form 4 的 parentFieldCode／isDeduction／isSubtotal）。以下為仍需後端處理的項目。

## 一、新增 API

### 1. 登記文件上傳
前端「登記資料」頁（步驟 4 最後）每項文件可上傳 PDF 或圖片，目前只記錄檔名。

| 項目 | 說明 |
|---|---|
| 上傳 | `POST` multipart：`companyUuid`、`docType`、`file`；同一 `docType` 再傳視為更換 |
| 列出 | `GET` 回傳已上傳清單（`docType`、檔名、上傳時間、檔案識別碼） |
| 刪除 | `DELETE` 單一 `docType` |
| 限制 | 請告知檔案大小與格式上限（前端暫定 10MB、PDF／圖片） |

`docType` 與組織型態對照：

| docType | 文件 | 適用 |
|---|---|---|
| `APPROVAL_LETTER` | 最新設立或變更核准函 | 全部 |
| `REGISTRATION_ITEMS` | 最新設立或變更登記事項表 | 公司 |
| `ARTICLES` | 最新公司章程 | 公司 |
| `BUSINESS_TRANSCRIPT` | 最新設立或變更商業抄本 | 獨資、合夥 |
| `PARTNERSHIP_AGREEMENT` | 最新合夥契約 | 合夥 |
| `INVOICE_PERMIT` | 最新統一發票購票證或國稅局核准公文 | 全部 |

股東名簿已有 formNo 9，不在此列。

### 2. 負責人及合夥人資料
獨資只有負責人；合夥有負責人與多位合夥人。

| 欄位 | 說明 |
|---|---|
| `title` | 職稱：負責人／合夥人 |
| `name` | 姓名 |
| `idNo` | 身分證字號 |
| `address` | 戶籍地址 |
| `capital` | 出資額（整數元） |

- 請提供整批儲存與讀取（`PUT`／`GET`）。
- 出資額加總需等於資產負債表 `BS_3110`（非第一年）或市府商業登記抄本資本額（第一年）。前端目前只做非第一年比對並擋下一頁；是否由後端驗證請決定。

### 3. 組織型態
前端在開帳設定新增「組織型態」（股份有限／有限／獨資／合夥），並寫入損益表 `ORG_KIND`（`ORG_1_SHARE`、`ORG_2_LIMITED`、`ORG_6_SOLE`、`ORG_5_PARTNERSHIP`）。開帳送出（`saveInitializationCompany` 的 `orgType`）請確認接受這四種。

## 二、建議調整

### 4. metadata 提供區塊名稱與順序
目前只有 `sectionCode`，區塊標題（如 `OPERATING`＝營業收入及毛利）前端寫死在 `reports/sectionTitles.ts`。文件若更動，需同步改前端。
建議 form metadata 加 `sections[]`：`sectionCode`、`sectionName`、`sortOrder`。

### 5. parentFieldCode 擴及其他表
`parentFieldCode` 目前只有資產負債表（155 個）。損益表、基本稅額、扣繳表的「合計＝明細加總」關係若也提供，前端可縮排呈現。

## 三、資料瑕疵

| 文件 | 欄位 | 問題 |
|---|---|---|
| formNo 6 未分配盈餘 | `UE_3`、`UE_4`、`UE_5`、`UE_15` | 名稱仍為「項次N」，紙本是空白自填項目，請改為可辨識名稱 |
| formNo 2 損益表 | `INC_58` | 名稱為「第58欄」 |
| formNo 4 資產負債表 | `BS_1510`、`BS_1710` | 有子項但 `isSubtotal=false` |
| formNo 4 資產負債表 | `BS_3300`、`BS_3600`、`BS_3000` | 為 EQUITY 下頂層節點，是否應掛在 `BS_3000` 下請確認 |
| 各表 | `officialFieldCode` 缺漏 | 封面 42/42、基本稅額 120/161、扣繳調節表 180/192、財產目錄 34/34 |
| OpenAPI 規格 | — | 未含 `parentFieldCode`、`isDeduction`、`isSubtotal`，formNo 描述仍為「1–11」 |
| 共用欄位 | `HDR_TAX_YEAR`、`HDR_VAT_NO`、`HDR_COMPANY_NAME` | 各表名稱仍不一致（如所屬年度／申報年度／案件申報年度） |

## 四、營業稅 401／403 頁（設計稿 VAT401）

| 項目 | 說明 |
|---|---|
| 附送書表 | 設計稿「附件與申辦」有 9 項份數（統一發票明細表、進項憑證冊／份、海關代徵營業稅繳納證、退回（出）及折讓證明單、營業稅繳款書申報聯、零稅率銷售額清單、一次性移轉訂價調整聲明書、營業稅聲明事項表），metadata 沒有對應欄位，前端未做 |
| 申報日期 | 401 設計稿有「申報日期」，401 metadata 的 `RCPT_DECLARE_AT` 為文字，請確認格式 |
| 欄位代號 | 401 `IN_ASSET_AMT_SUM` 沒有 `officialFieldCode`；稅額計算代號 metadata 為 101–115，設計稿畫面寫 1–15，前端以 metadata 為準 |
| 媒體檔 | 設計稿上傳區寫「PDF 或 .TET 媒體檔」，目前辨識 API 是否支援 .TET 請確認，前端暫維持 PDF |
| 403 設計稿 | 設計稿只有 401，403（免稅、特種稅額區塊）由 metadata 同規則推導，版型若有差異請補稿 |
