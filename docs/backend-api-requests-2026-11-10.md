# 開帳 metadata 與《開帳文件修改.md》不一致處

整理日期：2026-11-10。依 dev 環境（`https://dev.relianz.tw/ael/peit/form/metadata`，formNo 1–12）實測，
與 `docs/開帳文件修改.md` 規格對照。前端已先做相容，以下請後端確認或補齊。

| # | 項目 | 規格 | 實測 |
|---|------|------|------|
| 1 | `sections[].title` | 紙本沒有標題的區塊不回傳或 `title: null` | 仍回「表頭」等簡稱（表 2、3、4、5、6、8、10 的 `HEADER`），前端依「取 title」會顯示出來 |
| 2 | `sections[].title` 完整度 | 紙本完整標題（含「表一、」） | 表 7 回「表一 各類支出」等簡稱 |
| 3 | `tables[].groupBy` | 物件 `{fieldCodes, headerTemplate, subtotalLabel}` | 表 8 回字串 `"ROW_CATEGORY_CODE"`；前端目前不畫分組標題列與各組小計 |
| 4 | `tables[].columns[].groups` | `[]` | 無群組時回 `null`（前端已容錯） |
| 5 | `columns[].refNo`／`officialFieldCode` | 有編號時回傳 | 12 張表均未見 |
| 6 | 表 5 投資人明細 | 22 欄，`isRow` 欄位帶 `tableCode`、`columnCode` | `tables[0]` 僅 6 欄，22 個 `isRow` 欄位沒有 `tableCode`／`columnCode`；前端退回卡片式明細 |
| 7 | 表 8 財產目錄分組欄 | `layout: group` 的欄位不佔欄 | `ROW_CATEGORY_CODE`／`ROW_CATEGORY_NAME` 為 `isRow` 但無 `columnCode`，前端退回卡片式明細 |
| 8 | `textBlocks[].sectionCode` | 與內含欄位的 `sectionCode` 一致 | 表 2 `TB_RECON_HEAD` 等為 `null`（前端以第一個引用欄位推算） |
| 9 | 表 4 資產負債表 | 文件無獨立章節 | 請補規格（`displayName` 含「減：」前綴，前端不再自行加） |
| 10 | 帶 `formula` 的欄位 | 後端算出並寫入 | 前端唯讀顯示，不送 confirm；請確認 identify 回傳是否仍帶這些欄位的值 |
| 11 | `confirm` 的 `cmsPhase` | 401／403 用 `cmsPhase`（可空，由 `periodStartMonth` 推） | 前端兩者都送，值相同（所屬起月 1／3／5／7／9／11） |
| 12 | `identify` 的 `forms` | 固定 12 筆 | 前端已改按 12 筆處理，仍以 `formCode` 對應 |
| 13 | `groupCode` | 區塊內分組（如調節加項／減項） | 只有代碼沒有標題文字，前端不畫分組小標；若紙本有小標請補 |

---

# 附：staging 實測補充（2026-11-10）

環境：`https://staging.relianz.tw/etlite/initialization`，`/ael/peit/form/metadata`（formNo 1–12，taxYear=114）。方法：API 回傳逐項對規格，再開頁面逐份看畫面。上方第 1–13 項在 staging 仍成立，以下為新增項目。

### 覆蓋範圍與限制

- 表 1、表 2：逐項對規格（C1–C3、2.1–2.13）。
- 表 3、5、6、7、8、9、10、11、12：只對全域規格（G1–G8、dateRanges、dataType 6）與畫面，各表專屬章節沒有逐欄核對。
- 表 4（資產負債表）規格文件無章節，只看畫面。
- 營業稅步驟「下一頁」需先上傳檔案，第 2–5 期與確認頁沒看。

### 已符合

- 12 張表都有 `displayName`、`refNo`、`hidden`、`isDeduction`、`rowCode`、`column`、`layout`、`labelTemplate`、`note`、`visibleWhen`、`formula`。
- `dateRanges[]` 表 2、3、8、10 有回，畫面為成對日期。
- 表 1：七個移除項已移除；`BIZ_OTHER` 已補並進 `BIZ_KIND`。
- 表 2：
  - 雙欄、行內金額（外匯、商譽、退稅）、`note`、`formula` 文字正確。
  - 13 個斜線 `_BOOK` 已移除。
  - `INC_03` 已標減項。
  - 百分比欄皆 `dataType: 6`。
  - `INV_K_OTHER`／`INV_K_OTHER_TEXT` 已補。
  - 營業收入分類表欄位與編號正確。
