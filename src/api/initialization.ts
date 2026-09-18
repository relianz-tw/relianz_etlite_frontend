/**
 * 開帳精靈（/initialization）API。
 * TODO: 後端尚未提供 /ael/initialization/* 端點（實測皆 404），此檔先依既有 onboarding API
 * 慣例（見 src/api/onboarding/*.ts）寫好函式簽名與型別，待後端開通後直接可用，元件端無需改動。
 */
import { apiFetch } from './client';

export interface InitializationCompanyRequest {
  userUuid: string;
  taxId: string;
  companyName: string;
  representative: string;
  address: string;
  industryId: string;
  isOperating: boolean;
  openDate: string;
}

/** 標記服務合約已同意 */
export function agreeInitializationTerms(userUuid: string): Promise<unknown> {
  return apiFetch('/ael/initialization/terms/agree', {
    method: 'POST',
    body: JSON.stringify({ userUuid }),
  });
}

/** 儲存公司基本資料與開帳基準日設定 */
export function saveInitializationCompany(data: InitializationCompanyRequest): Promise<unknown> {
  return apiFetch('/ael/initialization/company', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export type DocumentRecognitionCategory =
  | 'incomeTaxReport'
  | 'businessTax401'
  | 'invoiceExcel'
  | 'bankStatement'
  | 'companyRegistration';

export interface DocumentRecognitionRequest {
  userUuid: string;
  category: DocumentRecognitionCategory;
  file: File;
}

/** 文件辨識出的公司基本資料文字欄位；僅 category='companyRegistration'（公司登記資料）會回傳 */
export interface RecognizedCompanyInfo {
  companyName?: string;
  representative?: string;
  address?: string;
  /** 設立登記日期 YYYY-MM-DD，用於回填步驟 2 的開業日期 */
  openDate?: string;
}

/** 單一分類欄位辨識結果：key 為期初表欄位名稱（如 cash、bankDeposits），value 為辨識出的金額 */
export interface DocumentRecognitionResult {
  fields: Record<string, number>;
  /** 僅公司登記資料會回傳，用於回填步驟 2 的公司基本資料表單 */
  company?: RecognizedCompanyInfo;
  /** 辨識信心度 0-1，供 UI 提示使用者仍需人工核對 */
  confidence: number;
}

// ==================== 暫時性本地假辨識（TEMP MOCK） ====================
// TODO(mock): /ael/initialization/document/recognize 後端上線後整段移除，
// 僅供後端就緒前在瀏覽器展示「上傳文件 → 自動帶入期初/公司資料」的流程效果，非真實辨識結果
const MOCK_RECOGNITION: Record<DocumentRecognitionCategory, DocumentRecognitionResult> = {
  incomeTaxReport: {
    confidence: 0.92,
    fields: {
      cash: 85000,
      bankDeposits: 620000,
      accountsReceivable: 150000,
      inventory: 210000,
      fixedAssets: 480000,
      businessTaxCredit: 12000,
      accountsPayable: 95000,
      shortTermLoans: 300000,
      registeredCapital: 1000000,
      retainedEarnings: -42000,
    },
  },
  businessTax401: {
    confidence: 0.88,
    fields: { businessTaxCredit: 15600 },
  },
  invoiceExcel: {
    // 進銷項明細本身不含資產負債餘額，故不帶回任何期初欄位
    confidence: 0.8,
    fields: {},
  },
  bankStatement: {
    confidence: 0.95,
    fields: { bankDeposits: 634200 },
  },
  companyRegistration: {
    confidence: 0.9,
    fields: { registeredCapital: 1000000 },
    company: {
      companyName: '友信創新股份有限公司',
      representative: '王小明',
      address: '台北市大安區敦化南路二段100號8樓',
      openDate: '2021-03-15',
    },
  },
};

function mockRecognize(category: DocumentRecognitionCategory): Promise<DocumentRecognitionResult> {
  // 模擬辨識耗時，讓「辨識中」狀態在畫面上可被觀察到
  return new Promise(resolve => setTimeout(() => resolve(MOCK_RECOGNITION[category]), 1200));
}

/** 上傳單份文件並辨識期初欄位（申報書/報表/對帳單/登記資料，依 category 走不同辨識邏輯） */
export async function recognizeInitializationDocument(data: DocumentRecognitionRequest): Promise<DocumentRecognitionResult> {
  const formData = new FormData();
  formData.append('userUuid', data.userUuid);
  formData.append('category', data.category);
  formData.append('file', data.file);
  try {
    return await apiFetch<DocumentRecognitionResult>('/ael/initialization/document/recognize', {
      method: 'POST',
      body: formData,
      // AI 辨識耗時可能較長，逾時放寬到 120 秒（比照 onboarding invoiceRecognition）
      signal: AbortSignal.timeout(120_000),
    });
  } catch (err) {
    // TODO(mock): 後端端點上線後移除這段 fallback，直接讓錯誤往上拋
    console.warn(`[initialization] /document/recognize 尚未就緒，改用本地假辨識資料（category=${data.category}）`, err);
    return mockRecognize(data.category);
  }
}

export interface OpeningBalanceRequest {
  userUuid: string;
  baseDate: string;
  assets: Record<string, number>;
  liabilities: Record<string, number>;
  equity: Record<string, number>;
}

/** 儲存期初餘額 */
export function saveOpeningBalance(data: OpeningBalanceRequest): Promise<unknown> {
  return apiFetch('/ael/initialization/openbook', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 回填既有期初餘額（cashflow 的 /startUp 缺這支，導致期初資料無法檢視/修改，此處補上） */
export function getInitializationOpeningBalance(userUuid: string): Promise<OpeningBalanceRequest | null> {
  return apiFetch(`/ael/initialization/openbook?userUuid=${encodeURIComponent(userUuid)}`);
}

/** 標記開帳精靈完成 */
export function completeInitialization(userUuid: string): Promise<unknown> {
  return apiFetch('/ael/initialization/complete', {
    method: 'POST',
    body: JSON.stringify({ userUuid }),
  });
}
