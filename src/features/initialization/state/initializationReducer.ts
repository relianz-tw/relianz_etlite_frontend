'use client';

import type { FieldBBox } from '@/api/peit';
import { buildEmptyRow, buildInitialReportsState, isSoleOrPartnership } from '../reports';
import type { ReportPageSpec, VatFormCode } from '../reports/reportPages';
import type { ReportFieldDef } from '../reports/types';

// ==================== 類型定義 ====================

/** 辨識帶入的欄位在哪份原件的哪一頁、哪個位置（供對照面板畫紅框）；sourceId 是原件的 fileId */
export interface FieldLocation extends FieldBBox {
  sourceId: string;
}

/** 一張表辨識自哪份原件、出現在原件的哪幾頁（頁碼從 1 起）；對照面板只顯示這幾頁 */
export interface FormSource {
  sourceId: string;
  pages: number[];
  /**
   * 後端辨識時實際使用的頁面圖片（完整網址）。bbox 是相對這張圖，
   * 後端若有轉正或透視校正，一定要顯示它而不是使用者上傳的原檔，否則框會偏。
   */
  imageUrl?: string;
  /** 這份表是什麼時候辨識帶入的（ISO 8601），供匯入覆蓋確認視窗顯示「已有資料」的時間 */
  importedAt?: string;
}

/** 組織型態：決定要備哪些文件（公司有股東名簿與未分配盈餘申報書，獨資合夥改填負責人／合夥人資料） */
export type OrgType = 'share' | 'limited' | 'sole' | 'partnership' | null;

/** 負責人／合夥人資料（獨資只有負責人，合夥另有合夥人） */
export interface Partner {
  title: '負責人' | '合夥人';
  name: string;
  idNo: string;
  address: string;
  /** 出資額 */
  capital: number;
}

/** 步驟二「請選擇您的營運狀況」，決定是否需要逐頁核對結算申報書各表 */
export type OperatingStatus = 'under_one_year' | 'over_one_year' | null;

/**
 * 13 份申報文件的 formCode（見 reports/formList.ts FORM_LIST，欄位定義由 GET /ael/peit/form/metadata 動態取得）。
 * CIT_COVER 併入步驟 3 公司資料頁；營所稅其餘各表與依期別展開的 401／403 為步驟 4 逐頁核對（見 reports/reportPages.ts）。
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
  | 'CIT_UNAMORTIZED'
  | 'CIT_WH_RETURN';

/** 步驟 4 一個頁面的 key：營所稅為 formCode，401／403 為 `VAT_401:115-3`（見 reports/reportPages.ts） */
export type ReportKey = string;

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

/**
 * 畫面流程的版本號。步驟編號是存進草稿的，流程一改舊草稿的數字就對不上畫面，
 * 所以每次調整步驟順序都要加一，RESTORE_STATE 會據此把對不上的草稿退回第一步（資料保留）。
 */
export const FLOW_VERSION = 3;

/**
 * 這份草稿是不是改版前存的（沒有這個欄位的舊草稿也算）。步驟編號對不上現在的畫面，位置不能信。
 * 還原時要退到哪一步見 RESTORE_STATE；寫瀏覽器歷史的地方也要問一次，否則按返回會跳回過期的步驟。
 */
export function isStaleFlow(state: Pick<InitializationState, 'flowVersion'>): boolean {
  return state.flowVersion !== FLOW_VERSION;
}

/** 改版前的草稿還原後要落在哪一步 */
export function restoredStep(state: Pick<InitializationState, 'termsAgreed'>): number {
  return state.termsAgreed ? STEP.PAYMENT : STEP.TERMS;
}

export interface InitializationState {
  /** 這份草稿是用哪一版流程存的，見 FLOW_VERSION */
  flowVersion: number;
  currentStep: number;
  /** 步驟 7（報表核對）目前顯示第幾份，對應 reportPages 的索引 */
  currentReportIndex: number;
  /**
   * 走到過的最遠位置。步驟列只開放點到這裡：這些畫面的「下一頁」資料交接
   * （見 utils/stepper.ts 的 getStepEntry）都已經跑過，跳回去不會產生對不起來的資料；
   * 還沒走到的頁一律要一頁頁按「下一頁」過去。
   */
  maxVisited: { step: number; reportIndex: number };

