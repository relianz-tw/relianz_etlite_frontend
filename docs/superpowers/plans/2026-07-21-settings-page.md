# 設定頁面（Settings）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 `/settings` 設定頁面，包含 6 個純視覺模擬分頁（依現有截圖）與 1 個具真實本地互動邏輯的
新分類「收款設定」（銀行帳戶管理 + 重用帳簿現有的「新增銷售管道」對話框）。

**Architecture:** 比照 `src/features/ledger/` 既有結構，新增 `src/features/settings/`：
`SettingsView.tsx` 做頁籤導覽（桌面用 `SegmentedControl`、手機用 `Select` 下拉），依選取分頁渲染
`components/` 下對應的分頁元件；假資料集中於 `data.ts`。另外新增共用 `Badge` 基礎元件於
`src/components/ui/`，並同步擴充 `DESIGN.md`。

**Tech Stack:** Next.js 14 App Router、React 18、TypeScript strict、Tailwind CSS（既有 design token）、
lucide-react 圖示。專案沒有安裝任何測試框架（無 jest/vitest），驗證方式沿用專案既有慣例：
`npx tsc --noEmit` 做型別檢查、`npm run dev` 啟動後以瀏覽器手動檢查畫面。

## Global Constraints

- 語言規範：Claude 回應與程式碼註解中文優先，變數/函式命名英文，使用者可見文字（按鈕、標題、提示）繁體中文
- 路徑別名一律用 `@/*`（對應 `src/*`），不得用相對路徑跨 feature 引用（唯一例外：本計畫明確允許
  `src/features/settings/**` 直接 import `src/features/ledger/components/AddChannelDialog` 與
  `src/features/ledger/data` 的 `SALES_CHANNELS`，此為 spec 中已確認的跨 feature 重用）
- 圖示一律用 `lucide-react`，不得手刻 inline SVG 或使用其他圖示庫
- 畫面上不得出現 emoji
- 顏色/間距/圓角一律使用 `tailwind.config.js` 既有 token（`brand-blue`、`brand-tan`、`semantic-success`、
  `semantic-error`、`neutral-dark`、`neutral-mid`、`neutral-blue-gray`、`surface-off-white`、
  `surface-cream` 等），禁止新增自訂 hex 色碼
- 響應式斷點只用既有的 `nav: 1000px`（`tailwind.config.js` 的 `screens.nav`），不得引入其他斷點
- 6 個純視覺模擬分頁（基本設定/標籤與專案/發票簿/方案細節/帳單/營業狀態紀錄）：卡片上的操作按鈕
  一律不掛 `onClick`（純視覺，維持 Server Component，不加 `'use client'`）
- 「收款設定」分頁（`PaymentSettingsTab`、`BankAccountCard`）與 `SettingsView` 需要 `useState`，
  檔案開頭需加 `'use client'`
- 本專案目前**不是** git repository（`git status` 回傳 `fatal: not a git repository`），所以本計畫
  的每個 Task 皆**不包含 git commit 步驟**；若之後專案改為 git 管理，再自行補上 commit

---

## 檔案總覽

| 檔案 | 說明 |
|---|---|
| `src/components/ui/Badge.tsx` | 新增：狀態徽章基礎元件 |
| `DESIGN.md` | 修改：新增「Status Badge」規格小節 |
| `src/features/settings/types.ts` | 新增：`SettingsTab` 型別 |
| `src/features/settings/data.ts` | 新增：所有分頁假資料 + `BankAccountRecord` 型別 |
| `src/features/settings/components/BasicInfoTab.tsx` | 新增：基本設定分頁 |
| `src/features/settings/components/TagsProjectsTab.tsx` | 新增：標籤與專案分頁 |
| `src/features/settings/components/InvoiceBookTab.tsx` | 新增：發票簿分頁 |
| `src/features/settings/components/PlanDetailTab.tsx` | 新增：方案細節分頁 |
| `src/features/settings/components/BillingTab.tsx` | 新增：帳單分頁 |
| `src/features/settings/components/OperatingStatusTab.tsx` | 新增：營業狀態紀錄分頁 |
| `src/features/settings/components/BankAccountCard.tsx` | 新增：單一銀行帳戶卡片（檢視/編輯） |
| `src/features/settings/components/PaymentSettingsTab.tsx` | 新增：收款設定分頁 |
| `src/features/settings/SettingsView.tsx` | 新增：頁籤導覽 + 分頁切換 |
| `src/app/settings/page.tsx` | 新增：`/settings` 路由 |

---

### Task 1: 新增 Badge 元件 + 擴充 DESIGN.md

**Files:**
- Create: `src/components/ui/Badge.tsx`
- Modify: `DESIGN.md`

**Interfaces:**
- Produces: `Badge({ tone: 'success' | 'error' | 'info' | 'neutral', variant?: 'solid' | 'muted', className?: string, children: ReactNode })` — 後續所有分頁元件皆會 import 使用

- [ ] **Step 1: 建立 `src/components/ui/Badge.tsx`**

```tsx
import type { ReactNode } from 'react';

type BadgeTone = 'success' | 'error' | 'info' | 'neutral';
type BadgeVariant = 'solid' | 'muted';

interface BadgeProps {
  tone: BadgeTone;
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}

const TONE_CLASS: Record<BadgeVariant, Record<BadgeTone, string>> = {
  solid: {
    success: 'bg-semantic-success text-white',
    error: 'bg-semantic-error text-white',
    info: 'bg-brand-blue text-white',
    neutral: 'bg-neutral-mid text-white',
  },
  muted: {
    success: 'bg-semantic-success-muted text-semantic-success-dark',
    error: 'bg-semantic-error/10 text-semantic-error',
    info: 'bg-brand-blue/10 text-brand-blue',
    neutral: 'bg-surface-cream text-neutral-mid',
  },
};

export default function Badge({ tone, variant = 'muted', className = '', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold ${TONE_CLASS[variant][tone]} ${className}`}>
      {children}
    </span>
  );
}
```

- [ ] **Step 2: 在 `DESIGN.md` 的「## 4. Component Stylings」新增「Status Badge」小節**

在 `### Navigation` 區塊（結尾為 `Background: #FFFFFF with 1px bottom border #EAE5E3` 的程式碼框）
之後、下一個 `---` 分隔線之前，插入以下內容：

