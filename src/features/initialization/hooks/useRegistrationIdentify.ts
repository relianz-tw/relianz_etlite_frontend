'use client';

import { useState } from 'react';
import { identifyCit } from '@/api/peit';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { toJpegFile } from '@/lib/imageToJpeg';
import { useInitialization } from '../state/InitializationContext';
import type { InitializationState } from '../state/initializationReducer';
import {
  COMPANY_REGISTRATION_KEY,
  IDENTIFY_MAX_SIZE_MB,
  REGISTRATION_FORM_NO,
  REGISTRATION_FORM_YEAR,
  REGISTRATION_OFFICER_TO_COVER,
  REGISTRATION_TO_COMPANY,
  REGISTRATION_TO_COVER,
  isMaskedValue,
  getCurrentOpenYear,
  officerRows,
  resolveToday,
  withoutSharedFields,
} from '../reports';
import { toRowValues, toValueMap } from '../reports/identifiedValues';
import { classifyEntity, inferOrgType } from '../reports/registrationDocs';
import type { RegistrationMismatch } from '../components/RegistrationMismatchDialog';
import { loadFormMetadata } from './useFormMetadata';
import { toast } from 'sonner';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'heic', 'heif'];

function getExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

/** notice：辨識沒抓到東西或檔案太大，只提醒不阻擋，使用者仍可直接往下一步手動填 */
type IdentifyStatus = 'idle' | 'recognizing' | 'notice' | 'error';

export interface RegistrationIdentify {
  status: IdentifyStatus;
  message: string;
  /** 辨識一份登記事項表並把結果帶進後面的頁面；非 PDF／圖片直接略過 */
  run: (file: File) => Promise<void>;
  /** 辨識到的公司與付款資料不一致時的對照內容，沒有就是 null */
  mismatch: RegistrationMismatch | null;
  /** 使用者的選擇：改用文件上的資料，或保留目前的 */
  resolveMismatch: (useDocument: boolean) => void;
}

/** 比對用：去掉所有空白再比，排版差異不算不吻合 */
function squash(value: string | number | undefined): string {
  return String(value ?? '').replace(/\s/g, '');
}

/**
 * 「最新設立或變更登記事項表」的辨識與帶入（步驟 2）。
 * 刻意與申報書的 FormIdentifyPanel 分開：這裡沒有對照面板、沒有覆蓋確認視窗，
 * 重新選檔案本身就是使用者的確認，直接以新結果取代。
 */
export function useRegistrationIdentify(): RegistrationIdentify {
  const { state, dispatch } = useInitialization();
  const [status, setStatus] = useState<IdentifyStatus>('idle');
  const [message, setMessage] = useState('');
  const [mismatch, setMismatch] = useState<RegistrationMismatch | null>(null);

  const run = async (originalFile: File) => {
    const isPdf = originalFile.type === 'application/pdf';
    // HEIC 常拿到空的 file.type，圖片一律以副檔名判斷
    const isImage = IMAGE_EXTENSIONS.includes(getExtension(originalFile.name));
    if (!isPdf && !isImage) {
      setStatus('notice');
      setMessage('這個格式無法辨識，檔案已保留，請於後面的頁面手動填寫');
      return;
    }

    setStatus('recognizing');
    setMessage('');
    try {
      // PNG、HEIC 先轉成 JPG 再送。上傳當下已擋過大小，這裡再測一次轉檔後的實際檔案（轉檔可能變大）
      const file = isImage ? await toJpegFile(originalFile) : originalFile;
      if (file.size > IDENTIFY_MAX_SIZE_MB * 1024 * 1024) {
        setStatus('notice');
        setMessage(`檔案超過 ${IDENTIFY_MAX_SIZE_MB}MB 無法辨識，檔案已保留，請於後面的頁面手動填寫`);
        return;
      }

      // 辨識需帶開帳民國年，但這一步還沒選（步驟 3 才選），一律退回依日期推算的當期年度
      const openingYear = state.openYear ?? getCurrentOpenYear(resolveToday(state.simulatedDate));
      // 欄位標籤要等 metadata 才畫得出摘要卡，先一起撈進快取；撈失敗不能擋住資料帶入
      const [result] = await Promise.all([identifyCit(file, openingYear), loadFormMetadata(REGISTRATION_FORM_NO, REGISTRATION_FORM_YEAR).catch(() => null)]);

      const form = result.forms.find(f => f.formCode === COMPANY_REGISTRATION_KEY);
      if (!form || (!form.present && !form.errorCode)) {
        setStatus('notice');
        setMessage('這份檔案沒有辨識到登記事項表的資料，可直接進行下一步');
        return;
      }
      if (form.errorCode) {
        setStatus('error');
        setMessage(form.errorMessage || '登記事項表辨識失敗，請於後面的頁面手動填寫');
        return;
      }

      const values = toValueMap(form.fields);
      // 四組明細列只留董監事：其餘三組用不到，混在同一個扁平陣列裡會讓列索引對不上（見 officerRows）
      const officers = officerRows(toRowValues(form.rows));

      // 共用的公司識別欄位挑掉後才送 APPLY_IDENTIFIED_FORM，避免 aiFilled 散到每一張結算表
      dispatch({
        type: 'APPLY_IDENTIFIED_FORM',
        payload: { reportId: COMPANY_REGISTRATION_KEY, fields: withoutSharedFields(values), rows: officers },
      });

      // 這三個都只補空白，不會蓋掉付款資料，所以不必等使用者決定、先帶入沒關係
      applyToCover(values, officers, state, dispatch);
      applyToCompany(values, state, dispatch);
      applyToInvestors(officers, state, dispatch);

      // 文件上的公司和系統登記的不是同一間時事後詢問；付款資料那一欄是空的就沒有基準，不比
      const document = { taxId: String(values.HDR_TAX_ID ?? ''), companyName: String(values.NAME_ZH ?? '') };
      const system = { taxId: state.payment.taxId, companyName: state.payment.companyName };
      const differs =
        (!!system.taxId && !!document.taxId && squash(system.taxId) !== squash(document.taxId)) ||
        (!!system.companyName && !!document.companyName && squash(system.companyName) !== squash(document.companyName));
      setMismatch(differs ? { system, document } : null);

      setStatus('idle');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setMessage(getFriendlyErrorMessage(err, '登記事項表辨識失敗，請於後面的頁面手動填寫'));
    }
  };

  /** 改用文件上的資料：付款資料與封面都以文件為準改寫（這裡是刻意覆蓋，不是只補空白） */
  const resolveMismatch = (useDocument: boolean) => {
    const current = mismatch;
    setMismatch(null);
    if (!useDocument || !current) return;
    const { taxId, companyName } = current.document;
    dispatch({ type: 'SET_PAYMENT_INFO', payload: { ...(taxId ? { taxId } : {}), ...(companyName ? { companyName } : {}) } });
    if (taxId) dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId: 'CIT_COVER', key: 'HDR_VAT_NO', value: taxId } });
    if (companyName) dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId: 'CIT_COVER', key: 'HDR_COMPANY_NAME', value: companyName } });
    dispatch({ type: 'SET_COMPANY', payload: { ...(taxId ? { taxId } : {}), ...(companyName ? { name: companyName } : {}) } });
    // 公司／商號的分類若跟著翻面，下方的文件清單會整組換掉，不講一聲使用者會以為畫面壞了
    if (companyName && classifyEntity(companyName) !== classifyEntity(current.system.companyName)) {
      dispatch({ type: 'INFER_ORG_TYPE', payload: inferOrgType(companyName, !!state.registrationFiles.PARTNERSHIP_AGREEMENT) });
      toast('已依文件上的公司名稱調整需要上傳的文件清單');
    }
  };

  return { status, message, run, mismatch, resolveMismatch };
}