  /**
   * 串接身分用的使用者識別碼，沿用 onboarding Step6Plan 產生的 userUuid（見 Step8Checkout）。
   * 登入機制上線前由 URL ?uuid= 帶入；之後可改由登入 session 取得。
   */
  userUuid: string;

  // 步驟 1
  termsAgreed: boolean;

  /**
   * 步驟 2：正式流程中由付款環節帶進來的公司資料，目前由測試用的付款資料頁手動輸入。
   * 這是「系統登記資料」的定本：辨識流程不會覆寫它，登記事項表比對不吻合時以它為一方。
   */
  payment: {
    taxId: string;
    companyName: string;
    representative: string;
    address: string;
    email: string;
    phone: string;
  };

  // 步驟 4
  /** 組織型態，於開帳設定選擇，並同步寫入損益表 ORG_KIND */
  orgType: OrgType;
  /** orgType 目前還是系統依公司名稱與合夥契約推論的；使用者在開帳設定自己選過就轉為 false，之後不再被推論覆蓋 */
  orgTypeAuto: boolean;
  operatingStatus: OperatingStatus;
  /** 開帳年度（民國年），預設值見 reports/formList.ts getCurrentOpenYear；尚未進入步驟 2 前為 null */
  openYear: number | null;
  /** 公司的設立年度（民國）；開帳年度前一年等於它就沒有前一年度未分配盈餘申報書 */
  establishYear: number | null;
  /** 辨識後各表自己的民國年；未辨識的表退回 getDefaultFormYear 的預設年度 */
  reportYears: Partial<Record<ReportKey, number>>;
  /** 營業稅各期使用的申報書：key 為期別頁 key（`VAT:115-3`），值為 401 或 403（擇一）；沒選過視為 401 */
  vatChoices: Record<string, VatFormCode>;
  /** 步驟 4 要逐頁核對的頁面清單；在步驟 2 按「下一步」時依開帳年度與日期算出並凍結（見 APPLY_REPORT_PLAN） */
  reportPages: ReportPageSpec[];
  /** 測試用：模擬「今天」的日期（YYYY-MM-DD），null 表示用系統日期；只影響開帳年度選項與預設值 */
  simulatedDate: string | null;
  /** 使用者改了開帳年度且確認過提示後為 true；按下步驟 2「下一步」時才真的清掉 reportYears（見 APPLY_YEAR_RESET） */
  yearResetPending: boolean;
  /** 辨識帶入欄位的原件位置：key 為頁面 key，內層 key 為 fieldCode；隨草稿一起存，換裝置也看得到紅框 */
  fieldLocations: Record<ReportKey, Record<string, FieldLocation>>;
  /** 每張表辨識自哪份原件、在哪幾頁：key 為頁面 key；對照面板只顯示該表自己的頁，不顯示整份原件 */
  formSources: Record<ReportKey, FormSource>;
  /**
   * 申報書辨識出來的公司識別欄位與登記事項表對不上的紀錄（key 為封面欄位代碼）。
   * 值一律以登記事項表為準，這裡只留下來給畫面提醒使用者「資料不一致」。
   */
  registrationConflicts: Record<string, { registered: string; identified: string }>;

  // 步驟 3：公司基本資料，供確認頁與送出 API 使用。封面欄位全部依 metadata 存於 reports.CIT_COVER，
  // 按「下一步」時由 Step3Cover 把對應欄位整理進來（見 COVER_TO_COMPANY）
  company: {
    taxId: string;
    name: string;
    representative: string;
    address: string;
    /** 負責人電話 */
    phone: string;
    /** 稅籍編號 */
    taxRegNo: string;
    /** 郵寄區號、聯絡人資料：只有「尚未結算申報過」的公司資料表單會填（見 Step3CompanyInfo） */
    zipCode: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    industryId: string;
    industryName: string;
    isOperating: boolean;
    openDate: string; // YYYY-MM-DD
  };
  openingBalance: {
    /** 開帳基準日（YYYY-MM-DD）；封面 metadata 無此欄位，目前沒有輸入入口 */
    baseDate: string;
  };

  // 步驟 3 封面頁補充欄位 + 步驟 4 報表核對資料，key 為 ReportKey（營所稅各表預先建立，401／403 期別頁用到時才建立）
  reports: Record<ReportKey, ReportData>;

  /** 登記文件上傳（key 為文件類型代碼，值為檔名）。TODO：後端上傳 API 上線後改存檔案識別碼 */
  registrationFiles: Record<string, string>;
  /** 負責人及合夥人資料（獨資／合夥才使用） */
  partners: Partner[];

