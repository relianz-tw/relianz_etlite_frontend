import type { OtherWithholdingCategoryCode } from '@/api/withholding';
import type {
  CreateRentalBody,
  RentalRecordDto,
  WithholdingEarnerTypeCode,
  WithholdingOtherRecordDto,
  WithholdingOtherSaveBody,
  WithholdingSummaryGroupDto,
} from '@/api/types';
import type { Burden, CategoryCode, EarnerType, Landlord, NhiDeclareStatus, VoucherType, WithholdingGroupRow, WithholdingRecord } from './types';

/**
 * 各類扣繳 DTO ↔ 畫面 WithholdingRecord 轉換。
 * ⚠️ 年制假設：後端 summaryYear／summaryMonth 語意對應請求的 year／month（民國，api.md 範例確認），
 * 回應本身未標註年制，此處假設一致並 +1911 換算回西元；若實測發現不一致需回報後端統一，並修正這裡。
 */

const EARNER_TYPE_TO_CODE: Record<EarnerType, WithholdingEarnerTypeCode> = { individual: '0', firm: '1', company: '2' };
const EARNER_TYPE_FROM_CODE: Record<WithholdingEarnerTypeCode, EarnerType> = { '0': 'individual', '1': 'firm', '2': 'company' };

export function mapEarnerTypeToCode(type: EarnerType): WithholdingEarnerTypeCode {
  return EARNER_TYPE_TO_CODE[type];
}

export function mapEarnerTypeFromCode(code: WithholdingEarnerTypeCode): EarnerType {
  return EARNER_TYPE_FROM_CODE[code] ?? 'individual';
}

