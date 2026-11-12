# 營業稅申報書 401／403：表頭與下半部順序和紙本不同

整理日期：2026-11-11。對象：`/ael/peit/form/metadata`，staging（taxYear 115）實測。
對照紙本：`public/form-previews/vat-401.webp`、`vat-403.webp`。

> 下方每一項標明適用的文件：**【401】** 營業人銷售額與稅額申報書（formNo 11）、**【403】**（formNo 12）、**【401、403】** 兩份都要改。

## 1.【401、403】所屬年月份要在最上面

紙本表頭「所屬年月份」在最上方。`TB_PERIOD`（`sectionCode: HEADER`）目前 `placeAfter: null`（401、403 實測皆是），排在表頭區塊最後。

請後端：`TB_PERIOD` 的 `placeAfter` 設為 `"TOP"`。

## 2.【401、403】使用發票份數要放在負責人姓名旁

紙本「使用發票份數」與「負責人姓名」同一排（負責人姓名在左、使用發票份數在右）。
目前 `IN_INVOICE_COPIES`（`dataType: 5`）的 `sectionCode` 是 `INPUT`（進項），在 `fields[]` 排在進項欄位後面（401 第 60 個、403 第 86 個），
畫面上出現在進項區塊中，不在表頭。

請後端：

- `IN_INVOICE_COPIES` 的 `sectionCode` 改為 `HEADER`，在 `fields[]` 排在 `HDR_OWNER_NAME`（負責人姓名）之後。
- 表頭欄位順序調成：統一編號、營業人名稱、稅籍編號、營業地址、負責人姓名、使用發票份數。
  前端表頭輸入欄是左右兩欄排列，這樣負責人姓名與使用發票份數會落在同一排。

## 3. 下半部的區塊順序

紙本下半部順序：

1. 本期(月)應退稅額處理方式（`REFUND`）
2. 82 保稅區營業人…免開立統一發票銷售額（`BONDED`）
3. 附 1～8 份數、申報日期、核收日期（`ATTACH`）
4. 申辦情形、姓名、身分證統一編號、電話、登錄文(字)號（`DECLARANT`）

同一個區塊的欄位散在 `fields[]` 不同位置，區塊順序依「第一個欄位出現的位置」，所以畫面順序跟紙本不同：

| 文件 | 實測區塊出現順序（`fields[]`） |
|------|-------------------------------|
| **【401】** | `BONDED` → `ATTACH` → `RECEIPT` → `DECLARANT` → `ATTACH` → `REFUND` → `DECLARANT` → `ATTACH` |
| **【403】** | `ATTACH` → `BONDED` → `REFUND` → `RECEIPT` → `DECLARANT` → `ATTACH` |

請後端（**【401、403】** 皆要）讓同一區塊的欄位在 `fields[]` 連在一起，順序為
`REFUND`（`REFUND_BANK_TRANSFER`、`REFUND_CHECK`）→ `BONDED`（82）→ `ATTACH`（`ATT_*` 依 1～8，接著申報日期 `RCPT_DECLARE_AT`、核收日期 `RCPT_RECEIVE_AT`）→
`DECLARANT`（`FILING_SELF`、`FILING_AGENT`、`FILER_NAME`、`FILER_ID_NO`、`FILER_PHONE`、`FILER_REG_NO`）。

## 4.【401、403】附 1～8 每一條自己一行

紙本 8 條附件份數每條一行。目前 `TB_ATTACH` 是單一段落（`placeAfter: null`），所有條目接在同一段文字裡折行。

請後端把 `TB_ATTACH` 拆成 8 個 `textBlocks`（`sectionCode: ATTACH`），每條一個，例如：

- `附　1.統一發票明細表 {{field:ATT_GUI_DETAIL}} 份`
- `2.進項憑證 {{field:ATT_INPUT_VOLUMES}} 冊 {{field:ATT_INPUT_COPIES}} 份`
- 其餘依序為 3.海關代徵營業稅繳納證（`ATT_CUSTOMS`）、4.退回(出)及折讓證明單、海關退還溢繳營業稅申報單（`ATT_ALLOWANCE`）、5.營業稅繳款書申報聯（`ATT_PAYMENT_SLIP`）、6.零稅率銷售額清單（`ATT_ZERO_LIST`）、7.營業稅一次性移轉訂價調整聲明書（`ATT_TP_STATEMENT`）、8.營業稅聲明事項表（`ATT_VAT_STATEMENT`）

第一條 `placeAfter` 接在 82（`BONDED`）之後，其餘每條接在前一條後面。

## 5.【401、403】申辦情形要改成紙本的表格（必要，非建議）

紙本是一張表格：

| 申辦情形 | 姓名 | 身分證統一編號 | 電話 | 登錄文(字)號 |
|----------|------|----------------|------|---------------|
| 自行申報 | 可填 | 可填 | 可填 | 斜線（不可填） |
| 委任申報 | 可填 | 可填 | 可填 | 可填 |

目前是兩個勾選（`FILING_SELF`、`FILING_AGENT`）加分開的輸入欄（`FILER_NAME`、`FILER_ID_NO`、`FILER_PHONE`、`FILER_REG_NO`），`FILER_REG_NO` 靠 `visibleWhen: FILING_AGENT checked` 才出現。
畫面和紙本差很多，**請後端改成表格結構**（前端已支援固定列的紙本表格：左欄列標籤、格子依 `rowNo|columnCode` 對應、沒有欄位的格子畫斜線，不需要前端另外開發）。

### 建議結構（401、403 相同，`tables[]` 新增一張，`sectionCode: DECLARANT`）

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

## 6. 進項區塊下方：每個項目各自一行

進項表格下方有幾個欄位（不得扣抵比例、得扣抵之進項稅額、進口免稅貨物、購買國外勞務），目前每份文件都只有一個段落，把它們接在同一段文字裡，在畫面上擠在一起折行。
請拆成獨立的 `textBlocks`（`sectionCode: INPUT`），每個項目一個，每個一行：

**【403】**（現況 `TB_IN_RATIO` 一個段落，`placeAfter: VAT_INPUT`）拆成三個：

| 段落 | 模板 | `placeAfter` |
|------|------|--------------|
| `TB_IN_RATIO` | `不得扣抵比例（④＋⑤－⑧）／（⑦－⑧）50 {{field:IN_NONDEDUCT_RATIO}} %` | `VAT_INPUT` |
| `TB_IN_DEDUCTIBLE` | `得扣抵之進項稅額（⑨＋⑩）×（1－⑪）51 {{field:IN_DEDUCTIBLE_TAX}} 元` | `TB_IN_RATIO` |
| `TB_IN_IMPORT` | `進口免稅貨物 73 {{field:IN_IMPORT_TAX_FREE}} 元` | `TB_IN_DEDUCTIBLE` |

**【401】**（現況 `TB_IN_IMPORT` 一個段落，`placeAfter: VAT_INPUT`）拆成兩個：

| 段落 | 模板 | `placeAfter` |
|------|------|--------------|
| `TB_IN_IMPORT` | `進口免稅貨物 73 {{field:IN_IMPORT_TAX_FREE}} 元` | `VAT_INPUT` |
| `TB_IN_FOREIGN` | `購買國外勞務 74 {{field:IN_FOREIGN_SERVICES}} 元` | `TB_IN_IMPORT` |

（段落代碼只是建議，後端可自訂；原則是一個編號一個段落。）

## 前端處理

前端只依 `fields[]` 順序、`sectionCode` 與 `placeAfter` 排版，不自行調整，後端調整後不需要改前端。
