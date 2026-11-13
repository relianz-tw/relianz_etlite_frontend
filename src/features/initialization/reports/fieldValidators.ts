/**
 * 欄位格式提醒（只提醒、不擋下一頁）：統一編號、身分證字號。
 * 辨識與手動輸入都可能抄錯；舊統編、外國人證號也確實存在，所以檢查碼不符只給警告，由使用者自己確認。
 */

/** 統一編號：8 碼數字，並驗檢查碼（權重 1,2,1,2,1,2,4,1，各位乘積的十位數加個位數後加總，可被 5 整除；第 7 碼是 7 時加 1 也算） */
export function validateTaxId(value: string): string | null {
  if (!/^\d{8}$/.test(value)) return '統一編號應為 8 碼數字';
  const weights = [1, 2, 1, 2, 1, 2, 4, 1];
  const sum = [...value].reduce((total, ch, i) => {
    const product = Number(ch) * weights[i];
    return total + Math.floor(product / 10) + (product % 10);
  }, 0);
  const valid = sum % 5 === 0 || (value[6] === '7' && (sum + 1) % 5 === 0);
  return valid ? null : '統一編號檢查碼不符，請確認是否輸入正確';
}

/** 身分證字號英文字母對應的數值（I、O、W 等不是依字母順序） */
const LETTER_VALUE: Record<string, number> = {
  A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 34, J: 18, K: 19, L: 20, M: 21,
  N: 22, O: 35, P: 23, Q: 24, R: 25, S: 26, T: 27, U: 28, V: 29, W: 32, X: 30, Y: 31, Z: 33,
};

/**
 * 身分證字號／居留證號：1 碼英文字母＋9 碼數字，並驗檢查碼。
 * 舊式居留證第 2 碼是英文字母（A～D），檢查時取其數值的個位數；新式居留證第 2 碼是 8 或 9，與一般數字相同。
 */
export function validateNationalId(value: string): string | null {
  const id = value.toUpperCase();
  if (!/^[A-Z][A-D1289]\d{8}$/.test(id)) return '身分證字號格式不符（1 碼英文字母加 9 碼數字）';
  const second = /[A-D]/.test(id[1]) ? String(LETTER_VALUE[id[1]] % 10) : id[1];
  const digits = (String(LETTER_VALUE[id[0]]) + second + id.slice(2)).split('').map(Number);
  // 英文字母展開成兩位數（十位乘 1、個位乘 9），後面 8 碼依序乘 8～1，最後一碼乘 1
  const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1];
  const sum = digits.reduce((total, d, i) => total + d * weights[i], 0);
  return sum % 10 === 0 ? null : '身分證字號檢查碼不符，請確認是否輸入正確';
}

/** 投資人（股東）欄位：可能是統一編號也可能是身分證字號，兩種都不符才提醒 */
function validateTaxIdOrNationalId(value: string): string | null {
  return validateTaxId(value) === null || validateNationalId(value) === null ? null : '請確認統一編號或身分證字號是否輸入正確';
}

/** 電話（含傳真）：只允許數字、括號、連字號、空白、加號與分機（#123、分機123），去掉分機後數字 8～12 碼（市話含區碼 9～10 碼、手機 10 碼） */
export function validatePhone(value: string): string | null {
  const body = value.replace(/(#|分機)\s*\d+\s*$/, '');
  const digits = body.replace(/\D/g, '');
  if (!/^[\d\s()\-+]+$/.test(body) || digits.length < 8 || digits.length > 12) return '電話格式不符，請輸入 8～12 碼數字（可含區碼括號、連字號與分機）';
  return null;
}

/** 電子郵件：基本格式（有 @、網域有點、無空白） */
export function validateEmail(value: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : '電子郵件格式不符';
}

/** 稅籍編號：9 碼數字 */
export function validateTaxRegNo(value: string): string | null {
  return /^\d{9}$/.test(value) ? null : '稅籍編號應為 9 碼數字';
}

/** 起訖日期（ISO 日期字串）：兩邊都有值且迄日早於起日時回提醒；字串格式 YYYY-MM-DD 可直接比大小 */
export function validateDateRange(start: string | number | undefined, end: string | number | undefined): string | null {
  const s = String(start ?? '');
  const e = String(end ?? '');
  return s !== '' && e !== '' && e < s ? '迄日不得早於起日，請確認日期' : null;
}

/**
 * 依欄位代碼取得提醒文字；沒有對應規則或沒填值時回 null。
 * 值帶遮罩（辨識到被遮蔽的證號，如 L12357****）不是有效內容，一律提醒使用者補完整。
 * 規則表以欄位代碼對應：統一編號（HDR_VAT_NO）、稅籍編號、負責人與申報人身分證（HDR_OWNER_ID、FILER_*_ID_NO）、
 * 投資人／股東（ROW_ID_NO）、電話與傳真、電子郵件。
 */
export function getFieldWarning(fieldCode: string, value: string | number | undefined): string | null {
  const text = String(value ?? '').trim();
  if (text === '') return null;
  const validator = pickValidator(fieldCode);
  if (!validator) return null;
  if (text.includes('*')) return '內容含遮蔽字元（*），請補上完整內容';
  return validator(text);
}

function pickValidator(fieldCode: string): ((value: string) => string | null) | null {
  if (fieldCode === 'HDR_VAT_NO') return validateTaxId;
  if (fieldCode === 'HDR_TAX_REG_NO' || fieldCode === 'HDR_WH_TAX_REG_NO') return validateTaxRegNo;
  if (fieldCode === 'HDR_OWNER_ID' || /^FILER_.*_ID_NO$/.test(fieldCode)) return validateNationalId;
  if (fieldCode === 'ROW_ID_NO') return validateTaxIdOrNationalId;
  if (/PHONE$/.test(fieldCode) || fieldCode === 'HDR_FAX') return validatePhone;
  if (fieldCode === 'HDR_EMAIL') return validateEmail;
  return null;
}
