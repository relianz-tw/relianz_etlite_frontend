import type { LabourFormDto } from '@/api/types';
import { getLaborOrderCode } from './localExtras';
import type { LaborLocalExtras } from './localExtras';
import type { LaborNationalityCode, LaborRecord, LaborServiceType, NhiDeclareStatus } from './types';

export const SERVICE_TYPE_OPTIONS: { value: LaborServiceType; label: string; hint: string }[] = [
  { value: '50', label: '兼職 / 臨時人員 (50)', hint: '例：一般約聘員工或臨時人員，固定薪資員工無需填寫勞報單' },
  { value: '9A', label: '專業服務 (9A)', hint: '例：建築師、律師、代書、專利代理人、會計師、土木技師、工匠等專業人士服務' },
  { value: '9B', label: '稿費 (9B)', hint: '例：演講講師稿費、版稅、樂譜、作曲、編劇、漫畫' },
];

/** 國籍代碼下拉選項；code 直接對應 POST /ael/labour 的 nationality（'1'｜'2'｜'3'） */
export const NATIONALITY_OPTIONS: { value: LaborNationalityCode; label: string }[] = [
  { value: '1', label: '本國籍' },
  { value: '2', label: '外國籍 (在台滿 183 天)' },
  { value: '3', label: '外國籍 (在台未滿 183 天)' },
];

export function nationalityLabel(code: string): string {
  return NATIONALITY_OPTIONS.find(o => o.value === code)?.label ?? code;
}

/** 依 serviceType 取得下拉選單顯示用完整標籤，供列表/詳情頁還原顯示 */
export function serviceTypeLabel(serviceType: string): string {
  return SERVICE_TYPE_OPTIONS.find(o => o.value === serviceType)?.label ?? serviceType;
}

const NHI_DECLARE_STATUS_TEXT: Record<NhiDeclareStatus, string> = {
  0: '取消申報',
  1: '已受理',
  2: '系統入檔中',
  3: '入檔成功',
  4: '入檔失敗',
};

export function nhiDeclareStatusText(status: NhiDeclareStatus): string {
  return NHI_DECLARE_STATUS_TEXT[status];
}

/**
 * 對外免登入簽署頁連結；ic 帶入所得類別代號（GET /ael/labour 詳情／簽署頁查詢需要），
 * basePath '/etlite' 對齊 next.config.js 設定。
 */
export function signLinkFor(uuid: string, serviceType: LaborServiceType): string {
  return `${window.location.origin}/etlite/withholding/labor/sign/${uuid}?ic=${serviceType}`;
}

/** Date → 西元 YYYYMMDD，供勞報單篩選 API 的日期區間參數使用 */
export function toYyyymmdd(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/** API DTO → 畫面用 LaborRecord；標籤／繳款書等後端無 API 的欄位由呼叫端另外併入 extras（見 localExtras.ts） */
export function mapLabourDtoToRecord(dto: LabourFormDto, extras: LaborLocalExtras): LaborRecord {
  return {
    uuid: dto.labourUuid,
    withholdingId: dto.withholdingId ?? '',
    orderCode: dto.orderCode || getLaborOrderCode(dto.labourUuid),
    name: dto.name,
    idNumber: dto.identifyNumber,
    phone: dto.phone,
    address: dto.address,
    addressPostal: dto.addressPostal,
    nationality: (dto.nationality as LaborNationalityCode) || '1',
    isUnionInsured: dto.isUnionInsured,
    serviceType: dto.serviceType as LaborServiceType,
    serviceName: dto.serviceName,
    serviceYear: dto.year,
    serviceMonth: dto.month,
    serviceDay: dto.day,
    paymentYear: dto.paymentYear,
    paymentMonth: dto.paymentMonth,
    paymentDay: dto.paymentDay,
    payableAmount: dto.payableAmount,
    withholdingTax: dto.withholdingTax,
    secondHealthInsuranceFee: dto.secondHealthInsuranceFee,
    actualPaymentAmount: dto.actualPaymentAmount,
    signStatus: dto.signStatus === 1 ? 1 : 0,
    signTime: dto.signTime ?? '',
    countryCode: dto.countryCode,
    countryName: dto.countryName,
    code: dto.code,
    createTime: dto.createTime,
    ...extras,
  };
}
