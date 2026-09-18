import { z } from 'zod';

// ==================== 統一編號驗證 ====================
// etlite 尚無共用 schema 目錄，比照 features/onboarding/schemas 慣例內聯於此，
// 僅供 initialization 流程使用（與 onboarding 版本邏輯相同，各自獨立避免跨 feature 依賴）

function taxIdValidator(taxId: string | undefined): boolean {
  if (!taxId) return true; // 空值由必填驗證處理

  const id = taxId.trim();
  if (!/^\d{8}$/.test(id)) return false;

  const weights = [1, 2, 1, 2, 1, 2, 4, 1];
  const digits = id.split('').map(Number);

  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const product = digits[i] * weights[i];
    sum += Math.floor(product / 10) + (product % 10);
  }

  // 特殊規則：第 7 碼為 7 時，檢查碼可能有兩個有效值
  if (digits[6] === 7) {
    return sum % 10 === 0 || (sum + 1) % 10 === 0;
  }

  return sum % 10 === 0;
}

const taxIdSchema = z
  .string()
  .regex(/^\d{8}$/, '請輸入 8 碼統一編號')
  .refine(taxIdValidator, '統一編號檢查碼錯誤');

// ==================== 步驟 2：公司基本資料 ====================

export const companySchema = z.object({
  taxId: taxIdSchema.optional().or(z.literal('')),
  companyName: z.string().min(1, '請輸入公司名稱').max(100, '公司名稱最多 100 字'),
  representative: z.string().min(1, '請輸入代表人姓名').max(50, '代表人姓名最多 50 字'),
  address: z.string().min(8, '請輸入較完整的地址（至少包含縣市 + 區域 + 路段）'),
  industryId: z.string().min(1, '請選擇行業別'),
  isOperating: z.boolean(),
  openDate: z.string().optional(),
  baseDate: z.string().min(1, '請選擇開帳基準日'),
});

export type CompanyFormData = z.infer<typeof companySchema>;
