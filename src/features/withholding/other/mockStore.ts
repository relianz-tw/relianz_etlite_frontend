import { calculateNetPayment, calculateNhiAmount, calculateWithholdingAmount } from './data';
import type { CategoryCode, NhiDeclareStatus, WithholdingRecord } from './types';

/**
 * 前端暫存假資料，僅存於記憶體，重新整理頁面會重置。
 * 待後端 API 就緒後，本檔的函式改為呼叫真實 API，呼叫端（View）的介面不需變動。
 */

function seedRecord(
  categoryCode: CategoryCode,
  grossIncome: number,
  overrides: Partial<WithholdingRecord>,
): WithholdingRecord {
  const earnerType = overrides.earnerType ?? 'individual';
  const withholdingAmount = calculateWithholdingAmount(categoryCode, grossIncome);
  const nhiAmount = calculateNhiAmount(categoryCode, grossIncome, earnerType);
  return {
    uuid: '',
    withholdingId: '',
    categoryCode,
    earnerType,
    residency: 'domestic',
    recipientName: '',
    recipientIdNumber: '',
    recipientAddress: '',
    landlords: [],
    rentalAddress: '',
    rentalAddressTaxId: '',
    burden: 'tenant',
    rentalFiles: [],
    paymentYear: 2026,
    paymentMonth: 1,
    paymentDay: 15,
    incomeYear: 2026,
    incomeMonth: 1,
    grossIncome,
    withholdingAmount,
    nhiAmount,
    netPayment: calculateNetPayment(grossIncome, withholdingAmount, nhiAmount),
    remarks: '',
    withholdingPaid: false,
    withholdingFiles: [],
    withholdingProofFiles: [],
    nhiPaid: false,
    nhiFiles: [],
    nhiProofFiles: [],
    isNhiDeclared: false,
    nhiDeclareStatus: 0,
    ...overrides,
  };
}

let records: WithholdingRecord[] = [
  seedRecord('51', 30000, {
    earnerType: 'individual',
    landlords: [{ id: 'ld1', name: '陳建成', idNumber: 'A123456789', address: '台北市中山區林森北路100號' }],
    recipientName: '陳建成',
    recipientIdNumber: 'A123456789',
    rentalAddress: '台北市中山區林森北路100號3樓',
    rentalAddressTaxId: 'A12345678901',
    burden: 'tenant',
    paymentMonth: 1,
    incomeMonth: 1,
  }),
  seedRecord('9A', 50000, {
    earnerType: 'individual',
    incomeCategory: '9A',
    practiceTypeCode: '9A02',
    recipientName: '林志豪',
    recipientIdNumber: 'D123456789',
    recipientAddress: '台北市信義區松仁路100號',
    paymentMonth: 1,
    incomeMonth: 1,
  }),
  seedRecord('9B', 15000, {
    earnerType: 'individual',
    incomeCategory: '9B',
    practiceTypeCode: '9B02',
    recipientName: '王雅婷',
    recipientIdNumber: 'B234567890',
    recipientAddress: '新北市板橋區文化路一段50號',
    paymentMonth: 2,
    incomeMonth: 2,
  }),
  seedRecord('53', 40000, {
    earnerType: 'individual',
    recipientName: '張明宗',
    recipientIdNumber: 'C345678901',
    recipientAddress: '台中市西區英才路200號',
    paymentMonth: 2,
    incomeMonth: 2,
  }),
  seedRecord('5B', 25000, {
    earnerType: 'individual',
    recipientName: '李佳玲',
    recipientIdNumber: 'E456789012',
    recipientAddress: '高雄市苓雅區四維三路10號',
    paymentMonth: 3,
    incomeMonth: 3,
  }),
  seedRecord('91', 60000, {
    earnerType: 'individual',
    recipientName: '吳建宏',
    recipientIdNumber: 'F567890123',
    recipientAddress: '台南市東區長榮路二段20號',
    paymentMonth: 3,
    incomeMonth: 3,
  }),
  seedRecord('93', 200000, {
    earnerType: 'individual',
    recipientName: '黃淑芬',
    recipientIdNumber: 'G678901234',
    recipientAddress: '桃園市中壢區中央西路30號',
    paymentMonth: 4,
    incomeMonth: 4,
  }),
  seedRecord('97', 35000, {
    earnerType: 'individual',
    recipientName: '許志明',
    recipientIdNumber: 'H789012345',
    recipientAddress: '新竹市東區光復路一段40號',
    paymentMonth: 4,
    incomeMonth: 4,
  }),
  seedRecord('92', 18000, {
    earnerType: 'individual',
    recipientName: '蔡宜庭',
    recipientIdNumber: 'J890123456',
    recipientAddress: '彰化市中山路二段50號',
    paymentMonth: 5,
    incomeMonth: 5,
  }),
].map((r, i) => ({ ...r, uuid: `wh${i + 1}`, withholdingId: `W${String(i + 1).padStart(4, '0')}` }));

let nextId = records.length + 1;

export function listWithholdingRecords(): WithholdingRecord[] {
  return records;
}

export function getWithholdingRecord(uuid: string): WithholdingRecord | undefined {
  return records.find(r => r.uuid === uuid);
}

function updateRecord(uuid: string, patch: Partial<WithholdingRecord>): void {
  records = records.map(r => (r.uuid === uuid ? { ...r, ...patch } : r));
}

export { updateRecord as updateWithholdingRecord };

export type WithholdingInput = Omit<
  WithholdingRecord,
  | 'uuid'
  | 'withholdingId'
  | 'withholdingPaid'
  | 'withholdingFiles'
  | 'withholdingProofFiles'
  | 'nhiPaid'
  | 'nhiFiles'
  | 'nhiProofFiles'
  | 'isNhiDeclared'
  | 'nhiDeclareStatus'
>;

export function addWithholdingRecord(data: WithholdingInput): WithholdingRecord {
  const record: WithholdingRecord = {
    ...data,
    uuid: `wh${nextId}`,
    withholdingId: `W${String(nextId).padStart(4, '0')}`,
    withholdingPaid: false,
    withholdingFiles: [],
    withholdingProofFiles: [],
    nhiPaid: false,
    nhiFiles: [],
    nhiProofFiles: [],
    isNhiDeclared: false,
    nhiDeclareStatus: 0,
  };
  nextId += 1;
  records = [...records, record];
  return record;
}

export function deleteWithholdingRecord(uuid: string): void {
  records = records.filter(r => r.uuid !== uuid);
}

export function cycleNhiDeclareStatusFor(current: NhiDeclareStatus): NhiDeclareStatus {
  const order: NhiDeclareStatus[] = [1, 2, 3, 4];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}

/** 租金「快速帶入上期資料」：依租賃地址去重，取各地址最近一筆紀錄，供新增租金時帶入房東與稅籍資料 */
export function listRecentRentalRecords(): WithholdingRecord[] {
  const rentalRecords = records.filter(r => r.categoryCode === '51').slice().reverse();
  const seen = new Set<string>();
  const result: WithholdingRecord[] = [];
  for (const r of rentalRecords) {
    if (seen.has(r.rentalAddress)) continue;
    seen.add(r.rentalAddress);
    result.push(r);
  }
  return result;
}
