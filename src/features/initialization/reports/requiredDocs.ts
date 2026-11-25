import type { InitializationState } from '../state/initializationReducer';
import { getFormItem } from './formList';
import { getPageLabel, isPageFilled, resolveReportPage } from './reportPages';

/** 封面不在步驟 4 的逐頁清單（它是步驟 3），但同樣是這條路徑要備齊的文件，所以補在最前面 */
export const COVER_CODE = 'CIT_COVER';

export type RequiredDocStatus = 'identified' | 'manual' | 'empty';

export interface RequiredDoc {
  /** 頁面 key：營所稅為 formCode，營業稅為期別頁 key；辨識結果也是用這個對回文件 */
  key: string;
  label: string;
  /** 資料存放處（401／403 擇一後的 key），狀態由它推得 */
  reportKey: string;
  /** 分「必填／選填」兩區用 */
  required: boolean;
  status: RequiredDocStatus;
  /** 辨識來源的檔名；手填或未填沒有 */
  sourceName?: string;
  /** 辨識帶入的時間（ISO 8601）；手填沒有 */
  importedAt?: string;
}

type DocsState = Pick<InitializationState, 'reportPages' | 'vatChoices' | 'reports' | 'formSources'>;

interface DocsSources {
  /** 401／403 的原件存在該期別頁自己身上，不在營所稅的上傳列表裡 */
  vatUploads: Record<string, File>;
  sourceFiles: { id: string; file: File }[];
}

/**
 * 這間公司這條開帳路徑需要備齊的文件清單（封面＋步驟 4 逐頁），份數與順序依組織型態、設立年度、
 * 開帳基準日動態算出。狀態全部由草稿 state 推得（辨識來源 formSources、有無資料 isPageFilled），
 * 不另存一份「已帶入」名單。文件備齊清單與匯入覆蓋確認視窗共用這一份。
 */
export function buildRequiredDocs(state: DocsState, { vatUploads, sourceFiles }: DocsSources): RequiredDoc[] {
  const base = [
    // 營所稅的必填／選填看 FORM_LIST 的 optional（財產目錄、未攤銷費用明細表為「如有」）；
    // 營業稅看期別本身是否落在開帳年度（ReportPageSpec.required），營所稅各頁的 required 一律是 false，不能拿來判斷
    { key: COVER_CODE, label: getFormItem(COVER_CODE).title, reportKey: COVER_CODE, required: !getFormItem(COVER_CODE).optional, sourceName: undefined as string | undefined },
    ...state.reportPages.map(spec => {
      const { reportKey, formCode } = resolveReportPage(spec, state.vatChoices);
      return {
        key: spec.key,
        label: getPageLabel(spec, state.vatChoices),
        reportKey,
        required: spec.period ? spec.required : !getFormItem(formCode).optional,
        sourceName: spec.period ? vatUploads[spec.key]?.name : undefined,
      };
    }),
  ];

  return base.map(doc => {
    const source = state.formSources[doc.reportKey];
    const status: RequiredDocStatus = source ? 'identified' : isPageFilled(state.reports, doc.reportKey) ? 'manual' : 'empty';
    return {
      ...doc,
      status,
      sourceName: doc.sourceName ?? sourceFiles.find(s => s.id === source?.sourceId)?.file.name,
      importedAt: source?.importedAt,
    };
  });
}
