# 交易細節頁沖帳資訊 + 手動入帳彈窗簡化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在帳簿交易細節頁（`/ledger/[id]`）新增「沖帳狀態」與「沖帳紀錄」兩個真實資料區塊，並移除「交易手動入帳」彈窗中唯讀的「預定入帳日期」欄位。

**Architecture:** 擴充 `GET /ael/ledger/entries/detail` 的既有型別 `EntryDetailResult`，新增 `entry`（沖帳狀態子集）與 `settlements`（沖帳紀錄陣列）兩個欄位的型別。`TransactionFormView.tsx` 沿用既有的 `fetchEntryDetail` 呼叫，多存兩個 local state 並傳給兩個新元件（沿用 `TransactionStatusSummary.tsx` 的 icon+label+value 卡片樣式、`TransactionAmountCard.tsx` 的清單卡片樣式）。`ManualEntryDialog.tsx` 只刪除一個唯讀欄位的 JSX 區塊。

**Tech Stack:** Next.js 14（App Router）、React 18、TypeScript `strict: true`、TailwindCSS（本次沿用既有設計 token，不新增樣式）。

## Global Constraints

- 專案目前沒有任何測試框架（`package.json` 的 `scripts` 只有 `dev`/`build`/`start`/`lint`）。本計畫的「測試」步驟一律用 `npx tsc --noEmit -p tsconfig.json`（型別檢查）＋手動在瀏覽器操作驗證；最後一個任務會多跑一次完整 `npm run build`。**不要**為此功能額外引入測試框架。
- 全程使用 `@/*` 路徑別名匯入跨層模組（如 `@/api/types`、`@/components/ui/Badge`、`@/lib/utils`）；同層（`src/features/ledger/transaction/**`）內部一律用相對路徑（`./`），比照現有檔案的匯入風格。
- Icon 一律用 `lucide-react`，不得手刻 inline SVG，介面上不得出現 emoji（`CLAUDE.md` 規範）。
- 顏色/間距/圓角全部沿用既有 Tailwind 設計 token 與既有元件（`Badge`、卡片邊框樣式），不得自訂新的 hex 色碼或一次性樣式。
- `entry`／`settlements` 除了本計畫用到的欄位（`settledAmount`／`remainingAmount`／`settlementStatus`／`relationUuid`／`beforeSettlementAmount`／`afterSettlementAmount`／`settlementAmount`／`isOpen`／`remark`／`settlement.entryDate`）以外，其餘欄位一律不型別化、不使用。
- 程式碼註解沿用專案慣例：僅在「為什麼」不明顯時加中文註解，不加註解說明「做什麼」。
- 詳細規格見 `docs/superpowers/specs/2026-08-04-ledger-settlement-info-design.md`。

---

### Task 1: `src/api/types.ts` 新增沖帳相關型別

**Files:**
- Modify: `src/api/types.ts:477-507`

**Interfaces:**
- Consumes: 無
- Produces（後續任務會用到，簽名需完全一致）：
  - `export interface EntryDetailEntryDto { settledAmount: number; remainingAmount: number; settlementStatus: number; }`
  - `export interface EntryDetailSettlementDto { relationUuid: string; beforeSettlementAmount: number; afterSettlementAmount: number; settlementAmount: number; isOpen: boolean; remark: string | null; settlement: { entryDate: string | null } | null; }`
  - `export interface EntryDetailResult { entry: EntryDetailEntryDto; invoice: EntryInvoiceDetailDto | null; settlements: EntryDetailSettlementDto[]; }`

- [ ] **Step 1: 把第 503-507 行的 `EntryDetailResult` 定義與其上方註解整段取代**

現有內容（第 503-507 行）：

```ts
/** GET /ael/ledger/entries/detail 回應（僅型別化 invoice 區塊，entry/settlements 本次不使用）；
 *  invoice 沒有關聯發票的交易（如未開立發票的應收帳款）會是 null */
export interface EntryDetailResult {
  invoice: EntryInvoiceDetailDto | null;
}
```

改成：

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
 *  （entry／settlements 其餘欄位如 direction／entryType／status 等本次不使用）。
 *  invoice 沒有關聯發票的交易（如未開立發票的應收帳款）會是 null */
