# 對帳中心「多筆沖帳」與「使用餘額」欄位 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) 讓對帳中心現有「多筆沖帳」分頁（目前顯示但停用）可用：使用者於指定銷售管道／廠商下勾選多筆交易，重用既有的匯總沖帳預覽／執行 API（`settle/preview`、`settle/summary`），差別僅在於帶入使用者勾選的 `ledgerUuids` 陣列與 `isDefault: false`（匯總沖帳則固定 `isDefault: true`、`ledgerUuids: []`）。(2) 依 `api.md` 最新規格，於手動沖帳、匯總沖帳預覽、匯總沖帳執行共 6 支 API 加上 `balanceUsed`（使用餘額）欄位，並把畫面上原本唯讀的「本次抵銷」欄位改為使用者可輸入，決定該次沖帳要使用多少既有餘額。

**Architecture:** 多筆沖帳與既有匯總沖帳共用同一套預覽／確認差額／執行／結果彈窗流程與元件（`ReconConfirmSummaryModal`、`ReconSurplusModal`、`ReconSettleResultModal`、`ReconPoolSummary` 皆已是 mode-agnostic，不需改動）。差異僅在三處：(1) API 層新增 `isDefault`／`ledgerUuids`／`balanceUsed` 欄位並在 `previewSettle`／`submitSettle`／`submitSingleSettle` 依模式與使用者輸入帶入正確值；(2) 交易清單的選取圓圈從「僅單筆沖帳可勾選」擴大為「單筆／多筆沖帳皆可勾選（複選）」；(3) `ReconciliationView` 新增多選狀態與「使用餘額」輸入狀態，並把原本寫死 `mode === 'summary'` 的顯示/送出邏輯放寬為「非單筆沖帳」皆適用。`balanceUsed` 欄位橫跨單筆／多筆／匯總三種模式共用同一個輸入框（`ReconPoolPanel` 既有的「本次抵銷」欄位），故設計為 `ReconPoolPanel` 端用「是否傳入 `onBalanceUsedChange`」決定該欄位唯讀或可編輯，避免拆兩份元件邏輯。

**Tech Stack:** Next.js 14 (App Router) + React 18 + TypeScript 5 (strict) + TailwindCSS 3；無自動化測試框架（`package.json` 僅有 `dev`/`build`/`start`/`lint`），驗證方式為 `npm run build`（型別檢查）＋ `npm run dev` 手動走查，比照 `CLAUDE.md` 開發流程。

## Global Constraints

- Claude 回應與程式碼註釋一律繁體中文（通用函數可用英文），變數/函數命名英文。
- 不添加未被要求的功能，不順便重構；改動限制在最小範圍。
- 元件優先使用 `src/components/` 現有元件；圖示一律用 `lucide-react`；介面不得出現 emoji。
- `src/app/**`（業務層）嚴禁 `any`；本計畫改動皆在 `src/features/**` 與 `src/api/**`，依現有型別慣例避免新增 `any`。
- 路徑引用一律用 `@/*` 別名，不得用相對路徑跨層引用。
- API 呼叫錯誤處理沿用既有 `getFriendlyErrorMessage` 模式，不吞錯誤細節。
- **絕不捏造 API 欄位**：本計畫新增的 `isDefault`／`ledgerUuids`／`balanceUsed` 欄位皆已於 `api.md` 明確定義（`isDefault`／`ledgerUuids`：第 7490-7525、7871-7906 行；`balanceUsed`：第 7319、7439、7528、7711、7909、8113 行），非猜測。

---

## 前置閱讀（每個 task 的實作者都應先看過這幾份，建立背景）

- `src/features/reconciliation/settle.ts`：`previewSettle`／`submitSettle`／`submitSingleSettle` 三個 API 封裝函式，本計畫皆會修改。
- `src/features/reconciliation/types.ts`：`ReconMode`（`'single' | 'multi' | 'summary'`）、`ReconSettleResult`、`ReconTxnRef` 型別定義。
- `src/features/reconciliation/ReconciliationView.tsx`：頁面主控制器，管理所有 state 與 API 呼叫，「匯總沖帳」（`mode === 'summary'`）的完整流程已在此實作，本計畫大量沿用其邏輯。
- `src/features/reconciliation/components/ReconPoolPanel.tsx`：沖帳作業卡片，含目前唯讀的「本次抵銷」`MoneyInput`（本計畫要改為可編輯）。
- `api.md` 第 7280-7460 行（手動沖帳 payables/receivables settle）、第 7490-7527 行（進項 `settle/preview`）、第 7871-7918 行（銷項 `settle/preview`）、第 7662-7736 行（進項 `settle/summary`）、第 8063-8130 行（銷項 `settle/summary`）：`isDefault`／`ledgerUuids`／`balanceUsed` 欄位的官方定義。

---

### Task 1: 擴充沖帳相關 API 型別與 `settle.ts` 參數（`isDefault`／`ledgerUuids`／`balanceUsed`）

**Files:**
- Modify: `src/api/types.ts`（`SettleReceivableBody`、`SettlePayableBody`、`SettleReceivablePreviewBody`、`SettlePayablePreviewBody`、`SettleReceivableSummaryBody`、`SettlePayableSummaryBody`）
- Modify: `src/features/reconciliation/settle.ts`（`PreviewParams`／`previewSettle`、`SummaryParams`／`submitSettle`、`SingleSettleParams`／`submitSingleSettle`）
- Modify: `src/features/ledger/transaction/components/SettlementEditDialog.tsx:169-191`（最小修正：新增必填的 `balanceUsed: 0`，此對話框無「使用餘額」UI，維持原行為即可）

**Interfaces:**
- Produces: `previewSettle(params: PreviewParams): Promise<ReconSettleResult>`，其中 `PreviewParams` 新增可選欄位 `ledgerUuids?: string[]`（省略時等同 `[]`）、`isDefault?: boolean`（省略時等同 `true`），以及新增必填欄位 `balanceUsed: number`。`submitSettle(params: SummaryParams)` 與 `submitSingleSettle(params: SingleSettleParams)` 皆新增必填欄位 `balanceUsed: number`。後續 task（Task 4）呼叫這三個函式時，皆須傳入使用者於「本次抵銷」欄位輸入的餘額值；多筆沖帳模式另外要傳 `ledgerUuids: Array.from(selectedMultiUuids)` 與 `isDefault: false`。

- [ ] **Step 1: 修改 `src/api/types.ts` 的 `SettleReceivableBody`（手動沖帳銷項）**

把（第 470-488 行）：

```ts
export interface SettleReceivableBody {
  companyUuid: string;
  /** 應收帳款 uuid */
  ledgerUuid: string;
  /** 交易收款日，YYYYMMDD */
  paymentDate: string;
  /** 銀行帳戶 uuid */
  bankAccountUuid: string;
  /** 沖帳金額 */
  settleAmount: number;
  /** 實際存入 */
  depositAmount: number;
  /** 備註 */
  memo: string;
  /** 沖帳手續費物件 */
  allocations: SettleSummaryFee[];
  /** 沖帳其他減項物件 */
  otherDeductions?: SettleSummaryOtherDeduction[];
}
```

改為：

```ts
export interface SettleReceivableBody {
  companyUuid: string;
  /** 應收帳款 uuid */
  ledgerUuid: string;
  /** 交易收款日，YYYYMMDD */
  paymentDate: string;
  /** 銀行帳戶 uuid */
  bankAccountUuid: string;
  /** 沖帳金額 */
  settleAmount: number;
  /** 實際存入 */
  depositAmount: number;
  /** 使用餘額 */
  balanceUsed: number;
  /** 備註 */
  memo: string;
  /** 沖帳手續費物件 */
  allocations: SettleSummaryFee[];
  /** 沖帳其他減項物件 */
  otherDeductions?: SettleSummaryOtherDeduction[];
}
```

- [ ] **Step 2: 修改 `src/api/types.ts` 的 `SettlePayableBody`（手動沖帳進項）**

把（第 491-509 行）：

```ts
/** 應付帳款手動入帳（POST /ael/ledger/payables/settle）body。同上，ledgerUuid／allocations 見備註。 */
export interface SettlePayableBody {
  companyUuid: string;
  /** 應付帳款 uuid */
  ledgerUuid: string;
  /** 交易付款日，YYYYMMDD */
  paymentDate: string;
  /** 銀行帳戶 uuid */
  bankAccountUuid: string;
  /** 沖帳金額 */
  settleAmount: number;
  /** 實際付款 */
  paymentAmount: number;
  /** 備註 */
  memo: string;
  /** 沖帳手續費物件 */
  allocations: SettleSummaryFee[];
  /** 沖帳其他減項物件 */
  otherDeductions?: SettleSummaryOtherDeduction[];
}
```

改為：

```ts
/** 應付帳款手動入帳（POST /ael/ledger/payables/settle）body。同上，ledgerUuid／allocations 見備註。 */
export interface SettlePayableBody {
  companyUuid: string;
  /** 應付帳款 uuid */
  ledgerUuid: string;
  /** 交易付款日，YYYYMMDD */
  paymentDate: string;
  /** 銀行帳戶 uuid */
  bankAccountUuid: string;
  /** 沖帳金額 */
  settleAmount: number;
  /** 實際付款 */
  paymentAmount: number;
  /** 使用餘額 */
  balanceUsed: number;
  /** 備註 */
  memo: string;
  /** 沖帳手續費物件 */
  allocations: SettleSummaryFee[];
  /** 沖帳其他減項物件 */
  otherDeductions?: SettleSummaryOtherDeduction[];
}
```

- [ ] **Step 3: 修改 `src/api/types.ts` 的 `SettleReceivablePreviewBody`**

把（第 570-585 行）：

```ts
/** POST /ael/ledger/reconciliation/receivables/settle/preview body */
export interface SettleReceivablePreviewBody {
  companyUuid: string;
  /** 銷售管道 uuid */
  paymentChannelUuid: string;
  /** 本次匯總沖帳總額（元）；依 transaction_date／created_at 由舊到新拆帳，超沖加在最後一筆 */
  settleAmount: number;
  /** 銷項實際存入 */
  depositAmount: number;
  /** 是否將超沖少沖的金額記進餘額 */
  isBalance: boolean;
  /** 沖帳手續費物件 */
  allocations: SettleSummaryFee;
  /** 使用者未新增任何額外金額時不傳此參數 */
  otherDeductions?: SettleSummaryOtherDeduction[];
}
```

改為：

```ts
/** POST /ael/ledger/reconciliation/receivables/settle/preview body */
export interface SettleReceivablePreviewBody {
  companyUuid: string;
  /** 銷售管道 uuid */
  paymentChannelUuid: string;
  /** 使用預設預覽嗎：true 由後端依 transaction_date 由舊到新自動拆帳（匯總沖帳）；false 僅預覽 ledgerUuids 指定的原單（多筆沖帳） */
  isDefault: boolean;
  /** 要預覽匯總沖帳的自選 uuid 列表；isDefault=true 時傳空陣列 */
  ledgerUuids: string[];
  /** 本次匯總沖帳總額（元）；依 transaction_date／created_at 由舊到新拆帳，超沖加在最後一筆 */
  settleAmount: number;
  /** 銷項實際存入 */
  depositAmount: number;
  /** 使用餘額 */
  balanceUsed: number;
  /** 是否將超沖少沖的金額記進餘額 */
  isBalance: boolean;
  /** 沖帳手續費物件 */
  allocations: SettleSummaryFee;
  /** 使用者未新增任何額外金額時不傳此參數 */
  otherDeductions?: SettleSummaryOtherDeduction[];
}
```

