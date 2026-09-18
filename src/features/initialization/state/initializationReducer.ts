'use client';

// ==================== 類型定義 ====================

export type SubStepType = 'A' | 'B' | null;

/** 上傳文件分類，對應 3A 五張 dropzone */
export type DocumentCategory =
  | 'incomeTaxReport' // 營所稅結算申報書（主來源）
  | 'businessTax401' // 401 營業稅申報書
  | 'invoiceExcel' // 財政部進銷項 Excel
  | 'bankStatement' // 銀行對帳單
  | 'companyRegistration'; // 公司登記資料

export type DocumentStatus = 'empty' | 'uploading' | 'recognizing' | 'done' | 'error';

export interface DocumentSlot {
  status: DocumentStatus;
  fileName: string | null;
  errorMessage: string | null;
}

/** 期初表單一欄位：值與是否由文件辨識帶入（尚未被使用者修改） */
export interface BalanceField {
  value: number;
  aiFilled: boolean;
}

function emptyField(value = 0): BalanceField {
  return { value, aiFilled: false };
}

export interface OpeningBalanceAssets {
  cash: BalanceField;
  bankDeposits: BalanceField;
  accountsReceivable: BalanceField;
  inventory: BalanceField;
  businessTaxCredit: BalanceField;
  fixedAssets: BalanceField;
}

export interface OpeningBalanceLiabilities {
  accountsPayable: BalanceField;
  shortTermLoans: BalanceField;
  /** 業主往來：借貸不平衡時，「一鍵計入業主往來」套用差額的目標欄位 */
  ownerCurrentAccount: BalanceField;
}

export interface OpeningBalanceEquity {
  registeredCapital: BalanceField;
  retainedEarnings: BalanceField;
}

export type BalanceGroup = 'assets' | 'liabilities' | 'equity';

export interface InitializationState {
  currentStep: number;
  currentSubStep: SubStepType;

  /**
   * 串接身分用的使用者識別碼，沿用 onboarding Step6Plan 產生的 userUuid（見 Step8Checkout）。
   * 登入機制上線前由 URL ?uuid= 帶入；之後可改由登入 session 取得。
   */
  userUuid: string;

  // 步驟 1
  termsAgreed: boolean;

  // 步驟 2
  company: {
    taxId: string;
    name: string;
    representative: string;
    address: string;
    industryId: string;
    industryName: string;
    isOperating: boolean;
    openDate: string; // YYYY-MM-DD
  };

  // 步驟 3A
  documents: Record<DocumentCategory, DocumentSlot>;
  /** 使用者選擇「稍後再設定」跳過期初資料 */
  openingBalanceSkipped: boolean;

  // 步驟 3B
  openingBalance: {
    /** 開帳基準日（YYYY-MM-DD），於步驟 2 直接選擇，日後仍可在此步驟調整 */
    baseDate: string;
    assets: OpeningBalanceAssets;
    liabilities: OpeningBalanceLiabilities;
    equity: OpeningBalanceEquity;
  };

  // 步驟 5
  completed: boolean;
}

// ==================== 初始狀態 ====================

export const initialState: InitializationState = {
  currentStep: 1,
  currentSubStep: null,

  userUuid: '',

  termsAgreed: false,

  company: {
    taxId: '',
    name: '',
    representative: '',
    address: '',
    industryId: '',
    industryName: '',
    isOperating: false,
    openDate: '',
  },

  documents: {
    incomeTaxReport: { status: 'empty', fileName: null, errorMessage: null },
    businessTax401: { status: 'empty', fileName: null, errorMessage: null },
    invoiceExcel: { status: 'empty', fileName: null, errorMessage: null },
    bankStatement: { status: 'empty', fileName: null, errorMessage: null },
    companyRegistration: { status: 'empty', fileName: null, errorMessage: null },
  },
  openingBalanceSkipped: false,

  openingBalance: {
    baseDate: '',
    assets: {
      cash: emptyField(),
      bankDeposits: emptyField(),
      accountsReceivable: emptyField(),
      inventory: emptyField(),
      businessTaxCredit: emptyField(),
      fixedAssets: emptyField(),
    },
    liabilities: {
      accountsPayable: emptyField(),
      shortTermLoans: emptyField(),
      ownerCurrentAccount: emptyField(),
    },
    equity: {
      registeredCapital: emptyField(),
      retainedEarnings: emptyField(),
    },
  },

  completed: false,
};

// ==================== Action 類型 ====================

