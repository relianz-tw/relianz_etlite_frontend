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

/** 最新版官方費用科目清單；value 為搜尋值（目前由前端過濾，暫傳空字串） */
export function listOfficialSubjects(
  value = "",
): Promise<OfficialSubjectDto[]> {
  return apiFetch<OfficialSubjectDto[]>(
    `/ael/subject/official/list/latest${buildQuery({ value })}`,
  );
}

export interface SubjectFilterParams {
  type?: number;
  calculationType?: number;
  industry?: number;
  value?: string;
  isBank?: 0 | 1;
  buyOrSell?: 2 | 3;
}

/** 進階篩選官方科目清單（/ael/subject/official/list/filter），供各畫面依語境（進項／銷項／銀行等）取子集 */
export function filterOfficialSubjects(
  params: SubjectFilterParams = {},
): Promise<OfficialSubjectDto[]> {
  return apiFetch<OfficialSubjectDto[]>(
    `/ael/subject/official/list/filter${buildQuery({ ...params })}`,
  );
}

/** 使用者常用科目（已依 rank 由高到低排序） */
export function listSubjectUsage(value = ""): Promise<SubjectUsageDto[]> {
  return apiFetch<SubjectUsageDto[]>(
    `/ael/subject/usage${buildQuery({ acUuid: COMPANY_UUID, value })}`,
  );
}

/**
 * 固定會計科目的目前餘額（沖帳中心「沖帳對象分配」用）。
 * ⚠️ 後端尚未提供此端點，暫為 stub，一律回空陣列——呼叫端（useReconTargets）取不到的科目
 * balance 維持 undefined，介面顯示「餘額 —」而非誤導的 $0。
 * 期望端點：GET /ael/subject/balances?companyUuid={COMPANY_UUID}&subjectCodes=0201111,0202130,...
 * 期望回應：SubjectBalanceDto[]（只回有查到的代碼，查無者省略而非回 0）。
 * 後端上線後把函式體換成實際 apiFetch 呼叫即可，呼叫端不用改。
 */
export async function listSubjectBalances(
  subjectCodes: string[],
): Promise<SubjectBalanceDto[]> {
  void subjectCodes;
  return [];
}

/**
 * 依交易描述請 AI 建議最多 3 個會計科目（/ael/subject/identify）。
 * 描述與會計科目辨識無關或無法辨識時，後端回 400（errorCode 0003），呼叫端需另外處理，
 * 不當一般錯誤丟出（見 SubjectPicker.handleAiSubmit）。
 */
export function identifySubject(
  text: string,
): Promise<SubjectIdentifyCandidateDto[]> {
  return apiFetch<{ candidates: SubjectIdentifyCandidateDto[] }>(
    "/ael/subject/identify",
    {
      method: "POST",
      body: JSON.stringify({ text }),
    },
  ).then((res) => res.candidates);
}
