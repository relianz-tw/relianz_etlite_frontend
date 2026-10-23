/** 從 onboarding sessionStorage 讀取已填過的公司資料，供開帳步驟 3 預填 */
export function readOnboardingCompany(): { taxId?: string; name?: string; representative?: string; address?: string } | null {
  try {
    const raw = sessionStorage.getItem('etlite_onboarding_state');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { taxId?: string; company?: { name?: string; representative?: string; address?: string } };
    return { taxId: parsed.taxId, ...parsed.company };
  } catch {
    return null;
  }
}
