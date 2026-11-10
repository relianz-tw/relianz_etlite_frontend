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
