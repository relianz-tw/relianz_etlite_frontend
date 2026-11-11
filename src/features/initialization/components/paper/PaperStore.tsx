'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { ReportField } from '../../state/initializationReducer';
import type { ReportFieldDef, ReportPageDef } from '../../reports/types';
import { computeFieldValue } from '../../reports/formula';
import { RECON_GROUPS } from './reconGroups';

/**
 * PaperForm 讀寫資料的介面：開帳精靈綁 InitializationContext（見 InitPaperStore），
 * 申報對帳頁（沒有 InitializationProvider）自己提供唯讀的 store 並用 renderValue 換掉輸入欄位。
 */
export interface PaperStore {
  /** 引用用的欄位與勾選組對照（模板 {{field:}}、{{ref:}}、{{group:}}） */
  page: ReportPageDef;
  get: (key: string) => ReportField;
  set: (key: string, value: string | number) => void;
  /** 可重複列資料 */
  rows: Record<string, ReportField>[];
  /** at：插在這個位置，不給就加在最後 */
  addRow: (columns: ReportFieldDef[], at?: number) => void;
  removeRow: (index: number) => void;
  setRowField: (index: number, key: string, value: string | number) => void;
  /** 該欄位是否有值（0 與空白視為沒有），收合沒有金額的列用 */
  isFilled: (field: ReportFieldDef) => boolean;
  /** 區塊列數超過此數量才允許收合 */
  collapseThreshold: number;
  /** 目前是否啟用收合（開帳：辨識帶入後；對帳：一律） */
  canCollapse: boolean;
  /** 這些欄位由頁面自動填入（如 401／403 的所屬年月份），畫成唯讀 */
  readOnlyKeys?: string[];
  /** 對帳模式：整個欄位改由此函式畫（回 null 代表該欄位不顯示），並只呈現金額列與表格 */
  renderValue?: (field: ReportFieldDef) => ReactNode | null;
  /** 對帳模式：每個數值欄位佔用的寬度 class */
  valueWidthClass?: string;
}

const PaperStoreContext = createContext<PaperStore | null>(null);

export const PaperStoreProvider = PaperStoreContext.Provider;

export function usePaperStore(): PaperStore {
  const store = useContext(PaperStoreContext);
  if (!store) throw new Error('usePaperStore 必須在 PaperForm 內使用');
  return store;
}

/** 欄位目前的數值：有存值用存值；算式欄位沒有存值時用畫面試算值；都沒有回 null */
export function effectiveNumber(code: string, store: PaperStore): number | null {
  const stored = store.get(code).value;
  if (stored !== '') return Number(stored) || 0;
  const target = store.page.fieldMap[code];
  return target?.formulaExpr ? computeFieldValue(target, Object.values(store.page.fieldMap), key => store.get(key).value) : null;
}

/** visibleWhen 判斷：條件欄位勾選／未勾選／非 0 才顯示（調節說明加減項分組一律顯示，只做折疊） */
export function isFieldVisible(field: ReportFieldDef, store: PaperStore): boolean {
  if (!field.visibleWhen) return true;
  if (field.groupCode && RECON_GROUPS[field.groupCode]) return true;
  const value = effectiveNumber(field.visibleWhen.fieldCode, store) ?? store.get(field.visibleWhen.fieldCode).value;
  switch (field.visibleWhen.op) {
    case 'checked':
      return Number(value) === 1;
    case 'unchecked':
      return Number(value) !== 1;
    case 'nonZero':
      return value !== '' && Number(value) !== 0;
    default:
      return true;
  }
}

/** 對帳模式下欄位是否有資料可顯示；開帳模式一律顯示 */
export function isFieldShown(field: ReportFieldDef, store: PaperStore): boolean {
  if (field.hidden) return false;
  if (store.renderValue && store.renderValue(field) === null) return false;
  return isFieldVisible(field, store);
}