export type InitializationAction =
  | { type: 'RESTORE_STATE'; payload: InitializationState }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; payload: { step: number; subStep?: SubStepType } }
  | { type: 'SET_USER_UUID'; payload: string }

  // 步驟 1
  | { type: 'AGREE_TERMS' }

  // 步驟 2
  | { type: 'SET_COMPANY'; payload: Partial<InitializationState['company']> }

  // 步驟 3A
  | {
      type: 'SET_DOCUMENT_STATUS';
      payload: { category: DocumentCategory; status: DocumentStatus; fileName: string | null; errorMessage: string | null };
    }
  | { type: 'SKIP_OPENING_BALANCE' }
  | { type: 'START_MANUAL_BALANCE' }

  // 步驟 3B
  | { type: 'SET_BALANCE_BASE_DATE'; payload: string }
  | {
      type: 'APPLY_RECOGNIZED_BALANCE';
      payload: { group: BalanceGroup; fields: Record<string, number> };
    }
  | { type: 'SET_BALANCE_FIELD'; payload: { group: BalanceGroup; key: string; value: number } }
  | { type: 'APPLY_OWNER_ADJUSTMENT'; payload: { amount: number } }

  // 步驟 5
  | { type: 'COMPLETE' };

// ==================== 步驟導航邏輯 ====================
// Stepper 分組（見 Stepper 元件呼叫端）：1=合約　2=公司資料　3(A/B)+4=開帳資料　5=完成

export function getPrevStep(state: InitializationState): { step: number; subStep: SubStepType } {
  switch (state.currentStep) {
    case 2:
      return { step: 1, subStep: null };
    case 3:
      if (state.currentSubStep === 'B') return { step: 3, subStep: 'A' };
      return { step: 2, subStep: null };
    case 4:
      return { step: 3, subStep: 'B' };
    case 5:
      // 跳過期初資料時，完成頁的上一步回到上傳頁而非確認頁（確認頁未曾抵達）
      return state.openingBalanceSkipped ? { step: 3, subStep: 'A' } : { step: 4, subStep: null };
    default:
      return { step: state.currentStep, subStep: state.currentSubStep };
  }
}

export function getNextStep(state: InitializationState): { step: number; subStep: SubStepType } {
  switch (state.currentStep) {
    case 1:
      return { step: 2, subStep: null };
    case 2:
      return { step: 3, subStep: 'A' };
    case 3:
      if (state.currentSubStep === 'A') {
        return state.openingBalanceSkipped ? { step: 5, subStep: null } : { step: 3, subStep: 'B' };
      }
      return { step: 4, subStep: null };
    case 4:
      return { step: 5, subStep: null };
    default:
      return { step: state.currentStep, subStep: state.currentSubStep };
  }
}

// ==================== Reducer ====================

function setBalanceField(
  balance: InitializationState['openingBalance'],
  group: BalanceGroup,
  key: string,
  value: number,
  aiFilled: boolean
): InitializationState['openingBalance'] {
  return {
    ...balance,
    [group]: {
      ...balance[group],
      [key]: { value, aiFilled },
    },
  };
}

export function initializationReducer(state: InitializationState, action: InitializationAction): InitializationState {
  switch (action.type) {
    case 'RESTORE_STATE':
      return { ...initialState, ...action.payload };

    case 'NEXT_STEP': {
      const next = getNextStep(state);
      return { ...state, currentStep: next.step, currentSubStep: next.subStep };
    }

    case 'PREV_STEP': {
      const prev = getPrevStep(state);
      return { ...state, currentStep: prev.step, currentSubStep: prev.subStep };
    }

    case 'GO_TO_STEP':
      return { ...state, currentStep: action.payload.step, currentSubStep: action.payload.subStep ?? null };

    case 'SET_USER_UUID':
      return { ...state, userUuid: action.payload };

    case 'AGREE_TERMS':
      return { ...state, termsAgreed: true };

    case 'SET_COMPANY':
      return { ...state, company: { ...state.company, ...action.payload } };

    case 'SET_DOCUMENT_STATUS':
      return {
        ...state,
        documents: {
          ...state.documents,
          [action.payload.category]: {
            status: action.payload.status,
            fileName: action.payload.fileName,
            errorMessage: action.payload.errorMessage,
          },
        },
      };

    case 'SKIP_OPENING_BALANCE':
      return {
        ...state,
        openingBalanceSkipped: true,
        currentStep: 5,
        currentSubStep: null,
      };

    case 'START_MANUAL_BALANCE':
      return {
        ...state,
        currentStep: 3,
        currentSubStep: 'B',
      };

    case 'SET_BALANCE_BASE_DATE':
      return { ...state, openingBalance: { ...state.openingBalance, baseDate: action.payload } };

    case 'APPLY_RECOGNIZED_BALANCE': {
      let balance = state.openingBalance;
      for (const [key, value] of Object.entries(action.payload.fields)) {
        balance = setBalanceField(balance, action.payload.group, key, value, true);
      }
      return { ...state, openingBalance: balance };
    }

    case 'SET_BALANCE_FIELD':
      return {
        ...state,
        openingBalance: setBalanceField(state.openingBalance, action.payload.group, action.payload.key, action.payload.value, false),
      };

    case 'APPLY_OWNER_ADJUSTMENT':
      return {
        ...state,
        openingBalance: setBalanceField(
          state.openingBalance,
          'liabilities',
          'ownerCurrentAccount',
          state.openingBalance.liabilities.ownerCurrentAccount.value + action.payload.amount,
          false
        ),
      };

    case 'COMPLETE':
      return { ...state, completed: true };

    default:
      return state;
  }
}
