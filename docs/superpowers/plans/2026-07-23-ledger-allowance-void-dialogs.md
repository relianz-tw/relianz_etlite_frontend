# 帳簿「折讓」「作廢」彈窗 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓賬簿頁面銷項列的「折讓」「作廢」按鈕真正可互動：折讓開啟含歷史清單＋新增表單的彈窗，
作廢開啟確認彈窗，兩者確認後皆在列表頁局部更新畫面（不接後端）。

**Architecture:** 在 `src/features/ledger/components/` 新增 `AllowanceDialog.tsx`、
`VoidConfirmDialog.tsx` 兩個對話框元件，風格比照既有 `ManualEntryDialog.tsx`。`SalesRow` 型別把
`allowanceCount: number` 改為 `allowances: AllowanceRecord[]`（陣列長度取代單獨數字欄位）。
`LedgerTable.tsx`、`LedgerCards.tsx`、`TransactionFormView.tsx` 三處各自用 local state
（override 模式，比照既有 `channelOverrides` 寫法）掛載這兩個彈窗。

**Tech Stack:** Next.js 14 App Router、React 18、TypeScript strict、Tailwind CSS（既有 design
token）、lucide-react 圖示。專案沒有安裝任何測試框架（無 jest/vitest），驗證方式沿用專案既有慣例：
`npx tsc --noEmit` 做型別檢查、`npm run build` 做完整編譯 + ESLint、`npm run dev` 啟動後以瀏覽器
手動檢查畫面。

## Global Constraints

- 語言規範：程式碼註解中文優先，變數/函式命名英文，使用者可見文字（按鈕、標題、提示）繁體中文
- 路徑別名一律用 `@/*`（對應 `src/*`）；同一 feature 內（`src/features/ledger/**`）沿用既有的相對
  路徑匯入慣例（如 `../types`、`./AddChannelDialog`）
- 圖示一律用 `lucide-react`，不得手刻 inline SVG 或使用其他圖示庫
- 畫面上不得出現 emoji
- 顏色/間距/圓角一律使用 `tailwind.config.js` 既有 token，禁止新增自訂 hex 色碼
- 全案為視覺模擬，不接後端 API；所有確認/送出效果僅反映在元件 local state
- **不修改** `SPLIT_CHILDREN` / `SalesRow.children` 相關邏輯（展開列子交易是既有的獨立功能，與本次
  折讓歷史紀錄是不同概念）
- 本專案是 git repository，每個 Task 結尾皆包含 `git commit` 步驟

---

## 檔案總覽

| 檔案 | 說明 |
|---|---|
| `src/features/ledger/types.ts` | 修改：新增 `AllowanceRecord`，`SalesRow.allowanceCount` 改為 `allowances` |
| `src/features/ledger/data.ts` | 修改：假資料改用 `allowances` 陣列 |
| `src/features/ledger/components/AllowanceDialog.tsx` | 新增：折讓歷史清單 + 新增表單彈窗 |
| `src/features/ledger/components/VoidConfirmDialog.tsx` | 新增：作廢確認彈窗（3 處共用） |
| `src/features/ledger/components/LedgerTable.tsx` | 修改：折讓／作廢按鈕接上彈窗 |
| `src/features/ledger/components/LedgerCards.tsx` | 修改：折讓／作廢按鈕接上彈窗，並補上手機版缺少的「折讓」按鈕 |
| `src/features/ledger/transaction/TransactionFormView.tsx` | 修改：銷項編輯頁「作廢」按鈕接上確認彈窗 |

---

### Task 1: 型別與假資料調整

**Files:**
- Modify: `src/features/ledger/types.ts`
- Modify: `src/features/ledger/data.ts`

**Interfaces:**
- Consumes: 無
- Produces: `AllowanceRecord { id: string; date: string; amount: number; note: string }`；
  `SalesRow.allowances: AllowanceRecord[]`（取代原本的 `allowanceCount: number`）— Task 2–6 皆會用到

- [ ] **Step 1: 修改 `src/features/ledger/types.ts`，新增 `AllowanceRecord` 並調整 `SalesRow`**

把：

```ts
export interface SalesRow {
  id: string;
  amount: number;
  counterparty: string;
  date: string;
  channel: string;
  voided: boolean;
  allowanceCount: number;
  children?: SubRow[];
}
```

改成：

```ts
export interface AllowanceRecord {
  id: string;
  date: string;
  amount: number;
  note: string;
}

export interface SalesRow {
  id: string;
  amount: number;
  counterparty: string;
  date: string;
  channel: string;
  voided: boolean;
  allowances: AllowanceRecord[];
  children?: SubRow[];
}
```

（插入位置：緊接在 `SubRow` interface 之後、`SalesRow` interface 之前）

- [ ] **Step 2: 修改 `src/features/ledger/data.ts`，import 新型別並新增 mock 折讓紀錄**

把：

```ts
import { generateDailyTrend } from '@/lib/utils';
import type { PurchaseRow, SalesRow } from './types';
```

改成：

```ts
import { generateDailyTrend } from '@/lib/utils';
import type { AllowanceRecord, PurchaseRow, SalesRow } from './types';
```

把：

```ts
const SPLIT_CHILDREN = [
  { id: 'S26XH743195003', amount: 500, date: '115/03/26' },
  { id: 'S26XH743195002', amount: 2000, date: '115/03/29' },
  { id: '可折讓餘額（含稅）', label: '可折讓餘額（含稅）', amount: 7500 },
];
```

