# 交易明細頁串接 /ael/ledger/entries/detail 設計 Spec

日期：2026-07-31

## 背景與目標

交易明細頁（`TransactionFormView.tsx` 的 `mode === 'edit'`）目前顯示的所有欄位（`EDIT_SALES_FORM`／
`EDIT_PURCHASE_FORM`／`SALES_STATUS_SUMMARY`／`PURCHASE_STATUS_SUMMARY`）都是假資料。本次要改成呼叫
`GET /ael/ledger/entries/detail`（帶 `companyUuid`、`ledgerUuid`）取得真實資料。

回應包含 `entry`／`settlements`／`invoice` 三個區塊，**本次只使用 `invoice` 區塊**；`entry`／
`settlements` 內含多個未解讀的數值枚舉（`entryType`／`direction`／`entryKind`／`status`／
`settlementStatus`），全專案目前沒有任何地方解碼過這些值，本次不猜測、不使用。

畫面上原本存在、但 `invoice` 沒有對應資料的欄位，一律加上「尚未串接」標記並清空假資料，不再顯示
編造出來的數值，避免 demo 時被誤認為真實資料。

## 一、欄位對應盤點（invoice → 畫面欄位）

**兩側共通**

| 畫面欄位 | invoice 來源 | 處理方式 |
|---|---|---|
| 發票號碼 | `invoiceTrack` + `invoiceNumber` 組合顯示 | 直接串接 |
| 開立日期 | `year`／`month`／`day`（民國年） | 直接串接（`new Date(year+1911, month-1, day)`） |
| 申報期間 | `cmsYear` + `cmsPhase` | 直接串接，見下方公式 |
| 銷售額 | `sales` | 直接串接 |
| 稅額 | `businessTax` | 直接串接 |
| 免稅銷售額 | `taxFreeAmount` | 直接串接 |
| 憑證圖片 | `invoicePicUrl` | 直接串接（無檔名，`voucherFileName` 維持 `null`） |
| 備註 | `remark` | 直接串接 |
| 標籤／專案 | 無 | 「尚未串接」標記，維持空白 |
| 是否為折讓 | `isDebit`（1 折讓、2 否） | 直接串接，移除「尚未串接」標記 |
| 費用類別／收入科目 | entry 區塊 `officialAccountingSubjectId` | 直接串接，比照帳簿列表向 `/ael/subject/official/list/latest` 反查科目名稱，移除「尚未串接」標記 |
| 申報狀態 | `declared`（1 已申報、2 未申報） | 直接串接，顯示已申報／未申報 badge |

> 2026-08-04 更新：「營業稅」（原固定顯示「應稅 5%」的欄位）已從畫面上移除；`isDebit`／
> `declared` 編碼已確認並完成串接；「付款日期」／「付款金額」兩列已從進項申報狀態卡片移除；
> 費用類別／收入科目改為讀取 entry 區塊的 `officialAccountingSubjectId`（而非原規劃的 invoice
> 區塊 `costCategory`），詳見下方型別與 `mapInvoiceDetailToForm`／`resolveExpenseCategory` 異動。

**銷項限定**

| 畫面欄位 | invoice 來源 | 處理方式 |
|---|---|---|
| 買家統一編號 | `buyerTaxIdNumber` | 直接串接 |
| 交易對象名稱（買家名稱） | 無 | 「尚未串接」標記，維持空白 |
| 銷售管道 | entry 區塊 `paymentChannelUuid` | 直接串接（對應真實「銷售管道規則」清單的 uuid），移除「尚未串接」標記；並在下拉旁加上「新增」按鈕，沿用設定頁 `ChannelRuleDialog`／`createChannelRule` 直接新增管道 |
| 入帳日期／入帳金額／手續費 | 無 | 「尚未串接」標記，不顯示假資料 |

**進項限定**

| 畫面欄位 | invoice 來源 | 處理方式 |
|---|---|---|
| 賣家統一編號 | `sellerTaxIdNumber` | 直接串接 |
| 賣家名稱 | `companyName` | 直接串接（已確認 `companyName` 即賣家名稱） |
| 付款日期／付款金額 | 無 | 「尚未串接」標記，不顯示假資料 |