  // 步驟 6
  completed: boolean;
}

// ==================== 初始狀態 ====================

export const initialState: InitializationState = {
  flowVersion: FLOW_VERSION,
  currentStep: 1,
  currentReportIndex: 0,
  maxVisited: { step: 1, reportIndex: 0 },

  userUuid: '',

  termsAgreed: false,

  payment: {
    taxId: '',
    companyName: '',
    representative: '',
    address: '',
    email: '',
    phone: '',
  },

  orgType: null,
  orgTypeAuto: true,
  operatingStatus: null,
  openYear: null,
  establishYear: null,
  reportYears: {},
  vatChoices: {},
  reportPages: [],
  yearResetPending: false,
  fieldLocations: {},
  formSources: {},
  registrationConflicts: {},
  simulatedDate: null,

  company: {
    taxId: '',
    name: '',
    representative: '',
    address: '',
    phone: '',
    taxRegNo: '',
    zipCode: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    industryId: '',
    industryName: '',
    isOperating: false,
    openDate: '',
  },
  openingBalance: {
    baseDate: '',
  },

  reports: buildInitialReportsState(),

  registrationFiles: {},
  partners: [],

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
  | { type: 'SET_PAYMENT_INFO'; payload: Partial<InitializationState['payment']> }
  /** 系統依公司名稱與合夥契約推論出的組織型態；使用者自己選過（SET_ORG_TYPE）之後就不再套用 */
  | { type: 'INFER_ORG_TYPE'; payload: OrgType }
  | { type: 'SET_ORG_TYPE'; payload: OrgType }
  | { type: 'SET_OPERATING_STATUS'; payload: OperatingStatus }
  | { type: 'SET_OPEN_YEAR'; payload: number | null }
  | { type: 'SET_ESTABLISH_YEAR'; payload: number | null }
  | { type: 'SET_SIMULATED_DATE'; payload: string | null }
  | { type: 'SET_VAT_CHOICE'; payload: { pageKey: string; formCode: VatFormCode } }
  | { type: 'APPLY_REPORT_PLAN'; payload: ReportPageSpec[] }
  | { type: 'SCHEDULE_YEAR_RESET' }
  | { type: 'APPLY_YEAR_RESET' }

  // 步驟 3
  | { type: 'SET_COMPANY'; payload: Partial<InitializationState['company']> }
  | { type: 'SET_BALANCE_BASE_DATE'; payload: string }

  // 步驟 3／4 共用：報表欄位與表格列
  | { type: 'SET_REPORT_FIELD'; payload: { reportId: ReportKey; key: string; value: string | number } }
  | { type: 'PULL_SHARED_FIELDS'; payload: { reportId: ReportKey } }
  | {
      type: 'APPLY_IDENTIFIED_FORM';
      payload: {
        reportId: ReportKey;
        /** 營所稅各表辨識回傳的民國年，之後依此年度撈 metadata；401／403 年度由期別決定，不傳 */
        taxYear?: number;
        fields: Record<string, string | number>;
        rows: Record<string, string | number>[];
        /** 各欄位在原件上的位置（key = fieldCode）；有傳就整批取代這一頁原本的位置 */
        locations?: Record<string, FieldLocation>;
        /** 這張表辨識自哪份原件、在哪幾頁（後端回的 pages） */
        source?: FormSource;
      };
    }
  /** 丟入新一份原件辨識前，先清掉所有欄位的 AI 閃電標記（值不動），之後只有這次辨識帶入的欄位會重新被標記 */
  | { type: 'CLEAR_AI_FLAGS' }
  /** 原件被刪除：移除它的來源記錄與所有指向它的欄位位置（欄位值不動） */
  | { type: 'FORGET_SOURCE'; payload: { sourceId: string } }
  | { type: 'ADD_REPORT_ROW'; payload: { reportId: ReportKey; columns: ReportFieldDef[]; /** 插在這個位置（不給＝加在最後） */ at?: number } }
  | { type: 'REMOVE_REPORT_ROW'; payload: { reportId: ReportKey; index: number } }
  | { type: 'SET_REPORT_ROW_FIELD'; payload: { reportId: ReportKey; index: number; key: string; value: string | number } }

  // 登記文件上傳頁、負責人頁
  | { type: 'SET_REGISTRATION_FILE'; payload: { docType: string; fileName: string | null } }
  /** 整份文件的欄位與列全部清掉（如移除登記事項表檔案時一併丟棄它的辨識結果） */
  | { type: 'CLEAR_REPORT'; payload: { reportId: ReportKey } }
  | { type: 'SET_PARTNERS'; payload: Partner[] }

  // 完成
  | { type: 'COMPLETE' };

// ==================== 步驟導航邏輯 ====================
// 步驟順序：1=合約　2=付款資料（測試用，代替尚未串接的付款環節）　3=登記文件上傳　4=營運狀況
//          5=負責人／合夥人資料（僅滿一年的獨資、合夥）　6=封面／公司資料　7=逐頁核對報表（僅滿一年）
//          8=確認　9=完成
// 付款資料排最前面，是因為那裡的統一編號決定了要上傳哪一組登記文件（公司或商號）；
// 登記文件接在後面，是因為後端辨識登記事項表會把公司基本資料帶入更後面的頁面
// 步驟 4 選「未滿一年」時無結算申報書可核對，6 之後直接跳到 8（確認），略過步驟 7 的報表頁
// 改動這個順序時記得同步 FLOW_VERSION、utils/stepper.ts 與 app/initialization/initialization-client.tsx

/**
 * 各畫面的步驟編號。**跳轉一律用這組常數，不要寫死數字**：
 * 前兩次改號都有呼叫端被漏掉（營業稅期別方塊跳去負責人頁、完成頁的按鈕跳去登記文件頁），
 * 而且因為型別都是 number，編譯器完全抓不到。
 */
export const STEP = {
  TERMS: 1,
  PAYMENT: 2,
  REGISTRATION_DOCS: 3,
  OPERATING: 4,
  PARTNERS: 5,
  COMPANY: 6,
  REPORTS: 7,
  CONFIRM: 8,
  DONE: 9,
} as const;

export interface StepTarget {
  step: number;
  reportIndex: number;
}

/** 畫面位置的先後順序，供 maxVisited 比較；步驟 7 有好幾份報表，光比步驟號分不出走到第幾份 */
export function stepRank(target: StepTarget): number {
  return target.step * 1000 + (target.step === STEP.REPORTS ? target.reportIndex : 0);
}

/** 負責人／合夥人資料頁：只有獨資、合夥且滿一年才需要（跟封面一起走結算申報的路線） */
function needsPartnersPage(state: Pick<InitializationState, 'operatingStatus' | 'orgType'>): boolean {
  return state.operatingStatus === 'over_one_year' && isSoleOrPartnership(state.orgType);
}

export function getPrevStep(state: InitializationState): StepTarget {
  switch (state.currentStep) {
    case 2:
      return { step: 1, reportIndex: 0 };
    case 3:
      return { step: 2, reportIndex: 0 };
    case 4:
      return { step: 3, reportIndex: 0 };
    case 5:
      return { step: 4, reportIndex: 0 };
    case 6:
      return needsPartnersPage(state) ? { step: 5, reportIndex: 0 } : { step: 4, reportIndex: 0 };
    case 7:
      if (state.currentReportIndex > 0) return { step: 7, reportIndex: state.currentReportIndex - 1 };
      return { step: 6, reportIndex: 0 };
    case 8:
      return state.operatingStatus === 'over_one_year' ? { step: 7, reportIndex: Math.max(state.reportPages.length - 1, 0) } : { step: 6, reportIndex: 0 };
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
      return { step: 4, reportIndex: 0 };
    case 4:
      return needsPartnersPage(state) ? { step: 5, reportIndex: 0 } : { step: 6, reportIndex: 0 };
    case 5:
      return { step: 6, reportIndex: 0 };
    case 6:
      return state.operatingStatus === 'over_one_year' ? { step: 7, reportIndex: 0 } : { step: 8, reportIndex: 0 };
    case 7:
      if (state.currentReportIndex < state.reportPages.length - 1) return { step: 7, reportIndex: state.currentReportIndex + 1 };
      return { step: 8, reportIndex: 0 };
    case 8:
      return { step: 9, reportIndex: 0 };
    default:
      return { step: state.currentStep, reportIndex: state.currentReportIndex };
  }
}

// ==================== Reducer ====================

const EMPTY_REPORT: ReportData = { fields: {}, rows: [] };

/** 取某頁資料；401／403 期別頁第一次寫入前沒有對應 key，視為空白 */
function getReport(reports: InitializationState['reports'], reportId: ReportKey): ReportData {
  return reports[reportId] ?? EMPTY_REPORT;
}

function setReportField(
  reports: InitializationState['reports'],
  reportId: ReportKey,
  key: string,
  value: string | number,
  aiFilled: boolean
): InitializationState['reports'] {
  const current = getReport(reports, reportId);
  return {
    ...reports,
    [reportId]: {
      ...current,
      fields: { ...current.fields, [key]: { value, aiFilled } },
    },
  };
}

/**
 * 各份文件都會出現的公司識別欄位（統編、公司名稱、負責人、地址、電話、稅籍編號）。
 * 刻意不含申報年度、期別等每份文件各自不同的 HDR_ 欄位。
 */
export const SHARED_FIELD_KEYS = new Set(['HDR_VAT_NO', 'HDR_COMPANY_NAME', 'HDR_OWNER_NAME', 'HDR_ADDRESS', 'HDR_PHONE', 'HDR_TAX_REG_NO']);

/** 登記事項表的辨識結果存在 reports 的這個 key；放這裡是因為 reducer 要用，reports/registrationForm.ts 由此 re-export */
export const COMPANY_REGISTRATION_KEY = 'COMPANY_REGISTRATION';

/**
 * 登記事項表辨識過之後，這些封面欄位就以它為準：畫面鎖住不給改，
 * 後面各份申報書辨識出不同的值也不覆蓋，只記進 registrationConflicts 提醒使用者。
 * 來源對應表（登記表欄位 → 這些封面欄位）在 reports/registrationForm.ts。
 */
export const REGISTRATION_LOCKED_COVER_FIELDS = new Set([
  'HDR_VAT_NO',
  'HDR_COMPANY_NAME',
  'HDR_OWNER_NAME',
  'HDR_ADDRESS',
  'HDR_PHONE',
  'HDR_OWNER_ID',
  'HDR_OWNER_ADDRESS',
]);

/** 值被遮蔽（含 `*`，如 `F12617****`）時兩邊對不上是正常的，不算資料不一致 */
export function isMaskedValue(value: string | number): boolean {
  return String(value).includes('*');
}

/**
 * 受保護欄位的來源：登記事項表的哪一個欄位。負責人身分證字號與住居所不是固定欄位，
 * 在董監事名單中「姓名與 REPRESENTATIVE 相同」那一列（對應表見 reports/registrationForm.ts）。
 */
const REGISTRATION_SOURCE_OF_COVER: Record<string, string> = {
  HDR_VAT_NO: 'HDR_TAX_ID',
  HDR_COMPANY_NAME: 'NAME_ZH',
  HDR_OWNER_NAME: 'REPRESENTATIVE',
  HDR_ADDRESS: 'ADDR',
  HDR_PHONE: 'HDR_PHONE',
};

/**
 * 登記事項表辨識過時，回傳它對應到封面各受保護欄位的值；沒辨識過、或那一格登記表自己也沒值，
 * 就不在結果裡（代表不鎖、也不比對），免得使用者被鎖住一個改不掉的空白或錯值。
 */
export function lockedCoverValues(reports: InitializationState['reports']): Record<string, string | number> | null {
  const registration = reports[COMPANY_REGISTRATION_KEY];
  if (!registration) return null;
  const fields = registration.fields;

  const values: Record<string, string | number> = {};
  for (const [coverKey, sourceKey] of Object.entries(REGISTRATION_SOURCE_OF_COVER)) {
    const value = fields[sourceKey]?.value;
    if (value !== undefined && value !== '') values[coverKey] = value;
  }

  const representative = String(fields.REPRESENTATIVE?.value ?? '').trim();
  const ownerRow = representative ? registration.rows.find(row => String(row.ROW_NAME?.value ?? '').trim() === representative) : undefined;
  for (const [rowKey, coverKey] of [
    ['ROW_ID_NO', 'HDR_OWNER_ID'],
    ['ROW_ADDRESS', 'HDR_OWNER_ADDRESS'],
  ] as const) {
    const value = ownerRow?.[rowKey]?.value;
    // 登記表自己也是遮蔽的就不鎖，使用者還是得自己補
    if (value !== undefined && value !== '' && !isMaskedValue(value)) values[coverKey] = value;
  }

  return Object.keys(values).length > 0 ? values : null;
}

/**
 * 寫入欄位值；若是共用的公司識別欄位，同步帶入其他文件。
 * 只帶入「還是空白」或「仍與來源修改前相同」的文件，已被使用者在別份文件獨立改過的值不會被蓋掉。
 */
function setReportFieldSynced(
  reports: InitializationState['reports'],
  reportId: ReportKey,
  key: string,
  value: string | number,
  aiFilled: boolean
): InitializationState['reports'] {
  const previous = getReport(reports, reportId).fields[key]?.value ?? '';
  let next = setReportField(reports, reportId, key, value, aiFilled);
  if (!SHARED_FIELD_KEYS.has(key)) return next;

  for (const otherId of Object.keys(next)) {
    if (otherId === reportId) continue;
    const current = next[otherId].fields[key]?.value ?? '';
    if (current === '' || current === previous) next = setReportField(next, otherId, key, value, aiFilled);
  }
  return next;
}

function setReportRows(reports: InitializationState['reports'], reportId: ReportKey, rows: ReportRow[]): InitializationState['reports'] {
  return { ...reports, [reportId]: { ...getReport(reports, reportId), rows } };
}

/**
 * 寫入組織型態並同步損益表「組織種類」勾選。
 * 組織型態只由開帳設定頁與登記文件頁的推論決定，損益表那邊不回寫，因為逐頁核對的頁面清單已依此凍結。
 */
function applyOrgType(state: InitializationState, orgType: OrgType): Pick<InitializationState, 'orgType' | 'reports'> {
  let reports = state.reports;
  for (const [type, fieldCode] of Object.entries(ORG_TYPE_FIELD)) {
    reports = setReportField(reports, 'CIT_INCOME_TAX', fieldCode, type === orgType ? 1 : 0, false);
  }
  return { orgType, reports };
}

/** 組織型態 → 損益表 ORG_KIND 組的欄位代碼 */
const ORG_TYPE_FIELD: Record<Exclude<OrgType, null>, string> = {
  share: 'ORG_1_SHARE',
  limited: 'ORG_2_LIMITED',
  sole: 'ORG_6_SOLE',
  partnership: 'ORG_5_PARTNERSHIP',
};

/** 移動到某個畫面，順手把 maxVisited 推到更遠的位置（往回走不會把它拉回來） */
function visit(state: InitializationState, target: StepTarget): InitializationState {
  const advanced = stepRank(target) > stepRank(state.maxVisited);
  return {
    ...state,
    currentStep: target.step,
    currentReportIndex: target.reportIndex,
    maxVisited: advanced ? target : state.maxVisited,
  };
}

export function initializationReducer(state: InitializationState, action: InitializationAction): InitializationState {
  switch (action.type) {
    case 'RESTORE_STATE': {
      // 流程改版後舊草稿的步驟號對不上現在的畫面（雲端草稿換 session key 也擋不住），
      // 資料全部留著，只把進度退回第一步讓使用者重走一次
      const staleFlow = isStaleFlow(action.payload);
      const restored: StepTarget = {
        step: staleFlow ? restoredStep(action.payload) : action.payload.currentStep,
        reportIndex: staleFlow ? 0 : action.payload.currentReportIndex,
      };
      // 舊草稿沒存過 maxVisited，用它停在哪一步回推；改版退回第一步的草稿則一併收回去，
      // 因為交接要重走一次才會對（見 utils/stepper.ts 的 getStepEntry）
      const restoredMax =
        !staleFlow && action.payload.maxVisited && stepRank(action.payload.maxVisited) > stepRank(restored) ? action.payload.maxVisited : restored;
      // reports 的 key（formCode）可能因改版增減，用 initialState.reports 補齊舊 sessionStorage 缺少的 key，
      // 避免 reports[reportId] 因改版後缺 key 變成 undefined
      return {
        ...initialState,
        ...action.payload,
        flowVersion: FLOW_VERSION,
        currentStep: restored.step,
        currentReportIndex: restored.reportIndex,
        maxVisited: restoredMax,
        reports: { ...initialState.reports, ...action.payload.reports },
        // company 欄位也可能因改版增減（如新增 phone／taxRegNo），同樣用初始值補齊
        company: { ...initialState.company, ...action.payload.company },
        payment: { ...initialState.payment, ...action.payload.payment },
        reportYears: { ...initialState.reportYears, ...action.payload.reportYears },
        vatChoices: { ...initialState.vatChoices, ...action.payload.vatChoices },
      };
    }

    case 'NEXT_STEP':
      return visit(state, getNextStep(state));

    case 'PREV_STEP':
      return visit(state, getPrevStep(state));

    case 'GO_TO_STEP':
      return visit(state, {
        // 夾回有效範圍：越界的步驟會讓畫面 fallback 成合約頁、但 getNextStep 的 default 原地打轉，按下一頁沒反應
        step: Math.min(Math.max(action.payload.step, STEP.TERMS), STEP.DONE),
        reportIndex: action.payload.reportIndex ?? 0,
      });

    case 'SET_USER_UUID':
      return { ...state, userUuid: action.payload };

    case 'AGREE_TERMS':
      return { ...state, termsAgreed: true };

    case 'INFER_ORG_TYPE':
      // 使用者已經自己選過組織型態，或推不出東西，就不動
      if (!state.orgTypeAuto || action.payload === null || action.payload === state.orgType) return state;
      return { ...state, ...applyOrgType(state, action.payload) };

    case 'SET_ORG_TYPE':
      // 使用者自己選的，之後登記文件頁的推論不再覆蓋
      return { ...state, ...applyOrgType(state, action.payload), orgTypeAuto: false };

    case 'SET_PAYMENT_INFO':
      return { ...state, payment: { ...state.payment, ...action.payload } };

    case 'SET_REGISTRATION_FILE': {
      const { [action.payload.docType]: _removed, ...rest } = state.registrationFiles;
      return { ...state, registrationFiles: action.payload.fileName ? { ...rest, [action.payload.docType]: action.payload.fileName } : rest };
    }

    case 'CLEAR_REPORT': {
      // 已經同步到其他文件（共用的公司識別欄位）或 state.company 的值不回收，使用者可能已經改過
      const { [action.payload.reportId]: _cleared, ...reports } = state.reports;
      return { ...state, reports };
    }

    case 'SET_PARTNERS':
      return { ...state, partners: action.payload };

    case 'SET_OPERATING_STATUS':
      return { ...state, operatingStatus: action.payload };

    case 'SET_OPEN_YEAR':
      return { ...state, openYear: action.payload };

    case 'SET_ESTABLISH_YEAR':
      return { ...state, establishYear: action.payload };

    case 'SET_SIMULATED_DATE':
      return { ...state, simulatedDate: action.payload };

    case 'SET_VAT_CHOICE':
      return { ...state, vatChoices: { ...state.vatChoices, [action.payload.pageKey]: action.payload.formCode } };

    case 'APPLY_REPORT_PLAN':
      return { ...state, reportPages: action.payload };

    case 'SCHEDULE_YEAR_RESET':
      return { ...state, yearResetPending: true };

    // 已辨識文件的年度回到預設（由開帳年度推算）；欄位內容不動
    case 'APPLY_YEAR_RESET':
      return { ...state, reportYears: {}, yearResetPending: false };

    case 'SET_COMPANY':
      return { ...state, company: { ...state.company, ...action.payload } };

    case 'SET_BALANCE_BASE_DATE':
      return { ...state, openingBalance: { ...state.openingBalance, baseDate: action.payload } };

    case 'SET_REPORT_FIELD':
      return {
        ...state,
        reports: setReportFieldSynced(state.reports, action.payload.reportId, action.payload.key, action.payload.value, false),
      };

    // 401／403 期別頁等「晚建立」的頁面沒有參與先前的同步，開啟時從其他文件把還空白的公司識別欄位帶進來
    case 'PULL_SHARED_FIELDS': {
      const { reportId } = action.payload;
      let reports = state.reports;
      let changed = false;

      // 登記事項表辨識過的話，受保護欄位一律對齊它。進每一頁時校正，舊草稿裡被別份文件蓋掉的值也會回正——
      // 否則畫面把一個錯值鎖起來，使用者改不掉
      const locked = reportId === COMPANY_REGISTRATION_KEY ? null : lockedCoverValues(reports);
      for (const [key, value] of Object.entries(locked ?? {})) {
        if (!(key in getReport(reports, reportId).fields)) continue;
        if (getReport(reports, reportId).fields[key]?.value === value) continue;
        reports = setReportField(reports, reportId, key, value, false);
        changed = true;
      }

      for (const key of SHARED_FIELD_KEYS) {
        const own = getReport(reports, reportId).fields[key]?.value;
        if (own !== undefined && own !== '') continue;
        // 封面是公司資料的主要入口，優先當來源；沒有再找其他有值的文件
        const hasValue = (id: string) => id !== reportId && (reports[id]?.fields[key]?.value ?? '') !== '';
        const sourceId = hasValue('CIT_COVER') ? 'CIT_COVER' : Object.keys(reports).find(hasValue);
        const source = sourceId ? ([sourceId, reports[sourceId]] as const) : undefined;
        const sourceField = source?.[1].fields[key];
        if (!sourceField) continue;
        reports = setReportField(reports, reportId, key, sourceField.value, sourceField.aiFilled);
        changed = true;
      }
      return changed ? { ...state, reports } : state;
    }

    case 'APPLY_IDENTIFIED_FORM': {
      const { reportId, taxYear, fields, rows, locations, source } = action.payload;
      let reports = state.reports;
      // 登記事項表辨識過之後，公司識別欄位以它為準：其餘申報書辨識出不同的值不覆蓋，只記下來提醒使用者
      const locked = reportId === COMPANY_REGISTRATION_KEY ? null : lockedCoverValues(state.reports);
      const conflicts = { ...state.registrationConflicts };
      for (const [key, value] of Object.entries(fields)) {
        const registered = locked?.[key];
        if (registered !== undefined) {
          // 遮蔽過的值（F12617****）本來就對不上完整值，不算不一致
          if (String(value) !== String(registered) && !isMaskedValue(value) && !isMaskedValue(registered)) {
            conflicts[key] = { registered: String(registered), identified: String(value) };
          }
          continue;
        }
        reports = setReportFieldSynced(reports, reportId, key, value, true);
      }
      // 列資料以辨識結果整批取代（同一份文件重新辨識不應累加重複列）；辨識無列時保留使用者既有的列
      if (rows.length > 0) {
        const newRows: ReportRow[] = rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, { value, aiFilled: true }])));
        reports = setReportRows(reports, reportId, newRows);
      }
      return {
        ...state,
        reports,
        registrationConflicts: conflicts,
        reportYears: taxYear === undefined ? state.reportYears : { ...state.reportYears, [reportId]: taxYear },
        fieldLocations: locations ? { ...state.fieldLocations, [reportId]: locations } : state.fieldLocations,
        formSources: source ? { ...state.formSources, [reportId]: source } : state.formSources,
      };
    }

    case 'CLEAR_AI_FLAGS': {
      const clearField = (field: ReportField): ReportField => (field.aiFilled ? { ...field, aiFilled: false } : field);
      const reports = Object.fromEntries(
        Object.entries(state.reports).map(([reportId, report]) => [
          reportId,
          {
            ...report,
            fields: Object.fromEntries(Object.entries(report.fields).map(([key, field]) => [key, clearField(field)])),
            rows: report.rows.map(row => Object.fromEntries(Object.entries(row).map(([key, field]) => [key, clearField(field)]))),
          },
        ])
      );
      return { ...state, reports };
    }

    case 'FORGET_SOURCE': {
      const { sourceId } = action.payload;
      const fieldLocations = Object.fromEntries(
        Object.entries(state.fieldLocations).map(([reportId, byField]) => [reportId, Object.fromEntries(Object.entries(byField).filter(([, loc]) => loc.sourceId !== sourceId))])
      );
      const formSources = Object.fromEntries(Object.entries(state.formSources).filter(([, src]) => src.sourceId !== sourceId));
      return { ...state, fieldLocations, formSources };
    }

    case 'ADD_REPORT_ROW': {
      const { reportId, columns, at } = action.payload;
      const rows = [...getReport(state.reports, reportId).rows];
      rows.splice(at ?? rows.length, 0, buildEmptyRow(columns));
      return { ...state, reports: setReportRows(state.reports, reportId, rows) };
    }

    case 'REMOVE_REPORT_ROW': {
      const { reportId, index } = action.payload;
      const rows = getReport(state.reports, reportId).rows.filter((_, i) => i !== index);
      return { ...state, reports: setReportRows(state.reports, reportId, rows) };
    }

    case 'SET_REPORT_ROW_FIELD': {
      const { reportId, index, key, value } = action.payload;
      const rows = getReport(state.reports, reportId).rows.map((row, i) => (i === index ? { ...row, [key]: { value, aiFilled: false } } : row));
      return { ...state, reports: setReportRows(state.reports, reportId, rows) };
    }

    case 'COMPLETE':
      return { ...state, completed: true };

    default:
      return state;
  }
}
