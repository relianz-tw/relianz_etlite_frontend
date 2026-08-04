# 交易細節頁沖帳資訊 + 手動入帳彈窗簡化 設計 Spec

日期：2026-08-04

## 背景與目標

`2026-07-31-transaction-detail-entries-api-design.md` 當時因為 `entry`／`settlements` 內含多個
未解讀的數值枚舉，決定「本次不使用」。現在使用者已提供 `GET /ael/ledger/entries/detail` 完整回應
型別與 `settlementStatus`（0平衡 1超沖 2少沖）、`isOpen` 等欄位語意，可以安全串接其中「沖帳」相關
子集，補上交易細節頁的兩個新區塊：

1. **沖帳狀態**：`entry.settledAmount`／`remainingAmount`／`settlementStatus` 三個欄位的摘要卡片。
2. **沖帳紀錄**：`settlements[]` 陣列的明細列表，含每筆沖帳的金額、前後餘額、是否結清、備註，
   日期只顯示 `settlements[].settlement.entryDate`（入帳日期）。

`entry`／`settlements` 其餘欄位（`direction`／`entryType`／`entryKind`／`status`／
`counterpartyType` 等）本次仍不使用，維持前次決議。

另外處理帳簿頁「交易手動入帳」彈窗（`ManualEntryDialog.tsx`）的一個獨立小修改：移除唯讀顯示用的
「預定入帳日期」欄位。

兩側（銷項／進項）共用同一個 `TransactionFormView.tsx` 元件與同一支 API，本次沖帳資訊在
`mode === 'edit'` 時銷項、進項皆顯示。

## 一、`src/api/types.ts` 型別調整

在既有 `EntryInvoiceDetailDto` 之後新增，並修改 `EntryDetailResult`：

```ts
/** GET /ael/ledger/entries/detail 回應的 entry 區塊；僅型別化本次會使用的沖帳狀態欄位 */
export interface EntryDetailEntryDto {
  /** 已沖金額（元） */
  settledAmount: number;
  /** 未沖金額（元） */
  remainingAmount: number;
  /** 0平衡 1超沖 2少沖 */
  settlementStatus: number;
}

/** GET /ael/ledger/entries/detail 回應的單筆沖帳關聯；僅型別化本次會使用的欄位 */
export interface EntryDetailSettlementDto {
  /** receivable_payable_relations.uuid，供列表 key 使用 */
  relationUuid: string;
  /** 沖之前剩餘 */
  beforeSettlementAmount: number;
  /** 沖之後剩餘 */
  afterSettlementAmount: number;
  /** 本次沖帳金額 */
  settlementAmount: number;
  /** true＝沖完後原單仍有餘額；false＝已結清（含超沖） */
  isOpen: boolean;
  /** 關聯備註 */
  remark: string | null;
  /** 結算帳 header；本次只使用 entryDate（入帳日期） */
  settlement: { entryDate: string | null } | null;
}

/** GET /ael/ledger/entries/detail 回應；僅型別化 invoice 區塊與沖帳相關子集
 *  （entry／settlements 其餘欄位如 direction／entryType／status 等本次不使用） */
export interface EntryDetailResult {
  entry: EntryDetailEntryDto;
  invoice: EntryInvoiceDetailDto | null;
  settlements: EntryDetailSettlementDto[];
}
```

`src/api/ledger.ts` 的 `fetchEntryDetail` 不需改動，回傳型別已經是 `EntryDetailResult`。

## 二、新增元件：`TransactionSettlementStatus.tsx`

路徑：`src/features/ledger/transaction/components/TransactionSettlementStatus.tsx`

沿用 `TransactionStatusSummary.tsx` 既有的「icon + label + value」row 樣式與卡片外觀
（`rounded-md border border-neutral-blue-gray/30 bg-white p-4`），三列：

| icon | label | value |
|---|---|---|
| `CircleDollarSign` | 已沖金額 | `fmtCurrency(entry.settledAmount)` |
| `Wallet` | 未沖金額 | `fmtCurrency(entry.remainingAmount)` |
| `Scale` | 沖帳狀態 | Badge（見下方對照） |

