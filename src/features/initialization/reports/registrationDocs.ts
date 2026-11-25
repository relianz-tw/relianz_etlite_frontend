import type { OrgType } from '../state/initializationReducer';

export interface RegistrationDoc {
  /** 文件類型代碼（後端上傳 API 上線後作為 docType） */
  code: string;
  title: string;
  /** 上傳後會跑欄位辨識並把資料帶往後面的頁面；目前只有登記事項表（formNo 14）有 */
  identifiable?: boolean;
}

const APPROVAL_LETTER: RegistrationDoc = { code: 'APPROVAL_LETTER', title: '最新設立或變更核准函' };
const REGISTRATION_ITEMS: RegistrationDoc = { code: 'REGISTRATION_ITEMS', title: '最新設立或變更登記事項表', identifiable: true };
const INVOICE_PERMIT: RegistrationDoc = { code: 'INVOICE_PERMIT', title: '最新統一發票購票證或國稅局核准公文' };
const BUSINESS_TRANSCRIPT: RegistrationDoc = { code: 'BUSINESS_TRANSCRIPT', title: '最新設立或變更商業抄本' };
const ARTICLES: RegistrationDoc = { code: 'ARTICLES', title: '最新公司章程' };
const SHAREHOLDER_LIST: RegistrationDoc = { code: 'SHAREHOLDER_LIST', title: '股東名簿' };
export const PARTNERSHIP_AGREEMENT_CODE = 'PARTNERSHIP_AGREEMENT';

/** 依組織型態列出需要客戶上傳的登記文件（公司看登記事項表、章程與股東名簿；行號看商業抄本，合夥另加合夥契約） */
export function getRegistrationDocs(orgType: OrgType): RegistrationDoc[] {
  switch (orgType) {
    case 'sole':
      return [APPROVAL_LETTER, BUSINESS_TRANSCRIPT, INVOICE_PERMIT];
    case 'partnership':
      return [APPROVAL_LETTER, BUSINESS_TRANSCRIPT, { code: PARTNERSHIP_AGREEMENT_CODE, title: '最新合夥契約' }, INVOICE_PERMIT];
    default:
      return COMPANY_REGISTRATION_DOCS;
  }
}

/** 公司（股份有限、有限）要備的五份 */
export const COMPANY_REGISTRATION_DOCS: RegistrationDoc[] = [
  APPROVAL_LETTER,
  REGISTRATION_ITEMS,
  ARTICLES,
  INVOICE_PERMIT,
  // 股東名簿不逐頁核對，公司（不論營運是否滿一年）一律上傳檔案
  SHAREHOLDER_LIST,
];

/**
 * 商號（獨資、合夥）要備的四份。上傳頁只知道是不是商號、分不出獨資或合夥，
 * 所以合夥契約一律列出並在標題標明「如為合夥」，由使用者自行判斷。
 * 第五項「負責人及合夥人基本資料」是表單不是檔案，走獨立的負責人頁。
 */
export const BUSINESS_REGISTRATION_DOCS: RegistrationDoc[] = [
  APPROVAL_LETTER,
  BUSINESS_TRANSCRIPT,
  { code: PARTNERSHIP_AGREEMENT_CODE, title: '最新合夥契約（如為合夥）' },
  INVOICE_PERMIT,
];

/** 還不知道是公司還是商號時（跳過統編查詢）列出的全部文件，使用者上傳自己有的即可 */
export const ALL_REGISTRATION_DOCS: RegistrationDoc[] = [
  APPROVAL_LETTER,
  REGISTRATION_ITEMS,
  ARTICLES,
  SHAREHOLDER_LIST,
  BUSINESS_TRANSCRIPT,
  { code: PARTNERSHIP_AGREEMENT_CODE, title: '最新合夥契約' },
  INVOICE_PERMIT,
];

/** 公司或商號；還沒有公司名稱時為 null（兩組文件都還不能確定） */
export type EntityKind = 'company' | 'business';

/**
 * 依公司名稱判斷是公司還是商號。「股份有限公司」也含有「有限公司」，所以一個判斷就夠；
 * 名稱不含這四個字的（如「順祥商行」）一律當商號。
 */
export function classifyEntity(companyName: string): EntityKind | null {
  const name = companyName.trim();
  if (!name) return null;
  return name.includes('有限公司') ? 'company' : 'business';
}

/**
 * 開帳精靈上傳頁要列哪幾份。還判斷不出是公司還是商號（跳過付款資料、舊草稿）就列全部，不擋使用者。
 * 已經上傳過檔案的文件一律保留在清單裡：使用者改了公司名稱讓分類翻面時，
 * 原本那幾份不能從畫面上消失，否則檔案與辨識結果留在草稿裡卻看不到也刪不掉。
 */
export function registrationDocsFor(kind: EntityKind | null, uploaded: Record<string, string> = {}): RegistrationDoc[] {
  const picked = kind === 'company' ? COMPANY_REGISTRATION_DOCS : kind === 'business' ? BUSINESS_REGISTRATION_DOCS : ALL_REGISTRATION_DOCS;
  if (picked === ALL_REGISTRATION_DOCS) return picked;
  // 順序沿用全集，標題以這一類的為準（商號的合夥契約帶「如為合夥」字樣）
  return ALL_REGISTRATION_DOCS.flatMap(doc => {
    const inPicked = picked.find(p => p.code === doc.code);
    if (inPicked) return [inPicked];
    return uploaded[doc.code] ? [doc] : [];
  });
}

/**
 * 由公司名稱與有沒有上傳合夥契約推出組織型態，供開帳設定頁預選。
 * 商號的名稱看不出獨資或合夥，所以預設獨資，傳了合夥契約才改成合夥。
 */
export function inferOrgType(companyName: string, hasPartnershipAgreement: boolean): OrgType {
  const kind = classifyEntity(companyName);
  if (kind === null) return null;
  if (kind === 'company') return companyName.includes('股份有限公司') ? 'share' : 'limited';
  return hasPartnershipAgreement ? 'partnership' : 'sole';
}