- [ ] **Step 4: 修改 `src/api/types.ts` 的 `SettlePayablePreviewBody`**

把（第 587-602 行）：

```ts
/** POST /ael/ledger/reconciliation/payables/settle/preview body */
export interface SettlePayablePreviewBody {
  companyUuid: string;
  /** 廠商 uuid */
  counterpartyUuid: string;
  /** 本次匯總沖帳總額（元）；依 transaction_date／created_at 由舊到新拆帳，超沖加在最後一筆 */
  settleAmount: number;
  /** 進項實際付出 */
  paymentAmount: number;
  /** 是否將超沖少沖的金額記進餘額 */
  isBalance: boolean;
  /** 沖帳手續費物件 */
  allocations: SettleSummaryFee;
  /** 使用者未新增任何額外金額時不傳此參數 */
  otherDeductions?: SettleSummaryOtherDeduction[];
}
```

改為：

```ts
/** POST /ael/ledger/reconciliation/payables/settle/preview body */
export interface SettlePayablePreviewBody {
  companyUuid: string;
  /** 廠商 uuid */
  counterpartyUuid: string;
  /** 使用預設預覽嗎：true 由後端依 transaction_date 由舊到新自動拆帳（匯總沖帳）；false 僅預覽 ledgerUuids 指定的原單（多筆沖帳） */
  isDefault: boolean;
  /** 要預覽匯總沖帳的自選 uuid 列表；isDefault=true 時傳空陣列 */
  ledgerUuids: string[];
  /** 本次匯總沖帳總額（元）；依 transaction_date／created_at 由舊到新拆帳，超沖加在最後一筆 */
  settleAmount: number;
  /** 進項實際付出 */
  paymentAmount: number;
  /** 使用餘額 */
  balanceUsed: number;
  /** 是否將超沖少沖的金額記進餘額 */
  isBalance: boolean;
  /** 沖帳手續費物件 */
  allocations: SettleSummaryFee;
  /** 使用者未新增任何額外金額時不傳此參數 */
  otherDeductions?: SettleSummaryOtherDeduction[];
}
```

- [ ] **Step 5: 修改 `src/api/types.ts` 的 `SettleReceivableSummaryBody`（匯總沖帳執行銷項）**

把（第 654-673 行）：

```ts
export interface SettleReceivableSummaryBody {
  companyUuid: string;
  /** 要匯總沖帳的原單 uuid 列表（不可重複；須同銷售管道） */
  ledgerUuids: string[];
  /** 本次匯總沖帳總額（元） */
  settleAmount: number;
  /** 銷項實際存入 */
  depositAmount: number;
  /** 收款日 YYYYMMDD */
  paymentDate: string;
  /** 存入銀行帳戶 uuid */
  bankAccountUuid: string;
  /** 備註（選填） */
  memo?: string;
  /** 是否將超沖少沖的金額記進餘額 */
  isBalance: boolean;
  /** 沖帳手續費物件 */
  allocations: SettleSummaryFee;
  otherDeductions?: SettleSummaryOtherDeduction[];
}
```

改為：

```ts
export interface SettleReceivableSummaryBody {
  companyUuid: string;
  /** 要匯總沖帳的原單 uuid 列表（不可重複；須同銷售管道） */
  ledgerUuids: string[];
  /** 本次匯總沖帳總額（元） */
  settleAmount: number;
  /** 銷項實際存入 */
  depositAmount: number;
  /** 收款日 YYYYMMDD */
  paymentDate: string;
  /** 存入銀行帳戶 uuid */
  bankAccountUuid: string;
  /** 備註（選填） */
  memo?: string;
  /** 使用餘額 */
  balanceUsed: number;
  /** 是否將超沖少沖的金額記進餘額 */
  isBalance: boolean;
  /** 沖帳手續費物件 */
  allocations: SettleSummaryFee;
  otherDeductions?: SettleSummaryOtherDeduction[];
}
```

- [ ] **Step 6: 修改 `src/api/types.ts` 的 `SettlePayableSummaryBody`（匯總沖帳執行進項）**

把（第 675-690 行）：

```ts
/** POST /ael/ledger/reconciliation/payables/settle/summary body，欄位語意同 SettleReceivableSummaryBody（進項版） */
export interface SettlePayableSummaryBody {
  companyUuid: string;
  ledgerUuids: string[];
  settleAmount: number;
  /** 進項實際付出 */
  paymentAmount: number;
  /** 付款日 YYYYMMDD */
  paymentDate: string;
  /** 付款銀行帳戶 uuid */
  bankAccountUuid: string;
  memo?: string;
  isBalance: boolean;
  allocations: SettleSummaryFee;
  otherDeductions?: SettleSummaryOtherDeduction[];
}
```

改為：

```ts
/** POST /ael/ledger/reconciliation/payables/settle/summary body，欄位語意同 SettleReceivableSummaryBody（進項版） */
export interface SettlePayableSummaryBody {
  companyUuid: string;
  ledgerUuids: string[];
  settleAmount: number;
  /** 進項實際付出 */
  paymentAmount: number;
  /** 付款日 YYYYMMDD */
  paymentDate: string;
  /** 付款銀行帳戶 uuid */
  bankAccountUuid: string;
  memo?: string;
  /** 使用餘額 */
  balanceUsed: number;
  isBalance: boolean;
  allocations: SettleSummaryFee;
  otherDeductions?: SettleSummaryOtherDeduction[];
}
```

- [ ] **Step 7: 修改 `src/features/reconciliation/settle.ts` 的 `PreviewParams` 與 `previewSettle`**

把（第 16-74 行）：

```ts
interface PreviewParams {
  side: ReconSide;
  /** 銷項為 paymentChannelUuid；進項為 counterpartyUuid */
  groupUuid: string;
  settleAmount: number;
  /** 銷項為 depositAmount（實際存入）；進項為 paymentAmount（實際付出） */
  actualAmount: number;
  isBalance: boolean;
  feeAmount: number;
  otherDeductions: ReconOtherDeductionRow[];
}

/** 匯總沖帳預覽拆帳：依 side 呼叫對應 API，回應正規化為 ReconSettleResult */
export async function previewSettle(params: PreviewParams): Promise<ReconSettleResult> {
  const allocations: SettleSummaryFee = { name: '匯總手續費', feeAmount: params.feeAmount };
  const otherDeductions = toOtherDeductions(params.otherDeductions);

  if (params.side === 'receivable') {
    const res = await previewSettleReceivable({
      paymentChannelUuid: params.groupUuid,
      settleAmount: params.settleAmount,
      depositAmount: params.actualAmount,
      isBalance: params.isBalance,
      allocations,
      otherDeductions,
    });
    return {
      settleAmount: res.settleAmount,
      appliedSettleAmount: res.appliedSettleAmount,
      actualAmount: res.actualDepositAmount,
      balanceBefore: res.balanceBefore,
      balanceAfter: res.balanceAfter,
      isBalance: res.isBalance,
      affectedCount: res.affectedCount,
      totalBeforeRemaining: res.totalBeforeRemaining,
      allocations: res.ledgerAllocations,
    };
  }

  const res = await previewSettlePayable({
    counterpartyUuid: params.groupUuid,
    settleAmount: params.settleAmount,
    paymentAmount: params.actualAmount,
    isBalance: params.isBalance,
    allocations,
    otherDeductions,
  });
  return {
    settleAmount: res.settleAmount,
    appliedSettleAmount: res.appliedSettleAmount,
    actualAmount: res.actualPaymentAmount,
    balanceBefore: res.balanceBefore,
    balanceAfter: res.balanceAfter,
    isBalance: res.isBalance,
    affectedCount: res.affectedCount,
    totalBeforeRemaining: res.totalBeforeRemaining,
    allocations: res.ledgerAllocations,
  };
}
```

改為：

```ts
interface PreviewParams {
  side: ReconSide;
  /** 銷項為 paymentChannelUuid；進項為 counterpartyUuid */
  groupUuid: string;
  /** 要預覽的原單 uuid 列表（多筆沖帳使用者勾選的交易）；省略時等同 []，須搭配 isDefault=true（匯總沖帳） */
  ledgerUuids?: string[];
  /** 使用預設預覽嗎：省略時預設 true（匯總沖帳，由後端自動拆帳）；多筆沖帳須明確傳 false */
  isDefault?: boolean;
  settleAmount: number;
  /** 銷項為 depositAmount（實際存入）；進項為 paymentAmount（實際付出） */
  actualAmount: number;
  /** 本次沖帳使用的餘額（元），對應 ReconPoolPanel「本次抵銷」欄位的使用者輸入值 */
  balanceUsed: number;
  isBalance: boolean;
  feeAmount: number;
  otherDeductions: ReconOtherDeductionRow[];
}

/**
 * 沖帳預覽拆帳：依 side 呼叫對應 API，回應正規化為 ReconSettleResult。
 * 匯總沖帳（summary）不傳 ledgerUuids／isDefault，預設 isDefault=true、ledgerUuids=[]，
 * 由後端依 transaction_date 由舊到新自動拆帳；多筆沖帳（multi）須明確傳入使用者勾選的
 * ledgerUuids 與 isDefault=false，僅針對勾選的原單試算（見 api.md settle/preview）。
 */
export async function previewSettle(params: PreviewParams): Promise<ReconSettleResult> {
  const allocations: SettleSummaryFee = { name: '匯總手續費', feeAmount: params.feeAmount };
  const otherDeductions = toOtherDeductions(params.otherDeductions);
  const isDefault = params.isDefault ?? true;
  const ledgerUuids = params.ledgerUuids ?? [];

  if (params.side === 'receivable') {
    const res = await previewSettleReceivable({
      paymentChannelUuid: params.groupUuid,
      isDefault,
      ledgerUuids,
      settleAmount: params.settleAmount,
      depositAmount: params.actualAmount,
      balanceUsed: params.balanceUsed,
      isBalance: params.isBalance,
      allocations,
      otherDeductions,
    });
    return {
      settleAmount: res.settleAmount,
      appliedSettleAmount: res.appliedSettleAmount,
      actualAmount: res.actualDepositAmount,
      balanceBefore: res.balanceBefore,
      balanceAfter: res.balanceAfter,
      isBalance: res.isBalance,
      affectedCount: res.affectedCount,
      totalBeforeRemaining: res.totalBeforeRemaining,
      allocations: res.ledgerAllocations,
    };
  }

  const res = await previewSettlePayable({
    counterpartyUuid: params.groupUuid,
    isDefault,
    ledgerUuids,
    settleAmount: params.settleAmount,
    paymentAmount: params.actualAmount,
    balanceUsed: params.balanceUsed,
    isBalance: params.isBalance,
    allocations,
    otherDeductions,
  });
  return {
    settleAmount: res.settleAmount,
    appliedSettleAmount: res.appliedSettleAmount,
    actualAmount: res.actualPaymentAmount,
    balanceBefore: res.balanceBefore,
    balanceAfter: res.balanceAfter,
    isBalance: res.isBalance,
    affectedCount: res.affectedCount,
    totalBeforeRemaining: res.totalBeforeRemaining,
    allocations: res.ledgerAllocations,
  };
}
```

