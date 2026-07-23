# 帳簿「折讓」「作廢」彈窗設計 Spec

日期：2026-07-23

## 背景與目標

賬簿頁面（`LedgerTable.tsx`、`LedgerCards.tsx`）銷項列上的「折讓」與「作廢」按鈕目前皆無任何
`onClick` 行為，交易細節頁（`TransactionFormView.tsx`）銷項編輯模式的「作廢」按鈕點擊後直接
`backToLedger()`（無確認）。本次要補上對應彈窗，讓這些按鈕真正可互動。

全案為視覺模擬（不接後端），互動效果僅反映在前端 local state。

## 資料模型調整

`src/features/ledger/types.ts`：

- 新增 `AllowanceRecord` 型別：

  ```ts
  export interface AllowanceRecord {
    id: string;
    date: string;   // 民國年格式，對齊既有 "115/03/26"
    amount: number;
    note: string;
  }
  ```

- `SalesRow.allowanceCount: number` 改為 `SalesRow.allowances: AllowanceRecord[]`
  （用陣列長度取代單獨數字欄位，避免兩者不同步）。

`src/features/ledger/data.ts`：

- `SALES_RECEIVED` / `SALES_RECEIVABLE` 中所有 `allowanceCount: 0` 改為 `allowances: []`。
- `UA40435903`（原 `allowanceCount: 3`）改為 3 筆 mock `AllowanceRecord`（日期落在該筆交易
  `115/03/26` 之後、金額合理小於原交易金額、`note` 為簡短假文字）。
- **不動** `SPLIT_CHILDREN` / `children`：那是既有的展開列子交易功能，與本次折讓歷史紀錄是不同
  概念，保持互不干涉（最小化影響）。

## 元件一：`AllowanceDialog.tsx`（新建）

路徑：`src/features/ledger/components/AllowanceDialog.tsx`，風格比照 `ManualEntryDialog.tsx`
（`Modal` + `open`/`row`/`onClose`/`onSubmit` 的 props 形狀）。

Props：

```ts
interface AllowanceDialogProps {
  open: boolean;
  onClose: () => void;
  row: SalesRow | null;
  onSubmit: (rowId: string, record: AllowanceRecord) => void;
}
```

畫面內容：

- **歷史清單**（上半部）：列出 `row.allowances`（日期／金額／說明），依日期排序（沿用現有假資料
  順序即可，不需額外排序邏輯）。無資料時顯示空狀態文字「尚無折讓紀錄」。
- **新增表單**（下半部）：`DatePicker` 折讓日期（預設今日對應的 mock 日期邏輯可比照
  `ManualEntryDialog` 的 `parseRowDate`／固定初始值，不硬性要求真日期運算）、`MoneyInput` 折讓
  金額、`Textarea` 說明。
- 送出按鈕：「取消」（danger，比照既有 dialog 慣例）＋「新增折讓」（primary）。金額為 0 或說明
  空白時可送出（無需額外驗證邏輯，比照專案內其他 mock 表單的簡化程度）。

送出後：呼叫 `onSubmit(row.id, newRecord)`，由呼叫端（`LedgerTable`/`LedgerCards`）把新紀錄併入
該列的 `allowances`，並關閉彈窗。

## 元件二：`VoidConfirmDialog.tsx`（新建）

路徑：`src/features/ledger/components/VoidConfirmDialog.tsx`（3 處共用同一元件，避免重複三份
幾乎相同的確認文案／邏輯）。

Props：

```ts
interface VoidConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transactionId: string;
  amount: number;
}
```

畫面內容：

- 標題「作廢交易」，內文「確定要作廢交易 `{transactionId}`（金額 `{fmtCurrency(amount)}`）嗎？
  此動作無法復原。」
- 按鈕：「取消」（ghost/outline）＋「確定作廢」（danger）。點擊「確定作廢」呼叫 `onConfirm()` 後
  由呼叫端關閉彈窗並套用效果。

## 串接範圍

### `LedgerTable.tsx`（銷項分支）

- 新增 local state：
  - `allowanceRow: SalesRow | null`（控制 `AllowanceDialog` 開關與資料來源）
  - `voidRow: SalesRow | null`（控制 `VoidConfirmDialog` 開關與資料來源）
  - `allowanceOverrides: Record<string, AllowanceRecord[]>`（新增折讓的 local 覆寫，比照既有
    `channelOverrides` 寫法）
  - `voidedOverrides: Record<string, boolean>`（確認作廢後的 local 覆寫）
- 「折讓」按鈕：`onClick={() => setAllowanceRow(row)}`；顯示文字改用
  `(row.allowances.length + (allowanceOverrides[row.id]?.length ?? 0)) > 0` 判斷是否帶數字。
- 「作廢」按鈕：`onClick={() => setVoidRow(row)}`；是否顯示「已作廢」改用
  `row.voided || voidedOverrides[row.id]` 判斷。
- 於既有 `dialogs` fragment 中掛載 `AllowanceDialog` 與 `VoidConfirmDialog`。

### `LedgerCards.tsx`（`SalesCard`）

- 同上邏輯（各自的 local state／overrides，與 `LedgerTable` 各自獨立，不共用 state，比照現有
  `channelOverrides` 在兩個檔案各自宣告的慣例）。
- **新增缺口修補**：目前 `SalesCard` 完全沒有「折讓」按鈕（只有「入帳」／「作廢」），本次一併補
  上，圖示與文案比照 `LedgerTable.tsx`（`FileMinus` icon），對齊桌面／手機版功能對等。

### `TransactionFormView.tsx`

- 僅銷項（`side === 'sales'`）編輯模式（`mode === 'edit'`）的「作廢」按鈕納入範圍：
  - 新增 `voidConfirmOpen: boolean` state。
  - 按鈕 `onClick` 改為 `() => setVoidConfirmOpen(true)`。
  - `VoidConfirmDialog` 的 `onConfirm` 呼叫既有 `backToLedger()`（維持現有「視覺模擬皆返回帳簿」
    行為，不新增其他邏輯）。
- 進項「刪除」按鈕與建立模式不在本次範圍內，維持現狀。

## 不在範圍內

- 不接任何後端 API，所有效果僅為前端 local state。
- 不修改 `children` / 展開列（`SPLIT_CHILDREN`）相關邏輯。
- 不處理進項（採購）側的作廢／刪除。
- 折讓金額不做「不得超過可折讓餘額」之類的業務驗證（沿用專案目前 mock 表單一貫的簡化程度）。
