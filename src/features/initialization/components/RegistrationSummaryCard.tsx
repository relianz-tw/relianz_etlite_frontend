'use client';

import { CircleCheck, Loader2, TriangleAlert } from 'lucide-react';
import SectionCard from '@/components/ui/SectionCard';
import { useFormMetadata } from '../hooks/useFormMetadata';
import { COMPANY_REGISTRATION_KEY, OFFICER_COLUMN_KEYS, REGISTRATION_FORM_NO, REGISTRATION_FORM_YEAR, REGISTRATION_SUMMARY_GROUPS } from '../reports';
import { useInitialization } from '../state/InitializationContext';
import { ReportFieldRow } from './ReportFieldRow';
import { RowCards } from './ReportTable';
import { PaperStoreProvider } from './paper/PaperStore';
import { useInitPaperStore } from './paper/useInitPaperStore';

/**
 * 登記事項表的辨識結果摘要（見 DESIGN.md「登記事項表摘要卡」）。
 * 這張表約 100 個欄位，開帳只用得到十幾個，所以不畫完整紙本頁、也不給對照面板；
 * 欄位標籤與型別一律取自 metadata，沒有辨識到值的欄位不顯示。
 */
export function RegistrationSummaryCard() {
  const { state, dispatch } = useInitialization();
  const { page, loading, error, retry } = useFormMetadata(REGISTRATION_FORM_NO, REGISTRATION_FORM_YEAR);
  const report = state.reports[COMPANY_REGISTRATION_KEY];

  if (loading) {
    return (
      <SectionCard>
        <span className='flex items-center gap-2 text-sm text-neutral-mid'>
          <Loader2 size={16} className='shrink-0 animate-spin text-brand-blue' />
          載入欄位資訊…
        </span>
      </SectionCard>
    );
  }

  // metadata 拿不到就畫不出欄位名稱（版面一律依後端，前端不寫死）；資料本身已經帶進後面的頁面了
  if (error || !page) {
    return (
      <SectionCard>
        <p className='flex items-start gap-1.5 text-sm text-semantic-error'>
          <TriangleAlert size={16} className='mt-0.5 shrink-0' />
          <span>
            欄位資訊載入失敗，無法顯示辨識結果（資料仍已帶入後面的頁面）。
            <button type='button' onClick={retry} className='ml-1 font-medium text-brand-blue underline-offset-2 hover:underline'>
              重試
            </button>
          </span>
        </p>
      </SectionCard>
    );
  }

  const fields = report?.fields ?? {};
  const groups = REGISTRATION_SUMMARY_GROUPS.map(group => ({
    title: group.title,
    // 只畫辨識到有值的欄位，不然整張卡會變成一堆空格
    fields: group.keys.map(key => page.fieldMap[key]).filter(field => field && (fields[field.key]?.value ?? '') !== ''),
  })).filter(group => group.fields.length > 0);

  const officerColumns = OFFICER_COLUMN_KEYS.map(key => page.fieldMap[key]).filter(Boolean);
  const hasOfficers = (report?.rows.length ?? 0) > 0 && officerColumns.length > 0;
  const appliedCount = groups.reduce((sum, group) => sum + group.fields.length, 0) + (report?.rows.length ?? 0);

  return (
    <SectionCard>
      <span className='flex items-center gap-2 text-sm font-bold text-neutral-dark'>
        <CircleCheck size={18} className='shrink-0 text-semantic-success' />
        已從這份檔案帶入 {appliedCount} 項資料
      </span>

      {groups.map(group => (
        <div key={group.title} className='flex flex-col gap-3'>
          <span className='text-xs font-medium text-neutral-mid'>{group.title}</span>
          <div className='grid grid-cols-1 gap-4 nav:grid-cols-2 nav:gap-x-6'>
            {group.fields.map(field => (
              <ReportFieldRow
                key={field.key}
                field={field}
                data={fields[field.key] ?? { value: '', aiFilled: false }}
                // 公司聯絡電話是各份文件共用的欄位，改這裡會一併更新封面與其餘報表（見 setReportFieldSynced）
                onChange={value => dispatch({ type: 'SET_REPORT_FIELD', payload: { reportId: COMPANY_REGISTRATION_KEY, key: field.key, value } })}
              />
            ))}
          </div>
        </div>
      ))}

      {hasOfficers && <OfficerList columns={officerColumns} page={page} />}

      <div className='flex flex-col gap-0.5 text-xs text-neutral-mid'>
        <span>這些資料會自動帶入後面的公司資料與投資人明細表，之後仍可修改。</span>
        {hasOfficers && <span>名單僅含董監事，其餘股東請於投資人明細表補齊。</span>}
      </div>
    </SectionCard>
  );
}

/** 董監事名單沿用可重複列的卡片式明細；登記表 metadata 沒有 tables[]，欄位自己挑 */
function OfficerList({ columns, page }: { columns: Parameters<typeof RowCards>[0]['columns']; page: NonNullable<ReturnType<typeof useFormMetadata>['page']> }) {
  const store = useInitPaperStore(COMPANY_REGISTRATION_KEY, page);
  if (!store) return null;
  return (
    <div className='flex flex-col gap-3'>
      <span className='text-xs font-medium text-neutral-mid'>董事監察人名單</span>
      <PaperStoreProvider value={store}>
        <RowCards columns={columns} addLabel='新增一位董監事' />
      </PaperStoreProvider>
    </div>
  );
}
