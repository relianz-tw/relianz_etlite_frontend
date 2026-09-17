'use client';

import { formatLocalDate } from '@/lib/utils';

// ==================== 類型定義 ====================

export type SalesModeType = 'physical' | 'online' | 'both';
export type BillingCycleType = 0 | 1; // 0 = 月繳, 1 = 年繳
export type TaxModeType = 'simple' | 'advanced';
export type SubStepType = 'A' | 'B' | null;

/** 進項憑證類型（對應 inBillInfo 的 invoiceType 字串） */
export type InBillType = '發票' | '交通票證' | '水電帳單' | '進口稅單' | '其他';

export interface VoucherRecognizedData {
  /** 1: 銷項  2: 進項 */
  voucherType: number;
  /** 進項憑證細分類型（僅 voucherType=2 時有意義） */
  inBillType: InBillType;
  invoicePrefix: string;
  /** 共用號碼欄位：發票號碼 / 票號 / 變動載具號碼 / 海關代徵號碼 */
  invoiceNumber: string;
  date: string;
  sellerTaxId: string;
  sellerName: string;
  buyerTaxId: string;
  buyerName: string;
  amount: number;
  tax: number;
  /** 進口稅單的其他稅費 */
  others: number;
  total: number;
  /** 免稅銷售額 */
  taxFreeAmount: number;
  /** 交通票證的交通工具 id（對應 src/data/transportation.ts，'0' 表示其他） */
  transportationId: string;
  /** invoice_direction 為 unknown 時為 true，UI 顯示特殊提示但仍套用進項模板 */
  isUnknownDirection?: boolean;
}

export interface VoucherSuggestion {
  id: number;
  category: string;
  accountSubject: string;
  taxInfo: string;
  advice: string;
}

export interface SalaryResult {
  withholding: number;
  laborInsurance: {
    companyAmount: number;
    employeeAmount: number;
  };
  healthInsurance: {
    companyAmount: number;
    employeeAmount: number;
    governmentAmount: number;
  };
  volPension: number;
  nhiSupplementary?: {
    fee: number;
    required: boolean;
  };
}

export interface TaxEstimateResult {
  biPhaselyBusinessTax: { amount: number };
  annualIncomeTax: {
    bookReview: { amount: number };
    documentReview: { amount: number };
  };
}

export interface OnboardingState {
  currentStep: number;
  currentSubStep: SubStepType;

  // 步驟 1
  taxId: string;

  // 步驟 2
  company: {
    name: string;
    representative: string;
    address: string;
    description: string;
    salesMode: SalesModeType | null;
  };

  // 步驟 3
  voucher: {
    skipped: boolean;
    voucherId: string | null;
    previewUrl: string | null;
    isPdf: boolean;
    recognizedData: VoucherRecognizedData | null;
    suggestions: VoucherSuggestion[];
    selectedSuggestionId: number | null;
    sseComplete: boolean;
  };

  // 步驟 4
  salary: {
    fixedSalary: number | null;
    variableSalary: number | null;
    payDate: string;
    overtimePay: number | null;
    mealAllowance: number | null;
    leaveDeduction: number | null;
    selfPension: number | null;
    nhiGradeId: number | null;
    laborGradeId: number | null;
    result: SalaryResult | null;
  };

  // 步驟 5
  tax: {
    mode: TaxModeType;
    simple: {
      industryId: string;
      industryName: string;
      estimatedRevenue: number;
      estimatedProfitRate: number;
    };
    advanced: {
      revenue: number;
      costAndExpense: number;
      employeeSalary: number;
      personalRent: number;
      otherExpense: number;
      expandedAuditProfitRate: number;
    };
    result: TaxEstimateResult | null;
  };

  // 步驟 6
  selectedPlanId: string;
  selectedAddOnCodes: string[];
  billingCycle: BillingCycleType;

  // 步驟 8
  payment: {
    bindCardId: string;
    card6No: string;
    card4No: string;
    cardValidYy: string;
    cardValidMm: string;
  };
  contact: {
    email: string;
    phone: string;
  };

  // 付款流程（步驟 8 → /onboarding/payment/*）
  userUuid: string;
}

// ==================== 初始狀態 ====================