export interface EntryDetailResult {
  entry: EntryDetailEntryDto;
  invoice: EntryInvoiceDetailDto | null;
  settlements: EntryDetailSettlementDto[];
}
```

- [ ] **Step 2: 型別檢查**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 無任何輸出（無錯誤）

- [ ] **Step 3: Commit**

```bash
git add src/api/types.ts
git commit -m "feat(ledger): type settlement status/history fields in entry detail response"
```

---

### Task 2: 新增元件 `TransactionSettlementStatus.tsx`

**Files:**
- Create: `src/features/ledger/transaction/components/TransactionSettlementStatus.tsx`

**Interfaces:**
- Consumes: Task 1 的 `EntryDetailEntryDto`（來自 `@/api/types`）、既有 `Badge`（`@/components/ui/Badge`）、`fmtCurrency`（`@/lib/utils`）
- Produces: `export default function TransactionSettlementStatus({ entry }: { entry: EntryDetailEntryDto }): JSX.Element`（供 Task 4 使用）

- [ ] **Step 1: 建立檔案，寫入完整內容**

```tsx
import type { EntryDetailEntryDto } from '@/api/types';
import Badge from '@/components/ui/Badge';
import { fmtCurrency } from '@/lib/utils';
import { CircleDollarSign, Scale, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatusRow {
  icon: typeof Scale;
  label: string;
  value: ReactNode;
}

type BadgeTone = 'success' | 'error' | 'info' | 'neutral';

/** entry.settlementStatus：0平衡 1超沖 2少沖；未知值一律顯示中性樣式，避免畫面出錯 */
const SETTLEMENT_STATUS_BADGE: Record<number, { label: string; tone: BadgeTone }> = {
  0: { label: '平衡', tone: 'success' },
  1: { label: '超沖', tone: 'error' },
  2: { label: '少沖', tone: 'info' },
};

export default function TransactionSettlementStatus({ entry }: { entry: EntryDetailEntryDto }) {
  const statusBadge = SETTLEMENT_STATUS_BADGE[entry.settlementStatus] ?? { label: '未知狀態', tone: 'neutral' as const };

  const rows: StatusRow[] = [
    { icon: CircleDollarSign, label: '已沖金額', value: fmtCurrency(entry.settledAmount) },
    { icon: Wallet, label: '未沖金額', value: fmtCurrency(entry.remainingAmount) },
    {
      icon: Scale,
      label: '沖帳狀態',
      value: (
        <Badge tone={statusBadge.tone} variant="muted">
          {statusBadge.label}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-2.5 rounded-md border border-neutral-blue-gray/30 bg-white p-4">
      {rows.map(row => (
        <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 text-neutral-mid">
            <row.icon size={15} className="shrink-0" />
            {row.label}
          </span>
          <span className="font-mono font-semibold tabular-nums text-neutral-dark">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 型別檢查**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 無任何輸出

- [ ] **Step 3: Commit**

```bash
git add src/features/ledger/transaction/components/TransactionSettlementStatus.tsx
git commit -m "feat(ledger): add settlement status summary card"
```

---

### Task 3: 新增元件 `TransactionSettlementHistory.tsx`

**Files:**
- Create: `src/features/ledger/transaction/components/TransactionSettlementHistory.tsx`

**Interfaces:**
- Consumes: Task 1 的 `EntryDetailSettlementDto`（來自 `@/api/types`）、既有 `Badge`（`@/components/ui/Badge`）、`fmtCurrency`／`formatYyyymmdd`（`@/lib/utils`）
- Produces: `export default function TransactionSettlementHistory({ settlements }: { settlements: EntryDetailSettlementDto[] }): JSX.Element`（供 Task 4 使用）

- [ ] **Step 1: 建立檔案，寫入完整內容**

```tsx
import type { EntryDetailSettlementDto } from '@/api/types';
import Badge from '@/components/ui/Badge';
import { fmtCurrency, formatYyyymmdd } from '@/lib/utils';

export default function TransactionSettlementHistory({ settlements }: { settlements: EntryDetailSettlementDto[] }) {
  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <h2 className="mb-5 text-base font-semibold text-neutral-dark">沖帳紀錄</h2>
      {settlements.length === 0 ? (
        <p className="text-sm text-neutral-mid">尚無沖帳紀錄</p>
      ) : (
        <div className="flex flex-col divide-y divide-neutral-blue-gray/20">
          {settlements.map(item => {
            const entryDate = item.settlement?.entryDate;
            return (
              <div key={item.relationUuid} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-dark">{entryDate ? formatYyyymmdd(entryDate) : '—'}</span>
                  <Badge tone={item.isOpen ? 'info' : 'success'} variant="muted">
                    {item.isOpen ? '尚有餘額' : '已結清'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-neutral-mid">
                  <span>沖帳金額</span>
                  <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(item.settlementAmount)}</span>
                </div>
                <p className="text-xs text-neutral-mid">
                  沖帳前 {fmtCurrency(item.beforeSettlementAmount)} → 沖帳後 {fmtCurrency(item.afterSettlementAmount)}
                </p>
                {item.remark && <p className="text-xs text-neutral-mid">備註：{item.remark}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 型別檢查**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 無任何輸出

- [ ] **Step 3: Commit**

```bash
git add src/features/ledger/transaction/components/TransactionSettlementHistory.tsx
git commit -m "feat(ledger): add settlement history list card"
```

---

### Task 4: `TransactionFormView.tsx` 串接兩個新區塊

**Files:**
- Modify: `src/features/ledger/transaction/TransactionFormView.tsx:1-20`（imports）
- Modify: `src/features/ledger/transaction/TransactionFormView.tsx:109-141`（state + fetch）
- Modify: `src/features/ledger/transaction/TransactionFormView.tsx:213-217`（render）

**Interfaces:**
- Consumes: Task 1 的 `EntryDetailEntryDto`／`EntryDetailSettlementDto`；Task 2 的 `TransactionSettlementStatus`；Task 3 的 `TransactionSettlementHistory`
- Produces: 無新對外介面；`TransactionFormView` 本身的 props 不變

- [ ] **Step 1: 修改 imports**

第 4 行：

```ts
import type { CreatePayableBody, CreateReceivableBody } from '@/api/types';
```

改成：

```ts
import type { CreatePayableBody, CreateReceivableBody, EntryDetailEntryDto, EntryDetailSettlementDto } from '@/api/types';
```

第 14-18 行：

```ts
import TransactionAllowanceCard from './components/TransactionAllowanceCard';
import TransactionAmountCard from './components/TransactionAmountCard';
import TransactionMetaCard from './components/TransactionMetaCard';
import TransactionStatusSummary from './components/TransactionStatusSummary';
import VoucherUpload from './components/VoucherUpload';
```

改成：

```ts
import TransactionAllowanceCard from './components/TransactionAllowanceCard';
import TransactionAmountCard from './components/TransactionAmountCard';
import TransactionMetaCard from './components/TransactionMetaCard';
import TransactionSettlementHistory from './components/TransactionSettlementHistory';
import TransactionSettlementStatus from './components/TransactionSettlementStatus';
import TransactionStatusSummary from './components/TransactionStatusSummary';
import VoucherUpload from './components/VoucherUpload';
```

- [ ] **Step 2: 新增 state，並在 fetch 成功回呼存入資料**

第 117-141 行：

```ts
  // 編輯畫面掛載時向 GET /ael/ledger/entries/detail 取得真實資料；新增畫面不需要，維持 EMPTY_TRANSACTION_FORM
  const [detailLoading, setDetailLoading] = useState(mode === 'edit');
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    if (mode !== 'edit' || !transactionId) return;
    let cancelled = false;
    setDetailLoading(true);
    setDetailError('');
    fetchEntryDetail({ ledgerUuid: transactionId })
      .then(result => {
        if (cancelled) return;
        setForm(mapInvoiceDetailToForm(side, result.invoice));
      })
      .catch(err => {
        if (cancelled) return;
        setDetailError(err instanceof Error ? err.message : '操作失敗');
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, side, transactionId]);
```

改成：

```ts
  // 編輯畫面掛載時向 GET /ael/ledger/entries/detail 取得真實資料；新增畫面不需要，維持 EMPTY_TRANSACTION_FORM
  const [detailLoading, setDetailLoading] = useState(mode === 'edit');
  const [detailError, setDetailError] = useState('');
  const [entryDetail, setEntryDetail] = useState<EntryDetailEntryDto | null>(null);
  const [settlements, setSettlements] = useState<EntryDetailSettlementDto[]>([]);

  useEffect(() => {
    if (mode !== 'edit' || !transactionId) return;
    let cancelled = false;
    setDetailLoading(true);
    setDetailError('');
    fetchEntryDetail({ ledgerUuid: transactionId })
      .then(result => {
        if (cancelled) return;
        setForm(mapInvoiceDetailToForm(side, result.invoice));
        setEntryDetail(result.entry);
        setSettlements(result.settlements);
      })
      .catch(err => {
        if (cancelled) return;
        setDetailError(err instanceof Error ? err.message : '操作失敗');
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, side, transactionId]);
```

- [ ] **Step 3: 版面加入兩個新區塊**

第 213-219 行：

```tsx
            <div className="flex flex-col gap-5">
              {mode === 'edit' && <TransactionStatusSummary side={side} declarePeriod={form.declarePeriod} />}
              <TransactionMetaCard side={side} mode={mode} form={form} onChange={handleChange} />
              <TransactionAmountCard side={side} mode={mode} form={form} onChange={handleChange} />
              {side === 'sales' && mode === 'edit' && <TransactionAllowanceCard />}

              {mode === 'create' && submitError && <p className="text-sm text-semantic-error">{submitError}</p>}
```

改成：

```tsx
            <div className="flex flex-col gap-5">
              {mode === 'edit' && <TransactionStatusSummary side={side} declarePeriod={form.declarePeriod} />}
              {mode === 'edit' && entryDetail && <TransactionSettlementStatus entry={entryDetail} />}
              <TransactionMetaCard side={side} mode={mode} form={form} onChange={handleChange} />
              <TransactionAmountCard side={side} mode={mode} form={form} onChange={handleChange} />
              {side === 'sales' && mode === 'edit' && <TransactionAllowanceCard />}
              {mode === 'edit' && <TransactionSettlementHistory settlements={settlements} />}

              {mode === 'create' && submitError && <p className="text-sm text-semantic-error">{submitError}</p>}
```

- [ ] **Step 4: 型別檢查**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 無任何輸出

- [ ] **Step 5: 手動驗證**

Run: `npm run dev`，瀏覽器開 `http://localhost:3000/ledger`，點任一筆進項交易進入交易明細（`mode=edit`），確認：

1. 「申報狀態摘要」卡片下方多出「沖帳狀態」卡片，顯示已沖金額／未沖金額／沖帳狀態 Badge（依實際回傳的 `settlementStatus` 顯示「平衡」/「超沖」/「少沖」其中之一）。
2. 頁面下方（折讓卡片或金額卡片之後、送出按鈕列之前）多出「沖帳紀錄」卡片；若該筆交易有沖帳紀錄，每筆顯示入帳日期、沖帳金額、沖帳前→後餘額；若該筆交易 `settlements` 為空陣列，顯示「尚無沖帳紀錄」。
3. 切到銷項交易明細，重複上述兩點，確認銷項同樣顯示這兩個區塊。
4. 新增交易頁（`mode=create`）不顯示這兩個區塊（沖帳資訊只在編輯畫面有意義）。

- [ ] **Step 6: Commit**

```bash
git add src/features/ledger/transaction/TransactionFormView.tsx
git commit -m "feat(ledger): wire settlement status/history into transaction detail page"
```

---

### Task 5: `ManualEntryDialog.tsx` 移除「預定入帳日期」欄位

**Files:**
- Modify: `src/features/ledger/components/ManualEntryDialog.tsx:121-131`

**Interfaces:**
- Consumes: 無
- Produces: 無新對外介面；`ManualEntryDialog` 的 props 不變

- [ ] **Step 1: 刪除「預定入帳日期」區塊**

第 121-131 行：

```tsx
  return (
    <Modal open onClose={onClose} title="交易手動入帳" widthClassName="max-w-[420px]">
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">預定入帳日期</label>
          <DatePicker value={scheduledDate} onChange={() => {}} disabled />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">手動入帳日期</label>
          <DatePicker value={entryDate} onChange={setEntryDate} />
        </div>
```

改成：

```tsx
  return (
    <Modal open onClose={onClose} title="交易手動入帳" widthClassName="max-w-[420px]">
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">手動入帳日期</label>
          <DatePicker value={entryDate} onChange={setEntryDate} />
        </div>
```

`scheduledDate`（第 47 行）與 `parseRowDate()`（第 23-27 行）保持不動——`entryDate` 的初始值（第 48 行）仍需要 `scheduledDate` 帶入該筆交易原本的日期作預設值，只是不再另外顯示這個唯讀欄位。

- [ ] **Step 2: 型別檢查**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 無任何輸出

- [ ] **Step 3: 手動驗證**

Run: `npm run dev`，瀏覽器開 `http://localhost:3000/ledger`，切到「應收帳款」或「應付帳款」子分頁，點任一列的「手動入帳」動作，確認彈窗只剩「手動入帳日期」（不再有「預定入帳日期」欄位），其餘欄位（收款戶頭／交易金額／各項手續費／存入金額）與送出行為不受影響。

- [ ] **Step 4: Commit**

```bash
git add src/features/ledger/components/ManualEntryDialog.tsx
git commit -m "fix(ledger): remove read-only scheduled entry date field from manual entry dialog"
```

---

### Task 6: 完整建置驗證

**Files:**
- 無新增/修改檔案，僅驗證

**Interfaces:**
- Consumes: 前五個任務的全部產出
- Produces: 無

- [ ] **Step 1: 完整建置**

Run: `npm run build`
Expected: 建置成功（`✓ Compiled successfully`），無 TypeScript 或 ESLint 錯誤

- [ ] **Step 2: 確認無殘留未使用的型別/匯出**

Run: `grep -rn "EntryDetailEntryDto\|EntryDetailSettlementDto" src/`
Expected: 至少出現在 `src/api/types.ts`（定義處）、`TransactionSettlementStatus.tsx`、`TransactionSettlementHistory.tsx`、`TransactionFormView.tsx` 四處，無其餘未預期的殘留或遺漏

- [ ] **Step 3: 若前述步驟皆通過，無需額外 commit（Task 1-5 已個別 commit）**
