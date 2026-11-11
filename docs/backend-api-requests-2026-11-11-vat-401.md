# 營業人銷售額與稅額申報書（401，formNo 11；403 同理 formNo 12）：下半部順序與紙本不同

整理日期：2026-11-11。對象：`/ael/peit/form/metadata`（formNo 11，taxYear 115，staging 實測）。
對照紙本：`public/form-previews/vat-401.webp`。

## 紙本下半部順序

1. 本期(月)應退稅額處理方式：□利用存款帳戶劃撥、□領取退稅支票
2. 82 保稅區營業人按進口報關程序銷售貨物至我國境內課稅區之免開立統一發票銷售額
3. 申報單位蓋章處／核收機關及人員蓋章處（紙本蓋章欄，不需要欄位）：
   附 1.統一發票明細表 份、2.進項憑證 冊 份、3.海關代徵營業稅繳納證 份、4.退回(出)及折讓證明單、海關退還溢繳營業稅申報單 份、
   5.營業稅繳款書申報聯 份、6.零稅率銷售額清單 份、7.營業稅一次性移轉訂價調整聲明書 份、8.營業稅聲明事項表 份（**每一條自己一行**）
4. 申報日期、核收日期
5. 申辦情形（自行申報／委任申報）與姓名、身分證統一編號、電話、登錄文(字)號

## 實測順序（`fields[]` 內各區塊出現順序）

`BONDED`（82）→ `ATTACH`（`RCPT_*` 文號、申報日期等）→ `RECEIPT`（`ZERO_RATE_TXN_COUNT` 等）→ `DECLARANT`（`FILING_SELF`、`FILING_AGENT`、`FILER_NAME`、`FILER_ID_NO`）→
`ATTACH`（`ATT_*` 附件份數）→ `REFUND`（退稅方式）→ `DECLARANT`（`FILER_PHONE`、`FILER_REG_NO`）→ `ATTACH`（`RCPT_RECEIVE_AT` 核收日期）。

同一個區塊的欄位散在 `fields[]` 的不同位置，區塊順序依「第一個欄位出現的位置」排，結果畫面順序為：
82 → 申報日期／核收日期 → 附件份數 → 申辦情形、姓名、身分證 → 電話 → 退稅方式，與紙本不同。

## 需要後端調整

1. **同一區塊的欄位在 `fields[]` 裡連在一起**，區塊順序依紙本：
   `REFUND`（`REFUND_BANK_TRANSFER`、`REFUND_CHECK`）→ `BONDED`（82）→ `ATTACH`（附件份數 `ATT_*` 依 1～8 排，接著申報日期 `RCPT_DECLARE_AT`、核收日期 `RCPT_RECEIVE_AT`）→
   `DECLARANT`（`FILING_SELF`、`FILING_AGENT`、`FILER_NAME`、`FILER_ID_NO`、`FILER_PHONE`、`FILER_REG_NO`）。
2. **附 1～8 每一條自己一行**：目前只有一個段落，所有條目接在同一段文字裡折行。
   請拆成 8 個 `textBlocks`（`sectionCode: ATTACH`），每條一個，例如
   `附　1.統一發票明細表 {{field:ATT_GUI_DETAIL}} 份`、`2.進項憑證 {{field:ATT_INPUT_VOLUMES}} 冊 {{field:ATT_INPUT_COPIES}} 份` …；
   第 1 條帶「附」字，`placeAfter` 依序串接（第一個 `"TOP"` 或接在 82 之後，其餘接在前一條）。
3. **申辦情形（`DECLARANT`）建議改成紙本的表格**：欄為「姓名、身分證統一編號、電話、登錄文(字)號」，列為「自行申報、委任申報」，
   自行申報列的「登錄文(字)號」是紙本斜線（不要回傳該欄位，前端會畫斜線）。
   目前是兩個勾選加四個分開的輸入欄（前端沒有畫出 `FILER_REG_NO`，請一併確認該欄位是否 `hidden`）。
   若短期不改成表格，至少請確認以上欄位順序與第 1 點一致。

## 補充：表頭的「所屬年月份」與「使用發票份數」位置

紙本表頭：「所屬年月份」在最上方，「使用發票份數」與「負責人姓名」同一排（負責人姓名左、使用發票份數右）。

實測：

- 「所屬年月份：{{field:HDR_TAX_YEAR}} 年 …」是 `TB_PERIOD`（`sectionCode: HEADER`），`placeAfter` 為 `null`，所以排在表頭區塊最後。
- 使用發票份數 `IN_INVOICE_COPIES`（`dataType: 5`）的 `sectionCode` 是 `INPUT`（進項），在 `fields[]` 排在進項欄位之後，畫面上在整張表中段的進項區塊裡，不在表頭。

請後端調整：

1. `TB_PERIOD` 的 `placeAfter` 設為 `"TOP"`，所屬年月份排在表頭區塊（也是整張表）的最上面。
2. `IN_INVOICE_COPIES` 的 `sectionCode` 改為 `HEADER`，在 `fields[]` 排在 `HDR_OWNER_NAME`（負責人姓名）之後；
   表頭欄位的順序請調成：統一編號、營業人名稱、稅籍編號、營業地址、負責人姓名、使用發票份數。
   前端表頭輸入欄是左右兩欄排列，這樣「負責人姓名」與「使用發票份數」會落在同一排。
3. 403（formNo 12）同樣調整。

## 前端處理

前端只依 `fields[]` 順序與 `placeAfter` 排版，不自行調整；後端調整後不需要改前端。
403（formNo 12）的下半部結構相同，請一併調整。