/** 解析 YYYY-MM-DD（或帶時間的 ISO 字串）為年月日；解析失敗時退回今日，理論上不會發生 */
function parseDateParts(dateStr: string | null | undefined): { year: number; month: number; day: number } {
  const match = dateStr ? /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr) : null;
  if (!match) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  }
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function formatDateForApi(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 9 類（不含租金）DTO → WithholdingRecord */
export function mapWithholdingOtherDtoToRecord(category: OtherWithholdingCategoryCode, dto: WithholdingOtherRecordDto): WithholdingRecord {
  const { year: paymentYear, month: paymentMonth, day: paymentDay } = parseDateParts(dto.summaryPaymentDate);
  const isProfessional = category === '9A' || category === '9B';
  return {
    uuid: dto.withholdingSummaryUuid,
    withholdingId: dto.withholdingId,
    categoryCode: category,
    earnerType: mapEarnerTypeFromCode(dto.earnerType),
    voucherType: dto.voucherType,
    incomeCategory: isProfessional ? category : undefined,
    practiceTypeCode: category === '9A' && dto.practiceTypeCode !== undefined ? String(dto.practiceTypeCode) : undefined,
    royaltyExpenseCode: category === '9B' && dto.royaltyExpenseCode !== undefined ? String(dto.royaltyExpenseCode) : undefined,
    otherIncomeTypeCode: category === '92' ? dto.otherIncomeTypeCode : undefined,
    recipientName: dto.recipientName,
    // 個人填身分證字號（identityNo）、事務所／公司行號填統編（taxIdNo），畫面單一欄位依 earnerType 顯示對應意義
    recipientIdNumber: dto.identityNo || dto.taxIdNo || '',
    recipientAddress: dto.recipientAddress,
    landlords: [],
    rentalAddress: '',
    rentalAddressTaxId: '',
    burden: 'tenant',
    isMonthlyPayment: false,
    rentalFiles: [],
    paymentYear,
    paymentMonth,
    paymentDay,
    incomeYear: dto.summaryYear + 1911,
    incomeMonth: dto.summaryMonth,
    // 受贈（97）用 giftAmount 代替 grossIncome；其餘 8 類用 grossIncome
    grossIncome: category === '97' ? (dto.giftAmount ?? 0) : (dto.grossIncome ?? 0),
    withholdingAmount: dto.withholdingAmount,
    nhiAmount: dto.nhiAmount ?? 0,
    netPayment: dto.netPayment,
    remarks: dto.remarks,
    withholdingPaid: dto.isRemitWithholding,
    nhiPaid: dto.isRemitNhi,
    isNhiDeclared: dto.isNhiDeclare,
    nhiDeclareStatus: (dto.status ?? 0) as NhiDeclareStatus,
    nhiDeclareCode: dto.code,
  };
}

/** 租金 DTO → WithholdingRecord */
export function mapRentalDtoToRecord(dto: RentalRecordDto): WithholdingRecord {
  const { year: paymentYear, month: paymentMonth, day: paymentDay } = parseDateParts(dto.summaryPaymentDate);
  const landlords: Landlord[] = dto.landlords.map((l, i) => ({
    id: l.landlordUuid ?? `ld-${i}`,
    name: l.landlordName,
    idNumber: l.landlordIdNo,
    address: l.landlordAddress,
  }));
  // burden 推定：isTaxInclusive=true（申報金額含稅費）對應「房東負擔」；false 對應「承租人負擔」，
  // 與 isTenantAbsorbTax／isTenantAbsorbNhi 理論上應一致，待實測確認三個 bool 的實際組合關係
  const burden: Burden = dto.isTaxInclusive ? 'landlord' : 'tenant';
  return {
    uuid: dto.withholdingSummaryUuid,
    withholdingId: dto.withholdingId ?? '',
    categoryCode: '51',
    earnerType: mapEarnerTypeFromCode(dto.earnerType),
    voucherType: dto.voucherType,
    recipientName: landlords.map(l => l.name).filter(Boolean).join('、'),
    recipientIdNumber: landlords[0]?.idNumber ?? '',
    recipientAddress: landlords[0]?.address ?? '',
    landlords,
    rentalAddress: dto.rentalAddress,
    rentalAddressTaxId: dto.propertyTaxNo,
    burden,
    isMonthlyPayment: dto.isMonthlyPayment,
    rentalFiles: dto.files,
    paymentYear,
    paymentMonth,
    paymentDay,
    incomeYear: dto.summaryYear + 1911,
    incomeMonth: dto.summaryMonth,
    grossIncome: dto.rentAmount,
    withholdingAmount: dto.withholdingAmount,
    nhiAmount: dto.nhiAmount,
    netPayment: dto.paymentAmount,
    remarks: dto.remarks,
    withholdingPaid: dto.isRemitWithholding,
    nhiPaid: dto.isRemitNhi,
    isNhiDeclared: dto.isNhiDeclare,
    nhiDeclareStatus: (dto.status ?? 0) as NhiDeclareStatus,
    nhiDeclareCode: dto.code,
  };
}

/** 彙總層 DTO → 畫面列（見 types.ts WithholdingGroupRow 註解） */
export function mapSummaryGroupDtoToRow(dto: WithholdingSummaryGroupDto): WithholdingGroupRow {
  return {
    groupKey: dto.groupKey,
    categoryCode: dto.incomeType,
    recipientName: dto.recipientName,
    recipientIdNumber: dto.recipientIdNo,
    rentalAddress: dto.rentalAddress ?? '',
    recordCount: dto.recordCount,
    grossIncome: dto.totalGrossIncome,
    withholdingAmount: dto.totalWithholdingAmount,
    nhiAmount: dto.totalNhiAmount,
    netPayment: dto.totalPaymentAmount,
    unremitWithholdingCount: dto.unremitWithholdingCount,
    unremitNhiCount: dto.unremitNhiCount,
    firstPaymentMonth: dto.firstPaymentMonth,
    lastPaymentMonth: dto.lastPaymentMonth,
  };
}

/** GET /ael/withholding/detail 回應（依 category 是租金或其餘 8 類形狀不同）→ WithholdingRecord */
export function mapWithholdingDetailToRecord(category: CategoryCode, dto: WithholdingOtherRecordDto | RentalRecordDto): WithholdingRecord {
  if (category === '51') return mapRentalDtoToRecord(dto as RentalRecordDto);
  return mapWithholdingOtherDtoToRecord(category, dto as WithholdingOtherRecordDto);
}

/** GeneralForm 送出資料 → 9 類（不含租金）新增／更新共用請求體（不含 companyUuid／withholdingSummaryUuid） */
export function buildWithholdingOtherSaveBody(input: {
  category: OtherWithholdingCategoryCode;
  earnerType: EarnerType;
  voucherType: VoucherType;
  recipientName: string;
  recipientIdNumber: string;
  recipientAddress: string;
  grossIncome: number;
  withholdingAmount: number;
  nhiAmount: number;
  netPayment: number;
  remarks: string;
  /** 西元 */
  incomeYear: number;
  incomeMonth: number;
  paymentDate: Date;
  practiceTypeCode?: string;
  royaltyExpenseCode?: string;
  otherIncomeTypeCode?: string;
}): Omit<WithholdingOtherSaveBody, 'companyUuid'> {
  const isDonation = input.category === '97';
  // identityNo 非空時後端會做身分證字號檢核，事務所／公司行號填的是統編、格式不同，不可送進 identityNo
  return {
    earnerType: mapEarnerTypeToCode(input.earnerType),
    identityNo: input.earnerType === 'individual' ? input.recipientIdNumber || undefined : undefined,
    taxIdNo: input.earnerType === 'individual' ? undefined : input.recipientIdNumber || undefined,
    recipientName: input.recipientName,
    recipientAddress: input.recipientAddress,
    grossIncome: isDonation ? undefined : input.grossIncome,
    giftAmount: isDonation ? input.grossIncome : undefined,
    netPayment: input.netPayment,
    withholdingAmount: input.withholdingAmount,
    nhiAmount: isDonation ? undefined : input.nhiAmount,
    voucherType: input.voucherType,
    remarks: input.remarks || undefined,
    year: input.incomeYear - 1911,
    month: input.incomeMonth,
    paymentDate: formatDateForApi(input.paymentDate),
    practiceTypeCode: input.category === '9A' && input.practiceTypeCode ? Number(input.practiceTypeCode) : undefined,
    royaltyExpenseCode: input.category === '9B' && input.royaltyExpenseCode ? Number(input.royaltyExpenseCode) : undefined,
    otherIncomeTypeCode: input.category === '92' ? input.otherIncomeTypeCode : undefined,
  };
}

/**
 * RentalForm 送出資料 → 租金新增／更新共用請求體（不含 companyUuid／withholdingSummaryUuid）。
 * ⚠️ 畫面僅收單一「給付日期」，故 paymentStartDate／paymentEndDate／monthRentAmount 皆借用同一組值，
 * 未提供獨立的租期起迄與月租金輸入，屬刻意簡化，待有實際 UI 需求（如月繳分期）再擴充。
 */
export function buildCreateRentalBody(input: {
  earnerType: EarnerType;
  voucherType: VoucherType;
  landlords: Landlord[];
  rentalAddress: string;
  rentalAddressTaxId: string;
  burden: Burden;
  isMonthlyPayment: boolean;
  /** 申報金額（即 rentAmount） */
  declaredAmount: number;
  withholdingAmount: number;
  nhiAmount: number;
  /** 實際支付金額（即 paymentAmount） */
  actualPayment: number;
  remarks: string;
  /** 西元 */
  incomeYear: number;
  incomeMonth: number;
  paymentDate: Date;
}): Omit<CreateRentalBody, 'companyUuid'> {
  const dateStr = formatDateForApi(input.paymentDate);
  return {
    earnerType: mapEarnerTypeToCode(input.earnerType),
    isMonthlyPayment: input.isMonthlyPayment,
    isNhiDeclare: false,
    isRemitNhi: false,
    isRemitWithholding: false,
    isTaxInclusive: input.burden === 'landlord',
    isTenantAbsorbNhi: input.burden === 'tenant',
    isTenantAbsorbTax: input.burden === 'tenant',
    landlords: input.landlords.map(l => ({ landlordName: l.name, landlordIdNo: l.idNumber, landlordAddress: l.address })),
    month: input.incomeMonth,
    monthRentAmount: input.declaredAmount,
    nhiAmount: input.nhiAmount,
    nhiDeclareDate: null,
    nhiRemitDate: null,
    paymentAmount: input.actualPayment,
    paymentDate: dateStr,
    paymentEndDate: dateStr,
    paymentStartDate: dateStr,
    propertyTaxNo: input.rentalAddressTaxId,
    remarks: input.remarks,
    rentAmount: input.declaredAmount,
    rentalAddress: input.rentalAddress,
    voucherType: input.voucherType,
    withholdingAmount: input.withholdingAmount,
    withholdingRemitDate: null,
    year: input.incomeYear - 1911,
  };
}
