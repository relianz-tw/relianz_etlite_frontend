/**
 * 各類扣繳繳款書／繳款證明／繳納狀態／二代健保申報封裝（/ael/withholding/{withholding,healthInsurance}/*、
 * .../declare/*，見 Apifox EasyTax_Lite 專案「各類扣繳」分類）。自動帶入 companyUuid，呼叫端不需重複組裝。
 * 與「公司行號負擔二代健保」（src/api/withholdingInsurance.ts）為不同業務，不合併。
 *
 * ⚠️ 年制：
 *   - listWithholdingPdfDocs 依 withholdingSummaryUuid 查詢，不帶年月參數，無需換算。
 *   - generateWithholdingPdf／uploadWithholdingProof 的 year／paymentYear 規格未標註年制，比照本模組其餘
 *     端點慣例假設為民國並換算，待實測確認（此為已知落差，待回報後端統一西元）。
 *   - declareNhiPreview／declareNhi 的 paymentYear 規格明確標註民國，換算無疑義。
 */
import { apiFetch, buildQuery } from './client';
import { COMPANY_UUID } from './config';
import type {
  CheckNhiDeclareStatusResult,
  DeclareNhiBody,
  DeclareNhiResult,
  GenerateWithholdingPdfBody,
  GenerateWithholdingPdfResult,
  UpdateNhiDeclareFlagBody,
  UpdateWithholdingStatusBody,
  UpdateWithholdingStatusResult,
  UploadWithholdingProofParams,
  WithholdingPdfDto,
} from './types';

const toRocYear = (year: number) => year - 1911;

/** 繳款書／繳款證明分屬「各類扣繳」與「二代健保」兩組端點，用此區分打哪一組 */
export type WithholdingPdfKind = 'withholding' | 'healthInsurance';

/** 查詢已產生的繳款書或繳款證明（GET /ael/withholding/{kind}/pdf） */
export async function listWithholdingPdfDocs(
  kind: WithholdingPdfKind,
  params: { incomeCode: string; withholdingSummaryUuid: string; isPaymentProofDoc: boolean },
): Promise<WithholdingPdfDto[]> {
  const data = await apiFetch<WithholdingPdfDto[] | null>(
    `/ael/withholding/${kind}/pdf${buildQuery({ companyUuid: COMPANY_UUID, ...params })}`,
  );
  return data ?? [];
}

/** 產生繳款書（POST /ael/withholding/download/{kind}/pdf，對外收西元年） */
export function generateWithholdingPdf(kind: WithholdingPdfKind, body: Omit<GenerateWithholdingPdfBody, 'companyUuid'>): Promise<GenerateWithholdingPdfResult> {
  return apiFetch<GenerateWithholdingPdfResult>(`/ael/withholding/download/${kind}/pdf`, {
    method: 'POST',
    body: JSON.stringify({
      ...body,
      companyUuid: COMPANY_UUID,
      year: toRocYear(body.year),
      paymentYear: toRocYear(body.paymentYear),
    }),
  });
}

/** 上傳繳款證明（POST /ael/withholding/upload/{kind}/proof/pdf，multipart/form-data，對外收西元年） */
export function uploadWithholdingProof(kind: WithholdingPdfKind, params: UploadWithholdingProofParams): Promise<GenerateWithholdingPdfResult> {
  const formData = new FormData();
  formData.append('companyUuid', COMPANY_UUID);
  formData.append('incomeCode', params.incomeCode);
  formData.append('withholdingSummaryUuid', params.withholdingSummaryUuid);
  formData.append('year', String(toRocYear(params.year)));
  formData.append('month', String(params.month));
  if (params.day !== undefined) formData.append('day', String(params.day));
  formData.append('isLabourForm', String(params.isLabourForm));
  formData.append('file', params.file);
  return apiFetch<GenerateWithholdingPdfResult>(`/ael/withholding/upload/${kind}/proof/pdf`, { method: 'POST', body: formData });
}

/** 刪除繳款書或繳款證明（DELETE /ael/withholding/pdf?uuid=） */
export function deleteWithholdingPdf(uuid: string): Promise<void> {
  return apiFetch<void>(`/ael/withholding/pdf${buildQuery({ uuid })}`, { method: 'DELETE' });
}

/** 更新各類扣繳繳納狀態（POST /ael/withholding/withholding/update/status） */
export function updateWithholdingPaidStatus(body: UpdateWithholdingStatusBody): Promise<UpdateWithholdingStatusResult> {
  return apiFetch<UpdateWithholdingStatusResult>('/ael/withholding/withholding/update/status', { method: 'POST', body: JSON.stringify(body) });
}

/** 更新二代健保繳納狀態（POST /ael/withholding/healthInsurance/update/status） */
export function updateNhiPaidStatus(body: UpdateWithholdingStatusBody): Promise<UpdateWithholdingStatusResult> {
  return apiFetch<UpdateWithholdingStatusResult>('/ael/withholding/healthInsurance/update/status', { method: 'POST', body: JSON.stringify(body) });
}

/**
 * 申報二代健保（POST /ael/withholding/healthInsurance/declare，對外收西元年）。
 * ⚠️ 未接 .../declare/preview（預覽逐筆申報明細）：目前畫面「申報」為單顆按鈕直接送出，
 * 不比照原專案額外顯示預覽表格，屬本次刻意簡化的範圍，待有實際 UI 需求再補上。
 */
export function declareNhi(body: Omit<DeclareNhiBody, 'companyUuid' | 'paymentYear'> & { paymentYear: number }): Promise<DeclareNhiResult> {
  return apiFetch<DeclareNhiResult>('/ael/withholding/healthInsurance/declare', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID, paymentYear: toRocYear(body.paymentYear) }),
  });
}

/** 查詢二代健保申報狀態（GET /ael/withholding/healthInsurance/declare/checkstatus） */
export function checkNhiDeclareStatus(params: { nhiDeclareRecordUuid: string; code: string }): Promise<CheckNhiDeclareStatusResult> {
  return apiFetch<CheckNhiDeclareStatusResult>(`/ael/withholding/healthInsurance/declare/checkstatus${buildQuery(params)}`);
}

/** 更新二代健保申報旗標（POST /ael/withholding/healthInsurance/declare/update/status） */
export function updateNhiDeclareFlag(body: UpdateNhiDeclareFlagBody): Promise<void> {
  return apiFetch<void>('/ael/withholding/healthInsurance/declare/update/status', { method: 'POST', body: JSON.stringify(body) });
}
