import { loadFormMetadata } from '../hooks/useFormMetadata';
import { FORM_LIST, getCurrentOpenYear, getDefaultFormYear, isFormApplicable, resolveToday } from './formList';
import { isPageFilled, resolveReportPage } from './reportPages';
import type { ConfirmField, ConfirmForm, ConfirmRow, MetadataField } from '@/api/peit';
import type { InitializationState, ReportField, SettlementReportId } from '../state/initializationReducer';

/** 欄位值是否已填（空字串與未設定視為空，0 與 false 是有意義的值） */
function isFilled(field: ReportField | undefined): field is ReportField {
  return field !== undefined && field.value !== '';
}

/** 依 metadata dataType 把畫面值（字串或數字）轉成 confirm 要的 value* 欄位；無法轉換回傳 null */
function toConfirmField(meta: MetadataField, field: ReportField): ConfirmField | null {
  const base = { fieldCode: meta.fieldCode };
  switch (meta.dataType) {
    case 0:
      return { ...base, valueText: String(field.value) };
    case 1: // 金額元
    case 5: { // 純整數
      const n = Number(field.value);
      return Number.isFinite(n) ? { ...base, valueInt: Math.round(n) } : null;
    }
    case 2: {
      const n = Number(field.value);
      return Number.isFinite(n) ? { ...base, valueDecimal: n } : null;
    }
    case 3:
      return { ...base, valueDate: String(field.value) };
    case 4: // 布林畫面以 1／0 存放（見 ReportFieldRow）
      return { ...base, valueBoolean: Number(field.value) === 1 };
    default:
      return null;
  }
}

function toConfirmFields(metaByCode: Map<string, MetadataField>, fields: Record<string, ReportField>, wantRow: boolean): ConfirmField[] {
  const result: ConfirmField[] = [];
  for (const [code, field] of Object.entries(fields)) {
    const meta = metaByCode.get(code);
    // 欄位須存在於該年 metadata；可重複列欄位只出現在 rows，不能當純量欄送
    if (!meta || meta.isRow !== wantRow || !isFilled(field)) continue;
    const confirmField = toConfirmField(meta, field);
    if (confirmField) result.push(confirmField);
  }
  return result;
}

interface FormSource {
  formCode: SettlementReportId;
  /** state.reports 實際存放資料的 key */
  reportKey: string;
  taxYear: number;
  periodStartMonth?: number;
}

/** 列出需要送出的表：營所稅各表（依組織型態）＋營業稅各期實際使用的 401／403；登記文件與負責人頁不在此 API 範圍 */
function listFormSources(state: InitializationState): FormSource[] {
  // 營運未滿一年不逐頁核對各表，只有封面；使用者先填過各表再改選「未滿一年」時，殘留的資料不能送出
  if (state.operatingStatus !== 'over_one_year') {
    return [{ formCode: 'CIT_COVER', reportKey: 'CIT_COVER', taxYear: state.reportYears.CIT_COVER ?? getDefaultFormYear('CIT_COVER', state.openYear ?? getCurrentOpenYear(resolveToday(state.simulatedDate))) }];
  }

  const openYear = state.openYear ?? getCurrentOpenYear(resolveToday(state.simulatedDate));

  const cit: FormSource[] = FORM_LIST.filter(form => form.taxType === 'cit' && isFormApplicable(form.formCode, state.orgType)).map(form => ({
    formCode: form.formCode,
    reportKey: form.formCode,
    taxYear: state.reportYears[form.formCode] ?? getDefaultFormYear(form.formCode, openYear),
  }));

  const vat: FormSource[] = state.reportPages
    .filter(page => page.period)
    .map(page => {
      const { formCode, reportKey } = resolveReportPage(page, state.vatChoices);
      return { formCode, reportKey, taxYear: page.period!.rocYear, periodStartMonth: page.period!.phase };
    });

  return [...cit, ...vat];
}

/**
 * 由畫面狀態組出 POST /ael/peit/cit/confirm 的 forms[]。
 * 欄位型別（valueInt／valueText…）依各表 metadata 的 dataType 決定，所以送出前會取得（或沿用快取的）metadata。
 * 只送有填資料的表；封面一律視為有資料（公司基本資料），其餘表沿用逐頁核對的「有資料」判斷（見 isPageFilled）。
 */
export async function buildConfirmForms(state: InitializationState): Promise<ConfirmForm[]> {
  const sources = listFormSources(state).filter(source => {
    if (source.formCode === 'CIT_COVER') return Object.values(state.reports.CIT_COVER?.fields ?? {}).some(isFilled);
    return isPageFilled(state.reports, source.reportKey);
  });

  return Promise.all(
    sources.map(async source => {
      const formNo = FORM_LIST.find(f => f.formCode === source.formCode)!.formNo;
      const meta = await loadFormMetadata(formNo, source.taxYear);
      const metaByCode = new Map(meta.fields.map(f => [f.fieldCode, f]));
      const report = state.reports[source.reportKey];

      const rows: ConfirmRow[] = [];
      (report?.rows ?? []).forEach((row, index) => {
        const fields = toConfirmFields(metaByCode, row, true);
        // 整列都沒填的空白列不送；列序保留畫面順序，從 0 起（規格 rowIndex ≥ 0）
        if (fields.length > 0) rows.push({ rowIndex: index, fields });
      });

      return {
        formCode: source.formCode,
        present: true,
        taxYear: source.taxYear,
        ...(source.periodStartMonth !== undefined && { periodStartMonth: source.periodStartMonth }),
        fields: toConfirmFields(metaByCode, report?.fields ?? {}, false),
        rows,
      };
    })
  );
}