- [ ] **Step 8: 修改 `src/features/reconciliation/settle.ts` 的 `SummaryParams` 與 `submitSettle`**

把（第 76-143 行）：

```ts
interface SummaryParams {
  side: ReconSide;
  ledgerUuids: string[];
  settleAmount: number;
  actualAmount: number;
  /** YYYYMMDD */
  paymentDate: string;
  bankAccountUuid: string;
  isBalance: boolean;
  feeAmount: number;
  otherDeductions: ReconOtherDeductionRow[];
}

/** 匯總沖帳真正執行：依 side 呼叫對應 API，回應正規化為 ReconSettleResult */
export async function submitSettle(params: SummaryParams): Promise<ReconSettleResult> {
  const allocations: SettleSummaryFee = { name: '匯總手續費', feeAmount: params.feeAmount };
  const otherDeductions = toOtherDeductions(params.otherDeductions);

  if (params.side === 'receivable') {
    const res = await settleReceivableSummary({
      ledgerUuids: params.ledgerUuids,
      settleAmount: params.settleAmount,
      depositAmount: params.actualAmount,
      paymentDate: params.paymentDate,
      bankAccountUuid: params.bankAccountUuid,
      isBalance: params.isBalance,
      allocations,
      otherDeductions,
    });
    return {
      settleAmount: res.settleAmount,
      appliedSettleAmount: res.appliedSettleAmount,
      actualAmount: res.actualDepositAmount,
      balanceBefore: res.balanceBefore,
      balanceAfter: res.balanceAfter,
      isBalance: res.isBalance,
      affectedCount: res.affectedCount,
      totalBeforeRemaining: res.totalBeforeRemaining,
      allocations: res.ledgerAllocations,
      settlementOrderCode: res.settlementOrderCode,
      paymentDate: res.paymentDate,
    };
  }

  const res = await settlePayableSummary({
    ledgerUuids: params.ledgerUuids,
    settleAmount: params.settleAmount,
    paymentAmount: params.actualAmount,
    paymentDate: params.paymentDate,
    bankAccountUuid: params.bankAccountUuid,
    isBalance: params.isBalance,
    allocations,
    otherDeductions,
  });
  return {
    settleAmount: res.settleAmount,
    appliedSettleAmount: res.appliedSettleAmount,
    actualAmount: res.actualPaymentAmount,
    balanceBefore: res.balanceBefore,
    balanceAfter: res.balanceAfter,
    isBalance: res.isBalance,
    affectedCount: res.affectedCount,
    totalBeforeRemaining: res.totalBeforeRemaining,
    allocations: res.ledgerAllocations,
    settlementOrderCode: res.settlementOrderCode,
    paymentDate: res.paymentDate,
  };
}
```

改為：

```ts
interface SummaryParams {
  side: ReconSide;
  ledgerUuids: string[];
  settleAmount: number;
  actualAmount: number;
  /** 本次沖帳使用的餘額（元） */
  balanceUsed: number;
  /** YYYYMMDD */
  paymentDate: string;
  bankAccountUuid: string;
  isBalance: boolean;
  feeAmount: number;
  otherDeductions: ReconOtherDeductionRow[];
}

/** 匯總／多筆沖帳真正執行：依 side 呼叫對應 API，回應正規化為 ReconSettleResult */
export async function submitSettle(params: SummaryParams): Promise<ReconSettleResult> {
  const allocations: SettleSummaryFee = { name: '匯總手續費', feeAmount: params.feeAmount };
  const otherDeductions = toOtherDeductions(params.otherDeductions);

  if (params.side === 'receivable') {
    const res = await settleReceivableSummary({
      ledgerUuids: params.ledgerUuids,
      settleAmount: params.settleAmount,
      depositAmount: params.actualAmount,
      paymentDate: params.paymentDate,
      bankAccountUuid: params.bankAccountUuid,
      balanceUsed: params.balanceUsed,
      isBalance: params.isBalance,
      allocations,
      otherDeductions,
    });
    return {
      settleAmount: res.settleAmount,
      appliedSettleAmount: res.appliedSettleAmount,
      actualAmount: res.actualDepositAmount,
      balanceBefore: res.balanceBefore,
      balanceAfter: res.balanceAfter,
      isBalance: res.isBalance,
      affectedCount: res.affectedCount,
      totalBeforeRemaining: res.totalBeforeRemaining,
      allocations: res.ledgerAllocations,
      settlementOrderCode: res.settlementOrderCode,
      paymentDate: res.paymentDate,
    };
  }

  const res = await settlePayableSummary({
    ledgerUuids: params.ledgerUuids,
    settleAmount: params.settleAmount,
    paymentAmount: params.actualAmount,
    paymentDate: params.paymentDate,
    bankAccountUuid: params.bankAccountUuid,
    balanceUsed: params.balanceUsed,
    isBalance: params.isBalance,
    allocations,
    otherDeductions,
  });
  return {
    settleAmount: res.settleAmount,
    appliedSettleAmount: res.appliedSettleAmount,
    actualAmount: res.actualPaymentAmount,
    balanceBefore: res.balanceBefore,
    balanceAfter: res.balanceAfter,
    isBalance: res.isBalance,
    affectedCount: res.affectedCount,
    totalBeforeRemaining: res.totalBeforeRemaining,
    allocations: res.ledgerAllocations,
    settlementOrderCode: res.settlementOrderCode,
    paymentDate: res.paymentDate,
  };
}
```

- [ ] **Step 9: 修改 `src/features/reconciliation/settle.ts` 的 `SingleSettleParams` 與 `submitSingleSettle`**

把（第 145-191 行）：

```ts
interface SingleSettleParams {
  side: ReconSide;
  ledgerUuid: string;
  settleAmount: number;
  /** 銷項為 depositAmount（實際存入）；進項為 paymentAmount（實際付出） */
  actualAmount: number;
  /** YYYYMMDD */
  paymentDate: string;
  bankAccountUuid: string;
  feeAmount: number;
  otherDeductions: ReconOtherDeductionRow[];
}

/**
 * 單筆沖帳：走手動沖帳 API（settleReceivable／settlePayable，reconMethod=0），
 * 允許超沖少沖，事後可在交易明細頁編輯金額（見 SettlementEditDialog）。
 * payload 組法比照該對話框：allocations 為陣列，手續費為 0 時不放此項；otherDeductions 空陣列時送 undefined。
 */
export async function submitSingleSettle(params: SingleSettleParams): Promise<void> {
  const allocations: SettleSummaryFee[] = params.feeAmount !== 0 ? [{ name: '手續費', feeAmount: params.feeAmount }] : [];
  const otherDeductions = toOtherDeductions(params.otherDeductions);

  if (params.side === 'receivable') {
    await settleReceivable({
      ledgerUuid: params.ledgerUuid,
      paymentDate: params.paymentDate,
      bankAccountUuid: params.bankAccountUuid,
      settleAmount: params.settleAmount,
      depositAmount: params.actualAmount,
      memo: '',
      allocations,
      otherDeductions,
    });
    return;
  }

  await settlePayable({
    ledgerUuid: params.ledgerUuid,
    paymentDate: params.paymentDate,
    bankAccountUuid: params.bankAccountUuid,
    settleAmount: params.settleAmount,
    paymentAmount: params.actualAmount,
    memo: '',
    allocations,
    otherDeductions,
  });
}
```

改為：

```ts
interface SingleSettleParams {
  side: ReconSide;
  ledgerUuid: string;
  settleAmount: number;
  /** 銷項為 depositAmount（實際存入）；進項為 paymentAmount（實際付出） */
  actualAmount: number;
  /** 本次沖帳使用的餘額（元） */
  balanceUsed: number;
  /** YYYYMMDD */
  paymentDate: string;
  bankAccountUuid: string;
  feeAmount: number;
  otherDeductions: ReconOtherDeductionRow[];
}

/**
 * 單筆沖帳：走手動沖帳 API（settleReceivable／settlePayable，reconMethod=0），
 * 允許超沖少沖，事後可在交易明細頁編輯金額（見 SettlementEditDialog）。
 * payload 組法比照該對話框：allocations 為陣列，手續費為 0 時不放此項；otherDeductions 空陣列時送 undefined。
 */
export async function submitSingleSettle(params: SingleSettleParams): Promise<void> {
  const allocations: SettleSummaryFee[] = params.feeAmount !== 0 ? [{ name: '手續費', feeAmount: params.feeAmount }] : [];
  const otherDeductions = toOtherDeductions(params.otherDeductions);

  if (params.side === 'receivable') {
    await settleReceivable({
      ledgerUuid: params.ledgerUuid,
      paymentDate: params.paymentDate,
      bankAccountUuid: params.bankAccountUuid,
      settleAmount: params.settleAmount,
      depositAmount: params.actualAmount,
      balanceUsed: params.balanceUsed,
      memo: '',
      allocations,
      otherDeductions,
    });
    return;
  }

  await settlePayable({
    ledgerUuid: params.ledgerUuid,
    paymentDate: params.paymentDate,
    bankAccountUuid: params.bankAccountUuid,
    settleAmount: params.settleAmount,
    paymentAmount: params.actualAmount,
    balanceUsed: params.balanceUsed,
    memo: '',
    allocations,
    otherDeductions,
  });
}
```

- [ ] **Step 10: 修正 `SettlementEditDialog.tsx` 的兩處手動沖帳呼叫，補上必填的 `balanceUsed`**

把（`src/features/ledger/transaction/components/SettlementEditDialog.tsx` 第 168-191 行）：

```ts
    try {
      if (isSales) {
        await settleReceivable({
          ledgerUuid,
          paymentDate: formattedDate!,
          bankAccountUuid,
          settleAmount: amount,
          depositAmount,
          memo: '',
          allocations,
          otherDeductions: otherDeductionsBody,
        });
      } else {
        await settlePayable({
          ledgerUuid,
          paymentDate: formattedDate!,
          bankAccountUuid,
          settleAmount: amount,
          paymentAmount: depositAmount,
          memo: '',
          allocations,
          otherDeductions: otherDeductionsBody,
        });
      }
    } catch (err) {
```

改為：

