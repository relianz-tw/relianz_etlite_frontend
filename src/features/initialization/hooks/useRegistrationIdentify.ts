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
  REGISTRATION_TO_COMPANY,
  REGISTRATION_TO_COVER,
  getCurrentOpenYear,
  officerRows,
  resolveToday,
  withoutSharedFields,
} from '../reports';
import { toRowValues, toValueMap } from '../reports/identifiedValues';
import { loadFormMetadata } from './useFormMetadata';

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

      applyToCover(values, state, dispatch);
      applyToCompany(values, state, dispatch);
      applyToInvestors(officers, state, dispatch);

      setStatus('idle');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setMessage(getFriendlyErrorMessage(err, '登記事項表辨識失敗，請於後面的頁面手動填寫'));
    }
  };

  return { status, message, run };
}

type Dispatch = ReturnType<typeof useInitialization>['dispatch'];

/**
 * 寫進封面的共用公司識別欄位（只補空白）。SET_REPORT_FIELD 以 aiFilled=false 寫入，
 * 並由 setReportFieldSynced 自動推播到其餘每一張報表，不需要另外接線。
 */
function applyToCover(values: Record<string, string | number>, state: InitializationState, dispatch: Dispatch) {
  const cover = state.reports.CIT_COVER?.fields ?? {};
  for (const [from, to] of Object.entries(REGISTRATION_TO_COVER)) {
    const value = values[from];
    if (value === undefined || value === '') continue;
    if ((cover[to]?.value ?? '') !== '') continue;
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