```markdown
### Status Badge

用於顯示狀態徽章（如：已完成、成功、開業/停業/復業）。對應元件：`src/components/ui/Badge.tsx`。

```
Variant: solid（純色底 + 白字，用於強調中的當前狀態）
  success → bg #377456, text #FFFFFF
  error   → bg #DD6B5F, text #FFFFFF
  info    → bg #005FA2, text #FFFFFF
  neutral → bg #797C80, text #FFFFFF

Variant: muted（淺底 + 深色字，用於次要/列表中的狀態標示，預設）
  success → bg #CAD6BC, text #2D6347
  error   → bg rgba(221,107,95,0.1), text #DD6B5F
  info    → bg rgba(0,95,162,0.1), text #005FA2
  neutral → bg #EAE5E3, text #797C80

Border-radius: 4px
Padding: 2px 8px
Font: Noto Sans TC 12px, font-weight 600
```

色彩語意（與本文件「2. Color Palette & Roles」對應，優先於視覺草稿）：
- 成功／正面／已完成／開業 → success
- 錯誤／停業 → error
- 進行中狀態／復業 → info
```

- [ ] **Step 3: 型別檢查**

Run: `cd /Users/zhuangshuyuan/Desktop/easytax-lite && npx tsc --noEmit`
Expected: 無錯誤（`Badge.tsx` 目前未被任何檔案引用，屬正常，不影響型別檢查結果）

---

### Task 2: 新增 settings feature 的型別與假資料

**Files:**
- Create: `src/features/settings/types.ts`
- Create: `src/features/settings/data.ts`

**Interfaces:**
- Consumes: 無（純資料層，可獨立驗證）
- Produces:
  - `SettingsTab` 型別（`'basic' | 'tagsProjects' | 'invoiceBook' | 'planDetail' | 'billing' | 'operatingStatus' | 'paymentSettings'`）
  - `data.ts` 匯出：`BasicInfoField`、`BASIC_INFO_FIELDS`、`BASIC_INFO_ZIP`、`BASIC_INFO_ADDRESS`、
    `BASIC_INFO_LABOR_RISK`、`BASIC_INFO_CONTACT`、`BASIC_INFO_EMAIL`、`ProjectRecord`、
    `SETTINGS_PROJECTS`、`TagRecord`、`SETTINGS_TAGS`、`InvoiceBookRecord`、`INVOICE_PERIOD_LABEL`、
    `HAND_INVOICE_BOOKS`、`PlanServiceItem`、`PLAN_QUANTITY_LABEL`、`PLAN_SERVICE_ITEMS`、
    `PLAN_PRICE`、`PLAN_NEXT_CHARGE_DATE`、`PLAN_CARD_LAST4`、`PLAN_CARD_EXPIRY`、`BillingRecord`、
    `BILLING_YEAR`、`BILLING_RECORDS`、`OperatingStatusRecord`、`CURRENT_OPERATING_STATUS`、
    `OPERATING_STATUS_RECORDS`、`BankAccountRecord`、`BANK_CODE_OPTIONS`、`SEED_BANK_ACCOUNTS`
  - 後續所有 Task 3–10 的分頁元件都會從 `../data` import 上述常數/型別

- [ ] **Step 1: 建立 `src/features/settings/types.ts`**

```ts
export type SettingsTab =
  | 'basic'
  | 'tagsProjects'
  | 'invoiceBook'
  | 'planDetail'
  | 'billing'
  | 'operatingStatus'
  | 'paymentSettings';
```

- [ ] **Step 2: 建立 `src/features/settings/data.ts`**

