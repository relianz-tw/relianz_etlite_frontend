import { apiFetch, buildQuery } from '@/api/client';

export interface CompanyLookupResponse {
  companyName: string | null;
  representative: string | null;
  address: string | null;
}

interface CompanyLookupApiData {
  companyName: string | null;
  headName: string | null;
  companyAddress: string | null;
}

/** 根據統一編號查詢公司基本資訊 */
export async function lookupCompany(
  taxId: string
): Promise<CompanyLookupResponse> {
  const raw = await apiFetch<CompanyLookupApiData>(
    `/ael/onboarding/company-lookup${buildQuery({ taxId })}`
  );
  return {
    companyName: raw.companyName,
    representative: raw.headName,
    address: raw.companyAddress,
  };
}
