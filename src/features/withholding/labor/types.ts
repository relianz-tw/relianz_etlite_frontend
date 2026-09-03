import type { MockFile } from '../components/mockFile';

/** 工作類型代碼：50 兼職/臨時人員、9A 專業服務（執行業務）、9B 稿費 */
export type LaborServiceType = '50' | '9A' | '9B';

/** 二代健保申報狀態：0 取消申報、1 已受理、2 系統入檔中、3 入檔成功、4 入檔失敗 */
export type NhiDeclareStatus = 0 | 1 | 2 | 3 | 4;

export interface LaborRecord {
  uuid: string;
  /** 編號，對應原版「扣繳首頁編號」欄，此處以流水號模擬 */
  withholdingId: string;
  name: string;
  idNumber: string;
  phone: string;
  address: string;
  nationality: string;
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
  /** 簽署狀態：0 未簽署、1 已簽署（由 /labor/sign 簽署頁流程設定） */
  signStatus: 0 | 1;
  signTime: string;
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

/** 記住的勞務者資料，供新增勞報單時姓名自動完成帶入 */
export interface SavedProvider {
  name: string;
  idNumber: string;
  phone: string;
  nationality: string;
  isUnionInsured: boolean;
}
