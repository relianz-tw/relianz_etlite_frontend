import type { SettlementReportId } from '../state/initializationReducer';

/** 報表欄位型別：money 用 MoneyInput、text 用 TextInput、date 用 DatePicker */
export type ReportFieldType = 'money' | 'text' | 'date';

export interface ReportFieldDef {
  /** 對應 state.reports[reportId].fields 的 key（表格型報表則對應 row 內的 key） */
  key: string;
  label: string;
  type: ReportFieldType;
  /** 縮排層級，呈現主科目/子科目/孫科目階層（如流動資產 → 存貨 → 商品） */
  indent?: 0 | 1 | 2;
  /** 允許輸入負數（如累積盈虧、業主往來可能反向），僅 money 適用 */
  allowSign?: boolean;
  /** 合計／子合計列，字重加粗與一般明細列區隔 */
  emphasize?: boolean;
}

export interface ReportSectionDef {
  title: string;
  fields: ReportFieldDef[];
}

export interface ReportColumnDef {
  sections: ReportSectionDef[];
  /** 本欄用於借貸平衡檢查的合計欄位 key，需對應 sections 中某個 field.key */
  totalFieldKey?: string;
}

export interface ReportTableDef {
  columns: ReportFieldDef[];
  addRowLabel: string;
}

export interface ReportPageDef {
  id: SettlementReportId;
  title: string;
  hint?: string;
  layout: 'twoColumn' | 'table';
  /** layout='twoColumn' 時使用 */
  left?: ReportColumnDef;
  right?: ReportColumnDef;
  /** layout='table' 時使用 */
  table?: ReportTableDef;
  /** 有值時於頁面底部顯示左右欄合計是否平衡（僅 twoColumn 適用） */
  balanceCheck?: { leftLabel: string; rightLabel: string };
  /**
   * true 時右欄與左欄顯示完全相同的科目（逐行對應），但各自獨立輸入，供交叉核對兩個來源的數字
   * （如資產負債表）；右欄的值存於 state.reports[id].fieldsRight，不與左欄 fields 共用。
   */
  mirrorRight?: boolean;
  /** true 時桌機左右欄捲動同步，方便逐行對照（搭配 mirrorRight 使用） */
  syncScroll?: boolean;
}