改成：

```ts
const SPLIT_CHILDREN = [
  { id: 'S26XH743195003', amount: 500, date: '115/03/26' },
  { id: 'S26XH743195002', amount: 2000, date: '115/03/29' },
  { id: '可折讓餘額（含稅）', label: '可折讓餘額（含稅）', amount: 7500 },
];

const UA40435903_ALLOWANCES: AllowanceRecord[] = [
  { id: 'ALW-UA40435903-01', date: '115/03/28', amount: 500, note: '出貨數量認列錯誤，折讓部分金額' },
  { id: 'ALW-UA40435903-02', date: '115/04/02', amount: 1500, note: '客戶議價後補開折讓' },
  { id: 'ALW-UA40435903-03', date: '115/04/10', amount: 800, note: '瑕疵品部分金額折讓' },
];
```

- [ ] **Step 3: 更新 `SALES_RECEIVED`，把 `allowanceCount` 改為 `allowances`**

把：

```ts
export const SALES_RECEIVED: SalesRow[] = [
  { id: 'UA40435900', amount: 999500999, counterparty: '友信創新股份有限公司', date: '115/03/22', channel: '現金', voided: false, allowanceCount: 0 },
  { id: 'UA40435901', amount: 6800, counterparty: '台積開發股份有限公司', date: '115/03/23', channel: '匯票', voided: false, allowanceCount: 0 },
  { id: 'UA40435902', amount: 999500999, counterparty: '我的另一間公司', date: '115/03/25', channel: '匯票', voided: false, allowanceCount: 0 },
  { id: 'UA40435903', amount: 10000, counterparty: '名子很長很長很長很長股份有限公司', date: '115/03/26', channel: '國泰信用卡', voided: false, allowanceCount: 3, children: SPLIT_CHILDREN },
  { id: 'UA40435904', amount: 128000, counterparty: '長榮海運股份有限公司', date: '115/03/27', channel: 'MoMo', voided: true, allowanceCount: 0 },
];
```

改成：

```ts
export const SALES_RECEIVED: SalesRow[] = [
  { id: 'UA40435900', amount: 999500999, counterparty: '友信創新股份有限公司', date: '115/03/22', channel: '現金', voided: false, allowances: [] },
  { id: 'UA40435901', amount: 6800, counterparty: '台積開發股份有限公司', date: '115/03/23', channel: '匯票', voided: false, allowances: [] },
  { id: 'UA40435902', amount: 999500999, counterparty: '我的另一間公司', date: '115/03/25', channel: '匯票', voided: false, allowances: [] },
  { id: 'UA40435903', amount: 10000, counterparty: '名子很長很長很長很長股份有限公司', date: '115/03/26', channel: '國泰信用卡', voided: false, allowances: UA40435903_ALLOWANCES, children: SPLIT_CHILDREN },
  { id: 'UA40435904', amount: 128000, counterparty: '長榮海運股份有限公司', date: '115/03/27', channel: 'MoMo', voided: true, allowances: [] },
];
```

- [ ] **Step 4: 更新 `SALES_RECEIVABLE`，把 `allowanceCount` 改為 `allowances`**

把：

```ts
export const SALES_RECEIVABLE: SalesRow[] = [
  { id: 'UA40435900', amount: 999500999, counterparty: '友信創新股份有限公司', date: '115/03/22', channel: '', voided: false, allowanceCount: 0 },
  { id: 'UA40435901', amount: 6800, counterparty: '台積開發股份有限公司', date: '115/03/23', channel: '', voided: false, allowanceCount: 0 },
  { id: 'UA40435902', amount: 999500999, counterparty: '我的另一間公司', date: '115/03/25', channel: '', voided: false, allowanceCount: 0 },
  { id: 'UA40435903', amount: 10000, counterparty: '名子很長很長很長很長股份有限公司', date: '115/03/26', channel: '', voided: false, allowanceCount: 3, children: SPLIT_CHILDREN },
];
```

改成：

```ts
export const SALES_RECEIVABLE: SalesRow[] = [
  { id: 'UA40435900', amount: 999500999, counterparty: '友信創新股份有限公司', date: '115/03/22', channel: '', voided: false, allowances: [] },
  { id: 'UA40435901', amount: 6800, counterparty: '台積開發股份有限公司', date: '115/03/23', channel: '', voided: false, allowances: [] },
  { id: 'UA40435902', amount: 999500999, counterparty: '我的另一間公司', date: '115/03/25', channel: '', voided: false, allowances: [] },
  { id: 'UA40435903', amount: 10000, counterparty: '名子很長很長很長很長股份有限公司', date: '115/03/26', channel: '', voided: false, allowances: UA40435903_ALLOWANCES, children: SPLIT_CHILDREN },
];
```

- [ ] **Step 5: 型別檢查**

Run: `npx tsc --noEmit`
Expected: 無錯誤（此時 `LedgerTable.tsx`/`LedgerCards.tsx` 仍引用舊的 `allowanceCount` 欄位，
`tsc` 應會報錯 — 這是預期中的暫時狀態，等 Task 4、5 改完呼叫端才會恢復全綠。若想在本步驟就看到
全綠，可先執行 `npx tsc --noEmit 2>&1 | grep -v "LedgerTable.tsx\|LedgerCards.tsx"` 確認除了這
兩個已知待改檔案外沒有其他錯誤）

