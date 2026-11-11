import type { SettlementReportId } from '../state/initializationReducer';

export interface PaperPreview {
  /** public/form-previews 底下的檔名（不含 basePath，由 next/image 自動補） */
  image: string;
  /** 紙本名稱，如「營利事業所得稅結算申報書・第 3 頁」 */
  pageLabel: string;
  /** 紙本頁碼，如「第 3 頁」；沒有編頁的文件省略 */
  paperPage?: string;
  /** 補充說明，如「資產負債表・對照紙本下方頁碼」 */
  caption: string;
  /** 範本為橫式紙張（縮圖改橫向） */
  landscape?: boolean;
}

const CIT_BOOK = '營利事業所得稅結算申報書';

/** 各文件對應的紙本範本圖（圖檔為靜態範本，不經後端） */
export const PAPER_PREVIEWS: Record<SettlementReportId, PaperPreview> = {
  CIT_COVER: { image: 'cit-cover.webp', pageLabel: `${CIT_BOOK}・封面`, caption: '封面及目錄・紙本第一張' },
  CIT_INCOME_TAX: { image: 'cit-income-tax.webp', pageLabel: `${CIT_BOOK}・第 1 頁`, paperPage: '第 1 頁', caption: '損益及稅額計算表・對照紙本下方頁碼' },
  CIT_AMT: { image: 'cit-amt.webp', pageLabel: `${CIT_BOOK}・第 2 頁`, paperPage: '第 2 頁', caption: '營利事業所得基本稅額申報表・對照紙本下方頁碼' },
  CIT_BALANCE_SHEET: { image: 'cit-balance-sheet.webp', pageLabel: `${CIT_BOOK}・第 3 頁`, paperPage: '第 3 頁', caption: '資產負債表・對照紙本下方頁碼' },
  CIT_INVESTORS: { image: 'cit-investors.webp', pageLabel: `${CIT_BOOK}・第 9 頁`, paperPage: '第 9 頁', caption: '營利事業投資人明細及分配盈餘表・對照紙本下方頁碼', landscape: true },
  CIT_UE: { image: 'cit-ue.webp', pageLabel: `${CIT_BOOK}・第 11 頁`, paperPage: '第 11 頁', caption: '未分配盈餘申報書・對照紙本下方頁碼' },
  CIT_WH_RECON: { image: 'cit-wh-recon.webp', pageLabel: `${CIT_BOOK}・第 8 頁`, paperPage: '第 8 頁', caption: '各類給付扣繳、股利憑單金額與申報金額調節表・對照紙本下方頁碼' },
  CIT_PROPERTY: { image: 'cit-property.webp', pageLabel: '財產目錄', caption: '財產目錄範本（含未攤銷費用）', landscape: true },
  CIT_SHAREHOLDERS: { image: 'cit-shareholders.webp', pageLabel: '股東名簿', caption: '股東名簿範本', landscape: true },
  CIT_UNAMORTIZED: { image: 'cit-unamortized.webp', pageLabel: '未攤銷費用明細表', caption: '未攤銷費用明細表範本', landscape: true },
  VAT_401: { image: 'vat-401.webp', pageLabel: '營業人銷售額與稅額申報書(401)', caption: '401 範本', landscape: true },
  VAT_403: { image: 'vat-403.webp', pageLabel: '營業人銷售額與稅額申報書(403)', caption: '403 範本', landscape: true },
};
