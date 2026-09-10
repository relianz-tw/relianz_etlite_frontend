/**
 * 標籤／專案欄位，後端尚無對應 API，暫存於前端記憶體（重新整理頁面會重置）。
 * 待後端開放標籤系統 API 後，本檔改為呼叫真實 API，呼叫端（View）的介面不需變動。
 *
 * ⚠️ 扣繳／二代健保繳款狀態與申報狀態不在此檔管理：`LabourFormDto` 已有對應的真實欄位
 * （isRemitWithholding／withholdingRemitDate／isRemitNhi／nhiRemitDate／isNhiDeclare／nhiDeclareDate），
 * 直接由 `data.ts` 的 mapLabourDtoToRecord 映射即可，不需要、也不應該再用前端記憶體模擬。
 */
export interface LaborLocalExtras {
  tags: string[];
  projects: string[];
}

function emptyExtras(): LaborLocalExtras {
  return { tags: [], projects: [] };
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