`settlementStatus` → Badge 對照（`variant="muted"`）：

| 值 | 文字 | tone |
|---|---|---|
| 0 | 平衡 | success |
| 1 | 超沖 | error |
| 2 | 少沖 | info |
| 其他 | 未知狀態 | neutral |

Props：`{ entry: EntryDetailEntryDto }`。

## 三、新增元件：`TransactionSettlementHistory.tsx`

路徑：`src/features/ledger/transaction/components/TransactionSettlementHistory.tsx`

卡片外觀比照 `TransactionAmountCard.tsx`（`rounded-md border border-neutral-blue-gray/30 bg-white p-6`
＋ `<h2 className="mb-5 text-base font-semibold text-neutral-dark">沖帳紀錄</h2>`）。

- `settlements.length === 0` 時顯示 `<p className="text-sm text-neutral-mid">尚無沖帳紀錄</p>`。
- 否則以 `divide-y divide-neutral-blue-gray/20` 列出每筆（`key={relationUuid}`），每筆包含：
  1. 頂列：左側入帳日期（`formatYyyymmdd(settlement?.entryDate ?? '') || '—'`，沿用
     `@/lib/utils` 既有的 `formatYyyymmdd`），右側 Badge：`isOpen` 為 `true` → 「尚有餘額」
     `tone="info"`；`false` → 「已結清」`tone="success"`。
  2. 沖帳金額列：label「沖帳金額」，value `fmtCurrency(settlementAmount)`（沿用
     `TransactionStatusSummary` 的 `font-mono tabular-nums` 數字樣式）。
  3. 前後餘額說明（`text-xs text-neutral-mid`）：`沖帳前 ${fmtCurrency(before)} → 沖帳後
     ${fmtCurrency(after)}`。
  4. 備註（`remark` 有值時才顯示，`text-xs text-neutral-mid`）：`備註：${remark}`。

Props：`{ settlements: EntryDetailSettlementDto[] }`。

## 四、`TransactionFormView.tsx` 資料載入與版面調整

- 新增 state：`const [entryDetail, setEntryDetail] = useState<EntryDetailEntryDto | null>(null);`
  `const [settlements, setSettlements] = useState<EntryDetailSettlementDto[]>([]);`
- `fetchEntryDetail` 成功回呼中，除了既有 `setForm(mapInvoiceDetailToForm(side, result.invoice))`，
  加上 `setEntryDetail(result.entry); setSettlements(result.settlements);`
- 版面新增兩處（皆僅 `mode === 'edit'` 顯示，銷項／進項皆同）：
  - 緊接在既有 `<TransactionStatusSummary .../>` 之後：
    `{entryDetail && <TransactionSettlementStatus entry={entryDetail} />}`
  - 在 `TransactionAmountCard`／`TransactionAllowanceCard` 之後、`submitError` 與送出按鈕列之前：
    `<TransactionSettlementHistory settlements={settlements} />`
- import 新增兩個元件與 `EntryDetailEntryDto`、`EntryDetailSettlementDto` 型別。

## 五、`ManualEntryDialog.tsx` 移除「預定入帳日期」

- 刪除第 124-127 行的 `<div>`（label + 唯讀 `DatePicker`）整塊。
- `scheduledDate`（第 47 行）與 `parseRowDate()`（第 23-27 行）維持不動，因為 `entryDate` 的
  初始值（第 48 行 `useState<Date | undefined>(scheduledDate)`）仍需要它——手動入帳日期預設帶入
  該筆交易原本的日期，只是不再另外顯示唯讀欄位。

## 六、不在本次範圍

- `entry`／`settlements` 其餘未解讀欄位（`direction`／`entryType`／`entryKind`／`status`／
  `counterpartyType`／`paymentChannelUuid` 等）不使用。
- 不變更「申報狀態」「入帳日期／入帳金額／手續費」「付款日期／付款金額」等既有「尚未串接」欄位
  （`TransactionStatusSummary.tsx` 其餘列不動）。
- `ReconTxnDetailModal.tsx` 內既有的「沖帳紀錄」假資料區塊本次不處理（使用者未要求，留待日後
  另行評估是否比照本次方式串接）。
