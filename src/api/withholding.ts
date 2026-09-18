/**
 * 各類扣繳（其他 9 類，不含租金 51／薪資 50／公司負擔二代健保）明細層封裝（/ael/withholding/*，
 * 見 Apifox EasyTax_Lite 專案「各類扣繳」分類）。自動帶入 companyUuid，呼叫端不需重複組裝。
 *
 * ⚠️ 年制：filter 的 paymentYear／incomeYear、create/update 的 year 皆為民國年（api.md 範例確認），
 *   對外統一收西元，這裡用 toRocYear() 換算；回應內 summaryYear 年制未標註，待實測後確認是否需要換算，
 *   暫由呼叫端（mapper.ts）視為與請求年制一致（民國）換算回西元。此為已知落差，待回報後端統一西元。
 *
 * 租金（51）欄位形狀與其餘 8 類差異太大（landlords／附件／稅費負擔設定等），獨立成 rental* 系列函式；
 * 其餘 8 類（9A／9B／53／5B／91／93／97／92）結構高度相同，共用同一組泛型函式，
 * 透過 WITHHOLDING_ENDPOINTS 對照表決定實際打哪個 base path，不逐類別各寫一份重複程式碼。
 */
import { apiFetch, buildQuery } from './client';
import { COMPANY_UUID } from './config';
import type {
  CreateRentalBody,
  CreateRentalResult,
  RentalFilterBody,
  RentalFilterResult,
  RentalRecordDto,
  UpdateRentalBody,
  WithholdingCategoryCode,
  WithholdingCodeDto,
  WithholdingOtherCreateResult,
  WithholdingOtherFilterBody,
  WithholdingOtherFilterResult,
  WithholdingOtherRecordDto,
  WithholdingOtherSaveBody,
  WithholdingOtherUpdateBody,
} from './types';

const toRocYear = (year: number) => year - 1911;

export type OtherWithholdingCategoryCode = Exclude<WithholdingCategoryCode, '51'>;

/** 9 類（不含租金）各自的端點 base path，對照 CategoryCode */
const WITHHOLDING_ENDPOINTS: Record<OtherWithholdingCategoryCode, string> = {
  '9A': '/ael/withholding/professionalPractice',
  '9B': '/ael/withholding/royalty',
  '53': '/ael/withholding/rightsRoyalty',
  '5B': '/ael/withholding/otherInterest',
  '91': '/ael/withholding/lottery',
  '93': '/ael/withholding/severancePay',
  '97': '/ael/withholding/donation',
  '92': '/ael/withholding/otherIncome',
};

/** 篩選 9 類（不含租金）之一的列表（POST /ael/withholding/{category}/filter，對外收西元年） */
export function filterWithholdingOther(
  category: OtherWithholdingCategoryCode,
  body: Omit<WithholdingOtherFilterBody, 'companyUuid'>,
): Promise<WithholdingOtherFilterResult> {
  return apiFetch<WithholdingOtherFilterResult>(`${WITHHOLDING_ENDPOINTS[category]}/filter`, {
    method: 'POST',
    body: JSON.stringify({
      ...body,
      companyUuid: COMPANY_UUID,
      paymentYear: body.paymentYear !== undefined ? toRocYear(body.paymentYear) : undefined,
      incomeYear: body.incomeYear !== undefined ? toRocYear(body.incomeYear) : undefined,
    }),
  });
}

/** 新增 9 類（不含租金）之一（POST /ael/withholding/{category}，對外收西元年） */
export function createWithholdingOther(
  category: OtherWithholdingCategoryCode,
  body: Omit<WithholdingOtherSaveBody, 'companyUuid'>,
): Promise<WithholdingOtherCreateResult> {
  return apiFetch<WithholdingOtherCreateResult>(WITHHOLDING_ENDPOINTS[category], {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID, year: toRocYear(body.year) }),
  });
}

/** 更新 9 類（不含租金）之一（PATCH /ael/withholding/{category}，對外收西元年） */
export function updateWithholdingOther(category: OtherWithholdingCategoryCode, body: Omit<WithholdingOtherUpdateBody, 'companyUuid'>): Promise<void> {
  return apiFetch<void>(WITHHOLDING_ENDPOINTS[category], {
    method: 'PATCH',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID, year: toRocYear(body.year) }),
  });
}