```ts
    try {
      if (isSales) {
        await settleReceivable({
          ledgerUuid,
          paymentDate: formattedDate!,
          bankAccountUuid,
          settleAmount: amount,
          depositAmount,
          // 本對話框僅供編輯既有單筆沖帳金額，無「使用餘額」欄位，固定不使用餘額
          balanceUsed: 0,
          memo: '',
          allocations,
          otherDeductions: otherDeductionsBody,
        });
      } else {
        await settlePayable({
          ledgerUuid,
          paymentDate: formattedDate!,
          bankAccountUuid,
          settleAmount: amount,
          paymentAmount: depositAmount,
          balanceUsed: 0,
          memo: '',
          allocations,
          otherDeductions: otherDeductionsBody,
        });
      }
    } catch (err) {
```

- [ ] **Step 11: 型別檢查確認建置通過**

Run: `npm run build`
Expected: 建置成功，無 TypeScript 錯誤（`ReconciliationView.tsx` 呼叫 `previewSettle`／`submitSettle`／`submitSingleSettle` 處會因缺少新的必填 `balanceUsed` 而報錯——這是預期的，會在 Task 4 補上；若此步驟發現 `SettlementEditDialog.tsx` 或其他非 `ReconciliationView.tsx` 的呼叫端報錯，代表遺漏修正，須一併補上才能繼續）。

- [ ] **Step 12: Commit**

```bash
git add src/api/types.ts src/features/reconciliation/settle.ts src/features/ledger/transaction/components/SettlementEditDialog.tsx
git commit -m "feat(reconciliation): 擴充沖帳 API 型別支援 isDefault／ledgerUuids／balanceUsed"
```

（此 commit 之後、Task 4 完成之前，`ReconciliationView.tsx` 會處於編譯失敗狀態，這是本計畫刻意的暫時狀態；Task 4 會補齊呼叫端。）

---

### Task 2: `ReconTxnList` 選取圓圈擴大支援多筆沖帳

**Files:**
- Modify: `src/features/reconciliation/components/ReconTxnList.tsx`

**Interfaces:**
- Consumes: `ReconMode`（已存在，`'single' | 'multi' | 'summary'`），`ReconTxnListProps.selectedUuids: Set<string>` 與 `onToggleSelect: (uuid: string) => void`（型別不變，僅擴大套用範圍）。
- Produces: 無新對外介面，僅擴大既有 `mode === 'single'` 判斷為「單筆或多筆沖帳皆可勾選」，供 Task 4 的 `ReconciliationView` 在 `mode === 'multi'` 時也能顯示可點擊的選取圓圈。

- [ ] **Step 1: 把 `TxnRow` 內的 `isSingleMode` 改名為 `isSelectable`，並擴大判斷條件**

把（第 106 行）：

```ts
  const isSingleMode = mode === 'single';
```

改為：

```ts
  // 單筆／多筆沖帳皆可勾選（單筆為單選、多筆為複選，由呼叫端 onToggleSelect 決定行為）；匯總沖帳僅唯讀顯示拆帳狀態
  const isSelectable = mode === 'single' || mode === 'multi';
```

- [ ] **Step 2: 把 `TxnRow` 內所有 `isSingleMode` 使用處改為 `isSelectable`**

檔案中共有 5 處使用 `isSingleMode`（第 111、133、139-142、157、161、204 行），全部改名為 `isSelectable`，邏輯不變。例如第 111 行：

```ts
      <div className={cn('flex flex-col gap-2 rounded-lg border border-neutral-blue-gray/30 bg-white p-4 nav:hidden', isSingleMode && selected && 'border-brand-blue bg-brand-blue/5')}>
```

改為：

```ts
      <div className={cn('flex flex-col gap-2 rounded-lg border border-neutral-blue-gray/30 bg-white p-4 nav:hidden', isSelectable && selected && 'border-brand-blue bg-brand-blue/5')}>
```

第 131-150 行區塊（沿用原本 `isSingleMode` 三元判斷邏輯，僅改名）：

```ts
        {showStatusColumn && (
          <div className="flex items-center gap-2">
            {isSelectable ? (
              <SelectCircle checked={selected} onToggle={onToggleSelect} />
            ) : (
              <StatusCircle allocation={allocation} />
            )}
            <span className="text-xs text-neutral-mid">
              {isSelectable
                ? selected
                  ? '已選取此筆'
                  : `待沖 ${fmtCurrency(row.remainingAmount ?? row.amount)}`
                : allocation
                  ? allocation.closed
                    ? '本次已結清'
                    : '本次沖帳後仍有餘額'
                  : '尚未預覽'}
            </span>
          </div>
        )}
```

第 154-159 行（桌機欄位化列的 class）：

```ts
      <div
        className={cn(
          'hidden items-center gap-3 rounded-md px-3 py-2 text-sm nav:flex hover:bg-surface-cream',
          isSelectable && selected && 'bg-brand-blue/5 hover:bg-brand-blue/5',
        )}
      >
```

第 160-166 行（桌機狀態欄）：

```ts
        {showStatusColumn ? (
          isSelectable ? (
            <SelectCircle checked={selected} onToggle={onToggleSelect} />
          ) : (
            <StatusCircle allocation={allocation} />
          )
        ) : (
          <span className="w-5 shrink-0" />
        )}
```

第 204 行（展開面板「待沖金額」顯示條件）：

把：

```ts
            {isSingleMode && row.remainingAmount !== undefined && <InfoRow label="待沖金額" value={fmtCurrency(row.remainingAmount)} />}
```

改為：

```ts
            {isSelectable && row.remainingAmount !== undefined && <InfoRow label="待沖金額" value={fmtCurrency(row.remainingAmount)} />}
```

- [ ] **Step 3: 表頭「選取」文字擴大顯示條件**

把（第 251 行）：

```ts
        <span className={cn(HEADER_CLASS, 'w-5 shrink-0')}>{showStatusColumn && mode === 'single' ? '選取' : ''}</span>
```

改為：

```ts
        <span className={cn(HEADER_CLASS, 'w-5 shrink-0')}>{showStatusColumn && (mode === 'single' || mode === 'multi') ? '選取' : ''}</span>
```

- [ ] **Step 4: 更新 `SelectCircle` 與元件說明註解（第 72-74、217-226 行）**

把（第 72-74 行）：

```ts
/** 選取圓圈：單筆沖帳模式用，可點擊勾選要沖帳的那一筆交易（單選） */
function SelectCircle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return <Checkbox checked={checked} shape="circle" onChange={onToggle} aria-label="選取此筆進行沖帳" />;
}
```

改為：

```ts
/** 選取圓圈：單筆／多筆沖帳模式用，可點擊勾選要沖帳的交易（單筆模式單選、多筆模式複選，由呼叫端 onToggleSelect 決定行為） */
function SelectCircle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return <Checkbox checked={checked} shape="circle" onChange={onToggle} aria-label="選取此筆進行沖帳" />;
}
```

把（第 217-226 行 JSDoc 中的這一段）：

```
 * - 單筆沖帳（mode='single'）：狀態欄改為可點擊的選取圓圈（單選），由使用者自行勾選要沖帳的一筆交易。
```

改為：

```
 * - 單筆沖帳（mode='single'）：狀態欄改為可點擊的選取圓圈（單選），由使用者自行勾選要沖帳的一筆交易。
 * - 多筆沖帳（mode='multi'）：狀態欄同樣是可點擊的選取圓圈，但為複選，由使用者勾選多筆要沖帳的交易。
```

- [ ] **Step 5: 型別檢查確認建置通過，並確認無殘留舊名稱**

Run: `npm run build`
Expected: 建置成功，無 TypeScript 錯誤與未使用變數警告。

Run: `grep -n "isSingleMode" src/features/reconciliation/components/ReconTxnList.tsx`
Expected: 無輸出（代表已全部改名完畢）。

- [ ] **Step 6: Commit**

```bash
git add src/features/reconciliation/components/ReconTxnList.tsx
git commit -m "feat(reconciliation): 交易清單選取圓圈擴大支援多筆沖帳複選"
```

---

### Task 3: `ReconPoolPanel` 啟用「多筆沖帳」分頁、已選筆數摘要，「本次抵銷」欄位支援可編輯

**Files:**
- Modify: `src/features/reconciliation/components/ReconPoolPanel.tsx`

**Interfaces:**
- Produces: `ReconPoolPanelProps` 新增可選欄位 `selectedCount?: number`（預設 `0`）與 `onBalanceUsedChange?: (value: number) => void`（省略時「本次抵銷」欄位維持唯讀，供尚未串接的呼叫端相容）。Task 4 的 `ReconciliationView` 會傳入 `selectedCount={selectedMultiUuids.size}` 與 `onBalanceUsedChange={handleBalanceUsedChange}`，並讓 `offsetAmount` prop 改帶使用者於「本次抵銷」欄位輸入的 `balanceUsed` state（而非目前由預覽結果反推的唯讀值）。

- [ ] **Step 1: 移除「多筆沖帳」分頁的停用狀態**

把（第 17-21 行）：

```ts
const MODE_OPTIONS: { value: ReconMode; label: string; disabled?: boolean; hint?: string }[] = [
  { value: 'single', label: '單筆沖帳' },
  { value: 'multi', label: '多筆沖帳', disabled: true, hint: '待後端提供多筆沖帳預覽 API 後開放' },
  { value: 'summary', label: '匯總沖帳' },
];
```

改為：

```ts
const MODE_OPTIONS: { value: ReconMode; label: string; disabled?: boolean; hint?: string }[] = [
  { value: 'single', label: '單筆沖帳' },
  { value: 'multi', label: '多筆沖帳' },
  { value: 'summary', label: '匯總沖帳' },
];
```

- [ ] **Step 2: 新增 `selectedCount` 與 `onBalanceUsedChange` prop**

把（第 29-42 行）：

```ts
interface ReconPoolPanelProps {
  mode: ReconMode;
  onModeChange: (mode: ReconMode) => void;
  side: ReconSide;

  /** 單筆沖帳模式下目前勾選的交易；未勾選為 null */
  selectedRow: ReconTxnRef | null;
  onClearSelection: () => void;

  /** 該群組名稱與當前餘額；「全部管道」或前端合成的「其他」無對應實體時 balance 為 undefined，整塊不顯示 */
  balanceLabel: string;
  balance?: number;
  /** 本次沖帳實際動用的餘額（balanceBefore − balanceAfter），僅供顯示，無預覽/確認結果時為 0 */
  offsetAmount: number;
```

改為：

```ts
interface ReconPoolPanelProps {
  mode: ReconMode;
  onModeChange: (mode: ReconMode) => void;
  side: ReconSide;

  /** 單筆沖帳模式下目前勾選的交易；未勾選為 null */
  selectedRow: ReconTxnRef | null;
  /** 多筆沖帳模式下目前已勾選的交易筆數；未使用多筆沖帳的呼叫端可省略，預設 0 */
  selectedCount?: number;
  onClearSelection: () => void;

  /** 該群組名稱與當前餘額；「全部管道」或前端合成的「其他」無對應實體時 balance 為 undefined，整塊不顯示 */
  balanceLabel: string;
  balance?: number;
  /**
   * 本次沖帳使用的餘額（元），會一併帶入預覽/執行 API 的 balanceUsed 參數。
   * 有傳入 onBalanceUsedChange 時此欄位可編輯，由使用者決定要用多少餘額；
   * 省略 onBalanceUsedChange 時維持唯讀顯示，供尚未串接的呼叫端相容。
   */
  offsetAmount: number;
  onBalanceUsedChange?: (value: number) => void;
```

