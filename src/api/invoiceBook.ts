/**
 * 發票本端點封裝（/ael/invoiceBook/*，見 api.md「發票本」章節）。
 * 自動帶入 COMPANY_UUID，呼叫端（InvoiceBookTab/InvoiceBookDialog/TransactionMetaCard）不需重複組裝。
 * 注意：實測 dev 環境此三支 API 皆用 companyUuid 作為公司 uuid 參數名（api.md 舊版文件標示為 uuid，經 curl
 * 直接測試 dev.relianz.tw 確認以 companyUuid 才能通過後端必填欄位檢查）。
 */
import { apiFetch, buildQuery } from './client';
import { COMPANY_UUID } from './config';
import type { InvoiceBookListResult, InvoiceBookPeriodDto, SaveInvoiceBookBody, SaveInvoiceBookResult } from './types';

/** 依公司 + 民國年 + 期別列發票本（GET /ael/invoiceBook） */
export function listInvoiceBooks(params: { year: number; phase: number }): Promise<InvoiceBookListResult> {
  return apiFetch<InvoiceBookListResult>(
    `/ael/invoiceBook${buildQuery({ companyUuid: COMPANY_UUID, year: params.year, phase: params.phase })}`,
  );
}

/** 新增發票本（POST /ael/invoiceBook/save）；uuid 由後端產生，回應內的 invoiceBookId 即為新發票本 uuid */
export function saveInvoiceBook(body: Omit<SaveInvoiceBookBody, 'companyUuid'>): Promise<SaveInvoiceBookResult> {
  return apiFetch<SaveInvoiceBookResult>('/ael/invoiceBook/save', {
    method: 'POST',
    body: JSON.stringify({ ...body, companyUuid: COMPANY_UUID }),
  });
}

/** 發票本跳號（POST /ael/invoiceBook/passNumber）；回傳新建跳號/作廢銷項發票 uuid */
export function passInvoiceBookNumber(params: { invoiceBookId: string }): Promise<{ invoiceUuid: string }> {
  return apiFetch<{ invoiceUuid: string }>('/ael/invoiceBook/passNumber', {
    method: 'POST',
    body: JSON.stringify({ companyUuid: COMPANY_UUID, invoiceBookId: params.invoiceBookId }),
  });
}

/** 設定頁顯示發票簿期別（GET /ael/invoiceBook/getDate/forSetting）；供「發票期間」下拉選單動態帶出可選期別 */
export function listInvoiceBookPeriods(): Promise<InvoiceBookPeriodDto[]> {
  return apiFetch<InvoiceBookPeriodDto[]>(`/ael/invoiceBook/getDate/forSetting${buildQuery({ companyUuid: COMPANY_UUID })}`);
}
