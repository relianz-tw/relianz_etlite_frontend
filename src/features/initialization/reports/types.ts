import type { SettlementReportId } from '../state/initializationReducer';

/**
 * 報表欄位型別：money 用 MoneyInput、integer（純整數，無 $ 與千分位）／text／decimal 用 TextInput、
 * percent（百分比，尾端 %、可負）用 TextInput、date 用 DatePicker、boolean 用 Checkbox
 */
export type ReportFieldType = 'money' | 'integer' | 'text' | 'decimal' | 'percent' | 'date' | 'boolean';

export interface ReportFieldDef {
  /** 對應 state.reports[reportId].fields 的 key（表格型報表則對應 row 內的 key） */
  key: string;
  /** 紙本顯示文字（metadata displayName） */
  label: string;
  type: ReportFieldType;
  /** 縮排層級，呈現主科目/子科目/孫科目階層（如流動資產 → 存貨 → 商品） */
  indent?: 0 | 1 | 2;
  /** 允許輸入負數（如累積盈虧、業主往來可能反向），僅 money 適用 */
  allowSign?: boolean;
  /** 合計／子合計列，字重加粗與一般明細列區隔 */
  emphasize?: boolean;
  /** 父科目 fieldCode，用於資產負債表縮排 */
  parentKey?: string;
  /** 扣除項語意標記（名稱以 label 為準，不自行加「減：」） */
  isDeduction?: boolean;
  /** 小計／算式欄：後端計算，前端唯讀 */
  isSubtotal?: boolean;
  /** 紙本編號（同一張表可重複，不可當 key） */
  officialCode?: string;
  /** 紙本圈號 */
  refNo?: string;
  note?: string;
  /** 算式的紙本文字 */
  formulaText?: string;
  rowCode?: string;
  column?: 'BOOK' | 'ADJ';
  layout?: 'row' | 'inline' | 'cell' | 'text' | 'group';
  labelTemplate?: string;
  groupCode?: string;
  visibleWhen?: { fieldCode: string; op: 'checked' | 'unchecked' | 'nonZero' };
  /** 紙本沒有此欄：值照常存取與送出，但不畫 */
  hidden?: boolean;
  /** 可重複列欄位（存在 state.reports[].rows，而不是 fields） */
  isRow?: boolean;
  tableCode?: string;
  rowNo?: string | number;
  columnCode?: string;
}

/** 金額一列：單欄只有 main，帳載／調整後成對時 adj 為調整後欄 */
export interface ReportRowDef {
  main: ReportFieldDef;
  adj?: ReportFieldDef;
}

/** 一組多選一：成員為同一個 choiceGroup 的布林欄位 */
export interface ReportChoiceDef {
  groupCode: string;
  /** 紙本完整題目 */
  title: string;
  officialCode?: string;
  note?: string;
  /** 勾選框每列並排數 */
  columns?: number;
  maxSelect: number;
  fields: ReportFieldDef[];
}

export interface ReportDateRangeDef {
  groupCode: string;
  title: string;
  start: ReportFieldDef;
  end: ReportFieldDef;
}

export interface ReportTextBlockDef {
  code: string;
  officialCode?: string;
  template: string;
}

export interface ReportTableColumnDef {
  code: string;
  title: string;
  /** 由上到下的合併表頭 */
  groups: string[];
  refNo?: string;
  officialCode?: string;
}

export interface ReportTableRowDef {
  rowNo: string | number;
  label?: string;
  group?: string;
}

/** 紙本表格（metadata tables[]）：固定列的格子存 fields，可重複列存 rows */
export interface ReportPaperTableDef {
  code: string;
  title?: string;
  note?: string;
  corner?: { column?: string; row?: string };
  columns: ReportTableColumnDef[];
  rows: ReportTableRowDef[];
  repeatable: boolean;
  /** 序號欄標題與補零位數，沒有序號欄為 undefined */
  rowNumber?: { title?: string; pad: number };
  /** 分組欄 fieldCode（可重複表依此分組） */
  groupBy?: string;
  /** `${rowNo}|${columnCode}` → 固定格子欄位 */
  cells: Record<string, ReportFieldDef>;
  /** 可重複列的欄位（依 columns 順序）；欄位沒有 columnCode 對不上時為空，改用卡片式列 */
  rowColumns: ReportFieldDef[];
  /** 可重複列欄位是否全部對得上 columns（對得上才能畫成真正的表格） */
  rowColumnsMatch: boolean;
}

/** 區塊內依顯示順序排好的內容 */
export type ReportSectionItem =
  | { kind: 'amountRows'; rows: ReportRowDef[] }
  | { kind: 'inputs'; fields: ReportFieldDef[] }
  | { kind: 'checks'; fields: ReportFieldDef[] }
  | { kind: 'choice'; choice: ReportChoiceDef }
  | { kind: 'dateRange'; range: ReportDateRangeDef }
  | { kind: 'text'; block: ReportTextBlockDef }
  | { kind: 'table'; table: ReportPaperTableDef };

export interface ReportSectionDef {
  /** metadata 的區塊代碼（sectionCode） */
  key: string;
  /** 紙本區塊標題（sections[].title）；沒有就不畫標題 */
  title?: string;
  parentKey?: string;
  /** 區塊內全部可畫的固定欄位（不含 hidden、isRow） */
  fields: ReportFieldDef[];
  /** 未嵌在模板內的多選一（資產負債表表頭等沿用） */
  choices?: ReportChoiceDef[];
  items: ReportSectionItem[];
}

export interface ReportTableDef {
  columns: ReportFieldDef[];
  addRowLabel: string;
}

export interface ReportPageDef {
  id: SettlementReportId;
  title: string;
  /** 固定欄位，依 metadata 的 sectionCode 分組 */
  sections: ReportSectionDef[];
  /** 列欄位（表格型明細，如投資人明細、財產目錄），沒有 tables[] 對應時渲染於固定欄位下方；無則不顯示 */
  table?: ReportTableDef;
  /** 全部欄位（含 hidden／inline／text），模板與公式引用用 */
  fieldMap: Record<string, ReportFieldDef>;
  /** 全部勾選組，模板 {{group:}} 引用用 */
  groupMap: Record<string, ReportChoiceDef>;
}