- [ ] **Step 3: 函式簽名解構新增對應參數**

把（第 80-85 行）：

```ts
export default function ReconPoolPanel({
  mode,
  onModeChange,
  side,
  selectedRow,
  onClearSelection,
```

改為：

```ts
export default function ReconPoolPanel({
  mode,
  onModeChange,
  side,
  selectedRow,
  selectedCount = 0,
  onClearSelection,
```

把（第 88-89 行）：

```ts
  balanceLabel,
  balance,
  offsetAmount,
```

改為：

```ts
  balanceLabel,
  balance,
  offsetAmount,
  onBalanceUsedChange,
```

- [ ] **Step 4: 新增多筆沖帳已選筆數摘要區塊**

把（第 122-145 行）：

```tsx
      {mode === 'single' && (
        <div className="mt-3 border-t border-neutral-blue-gray/20 pt-3">
          {selectedRow ? (
            <div className="flex items-center justify-between gap-2 rounded-md bg-surface-cream p-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-dark">
                  {selectedRow.date} · {side === 'payable' ? selectedRow.summary || '—' : selectedRow.counterparty || '—'}
                </p>
                <p className="text-xs text-neutral-mid">待沖 {fmtCurrency(selectedRow.remainingAmount ?? selectedRow.amount)}</p>
              </div>
              <button
                type="button"
                onClick={onClearSelection}
                aria-label="清除已選交易"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-mid transition-colors hover:bg-white hover:text-semantic-error"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <p className="text-sm text-neutral-mid">請從下方清單勾選一筆交易</p>
          )}
        </div>
      )}
```

改為：

```tsx
      {mode === 'single' && (
        <div className="mt-3 border-t border-neutral-blue-gray/20 pt-3">
          {selectedRow ? (
            <div className="flex items-center justify-between gap-2 rounded-md bg-surface-cream p-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-dark">
                  {selectedRow.date} · {side === 'payable' ? selectedRow.summary || '—' : selectedRow.counterparty || '—'}
                </p>
                <p className="text-xs text-neutral-mid">待沖 {fmtCurrency(selectedRow.remainingAmount ?? selectedRow.amount)}</p>
              </div>
              <button
                type="button"
                onClick={onClearSelection}
                aria-label="清除已選交易"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-mid transition-colors hover:bg-white hover:text-semantic-error"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <p className="text-sm text-neutral-mid">請從下方清單勾選一筆交易</p>
          )}
        </div>
      )}

      {mode === 'multi' && (
        <div className="mt-3 border-t border-neutral-blue-gray/20 pt-3">
          {selectedCount > 0 ? (
            <div className="flex items-center justify-between gap-2 rounded-md bg-surface-cream p-3 text-sm">
              <span className="font-medium text-neutral-dark">已選取 {selectedCount} 筆交易</span>
              <button
                type="button"
                onClick={onClearSelection}
                aria-label="清除所有已選交易"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-mid transition-colors hover:bg-white hover:text-semantic-error"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <p className="text-sm text-neutral-mid">請從下方清單勾選要沖帳的交易（可複選）</p>
          )}
        </div>
      )}
```

- [ ] **Step 5: 「本次抵銷」欄位改為視 `onBalanceUsedChange` 是否存在決定可否編輯**

把（第 147-159 行）：

```tsx
      {balance !== undefined && (
        <div className="mt-3 flex flex-col gap-2 border-t border-neutral-blue-gray/20 pt-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-neutral-dark">
              目前 {balanceLabel} 餘額剩餘 <span className="font-mono font-semibold tabular-nums">{fmtCurrency(balance)}</span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-neutral-dark">本次抵銷</span>
            <MoneyInput widthClassName="w-36" value={offsetAmount} readOnly />
          </div>
        </div>
      )}
```

改為：

```tsx
      {balance !== undefined && (
        <div className="mt-3 flex flex-col gap-2 border-t border-neutral-blue-gray/20 pt-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-neutral-dark">
              目前 {balanceLabel} 餘額剩餘 <span className="font-mono font-semibold tabular-nums">{fmtCurrency(balance)}</span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-neutral-dark">本次抵銷</span>
            <MoneyInput widthClassName="w-36" value={offsetAmount} onChange={onBalanceUsedChange} readOnly={!onBalanceUsedChange} />
          </div>
        </div>
      )}
```

- [ ] **Step 6: 型別檢查確認建置通過**

Run: `npm run build`
Expected: 建置成功，無 TypeScript 錯誤（`selectedCount`／`onBalanceUsedChange` 皆為可選欄位，既有呼叫端 `ReconciliationView.tsx` 不需同步修改——`offsetAmount` prop 名稱與型別不變——也能通過建置；`MoneyInput` 的 `onChange` prop 本身即為可選，傳入 `undefined` 型別相容）。

- [ ] **Step 7: Commit**

```bash
git add src/features/reconciliation/components/ReconPoolPanel.tsx
git commit -m "feat(reconciliation): 啟用多筆沖帳分頁，本次抵銷欄位支援可編輯使用餘額"
```

---

### Task 4: `ReconciliationView` 串接多選狀態、使用餘額欄位與試算／送出流程

**Files:**
- Modify: `src/features/reconciliation/ReconciliationView.tsx`
- Modify: `src/features/reconciliation/types.ts:5-11`（`ReconMode` 文件註解）

**Interfaces:**
- Consumes: Task 1 的 `previewSettle(params: PreviewParams)`／`submitSettle(params: SummaryParams)`／`submitSingleSettle(params: SingleSettleParams)`（三者皆新增必填 `balanceUsed: number`，`previewSettle` 另有可選 `ledgerUuids`／`isDefault`）；Task 2 的 `ReconTxnList` 在 `mode === 'multi'` 時可勾選；Task 3 的 `ReconPoolPanel` 已啟用 `multi` 分頁、接受 `selectedCount` prop，且 `onBalanceUsedChange` 有值時「本次抵銷」欄位（`offsetAmount` prop）變為可編輯。
- Produces: 無新對外介面（此頁面為葉節點路由元件），僅為最終使用者可見的完整多筆沖帳與使用餘額互動流程。此 task 完成後，Task 1 因新增必填 `balanceUsed` 而暫時中斷的建置會恢復正常。

- [ ] **Step 1: 更新 `types.ts` 的 `ReconMode` 文件註解**

把（`src/features/reconciliation/types.ts` 第 5-11 行）：

```ts
/**
 * 沖帳操作模式：
 * - single：單筆沖帳，走手動沖帳 API（settleReceivable／settlePayable，reconMethod=0），
 *   事後可在交易明細頁用 SettlementEditDialog 編輯金額；不限定管道／廠商，「全部管道」「其他」亦可操作。
 * - multi：多筆沖帳，勾選多筆後試算並沖帳；待後端提供吃 ledgerUuids 的多筆預覽 API 後才開放，本輪僅顯示分頁但停用。
 * - summary：匯總沖帳，沿用既有 settle/preview + settle/summary 流程（reconMethod=2），僅能整批恢復。
 */
export type ReconMode = 'single' | 'multi' | 'summary';
```

改為：

```ts
/**
 * 沖帳操作模式：
 * - single：單筆沖帳，走手動沖帳 API（settleReceivable／settlePayable，reconMethod=0），
 *   事後可在交易明細頁用 SettlementEditDialog 編輯金額；不限定管道／廠商，「全部管道」「其他」亦可操作。
 * - multi：多筆沖帳，使用者勾選多筆交易後試算並沖帳；與 summary 共用 settle/preview + settle/summary API，
 *   差別僅在於帶入使用者勾選的 ledgerUuids 與 isDefault=false（summary 固定 isDefault=true、ledgerUuids=[]，
 *   由後端自動拆帳），需先於左側選擇明確銷售管道／廠商。
 * - summary：匯總沖帳，沿用既有 settle/preview + settle/summary 流程（reconMethod=2），僅能整批恢復。
 */
export type ReconMode = 'single' | 'multi' | 'summary';
```

- [ ] **Step 2: 新增多選與使用餘額 state**

把（`ReconciliationView.tsx` 第 89-90 行）：

```ts
  // 單筆沖帳模式勾選的交易 uuid；僅會有 0～1 筆（單選）
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
```

改為：

```ts
  // 單筆沖帳模式勾選的交易 uuid；僅會有 0～1 筆（單選）
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  // 多筆沖帳模式勾選的交易 uuid 集合（複選）
  const [selectedMultiUuids, setSelectedMultiUuids] = useState<Set<string>>(new Set());
  // 本次沖帳使用的餘額（元），對應 ReconPoolPanel「本次抵銷」欄位，單筆／多筆／匯總沖帳共用同一個輸入狀態
  const [balanceUsed, setBalanceUsed] = useState(0);
```

- [ ] **Step 3: 移除舊有的 `offsetAmount` 唯讀推算變數**

把（第 247-248 行）：

```ts
  // 本次沖帳實際動用的餘額，僅匯總沖帳有預覽結果時才能算出；單筆／多筆模式無預覽概念，固定顯示 0
  const offsetAmount = mode === 'summary' && previewResult ? previewResult.balanceBefore - previewResult.balanceAfter : 0;
```

直接刪除這兩行（原本傳給 `ReconPoolPanel` 的 `offsetAmount` prop 改在 Step 12 直接帶入新的 `balanceUsed` state）。

- [ ] **Step 4: `resetInputs` 一併清空多選與使用餘額狀態**

把（第 250-265 行）：

```ts
  const resetInputs = () => {
    setStatementAmount(0);
    setFeeAmount(0);
    setOtherDeductions([]);
    setPreviewResult(null);
    setPreviewError('');
    setSubmitError('');
    setConfirmSummaryOpen(false);
    setSurplusOpen(false);
    setSingleActionError('');
    setSingleConfirmOpen(false);
    setSubmittedInfo(null);
    setExpandedUuid(null);
    setSettleResultOpen(false);
    setSelectedUuid(null);
  };
```

改為：

```ts
  const resetInputs = () => {
    setStatementAmount(0);
    setFeeAmount(0);
    setOtherDeductions([]);
    setBalanceUsed(0);
    setPreviewResult(null);
    setPreviewError('');
    setSubmitError('');
    setConfirmSummaryOpen(false);
    setSurplusOpen(false);
    setSingleActionError('');
    setSingleConfirmOpen(false);
    setSubmittedInfo(null);
    setExpandedUuid(null);
    setSettleResultOpen(false);
    setSelectedUuid(null);
    setSelectedMultiUuids(new Set());
  };
```

- [ ] **Step 5: 移除多筆沖帳分頁的防禦性擋下**

把（第 273-277 行）：

```ts
  const handleModeChange = (next: ReconMode) => {
    if (next === 'multi') return; // 分頁本輪停用，防禦性擋下
    setMode(next);
    resetInputs();
  };
```

