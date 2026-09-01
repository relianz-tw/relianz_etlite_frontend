/**
 * 帳簿區「會計科目」端點封裝（/ael/subject/*）。
 * official/list/latest 帶出最新一版官方科目清單；usage 帶出目前公司的常用科目排名。
 */
import { buildQuery, apiFetch } from "./client";
import { COMPANY_UUID } from "./config";
import type {
  OfficialSubjectDto,
  SubjectBalanceDto,
  SubjectIdentifyCandidateDto,
  SubjectUsageDto,
} from "./types";

/** 常用科目使用情境（/ael/subject/usage）：0 進項（應付／進折）、1 銷項（應收／銷折）、2 銀行提匯 */
export type SubjectUsageScenario = 0 | 1 | 2;

/** 最新版官方費用科目清單；value 為搜尋值（目前由前端過濾，暫傳空字串） */
export function listOfficialSubjects(
  value = "",
): Promise<OfficialSubjectDto[]> {
  return apiFetch<OfficialSubjectDto[]>(
    `/ael/subject/official/list/latest${buildQuery({ companyUuid: COMPANY_UUID, value })}`,
  );
}

export interface SubjectFilterParams {
  type?: number;
  calculationType?: number;
  industry?: number;
  value?: string;
  isBank?: 0 | 1;
  buyOrSell?: 2 | 3;
  /** 是固定資產折舊與減損科目嗎；0 false、1 true，不傳則不篩 */
  isFixedAssetDepreciationImpairment?: 0 | 1;
  /** 沖帳區專用篩選：0 沖帳 Others、1 沖應收、2 沖應付，不傳則不篩 */
  settle?: 0 | 1 | 2;
}

/** 進階篩選官方科目清單（/ael/subject/official/list/filter），供各畫面依語境（進項／銷項／銀行等）取子集 */
export function filterOfficialSubjects(
  params: SubjectFilterParams = {},
): Promise<OfficialSubjectDto[]> {
  return apiFetch<OfficialSubjectDto[]>(
    `/ael/subject/official/list/filter${buildQuery({ companyUuid: COMPANY_UUID, ...params })}`,
  );
}

/** 使用者常用科目（已依 rank 由高到低排序）；scenario 為後端必填參數，見 SubjectUsageScenario */
export function listSubjectUsage(scenario: SubjectUsageScenario, value = ""): Promise<SubjectUsageDto[]> {
  return apiFetch<SubjectUsageDto[]>(
    `/ael/subject/usage${buildQuery({ acUuid: COMPANY_UUID, scenario, value })}`,
  );
}

/**
 * 查詢單一官方科目的公司目前餘額（GET /ael/ledger/subjectBalances）。
 * 若公司尚未有該科目的餘額紀錄，後端會先初始化再回傳。
 */
export function getSubjectBalance(
  officialAccountingSubjectId: number,
): Promise<SubjectBalanceDto> {
  return apiFetch<SubjectBalanceDto>(
    `/ael/ledger/subjectBalances${buildQuery({ companyUuid: COMPANY_UUID, officialAccountingSubjectId })}`,
  );
}

/**
 * 批次取多個科目的餘額（沖帳中心「沖帳對象分配」用）。端點本身只能一次查一個科目，
 * 這裡以 allSettled 併發查詢，單一科目查詢失敗直接略過——呼叫端（useReconTargets）
 * 取不到的科目 balance 維持 undefined，介面顯示「餘額 —」而非誤導的 $0。
 */
export async function listSubjectBalances(
  officialAccountingSubjectIds: number[],
): Promise<SubjectBalanceDto[]> {
  const results = await Promise.allSettled(officialAccountingSubjectIds.map(getSubjectBalance));
  return results.filter((r): r is PromiseFulfilledResult<SubjectBalanceDto> => r.status === "fulfilled").map((r) => r.value);
}

/** AI 辨識科目的使用場景：0 銀行總覽、1 進項、2 銷項 */
export type SubjectIdentifyScenario = 0 | 1 | 2;

/**
 * 依交易描述請 AI 建議最多 3 個會計科目（/ael/subject/identify）。
 * 描述與會計科目辨識無關或無法辨識時，後端回 400（errorCode 0003），呼叫端需另外處理，
 * 不當一般錯誤丟出（見 SubjectPicker.handleAiSubmit）。
 */
export function identifySubject(
  text: string,
  scenario: SubjectIdentifyScenario,
): Promise<SubjectIdentifyCandidateDto[]> {
  return apiFetch<{ candidates: SubjectIdentifyCandidateDto[] }>(
    "/ael/subject/identify",
    {
      method: "POST",
      body: JSON.stringify({ text, scenario }),
    },
  ).then((res) => res.candidates);
}