- 表 7 畫面接近紙本（雙欄表、勾選框、是／否群組、外籍人士明細表）。

### 一、表 2 與規格不符（影響畫面最大）

| # | 規格 | staging 實測 | 畫面現象 |
|---|------|-------------|----------|
| 1 | 2.6 `TB_60` 與 7 個新欄位 `INC_60_1_*`、`INC_60_2_*` | 沒有 `TB_60`，7 欄不存在；舊的 `INC_60_PARTIAL_INCOME`、`INC_60_MONTHS`、`TAX_RATE` 還在 | 稅額區仍是「營業期間不滿一年換算用所得額／營業月數／稅率」三格，不是紙本 (1)(2) 算式 |
| 2 | 2.6 `TB_127_130` 段落，`INC_127`、`INC_130` 的 `sectionCode` 為 `null` | 沒有此段落；兩欄 `sectionCode` 仍為 `DISCLOSE` | 127、130 畫成「揭露事項」裡的一般列 |
| 3 | 2.8 sections：`OPERATING`、`NONOP_INCOME`、`NONOP_LOSS`、`TAXABLE`（含 53–59）、`TAX`… | 仍是 `OPERATING`／`OPEX`／`NONOP`／`TAXABLE`；`INC_53` 在 `NONOP` | 區塊標題為「營業收入成本與毛利」「營業費用與營業淨利」「非營業損益與全年所得」，不是紙本標題 |
| 4 | 2.7.1／2.7.2 `ORG_0_OTHER` 的 `officialFieldCode: "0"`、`sectionCode: HEADER`；`INV_K_OTHER` 的 `officialFieldCode: "k"` | 兩者 `officialFieldCode` 皆 `null`；`ORG_0_OTHER` 的 `sectionCode` 為 `null` | 「其他」沒有編號；組織種類的「其他」所屬區塊錯 |
| 5 | 2.7.3／G8 `choiceGroups[].officialFieldCode`（`INV_*` 為 `"124"`） | 5 組全是 `null` | 124 題沒有編號標示 |
| 6 | 2.4.1 調節說明 `groupCode`：`RECON_SUMMARY`／`RECON_ADD`／`RECON_SUB`／`RECON_RETURN`，加減項帶 `visibleWhen: INC_69 nonZero` | RECON 區欄位 `groupCode` 全是 `null`，無 `visibleWhen` | 70–87 沒有加項、減項分組；69 為 0 時也不收合 |
| 7 | G4 `textBlocks[].sectionCode` 與內含欄位一致 | 表 2、11、12 全部為 `null` | 前端自行推算區塊（已容錯） |
| 8 | 2.8 `FLAG_INNOVATION_ACT` 維持 `HEADER` | 未細查位置 | 待確認 |

### 二、所有表共通

| # | 規格 | 實測 | 畫面現象 |
|---|------|------|----------|
| 9 | G7：紙本沒標題的區塊不回傳或 `title: null` | 表 1、2、3、5、6、8、10 的 `HEADER` 仍回「表頭」 | 畫面顯示「表頭」標題 |
| 10 | G7：完整標題（含「表一」） | 表 7 為「表一 各類支出」「表二 各類收益」「表三 外籍專業人士費用明細」簡稱；表 5 為「表頭勾選」「投資人欄位合計」 | 標題非紙本印出文字 |
| 11 | G3：`columns[].groups` 為 `[]` | 無群組時回 `null`（前端已容錯） | 無 |
| 12 | G3：`columns[].refNo`／`officialFieldCode` | 12 張表一個都沒有 | 欄標題沒有圈號、編號 |
| 13 | G7／G8：區塊標題與勾選群組名稱不重複 | 表 1「股票發行狀況」「營業種類」區塊標題與勾選群組名稱相同 | 同一個字畫兩次 |

### 三、表 3　基本稅額申報表

