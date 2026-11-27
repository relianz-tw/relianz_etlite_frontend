'use client';

import { useInitialization } from '../../state/InitializationContext';
import { buildReportPages, formatPeriodLabel, getCurrentOpenYear, resolveToday } from '../../reports';
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
    dispatch({ type: 'APPLY_REPORT_PLAN', payload: buildReportPages({ openYear: state.openYear ?? getCurrentOpenYear(today), baseDate: state.openingBalance.baseDate, today, orgType: state.orgType, establishYear: state.establishYear }) });
  }, [total, state.simulatedDate, state.openYear, dispatch]);

  if (!spec) return null;

  // kicker 只標出目前所在段落（營所稅／營業稅第幾期），份數一律交給底部進度列的「第 N / M 份」。
  // 這裡原本另外寫「第 N / 9 份」，和底部的「第 N / 15 份」是兩套編號，同一頁兩個數字對不起來
  const kicker = spec.period ? `營業稅申報・${formatPeriodLabel(spec.period.rocYear, spec.period.phase)}` : '營所稅結算申報';
  const nextLabel = state.currentReportIndex >= total - 1 ? '下一頁：確認開帳' : '下一頁';
  const nav = { onPrev: () => dispatch({ type: 'PREV_STEP' }), onNext: () => dispatch({ type: 'NEXT_STEP' }), nextLabel };
  // 封面算第 1 份，所以這裡各頁要再 +1
  const progress = { value: state.currentReportIndex + 2, max: total + 1 };

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