申報期間公式：`cmsPhase` 為雙月期別代碼（1→01-02月、3→03-04月、5→05-06月、7→07-08月、
9→09-10月、11→11-12月），格式化為 `${cmsYear} 年 ${補零(cmsPhase)} - ${補零(cmsPhase+1)} 月份`
（沿用現有 `115 年 01 - 02 月份` 格式）。

## 二、`src/api/types.ts` 新增型別

```ts
/** GET /ael/ledger/entries/detail 回應的 invoice 區塊；僅型別化本次會使用的欄位 */
export interface EntryInvoiceDetailDto {
  invoiceTrack: string;
  invoiceNumber: string;
  /** 民國年 */
  year: number;
  month: number;
  day: number;
  /** 銷售額 */
  sales: number;
  /** 稅額 */
  businessTax: number;
  taxFreeAmount: number;
  /** 憑證圖片網址，無圖時為空字串 */
  invoicePicUrl: string;
  remark: string;
  buyerTaxIdNumber: string;
  sellerTaxIdNumber: string;
  /** 賣家名稱（進項適用） */
  companyName: string;
  /** 申報年度（民國年） */
  cmsYear: number;
  /** 申報期別代碼：1/3/5/7/9/11，對應雙月期間 */
  cmsPhase: number;
}

/** GET /ael/ledger/entries/detail 回應（僅型別化 invoice 區塊，entry/settlements 本次不使用） */
export interface EntryDetailResult {
  invoice: EntryInvoiceDetailDto;
}
```

## 三、`src/api/ledger.ts` 新增函式

```ts
export function fetchEntryDetail(params: { ledgerUuid: string }): Promise<EntryDetailResult> {
  return apiFetch<EntryDetailResult>(`/ael/ledger/entries/detail${buildQuery({ companyUuid: COMPANY_UUID, ledgerUuid: params.ledgerUuid })}`);
}
```

需從 `./client` 補 import `buildQuery`（現有檔案尚未使用過），並在 `./types` import 中加入
`EntryDetailResult`。

## 四、uuid 導頁修正（銷項／進項皆需修正，非僅進項）

現況盤點：`LedgerTable.tsx`／`LedgerCards.tsx` 的列連結目前**銷項與進項都用 `row.id`**（交易編號，
如 `UA40435903`）導頁到 `/ledger/[id]`，`SalesRow` 雖然已有 `uuid`（供沖帳功能使用）但沒被拿來當
導頁路徑；`PurchaseRow` 則完全沒有 `uuid` 欄位。

- `src/features/ledger/types.ts`：`PurchaseRow` 新增 `uuid?: string;`（比照 `SalesRow.uuid` 的可選寫法）。
- `src/features/ledger/data.ts`：`mapPayableItemsToRows` 回傳物件補上 `uuid: item.uuid`。
- `LedgerTable.tsx` 兩處列連結、`LedgerCards.tsx` 的 `goToTransaction`：改成
  `` `/ledger/${row.uuid ?? row.id}?side=...` ``（保留 fallback，避免 `SummaryReconDialog.tsx`
  仍在用的假資料陣列 `SALES_RECEIVABLE`／`PURCHASE_PAYABLE`——它們沒有 `uuid`——若未來意外流入這條
  路徑時不至於整個連結失效）。

## 五、`TransactionFormView.tsx` 資料載入方式調整

- `mode === 'create'`：不受影響，繼續同步使用 `EMPTY_TRANSACTION_FORM` 初始化。
- `mode === 'edit'`：改成掛載時用 `useEffect` 呼叫 `fetchEntryDetail({ ledgerUuid: transactionId })`，
  新增 `detailLoading`／`detailError` state（比照 `LedgerView.tsx` 現有 loading/error 呈現模式：
  載入中顯示文字、失敗顯示 `error instanceof Error ? error.message : '操作失敗'`），成功後用
  `mapInvoiceDetailToForm(side, result.invoice)` 組出 `form` 初始值。
- 移除 `initialForm()` 內對 `EDIT_SALES_FORM`／`EDIT_PURCHASE_FORM` 的引用（改為 `mode === 'edit'`
  時回傳 `EMPTY_TRANSACTION_FORM`，實際值由上述 `useEffect` 載入後覆蓋）。

## 六、`src/features/ledger/transaction/data.ts` 新增/移除

新增：

