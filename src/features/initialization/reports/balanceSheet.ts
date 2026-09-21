import type { ReportColumnDef, ReportPageDef } from './types';

/**
 * 03 資產負債表。左右兩欄科目完全一致、逐行對應（各自獨立輸入，供交叉核對兩個來源的數字），
 * 比照使用者提供的結算申報書示意圖；捲動時左右同步，方便對照同一列。
 * 兩欄各自的「資產總計」與「負債及業主權益總計」需一致，才代表借貸平衡（見 balanceCheck，
 * 僅比對左欄合計，右欄為交叉核對用的獨立輸入，見 ReportColumn 的 side prop）。
 */
const SECTIONS: ReportColumnDef['sections'] = [
  {
    title: '流動資產',
    fields: [
      { key: 'currentAssetsSubtotal', label: '流動資產合計', type: 'money', emphasize: true },
      { key: 'cash', label: '現金', type: 'money', indent: 1 },
      { key: 'bankDeposits', label: '銀行存款', type: 'money', indent: 1 },
      { key: 'accountsReceivable', label: '應收帳款', type: 'money', indent: 1 },
      { key: 'inventory', label: '存貨', type: 'money', indent: 1 },
      { key: 'inventoryGoods', label: '商品', type: 'money', indent: 2 },
      { key: 'inventoryFinishedGoods', label: '製成品', type: 'money', indent: 2 },
      { key: 'inventoryWorkInProgress', label: '在製品（或在建工程）', type: 'money', indent: 2 },
      { key: 'inventoryRawMaterials', label: '原料', type: 'money', indent: 2 },
      { key: 'inventoryMaterials', label: '物料', type: 'money', indent: 2 },
      { key: 'inventoryConsigned', label: '寄銷品', type: 'money', indent: 2 },
      { key: 'inventoryOthers', label: '其他', type: 'money', indent: 2 },
      { key: 'inventoryValuationAllowance', label: '減：備抵存貨跌價', type: 'money', indent: 2, allowSign: true },
      { key: 'businessTaxCredit', label: '營業稅留抵稅額', type: 'money', indent: 1 },
    ],
  },
  {
    title: '固定資產',
    fields: [
      { key: 'fixedAssetsSubtotal', label: '固定資產合計', type: 'money', emphasize: true },
      { key: 'fixedAssetsCost', label: '成本', type: 'money', indent: 1 },
      { key: 'accumulatedDepreciation', label: '減：累計折舊', type: 'money', indent: 1, allowSign: true },
    ],
  },
  {
    title: '其他資產',
    fields: [{ key: 'otherAssets', label: '其他資產', type: 'money' }],
  },
  {
    title: '資產總計',
    fields: [{ key: 'totalAssets', label: '資產總計', type: 'money', emphasize: true }],
  },
  {
    title: '流動負債',
    fields: [
      { key: 'currentLiabilitiesSubtotal', label: '流動負債合計', type: 'money', emphasize: true },
      { key: 'accountsPayable', label: '應付帳款', type: 'money', indent: 1 },
      { key: 'shortTermLoans', label: '短期借款', type: 'money', indent: 1 },
    ],
  },
  {
    title: '長期負債',
    fields: [{ key: 'longTermLiabilities', label: '長期借款', type: 'money' }],
  },
  {
    title: '業主權益',
    fields: [
      { key: 'ownerEquitySubtotal', label: '業主權益合計', type: 'money', emphasize: true },
      { key: 'registeredCapital', label: '登記資本額', type: 'money', indent: 1 },
      { key: 'ownerCurrentAccount', label: '業主往來', type: 'money', indent: 1, allowSign: true },
      { key: 'retainedEarnings', label: '累積盈虧', type: 'money', indent: 1, allowSign: true },
    ],
  },
  {
    title: '負債及業主權益總計',
    fields: [{ key: 'totalLiabilitiesAndEquity', label: '負債及業主權益總計', type: 'money', emphasize: true }],
  },
];

export const BALANCE_SHEET_PAGE: ReportPageDef = {
  id: 'balanceSheet',
  title: '資產負債表',
  hint: '綠框欄位為文件辨識自動帶入，請逐項核對；左右兩欄科目相同，可用於交叉核對兩份數字是否一致。',
  layout: 'twoColumn',
  mirrorRight: true,
  syncScroll: true,
  left: { sections: SECTIONS, totalFieldKey: 'totalAssets' },
  right: { sections: SECTIONS, totalFieldKey: 'totalLiabilitiesAndEquity' },
  balanceCheck: { leftLabel: '資產總計', rightLabel: '負債及業主權益總計' },
};
