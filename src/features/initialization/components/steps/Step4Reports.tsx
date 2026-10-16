'use client';

import { useInitialization } from '../../state/InitializationContext';
import { buildReportPages, formatPeriodLabel, getCurrentOpenYear, resolveToday } from '../../reports';
import { PartnersPage } from '../PartnersPage';
import { RegistrationDocsPage } from '../RegistrationDocsPage';
import { ReportPageView } from '../ReportPageView';
import { useEffect } from 'react';

/** 步驟 4：逐頁核對（reportPages[currentReportIndex]）：營所稅各表與依期別展開的 401／403，欄位來自 metadata API */
export function Step4Reports() {
  const { state, dispatch } = useInitialization();
  const total = state.reportPages.length;
  const spec = state.reportPages[state.currentReportIndex];

  // 舊 session 或直接進入時沒有頁面清單：依當下的開帳年度與日期補建
  useEffect(() => {
    if (total > 0) return;
    const today = resolveToday(state.simulatedDate);
    dispatch({ type: 'APPLY_REPORT_PLAN', payload: buildReportPages({ openYear: state.openYear ?? getCurrentOpenYear(today), today, orgType: state.orgType }) });
  }, [total, state.simulatedDate, state.openYear, dispatch]);

  if (!spec) return null;

  // 營業稅期別頁標題上方標期別；進度條各頁一致顯示，讓使用者知道整體還剩幾頁
  const kicker = spec.period ? `營業稅申報・${formatPeriodLabel(spec.period.rocYear, spec.period.phase)}` : `第 ${state.currentReportIndex + 1} / ${total} 份`;
  const nextLabel = state.currentReportIndex >= total - 1 ? '下一步：確認開帳' : '下一份';
  const nav = { onPrev: () => dispatch({ type: 'PREV_STEP' }), onNext: () => dispatch({ type: 'NEXT_STEP' }), nextLabel };
  const progress = { value: state.currentReportIndex + 1, max: total };
  if (spec.kind === 'registration') return <RegistrationDocsPage kicker={kicker} nav={nav} progress={progress} />;
  if (spec.kind === 'partners') return <PartnersPage kicker={kicker} nav={nav} progress={progress} />;

  // 營所稅：已辨識過的表用辨識回傳的年度，否則用預設年度；401／403：年度由期別決定
  const taxYear = spec.period ? spec.taxYear : (state.reportYears[spec.key] ?? spec.taxYear);

  return (
    <ReportPageView
      key={spec.key}
      spec={spec}
      taxYear={taxYear}
      kicker={kicker}
      progress={progress}
      showIdentify
      nextLabel={nextLabel}
      onNext={() => dispatch({ type: 'NEXT_STEP' })}
    />
  );
}