```ts
/** cmsPhase 雙月期別代碼 → 申報期間顯示字串，如 "115 年 01 - 02 月份" */
function formatDeclarePeriod(cmsYear: number, cmsPhase: number): string {
  const start = String(cmsPhase).padStart(2, '0');
  const end = String(cmsPhase + 1).padStart(2, '0');
  return `${cmsYear} 年 ${start} - ${end} 月份`;
}

/** GET /ael/ledger/entries/detail 的 invoice → 交易表單狀態；進項/銷項對應欄位不同 */
export function mapInvoiceDetailToForm(side: Side, invoice: EntryInvoiceDetailDto): TransactionFormState {
  const common: TransactionFormState = {
    ...EMPTY_TRANSACTION_FORM,
    invoiceTrack: invoice.invoiceTrack,
    invoiceSerial: invoice.invoiceNumber,
    invoiceNumber: `${invoice.invoiceTrack}${invoice.invoiceNumber}`,
    declarePeriod: formatDeclarePeriod(invoice.cmsYear, invoice.cmsPhase),
    issueDate: new Date(invoice.year + 1911, invoice.month - 1, invoice.day),
    salesAmount: invoice.sales,
    exemptSalesAmount: invoice.taxFreeAmount,
    taxAmount: invoice.businessTax,
    note: invoice.remark,
    voucherPreviewUrl: invoice.invoicePicUrl || null,
  };
  return side === 'sales'
    ? { ...common, buyerTaxId: invoice.buyerTaxIdNumber }
    : { ...common, sellerTaxId: invoice.sellerTaxIdNumber, sellerName: invoice.companyName };
}
```

移除：`EDIT_SALES_FORM`、`EDIT_PURCHASE_FORM`、`SALES_STATUS_SUMMARY`／`PurchaseStatusSummary`
型別與 `PURCHASE_STATUS_SUMMARY`、`SalesStatusSummary` 型別（串接後不再被任何地方引用的假資料）。
`TRANSACTION_ALLOWANCES`（本來就未被使用的既有死碼）與 `ALLOWANCE_LINE_ITEMS` 不在本次範圍內，
不動它們。

## 七、「尚未串接」標記機制

`src/features/ledger/transaction/components/Field.tsx` 新增可選 prop：

```ts
interface FieldProps {
  label: string;
  badge?: ReactNode;
  helper?: string;
  className?: string;
  children: ReactNode;
}
```

`badge` 有值時渲染在 label 文字右側（沿用 `Badge` 元件 `tone="neutral" variant="muted"`，與
`TransactionStatusSummary` 既有申報狀態 badge 同樣式）。

套用範圍（`TransactionMetaCard.tsx`）：銷售管道、標籤、專案、交易對象名稱（銷項買家名稱）、
是否為折讓、（`TransactionAmountCard.tsx`）費用類別／收入科目、營業稅。

`TransactionStatusSummary.tsx` 改造：

- Props 從讀取 `../data` 的死資料常數，改為接收 `{ side: Side; declarePeriod: string }`。
- 「申報期間」列（原「申報日期」）顯示真實 `declarePeriod`。
- 「申報狀態」（兩側）、「入帳日期／入帳金額／手續費」（銷項）、「付款日期／付款金額」（進項）
  這幾列的 `value` 直接換成 `<Badge tone="neutral" variant="muted">尚未串接</Badge>`，不再顯示
  假資料數字。
- `TransactionFormView.tsx` 呼叫處改傳 `declarePeriod={form.declarePeriod}`。

## 八、不在本次範圍

- `entry`／`settlements` 兩個區塊完全不使用（`isDebit`／`declared`／`taxType`／`entryType`／
  `direction`／`entryKind`／`status`／`settlementStatus` 等編碼待日後提供對照表再串接）。
- 不新增「沖帳紀錄」相關 UI（`settlements` 陣列目前介面上沒有對應區塊可放）。
- 進項編輯頁 `TransactionMetaCard` 既有的「申報期間」下拉（`mode === 'edit' && side === 'purchase'`
  分支）本身不新增元件，只需確保下拉選項清單一定包含真實值（比照現有「發票號碼」欄位
  `Array.from(new Set([真實值, ...假選項]))` 的安全寫法），避免真實申報期間字串不在
  `DECLARE_PERIOD_OPTIONS` 三個假選項內時顯示異常。
