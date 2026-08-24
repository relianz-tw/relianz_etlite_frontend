/**
 * POST /ael/invoice/identification/one 辨識結果 → 新增交易表單欄位對照。
 * 集中放在此檔，方便日後調整欄位對應規則。
 *
 * 覆蓋策略：一律只填「目前為空白」的欄位，使用者已手動填寫的內容不會被覆蓋（見交易頁計畫文件）。
 */
import type { OfficialSubjectDto, VendorDto, InvoiceIdentificationDto } from '@/api/types';
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
  form: TransactionFormState,
  side: Side,
  dto: InvoiceIdentificationDto,
  subjects: OfficialSubjectDto[],
  vendors: VendorDto[],
): ApplyIdentificationResult {
  const patch: Partial<TransactionFormState> = {};
  let aiPickedSubject = false;

  if (form.issueDate === undefined) {
    const date = parseRocDate(dto);
    if (date) patch.issueDate = date;
  }

  if (form.salesAmount === 0 && dto.subtotal != null) patch.salesAmount = dto.subtotal;
  if (form.taxAmount === 0 && dto.tax != null) patch.taxAmount = dto.tax;
  if (form.exemptSalesAmount === 0 && dto.tax_free_amount != null) patch.exemptSalesAmount = dto.tax_free_amount;
  if (form.others === 0 && dto.others != null) patch.others = dto.others;
  if (form.note === '' && dto.summary) patch.note = dto.summary;

  if (form.expenseCategory === null) {
    const subject = resolveSubjectCandidate(dto, subjects);
    if (subject) {
      patch.expenseCategory = { id: subject.id, subjectCode: subject.subjectCode, name: subject.name };
      aiPickedSubject = true;
    }
  }

  if (side === 'purchase') {
    // 憑證種類：僅在使用者尚未動過（仍是預設值「一般發票」）時才依辨識結果覆蓋
    let voucherType = form.voucherType;
    if (voucherType === VOUCHER_TYPES[0] && dto.gui_type != null) {
      const mapped = guiTypeToVoucherType(dto.gui_type);
      if (mapped) {
        voucherType = mapped;
        patch.voucherType = mapped;
      }
    }

    if (voucherType === VOUCHER_TYPES[0]) {
      if (form.invoiceTrack === '' && dto.gui_alphabetic_letter) patch.invoiceTrack = dto.gui_alphabetic_letter;
      if (form.invoiceSerial === '' && dto.gui_number) patch.invoiceSerial = dto.gui_number;
    } else if (form.invoiceNumber === '' && dto.gui_number) {
      patch.invoiceNumber = dto.gui_number;
    }

    // 廠商相關三欄一組判斷，避免半套資料造成「已選廠商但名稱是使用者手動填的」這種不一致狀態；
    // 三欄皆空白才視為可由辨識結果帶入
    const sellerBlank = form.sellerVendorUuid === '' && form.sellerName.trim() === '' && form.sellerTaxId.trim() === '';
    if (sellerBlank) {
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
    }
  } else {
    if (form.buyerTaxId === '' && dto.buyer_tax_id) patch.buyerTaxId = dto.buyer_tax_id;
    if (form.buyerName === '' && dto.buyer_name) patch.buyerName = dto.buyer_name;
  }

  return { patch, aiPickedSubject };
}