type Dispatch = ReturnType<typeof useInitialization>['dispatch'];

/**
 * 寫進封面的共用公司識別欄位（只補空白）。SET_REPORT_FIELD 以 aiFilled=false 寫入，
 * 並由 setReportFieldSynced 自動推播到其餘每一張報表，不需要另外接線。
 */
function applyToCover(values: Record<string, string | number>, officers: Record<string, string | number>[], state: InitializationState, dispatch: Dispatch) {
  const cover = state.reports.CIT_COVER?.fields ?? {};
  // 負責人的身分證字號與住居所在董監事名單裡（姓名與 REPRESENTATIVE 相同的那一列），不是固定欄位
  const representative = String(values.REPRESENTATIVE ?? '').trim();
  const ownerRow = representative ? officers.find(row => String(row.ROW_NAME ?? '').trim() === representative) : undefined;
  const ownerValues: Record<string, string | number> = {};
  for (const [from, to] of Object.entries(REGISTRATION_OFFICER_TO_COVER)) {
    const value = ownerRow?.[from];
    if (value !== undefined && value !== '') ownerValues[to] = value;
  }

  for (const [from, to] of Object.entries(REGISTRATION_TO_COVER)) {
    const value = values[from];
    if (value === undefined || value === '') continue;
    if ((cover[to]?.value ?? '') !== '') continue;
    dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId: 'CIT_COVER', key: to, value } });
  }
  // 封面這兩格的原件常是遮蔽的（F12617****），登記表的完整值一律蓋過去
  for (const [to, value] of Object.entries(ownerValues)) {
    const current = cover[to]?.value ?? '';
    if (current !== '' && !isMaskedValue(current)) continue;
    dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId: 'CIT_COVER', key: to, value } });
  }
}

/** 未滿一年那條路線沒有封面，公司資料直接讀 state.company，所以同一份值也補一次（只補空白） */
function applyToCompany(values: Record<string, string | number>, state: InitializationState, dispatch: Dispatch) {
  const patch: Partial<InitializationState['company']> = {};
  for (const [from, to] of Object.entries(REGISTRATION_TO_COMPANY)) {
    const value = values[from];
    if (value === undefined || value === '' || state.company[to] !== '') continue;
    patch[to] = String(value);
  }
  if (Object.keys(patch).length > 0) dispatch({ type: 'SET_COMPANY', payload: patch });
}

/**
 * 董監事名單帶進投資人明細表（姓名、統編、持股三欄同名）。
 * 只在該表還完全沒有資料時帶，且只帶真的持股的人；名單本身不是完整股東名冊，
 * 使用者在步驟 4 的投資人明細頁要自行補齊其餘股東（摘要卡底下有註明）。
 */
function applyToInvestors(officers: Record<string, string | number>[], state: InitializationState, dispatch: Dispatch) {
  const existing = state.reports.CIT_INVESTORS?.rows ?? [];
  if (existing.some(row => Object.values(row).some(field => field.value !== '' && field.value !== 0))) return;
  const rows = officers
    .filter(row => Number(row.ROW_SHARES) > 0)
    .map(row => ({ ROW_NAME: row.ROW_NAME ?? '', ROW_ID_NO: row.ROW_ID_NO ?? '', ROW_SHARES: row.ROW_SHARES ?? '' }));
  if (rows.length === 0) return;
  dispatch({ type: 'APPLY_IDENTIFIED_FORM', payload: { reportId: 'CIT_INVESTORS', fields: {}, rows } });
}
