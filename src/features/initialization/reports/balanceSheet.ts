import type { ReportPageDef } from './types';

/**
 * 03 資產負債表。左＝資產、右＝負債及業主權益，兩欄合計須相等（見 balanceCheck）。
 * 各欄 totalFieldKey 指向該欄的「總計」欄位，供 ReportBalanceBar 直接比對，
 * 不做子欄位自動加總（比照文件辨識欄位皆為 OCR 直接帶入值的既有慣例，見 MoneyInput aiFilled 用法）。
 */
export const BALANCE_SHEET_PAGE: ReportPageDef = {
  id: 'balanceSheet',
  title: '資產負債表',
  hint: '綠框欄位為文件辨識自動帶入，請逐項核對；兩欄合計需一致。',
  layout: 'twoColumn',
  left: {
    totalFieldKey: 'totalAssets',
    sections: [
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
    ],
  },
  right: {
    totalFieldKey: 'totalLiabilitiesAndEquity',
    sections: [
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
    ],
  },
  balanceCheck: { leftLabel: '資產總計', rightLabel: '負債及業主權益總計' },
};
