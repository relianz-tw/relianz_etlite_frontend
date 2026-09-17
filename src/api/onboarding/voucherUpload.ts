import { apiFetch } from '@/api/client';

export interface InvoiceRecognitionRequest {
  companyDescription?: string;
  companySalesMode?: string;
  file?: File | string;
}

export interface GuiSubjectCandidate {
  gui_subject: string;
  gui_subject_category: string;
  reason: string;
}

export interface InvoiceItem {
  invoice_direction: 'buy' | 'sell' | 'unknown';
  /** 照片偏轉角度，需取補角（360 - angle）才能轉回正向 */
  angle?: number;
  /** 文件模板代碼（1-7），對應 InvoiceCropDialog 的模板 ID */
  document_template?: number;
  gui_type: number;
  gui_subject?: number;
  gui_subject_category?: string;
  gui_subject_candidates?: GuiSubjectCandidate[];
  gui_alphabetic_letter: string | null;
  gui_date_year: number;
  gui_date_month: number;
  gui_date_day: number;
  gui_number: string;
  seller_name: string;
  seller_tax_id: string;
  buyer_name: string | null;
  buyer_tax_id: string | null;
  subtotal: number;
  tax: number;
  others: number | null;
  total_amount: number;
  tax_free_amount?: number;
}

export interface InvoiceRecognitionData {
  geminiMs: number;
  items: InvoiceItem[];
  totalMs: number;
}

/** AI 辨識耗時可能較長（餐 GPU 佇列、圖片較大時），逾時放寬到 120 秒 */
const RECOGNITION_TIMEOUT_MS = 120_000;

/** 發票辨識與費用類別建議 */
export function recognizeInvoice(
  data: InvoiceRecognitionRequest
): Promise<InvoiceRecognitionData> {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value instanceof File ? value : String(value));
    }
  });
  return apiFetch<InvoiceRecognitionData>('/ael/onboarding/invoiceRecognition', {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(RECOGNITION_TIMEOUT_MS),
  });
}
