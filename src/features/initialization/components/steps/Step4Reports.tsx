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
    dispatch({ type: 'APPLY_REPORT_PLAN', payload: buildReportPages({ openYear: state.openYear ?? getCurrentOpenYear(today), baseDate: state.openingBalance.baseDate, today, orgType: state.orgType }) });
  }, [total, state.simulatedDate, state.openYear, dispatch]);

  if (!spec) return null;

  // kicker 標出目前所在段落（營所稅／營業稅／登記資料），營所稅頁排在最前，索引即第幾份；整體進度由進度條呈現
  const citTotal = state.reportPages.filter(p => !p.period && !p.kind).length;
  const kicker = spec.kind
    ? '登記資料'
    : spec.period
      ? `營業稅申報・${formatPeriodLabel(spec.period.rocYear, spec.period.phase)}`
      : `營所稅結算申報・第 ${state.currentReportIndex + 1} / ${citTotal} 份`;
  const nextLabel = state.currentReportIndex >= total - 1 ? '下一頁：確認開帳' : '下一頁';
  const nav = { onPrev: () => dispatch({ type: 'PREV_STEP' }), onNext: () => dispatch({ type: 'NEXT_STEP' }), nextLabel };
  // 封面算第 1 份，所以這裡各頁要再 +1
  const progress = { value: state.currentReportIndex + 2, max: total + 1 };
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
