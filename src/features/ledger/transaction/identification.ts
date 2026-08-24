/**
 * POST /ael/invoice/identification/one 辨識結果 → 新增交易表單欄位對照。
 * 集中放在此檔，方便日後調整欄位對應規則。
 *
 * 覆蓋策略：辨識結果一律覆蓋對應欄位（dto 該欄位有值就寫），包含使用者已手動填寫的內容；
 * 重新上傳憑證照片時可直接用新的辨識結果取代舊資料。
 */
import type { OfficialSubjectDto, VendorDto, InvoiceIdentificationDto, InvoiceBookDto } from '@/api/types';
import type { Side } from '../types';
import { VOUCHER_TYPES } from './data';
import type { TransactionFormState } from './types';

/** gui_type（1~7:一般憑證 8:交通憑證 9:水電瓦斯 10:其他 11:進口）→ 表單憑證種類 */
export function guiTypeToVoucherType(guiType: number): string | null {
  if (guiType >= 1 && guiType <= 7) return VOUCHER_TYPES[0]; // 一般發票
  if (guiType === 8) return VOUCHER_TYPES[1]; // 交通通聯
  if (guiType === 9) return VOUCHER_TYPES[2]; // 水電瓦斯
  if (guiType === 10) return VOUCHER_TYPES[4]; // 收據 (無稅額)（畫面無「其他」選項，對應到此）
  if (guiType === 11) return VOUCHER_TYPES[3]; // 進口稅單
  return null;
}

export interface ApplyIdentificationResult {
  patch: Partial<TransactionFormState>;
  /** 是否有依辨識結果自動選入費用類別／收入科目，供畫面顯示「AI 已為你選擇」提示 */
  aiPickedSubject: boolean;
}

/** 民國年月日 → Date；三個欄位缺一即視為無法解析 */
function parseRocDate(dto: InvoiceIdentificationDto): Date | null {
  const { gui_date_year, gui_date_month, gui_date_day } = dto;
  if (!gui_date_year || !gui_date_month || !gui_date_day) return null;
  return new Date(gui_date_year + 1911, gui_date_month - 1, gui_date_day);
}

/** 依 gui_subject_candidates 由前到後找第一個在 subjects 清單中查得到的科目 */
function resolveSubjectCandidate(dto: InvoiceIdentificationDto, subjects: OfficialSubjectDto[]) {
  for (const candidate of dto.gui_subject_candidates ?? []) {
    const subject = subjects.find(s => s.subjectCode === candidate.gui_subject_code);
    if (subject) return subject;
  }
  return null;
}

export function applyIdentification(
  side: Side,
  dto: InvoiceIdentificationDto,
  subjects: OfficialSubjectDto[],
  vendors: VendorDto[],
  invoiceBooks: InvoiceBookDto[],
): ApplyIdentificationResult {
  const patch: Partial<TransactionFormState> = {};
  let aiPickedSubject = false;

  const date = parseRocDate(dto);
  if (date) patch.issueDate = date;

  if (dto.subtotal != null) patch.salesAmount = dto.subtotal;
  if (dto.tax != null) patch.taxAmount = dto.tax;
  if (dto.tax_free_amount != null) patch.exemptSalesAmount = dto.tax_free_amount;
  if (dto.others != null) patch.others = dto.others;
  if (dto.summary) patch.summary = dto.summary;

  const subject = resolveSubjectCandidate(dto, subjects);
  if (subject) {
    patch.expenseCategory = { id: subject.id, subjectCode: subject.subjectCode, name: subject.name };
    aiPickedSubject = true;
  }

  if (side === 'purchase') {
    let voucherType = VOUCHER_TYPES[0];
    if (dto.gui_type != null) {
      const mapped = guiTypeToVoucherType(dto.gui_type);
      if (mapped) {
        voucherType = mapped;
        patch.voucherType = mapped;
      }
    }

    if (voucherType === VOUCHER_TYPES[0]) {
      if (dto.gui_alphabetic_letter) patch.invoiceTrack = dto.gui_alphabetic_letter;
      if (dto.gui_number) patch.invoiceSerial = dto.gui_number;
    } else if (dto.gui_number) {
      patch.invoiceNumber = dto.gui_number;
    }

    if (dto.seller_tax_id) {
      const matched = vendors.find(v => v.taxId === dto.seller_tax_id);
      if (matched) {
        patch.sellerVendorUuid = matched.uuid;
        patch.sellerName = matched.name;
        patch.sellerTaxId = matched.taxId;
      } else {
        // 清單中查無相符廠商：選「其他」，統編／名稱改用辨識結果（賣家名稱欄位需搭配放開編輯，見 TransactionMetaCard）
        const other = vendors.find(v => v.name === '其他');
        if (other) {
          patch.sellerVendorUuid = other.uuid;
          patch.sellerName = dto.seller_name ?? '';
          patch.sellerTaxId = dto.seller_tax_id;
        } else {
          patch.sellerName = dto.seller_name ?? '';
          patch.sellerTaxId = dto.seller_tax_id;
        }
      }
    } else if (dto.seller_name) {
      patch.sellerName = dto.seller_name;
    }
  } else {
    if (dto.buyer_tax_id) patch.buyerTaxId = dto.buyer_tax_id;
    if (dto.buyer_name) patch.buyerName = dto.buyer_name;

    // 銷項字軌比對發票簿：命中即自動選入對應發票簿，流水號帶該簿目前配發號碼，與手動選發票簿行為一致
    if (dto.gui_alphabetic_letter) {
      const book = invoiceBooks.find(b => b.aphabeticLetter === dto.gui_alphabetic_letter);
      if (book) {
        patch.invoiceBookUuid = book.invoiceBookId;
        patch.invoiceBookPart = book.part;
        patch.invoiceTrack = book.aphabeticLetter;
        patch.invoiceSerial = book.currentNum;
      }
    }
  }

  return { patch, aiPickedSubject };
}