```ts
export interface BasicInfoField {
  label: string;
  value: string;
}

export const BASIC_INFO_FIELDS: BasicInfoField[] = [
  { label: '組織型態', value: '有限公司' },
  { label: '統一編號', value: '93790155' },
  { label: '稅籍編號', value: '323232332' },
  { label: '登記名稱', value: '測試有限公司' },
  { label: '負責人姓名', value: '彭建彰' },
  { label: '健保投保單位代號', value: '153959516' },
];

export const BASIC_INFO_ZIP = '114';
export const BASIC_INFO_ADDRESS = '臺北市內湖區瑞光路358巷30弄6號6樓';
export const BASIC_INFO_LABOR_RISK = '運輸輔助業（報關業及船務代理業、陸上運輸輔助業除外）、倉儲業（0.23%）';

export const BASIC_INFO_CONTACT: BasicInfoField[] = [
  { label: '聯絡人全名', value: '彭建彰' },
  { label: '聯絡人電話', value: '0900000000' },
];
export const BASIC_INFO_EMAIL = 'shuyuan.chuang@relianz.tw';

export interface ProjectRecord {
  id: string;
  name: string;
  status: '已完成' | '進行中';
  startDate: string;
  endDate: string;
}
export const SETTINGS_PROJECTS: ProjectRecord[] = [
  { id: 'p1', name: 'e', status: '已完成', startDate: '2026-03-05', endDate: '2026-03-20' },
  { id: 'p2', name: '測試', status: '已完成', startDate: '2025-12-02', endDate: '2026-01-02' },
];

export interface TagRecord {
  id: string;
  name: string;
}
export const SETTINGS_TAGS: TagRecord[] = [
  { id: 't1', name: '10-1鹿東國小-二校區' },
  { id: 't2', name: '10-B鹿東國小-二校區' },
  { id: 't3', name: '28-A湖西國小' },
];

export interface InvoiceBookRecord {
  id: string;
  name: string;
  trackCode: string;
  startNumber: string;
}
export const INVOICE_PERIOD_LABEL = '115 年 07 月 - 08 月';
export const HAND_INVOICE_BOOKS: InvoiceBookRecord[] = [
  { id: 'ib1', name: '三聯式手開', trackCode: 'CA', startNumber: '32323200' },
];

export interface PlanServiceItem {
  id: string;
  label: string;
}
export const PLAN_QUANTITY_LABEL = '每期 200 張';
export const PLAN_SERVICE_ITEMS: PlanServiceItem[] = [
  { id: 's1', label: '進銷帳管理' },
  { id: 's2', label: '線上稅務申報系統' },
  { id: 's3', label: '線上財務儀表板' },
  { id: 's4', label: '線上稅務小幫手' },
  { id: 's5', label: '每單月營業稅申報' },
  { id: 's6', label: '年度營利事業所得稅申報' },
  { id: 's7', label: '年度各類扣繳申報' },
  { id: 's8', label: '公司暫繳申報' },
];
export const PLAN_PRICE = 3000;
export const PLAN_NEXT_CHARGE_DATE = '2025/7/30';
export const PLAN_CARD_LAST4 = '1111';
export const PLAN_CARD_EXPIRY = '07/30';

export interface BillingRecord {
  id: string;
  month: string;
  amount: number;
  itemLabel: string;
  status: '成功' | '失敗';
  paidDate: string;
  invoiceNumber: string;
}
export const BILLING_YEAR = 2025;
export const BILLING_RECORDS: BillingRecord[] = [
  {
    id: 'b1',
    month: '6月',
    amount: 3000,
    itemLabel: 'EasyTax 簡易稅',
    status: '成功',
    paidDate: '2025/6/30',
    invoiceNumber: 'RELA20252700003',
  },
];

export interface OperatingStatusRecord {
  id: string;
  status: '開業' | '停業' | '復業';
  startDate: string;
  endDate: string;
}
export const CURRENT_OPERATING_STATUS: OperatingStatusRecord['status'] = '復業';
export const OPERATING_STATUS_RECORDS: OperatingStatusRecord[] = [
  { id: 'o1', status: '開業', startDate: '2026-07-01', endDate: '2026-07-16' },
  { id: 'o2', status: '停業', startDate: '2026-07-16', endDate: '2026-07-01' },
  { id: 'o3', status: '復業', startDate: '2026-08-01', endDate: '進行中' },
];

export interface BankAccountRecord {
  id: string;
  nickname: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  balance: number;
  updatedDate: string;
}

// 註：僅列常見銀行供下拉選單使用，非官方完整清單；正式清單需另外對照
// https://www.fisc.com.tw/TC/Download/atm.pdf
export const BANK_CODE_OPTIONS = [
  { code: '822', name: '中國信託' },
  { code: '013', name: '國泰世華' },
  { code: '004', name: '台灣銀行' },
  { code: '007', name: '第一銀行' },
  { code: '008', name: '華南銀行' },
  { code: '011', name: '上海商業儲蓄銀行' },
  { code: '012', name: '台北富邦' },
  { code: '017', name: '兆豐國際商業銀行' },
  { code: '050', name: '台灣中小企業銀行' },
  { code: '700', name: '中華郵政' },
  { code: '807', name: '永豐商業銀行' },
  { code: '808', name: '玉山商業銀行' },
  { code: '812', name: '台新國際商業銀行' },
];

export const SEED_BANK_ACCOUNTS: BankAccountRecord[] = [
  {
    id: 'acc1',
    nickname: '收款用中國信託港墅分行',
    bankCode: '822',
    bankName: '中國信託',
    accountNumber: '01256789012',
    balance: 3736519,
    updatedDate: '115/1/1',
  },
];
```

- [ ] **Step 3: 型別檢查**

Run: `cd /Users/zhuangshuyuan/Desktop/easytax-lite && npx tsc --noEmit`
Expected: 無錯誤

---

### Task 3: 基本設定分頁（BasicInfoTab）

**Files:**
- Create: `src/features/settings/components/BasicInfoTab.tsx`

**Interfaces:**
- Consumes: `data.ts` 的 `BASIC_INFO_FIELDS`、`BASIC_INFO_ZIP`、`BASIC_INFO_ADDRESS`、
  `BASIC_INFO_LABOR_RISK`、`BASIC_INFO_CONTACT`、`BASIC_INFO_EMAIL`；`@/components/ui/TextInput`
- Produces: `BasicInfoTab()`（無 props）— Task 11 的 `SettingsView` 會 import 並在 `activeTab === 'basic'` 時渲染

- [ ] **Step 1: 建立 `src/features/settings/components/BasicInfoTab.tsx`**

