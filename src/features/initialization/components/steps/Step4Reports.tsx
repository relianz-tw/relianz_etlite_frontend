'use client';

import { useInitialization } from '../../state/InitializationContext';
import { REPORT_PAGES } from '../../reports';
import { ReportBalanceBar } from '../ReportBalanceBar';
import { ReportColumn } from '../ReportColumn';
import { ReportTable } from '../ReportTable';
import { MobileFixedBottom } from '@/components/onboarding/MobileFixedBottom';
import { SplitPanel } from '@/components/initialization/SplitPanel';
import Button from '@/components/ui/Button';

/** 步驟 4：逐頁核對結算申報書各份報表（REPORT_PAGES[currentReportIndex]），沒上傳到的欄位留空手填即可 */
export function Step4Reports() {
  const { state, dispatch } = useInitialization();
  const page = REPORT_PAGES[state.currentReportIndex];
  const total = REPORT_PAGES.length;

  const header = (
    <div className='mb-1'>
      <p className='text-xs font-semibold text-brand-blue'>
        第 {state.currentReportIndex + 1} / {total} 份
      </p>
      {/* 報表名稱含頓號等標點，用序體排版可能出現字重/標點對不齊的問題，改用正文黑體 */}
      <h1 className='text-xl md:text-2xl font-bold text-neutral-dark'>{page.title}</h1>
      {page.hint && <p className='mt-1 text-sm text-neutral-mid'>{page.hint}</p>}
    </div>
  );

  const nextButton = (
    <MobileFixedBottom className='flex gap-3'>
      <Button variant='ghost' onClick={() => dispatch({ type: 'PREV_STEP' })}>
        上一頁
      </Button>
      <Button onClick={() => dispatch({ type: 'NEXT_STEP' })} className='flex-1'>
        {state.currentReportIndex < total - 1 ? '下一份' : '下一步：確認開帳'}
      </Button>
    </MobileFixedBottom>
  );

  if (page.layout === 'table' && page.table) {
    return (
      <div className='flex flex-col flex-1 min-h-0 p-5 md:p-12 md:overflow-y-auto'>
        <div className='flex flex-col gap-5'>
          {header}
          <ReportTable reportId={page.id} table={page.table} />
        </div>
        {nextButton}
      </div>
    );
  }

  const left = (
    <div className='flex flex-col gap-5'>
      {page.left && <ReportColumn reportId={page.id} column={page.left} />}
      {page.balanceCheck && <ReportBalanceBar reportId={page.id} page={page} />}
      {nextButton}
    </div>
  );
  const right = page.right ? <ReportColumn reportId={page.id} column={page.right} side={page.mirrorRight ? 'right' : 'left'} /> : undefined;

  return (
    <div className='flex flex-col flex-1 min-h-0'>
      {/* 標題橫跨左右兩欄、置於欄位捲動區之外，讓左右第一列資料切齊，捲動同步時對得上 */}
      <div className='shrink-0 p-5 pb-0 md:p-12 md:pb-0'>{header}</div>
      <SplitPanel left={left} right={right} syncScroll={page.syncScroll} />
    </div>
  );
}