- [ ] **Step 6: Commit**

```bash
git add src/features/ledger/types.ts src/features/ledger/data.ts
git commit -m "$(cat <<'EOF'
refactor(ledger): replace SalesRow.allowanceCount with allowances record array

Lays the groundwork for the allowance history dialog — a derived count
field risked drifting from the actual records, so track the records
themselves instead.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: 新增折讓彈窗（AllowanceDialog）

**Files:**
- Create: `src/features/ledger/components/AllowanceDialog.tsx`

**Interfaces:**
- Consumes: `../types` 的 `AllowanceRecord`、`SalesRow`（Task 1）；`@/components/ui/Button`、
  `@/components/ui/DatePicker`、`@/components/ui/MoneyInput`、`@/components/ui/Modal`、
  `@/components/ui/Textarea`；`@/lib/utils` 的 `fmtCurrency`
- Produces: `AllowanceDialog({ open: boolean, onClose: () => void, row: SalesRow | null, onSubmit: (rowId: string, record: AllowanceRecord) => void })` — Task 4、5 會 import 使用

- [ ] **Step 1: 建立 `src/features/ledger/components/AllowanceDialog.tsx`**

```tsx
'use client';

import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import MoneyInput from '@/components/ui/MoneyInput';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import { fmtCurrency } from '@/lib/utils';
import { useState } from 'react';
import type { AllowanceRecord, SalesRow } from '../types';

interface AllowanceDialogProps {
  open: boolean;
  onClose: () => void;
  row: SalesRow | null;
  onSubmit: (rowId: string, record: AllowanceRecord) => void;
}

/** 帳簿列的民國年日期字串（如 "115/03/26"）→ JS Date，供 DatePicker 預設值使用 */
function parseRowDate(date: string): Date {
  const [year, month, day] = date.split('/').map(Number);
  return new Date((year || 0) + 1911, (month || 1) - 1, day || 1);
}

