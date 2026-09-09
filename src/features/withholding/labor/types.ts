import type { MockFile } from '../components/mockFile';

/** 工作類型代碼：50 兼職/臨時人員、9A 專業服務（執行業務）、9B 稿費 */
export type LaborServiceType = '50' | '9A' | '9B';

/** 國籍代碼：0 本國籍(TW)、1 外國籍在台滿 183 天(RT183D)、2 外國籍未滿 183 天(NRT183D)
 *  ⚠️ 寫入端（POST /ael/labour、/calculate）送 int；讀取端回中文描述，需經 parseNationality 還原 */
export type LaborNationalityCode = 0 | 1 | 2;

/** 二代健保申報狀態：0 取消申報、1 已受理、2 系統入檔中、3 入檔成功、4 入檔失敗 */
export type NhiDeclareStatus = 0 | 1 | 2 | 3 | 4;

/** 畫面用勞報單資料，由 LabourFormDto（見 @/api/types）轉換而成，見 data.ts 的 mapLabourDtoToRecord */
export interface LaborRecord {
  uuid: string;
  withholdingId: string;
  /** 交易編號，見 localExtras.ts 的 getLaborOrderCode／setLaborOrderCode 說明 */
  orderCode: string;
  name: string;
  idNumber: string;
  phone: string;
  address: string;
  addressPostal: string;
  nationality: LaborNationalityCode;
  isUnionInsured: boolean;
  serviceType: LaborServiceType;
  serviceName: string;
  serviceYear: number;
  serviceMonth: number;
  serviceDay: number;
  paymentYear: number;
  paymentMonth: number;
  paymentDay: number;
  payableAmount: number;
  withholdingTax: number;
  secondHealthInsuranceFee: number;
  actualPaymentAmount: number;
  /** 簽署狀態：0 未簽署、1 已簽署 */
  signStatus: 0 | 1;
  signTime: string;
  /** 國家代碼／名稱，簽署完成前多為 0／空字串 */
  countryCode: number;
  countryName: string;
  /** 所得類別代碼，簽署 PATCH 時沿用此值送出 */
  code: number;
  createTime: string;

  // 以下欄位後端尚無對應 API，暫存於前端記憶體（見 localExtras.ts），重新整理頁面會重置
  tags: string[];
  projects: string[];
  withholdingFiles: MockFile[];
  withholdingProofFiles: MockFile[];
  withholdingPaid: boolean;
  nhiFiles: MockFile[];
  nhiProofFiles: MockFile[];
  nhiPaid: boolean;
  nhiDeclareStatus: NhiDeclareStatus;
  isNhiDeclared: boolean;
}
