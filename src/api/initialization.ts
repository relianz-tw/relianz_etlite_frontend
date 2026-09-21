/**
 * 開帳精靈（/initialization）API。
 * TODO: 後端尚未提供 /ael/initialization/* 端點（實測皆 404），此檔先依既有 onboarding API
 * 慣例（見 src/api/onboarding/*.ts）寫好函式簽名與型別，待後端開通後直接可用，元件端無需改動。
 */
import { apiFetch } from './client';
import type { SettlementReportId } from '@/features/initialization/state/initializationReducer';

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

export interface SettlementRecognitionRequest {
  userUuid: string;
  files: File[];
}

/** 文件辨識出的公司基本資料文字欄位，用於回填步驟 3 封面頁的核心欄位（其餘補充欄位見 reports.cover） */
export interface RecognizedCompanyInfo {
  taxId?: string;
  companyName?: string;
  representative?: string;
  address?: string;
  /** 設立登記日期 YYYY-MM-DD */
  openDate?: string;
}

export interface RecognizedReportData {
  /** 一般報表欄位（雙欄型報表），key 對應 reports/*.ts 各 ReportFieldDef.key */
  fields?: Record<string, string | number>;
  /** 表格型報表（投資人明細、財產目錄）新增的列，key 對應該報表 ReportTableDef.columns 的 key */
  rows?: Record<string, string | number>[];
}

export interface SettlementRecognitionResult {
  company?: RecognizedCompanyInfo;
  /** 6 份報表（含封面）辨識結果，未辨識到的報表可不回傳，畫面上維持留空 */
  reports: Partial<Record<SettlementReportId, RecognizedReportData>>;
  /** 每個上傳檔案對應到哪份報表，供畫面標示辨識結果來源 */
  files: { fileName: string; matchedReport: SettlementReportId | null }[];
}

// ==================== 暫時性本地假辨識（TEMP MOCK） ====================
// TODO(mock): /ael/initialization/settlement/recognize 後端上線後整段移除，
// 僅供後端就緒前在瀏覽器展示「上傳結算申報書 → 自動帶入封面與各份報表」的流程效果，非真實辨識結果。
// 以下數字經過設計使資產負債表左右欄合計相等，方便展示借貸平衡檢查列的效果；
// 扣繳調節表與財產目錄未提供資料，示範「文件未涵蓋的報表維持留空」情境。
function mockRecognizeSettlement(files: File[]): Promise<SettlementRecognitionResult> {
  const result: SettlementRecognitionResult = {
    company: {
      companyName: '盤古投資有限公司',
      representative: '王小明',
      address: '台北市內湖區我的道路1段88號',
      openDate: '2023-01-31',
      taxId: '82999614',
    },
    reports: {
      cover: {
        fields: {
          taxRegistrationNo: '123456789',
          industryStandardCode: '7020-99',
          filingDate: '2023-01-31',
          repIdNumber: 'A123456789',
          repEmail: 'happygolucky168@gmail.com',
          repPhone: '02-2356-1788',
          declaredRevenueTotal: 741794,
          businessTaxSalesTotal: 711000,
          revenueDiff: 30794,
          addOthers: 30794,
        },
      },
      incomeStatement: {
        fields: {
          netRevenue: 741794,
          costOfGoodsSold: 420000,
          grossProfit: 321794,
          operatingExpenses: 180000,
          operatingIncome: 141794,
          nonOperatingIncome: 5000,
          nonOperatingLoss: 2000,
          totalIncome: 144794,
          taxableIncome: 144794,
          taxPayable: 14479,
          withholdingTaxCredit: 3000,
          provisionalTaxPaid: 5000,
          taxDueOrRefund: 6479,
        },
      },
      balanceSheet: {
        fields: {
          currentAssetsSubtotal: 741794,
          cash: 46623,
          bankDeposits: 489942,
          accountsReceivable: 150000,
          businessTaxCredit: 12000,
          fixedAssetsSubtotal: 480000,
          fixedAssetsCost: 600000,
          accumulatedDepreciation: -120000,
          otherAssets: 0,
          totalAssets: 1221794,
          currentLiabilitiesSubtotal: 395000,
          accountsPayable: 95000,
          shortTermLoans: 300000,
          longTermLiabilities: 0,
          ownerEquitySubtotal: 826794,
          registeredCapital: 1000000,
          retainedEarnings: -173206,
          totalLiabilitiesAndEquity: 1221794,
        },
      },
      shareholders: {
        rows: [{ investorName: '王小明', idOrTaxId: 'A123456789', investmentAmount: 1000000, sharePercentage: '100%', dividendAmount: 0, withholdingTax: 0 }],
      },
    },
    files: files.map(file => ({ fileName: file.name, matchedReport: null })),
  };
  // 模擬辨識耗時，讓「辨識中」狀態在畫面上可被觀察到
  return new Promise(resolve => setTimeout(() => resolve(result), 1500));
}

/** 上傳結算申報書（可多份）並辨識封面與各份報表欄位 */
export async function recognizeSettlementReports(data: SettlementRecognitionRequest): Promise<SettlementRecognitionResult> {
  const formData = new FormData();
  formData.append('userUuid', data.userUuid);
  data.files.forEach(file => formData.append('files', file));
  try {
    return await apiFetch<SettlementRecognitionResult>('/ael/initialization/settlement/recognize', {
      method: 'POST',
      body: formData,
      // AI 辨識耗時可能較長，逾時放寬到 120 秒（比照 onboarding invoiceRecognition）
      signal: AbortSignal.timeout(120_000),
    });
  } catch (err) {
    // TODO(mock): 後端端點上線後移除這段 fallback，直接讓錯誤往上拋
    console.warn('[initialization] /settlement/recognize 尚未就緒，改用本地假辨識資料', err);
    return mockRecognizeSettlement(data.files);
  }
}

export interface OpeningBalanceRequest {
  userUuid: string;
  baseDate: string;
  assets: Record<string, number>;
  liabilities: Record<string, number>;
  equity: Record<string, number>;
}

/** 儲存期初餘額（由步驟 4 資產負債表欄位轉出，見 reports/balanceSheetMapping.ts） */
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
