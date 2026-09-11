/**
 * 勞報單相關端點封裝（/ael/labour/*，見 Apifox EasyTax_Lite 專案「勞報單」分類）。
 * 自動帶入 companyUuid，呼叫端不需重複組裝。
 */
import { apiFetch, buildQuery } from './client';
import { COMPANY_UUID } from './config';
import type {
  CreateLabourBody,
  CreateLabourResult,
  DeleteLabourResult,
  LabourCalculateBody,
  LabourCalculateResult,
  LabourCountryDto,
  LabourDateDto,
  LabourFilterBody,
  LabourFormDto,
  LabourProviderDto,
  LabourSignResult,
  SaveLabourProviderBody,
  UpdateLabourBasicInfoBody,
  UpdateLabourBasicInfoResult,
  UpdateLabourPaymentDateBody,
  UpdateLabourPaymentDateResult,
} from './types';

/** 查詢公司目前有勞報單資料的（勞務提供）年月，DESC 排序，供列表年／月下拉選單使用（GET /ael/labour/date） */
export function listLabourDates(): Promise<LabourDateDto[]> {
  return apiFetch<LabourDateDto[]>(`/ael/labour/date${buildQuery({ companyUuid: COMPANY_UUID })}`);
}

/**
 * 勞報單主列表篩選（POST /ael/labour/data/filter）；不分頁，依 createTime DESC 排序。
 * ⚠️ isSign 為後端必填欄位，畫面「全部」選項請改用 fetchLabourListAllSignStatus。
 */
export function fetchLabourList(body: Omit<LabourFilterBody, 'companyUuid'>): Promise<LabourFormDto[]> {
  return apiFetch<LabourFormDto[]>('/ael/labour/data/filter', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/**
 * 簽署狀態篩選「全部」時，因後端 isSign 必填，分別查已簽署／未簽署後於前端合併並依 createTime DESC 排序。
 * 待後端將 isSign 改為選填後可移除此函式，改直接呼叫 fetchLabourList。
 */
export async function fetchLabourListAllSignStatus(body: Omit<LabourFilterBody, 'companyUuid' | 'isSign'>): Promise<LabourFormDto[]> {
  const [signed, unsigned] = await Promise.all([fetchLabourList({ ...body, isSign: true }), fetchLabourList({ ...body, isSign: false })]);
  return [...signed, ...unsigned].sort((a, b) => (a.createTime < b.createTime ? 1 : -1));
}

/** 查看勞報單單筆詳情（GET /ael/labour）；incomeCode 對應 serviceType（50｜9A｜9B） */
export function getLabourDetail(params: { labourUuid: string; incomeCode?: string }): Promise<LabourFormDto> {
  return apiFetch<LabourFormDto>(`/ael/labour${buildQuery({ companyUuid: COMPANY_UUID, ...params })}`);
}

/** 創建勞報單（POST /ael/labour） */
export function createLabour(body: Omit<CreateLabourBody, 'companyUuid'>): Promise<CreateLabourResult> {
  return apiFetch<CreateLabourResult>('/ael/labour', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/** 刪除勞報單（DELETE /ael/labour，2026-09-11 後端新增） */
export function deleteLabour(labourUuid: string): Promise<DeleteLabourResult> {
  return apiFetch<DeleteLabourResult>(`/ael/labour${buildQuery({ companyUuid: COMPANY_UUID, labourUuid })}`, { method: 'DELETE' });
}

/** 更新勞報單基本資料，含簽署頁最後一步（PATCH /ael/labour） */
export function updateLabourBasicInfo(body: UpdateLabourBasicInfoBody): Promise<UpdateLabourBasicInfoResult> {
  return apiFetch<UpdateLabourBasicInfoResult>('/ael/labour', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/** 試算勞報單扣繳／二代健保／實付（POST /ael/labour/calculate） */
export function calculateLabour(body: LabourCalculateBody): Promise<LabourCalculateResult> {
  return apiFetch<LabourCalculateResult>('/ael/labour/calculate', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** 更新勞報單給付日（POST /ael/labour/paymentDate） */
export function updateLabourPaymentDate(body: Omit<UpdateLabourPaymentDateBody, 'companyUuid'>): Promise<UpdateLabourPaymentDateResult> {
  return apiFetch<UpdateLabourPaymentDateResult>('/ael/labour/paymentDate', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/**
 * 簽署勞報單，含上傳證件照（POST /ael/labour/sign，multipart/form-data）。
 * ⚠️ 規格書僅列出 labourUuid 為請求欄位，檔案表單欄位名沿用回應 data.files 的 key
 * （sign_pic／id_pic_front／id_pic_back／passport_pic／health_insurance_pic），實際欄位名需與後端確認。
 * 簽署頁目前無真實簽名板，故不上傳 sign_pic。
 */
export function signLabour(params: { labourUuid: string; idPicFront?: File; idPicBack?: File; passportPic?: File }): Promise<LabourSignResult> {
  const formData = new FormData();
  formData.append('labourUuid', params.labourUuid);
  if (params.idPicFront) formData.append('id_pic_front', params.idPicFront);
  if (params.idPicBack) formData.append('id_pic_back', params.idPicBack);
  if (params.passportPic) formData.append('passport_pic', params.passportPic);
  return apiFetch<LabourSignResult>('/ael/labour/sign', { method: 'POST', body: formData });
}

/** 查詢國籍碼表（GET /ael/labour/country） */
export function listLabourCountries(): Promise<LabourCountryDto[]> {
  return apiFetch<LabourCountryDto[]>('/ael/labour/country');
}

/** 姓名模糊查勞務提供者，供新增勞報單姓名自動完成（GET /ael/labour/provider/name） */
export function searchLabourProvidersByName(name: string): Promise<LabourProviderDto[]> {
  return apiFetch<LabourProviderDto[]>(`/ael/labour/provider/name${buildQuery({ companyUuid: COMPANY_UUID, name })}`);
}

/** 精準查勞務提供者（GET /ael/labour/provider） */
export function findLabourProvider(params: { name?: string; identifyNumber?: string; residencePermitNumber?: string; passportNumber?: string }): Promise<LabourProviderDto[]> {
  return apiFetch<LabourProviderDto[]>(`/ael/labour/provider${buildQuery({ companyUuid: COMPANY_UUID, ...params })}`);
}

/** Upsert 勞務提供者，供「記住這位勞務者資料」使用（POST /ael/labour/provider） */
export function saveLabourProvider(body: Omit<SaveLabourProviderBody, 'companyUuid'>): Promise<LabourProviderDto> {
  return apiFetch<LabourProviderDto>('/ael/labour/provider', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}