export const initialState: OnboardingState = {
  currentStep: 1,
  currentSubStep: null,

  taxId: '',

  company: {
    name: '',
    representative: '',
    address: '',
    description: '',
    salesMode: null,
  },

  voucher: {
    skipped: false,
    voucherId: null,
    previewUrl: null,
    isPdf: false,
    recognizedData: null,
    suggestions: [],
    selectedSuggestionId: null,
    sseComplete: false,
  },

  salary: {
    fixedSalary: null,
    variableSalary: null,
    payDate: formatLocalDate(new Date()),
    overtimePay: null,
    mealAllowance: null,
    leaveDeduction: null,
    selfPension: null,
    nhiGradeId: null,
    laborGradeId: null,
    result: null,
  },

  tax: {
    mode: 'simple',
    simple: {
      industryId: '',
      industryName: '',
      estimatedRevenue: 0,
      estimatedProfitRate: 0,
    },
    advanced: {
      revenue: 0,
      costAndExpense: 0,
      employeeSalary: 0,
      personalRent: 0,
      otherExpense: 0,
      expandedAuditProfitRate: 7,
    },
    result: null,
  },

  selectedPlanId: '',
  selectedAddOnCodes: [],
  billingCycle: 0,

  payment: {
    bindCardId: '',
    card6No: '',
    card4No: '',
    cardValidYy: '',
    cardValidMm: '',
  },
  contact: {
    email: '',
    phone: '',
  },

  userUuid: '',
};

// ==================== Action 類型 ====================

export type OnboardingAction =
  // 還原整個狀態（從 sessionStorage 讀取後使用）
  | { type: 'RESTORE_STATE'; payload: OnboardingState }

  // 步驟導航
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; payload: { step: number; subStep?: SubStepType } }

  // 步驟 1
  | { type: 'SET_TAX_ID'; payload: string }

  // 步驟 2
  | { type: 'SET_COMPANY'; payload: Partial<OnboardingState['company']> }

  // 步驟 3
  | { type: 'SKIP_VOUCHER' }
  | { type: 'SET_VOUCHER_ID'; payload: string }
  | {
      type: 'SET_VOUCHER_PREVIEW';
      payload: { previewUrl: string | null; isPdf: boolean };
    }
  | {
      type: 'SET_VOUCHER_RECOGNITION_RESULT';
      payload: {
        recognizedData: VoucherRecognizedData;
        suggestions: VoucherSuggestion[];
      };
    }
  | { type: 'SELECT_SUGGESTION'; payload: number }

  // 步驟 4
  | { type: 'SET_SALARY_INPUT'; payload: Partial<OnboardingState['salary']> }
  | { type: 'SET_SALARY_RESULT'; payload: SalaryResult }

  // 步驟 5
  | { type: 'SET_TAX_MODE'; payload: TaxModeType }
  | {
      type: 'SET_TAX_SIMPLE';
      payload: Partial<OnboardingState['tax']['simple']>;
    }
  | {
      type: 'SET_TAX_ADVANCED';
      payload: Partial<OnboardingState['tax']['advanced']>;
    }
  | { type: 'SET_TAX_RESULT'; payload: TaxEstimateResult }

  // 步驟 6
  | { type: 'SET_BILLING_CYCLE'; payload: BillingCycleType }
  | { type: 'SET_SELECTED_PLAN_ID'; payload: string }
  | { type: 'TOGGLE_ADD_ON'; payload: string }

  // 步驟 8
  | { type: 'SET_PAYMENT'; payload: Partial<OnboardingState['payment']> }
  | { type: 'SET_CONTACT'; payload: Partial<OnboardingState['contact']> }
  | { type: 'SET_USER_UUID'; payload: string };

// ==================== 步驟導航邏輯 ====================

export function getPrevStep(state: OnboardingState): {
  step: number;
  subStep: SubStepType;
} {
  switch (state.currentStep) {
    case 2:
      return { step: 1, subStep: null };
    case 3:
      if (state.currentSubStep === 'B') return { step: 3, subStep: 'A' };
      // 若未填統編則跳過 Step 2 直接回 Step 1
      return state.taxId
        ? { step: 2, subStep: null }
        : { step: 1, subStep: null };
    case 4:
      if (state.currentSubStep === 'A') return { step: 3, subStep: 'A' };
      return { step: 4, subStep: 'A' };
    case 5:
      if (state.currentSubStep === 'B') return { step: 5, subStep: 'A' };
      return { step: 4, subStep: 'B' };
    case 6:
      return { step: 5, subStep: 'B' };
    case 8:
      return { step: 6, subStep: null };
    default:
      return { step: state.currentStep, subStep: state.currentSubStep };
  }
}

