'use client';

import { useInitialization } from '../../state/InitializationContext';
import { REPORT_PAGE_ORDER, getCurrentOpenYear, getDefaultFormYear } from '../../reports';
import { ReportPageView } from '../ReportPageView';

/** 步驟 4：逐頁核對結算申報書各份報表（REPORT_PAGE_ORDER[currentReportIndex]），欄位來自 metadata API；可上傳辨識或直接手填 */
export function Step4Reports() {
  const { state, dispatch } = useInitialization();
  const formCode = REPORT_PAGE_ORDER[state.currentReportIndex];
  const total = REPORT_PAGE_ORDER.length;

  // 已辨識過的表用辨識回傳的年度，否則用預設年度（營所稅開帳年 -1、營業稅開帳年）
  const taxYear = state.reportYears[formCode] ?? getDefaultFormYear(formCode, state.openYear ?? getCurrentOpenYear());

  return (
    <ReportPageView
      formCode={formCode}
      taxYear={taxYear}
      kicker={`第 ${state.currentReportIndex + 1} / ${total} 份`}
      progress={{ value: state.currentReportIndex + 1, max: total }}
      showIdentify
      nextLabel={state.currentReportIndex < total - 1 ? '下一份' : '下一步：確認開帳'}
      onNext={() => dispatch({ type: 'NEXT_STEP' })}
    />
  );
}
