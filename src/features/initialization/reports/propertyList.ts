import type { ReportPageDef } from './types';

/** 財產目錄（表格型，逐列新增／刪除；如有財產才需填寫，無則留空即可） */
export const PROPERTY_LIST_PAGE: ReportPageDef = {
  id: 'propertyList',
  title: '財產目錄',
  hint: '如有財產目錄請逐項列出，欄位為系統示意配置，實際對應表待後端確認後調整；沒有的話留空即可。',
  layout: 'table',
  table: {
    addRowLabel: '新增財產',
    columns: [
      { key: 'propertyName', label: '財產名稱', type: 'text' },
      { key: 'acquisitionDate', label: '取得日期', type: 'date' },
      { key: 'quantity', label: '數量', type: 'text' },
      { key: 'acquisitionCost', label: '取得成本', type: 'money' },
      { key: 'accumulatedDepreciation', label: '累計折舊', type: 'money' },
      { key: 'bookValue', label: '帳面價值', type: 'money' },
      { key: 'usefulLifeYears', label: '耐用年數', type: 'text' },
    ],
  },
};
