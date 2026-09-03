import type { LaborRecord, NhiDeclareStatus, SavedProvider } from './types';

/**
 * 前端暫存假資料，僅存於記憶體，重新整理頁面會重置。
 * 待後端 API 就緒後，本檔的函式改為呼叫真實 API，呼叫端（View）的介面不需變動。
 */

let records: LaborRecord[] = [
  {
    uuid: 'l1',
    withholdingId: 'W0001',
    name: '林志豪',
    idNumber: 'D123456789',
    phone: '0955123456',
    address: '台北市信義區松仁路100號',
    nationality: '本國籍',
    isUnionInsured: false,
    serviceType: '9A',
    serviceName: '公司財務報表審閱',
    serviceYear: 2026,
    serviceMonth: 1,
    serviceDay: 20,
    paymentYear: 2026,
    paymentMonth: 1,
    paymentDay: 25,
    payableAmount: 50000,
    withholdingTax: 5000,
    secondHealthInsuranceFee: 1055,
    actualPaymentAmount: 43945,
    signStatus: 1,
    signTime: '2026-01-26T09:12:00.000Z',
    tags: ['財務'],
    projects: [],
    withholdingFiles: [],
    withholdingProofFiles: [],
    withholdingPaid: false,
    nhiFiles: [],
    nhiProofFiles: [],
    nhiPaid: false,
    nhiDeclareStatus: 0,
    isNhiDeclared: false,
  },
  {
    uuid: 'l2',
    withholdingId: 'W0002',
    name: '張美惠',
    idNumber: 'E234567890',
    phone: '0966234567',
    address: '新北市三重區重新路二段50號',
    nationality: '本國籍',
    isUnionInsured: false,
    serviceType: '50',
    serviceName: '尾牙活動臨時支援',
    serviceYear: 2026,
    serviceMonth: 1,
    serviceDay: 15,
    paymentYear: 2026,
    paymentMonth: 1,
    paymentDay: 15,
    payableAmount: 18000,
    withholdingTax: 0,
    secondHealthInsuranceFee: 380,
    actualPaymentAmount: 17620,
    signStatus: 0,
    signTime: '',
    tags: [],
    projects: [],
    withholdingFiles: [],
    withholdingProofFiles: [],
    withholdingPaid: false,
    nhiFiles: [],
    nhiProofFiles: [],
    nhiPaid: false,
    nhiDeclareStatus: 0,
    isNhiDeclared: false,
  },
];

let nextId = records.length + 1;

let savedProviders: SavedProvider[] = [
  { name: '林志豪', idNumber: 'D123456789', phone: '0955123456', nationality: '本國籍', isUnionInsured: false },
];

let allTags: string[] = ['財務', '法務', '行銷'];
let allProjects: string[] = [];

export function listLaborRecords(): LaborRecord[] {
  return records;
}

export function getLaborRecord(uuid: string): LaborRecord | undefined {
  return records.find(r => r.uuid === uuid);
}

function updateRecord(uuid: string, patch: Partial<LaborRecord>): void {
  records = records.map(r => (r.uuid === uuid ? { ...r, ...patch } : r));
}

export { updateRecord as updateLaborRecord };

export function addLaborRecord(
  data: Omit<
    LaborRecord,
    | 'uuid'
    | 'withholdingId'
    | 'signStatus'
    | 'signTime'
    | 'tags'
    | 'projects'
    | 'withholdingFiles'
    | 'withholdingProofFiles'
    | 'withholdingPaid'
    | 'nhiFiles'
    | 'nhiProofFiles'
    | 'nhiPaid'
    | 'nhiDeclareStatus'
    | 'isNhiDeclared'
  >,
): LaborRecord {
  const record: LaborRecord = {
    ...data,
    uuid: `l${nextId}`,
    withholdingId: `W${String(nextId).padStart(4, '0')}`,
    signStatus: 0,
    signTime: '',
    tags: [],
    projects: [],
    withholdingFiles: [],
    withholdingProofFiles: [],
    withholdingPaid: false,
    nhiFiles: [],
    nhiProofFiles: [],
    nhiPaid: false,
    nhiDeclareStatus: 0,
    isNhiDeclared: false,
  };
  nextId += 1;
  records = [...records, record];
  return record;
}

export function deleteLaborRecord(uuid: string): void {
  records = records.filter(r => r.uuid !== uuid);
}

/** 簽署頁確認送出：寫入簽署後可編輯的個人資料並標記為已簽署 */
export function signLaborRecord(uuid: string, patch: { idNumber: string; address: string; nationality: string }): void {
  updateRecord(uuid, { ...patch, signStatus: 1, signTime: new Date().toISOString() });
}

export function listSavedProviders(): SavedProvider[] {
  return savedProviders;
}

/** 依姓名模糊搜尋已記住的勞務者，供新增勞報單姓名自動完成使用 */
export function searchSavedProviders(query: string): SavedProvider[] {
  const q = query.trim();
  if (!q) return [];
  return savedProviders.filter(p => p.name.includes(q));
}

export function saveProvider(provider: SavedProvider): void {
  const exists = savedProviders.some(p => p.idNumber && p.idNumber === provider.idNumber);
  savedProviders = exists ? savedProviders.map(p => (p.idNumber === provider.idNumber ? provider : p)) : [...savedProviders, provider];
}

export function listAllTags(): string[] {
  return allTags;
}

export function listAllProjects(): string[] {
  return allProjects;
}

export function addTag(name: string): void {
  if (!allTags.includes(name)) allTags = [...allTags, name];
}

export function addProject(name: string): void {
  if (!allProjects.includes(name)) allProjects = [...allProjects, name];
}

export function cycleNhiDeclareStatus(current: NhiDeclareStatus): NhiDeclareStatus {
  const order: NhiDeclareStatus[] = [1, 2, 3, 4];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}
