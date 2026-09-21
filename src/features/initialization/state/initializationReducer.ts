'use client';

import { buildEmptyRow, buildInitialReportsState, REPORT_PAGES } from '../reports';
import type { ReportFieldDef } from '../reports/types';

// ==================== 類型定義 ====================

/** 步驟二「請選擇您的營運狀況」，決定是否需要上傳結算申報書並逐頁核對報表 */
export type OperatingStatus = 'under_one_year' | 'over_one_year' | null;

/** 6 份結算申報書報表：cover 併入步驟 3 公司資料頁，其餘 5 份為步驟 4 逐頁核對（見 reports/index.ts） */
export type SettlementReportId = 'cover' | 'incomeStatement' | 'balanceSheet' | 'shareholders' | 'withholdingReconciliation' | 'propertyList';

export type SettlementFileStatus = 'uploading' | 'recognizing' | 'done' | 'error';

/** 使用者上傳的單份結算申報書檔案，逐筆保留原檔名（可上傳多份） */
export interface UploadedSettlementFile {
  id: string;
  fileName: string;
  size: number;
  status: SettlementFileStatus;
  errorMessage: string | null;
}

/** 報表單一欄位值；money/date 欄位以字串或數字存放，aiFilled 沿用既有「AI 填入欄位提示」語意 */
export interface ReportField {
  value: string | number;
  aiFilled: boolean;
}

/** 表格型報表（投資人明細、財產目錄）的一列資料 */
export type ReportRow = Record<string, ReportField>;

export interface ReportData {
  fields: Record<string, ReportField>;
  rows: ReportRow[];
}

export interface InitializationState {
  currentStep: number;
  /** 步驟 4（報表核對）目前顯示第幾份，對應 reports/index.ts 的 REPORT_PAGES 索引（0-4） */
  currentReportIndex: number;

  /**
   * 串接身分用的使用者識別碼，沿用 onboarding Step6Plan 產生的 userUuid（見 Step8Checkout）。
   * 登入機制上線前由 URL ?uuid= 帶入；之後可改由登入 session 取得。
   */
  userUuid: string;

  // 步驟 1
  termsAgreed: boolean;

  // 步驟 2
  operatingStatus: OperatingStatus;
  settlementFiles: UploadedSettlementFile[];

  // 步驟 3：公司基本資料（核心必填欄位，確認頁與 API 皆會用到，故維持強型別；
  // 封面頁其餘補充欄位與右欄營業收入調節說明存於 reports.cover，見 reports/cover.ts）
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
  openingBalance: {
    /** 開帳基準日（YYYY-MM-DD），於步驟 3 直接選擇 */
    baseDate: string;
  };

  // 步驟 3 封面頁補充欄位 + 步驟 4 報表核對資料，key 為 SettlementReportId
  reports: Record<SettlementReportId, ReportData>;

  // 步驟 6
  completed: boolean;
}

// ==================== 初始狀態 ====================

export const initialState: InitializationState = {
  currentStep: 1,
  currentReportIndex: 0,

  userUuid: '',

  termsAgreed: false,

  operatingStatus: null,
  settlementFiles: [],

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
  openingBalance: {
    baseDate: '',
  },

  reports: buildInitialReportsState(),

  completed: false,
};

// ==================== Action 類型 ====================

export type InitializationAction =
  | { type: 'RESTORE_STATE'; payload: InitializationState }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; payload: { step: number; reportIndex?: number } }
  | { type: 'SET_USER_UUID'; payload: string }

  // 步驟 1
  | { type: 'AGREE_TERMS' }

  // 步驟 2
  | { type: 'SET_OPERATING_STATUS'; payload: OperatingStatus }
  | { type: 'ADD_SETTLEMENT_FILES'; payload: UploadedSettlementFile[] }
  | { type: 'SET_SETTLEMENT_FILE_STATUS'; payload: { id: string; status: SettlementFileStatus; errorMessage: string | null } }
  | { type: 'REMOVE_SETTLEMENT_FILE'; payload: { id: string } }

  // 步驟 3
  | { type: 'SET_COMPANY'; payload: Partial<InitializationState['company']> }
  | { type: 'SET_BALANCE_BASE_DATE'; payload: string }

  // 步驟 3／4 共用：報表欄位與表格列
  | { type: 'SET_REPORT_FIELD'; payload: { reportId: SettlementReportId; key: string; value: string | number } }
  | { type: 'APPLY_RECOGNIZED_REPORT_FIELDS'; payload: { reportId: SettlementReportId; fields: Record<string, string | number> } }
  | { type: 'ADD_REPORT_ROW'; payload: { reportId: SettlementReportId; columns: ReportFieldDef[] } }
  | { type: 'REMOVE_REPORT_ROW'; payload: { reportId: SettlementReportId; index: number } }
  | { type: 'SET_REPORT_ROW_FIELD'; payload: { reportId: SettlementReportId; index: number; key: string; value: string | number } }
  | { type: 'APPLY_RECOGNIZED_REPORT_ROWS'; payload: { reportId: SettlementReportId; rows: Record<string, string | number>[] } }

  // 步驟 6
  | { type: 'COMPLETE' };

// ==================== 步驟導航邏輯 ====================
// Stepper 分組（見 Stepper 元件呼叫端）：1=合約　2=營運狀況　3+4=開帳資料（公司資料＋報表核對）　5=確認　6=完成
// 步驟 2 選「未滿一年」時無結算申報書可核對，3 之後直接跳到 5（確認），略過步驟 4 的報表頁

const LAST_REPORT_INDEX = REPORT_PAGES.length - 1;

