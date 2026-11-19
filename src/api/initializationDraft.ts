/**
 * 開帳精靈草稿與原件 API（/ael/initialization/draft）：
 * - PUT／GET／DELETE /ael/initialization/draft：整份表單狀態（opaque JSON）＋樂觀鎖 version，供換裝置續填。
 *   DELETE 會連原件一起刪；開帳完成時後端自動刪草稿並封存原件，前端不需要呼叫。
 * - /ael/initialization/draft/files：使用者上傳的申報書原件（單檔 ≤5MB、PDF ≤50 頁，PDF／JPEG／PNG／WebP）。
 * 一律以 companyUuid 識別公司（= ac_uuid）。
 */
import { apiFetch, apiFetchFile, buildQuery } from './client';
import { COMPANY_UUID } from './config';

export interface DraftRecord {
  companyUuid: string;
  step: number;
  reportIndex: number;
  /** 前端整份草稿 JSON，後端原樣存、原樣回 */
  state: unknown;
  /** 每次儲存遞增，新建為 1 */
  version: number;
  /** 伺服器儲存時間（ISO 8601） */
  savedAt: string;
}

/** 草稿 version 衝突（errorCode 0409）時，失敗信封 data 帶的伺服器目前版本 */
export interface DraftConflictData {
  version: number;
  savedAt: string;
}

export const DRAFT_CONFLICT_CODE = '0409';

/** 讀取草稿；從未儲存過回 null */
export function getDraft(): Promise<DraftRecord | null> {
  return apiFetch<DraftRecord | null>(`/ael/initialization/draft${buildQuery({ companyUuid: COMPANY_UUID })}`);
}

/** 儲存草稿；baseVersion 新建傳 0，之後須等於伺服器目前 version，否則回 0409（見 DraftConflictData） */
export function saveDraft(params: { step: number; reportIndex: number; state: unknown; baseVersion: number }): Promise<DraftRecord> {
  return apiFetch<DraftRecord>('/ael/initialization/draft', {
    method: 'PUT',
    body: JSON.stringify({ companyUuid: COMPANY_UUID, ...params }),
  });
}

export type DraftFileKind = 'REPORT_SOURCE' | 'VAT_PERIOD';

export interface DraftFileMeta {
  fileId: string;
  fileName: string;
  sizeBytes: number;
  kind: DraftFileKind;
  /** kind=VAT_PERIOD 時為期別，如 114-01 */
  periodKey: string | null;
  uploadedAt: string;
}

/** 上傳原件；VAT_PERIOD 必須帶 periodKey */
export function uploadDraftFile(file: File, kind: DraftFileKind, periodKey?: string): Promise<DraftFileMeta> {
  const formData = new FormData();
  formData.append('companyUuid', COMPANY_UUID);
  formData.append('kind', kind);
  if (periodKey) formData.append('periodKey', periodKey);
  formData.append('file', file);
  return apiFetch<DraftFileMeta>('/ael/initialization/draft/files', { method: 'POST', body: formData });
}

export function listDraftFiles(): Promise<DraftFileMeta[]> {
  return apiFetch<DraftFileMeta[]>(`/ael/initialization/draft/files${buildQuery({ companyUuid: COMPANY_UUID })}`);
}

/** 下載原件本體（成功回檔案、失敗回 JSON 信封，由 apiFetchFile 處理） */
export function downloadDraftFile(fileId: string): Promise<Blob> {
  return apiFetchFile(`/ael/initialization/draft/files/${encodeURIComponent(fileId)}${buildQuery({ companyUuid: COMPANY_UUID })}`);
}

export function deleteDraftFile(fileId: string): Promise<{ fileId: string }> {
  return apiFetch(`/ael/initialization/draft/files/${encodeURIComponent(fileId)}${buildQuery({ companyUuid: COMPANY_UUID })}`, { method: 'DELETE' });
}