```tsx
import TextInput from '@/components/ui/TextInput';
import { KeyRound, Pencil } from 'lucide-react';
import {
  BASIC_INFO_ADDRESS,
  BASIC_INFO_CONTACT,
  BASIC_INFO_EMAIL,
  BASIC_INFO_FIELDS,
  BASIC_INFO_LABOR_RISK,
  BASIC_INFO_ZIP,
} from '../data';

export default function BasicInfoTab() {
  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-neutral-dark">基本資料</h2>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-brand-blue">
            <Pencil size={14} />
            編輯基本資料
          </span>
          <span className="flex items-center gap-1.5 text-brand-blue">
            <KeyRound size={14} />
            變更密碼
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-5 nav:grid-cols-2">
        {BASIC_INFO_FIELDS.map(field => (
          <div key={field.label}>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">{field.label}</label>
            <TextInput value={field.value} disabled readOnly />
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 nav:grid-cols-[120px_1fr]">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">郵遞區號</label>
          <TextInput value={BASIC_INFO_ZIP} disabled readOnly />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">登記地址</label>
          <TextInput value={BASIC_INFO_ADDRESS} disabled readOnly />
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">職災費率類別</label>
        <TextInput value={BASIC_INFO_LABOR_RISK} disabled readOnly />
      </div>

      <div className="mt-6 rounded-md bg-surface-cream p-4">
        <h3 className="mb-4 text-sm font-semibold text-neutral-dark">聯絡資訊</h3>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 nav:grid-cols-2">
          {BASIC_INFO_CONTACT.map(field => (
            <div key={field.label}>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">{field.label}</label>
              <TextInput value={field.value} disabled readOnly />
            </div>
          ))}
        </div>
        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">電子郵件信箱</label>
          <TextInput value={BASIC_INFO_EMAIL} disabled readOnly />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 型別檢查**

Run: `cd /Users/zhuangshuyuan/Desktop/easytax-lite && npx tsc --noEmit`
Expected: 無錯誤

---

### Task 4: 標籤與專案分頁（TagsProjectsTab）

**Files:**
- Create: `src/features/settings/components/TagsProjectsTab.tsx`

**Interfaces:**
- Consumes: `data.ts` 的 `SETTINGS_PROJECTS`、`SETTINGS_TAGS`；`@/components/ui/Badge`（Task 1）；
  `@/components/ui/Button`
- Produces: `TagsProjectsTab()`（無 props）

- [ ] **Step 1: 建立 `src/features/settings/components/TagsProjectsTab.tsx`**

```tsx
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { SETTINGS_PROJECTS, SETTINGS_TAGS } from '../data';