export function getNextStep(state: OnboardingState): {
  step: number;
  subStep: SubStepType;
} {
  switch (state.currentStep) {
    case 1:
      // 有統編 → 進入公司資訊步驟；無統編 → 跳過直接到上傳憑證
      return state.taxId
        ? { step: 2, subStep: null }
        : { step: 3, subStep: 'A' };
    case 2:
      return { step: 3, subStep: 'A' };
    case 3:
      if (state.currentSubStep === 'A') {
        return state.voucher.skipped
          ? { step: 4, subStep: 'A' }
          : { step: 3, subStep: 'B' };
      }
      return { step: 4, subStep: 'A' };
    case 4:
      if (state.currentSubStep === 'A') return { step: 4, subStep: 'B' };
      return { step: 5, subStep: 'A' };
    case 5:
      if (state.currentSubStep === 'A') return { step: 5, subStep: 'B' };
      return { step: 6, subStep: null };
    case 6:
      return { step: 8, subStep: null };
    default:
      return { step: state.currentStep, subStep: state.currentSubStep };
  }
}

// ==================== Reducer ====================

export function onboardingReducer(
  state: OnboardingState,
  action: OnboardingAction
): OnboardingState {
  switch (action.type) {
    case 'RESTORE_STATE':
      return {
        ...initialState,
        ...action.payload,
        salary: { ...initialState.salary, ...action.payload.salary },
      };

    case 'NEXT_STEP': {
      const next = getNextStep(state);
      return { ...state, currentStep: next.step, currentSubStep: next.subStep };
    }

    case 'PREV_STEP': {
      const prev = getPrevStep(state);
      return { ...state, currentStep: prev.step, currentSubStep: prev.subStep };
    }

    case 'GO_TO_STEP':
      return {
        ...state,
        currentStep: action.payload.step,
        currentSubStep: action.payload.subStep ?? null,
      };

    case 'SET_TAX_ID':
      return { ...state, taxId: action.payload };

    case 'SET_COMPANY':
      return { ...state, company: { ...state.company, ...action.payload } };

    case 'SKIP_VOUCHER':
      return {
        ...state,
        voucher: { ...state.voucher, skipped: true },
        currentStep: 4,
        currentSubStep: 'A',
      };

    case 'SET_VOUCHER_ID':
      return {
        ...state,
        voucher: { ...state.voucher, voucherId: action.payload },
      };

    case 'SET_VOUCHER_PREVIEW':
      return {
        ...state,
        voucher: {
          ...state.voucher,
          previewUrl: action.payload.previewUrl,
          isPdf: action.payload.isPdf,
        },
      };

    case 'SET_VOUCHER_RECOGNITION_RESULT':
      return {
        ...state,
        voucher: {
          ...state.voucher,
          recognizedData: action.payload.recognizedData,
          suggestions: action.payload.suggestions,
          sseComplete: true,
        },
      };

    case 'SELECT_SUGGESTION':
      return {
        ...state,
        voucher: { ...state.voucher, selectedSuggestionId: action.payload },
      };

    case 'SET_SALARY_INPUT':
      return { ...state, salary: { ...state.salary, ...action.payload } };

    case 'SET_SALARY_RESULT':
      return { ...state, salary: { ...state.salary, result: action.payload } };

    case 'SET_TAX_MODE':
      return { ...state, tax: { ...state.tax, mode: action.payload } };

    case 'SET_TAX_SIMPLE':
      return {
        ...state,
        tax: {
          ...state.tax,
          simple: { ...state.tax.simple, ...action.payload },
        },
      };

    case 'SET_TAX_ADVANCED':
      return {
        ...state,
        tax: {
          ...state.tax,
          advanced: { ...state.tax.advanced, ...action.payload },
        },
      };

    case 'SET_TAX_RESULT':
      return { ...state, tax: { ...state.tax, result: action.payload } };

    case 'SET_BILLING_CYCLE':
      // 切換計費週期時清空加購選項（月繳/年繳服務清單不同）
      return { ...state, billingCycle: action.payload, selectedAddOnCodes: [] };

    case 'SET_SELECTED_PLAN_ID':
      return { ...state, selectedPlanId: action.payload };

    case 'TOGGLE_ADD_ON': {
      const code = action.payload;
      const exists = state.selectedAddOnCodes.includes(code);
      return {
        ...state,
        selectedAddOnCodes: exists
          ? state.selectedAddOnCodes.filter(c => c !== code)
          : [...state.selectedAddOnCodes, code],
      };
    }

    case 'SET_PAYMENT':
      return { ...state, payment: { ...state.payment, ...action.payload } };

    case 'SET_CONTACT':
      return { ...state, contact: { ...state.contact, ...action.payload } };

    case 'SET_USER_UUID':
      return { ...state, userUuid: action.payload };

    default:
      return state;
  }
}