export interface StepTarget {
  step: number;
  reportIndex: number;
}

export function getPrevStep(state: InitializationState): StepTarget {
  switch (state.currentStep) {
    case 2:
      return { step: 1, reportIndex: 0 };
    case 3:
      return { step: 2, reportIndex: 0 };
    case 4:
      if (state.currentReportIndex > 0) return { step: 4, reportIndex: state.currentReportIndex - 1 };
      return { step: 3, reportIndex: 0 };
    case 5:
      return state.operatingStatus === 'over_one_year' ? { step: 4, reportIndex: LAST_REPORT_INDEX } : { step: 3, reportIndex: 0 };
    default:
      return { step: state.currentStep, reportIndex: state.currentReportIndex };
  }
}

export function getNextStep(state: InitializationState): StepTarget {
  switch (state.currentStep) {
    case 1:
      return { step: 2, reportIndex: 0 };
    case 2:
      return { step: 3, reportIndex: 0 };
    case 3:
      return state.operatingStatus === 'over_one_year' ? { step: 4, reportIndex: 0 } : { step: 5, reportIndex: 0 };
    case 4:
      if (state.currentReportIndex < LAST_REPORT_INDEX) return { step: 4, reportIndex: state.currentReportIndex + 1 };
      return { step: 5, reportIndex: 0 };
    case 5:
      return { step: 6, reportIndex: 0 };
    default:
      return { step: state.currentStep, reportIndex: state.currentReportIndex };
  }
}

// ==================== Reducer ====================

function setReportField(reports: InitializationState['reports'], reportId: SettlementReportId, key: string, value: string | number, aiFilled: boolean): InitializationState['reports'] {
  return {
    ...reports,
    [reportId]: {
      ...reports[reportId],
      fields: { ...reports[reportId].fields, [key]: { value, aiFilled } },
    },
  };
}

function setReportRows(reports: InitializationState['reports'], reportId: SettlementReportId, rows: ReportRow[]): InitializationState['reports'] {
  return { ...reports, [reportId]: { ...reports[reportId], rows } };
}

export function initializationReducer(state: InitializationState, action: InitializationAction): InitializationState {
  switch (action.type) {
    case 'RESTORE_STATE':
      return { ...initialState, ...action.payload };

    case 'NEXT_STEP': {
      const next = getNextStep(state);
      return { ...state, currentStep: next.step, currentReportIndex: next.reportIndex };
    }

    case 'PREV_STEP': {
      const prev = getPrevStep(state);
      return { ...state, currentStep: prev.step, currentReportIndex: prev.reportIndex };
    }

    case 'GO_TO_STEP':
      return { ...state, currentStep: action.payload.step, currentReportIndex: action.payload.reportIndex ?? 0 };

    case 'SET_USER_UUID':
      return { ...state, userUuid: action.payload };

    case 'AGREE_TERMS':
      return { ...state, termsAgreed: true };

    case 'SET_OPERATING_STATUS':
      return { ...state, operatingStatus: action.payload };

    case 'ADD_SETTLEMENT_FILES':
      return { ...state, settlementFiles: [...state.settlementFiles, ...action.payload] };

    case 'SET_SETTLEMENT_FILE_STATUS':
      return {
        ...state,
        settlementFiles: state.settlementFiles.map(f =>
          f.id === action.payload.id ? { ...f, status: action.payload.status, errorMessage: action.payload.errorMessage } : f
        ),
      };

    case 'REMOVE_SETTLEMENT_FILE':
      return { ...state, settlementFiles: state.settlementFiles.filter(f => f.id !== action.payload.id) };

    case 'SET_COMPANY':
      return { ...state, company: { ...state.company, ...action.payload } };

    case 'SET_BALANCE_BASE_DATE':
      return { ...state, openingBalance: { ...state.openingBalance, baseDate: action.payload } };

    case 'SET_REPORT_FIELD':
      return { ...state, reports: setReportField(state.reports, action.payload.reportId, action.payload.key, action.payload.value, false) };

    case 'APPLY_RECOGNIZED_REPORT_FIELDS': {
      let reports = state.reports;
      for (const [key, value] of Object.entries(action.payload.fields)) {
        reports = setReportField(reports, action.payload.reportId, key, value, true);
      }
      return { ...state, reports };
    }

    case 'ADD_REPORT_ROW': {
      const { reportId, columns } = action.payload;
      const rows = [...state.reports[reportId].rows, buildEmptyRow(columns)];
      return { ...state, reports: setReportRows(state.reports, reportId, rows) };
    }

    case 'REMOVE_REPORT_ROW': {
      const { reportId, index } = action.payload;
      const rows = state.reports[reportId].rows.filter((_, i) => i !== index);
      return { ...state, reports: setReportRows(state.reports, reportId, rows) };
    }

    case 'SET_REPORT_ROW_FIELD': {
      const { reportId, index, key, value } = action.payload;
      const rows = state.reports[reportId].rows.map((row, i) => (i === index ? { ...row, [key]: { value, aiFilled: false } } : row));
      return { ...state, reports: setReportRows(state.reports, reportId, rows) };
    }

    case 'APPLY_RECOGNIZED_REPORT_ROWS': {
      const { reportId, rows } = action.payload;
      const newRows: ReportRow[] = rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, { value, aiFilled: true }])));
      return { ...state, reports: setReportRows(state.reports, reportId, [...state.reports[reportId].rows, ...newRows]) };
    }

    case 'COMPLETE':
      return { ...state, completed: true };

    default:
      return state;
  }
}