改為：

```ts
  const handleModeChange = (next: ReconMode) => {
    setMode(next);
    resetInputs();
  };
```

- [ ] **Step 6: `selectedUuids` 依模式回傳單選或複選集合**

把（第 235 行）：

```ts
  const selectedUuids = useMemo(() => new Set(selectedUuid ? [selectedUuid] : []), [selectedUuid]);
```

改為：

```ts
  const selectedUuids = useMemo(() => {
    if (mode === 'multi') return selectedMultiUuids;
    return new Set(selectedUuid ? [selectedUuid] : []);
  }, [mode, selectedMultiUuids, selectedUuid]);
```

- [ ] **Step 7: 新增多選清除函式與使用餘額變更處理，並讓 `handleToggleSelect` 依模式分流**

把（第 315-336 行）：

```ts
  // 單筆沖帳模式：換一筆交易（或清除選取）時金額歸零，避免延用上一筆的金額
  const clearSingleSelection = () => {
    setSelectedUuid(null);
    setStatementAmount(0);
    setFeeAmount(0);
    setOtherDeductions([]);
    setSingleActionError('');
    setSubmitError('');
  };
  // 切換勾選：單選，再點一次已勾選的列即取消
  const handleToggleSelect = (uuid: string) => {
    if (selectedUuid === uuid) {
      clearSingleSelection();
      return;
    }
    setSelectedUuid(uuid);
    setStatementAmount(0);
    setFeeAmount(0);
    setOtherDeductions([]);
    setSingleActionError('');
    setSubmitError('');
  };
```

改為：

```ts
  // 單筆沖帳模式：換一筆交易（或清除選取）時金額歸零，避免延用上一筆的金額（含使用餘額，因該筆交易換了，先前輸入的使用餘額不應延用）
  const clearSingleSelection = () => {
    setSelectedUuid(null);
    setStatementAmount(0);
    setFeeAmount(0);
    setOtherDeductions([]);
    setBalanceUsed(0);
    setSingleActionError('');
    setSubmitError('');
  };
  // 多筆沖帳模式：清除全部已勾選交易與試算結果；金額與使用餘額是使用者對整批交易的輸入，維持不歸零
  const clearMultiSelection = () => {
    setSelectedMultiUuids(new Set());
    clearComputedState();
  };
  // 切換勾選：single 為單選（再點一次已勾選的列即取消，並重置金額與使用餘額）；multi 為複選（累加/移除 uuid，
  // 保留使用者已輸入的金額與使用餘額，僅清除試算結果，因為使用者通常會先勾好多筆再統一輸入對帳單金額）
  const handleToggleSelect = (uuid: string) => {
    if (mode === 'multi') {
      setSelectedMultiUuids(prev => {
        const next = new Set(prev);
        if (next.has(uuid)) next.delete(uuid);
        else next.add(uuid);
        return next;
      });
      clearComputedState();
      return;
    }
    if (selectedUuid === uuid) {
      clearSingleSelection();
      return;
    }
    setSelectedUuid(uuid);
    setStatementAmount(0);
    setFeeAmount(0);
    setOtherDeductions([]);
    setBalanceUsed(0);
    setSingleActionError('');
    setSubmitError('');
  };
  // 使用餘額（本次抵銷）欄位變更：與手續費／額外金額同樣視為影響試算結果的輸入，變更後清除舊試算結果
  const handleBalanceUsedChange = (value: number) => {
    setBalanceUsed(value);
    clearComputedState();
  };
```

`clearComputedState` 已於本檔案第 285-290 行定義（在 `handleToggleSelect` 之前），可直接使用。

- [ ] **Step 8: `validateAmountInputs` 加入使用餘額不可超過目前餘額的檢查**

把（第 338-345 行）：

```ts
  // 金額輸入共用驗證：對帳單金額（或沖帳金額）需大於 0、實際存入/付出不可為負、額外金額須填完整、需選收/付款日
  const validateAmountInputs = (): string => {
    if (statementAmount <= 0) return `請先輸入${mode === 'single' ? '沖帳' : '對帳單'}金額`;
    if (depositAmount < 0) return `實際${side === 'payable' ? '付出' : '存入'}金額不可為負，請確認手續費與額外金額`;
    if (otherDeductions.some(r => !r.subject?.id || !r.name.trim() || r.amount === 0)) return '請完整填寫額外金額的科目、名稱與金額';
    if (!paymentDate) return side === 'payable' ? '請先選擇付款日' : '請先選擇收款日';
    return '';
  };
```

改為：

```ts
  // 金額輸入共用驗證：對帳單金額（或沖帳金額）需大於 0、實際存入/付出不可為負、額外金額須填完整、使用餘額不可超過目前餘額、需選收/付款日
  const validateAmountInputs = (): string => {
    if (statementAmount <= 0) return `請先輸入${mode === 'single' ? '沖帳' : '對帳單'}金額`;
    if (depositAmount < 0) return `實際${side === 'payable' ? '付出' : '存入'}金額不可為負，請確認手續費與額外金額`;
    if (otherDeductions.some(r => !r.subject?.id || !r.name.trim() || r.amount === 0)) return '請完整填寫額外金額的科目、名稱與金額';
    if (selectedGroup?.balance !== undefined && balanceUsed > selectedGroup.balance) return '使用餘額不可超過目前餘額';
    if (!paymentDate) return side === 'payable' ? '請先選擇付款日' : '請先選擇收款日';
    return '';
  };
```

- [ ] **Step 9: `handlePreview` 依模式帶入 `ledgerUuids`／`isDefault`，並帶入 `balanceUsed`**

把（第 347-375 行）：

```ts
  // 匯總沖帳：預覽拆帳（isBalance 固定帶 false，僅作試算用途）：成功後若有差額立即彈出三選一提示，無差額則等待使用者按「確認沖帳」
  const handlePreview = async () => {
    if (!selectedGroupKey || !isKnownChannel) return;
    const err = validateAmountInputs();
    if (err) {
      setPreviewError(err);
      return;
    }
    setPreviewLoading(true);
    setPreviewError('');
    try {
      const result = await previewSettle({
        side,
        groupUuid: selectedGroupKey,
        settleAmount: statementAmount,
        actualAmount: depositAmount,
        isBalance: false,
        feeAmount,
        otherDeductions,
      });
      setPreviewResult(result);
      // 差額判斷邏輯同 hasDiff（見上方註解），須以逐筆拆帳狀態為準，不能只比較 settleAmount 與 totalBeforeRemaining
      if (result.allocations.some(a => a.settlementStatus !== 0)) setSurplusOpen(true);
    } catch (err) {
      setPreviewError(getFriendlyErrorMessage(err));
    } finally {
      setPreviewLoading(false);
    }
  };
```

改為：

```ts
  // 匯總／多筆沖帳：預覽拆帳（isBalance 固定帶 false，僅作試算用途）：成功後若有差額立即彈出三選一提示，無差額則等待使用者按「確認沖帳」
  // 匯總沖帳不帶 ledgerUuids／isDefault（等同 isDefault=true，由後端自動拆帳）；多筆沖帳明確帶入使用者勾選的 ledgerUuids 與 isDefault=false
  const handlePreview = async () => {
    if (!selectedGroupKey || !isKnownChannel) return;
    if (mode === 'multi' && selectedMultiUuids.size === 0) return;
    const err = validateAmountInputs();
    if (err) {
      setPreviewError(err);
      return;
    }
    setPreviewLoading(true);
    setPreviewError('');
    try {
      const result = await previewSettle({
        side,
        groupUuid: selectedGroupKey,
        ledgerUuids: mode === 'multi' ? Array.from(selectedMultiUuids) : [],
        isDefault: mode !== 'multi',
        settleAmount: statementAmount,
        actualAmount: depositAmount,
        balanceUsed,
        isBalance: false,
        feeAmount,
        otherDeductions,
      });
      setPreviewResult(result);
      // 差額判斷邏輯同 hasDiff（見上方註解），須以逐筆拆帳狀態為準，不能只比較 settleAmount 與 totalBeforeRemaining
      if (result.allocations.some(a => a.settlementStatus !== 0)) setSurplusOpen(true);
    } catch (err) {
      setPreviewError(getFriendlyErrorMessage(err));
    } finally {
      setPreviewLoading(false);
    }
  };
```

- [ ] **Step 10: `finalizeSettle` 一併清空多選與使用餘額狀態**

把（第 377-391 行）：

```ts
  // 執行沖帳成功後的共用收尾：清空快取候選清單觸發重新拉取（含最新餘額），並開啟結果彈窗（匯總沖帳專用）
  const finalizeSettle = (result: ReconSettleResult) => {
    if (side === 'receivable') setReceivableData(null);
    else setPayableData(null);
    setStatementAmount(0);
    setFeeAmount(0);
    setOtherDeductions([]);
    setPreviewResult(null);
    setPreviewError('');
    setConfirmSummaryOpen(false);
    setSurplusOpen(false);
    setSubmittedInfo({ matchedCount: result.affectedCount, matchedAmount: result.appliedSettleAmount });
    setSettleResult(result);
    setSettleResultOpen(true);
  };
```

改為：

```ts
  // 執行沖帳成功後的共用收尾：清空快取候選清單觸發重新拉取（含最新餘額），並開啟結果彈窗（匯總／多筆沖帳共用）
  const finalizeSettle = (result: ReconSettleResult) => {
    if (side === 'receivable') setReceivableData(null);
    else setPayableData(null);
    setStatementAmount(0);
    setFeeAmount(0);
    setOtherDeductions([]);
    setBalanceUsed(0);
    setPreviewResult(null);
    setPreviewError('');
    setConfirmSummaryOpen(false);
    setSurplusOpen(false);
    setSelectedMultiUuids(new Set());
    setSubmittedInfo({ matchedCount: result.affectedCount, matchedAmount: result.appliedSettleAmount });
    setSettleResult(result);
    setSettleResultOpen(true);
  };
```

- [ ] **Step 11: `requireSubmitReady` 之後的三個送出函式（無差額直接送出／沖入最後一筆）加入 `balanceUsed`**

把（第 406-429 行）：

```ts
  // 完全平衡（無超沖少沖）時的直接送出：isBalance 送 false 對結果無影響，沿用原始輸入的存入/付出金額
  const handleConfirmNoDiff = async () => {
    if (!requireSubmitReady() || !previewResult) return;
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const result = await submitSettle({
        side,
        ledgerUuids: previewResult.allocations.map(a => a.ledgerUuid),
        settleAmount: statementAmount,
        actualAmount: depositAmount,
        paymentDate: toYyyymmdd(paymentDate),
        bankAccountUuid,
        isBalance: false,
        feeAmount,
        otherDeductions,
      });
      finalizeSettle(result);
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };
```

改為：

