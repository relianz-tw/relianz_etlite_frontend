/**
 * 開帳精靈（/initialization）API。
 * terms/agree、company、complete 三支已上線，一律以 companyUuid 識別公司（= ac_uuid）；
 * openbook 兩支後端尚未提供（實測 404），仍沿用 userUuid 的舊簽名，待後端開通後再對齊。
 *
 * 結算申報書文件辨識已改接 /ael/peit/cit/identify（見 src/api/peit.ts），不在此檔。
 */
import { apiFetch } from './client';
import { COMPANY_UUID } from './config';

/** 公司基本資料與聯絡人；companyUuid 由函式內注入，開帳日不在此送（改打 /ael/peit/openingDate） */
export interface InitializationCompanyRequest {
  orgType: string;
  taxId: string;
  companyName: string;
  representative: string;
  address: string;
  phone: string;
  taxRegNo: string;
  zipCode: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}

/** 標記服務合約已同意；termsAgreedAt 為 RFC3339 */
export function agreeInitializationTerms(): Promise<{ companyUuid: string; termsAgreedAt: string }> {
  return apiFetch('/ael/initialization/terms/agree', {
    method: 'POST',
    body: JSON.stringify({ companyUuid: COMPANY_UUID }),
  });
}

/** 儲存公司基本資料與聯絡人 */
export function saveInitializationCompany(data: InitializationCompanyRequest): Promise<{ companyUuid: string }> {
  return apiFetch('/ael/initialization/company', {
    method: 'POST',
    body: JSON.stringify({ ...data, companyUuid: COMPANY_UUID }),
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

/** 標記開帳精靈完成；initCompletedAt 為 RFC3339 */
export function completeInitialization(): Promise<{ companyUuid: string; initCompletedAt: string }> {
  return apiFetch('/ael/initialization/complete', {
    method: 'POST',
    body: JSON.stringify({ companyUuid: COMPANY_UUID }),
  });
}
