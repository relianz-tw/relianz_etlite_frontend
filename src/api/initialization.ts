/**
 * 開帳精靈（/initialization）API。
 * TODO: 後端尚未提供 /ael/initialization/* 端點（實測皆 404），此檔先依既有 onboarding API
 * 慣例（見 src/api/onboarding/*.ts）寫好函式簽名與型別，待後端開通後直接可用，元件端無需改動。
 *
 * 結算申報書文件辨識已改接 /ael/peit/401/identify（見 src/api/peit.ts），不在此檔。
 */
import { apiFetch } from './client';

export interface InitializationCompanyRequest {
  userUuid: string;
  orgType: string;
  taxId: string;
  companyName: string;
  representative: string;
  address: string;
  phone: string;
  taxRegNo: string;
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
