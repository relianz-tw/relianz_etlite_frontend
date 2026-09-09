import type { DailyDetailLineDto } from '@/api/types';

// 後端 range API 上線後此檔可刪除
// 期望 endpoint: GET /ael/ledger/entries/dailyDetail/filter?companyUuid=&dateFrom=&dateTo=&page=&pageSize=
// 期望回傳: { total: number; page: number; pageSize: number; items: DailyDetailLineDto[] }
// 上線後只需在 src/api/ledger.ts 加 fetchJournalOverview，並替換 useJournalOverview 內部呼叫，UI 完全不動

function line(o: Omit<DailyDetailLineDto, 'rocYear' | 'seq' | 'voucherType' | 'counterpartyCode' | 'voucherCategory' | 'printFlag' | 'taxAmount' | 'isReverse' | 'createdDate'>): DailyDetailLineDto {
  return {
    ...o,
    rocYear: o.rocDate.slice(0, 3),
    seq: String(o.sortOrder),
    voucherType: '3',
    counterpartyCode: '',
    voucherCategory: '',
    printFlag: '',
    taxAmount: '0',
    isReverse: false,
    createdDate: '20260908',
  };
}

export const MOCK_JOURNAL_LINES: DailyDetailLineDto[] = [
  // 115/09/08 — 傳票 ZZ0000001（收款）
  line({ rocDate: '1150908', voucherNo: 'ZZ0000001', subjectName: '銀行存款', summary: '收款-PO12345678', debitCredit: '1', amount: 50000, ledgerUuid: 'mock-ledger-001', lineUuid: 'mock-line-001-1', sortOrder: 1 }),
  line({ rocDate: '1150908', voucherNo: 'ZZ0000001', subjectName: '應收帳款', summary: '收款-PO12345678', debitCredit: '2', amount: 50000, ledgerUuid: 'mock-ledger-001', lineUuid: 'mock-line-001-2', sortOrder: 2 }),

  // 115/09/08 — 傳票 ZZ0000002（辦公用品）
  line({ rocDate: '1150908', voucherNo: 'ZZ0000002', subjectName: '辦公用品費', summary: '購買辦公用品', debitCredit: '1', amount: 3200, ledgerUuid: 'mock-ledger-002', lineUuid: 'mock-line-002-1', sortOrder: 1 }),
  line({ rocDate: '1150908', voucherNo: 'ZZ0000002', subjectName: '進項稅額', summary: '購買辦公用品', debitCredit: '1', amount: 160, ledgerUuid: 'mock-ledger-002', lineUuid: 'mock-line-002-2', sortOrder: 2 }),
  line({ rocDate: '1150908', voucherNo: 'ZZ0000002', subjectName: '應付帳款', summary: '購買辦公用品', debitCredit: '2', amount: 3360, ledgerUuid: 'mock-ledger-002', lineUuid: 'mock-line-002-3', sortOrder: 3 }),

  // 115/09/07 — 傳票 ZZ0000003（銷貨）
  line({ rocDate: '1150907', voucherNo: 'ZZ0000003', subjectName: '應收帳款', summary: '銷貨-客戶甲', debitCredit: '1', amount: 105000, ledgerUuid: 'mock-ledger-003', lineUuid: 'mock-line-003-1', sortOrder: 1 }),
  line({ rocDate: '1150907', voucherNo: 'ZZ0000003', subjectName: '銷貨收入', summary: '銷貨-客戶甲', debitCredit: '2', amount: 100000, ledgerUuid: 'mock-ledger-003', lineUuid: 'mock-line-003-2', sortOrder: 2 }),
  line({ rocDate: '1150907', voucherNo: 'ZZ0000003', subjectName: '銷項稅額', summary: '銷貨-客戶甲', debitCredit: '2', amount: 5000, ledgerUuid: 'mock-ledger-003', lineUuid: 'mock-line-003-3', sortOrder: 3 }),

  // 115/09/07 — 傳票 ZZ0000004（薪資）
  line({ rocDate: '1150907', voucherNo: 'ZZ0000004', subjectName: '薪資支出', summary: '9 月份薪資', debitCredit: '1', amount: 240000, ledgerUuid: 'mock-ledger-004', lineUuid: 'mock-line-004-1', sortOrder: 1 }),
  line({ rocDate: '1150907', voucherNo: 'ZZ0000004', subjectName: '應付薪資', summary: '9 月份薪資', debitCredit: '2', amount: 216000, ledgerUuid: 'mock-ledger-004', lineUuid: 'mock-line-004-2', sortOrder: 2 }),
  line({ rocDate: '1150907', voucherNo: 'ZZ0000004', subjectName: '代扣個人所得稅', summary: '9 月份薪資', debitCredit: '2', amount: 24000, ledgerUuid: 'mock-ledger-004', lineUuid: 'mock-line-004-3', sortOrder: 3 }),

  // 115/09/06 — 傳票 ZZ0000005（折舊）
  line({ rocDate: '1150906', voucherNo: 'ZZ0000005', subjectName: '折舊費用', summary: '電腦設備折舊', debitCredit: '1', amount: 5000, ledgerUuid: 'mock-ledger-005', lineUuid: 'mock-line-005-1', sortOrder: 1 }),
  line({ rocDate: '1150906', voucherNo: 'ZZ0000005', subjectName: '累積折舊—電腦設備', summary: '電腦設備折舊', debitCredit: '2', amount: 5000, ledgerUuid: 'mock-ledger-005', lineUuid: 'mock-line-005-2', sortOrder: 2 }),

  // 115/09/06 — 傳票 ZZ0000006（採購原物料）
  line({ rocDate: '1150906', voucherNo: 'ZZ0000006', subjectName: '原物料', summary: '採購原物料', debitCredit: '1', amount: 80000, ledgerUuid: 'mock-ledger-006', lineUuid: 'mock-line-006-1', sortOrder: 1 }),
  line({ rocDate: '1150906', voucherNo: 'ZZ0000006', subjectName: '進項稅額', summary: '採購原物料', debitCredit: '1', amount: 4000, ledgerUuid: 'mock-ledger-006', lineUuid: 'mock-line-006-2', sortOrder: 2 }),
  line({ rocDate: '1150906', voucherNo: 'ZZ0000006', subjectName: '應付帳款', summary: '採購原物料', debitCredit: '2', amount: 84000, ledgerUuid: 'mock-ledger-006', lineUuid: 'mock-line-006-3', sortOrder: 3 }),

  // 115/09/05 — 傳票 ZZ0000007（租金）
  line({ rocDate: '1150905', voucherNo: 'ZZ0000007', subjectName: '租金支出', summary: '9 月份辦公室租金', debitCredit: '1', amount: 60000, ledgerUuid: 'mock-ledger-007', lineUuid: 'mock-line-007-1', sortOrder: 1 }),
  line({ rocDate: '1150905', voucherNo: 'ZZ0000007', subjectName: '銀行存款', summary: '9 月份辦公室租金', debitCredit: '2', amount: 60000, ledgerUuid: 'mock-ledger-007', lineUuid: 'mock-line-007-2', sortOrder: 2 }),

  // 115/09/04 — 傳票 ZZ0000008（水電費）
  line({ rocDate: '1150904', voucherNo: 'ZZ0000008', subjectName: '水電費', summary: '8 月份水電費', debitCredit: '1', amount: 8500, ledgerUuid: 'mock-ledger-008', lineUuid: 'mock-line-008-1', sortOrder: 1 }),
  line({ rocDate: '1150904', voucherNo: 'ZZ0000008', subjectName: '銀行存款', summary: '8 月份水電費', debitCredit: '2', amount: 8500, ledgerUuid: 'mock-ledger-008', lineUuid: 'mock-line-008-2', sortOrder: 2 }),

  // 115/09/04 — 傳票 ZZ0000009（廣告費）
  line({ rocDate: '1150904', voucherNo: 'ZZ0000009', subjectName: '廣告費', summary: '數位廣告投放', debitCredit: '1', amount: 15000, ledgerUuid: 'mock-ledger-009', lineUuid: 'mock-line-009-1', sortOrder: 1 }),
  line({ rocDate: '1150904', voucherNo: 'ZZ0000009', subjectName: '進項稅額', summary: '數位廣告投放', debitCredit: '1', amount: 750, ledgerUuid: 'mock-ledger-009', lineUuid: 'mock-line-009-2', sortOrder: 2 }),
  line({ rocDate: '1150904', voucherNo: 'ZZ0000009', subjectName: '應付帳款', summary: '數位廣告投放', debitCredit: '2', amount: 15750, ledgerUuid: 'mock-ledger-009', lineUuid: 'mock-line-009-3', sortOrder: 3 }),
];
