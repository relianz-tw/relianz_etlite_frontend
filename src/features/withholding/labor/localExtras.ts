import type { MockFile } from '../components/mockFile';
import type { NhiDeclareStatus } from './types';

/**
 * 標籤／專案／扣繳與二代健保繳款書等欄位，後端尚無對應 API，暫存於前端記憶體（重新整理頁面會重置）。
 * 待後端開放對應 API（標籤系統、繳款書產生／繳款狀態／申報）後，本檔改為呼叫真實 API，
 * 呼叫端（View）的介面不需變動。
 */
export interface LaborLocalExtras {
  tags: string[];
  projects: string[];
  withholdingFiles: MockFile[];
  withholdingProofFiles: MockFile[];
  withholdingPaid: boolean;
  nhiFiles: MockFile[];
  nhiProofFiles: MockFile[];
  nhiPaid: boolean;
  nhiDeclareStatus: NhiDeclareStatus;
  isNhiDeclared: boolean;
}

function emptyExtras(): LaborLocalExtras {
  return {
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
}

const extrasByUuid = new Map<string, LaborLocalExtras>();

export function getLaborLocalExtras(uuid: string): LaborLocalExtras {
  return extrasByUuid.get(uuid) ?? emptyExtras();
}

export function updateLaborLocalExtras(uuid: string, patch: Partial<LaborLocalExtras>): LaborLocalExtras {
  const next = { ...getLaborLocalExtras(uuid), ...patch };
  extrasByUuid.set(uuid, next);
  return next;
}

let allTags: string[] = [];
let allProjects: string[] = [];

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

/**
 * 交易編號（orderCode）暫存：GET /ael/labour、POST /ael/labour/data/filter 尚未回傳此欄位，
 * 僅新增（POST /ael/labour）成功回應有。透過此處暫存，讓自己剛建立的那筆能立刻顯示編號；
 * 待後端把 orderCode 補進列表／詳情 API 後可移除。
 */
const orderCodeByUuid = new Map<string, string>();

export function getLaborOrderCode(uuid: string): string {
  return orderCodeByUuid.get(uuid) ?? '';
}

export function setLaborOrderCode(uuid: string, orderCode: string): void {
  orderCodeByUuid.set(uuid, orderCode);
}