3 張表只有 1 張有格子：

| 表 | 欄位 | 實測 |
|----|------|------|
| `AMT_LOSS_SEC` 前5年證券及期貨交易淨損失 | 4 欄 | 只有 `LOSS` 欄 7 格標了 `tableCode`／`rowNo`／`columnCode`；`USED_PRIOR`、`USED_CUR`、`REMAIN` 三欄的 `AMT_02_Y109_*` 等欄位 `layout: row`、無 `tableCode`、`rowNo`、`columnCode`；`rows` 沒有 `rowLabel`（年度） |
| `AMT_LOSS_OBU` 前5年國際金融業務淨損失 | 3 欄 × 6 年 | 0 個格子欄位，`AMT_06_*` 全是散列 |
| `AMT_EXEMPT` | 3 欄 | 有 7 格，`COND`（得免予計入之條件）文字欄是否為格子未確認 |

畫面現象：
- 前 5 年表格只有第一欄有輸入框，其餘欄與年度欄是空白、斜線。
- 國際金融表整張是斜線。
- 表格下方出現一長串沒有標題的散列欄位（109–114 年度截至上年度已減除金額…），在沒有標題的區塊內。

### 四、表 5　投資人明細

| 規格 | 實測 |
|------|------|
| 22 欄，`isRow` 欄位帶 `tableCode`、`columnCode` | `tables[0]` 只有 6 欄；22 個 `isRow` 欄位全無 `columnCode` |

畫面現象：
- 投資人明細表只有 6 個欄標題；合計列整列斜線。
- 「新增一列投資人明細明細」文字重複（前端已修，見下）。
- 區塊命名：「表頭勾選」「已收資本」「增資緩課核備」「投資人明細」「投資人欄位合計」。

### 五、表 6、8、9、10

- 表 6：「87 年度以後特別盈餘公積變動表」5 欄，只有第 1 欄有輸入框，其餘欄斜線（不確定是否規格要求，請對紙本確認）。
- 表 8：
  - `groupBy` 回字串 `"ROW_CATEGORY_CODE"`（規格為物件）；7 個 `isRow` 欄位無 `columnCode`。
  - 畫面同一頁出現兩塊明細：「財產明細」表格（新增鈕「新增一列明細」），下方再一塊「明細」卡片（新增鈕「新增一列財產目錄明細」）；兩塊對不上。
  - 財產名稱、數量兩欄在表格中是斜線。
- 表 9、10：表格顯示合計列與「新增一列明細」，欄位可輸入；表 10 另有「頁次」欄放在無標題區塊。

### 六、表 11／12　營業稅 401／403

- 表 12 畫面順序為「進項」在「銷項」之前，且銷項（一般稅額、特種稅額）在最後；401 為銷項在前。請確認 `fields[]` 順序與 section 順序，是否 403 紙本就是進項在前。
- 表 12 的 74／75／76 與 103–106、109 在畫面是散列在上方，沒有區塊標題。
- `textBlocks` 的 `sectionCode` 全為 `null`。

### 七、前端本次處理

- 《開帳文件修改.md》「前端修改記錄」5 項核對後皆已在程式內實作（區塊標題取 `sections[]`、勾選框、無加減等號徽章、金額欄可輸入負號、`dataType: 6`），已把該段標題改成「5 項前端皆已實作」。
  - 畫面上金額欄旁的「＋／－」是金額正負號切換鈕（`allowSign`），不是算式符號。
- 修正「新增一列○○明細明細」文字重複（`PaperTable.tsx`）：表名已以「明細」結尾時不再重複加字。
- 前端依 metadata 渲染，上列第一至六節的畫面問題皆需後端補齊後才會改善，前端不另外寫死補丁。

### 八、請後端確認

1. 表 2 第 1–7 項是否尚未部署到 staging，還是範圍調整。
2. 表 3 表格欄位為何只有第一欄標格子；是否要補 `tableCode`／`rowNo`／`columnCode` 與 `rowLabel`（年度）。
3. 表 5、8 的 `isRow` 欄位補 `columnCode`；表 8 的 `groupBy` 改物件。
4. 表 4 是否補規格章節。
5. 表 6 變動表只有第 1 欄可填是否為預期。
