import type { SettlementReportId } from '../state/initializationReducer';

/** 報表欄位型別：money 用 MoneyInput、text/decimal 用 TextInput、date 用 DatePicker、boolean 用 Checkbox */
export type ReportFieldType = 'money' | 'text' | 'date' | 'decimal' | 'boolean';

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
  /** 紙本上的欄位代號（metadata officialFieldCode），顯示於代號 chip */
  officialCode?: string;
  /** 父科目 fieldCode，用於資產負債表縮排 */
  parentKey?: string;
  /** 扣除項，紙本以「減：」或括號表示 */
  isDeduction?: boolean;
  /** 小計／合計列 */
  isSubtotal?: boolean;
}

export interface ReportSectionDef {
  /** metadata 的區塊代碼（sectionCode） */
  key: string;
  fields: ReportFieldDef[];
  /** 依 metadata choiceGroups 合併成的多選一，渲染於一般欄位之前（見 ReportChoiceField） */
  choices?: ReportChoiceDef[];
}

/** 一組多選一：成員為同一個 choiceGroup 的布林欄位 */
export interface ReportChoiceDef {
  groupCode: string;
  /** 組名稱（如「組織型態」），作為這組選擇的 label */
  title: string;
  fields: ReportFieldDef[];
}

export interface ReportTableDef {
  columns: ReportFieldDef[];
  addRowLabel: string;
}

export interface ReportPageDef {
  id: SettlementReportId;
  title: string;
  /** 固定欄位，依 metadata 的 sectionCode 分組，每組在畫面上是一張卡片 */
  sections: ReportSectionDef[];
  /** 列欄位（表格型明細，如投資人明細、財產目錄），渲染於固定欄位下方；無則不顯示 */
  table?: ReportTableDef;
}
