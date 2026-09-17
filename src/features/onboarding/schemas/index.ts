import { z } from 'zod';

// ==================== 統一編號驗證 ====================
// 原定義於姊妹專案 src/schemas/common.ts，etlite 尚無共用 schema 目錄，故內聯於此，
// 僅供 onboarding 流程使用

/** 統編檢查碼驗證（含第 7 碼為 7 的特殊規則） */
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

  // 特殊規則：第7碼為7時，檢查碼可能有兩個有效值
  if (digits[6] === 7) {
    return sum % 10 === 0 || (sum + 1) % 10 === 0;
  }

  return sum % 10 === 0;
}

/** 統一編號 Schema（8 碼數字 + 檢查碼驗證） */
const taxIdSchema = z
  .string()
  .regex(/^\d{8}$/, '請輸入 8 碼統一編號')
  .refine(taxIdValidator, '統一編號檢查碼錯誤');

// ==================== 民國日期驗證（YYY/MM/DD）====================

function minguoDateCheck(val: string): boolean {
  // 格式：YYY/MM/DD，民國年 1-200
  const match = val.match(/^(\d{1,3})\/(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  if (year < 1 || year > 200) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  return true;
}

// ==================== 步驟 1：Landing ====================

export const step1Schema = z.object({
  taxId: z
    .string()
    .optional()
    .refine(val => !val || /^\d{8}$/.test(val), '請輸入 8 碼統一編號'),
});

export type Step1FormData = z.infer<typeof step1Schema>;

// ==================== 步驟 2：公司資訊 ====================

const step2BaseObject = z.object({
  companyName: z
    .string()
    .min(1, '請輸入公司名稱')
    .max(100, '公司名稱最多 100 字'),
  representative: z
    .string()
    .min(1, '請輸入代表人姓名')
    .max(50, '代表人姓名最多 50 字'),
  address: z
    .string()
    .min(1, '請輸入公司地址')
    .min(8, '請輸入較完整的地址（至少包含縣市 + 區域 + 路段）'),
  description: z
    .string()
    .min(10, '描述不可少於 10 字')
    .max(500, '描述不可超過 500 字'),
  salesMode: z.enum(['physical', 'online', 'both'], {
    required_error: '請選擇主要銷售模式',
  }),
});

export const step2Schema = step2BaseObject;

export type Step2FormData = z.infer<typeof step2Schema>;

// ==================== 步驟 3B：憑證辨識結果 ====================

export const step3BSchema = z.object({
  voucherType: z.string().min(1, '請選擇憑證種類'),
  invoicePrefix: z
    .string()
    .regex(/^[A-Z]{2}$/, '發票字軌需為 2 位大寫英文字母'),
  invoiceNumber: z.string().regex(/^\d{8}$/, '發票號碼需為 8 位數字'),
  date: z
    .string()
    .refine(minguoDateCheck, '請輸入有效的民國日期（格式：YYY/MM/DD）'),
  sellerTaxId: taxIdSchema,
  sellerName: z.string().min(1, '請輸入賣家名稱'),
  amount: z
    .number({ invalid_type_error: '請輸入有效的數字' })
    .int('請輸入整數')
    .positive('銷售額必須大於 0'),
  tax: z
    .number({ invalid_type_error: '請輸入有效的數字' })
    .int('請輸入整數')
    .nonnegative('稅額不得為負'),
  total: z
    .number({ invalid_type_error: '請輸入有效的數字' })
    .int('請輸入整數')
    .positive('總金額必須大於 0'),
  selectedSuggestionId: z
    .number({ required_error: '請選擇費用類別' })
    .nullable()
    .refine(val => val !== null, '請選擇費用類別'),
});

export type Step3BFormData = z.infer<typeof step3BSchema>;

// ==================== 步驟 4A：薪資計算器 ====================

export const step4ASchema = z.object({
  fixedSalary: z
    .number({
      required_error: '請輸入固定薪資',
      invalid_type_error: '請輸入有效的數字',
    })
    .int('請輸入整數')
    .positive('固定薪資必須大於 0'),
  variableSalary: z
    .number({ invalid_type_error: '請輸入有效的數字' })
    .int('請輸入整數')
    .nonnegative('非固定薪不得為負')
    .optional(),
  payDate: z
    .string({ required_error: '請選擇給薪日期' })
    .min(1, '請選擇給薪日期'),
  overtimePay: z
    .number({ invalid_type_error: '請輸入有效的數字' })
    .int('請輸入整數')
    .nonnegative('不得為負數')
    .optional(),
  mealAllowance: z
    .number({ invalid_type_error: '請輸入有效的數字' })
    .int('請輸入整數')
    .nonnegative('不得為負數')
    .optional(),
  leaveDeduction: z
    .number({ invalid_type_error: '請輸入有效的數字' })
    .int('請輸入整數')
    .nonnegative('不得為負數')
    .optional(),
  selfPension: z
    .number({ invalid_type_error: '請輸入有效的數字' })
    .int('請輸入整數')
    .nonnegative('不得為負數')
    .optional(),
});

export type Step4AFormData = z.infer<typeof step4ASchema>;

// ==================== 步驟 5A：簡易模式 ====================

export const step5ASimpleSchema = z.object({
  industryId: z.string().min(1, '請選擇行業類別'),
  estimatedRevenue: z
    .number()
    .min(1000000, '預估營業額不得低於 100 萬')
    .max(10000000, '預估營業額不得超過 1000 萬'),
  estimatedProfitRate: z
    .number()
    .min(1, '預估淨利率不得低於 1%')
    .max(55, '預估淨利率不得超過 55%'),
});

export type Step5ASimpleFormData = z.infer<typeof step5ASimpleSchema>;

// ==================== 步驟 5A：進階模式 ====================

export const step5AAdvancedSchema = z
  .object({
    expandedAuditProfitRate: z
      .number()
      .int('請輸入整數')
      .min(4, '擴大書審純益率不得低於 4%')
      .max(10, '擴大書審純益率不得超過 10%'),
    revenue: z
      .number({ invalid_type_error: '請輸入收入' })
      .int('請輸入整數')
      .positive('收入必須大於 0'),
    costAndExpense: z
      .number({ invalid_type_error: '請輸入成本及費用' })
      .int('請輸入整數')
      .nonnegative('成本及費用不得為負'),
    employeeSalary: z
      .number()
      .int('請輸入整數')
      .nonnegative('員工薪資不得為負')
      .optional(),
    personalRent: z
      .number()
      .int('請輸入整數')
      .nonnegative('個人房東租金不得為負')
      .optional(),
    otherExpense: z
      .number()
      .int('請輸入整數')
      .nonnegative('其他費用不得為負')
      .optional(),
  })
  .refine(data => data.costAndExpense <= data.revenue, {
    message: '成本及費用不得大於收入',
    path: ['costAndExpense'],
  });

export type Step5AAdvancedFormData = z.infer<typeof step5AAdvancedSchema>;

// ==================== 步驟 6：方案選擇 ====================

export const step6Schema = z.object({
  billingCycle: z.union([z.literal(0), z.literal(1)], {
    errorMap: () => ({ message: '請選擇計費週期' }),
  }),
});

// ==================== 步驟 8：公司資訊（不含 description、salesMode）====================

export const step8CompanySchema = z.object({
  taxId: z
    .string()
    .optional()
    .refine(val => !val || /^\d{8}$/.test(val), '請輸入 8 碼統一編號'),
  companyName: z
    .string()
    .min(1, '請輸入公司名稱')
    .max(100, '公司名稱最多 100 字'),
  representative: z
    .string()
    .min(1, '請輸入代表人姓名')
    .max(50, '代表人姓名最多 50 字'),
  address: z
    .string()
    .min(1, '請輸入公司地址')
    .min(8, '請輸入較完整的地址（至少包含縣市 + 區域 + 路段）'),
});

// ==================== 步驟 8：結帳 ====================

export const step8Schema = z.object({
  email: z.string().min(1, '請輸入 Email').email('請輸入有效的 Email 格式'),
  phone: z
    .string()
    .regex(/^09\d{8}$/, '請輸入有效的台灣手機號碼（09 開頭，共 10 碼）'),
});

export type Step8FormData = z.infer<typeof step8Schema>;