/** Date → 民國年日期字串（如 "115/03/26"），對齊列表資料的日期格式 */
function formatRocDate(date: Date): string {
  const year = date.getFullYear() - 1911;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

export default function AllowanceDialog({ open, onClose, row, onSubmit }: AllowanceDialogProps) {
  if (!open || !row) return null;
  return <AllowanceDialogContent row={row} onClose={onClose} onSubmit={onSubmit} />;
}

/** row 切換時透過外層 open/row 判斷重新掛載，確保表單狀態每次以該筆交易的資料重新初始化 */
function AllowanceDialogContent({
  row,
  onClose,
  onSubmit,
}: {
  row: SalesRow;
  onClose: () => void;
  onSubmit: (rowId: string, record: AllowanceRecord) => void;
}) {
  const [date, setDate] = useState<Date | undefined>(parseRowDate(row.date));
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    onSubmit(row.id, {
      id: `ALW-${row.id}-${Date.now()}`,
      date: date ? formatRocDate(date) : row.date,
      amount,
      note,
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={`折讓 — ${row.id}`} widthClassName="max-w-[480px]">
      <div className="flex flex-col gap-4">
        <div>
          <span className="mb-2 block text-sm font-semibold text-neutral-dark">折讓歷史紀錄</span>
          {row.allowances.length === 0 ? (
            <div className="rounded-md bg-surface-cream p-4 text-center text-sm text-neutral-mid">尚無折讓紀錄</div>
          ) : (
            <div className="flex flex-col gap-2 rounded-md border border-neutral-blue-gray/30 p-3">
              {row.allowances.map(record => (
                <div key={record.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-mono text-neutral-mid">{record.date}</span>
                  <span className="flex-1 truncate text-neutral-dark">{record.note}</span>
                  <span className="font-mono font-semibold tabular-nums text-neutral-dark">{fmtCurrency(record.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-neutral-blue-gray/20 pt-4">
          <span className="mb-3 block text-sm font-semibold text-neutral-dark">新增折讓</span>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">折讓日期</label>
              <DatePicker value={date} onChange={setDate} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-neutral-dark">折讓金額</span>
              <MoneyInput widthClassName="w-36" value={amount} onChange={setAmount} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">說明</label>
              <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="請輸入折讓原因" rows={3} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="danger" onClick={onClose}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          新增折讓
        </Button>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: 型別檢查**

Run: `npx tsc --noEmit`
Expected: 無錯誤（`AllowanceDialog.tsx` 尚未被任何檔案引用，屬正常，不影響型別檢查結果）

- [ ] **Step 3: Commit**

```bash
git add src/features/ledger/components/AllowanceDialog.tsx
git commit -m "$(cat <<'EOF'
feat(ledger): add AllowanceDialog component

History list + new-entry form for a sales row's allowance records,
styled after the existing ManualEntryDialog.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 新增作廢確認彈窗（VoidConfirmDialog）

**Files:**
- Create: `src/features/ledger/components/VoidConfirmDialog.tsx`

**Interfaces:**
- Consumes: `@/components/ui/Button`、`@/components/ui/Modal`；`@/lib/utils` 的 `fmtCurrency`
- Produces: `VoidConfirmDialog({ open: boolean, onClose: () => void, onConfirm: () => void, transactionId: string, amount: number })` — Task 4、5、6 會 import 使用

- [ ] **Step 1: 建立 `src/features/ledger/components/VoidConfirmDialog.tsx`**

```tsx
'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { fmtCurrency } from '@/lib/utils';

interface VoidConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transactionId: string;
  amount: number;
}

export default function VoidConfirmDialog({ open, onClose, onConfirm, transactionId, amount }: VoidConfirmDialogProps) {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="作廢交易" widthClassName="max-w-[400px]">
      <p className="text-sm leading-relaxed text-neutral-dark">
        確定要作廢交易 <span className="font-mono font-semibold">{transactionId}</span>
        （金額 <span className="font-mono font-semibold">{fmtCurrency(amount)}</span>）嗎？此動作無法復原。
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button variant="danger" onClick={handleConfirm}>
          確定作廢
        </Button>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: 型別檢查**

Run: `npx tsc --noEmit`
Expected: 無錯誤

- [ ] **Step 3: Commit**

```bash
git add src/features/ledger/components/VoidConfirmDialog.tsx
git commit -m "$(cat <<'EOF'
feat(ledger): add VoidConfirmDialog component

Shared confirm dialog for voiding a transaction, reused across the
ledger table, cards, and transaction detail views.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: 串接 `LedgerTable.tsx`

**Files:**
- Modify: `src/features/ledger/components/LedgerTable.tsx`

**Interfaces:**
- Consumes: `./AllowanceDialog`（Task 2）、`./VoidConfirmDialog`（Task 3）、`../types` 的
  `AllowanceRecord`（Task 1）
- Produces: 無新對外介面（頁面內部行為變更）

- [ ] **Step 1: 更新 import**

把：

```tsx
import { fmtCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';
import { EXPENSE_CATEGORIES, PROJECT_NAMES, SALES_CHANNELS } from '../data';
import type { PurchaseRow, PurchaseSubTab, SalesRow, SalesSubTab } from '../types';
import AddChannelDialog from './AddChannelDialog';
import ManualEntryDialog from './ManualEntryDialog';
```

改成：

```tsx
import { fmtCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';
import { EXPENSE_CATEGORIES, PROJECT_NAMES, SALES_CHANNELS } from '../data';
import type { AllowanceRecord, PurchaseRow, PurchaseSubTab, SalesRow, SalesSubTab } from '../types';
import AddChannelDialog from './AddChannelDialog';
import AllowanceDialog from './AllowanceDialog';
import ManualEntryDialog from './ManualEntryDialog';
import VoidConfirmDialog from './VoidConfirmDialog';
```

- [ ] **Step 2: 新增 local state**

把：

```tsx
  const [manualEntryRow, setManualEntryRow] = useState<SalesRow | null>(null);
  const toggleExpand = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));
```

改成：

```tsx
  const [manualEntryRow, setManualEntryRow] = useState<SalesRow | null>(null);
  const [allowanceRow, setAllowanceRow] = useState<SalesRow | null>(null);
  const [voidRow, setVoidRow] = useState<SalesRow | null>(null);
  const [allowanceOverrides, setAllowanceOverrides] = useState<Record<string, AllowanceRecord[]>>({});
  const [voidedOverrides, setVoidedOverrides] = useState<Record<string, boolean>>({});
  const allowanceCountFor = (rowId: string, base: number) => base + (allowanceOverrides[rowId]?.length ?? 0);
  const toggleExpand = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));
```

- [ ] **Step 3: 新增送出處理函式，並組合彈窗要顯示的合併資料**

把：

```tsx
  const handleChannelCreated = (name: string) => {
    setChannels(c => [...c, name]);
    if (addChannelRowId) setChannelOverrides(o => ({ ...o, [addChannelRowId]: name }));
    setAddChannelRowId(null);
  };

  const dialogs = (
    <>
      <AddChannelDialog open={addChannelRowId !== null} onClose={() => setAddChannelRowId(null)} onSubmit={handleChannelCreated} />
      <ManualEntryDialog
        open={manualEntryRow !== null}
        onClose={() => setManualEntryRow(null)}
        row={manualEntryRow}
        onSubmit={() => setManualEntryRow(null)}
      />
    </>
  );
```

改成：

```tsx
  const handleChannelCreated = (name: string) => {
    setChannels(c => [...c, name]);
    if (addChannelRowId) setChannelOverrides(o => ({ ...o, [addChannelRowId]: name }));
    setAddChannelRowId(null);
  };
  const handleAllowanceSubmit = (rowId: string, record: AllowanceRecord) => {
    setAllowanceOverrides(o => ({ ...o, [rowId]: [...(o[rowId] ?? []), record] }));
  };
  const handleVoidConfirm = (rowId: string) => {
    setVoidedOverrides(o => ({ ...o, [rowId]: true }));
  };

  const mergedAllowanceRow: SalesRow | null = allowanceRow
    ? { ...allowanceRow, allowances: [...allowanceRow.allowances, ...(allowanceOverrides[allowanceRow.id] ?? [])] }
    : null;

  const dialogs = (
    <>
      <AddChannelDialog open={addChannelRowId !== null} onClose={() => setAddChannelRowId(null)} onSubmit={handleChannelCreated} />
      <ManualEntryDialog
        open={manualEntryRow !== null}
        onClose={() => setManualEntryRow(null)}
        row={manualEntryRow}
        onSubmit={() => setManualEntryRow(null)}
      />
      <AllowanceDialog open={allowanceRow !== null} onClose={() => setAllowanceRow(null)} row={mergedAllowanceRow} onSubmit={handleAllowanceSubmit} />
      {voidRow && (
        <VoidConfirmDialog
          open
          onClose={() => setVoidRow(null)}
          onConfirm={() => handleVoidConfirm(voidRow.id)}
          transactionId={voidRow.id}
          amount={voidRow.amount}
        />
      )}
    </>
  );
```

- [ ] **Step 4: 按鈕接上彈窗與 override 狀態**

把：

```tsx
                  <td className={`${tdClass} text-right`}>
                    <div className="flex justify-end gap-1.5">
                      {subTab === 'receivable' && (
                        <Button size="sm" variant="outline" icon={DollarSign} className="w-[104px]" onClick={() => setManualEntryRow(row)}>
                          手動入帳
                        </Button>
                      )}
                      {row.voided ? (
                        <Button size="sm" variant="ghost" disabled icon={CircleX} className="w-[84px]">
                          已作廢
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" icon={CircleX} className="w-[84px]">
                          作廢
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" icon={FileMinus} className="w-[104px]">
                        {row.allowanceCount > 0 ? `折讓 (${row.allowanceCount})` : '折讓'}
                      </Button>
                    </div>
                  </td>
```

改成：

```tsx
                  <td className={`${tdClass} text-right`}>
                    <div className="flex justify-end gap-1.5">
                      {subTab === 'receivable' && (
                        <Button size="sm" variant="outline" icon={DollarSign} className="w-[104px]" onClick={() => setManualEntryRow(row)}>
                          手動入帳
                        </Button>
                      )}
                      {row.voided || voidedOverrides[row.id] ? (
                        <Button size="sm" variant="ghost" disabled icon={CircleX} className="w-[84px]">
                          已作廢
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" icon={CircleX} className="w-[84px]" onClick={() => setVoidRow(row)}>
                          作廢
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" icon={FileMinus} className="w-[104px]" onClick={() => setAllowanceRow(row)}>
                        {allowanceCountFor(row.id, row.allowances.length) > 0
                          ? `折讓 (${allowanceCountFor(row.id, row.allowances.length)})`
                          : '折讓'}
                      </Button>
                    </div>
                  </td>
```

- [ ] **Step 5: 型別檢查**

Run: `npx tsc --noEmit`
Expected: 無錯誤

- [ ] **Step 6: Commit**

```bash
git add src/features/ledger/components/LedgerTable.tsx
git commit -m "$(cat <<'EOF'
feat(ledger): wire up allowance/void dialogs in LedgerTable

作廢 now opens a confirmation dialog and locally marks the row voided
on confirm; 折讓 opens the allowance history/new-entry dialog and its
button count reflects newly added records.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: 串接 `LedgerCards.tsx`（含補上手機版缺少的「折讓」按鈕）

**Files:**
- Modify: `src/features/ledger/components/LedgerCards.tsx`

**Interfaces:**
- Consumes: `./AllowanceDialog`（Task 2）、`./VoidConfirmDialog`（Task 3）、`../types` 的
  `AllowanceRecord`（Task 1）
- Produces: `SalesCard` 新增 props `isVoided: boolean`、`onVoid: () => void`、
  `allowanceCount: number`、`onAllowance: () => void`（僅本檔內部使用，不對外匯出）

- [ ] **Step 1: 更新 import**

把：

```tsx
import ExportRangeDialog from '@/components/ui/ExportRangeDialog';
import { fmtCurrency } from '@/lib/utils';
import { ChevronDown, ChevronRight, CircleX, DollarSign, Download, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { EXPENSE_CATEGORIES, PROJECT_NAMES, SALES_CHANNELS } from '../data';
import type { PurchaseRow, PurchaseSubTab, SalesRow, SalesSubTab } from '../types';
import { useLongPress } from '../useLongPress';
import AddChannelDialog from './AddChannelDialog';
import ManualEntryDialog from './ManualEntryDialog';
```

改成：

```tsx
import ExportRangeDialog from '@/components/ui/ExportRangeDialog';
import { fmtCurrency } from '@/lib/utils';
import { ChevronDown, ChevronRight, CircleX, DollarSign, Download, FileMinus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { EXPENSE_CATEGORIES, PROJECT_NAMES, SALES_CHANNELS } from '../data';
import type { AllowanceRecord, PurchaseRow, PurchaseSubTab, SalesRow, SalesSubTab } from '../types';
import { useLongPress } from '../useLongPress';
import AddChannelDialog from './AddChannelDialog';
import AllowanceDialog from './AllowanceDialog';
import ManualEntryDialog from './ManualEntryDialog';
import VoidConfirmDialog from './VoidConfirmDialog';
```

- [ ] **Step 2: `SalesCard` 新增 props 並補上折讓按鈕、接上作廢**

把：

```tsx
function SalesCard({
  row,
  subTab,
  expanded,
  onToggle,
  channels,
  channelValue,
  onChannelSelect,
  onManualEntry,
  onCardClick,
  selectionMode,
  isSelected,
  onSelectToggle,
  onLongPressStart,
}: {
  row: SalesRow;
  subTab: SalesSubTab;
  expanded: boolean;
  onToggle: () => void;
  channels: string[];
  channelValue: string;
  onChannelSelect: (value: string) => void;
  onManualEntry: () => void;
  onCardClick: () => void;
  selectionMode: boolean;
  isSelected: boolean;
  onSelectToggle: () => void;
  onLongPressStart: (id: string) => void;
}) {
```

改成：

```tsx
function SalesCard({
  row,
  subTab,
  expanded,
  onToggle,
  channels,
  channelValue,
  onChannelSelect,
  onManualEntry,
  onCardClick,
  selectionMode,
  isSelected,
  onSelectToggle,
  onLongPressStart,
  isVoided,
  onVoid,
  allowanceCount,
  onAllowance,
}: {
  row: SalesRow;
  subTab: SalesSubTab;
  expanded: boolean;
  onToggle: () => void;
  channels: string[];
  channelValue: string;
  onChannelSelect: (value: string) => void;
  onManualEntry: () => void;
  onCardClick: () => void;
  selectionMode: boolean;
  isSelected: boolean;
  onSelectToggle: () => void;
  onLongPressStart: (id: string) => void;
  isVoided: boolean;
  onVoid: () => void;
  allowanceCount: number;
  onAllowance: () => void;
}) {
```

把：

```tsx
        {!selectionMode && (
          <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
            {subTab === 'receivable' && (
              <Button size="sm" variant="outline" icon={DollarSign} onClick={onManualEntry}>
                入帳
              </Button>
            )}
            {row.voided ? (
              <span className="rounded-md bg-surface-cream px-2.5 py-1 text-xs font-semibold text-neutral-mid">已作廢</span>
            ) : (
              <Button size="sm" variant="ghost" icon={CircleX}>
                作廢
              </Button>
            )}
          </div>
        )}
```

改成：

```tsx
        {!selectionMode && (
          <div className="flex flex-wrap justify-end gap-1.5" onClick={e => e.stopPropagation()}>
            {subTab === 'receivable' && (
              <Button size="sm" variant="outline" icon={DollarSign} onClick={onManualEntry}>
                入帳
              </Button>
            )}
            {isVoided ? (
              <span className="rounded-md bg-surface-cream px-2.5 py-1 text-xs font-semibold text-neutral-mid">已作廢</span>
            ) : (
              <Button size="sm" variant="ghost" icon={CircleX} onClick={onVoid}>
                作廢
              </Button>
            )}
            <Button size="sm" variant="ghost" icon={FileMinus} onClick={onAllowance}>
              {allowanceCount > 0 ? `折讓 (${allowanceCount})` : '折讓'}
            </Button>
          </div>
        )}
```

- [ ] **Step 3: `LedgerCards` 主元件新增 local state 與送出處理**

把：

```tsx
  const [manualEntryRow, setManualEntryRow] = useState<SalesRow | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
```

改成：

```tsx
  const [manualEntryRow, setManualEntryRow] = useState<SalesRow | null>(null);
  const [allowanceRow, setAllowanceRow] = useState<SalesRow | null>(null);
  const [voidRow, setVoidRow] = useState<SalesRow | null>(null);
  const [allowanceOverrides, setAllowanceOverrides] = useState<Record<string, AllowanceRecord[]>>({});
  const [voidedOverrides, setVoidedOverrides] = useState<Record<string, boolean>>({});
  const allowanceCountFor = (rowId: string, base: number) => base + (allowanceOverrides[rowId]?.length ?? 0);
  const [selectionMode, setSelectionMode] = useState(false);
```

把：

```tsx
  const handleChannelCreated = (name: string) => {
    setChannels(c => [...c, name]);
    if (addChannelRowId) setChannelOverrides(o => ({ ...o, [addChannelRowId]: name }));
    setAddChannelRowId(null);
  };
```

改成：

```tsx
  const handleChannelCreated = (name: string) => {
    setChannels(c => [...c, name]);
    if (addChannelRowId) setChannelOverrides(o => ({ ...o, [addChannelRowId]: name }));
    setAddChannelRowId(null);
  };
  const handleAllowanceSubmit = (rowId: string, record: AllowanceRecord) => {
    setAllowanceOverrides(o => ({ ...o, [rowId]: [...(o[rowId] ?? []), record] }));
  };
  const handleVoidConfirm = (rowId: string) => {
    setVoidedOverrides(o => ({ ...o, [rowId]: true }));
  };
```

- [ ] **Step 4: 掛載彈窗、傳入 `SalesCard` 新 props**

把：

```tsx
      <AddChannelDialog open={addChannelRowId !== null} onClose={() => setAddChannelRowId(null)} onSubmit={handleChannelCreated} />
      <ManualEntryDialog
        open={manualEntryRow !== null}
        onClose={() => setManualEntryRow(null)}
        row={manualEntryRow}
        onSubmit={() => setManualEntryRow(null)}
      />
      <ExportRangeDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} onExport={() => setExportDialogOpen(false)} />
```

改成：

```tsx
      <AddChannelDialog open={addChannelRowId !== null} onClose={() => setAddChannelRowId(null)} onSubmit={handleChannelCreated} />
      <ManualEntryDialog
        open={manualEntryRow !== null}
        onClose={() => setManualEntryRow(null)}
        row={manualEntryRow}
        onSubmit={() => setManualEntryRow(null)}
      />
      <ExportRangeDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} onExport={() => setExportDialogOpen(false)} />
      <AllowanceDialog
        open={allowanceRow !== null}
        onClose={() => setAllowanceRow(null)}
        row={
          allowanceRow
            ? { ...allowanceRow, allowances: [...allowanceRow.allowances, ...(allowanceOverrides[allowanceRow.id] ?? [])] }
            : null
        }
        onSubmit={handleAllowanceSubmit}
      />
      {voidRow && (
        <VoidConfirmDialog
          open
          onClose={() => setVoidRow(null)}
          onConfirm={() => handleVoidConfirm(voidRow.id)}
          transactionId={voidRow.id}
          amount={voidRow.amount}
        />
      )}
```

把：

```tsx
      {props.side === 'sales'
        ? props.rows.map(row => (
            <SalesCard
              key={row.id}
              row={row}
              subTab={props.subTab}
              expanded={!!expanded[row.id]}
              onToggle={() => toggleExpand(row.id)}
              channels={channels}
              channelValue={channelOverrides[row.id] ?? row.channel}
              onChannelSelect={v => handleChannelSelect(row.id, v)}
              onManualEntry={() => setManualEntryRow(row)}
              onCardClick={() => goToTransaction(row.id)}
              selectionMode={selectionMode}
              isSelected={!!selected[row.id]}
              onSelectToggle={() => toggleSelect(row.id)}
              onLongPressStart={enterSelectionMode}
            />
          ))
```

改成：

```tsx
      {props.side === 'sales'
        ? props.rows.map(row => (
            <SalesCard
              key={row.id}
              row={row}
              subTab={props.subTab}
              expanded={!!expanded[row.id]}
              onToggle={() => toggleExpand(row.id)}
              channels={channels}
              channelValue={channelOverrides[row.id] ?? row.channel}
              onChannelSelect={v => handleChannelSelect(row.id, v)}
              onManualEntry={() => setManualEntryRow(row)}
              onCardClick={() => goToTransaction(row.id)}
              selectionMode={selectionMode}
              isSelected={!!selected[row.id]}
              onSelectToggle={() => toggleSelect(row.id)}
              onLongPressStart={enterSelectionMode}
              isVoided={row.voided || !!voidedOverrides[row.id]}
              onVoid={() => setVoidRow(row)}
              allowanceCount={allowanceCountFor(row.id, row.allowances.length)}
              onAllowance={() => setAllowanceRow(row)}
            />
          ))
```

- [ ] **Step 5: 型別檢查**

Run: `npx tsc --noEmit`
Expected: 無錯誤

- [ ] **Step 6: Commit**

```bash
git add src/features/ledger/components/LedgerCards.tsx
git commit -m "$(cat <<'EOF'
feat(ledger): wire up allowance/void dialogs in LedgerCards

Mirrors the LedgerTable wiring and adds the 折讓 button that was
missing from the mobile card view, bringing it to parity with the
desktop table.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: 串接 `TransactionFormView.tsx`

**Files:**
- Modify: `src/features/ledger/transaction/TransactionFormView.tsx`

**Interfaces:**
- Consumes: `../components/VoidConfirmDialog`（Task 3）
- Produces: 無新對外介面（頁面內部行為變更）

- [ ] **Step 1: 更新 import**

把：

```tsx
import Button from '@/components/ui/Button';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Side } from '../types';
import TransactionAmountCard from './components/TransactionAmountCard';
```

改成：

```tsx
import Button from '@/components/ui/Button';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import VoidConfirmDialog from '../components/VoidConfirmDialog';
import type { Side } from '../types';
import TransactionAmountCard from './components/TransactionAmountCard';
```

- [ ] **Step 2: 新增 state 並計算金額**

把：

```tsx
export default function TransactionFormView({ mode, side, transactionId }: TransactionFormViewProps) {
  const router = useRouter();
  const [form, setForm] = useState<TransactionFormState>(() => initialForm(mode, side, transactionId));

  const handleChange = (patch: Partial<TransactionFormState>) => setForm(f => ({ ...f, ...patch }));
  const handleFileChange = (fileName: string, previewUrl: string) =>
    handleChange({ voucherFileName: fileName, voucherPreviewUrl: previewUrl });

  const handleSideChange = (next: Side) => router.push(`/ledger/new?side=${next}`);

  // 視覺模擬：建立/更新/作廢/刪除皆不接後端，一律返回帳簿
  const backToLedger = () => router.push('/ledger');
```

改成：

```tsx
export default function TransactionFormView({ mode, side, transactionId }: TransactionFormViewProps) {
  const router = useRouter();
  const [form, setForm] = useState<TransactionFormState>(() => initialForm(mode, side, transactionId));
  const [voidConfirmOpen, setVoidConfirmOpen] = useState(false);

  const handleChange = (patch: Partial<TransactionFormState>) => setForm(f => ({ ...f, ...patch }));
  const handleFileChange = (fileName: string, previewUrl: string) =>
    handleChange({ voucherFileName: fileName, voucherPreviewUrl: previewUrl });

  const handleSideChange = (next: Side) => router.push(`/ledger/new?side=${next}`);

  // 視覺模擬：建立/更新/作廢/刪除皆不接後端，一律返回帳簿
  const backToLedger = () => router.push('/ledger');
  const totalAmount = form.salesAmount + form.taxAmount;
```

- [ ] **Step 3: 銷項作廢按鈕改為開啟確認彈窗，並掛載彈窗**

把：

```tsx
              {mode === 'edit' && (
                <>
                  <Button variant="danger" className="flex-1 nav:flex-none" onClick={backToLedger}>
                    {side === 'sales' ? '作廢' : '刪除'}
                  </Button>
                  <Button variant="primary" className="flex-1 nav:flex-none" onClick={backToLedger}>
                    更新
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

改成：

```tsx
              {mode === 'edit' && (
                <>
                  <Button
                    variant="danger"
                    className="flex-1 nav:flex-none"
                    onClick={side === 'sales' ? () => setVoidConfirmOpen(true) : backToLedger}
                  >
                    {side === 'sales' ? '作廢' : '刪除'}
                  </Button>
                  <Button variant="primary" className="flex-1 nav:flex-none" onClick={backToLedger}>
                    更新
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {mode === 'edit' && side === 'sales' && (
        <VoidConfirmDialog
          open={voidConfirmOpen}
          onClose={() => setVoidConfirmOpen(false)}
          onConfirm={backToLedger}
          transactionId={form.invoiceNumber}
          amount={totalAmount}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: 型別檢查**

Run: `npx tsc --noEmit`
Expected: 無錯誤

- [ ] **Step 5: Commit**

```bash
git add src/features/ledger/transaction/TransactionFormView.tsx
git commit -m "$(cat <<'EOF'
feat(ledger): confirm before voiding a sales transaction in detail view

The purchase-side 刪除 button keeps navigating straight back to the
ledger (out of scope for this change).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: 全頁驗收 + build

**Files:**
- 無新增/修改檔案（純驗證）

**Interfaces:**
- Consumes: Task 1–6 的全部變更
- Produces: 無

- [ ] **Step 1: 型別檢查與 build**

Run: `npx tsc --noEmit && npm run build`
Expected: 型別檢查與 build 皆無錯誤（`npm run build` 會連 ESLint 一併跑過，需一併確認無報錯）

- [ ] **Step 2: 啟動 dev server 手動驗收**

Run: `npm run dev`（背景執行），瀏覽器開啟 `http://localhost:3000/ledger`（若 3000 被占用則看終端機
輸出實際 port）

驗收清單（桌面寬度 >1000px 與手機寬度 <1000px 各測一次，兩者共用下列邏輯）：

- 「銷項」→「已收款」分頁，找到交易編號 `UA40435903`（該筆有 3 筆假折讓資料）：
  - 點擊「折讓 (3)」按鈕，彈窗顯示標題「折讓 — UA40435903」，歷史清單顯示 3 筆紀錄（日期/說明/金額）
  - 填入折讓日期、金額、說明後點「新增折讓」，彈窗關閉，按鈕文字變成「折讓 (4)」；再次點開，歷史
    清單顯示剛新增的第 4 筆
  - 點「取消」關閉彈窗，不影響按鈕數字
- 找到任一 `allowances` 為空的交易（如 `UA40435900`）：
  - 「折讓」按鈕不帶數字；點擊後彈窗歷史區顯示「尚無折讓紀錄」
- 找到任一未作廢的交易，點擊「作廢」按鈕：
  - 彈窗顯示「確定要作廢交易 {編號}（金額 ${金額}）嗎？此動作無法復原。」
  - 點「取消」：彈窗關閉，該列按鈕仍是「作廢」
  - 重新點擊「作廢」→「確定作廢」：彈窗關閉，該列按鈕變成灰底不可點的「已作廢」
- 手機寬度（<1000px，卡片版）：確認每張銷項卡片同時看得到「作廢」與「折讓」兩顆按鈕（原本卡片版
  沒有「折讓」按鈕，本次已補上），且窄螢幕下按鈕會換行、不會被截斷或橫向溢出
- 點進任一銷項交易細節頁（`/ledger/[id]?side=sales`，編輯模式）：
  - 點擊「作廢」按鈕彈出確認彈窗（文案含該筆發票號碼與金額），點「確定作廢」後導回 `/ledger`
  - 點「取消」則留在原頁面，表單資料不變
- 進項（採購）交易細節頁的「刪除」按鈕維持原行為（點擊後直接導回 `/ledger`，不彈出確認視窗）
- 瀏覽器 console 沒有出現 React/Next.js 錯誤或警告

Expected: 以上皆通過。若有任何一項不符，回頭修正對應 Task 的檔案後重新驗收（修正後記得依 Task 內的
Commit 步驟另外提交，不要合併進已完成 Task 的 commit）。

---

## Self-Review 紀錄

- **Spec coverage**：spec 的資料模型調整（Task 1）、`AllowanceDialog`（Task 2）、
  `VoidConfirmDialog`（Task 3）、`LedgerTable.tsx` 串接（Task 4）、`LedgerCards.tsx` 串接含補上
  缺少的折讓按鈕（Task 5）、`TransactionFormView.tsx` 銷項作廢確認（Task 6）皆已對應到任務，
  「不在範圍內」列出的項目（不接後端、不動 `children`、不處理進項作廢/刪除、折讓金額不做業務驗證）
  在對應任務中也都明確標註，無遺漏。
- **Placeholder scan**：所有步驟皆為完整程式碼與精確的字串比對，無 TBD/TODO。
- **Type consistency**：`AllowanceRecord` 欄位（`id`/`date`/`amount`/`note`）在 Task 1 定義後，
  Task 2（`AllowanceDialog`）、Task 4（`LedgerTable`）、Task 5（`LedgerCards`）皆使用相同欄位名稱。
  `VoidConfirmDialog` 的 props（`open`/`onClose`/`onConfirm`/`transactionId`/`amount`）在 Task 3
  定義後，Task 4、5、6 呼叫端皆對應一致。`SalesRow.allowances` 命名在 Task 1 改名後，Task 4、5 的
  所有讀取點（含 `row.allowanceCount` 舊寫法）皆已同步替換，無殘留。
