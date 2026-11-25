import { SHARED_FIELD_KEYS, type InitializationState } from '../state/initializationReducer';

/**
 * 「最新設立或變更登記事項表」（registrationDocs.ts 的 docType）是七份登記文件中唯一會辨識的一份。
 * 它含有後面好幾頁都要重打的資料（公司基本資料、股本、董監事名單），辨識一次直接往後帶。
 */
export const REGISTRATION_ITEMS_CODE = 'REGISTRATION_ITEMS';

/** 辨識結果在 state.reports 的 key，也是辨識 API 回傳的 formCode。刻意不加進 FORM_LIST：它不是逐頁核對的結算表 */
export const COMPANY_REGISTRATION_KEY = 'COMPANY_REGISTRATION';

export const REGISTRATION_FORM_NO = 14;

/** 後端目前只有 114 年版的登記事項表欄位表，其餘年度一律回 0004，所以寫死不隨開帳年度變動 */
export const REGISTRATION_FORM_YEAR = 114;

/** 辨識 API（cit/identify）的檔案上限，與申報書上傳區一致；登記文件本身可傳到 10MB，只是超過就不辨識 */
export const IDENTIFY_MAX_SIZE_MB = 5;

/** 摘要卡要顯示的欄位；其餘約 70 個（增減資明細、被併購、所營事業、各種旗標）照存不顯示，開帳流程用不到 */
export const REGISTRATION_SUMMARY_GROUPS: { title: string; keys: string[] }[] = [
  { title: '公司基本資料', keys: ['NAME_ZH', 'HDR_TAX_ID', 'ADDR', 'REPRESENTATIVE', 'HDR_PHONE', 'APPROVED_ON'] },
  { title: '股本', keys: ['PAID_IN_CAPITAL', 'AUTHORIZED_CAPITAL', 'PAR_VALUE', 'TOTAL_SHARES'] },
];

/** 董事監察人名單（OFFICERS 區塊）在摘要卡的欄位順序 */
export const OFFICER_COLUMN_KEYS = ['ROW_TITLE', 'ROW_NAME', 'ROW_ID_NO', 'ROW_SHARES', 'ROW_ADDRESS'];

/** 登記表欄位 → state.company（未滿一年的 Step3CompanyInfo 與確認頁直接讀 company） */
export const REGISTRATION_TO_COMPANY: Record<string, keyof Pick<InitializationState['company'], 'taxId' | 'name' | 'representative' | 'address' | 'phone'>> = {
  HDR_TAX_ID: 'taxId',
  NAME_ZH: 'name',
  REPRESENTATIVE: 'representative',
  ADDR: 'address',
  HDR_PHONE: 'phone',
};

/**
 * 登記表欄位 → 封面（CIT_COVER）的共用公司識別欄位。寫進封面而不是留在登記表自己身上，有兩個理由：
 * 1. 封面是公司資料的主要入口，setReportFieldSynced 會把共用欄位再自動推播到其餘每一張報表；
 * 2. 滿一年那條路線的 Step3Cover 離開時會把封面欄位「原樣」寫回 state.company（含空值），
 *    只改 company 不改封面的話，使用者一離開封面就被清回空白。
 * 登記表沒有稅籍編號欄位，所以沒有 HDR_TAX_REG_NO 的來源。
 */
export const REGISTRATION_TO_COVER: Record<string, string> = {
  HDR_TAX_ID: 'HDR_VAT_NO',
  NAME_ZH: 'HDR_COMPANY_NAME',
  REPRESENTATIVE: 'HDR_OWNER_NAME',
  ADDR: 'HDR_ADDRESS',
  HDR_PHONE: 'HDR_PHONE',
};

/**
 * 把共用的公司識別欄位（這張表只有 HDR_PHONE）從辨識結果裡挑掉。
 * APPLY_IDENTIFIED_FORM 會以 aiFilled=true 寫入，而共用欄位會被 setReportFieldSynced 推播到每一張報表；
 * 讓 aiFilled 跟著散出去會使所有結算表誤判成「已辨識」而預設收合（見 useInitPaperStore 的 canCollapse），
 * 送出時也會被當成 AI 讀來的值。共用欄位改走 SET_REPORT_FIELD（aiFilled=false）另外寫。
 */
export function withoutSharedFields(values: Record<string, string | number>): Record<string, string | number> {
  return Object.fromEntries(Object.entries(values).filter(([key]) => !SHARED_FIELD_KEYS.has(key)));
}

/**
 * 登記表的四組明細列（被併購、所營事業、董監事名單、所代表法人）在 metadata 裡 tableCode 都是 null，
 * 只能靠各組獨有的 fieldCode 分辨。只留董監事那一組：其餘三組畫面與送出都用不到，
 * 而且 ReportData.rows 是一個扁平陣列、SET_REPORT_ROW_FIELD 用的是陣列索引，
 * 混在一起存會讓摘要卡上的「第 N 列」對到別組的列。
 */
export function officerRows(rows: Record<string, string | number>[]): Record<string, string | number>[] {
  return rows.filter(row => 'ROW_TITLE' in row || 'ROW_NAME' in row);
}

/** 登記事項表是否已經辨識過（重新整理後也要看得出來，所以由 state 推導而不是元件 state） */
export function hasRegistrationData(reports: InitializationState['reports']): boolean {
  const report = reports[COMPANY_REGISTRATION_KEY];
  if (!report) return false;
  return report.rows.length > 0 || Object.values(report.fields).some(field => field.value !== '' && field.value !== 0);
}
