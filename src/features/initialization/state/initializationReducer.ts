'use client';

import { buildEmptyRow, buildInitialReportsState, REPORT_PAGE_ORDER } from '../reports';
import type { ReportFieldDef } from '../reports/types';

// ==================== 類型定義 ====================

/** 步驟二「請選擇您的營運狀況」，決定是否需要逐頁核對結算申報書各表 */
export type OperatingStatus = 'under_one_year' | 'over_one_year' | null;

/**
 * 12 份申報文件的 formCode（見 reports/formList.ts FORM_LIST，欄位定義由 GET /ael/peit/form/metadata 動態取得）。
 * CIT_COVER 併入步驟 3 公司資料頁，其餘 11 份為步驟 4 逐頁核對（見 reports/formList.ts REPORT_PAGE_ORDER）。
 */
export type SettlementReportId =
  | 'VAT_401'
  | 'VAT_403'
  | 'CIT_COVER'
  | 'CIT_INCOME_TAX'
  | 'CIT_AMT'
  | 'CIT_BALANCE_SHEET'
  | 'CIT_INVESTORS'
  | 'CIT_UE'
  | 'CIT_WH_RECON'
  | 'CIT_PROPERTY'
  | 'CIT_SHAREHOLDERS'
  | 'CIT_UNAMORTIZED';

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
  /** 步驟 4（報表核對）目前顯示第幾份，對應 reports/formList.ts 的 REPORT_PAGE_ORDER 索引（0-10） */
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
  /** 開帳年度（民國年），預設值見 reports/formList.ts getCurrentOpenYear；尚未進入步驟 2 前為 null */
  openYear: number | null;
  /** 辨識後各表自己的民國年；未辨識的表退回 getDefaultFormYear 的預設年度 */
  reportYears: Partial<Record<SettlementReportId, number>>;

  // 步驟 3：公司基本資料，供確認頁與送出 API 使用。封面欄位全部依 metadata 存於 reports.CIT_COVER，
  // 按「下一步」時由 Step3Cover 把對應欄位整理進來（見 COVER_TO_COMPANY）
  company: {
    orgType: string;
    taxId: string;
    name: string;
    representative: string;
    address: string;
    /** 負責人電話 */
    phone: string;
    /** 稅籍編號 */
    taxRegNo: string;
    industryId: string;
    industryName: string;
    isOperating: boolean;
    openDate: string; // YYYY-MM-DD
  };
  openingBalance: {
    /** 開帳基準日（YYYY-MM-DD）；封面 metadata 無此欄位，目前沒有輸入入口 */
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
  openYear: null,
  reportYears: {},

  company: {
    orgType: '',
    taxId: '',
    name: '',
    representative: '',
    address: '',
    phone: '',
    taxRegNo: '',
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
  | { type: 'SET_OPEN_YEAR'; payload: number }

  // 步驟 3
  | { type: 'SET_COMPANY'; payload: Partial<InitializationState['company']> }
  | { type: 'SET_BALANCE_BASE_DATE'; payload: string }

  // 步驟 3／4 共用：報表欄位與表格列
  | { type: 'SET_REPORT_FIELD'; payload: { reportId: SettlementReportId; key: string; value: string | number } }
  | {
      type: 'APPLY_IDENTIFIED_FORM';
      payload: {
        reportId: SettlementReportId;
        /** 該表辨識回傳的民國年，之後依此年度撈 metadata */
        taxYear: number;
        fields: Record<string, string | number>;
        rows: Record<string, string | number>[];
      };
    }
  | { type: 'ADD_REPORT_ROW'; payload: { reportId: SettlementReportId; columns: ReportFieldDef[] } }
  | { type: 'REMOVE_REPORT_ROW'; payload: { reportId: SettlementReportId; index: number } }
  | { type: 'SET_REPORT_ROW_FIELD'; payload: { reportId: SettlementReportId; index: number; key: string; value: string | number } }

  // 步驟 6
  | { type: 'COMPLETE' };

// ==================== 步驟導航邏輯 ====================
// Stepper 分組（見 Stepper 元件呼叫端）：1=合約　2=營運狀況　3+4=開帳資料（公司資料＋報表核對）　5=確認　6=完成
// 步驟 2 選「未滿一年」時無結算申報書可核對，3 之後直接跳到 5（確認），略過步驟 4 的報表頁

const LAST_REPORT_INDEX = REPORT_PAGE_ORDER.length - 1;

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

function setReportField(
  reports: InitializationState['reports'],
  reportId: SettlementReportId,
  key: string,
  value: string | number,
  aiFilled: boolean
): InitializationState['reports'] {
  return {
    ...reports,
    [reportId]: {
      ...reports[reportId],
      fields: { ...reports[reportId].fields, [key]: { value, aiFilled } },
    },
  };
}

/**
 * 各份文件都會出現的公司識別欄位（統編、公司名稱、負責人、地址、電話、稅籍編號）。
 * 刻意不含申報年度、期別等每份文件各自不同的 HDR_ 欄位。
 */
const SHARED_FIELD_KEYS = new Set(['HDR_VAT_NO', 'HDR_COMPANY_NAME', 'HDR_OWNER_NAME', 'HDR_ADDRESS', 'HDR_PHONE', 'HDR_TAX_REG_NO']);

/**
 * 寫入欄位值；若是共用的公司識別欄位，同步帶入其他文件。
 * 只帶入「還是空白」或「仍與來源修改前相同」的文件，已被使用者在別份文件獨立改過的值不會被蓋掉。
 */
function setReportFieldSynced(
  reports: InitializationState['reports'],
  reportId: SettlementReportId,
  key: string,
  value: string | number,
  aiFilled: boolean
): InitializationState['reports'] {
  const previous = reports[reportId].fields[key]?.value ?? '';
  let next = setReportField(reports, reportId, key, value, aiFilled);
  if (!SHARED_FIELD_KEYS.has(key)) return next;

  for (const otherId of Object.keys(next) as SettlementReportId[]) {
    if (otherId === reportId) continue;
    const current = next[otherId].fields[key]?.value ?? '';
    if (current === '' || current === previous) next = setReportField(next, otherId, key, value, aiFilled);
  }
  return next;
}

function setReportRows(reports: InitializationState['reports'], reportId: SettlementReportId, rows: ReportRow[]): InitializationState['reports'] {
  return { ...reports, [reportId]: { ...reports[reportId], rows } };
}

export function initializationReducer(state: InitializationState, action: InitializationAction): InitializationState {
  switch (action.type) {
    case 'RESTORE_STATE':
      // reports 的 key（formCode）可能因改版增減，用 initialState.reports 補齊舊 sessionStorage 缺少的 key，
      // 避免 reports[reportId] 因改版後缺 key 變成 undefined
      return {
        ...initialState,
        ...action.payload,
        reports: { ...initialState.reports, ...action.payload.reports },
        // company 欄位也可能因改版增減（如新增 orgType／phone／taxRegNo），同樣用初始值補齊
        company: { ...initialState.company, ...action.payload.company },
        reportYears: { ...initialState.reportYears, ...action.payload.reportYears },
      };

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

    case 'SET_OPEN_YEAR':
      return { ...state, openYear: action.payload };

    case 'SET_COMPANY':
      return { ...state, company: { ...state.company, ...action.payload } };

    case 'SET_BALANCE_BASE_DATE':
      return { ...state, openingBalance: { ...state.openingBalance, baseDate: action.payload } };

    case 'SET_REPORT_FIELD':
      return {
        ...state,
        reports: setReportFieldSynced(state.reports, action.payload.reportId, action.payload.key, action.payload.value, false),
      };

    case 'APPLY_IDENTIFIED_FORM': {
      const { reportId, taxYear, fields, rows } = action.payload;
      let reports = state.reports;
      for (const [key, value] of Object.entries(fields)) {
        reports = setReportFieldSynced(reports, reportId, key, value, true);
      }
      // 列資料以辨識結果整批取代（同一份文件重新辨識不應累加重複列）；辨識無列時保留使用者既有的列
      if (rows.length > 0) {
        const newRows: ReportRow[] = rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, { value, aiFilled: true }])));
        reports = setReportRows(reports, reportId, newRows);
      }
      return { ...state, reports, reportYears: { ...state.reportYears, [reportId]: taxYear } };
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

    case 'COMPLETE':
      return { ...state, completed: true };

    default:
      return state;
  }
}