/** 刪除 9 類（不含租金）之一（DELETE /ael/withholding/{category}?uuid=） */
export function deleteWithholdingOther(category: OtherWithholdingCategoryCode, withholdingSummaryUuid: string): Promise<void> {
  return apiFetch<void>(`${WITHHOLDING_ENDPOINTS[category]}${buildQuery({ uuid: withholdingSummaryUuid })}`, { method: 'DELETE' });
}

/** 篩選租金列表（POST /ael/withholding/rental/filter，對外收西元年） */
export function filterRental(body: Omit<RentalFilterBody, 'companyUuid'>): Promise<RentalFilterResult> {
  return apiFetch<RentalFilterResult>('/ael/withholding/rental/filter', {
    method: 'POST',
    body: JSON.stringify({
      ...body,
      companyUuid: COMPANY_UUID,
      paymentYear: body.paymentYear !== undefined ? toRocYear(body.paymentYear) : undefined,
      incomeYear: body.incomeYear !== undefined ? toRocYear(body.incomeYear) : undefined,
    }),
  });
}

/** 新增租金（POST /ael/withholding/rental，對外收西元年） */
export function createRental(body: Omit<CreateRentalBody, 'companyUuid'>): Promise<CreateRentalResult> {
  return apiFetch<CreateRentalResult>('/ael/withholding/rental', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID, year: toRocYear(body.year) }),
  });
}

/** 更新租金（PATCH /ael/withholding/rental，對外收西元年） */
export function updateRental(body: Omit<UpdateRentalBody, 'companyUuid'>): Promise<void> {
  return apiFetch<void>('/ael/withholding/rental', {
    method: 'PATCH',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID, year: toRocYear(body.year) }),
  });
}

/** 刪除租金（DELETE /ael/withholding/rental?uuid=） */
export function deleteRental(withholdingSummaryUuid: string): Promise<void> {
  return apiFetch<void>(`/ael/withholding/rental${buildQuery({ uuid: withholdingSummaryUuid })}`, { method: 'DELETE' });
}

/** 查詢各租賃地址最新一期租金，供「快速帶入上期資料」使用（GET /ael/withholding/rental/latest） */
export async function listLatestRentals(): Promise<RentalRecordDto[]> {
  const data = await apiFetch<RentalRecordDto[] | null>(`/ael/withholding/rental/latest${buildQuery({ companyUuid: COMPANY_UUID })}`);
  return data ?? [];
}

/** 上傳租金附件（POST /ael/withholding/rental/files，multipart/form-data） */
export function uploadRentalFile(params: { withholdingSummaryUuid: string; fileName: string; password?: string; file: File }): Promise<void> {
  const formData = new FormData();
  formData.append('withholdingSummaryUuid', params.withholdingSummaryUuid);
  formData.append('fileName', params.fileName);
  if (params.password) formData.append('password', params.password);
  formData.append('file', params.file);
  return apiFetch<void>('/ael/withholding/rental/files', { method: 'POST', body: formData });
}

/** 刪除租金附件（DELETE /ael/withholding/rental/files?uuid=） */
export function deleteRentalFile(fileUuid: string): Promise<void> {
  return apiFetch<void>(`/ael/withholding/rental/files${buildQuery({ uuid: fileUuid })}`, { method: 'DELETE' });
}

/**
 * 查詢單筆扣繳明細（GET /ael/withholding/detail）；編輯頁與詳情頁改用此支直接取單筆，
 * 不比照原專案（relianz_cashflow_frontend）撈整批列表再前端 find。
 * incomeType 為 51／9A／9B／53／5B／91／93／97／92（不含 50 薪資）。
 */
export function getWithholdingDetail(
  withholdingSummaryUuid: string,
  incomeType: WithholdingCategoryCode,
): Promise<WithholdingOtherRecordDto | RentalRecordDto> {
  return apiFetch<WithholdingOtherRecordDto | RentalRecordDto>(
    `/ael/withholding/detail${buildQuery({ companyUuid: COMPANY_UUID, withholdingSummaryUuid, incomeType })}`,
  );
}

/** 查詢各類扣繳碼表（GET /ael/withholding/code），type=1 執行業務業別／2 稿費必要費用別／3 其他所得給付項目 */
export function listWithholdingCodes(type: 1 | 2 | 3): Promise<WithholdingCodeDto[]> {
  return apiFetch<WithholdingCodeDto[]>(`/ael/withholding/code${buildQuery({ type })}`);
}
