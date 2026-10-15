import type { OrgType } from '../state/initializationReducer';

export interface RegistrationDoc {
  /** 文件類型代碼（後端上傳 API 上線後作為 docType） */
  code: string;
  title: string;
}

const APPROVAL_LETTER: RegistrationDoc = { code: 'APPROVAL_LETTER', title: '最新設立或變更核准函' };
const INVOICE_PERMIT: RegistrationDoc = { code: 'INVOICE_PERMIT', title: '最新統一發票購票證或國稅局核准公文' };

/** 依組織型態列出需要客戶上傳的登記文件（公司看登記事項表與章程，行號看商業抄本，合夥另加合夥契約） */
export function getRegistrationDocs(orgType: OrgType): RegistrationDoc[] {
  switch (orgType) {
    case 'sole':
      return [APPROVAL_LETTER, { code: 'BUSINESS_TRANSCRIPT', title: '最新設立或變更商業抄本' }, INVOICE_PERMIT];
    case 'partnership':
      return [APPROVAL_LETTER, { code: 'BUSINESS_TRANSCRIPT', title: '最新設立或變更商業抄本' }, { code: 'PARTNERSHIP_AGREEMENT', title: '最新合夥契約' }, INVOICE_PERMIT];
    default:
      return [APPROVAL_LETTER, { code: 'REGISTRATION_ITEMS', title: '最新設立或變更登記事項表' }, { code: 'ARTICLES', title: '最新公司章程' }, INVOICE_PERMIT];
  }
}