export default function TagsProjectsTab() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-dark">
              專案管理 <span className="text-xs font-normal text-neutral-mid">使用 @ 符號標示</span>
            </h2>
          </div>
          <Button size="sm" icon={Plus}>
            新增專案
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 nav:grid-cols-2">
          {SETTINGS_PROJECTS.map(project => (
            <div key={project.id} className="rounded-md bg-surface-cream p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-semibold text-brand-tan">@ {project.name}</span>
                <div className="flex items-center gap-3 text-neutral-mid">
                  <Pencil size={14} />
                  <Trash2 size={14} className="text-semantic-error" />
                </div>
              </div>
              <Badge tone="success" className="mb-3">
                {project.status}
              </Badge>
              <div className="flex flex-col gap-1 text-xs text-neutral-mid">
                <div>開始日期　{project.startDate}</div>
                <div>結束日期　{project.endDate}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-neutral-dark">
            標籤管理 <span className="text-xs font-normal text-neutral-mid">使用 # 符號標示</span>
          </h2>
          <Button size="sm" icon={Plus}>
            新增標籤
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 nav:grid-cols-3">
          {SETTINGS_TAGS.map(tag => (
            <div key={tag.id} className="flex items-center justify-between gap-2 rounded-md bg-surface-cream p-4">
              <span className="font-semibold text-brand-tan"># {tag.name}</span>
              <div className="flex items-center gap-3 text-neutral-mid">
                <Pencil size={14} />
                <Trash2 size={14} className="text-semantic-error" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 型別檢查**

Run: `cd /Users/zhuangshuyuan/Desktop/easytax-lite && npx tsc --noEmit`
Expected: 無錯誤

---

### Task 5: 發票簿分頁（InvoiceBookTab）

**Files:**
- Create: `src/features/settings/components/InvoiceBookTab.tsx`

**Interfaces:**
- Consumes: `data.ts` 的 `INVOICE_PERIOD_LABEL`、`HAND_INVOICE_BOOKS`；`@/components/ui/Button`
- Produces: `InvoiceBookTab()`（無 props）

- [ ] **Step 1: 建立 `src/features/settings/components/InvoiceBookTab.tsx`**

```tsx
import Button from '@/components/ui/Button';
import { CirclePlus, Pencil, Printer, Trash2 } from 'lucide-react';
import { HAND_INVOICE_BOOKS, INVOICE_PERIOD_LABEL } from '../data';

export default function InvoiceBookTab() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-md border border-neutral-blue-gray/30 bg-white px-4 py-3 text-sm text-neutral-dark">
        {INVOICE_PERIOD_LABEL}
      </div>

      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-neutral-dark">手開發票簿</h2>
          <Button size="sm" icon={CirclePlus}>
            新增本期發票本
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 nav:grid-cols-2">
          {HAND_INVOICE_BOOKS.map(book => (
            <div key={book.id} className="rounded-md bg-surface-cream p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-semibold text-neutral-dark">{book.name}</span>
                <div className="flex items-center gap-3 text-neutral-mid">
                  <Pencil size={14} />
                  <Trash2 size={14} className="text-semantic-error" />
                </div>
              </div>
              <div className="flex flex-col gap-1 text-xs text-neutral-mid">
                <div>字軌　{book.trackCode}</div>
                <div>起號　{book.startNumber}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-neutral-dark">電子發票</h2>
          <Button size="sm" variant="outline" icon={Printer}>
            列印格式設定
          </Button>
        </div>
        <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">目前沒有發票本</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 型別檢查**

Run: `cd /Users/zhuangshuyuan/Desktop/easytax-lite && npx tsc --noEmit`
Expected: 無錯誤

---

### Task 6: 方案細節分頁（PlanDetailTab）

**Files:**
- Create: `src/features/settings/components/PlanDetailTab.tsx`

**Interfaces:**
- Consumes: `data.ts` 的 `PLAN_QUANTITY_LABEL`、`PLAN_SERVICE_ITEMS`、`PLAN_PRICE`、
  `PLAN_NEXT_CHARGE_DATE`、`PLAN_CARD_LAST4`、`PLAN_CARD_EXPIRY`；`@/components/ui/Button`
- Produces: `PlanDetailTab()`（無 props）

- [ ] **Step 1: 建立 `src/features/settings/components/PlanDetailTab.tsx`**

```tsx
import Button from '@/components/ui/Button';
import { CircleCheck, CreditCard } from 'lucide-react';
import {
  PLAN_CARD_EXPIRY,
  PLAN_CARD_LAST4,
  PLAN_NEXT_CHARGE_DATE,
  PLAN_PRICE,
  PLAN_QUANTITY_LABEL,
  PLAN_SERVICE_ITEMS,
} from '../data';

export default function PlanDetailTab() {
  return (
    <div className="grid grid-cols-1 gap-5 nav:grid-cols-2">
      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-dark">購買服務內容</h2>
        <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">憑證數量</label>
        <div className="mb-4 flex h-10 items-center rounded-lg border-[1.5px] border-neutral-blue-gray/50 bg-surface-cream px-3 text-sm text-neutral-mid">
          {PLAN_QUANTITY_LABEL}
        </div>
        <div className="flex flex-col gap-2.5">
          {PLAN_SERVICE_ITEMS.map(item => (
            <div key={item.id} className="flex items-center gap-2 text-sm text-neutral-dark">
              <CircleCheck size={18} className="shrink-0 text-brand-blue" />
              {item.label}
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-neutral-blue-gray/20 pt-4">
          <p className="text-lg font-semibold text-neutral-dark">
            ${PLAN_PRICE.toLocaleString('en-US')} / 月
          </p>
          <p className="mt-1 text-xs text-neutral-mid">下次扣款日期：{PLAN_NEXT_CHARGE_DATE}</p>
        </div>
      </div>

      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-dark">付款方式</h2>
        <div className="flex items-center gap-4 rounded-md border border-neutral-blue-gray/30 p-4">
          <span className="grid h-9 w-14 shrink-0 place-items-center rounded-sm bg-brand-blue/10 text-xs font-bold text-brand-blue">
            VISA
          </span>
          <div className="text-sm text-neutral-dark">
            <p>**** **** **** {PLAN_CARD_LAST4}</p>
            <p className="mt-1 text-xs text-neutral-mid">到期日期 {PLAN_CARD_EXPIRY}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="outline" icon={CreditCard}>
            變更付款信用卡
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 型別檢查**

Run: `cd /Users/zhuangshuyuan/Desktop/easytax-lite && npx tsc --noEmit`
Expected: 無錯誤

---

### Task 7: 帳單分頁（BillingTab）

**Files:**
- Create: `src/features/settings/components/BillingTab.tsx`

**Interfaces:**
- Consumes: `data.ts` 的 `BILLING_YEAR`、`BILLING_RECORDS`；`@/components/ui/Badge`
- Produces: `BillingTab()`（無 props）

- [ ] **Step 1: 建立 `src/features/settings/components/BillingTab.tsx`**

```tsx
import Badge from '@/components/ui/Badge';
import { BILLING_RECORDS, BILLING_YEAR } from '../data';

export default function BillingTab() {
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-neutral-dark">{BILLING_YEAR}</h2>
      <div className="grid grid-cols-1 gap-4 nav:grid-cols-3">
        {BILLING_RECORDS.map(record => (
          <div key={record.id} className="rounded-md border-2 border-brand-blue bg-white p-4">
            <h3 className="mb-3 border-b border-neutral-blue-gray/20 pb-3 text-sm font-semibold text-neutral-dark">
              {record.month}
            </h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-mid">交易內容</span>
              <span className="font-semibold text-brand-tan">${record.amount.toLocaleString('en-US')}</span>
            </div>
            <div className="mt-2 pl-3 text-xs text-neutral-mid">月繳項目</div>
            <div className="flex items-center justify-between pl-3 text-xs text-neutral-dark">
              <span>{record.itemLabel}</span>
              <span>${record.amount.toLocaleString('en-US')}</span>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-neutral-blue-gray/20 pt-3 text-xs">
              <Badge tone="success" variant="solid">
                {record.status}
              </Badge>
              <span className="text-neutral-mid">{record.paidDate}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-neutral-dark">
              <span>{record.invoiceNumber}</span>
              <span>${record.amount.toLocaleString('en-US')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 型別檢查**

Run: `cd /Users/zhuangshuyuan/Desktop/easytax-lite && npx tsc --noEmit`
Expected: 無錯誤

---

### Task 8: 營業狀態紀錄分頁（OperatingStatusTab）

**Files:**
- Create: `src/features/settings/components/OperatingStatusTab.tsx`

**Interfaces:**
- Consumes: `data.ts` 的 `CURRENT_OPERATING_STATUS`、`OPERATING_STATUS_RECORDS`、
  `OperatingStatusRecord`；`@/components/ui/Badge`；`@/components/ui/Button`
- Produces: `OperatingStatusTab()`（無 props）

- [ ] **Step 1: 建立 `src/features/settings/components/OperatingStatusTab.tsx`**

```tsx
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { CirclePlus } from 'lucide-react';
import { CURRENT_OPERATING_STATUS, OPERATING_STATUS_RECORDS } from '../data';
import type { OperatingStatusRecord } from '../data';

const STATUS_TONE: Record<OperatingStatusRecord['status'], 'success' | 'error' | 'info'> = {
  開業: 'success',
  停業: 'error',
  復業: 'info',
};
const STATUS_DOT: Record<OperatingStatusRecord['status'], string> = {
  開業: 'bg-semantic-success',
  停業: 'bg-semantic-error',
  復業: 'bg-brand-blue',
};

export default function OperatingStatusTab() {
  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-neutral-dark">營業狀態紀錄</h2>
          <Badge tone={STATUS_TONE[CURRENT_OPERATING_STATUS]} variant="solid">
            目前狀態：{CURRENT_OPERATING_STATUS}
          </Badge>
        </div>
        <Button size="sm" icon={CirclePlus}>
          新增停業紀錄
        </Button>
      </div>

      <div className="flex flex-col">
        {OPERATING_STATUS_RECORDS.map((record, i) => (
          <div key={record.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[record.status]}`} />
              {i < OPERATING_STATUS_RECORDS.length - 1 && <span className="w-px flex-1 bg-neutral-blue-gray/30" />}
            </div>
            <div
              className={`flex flex-1 flex-wrap items-start justify-between gap-3 ${
                i < OPERATING_STATUS_RECORDS.length - 1 ? 'pb-6' : ''
              }`}
            >
              <div>
                <Badge tone={STATUS_TONE[record.status]} variant="solid" className="mb-2">
                  {record.status}
                </Badge>
                <p className="text-sm text-neutral-mid">
                  {record.startDate} ~ {record.endDate}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-brand-blue">修正</span>
                <span className="text-semantic-error">刪除</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 型別檢查**

Run: `cd /Users/zhuangshuyuan/Desktop/easytax-lite && npx tsc --noEmit`
Expected: 無錯誤

---

### Task 9: 銀行帳戶卡片元件（BankAccountCard）

**Files:**
- Create: `src/features/settings/components/BankAccountCard.tsx`

**Interfaces:**
- Consumes: `data.ts` 的 `BankAccountRecord`、`BANK_CODE_OPTIONS`；`@/components/ui/Button`、
  `@/components/ui/MoneyInput`、`@/components/ui/Select`、`@/components/ui/TextInput`
- Produces: `BankAccountCard({ account: BankAccountRecord, editing: boolean, onToggleEdit: () => void, onChange: (patch: Partial<BankAccountRecord>) => void, onRemove: () => void })` —
  Task 10 的 `PaymentSettingsTab` 會用這個簽名渲染每一筆帳戶

- [ ] **Step 1: 建立 `src/features/settings/components/BankAccountCard.tsx`**

```tsx
'use client';

import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { Pencil, Trash2 } from 'lucide-react';
import { BANK_CODE_OPTIONS } from '../data';
import type { BankAccountRecord } from '../data';

interface BankAccountCardProps {
  account: BankAccountRecord;
  editing: boolean;
  onToggleEdit: () => void;
  onChange: (patch: Partial<BankAccountRecord>) => void;
  onRemove: () => void;
}

export default function BankAccountCard({ account, editing, onToggleEdit, onChange, onRemove }: BankAccountCardProps) {
  return (
    <div className="rounded-md border border-neutral-blue-gray/30 p-4">
      <div className="flex flex-col gap-4 nav:flex-row nav:items-start nav:justify-between">
        <div className="flex-1 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">帳戶暱名</label>
            <TextInput
              value={account.nickname}
              disabled={!editing}
              readOnly={!editing}
              onChange={e => onChange({ nickname: e.target.value })}
            />
            {editing && <p className="mt-1 text-xs text-neutral-mid">注意：請輸入公司行號名下戶頭</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">銀行代碼</label>
            <Select
              widthClassName="w-full"
              value={account.bankCode}
              disabled={!editing}
              onValueChange={v => {
                const bank = BANK_CODE_OPTIONS.find(b => b.code === v);
                onChange({ bankCode: v, bankName: bank?.name ?? account.bankName });
              }}
            >
              {BANK_CODE_OPTIONS.map(bank => (
                <option key={bank.code} value={bank.code}>
                  {bank.code} - {bank.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">銀行帳號</label>
            <TextInput
              value={account.accountNumber}
              disabled={!editing}
              readOnly={!editing}
              onChange={e => onChange({ accountNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">存款餘額</label>
            <MoneyInput value={account.balance} disabled readOnly />
            <p className="mt-1 text-xs text-neutral-mid">更新日期：{account.updatedDate}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 nav:flex-col">
          <Button size="sm" variant={editing ? 'primary' : 'ghost'} icon={Pencil} onClick={onToggleEdit}>
            編輯
          </Button>
          <Button size="sm" variant="danger" icon={Trash2} onClick={onRemove}>
            移除
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 型別檢查**

Run: `cd /Users/zhuangshuyuan/Desktop/easytax-lite && npx tsc --noEmit`
Expected: 無錯誤

---

### Task 10: 收款設定分頁（PaymentSettingsTab）

**Files:**
- Create: `src/features/settings/components/PaymentSettingsTab.tsx`

**Interfaces:**
- Consumes: `data.ts` 的 `BankAccountRecord`、`BANK_CODE_OPTIONS`、`SEED_BANK_ACCOUNTS`；
  `./BankAccountCard`（Task 9，簽名如上）；`@/features/ledger/components/AddChannelDialog`
  （既有元件，props：`{ open: boolean, onClose: () => void, onSubmit: (channelName: string) => void }`）；
  `@/features/ledger/data` 的 `SALES_CHANNELS`；`@/components/ui/Button`
- Produces: `PaymentSettingsTab()`（無 props）— Task 11 的 `SettingsView` 會在
  `activeTab === 'paymentSettings'` 時渲染

- [ ] **Step 1: 建立 `src/features/settings/components/PaymentSettingsTab.tsx`**

```tsx
'use client';

import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import AddChannelDialog from '@/features/ledger/components/AddChannelDialog';
import { SALES_CHANNELS } from '@/features/ledger/data';
import { CirclePlus, Plus } from 'lucide-react';
import { useState } from 'react';
import BankAccountCard from './BankAccountCard';
import { BANK_CODE_OPTIONS, SEED_BANK_ACCOUNTS } from '../data';
import type { BankAccountRecord } from '../data';

const EMPTY_NEW_ACCOUNT: Omit<BankAccountRecord, 'id' | 'updatedDate'> = {
  nickname: '',
  bankCode: BANK_CODE_OPTIONS[0].code,
  bankName: BANK_CODE_OPTIONS[0].name,
  accountNumber: '',
  balance: 0,
};

export default function PaymentSettingsTab() {
  const [accounts, setAccounts] = useState<BankAccountRecord[]>(SEED_BANK_ACCOUNTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newAccount, setNewAccount] = useState(EMPTY_NEW_ACCOUNT);
  const [channels, setChannels] = useState<string[]>(SALES_CHANNELS);
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);

  const updateAccount = (id: string, patch: Partial<BankAccountRecord>) => {
    setAccounts(list => list.map(a => (a.id === id ? { ...a, ...patch } : a)));
  };
  const removeAccount = (id: string) => {
    setAccounts(list => list.filter(a => a.id !== id));
    setEditingId(current => (current === id ? null : current));
  };
  const saveNewAccount = () => {
    if (!newAccount.nickname.trim() || !newAccount.accountNumber.trim()) return;
    setAccounts(list => [...list, { ...newAccount, id: `acc-${list.length + 1}`, updatedDate: '首次設定' }]);
    setNewAccount(EMPTY_NEW_ACCOUNT);
    setAdding(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-neutral-dark">銀行帳戶管理</h2>
        </div>
        <div className="flex flex-col gap-4">
          {accounts.map(account => (
            <BankAccountCard
              key={account.id}
              account={account}
              editing={editingId === account.id}
              onToggleEdit={() => setEditingId(id => (id === account.id ? null : account.id))}
              onChange={patch => updateAccount(account.id, patch)}
              onRemove={() => removeAccount(account.id)}
            />
          ))}

          {adding && (
            <div className="rounded-md border border-dashed border-neutral-blue-gray/50 p-4">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">帳戶暱名</label>
                  <TextInput
                    placeholder="例：付款用國泰世華內科分行"
                    value={newAccount.nickname}
                    onChange={e => setNewAccount(a => ({ ...a, nickname: e.target.value }))}
                  />
                  <p className="mt-1 text-xs text-neutral-mid">注意：請輸入公司行號名下戶頭</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">銀行代碼</label>
                  <Select
                    widthClassName="w-full"
                    value={newAccount.bankCode}
                    onValueChange={v => {
                      const bank = BANK_CODE_OPTIONS.find(b => b.code === v);
                      setNewAccount(a => ({ ...a, bankCode: v, bankName: bank?.name ?? a.bankName }));
                    }}
                  >
                    {BANK_CODE_OPTIONS.map(bank => (
                      <option key={bank.code} value={bank.code}>
                        {bank.code} - {bank.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">銀行帳號</label>
                  <TextInput
                    placeholder="請輸入完整帳號，不要輸入符號"
                    value={newAccount.accountNumber}
                    onChange={e => setNewAccount(a => ({ ...a, accountNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">存款餘額</label>
                  <MoneyInput value={newAccount.balance} onChange={v => setNewAccount(a => ({ ...a, balance: v }))} />
                  <p className="mt-1 text-xs text-neutral-mid">僅限於首次設定時使用，系統將不再詢問</p>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <Button
                  variant="danger"
                  onClick={() => {
                    setAdding(false);
                    setNewAccount(EMPTY_NEW_ACCOUNT);
                  }}
                >
                  取消
                </Button>
                <Button variant="primary" onClick={saveNewAccount}>
                  儲存
                </Button>
              </div>
            </div>
          )}

          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center justify-center gap-2 rounded-md border border-dashed border-neutral-blue-gray/50 py-3 text-sm font-semibold text-brand-blue hover:bg-surface-cream"
            >
              <CirclePlus size={16} />
              再加一個銀行帳戶
            </button>
          )}
        </div>
      </div>

      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-neutral-dark">銷售管道暨收款方式</h2>
          <Button size="sm" icon={Plus} onClick={() => setChannelDialogOpen(true)}>
            新增銷售管道
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {channels.map(channel => (
            <span key={channel} className="rounded-sm bg-surface-cream px-3 py-1.5 text-sm text-neutral-dark">
              {channel}
            </span>
          ))}
        </div>
      </div>

      <AddChannelDialog
        open={channelDialogOpen}
        onClose={() => setChannelDialogOpen(false)}
        onSubmit={name => setChannels(list => [...list, name])}
      />
    </div>
  );
}
```

- [ ] **Step 2: 型別檢查**

Run: `cd /Users/zhuangshuyuan/Desktop/easytax-lite && npx tsc --noEmit`
Expected: 無錯誤

---

### Task 11: 頁籤導覽（SettingsView）

**Files:**
- Create: `src/features/settings/SettingsView.tsx`

**Interfaces:**
- Consumes: `types.ts` 的 `SettingsTab`；Task 3–10 的全部分頁元件（皆為無 props 的 default export，
  除了 `PaymentSettingsTab` 同樣無 props）；`@/components/ui/SegmentedControl`；`@/components/ui/Select`
- Produces: `SettingsView()`（無 props）— Task 12 的 `src/app/settings/page.tsx` 會 import 使用

- [ ] **Step 1: 建立 `src/features/settings/SettingsView.tsx`**

```tsx
'use client';

import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import { useState } from 'react';
import type { ReactNode } from 'react';
import BasicInfoTab from './components/BasicInfoTab';
import BillingTab from './components/BillingTab';
import InvoiceBookTab from './components/InvoiceBookTab';
import OperatingStatusTab from './components/OperatingStatusTab';
import PaymentSettingsTab from './components/PaymentSettingsTab';
import PlanDetailTab from './components/PlanDetailTab';
import TagsProjectsTab from './components/TagsProjectsTab';
import type { SettingsTab } from './types';

const SETTINGS_TABS: { value: SettingsTab; label: string }[] = [
  { value: 'basic', label: '基本設定' },
  { value: 'tagsProjects', label: '標籤與專案' },
  { value: 'invoiceBook', label: '發票簿' },
  { value: 'planDetail', label: '方案細節' },
  { value: 'billing', label: '帳單' },
  { value: 'operatingStatus', label: '營業狀態紀錄' },
  { value: 'paymentSettings', label: '收款設定' },
];

function renderActiveTab(tab: SettingsTab): ReactNode {
  switch (tab) {
    case 'basic':
      return <BasicInfoTab />;
    case 'tagsProjects':
      return <TagsProjectsTab />;
    case 'invoiceBook':
      return <InvoiceBookTab />;
    case 'planDetail':
      return <PlanDetailTab />;
    case 'billing':
      return <BillingTab />;
    case 'operatingStatus':
      return <OperatingStatusTab />;
    case 'paymentSettings':
      return <PaymentSettingsTab />;
  }
}

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('basic');

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 py-7 nav:px-7">
        <div className="mb-6 flex flex-col gap-4 nav:flex-row nav:items-center nav:justify-between">
          <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">
            設定
          </h1>
          <div className="w-full nav:w-auto nav:min-w-[640px]">
            <div className="hidden nav:block">
              <SegmentedControl options={SETTINGS_TABS} value={activeTab} onChange={setActiveTab} size="md" />
            </div>
            <div className="nav:hidden">
              <Select widthClassName="w-full" value={activeTab} onValueChange={v => setActiveTab(v as SettingsTab)}>
                {SETTINGS_TABS.map(tab => (
                  <option key={tab.value} value={tab.value}>
                    {tab.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {renderActiveTab(activeTab)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 型別檢查**

Run: `cd /Users/zhuangshuyuan/Desktop/easytax-lite && npx tsc --noEmit`
Expected: 無錯誤

---

### Task 12: `/settings` 路由 + 全頁驗收

**Files:**
- Create: `src/app/settings/page.tsx`

**Interfaces:**
- Consumes: `@/features/settings/SettingsView`（Task 11）
- Produces: `/settings` 路由（Next.js App Router page）

- [ ] **Step 1: 建立 `src/app/settings/page.tsx`**

```tsx
import SettingsView from '@/features/settings/SettingsView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '設定 | Easytax Lite',
};

export default function SettingsPage() {
  return <SettingsView />;
}
```

- [ ] **Step 2: 型別檢查與 build**

Run: `cd /Users/zhuangshuyuan/Desktop/easytax-lite && npx tsc --noEmit && npm run build`
Expected: 型別檢查與 build 皆無錯誤（`npm run build` 會連 ESLint 一併跑過，需一併確認無報錯）

- [ ] **Step 3: 啟動 dev server 手動驗收（桌面 + 手機寬度）**

Run: `npm run dev`（背景執行），瀏覽器開啟 `http://localhost:3000/settings`（若 3000 被占用則看終端機
輸出實際 port）

驗收清單：
- 桌面寬度（>1000px）：畫面右上為一列 7 個等分頁籤（`SegmentedControl`），點擊可切換 7 個分頁，
  當前分頁以城信藍底白字呈現
- 縮小視窗寬度至 <1000px（或用瀏覽器裝置模擬選一支手機）：7 個頁籤改為單一下拉選單，選單可正常
  切換分頁內容，畫面各卡片改為單欄堆疊、無橫向捲動
- 「基本設定」：唯讀欄位皆為灰底不可編輯
- 「標籤與專案」：專案卡片顯示「已完成」綠色 muted 徽章，標籤卡片顯示 # 前綴
- 「帳單」：月份卡片顯示「成功」綠色 solid 徽章
- 「營業狀態紀錄」：標題旁「目前狀態：復業」藍色 solid 徽章；時間軸三筆紀錄的色點與徽章分別為
  綠（開業）/紅（停業）/藍（復業）
- 「收款設定」：
  - 銀行帳戶卡片預設為唯讀，點擊「編輯」後帳戶暱名/銀行代碼/銀行帳號變為可編輯、按鈕變藍色，
    存款餘額仍為唯讀灰底
  - 點擊「+ 再加一個銀行帳戶」展開新增表單，填入暱名與帳號後點「儲存」會在列表新增一筆帳戶；
    點「取消」表單收起且不新增
  - 點擊「移除」可將該筆帳戶從列表移除
  - 點擊「新增銷售管道」會開啟既有的新增銷售管道對話框（與帳簿頁面同一個元件），送出後新管道
    會出現在管道列表中
- 瀏覽器 console 沒有出現 React/Next.js 錯誤或警告

Expected: 以上皆通過。若有任何一項不符，回頭修正對應 Task 的檔案後重新驗收。

---

## Self-Review 紀錄

- **Spec coverage**：spec 的 6 個純視覺分頁（Task 3–8）、新分類「收款設定」含銀行帳戶管理與
  「新增銷售管道」重用（Task 9–10）、桌面/手機雙版型頁籤導覽（Task 11）、Badge 元件與 DESIGN.md
  擴充（Task 1）、路由建立（Task 12）皆已對應到任務,無遺漏。
- **Placeholder scan**：所有步驟皆為完整程式碼,無 TBD/TODO。
- **Type consistency**：`BankAccountRecord` 欄位命名（`id`/`nickname`/`bankCode`/`bankName`/
  `accountNumber`/`balance`/`updatedDate`）在 Task 2 定義後,Task 9（`BankAccountCard`）與
  Task 10（`PaymentSettingsTab`）皆使用相同欄位名稱,無不一致。`SettingsTab` 字面值在 Task 2、
  Task 11 一致。
- **Git 現況**：專案非 git repository,故拿掉逐任務 commit 步驟,已於 Global Constraints 註明。