```ts
  // 完全平衡（無超沖少沖）時的直接送出：isBalance 送 false 對結果無影響，沿用原始輸入的存入/付出金額
  const handleConfirmNoDiff = async () => {
    if (!requireSubmitReady() || !previewResult) return;
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const result = await submitSettle({
        side,
        ledgerUuids: previewResult.allocations.map(a => a.ledgerUuid),
        settleAmount: statementAmount,
        actualAmount: depositAmount,
        balanceUsed,
        paymentDate: toYyyymmdd(paymentDate),
        bankAccountUuid,
        isBalance: false,
        feeAmount,
        otherDeductions,
      });
      finalizeSettle(result);
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };
```

- [ ] **Step 12: 差額處理 B 選項（留在餘額上）重新預覽與送出時，帶入 `ledgerUuids`／`isDefault`／`balanceUsed`**

把（第 436-472 行）：

```ts
  // B：留在餘額上，帶下次沖帳使用——isBalance=true 下「已結清」的原單分佈與 isBalance=false 不同（見檔案頂端說明），
  // 故重新預覽一次取得正確結果，depositAmount／paymentAmount 改帶「實際沖完整那幾筆金額總和」
  const handleChooseKeepOnBalance = async () => {
    if (!requireSubmitReady() || !selectedGroupKey) return;
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const rePreview = await previewSettle({
        side,
        groupUuid: selectedGroupKey,
        settleAmount: statementAmount,
        actualAmount: depositAmount,
        isBalance: true,
        feeAmount,
        otherDeductions,
      });
      // isBalance=true 時，後端只會沖能「完整結清」的原單——沖不滿的最後一筆會直接排除在 ledgerAllocations 外
      // （不勾選、不異動），差額改記入餘額。故 settleAmount／實際存入(付出)金額都必須改用重新預覽後、
      // 已排除該筆的 appliedSettleAmount／actualAmount，不能沿用使用者原始輸入的對帳單金額。
      const result = await submitSettle({
        side,
        ledgerUuids: rePreview.allocations.map(a => a.ledgerUuid),
        settleAmount: rePreview.appliedSettleAmount,
        actualAmount: rePreview.actualAmount,
        paymentDate: toYyyymmdd(paymentDate),
        bankAccountUuid,
        isBalance: true,
        feeAmount,
        otherDeductions,
      });
      finalizeSettle(result);
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };
```

改為：

```ts
  // B：留在餘額上，帶下次沖帳使用——isBalance=true 下「已結清」的原單分佈與 isBalance=false 不同（見檔案頂端說明），
  // 故重新預覽一次取得正確結果，depositAmount／paymentAmount 改帶「實際沖完整那幾筆金額總和」；
  // 多筆沖帳須沿用原本勾選的 ledgerUuids／isDefault=false，避免重新預覽時擴大到整個管道／廠商的待沖交易
  const handleChooseKeepOnBalance = async () => {
    if (!requireSubmitReady() || !selectedGroupKey) return;
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const rePreview = await previewSettle({
        side,
        groupUuid: selectedGroupKey,
        ledgerUuids: mode === 'multi' ? Array.from(selectedMultiUuids) : [],
        isDefault: mode !== 'multi',
        settleAmount: statementAmount,
        actualAmount: depositAmount,
        balanceUsed,
        isBalance: true,
        feeAmount,
        otherDeductions,
      });
      // isBalance=true 時，後端只會沖能「完整結清」的原單——沖不滿的最後一筆會直接排除在 ledgerAllocations 外
      // （不勾選、不異動），差額改記入餘額。故 settleAmount／實際存入(付出)金額都必須改用重新預覽後、
      // 已排除該筆的 appliedSettleAmount／actualAmount，不能沿用使用者原始輸入的對帳單金額。
      const result = await submitSettle({
        side,
        ledgerUuids: rePreview.allocations.map(a => a.ledgerUuid),
        settleAmount: rePreview.appliedSettleAmount,
        actualAmount: rePreview.actualAmount,
        balanceUsed,
        paymentDate: toYyyymmdd(paymentDate),
        bankAccountUuid,
        isBalance: true,
        feeAmount,
        otherDeductions,
      });
      finalizeSettle(result);
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };
```

- [ ] **Step 13: 差額處理 C 選項（沖入最後一筆）送出時加入 `balanceUsed`**

把（第 474-497 行）：

```ts
  // C：將差額沖入最後一筆交易——沿用目前的預覽結果（isBalance=false），存入/付出金額沿用使用者原始輸入值
  const handleChooseSettleToLast = async () => {
    if (!requireSubmitReady() || !previewResult) return;
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const result = await submitSettle({
        side,
        ledgerUuids: previewResult.allocations.map(a => a.ledgerUuid),
        settleAmount: statementAmount,
        actualAmount: depositAmount,
        paymentDate: toYyyymmdd(paymentDate),
        bankAccountUuid,
        isBalance: false,
        feeAmount,
        otherDeductions,
      });
      finalizeSettle(result);
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };
```

改為：

```ts
  // C：將差額沖入最後一筆交易——沿用目前的預覽結果（isBalance=false），存入/付出金額沿用使用者原始輸入值
  const handleChooseSettleToLast = async () => {
    if (!requireSubmitReady() || !previewResult) return;
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const result = await submitSettle({
        side,
        ledgerUuids: previewResult.allocations.map(a => a.ledgerUuid),
        settleAmount: statementAmount,
        actualAmount: depositAmount,
        balanceUsed,
        paymentDate: toYyyymmdd(paymentDate),
        bankAccountUuid,
        isBalance: false,
        feeAmount,
        otherDeductions,
      });
      finalizeSettle(result);
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };
```

- [ ] **Step 14: 單筆沖帳送出時加入 `balanceUsed`**

把（第 524-552 行）：

```ts
  // 單筆沖帳：走手動沖帳 API（reconMethod=0），允許超沖少沖；成功後清空快取觸發重新拉取，並以橫幅顯示結果
  // （不開結果 modal——手動沖帳 API 回應與 ReconSettleResult 形狀不同，橫幅已足夠）
  const handleConfirmSingleSettle = async () => {
    if (!selectedRow) return;
    setSubmitLoading(true);
    setSubmitError('');
    try {
      await submitSingleSettle({
        side,
        ledgerUuid: selectedRow.uuid,
        settleAmount: statementAmount,
        actualAmount: depositAmount,
        paymentDate: toYyyymmdd(paymentDate),
        bankAccountUuid,
        feeAmount,
        otherDeductions,
      });
      if (side === 'receivable') setReceivableData(null);
      else setPayableData(null);
      setSubmittedInfo({ matchedCount: 1, matchedAmount: statementAmount });
      setStatementAmount(0);
      setFeeAmount(0);
      setOtherDeductions([]);
      setSelectedUuid(null);
      setSingleConfirmOpen(false);
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };
```

改為：

```ts
  // 單筆沖帳：走手動沖帳 API（reconMethod=0），允許超沖少沖；成功後清空快取觸發重新拉取，並以橫幅顯示結果
  // （不開結果 modal——手動沖帳 API 回應與 ReconSettleResult 形狀不同，橫幅已足夠）
  const handleConfirmSingleSettle = async () => {
    if (!selectedRow) return;
    setSubmitLoading(true);
    setSubmitError('');
    try {
      await submitSingleSettle({
        side,
        ledgerUuid: selectedRow.uuid,
        settleAmount: statementAmount,
        actualAmount: depositAmount,
        balanceUsed,
        paymentDate: toYyyymmdd(paymentDate),
        bankAccountUuid,
        feeAmount,
        otherDeductions,
      });
      if (side === 'receivable') setReceivableData(null);
      else setPayableData(null);
      setSubmittedInfo({ matchedCount: 1, matchedAmount: statementAmount });
      setStatementAmount(0);
      setFeeAmount(0);
      setOtherDeductions([]);
      setBalanceUsed(0);
      setSelectedUuid(null);
      setSingleConfirmOpen(false);
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };
```

- [ ] **Step 15: `actionLabel`／`actionDisabled`／`showActionArea` 加入多筆沖帳判斷**

把（第 554-558 行）：

```ts
  const actionLabel =
    mode === 'single' ? (submitLoading ? '沖帳中…' : '確認沖帳') : previewLoading ? '預覽拆帳中…' : '預覽拆帳';
  const actionDisabled = mode === 'single' ? submitLoading || !selectedRow || statementAmount <= 0 : previewLoading || statementAmount <= 0;
  const actionError = mode === 'single' ? singleActionError : previewError;
  const showActionArea = mode === 'single' ? !!selectedRow : canSettle;
```

改為：

```ts
  const actionLabel =
    mode === 'single' ? (submitLoading ? '沖帳中…' : '確認沖帳') : previewLoading ? '預覽拆帳中…' : '預覽拆帳';
  const actionDisabled =
    mode === 'single'
      ? submitLoading || !selectedRow || statementAmount <= 0
      : mode === 'multi'
        ? previewLoading || statementAmount <= 0 || selectedMultiUuids.size === 0
        : previewLoading || statementAmount <= 0;
  const actionError = mode === 'single' ? singleActionError : previewError;
  const showActionArea = mode === 'single' ? !!selectedRow : mode === 'multi' ? canSettle && selectedMultiUuids.size > 0 : canSettle;
```

- [ ] **Step 16: 「全部管道」與「無對應管道」提示訊息擴大適用於多筆沖帳**

把（第 597-607 行）：

```tsx
                {mode === 'summary' && isAllGroup && (
                  <div className="rounded-md border border-neutral-blue-gray/30 bg-surface-cream p-3 text-sm text-neutral-mid">
                    「全部管道」為唯讀總覽，匯總沖帳需先於左側選擇單一銷售管道／廠商；若要沖銷單一交易，可改用上方「單筆沖帳」
                  </div>
                )}

                {mode === 'summary' && !isAllGroup && !canSettle && (
                  <div className="rounded-md border border-neutral-blue-gray/30 bg-surface-cream p-3 text-sm text-neutral-mid">
                    此分類無對應{side === 'receivable' ? '銷售管道' : '廠商'}，暫不支援匯總沖帳，可改用單筆沖帳，或於左側切換至實際{side === 'receivable' ? '管道' : '廠商'}
                  </div>
                )}
```

改為：

```tsx
                {mode !== 'single' && isAllGroup && (
                  <div className="rounded-md border border-neutral-blue-gray/30 bg-surface-cream p-3 text-sm text-neutral-mid">
                    「全部管道」為唯讀總覽，{mode === 'multi' ? '多筆' : '匯總'}沖帳需先於左側選擇單一銷售管道／廠商；若要沖銷單一交易，可改用上方「單筆沖帳」
                  </div>
                )}

                {mode !== 'single' && !isAllGroup && !canSettle && (
                  <div className="rounded-md border border-neutral-blue-gray/30 bg-surface-cream p-3 text-sm text-neutral-mid">
                    此分類無對應{side === 'receivable' ? '銷售管道' : '廠商'}，暫不支援{mode === 'multi' ? '多筆' : '匯總'}沖帳，可改用單筆沖帳，或於左側切換至實際{side === 'receivable' ? '管道' : '廠商'}
                  </div>
                )}
```

- [ ] **Step 17: `ReconPoolPanel` 呼叫端傳入 `selectedCount`／`onBalanceUsedChange`，並讓 `onClearSelection` 依模式分流**

把（第 609-642 行）：

```tsx
                <ReconPoolPanel
                  mode={mode}
                  onModeChange={handleModeChange}
                  side={side}
                  selectedRow={mode === 'single' ? selectedRow : null}
                  onClearSelection={clearSingleSelection}
                  balanceLabel={selectedGroupLabel}
                  balance={selectedGroup?.balance}
                  offsetAmount={offsetAmount}
```

改為：

```tsx
                <ReconPoolPanel
                  mode={mode}
                  onModeChange={handleModeChange}
                  side={side}
                  selectedRow={mode === 'single' ? selectedRow : null}
                  selectedCount={selectedMultiUuids.size}
                  onClearSelection={mode === 'multi' ? clearMultiSelection : clearSingleSelection}
                  balanceLabel={selectedGroupLabel}
                  balance={selectedGroup?.balance}
                  offsetAmount={balanceUsed}
                  onBalanceUsedChange={handleBalanceUsedChange}
```

（其餘 props 維持不變。）

- [ ] **Step 18: `ReconPoolSummary`、底部 sticky 操作列、三個彈窗的顯示條件擴大為「非單筆沖帳」**

把（第 646 行）：

```tsx
                  {mode === 'summary' && !isAllGroup && <ReconPoolSummary statementAmount={statementAmount} previewResult={previewResult} />}
```

改為：

```tsx
                  {mode !== 'single' && !isAllGroup && <ReconPoolSummary statementAmount={statementAmount} previewResult={previewResult} />}
```

把（第 668 行）：

```tsx
      {mode === 'summary' && selectedGroupKey && !isAllGroup && previewResult && (
```

改為：

```tsx
      {mode !== 'single' && selectedGroupKey && !isAllGroup && previewResult && (
```

把（第 697-698 行）：

```tsx
      {mode === 'summary' && previewResult && !hasDiff && (
        <ReconConfirmSummaryModal
```

改為：

```tsx
      {mode !== 'single' && previewResult && !hasDiff && (
        <ReconConfirmSummaryModal
```

把（第 710 行）：

```tsx
      {mode === 'summary' && previewResult && (
        <ReconSurplusModal
```

改為：

```tsx
      {mode !== 'single' && previewResult && (
        <ReconSurplusModal
```

把（第 725 行）：

```tsx
      {mode === 'summary' && (
        <ReconSettleResultModal open={settleResultOpen} side={side} groupLabel={selectedGroupLabel} result={settleResult} onClose={() => setSettleResultOpen(false)} />
      )}
```

改為：

```tsx
      {mode !== 'single' && (
        <ReconSettleResultModal open={settleResultOpen} side={side} groupLabel={selectedGroupLabel} result={settleResult} onClose={() => setSettleResultOpen(false)} />
      )}
```

- [ ] **Step 19: 更新檔案頂端「三種模式」說明註解**

把（第 64-83 行）：

```ts
 * 三種模式：
 * - single（單筆沖帳）：使用者從清單勾選一筆交易，走手動沖帳 API（reconMethod=0），允許超沖少沖，
 *   事後可在交易明細頁編輯金額。不限定必須是明確管道／廠商，「全部管道」「其他」亦可操作。
 * - multi（多筆沖帳）：本輪先不做，分頁顯示但停用，待後端提供吃 ledgerUuids 的多筆預覽 API 後再開放。
 * - summary（匯總沖帳）：沿用既有流程，沖帳對象與拆帳結果一律由後端 settle/preview API 決定
```

改為：

```ts
 * 三種模式：
 * - single（單筆沖帳）：使用者從清單勾選一筆交易，走手動沖帳 API（reconMethod=0），允許超沖少沖，
 *   事後可在交易明細頁編輯金額。不限定必須是明確管道／廠商，「全部管道」「其他」亦可操作。
 * - multi（多筆沖帳）：使用者從清單勾選多筆交易，走與 summary 相同的 settle/preview + settle/summary
 *   流程，差別僅在於預覽時明確帶入使用者勾選的 ledgerUuids 與 isDefault=false（summary 固定
 *   isDefault=true、ledgerUuids=[]，由後端自動拆帳）。需先於左側選擇明確銷售管道／廠商，
 *   下方交易清單的選取圓圈改為可複選勾選（見 ReconTxnList）。
 * - summary（匯總沖帳）：沿用既有流程，沖帳對象與拆帳結果一律由後端 settle/preview API 決定
```

A/B/C 差額處理說明（原第 72-81 行）不需改動（差額三選一的邏輯本身不變，只是現在 multi 模式也會走到）。在整段 JSDoc 結尾補上使用餘額欄位的說明：

把（原第 80-82 行）：

```ts
 *     C 將金額沖入最後一筆交易：以 isBalance=false（沿用原本的預覽結果）呼叫執行 API，
 *       實際存入/付出金額沿用使用者原始輸入值。
 */
```

改為：

```ts
 *     C 將金額沖入最後一筆交易：以 isBalance=false（沿用原本的預覽結果）呼叫執行 API，
 *       實際存入/付出金額沿用使用者原始輸入值。
 *
 * 使用餘額（balanceUsed）：ReconPoolPanel「本次抵銷」欄位，單筆／多筆／匯總沖帳共用同一個輸入框，
 * 使用者輸入後會一併帶入預覽／執行 API 的 balanceUsed 參數，決定該次沖帳要使用多少目前餘額。
 */
```

- [ ] **Step 20: 型別檢查確認建置通過**

Run: `npm run build`
Expected: 建置成功，無 TypeScript 錯誤（此步驟會確認 Task 1 因新增必填 `balanceUsed` 而中斷的建置已恢復正常）。

- [ ] **Step 21: Commit**

```bash
git add src/features/reconciliation/ReconciliationView.tsx src/features/reconciliation/types.ts
git commit -m "feat(reconciliation): 對帳中心啟用多筆沖帳與可編輯使用餘額欄位，重用匯總沖帳流程"
```

---

### Task 5: 手動端到端驗證（無自動化測試框架，比照 CLAUDE.md 開發流程）

**Files:** 無程式碼變更，僅驗證。

- [ ] **Step 1: 啟動開發伺服器**

Run: `npm run dev`
Expected: 伺服器啟動成功，無編譯錯誤。

- [ ] **Step 2: 走查「多筆沖帳」完全平衡路徑**

於瀏覽器開啟 `/ledger/reconciliation`：
1. 於「應收」或「應付」任一側，左側選擇一個有多筆待沖交易、且目前餘額不為 0 的銷售管道／廠商。
2. 頂部分頁點擊「多筆沖帳」——確認分頁不再顯示停用樣式，且可正常切換。
3. 確認上方摘要區塊顯示「請從下方清單勾選要沖帳的交易（可複選）」。
4. 於下方交易清單勾選 2～3 筆交易——確認每筆的選取圓圈皆可個別點擊勾選/取消（複選，不會像單筆模式互斥）。
5. 確認上方摘要區塊改顯示「已選取 N 筆交易」，且「預覽拆帳」按鈕維持停用直到輸入對帳單金額。
6. 輸入與勾選交易待沖總額完全相同的「對帳單金額」，點擊「預覽拆帳」。
7. 確認預覽成功後，下方清單只有「已勾選」的那幾筆交易顯示拆帳狀態徽章／已結清標記，未勾選的其他交易不受影響。
8. 確認底部 sticky 列顯示「本次沖帳 N 筆」且無差額提示，點擊「確認沖帳」→彈出確認彈窗→送出成功後開啟沖帳結果彈窗，且結果彈窗僅列出剛才勾選的 N 筆。
9. 確認送出成功後，已選取的交易從清單中消失或狀態更新（因快取被清空重新拉取），且已選筆數摘要重置為「請從下方清單勾選要沖帳的交易」。

- [ ] **Step 3: 走查「多筆沖帳」有差額路徑（三選一）**

1. 重複步驟 2 的 1-6，但這次輸入的對帳單金額刻意大於或小於勾選交易的待沖總額。
2. 確認預覽成功後自動彈出差額三選一提示（回去檢查／留在餘額上／沖入最後一筆）。
3. 分別測試「回去檢查」（應只關閉彈窗，不呼叫任何 API，勾選與金額維持不變）與「留在餘額上」或「沖入最後一筆」其中一種（應成功送出並開啟結果彈窗）。

- [ ] **Step 4: 走查「使用餘額」（本次抵銷）欄位**

1. 於任一有餘額的銷售管道／廠商下，切到「單筆沖帳」，確認「本次抵銷」欄位不再是唯讀，可輸入數字。
2. 輸入一個大於目前餘額的數字，觸發預覽或確認沖帳時應顯示「使用餘額不可超過目前餘額」錯誤訊息，且不會呼叫任何 API。
3. 輸入一個在餘額範圍內的合理值，完成一次單筆沖帳，確認送出成功（可透過瀏覽器 Network 面板確認請求 body 含正確的 `balanceUsed` 值）。
4. 切到「匯總沖帳」與「多筆沖帳」，分別確認「本次抵銷」欄位同樣可編輯，且預覽／確認沖帳的請求 body 皆含使用者輸入的 `balanceUsed` 值。
5. 確認切換管道／廠商、切換模式、或送出成功後，「本次抵銷」欄位會重置為 0。

- [ ] **Step 5: 確認「全部管道」與未知分類下多筆沖帳的防呆訊息**

1. 左側切換到「全部管道」，頂部分頁選「多筆沖帳」——確認顯示「『全部管道』為唯讀總覽，多筆沖帳需先於左側選擇單一銷售管道／廠商」提示，且下方清單維持唯讀（無法勾選，因 `showStatusColumn` 為 false）。

- [ ] **Step 6: 回歸測試「單筆沖帳」與「匯總沖帳」既有行為未受影響**

1. 切回「單筆沖帳」分頁，確認勾選行為仍是單選（點另一筆會取消前一筆），送出流程與 UI 文案除「本次抵銷」變為可編輯外，與改動前一致。
2. 切到「匯總沖帳」分頁，確認清單狀態圓圈維持唯讀（不可點擊），且完整走一次預覽→確認沖帳流程，行為與改動前一致（因為 `previewSettle` 在省略 `ledgerUuids`／`isDefault` 時的行為等同原本呼叫方式）。

- [ ] **Step 7: 走查 `SettlementEditDialog`（交易明細頁「編輯沖帳金額」）未受影響**

1. 於任一已沖帳交易的明細頁，開啟「編輯沖帳金額」對話框，完整走一次「儲存並重新沖帳」流程，確認送出成功（此對話框固定送 `balanceUsed: 0`，行為應與改動前一致，無需任何 UI 變更）。

- [ ] **Step 8: 最終建置檢查**

Run: `npm run build`
Expected: 建置成功，無 TypeScript 錯誤或警告。

- [ ] **Step 9: Commit（若走查過程有修正任何問題）**

若步驟 2-7 發現任何需要修正的問題，修正後個別提交；若走查全數通過且無需修正，此 task 不需額外 commit。
