'use client';

import { useRef, type ReactNode } from 'react';
import { useInitialization } from '../state/InitializationContext';
import { useRegistrationIdentify } from '../hooks/useRegistrationIdentify';
import { ALL_REGISTRATION_DOCS } from '../reports/registrationDocs';
import { COMPANY_REGISTRATION_KEY, IDENTIFY_MAX_SIZE_MB, hasRegistrationData } from '../reports';
import { RegistrationSummaryCard } from './RegistrationSummaryCard';
import { StepPageHeader } from '@/components/initialization/StepPageHeader';
import Button from '@/components/ui/Button';
import SectionCard from '@/components/ui/SectionCard';
import { CircleCheck, FileText, Loader2, TriangleAlert, Upload, X } from 'lucide-react';

/** 與辨識 API 的上限一致（IDENTIFY_MAX_SIZE_MB），登記事項表才不會傳得進來卻辨識不了 */
const MAX_SIZE_MB = IDENTIFY_MAX_SIZE_MB;

/** 登記文件上傳頁（合約後第一步）：每項可上傳 PDF 或圖片。TODO：後端上傳 API 上線後改為實際上傳，目前只記錄檔名 */
export function RegistrationDocsPage() {
  const { state, dispatch } = useInitialization();
  const identify = useRegistrationIdentify();
  const nav = { onPrev: () => dispatch({ type: 'PREV_STEP' }), onNext: () => dispatch({ type: 'NEXT_STEP' }), nextLabel: '下一頁' };
  const recognizing = identify.status === 'recognizing';
  const showSummary = !!state.registrationFiles.REGISTRATION_ITEMS && hasRegistrationData(state.reports);

  return (
    <>
      <StepPageHeader kicker='登記資料' title='上傳登記文件' badges={['給客戶上傳']} nav={nav}>
        <p className='text-sm text-neutral-mid'>
          請上傳您有的最新登記文件，供事務所核對公司（行號）資料。檔案格式 PDF 或圖片，{MAX_SIZE_MB}MB 以內。
          其中「最新設立或變更登記事項表」上傳後會自動辨識，公司資料與董監事名單會帶入後面的頁面。
        </p>
      </StepPageHeader>
      <SectionCard>
        <div className='flex flex-col divide-y divide-neutral-blue-gray/30'>
          {ALL_REGISTRATION_DOCS.map(doc => (
            <DocRow
              key={doc.code}
              title={doc.title}
              fileName={state.registrationFiles[doc.code]}
              recognizing={doc.identifiable && recognizing}
              onPick={file => {
                dispatch({ type: 'SET_REGISTRATION_FILE', payload: { docType: doc.code, fileName: file.name } });
                if (doc.identifiable) identify.run(file);
              }}
              onClear={() => {
                dispatch({ type: 'SET_REGISTRATION_FILE', payload: { docType: doc.code, fileName: null } });
                // 連同辨識結果一併丟棄，卡片才不會留著一份沒有來源的資料；已帶到後面頁面的值不回收
                if (doc.identifiable) dispatch({ type: 'CLEAR_REPORT', payload: { reportId: COMPANY_REGISTRATION_KEY } });
              }}
              extra={
                doc.identifiable && (
                  <>
                    {identify.message && (
                      <p className={`flex items-start gap-1.5 text-xs ${identify.status === 'error' ? 'text-semantic-error' : 'text-semantic-warm-dark'}`}>
                        <TriangleAlert size={14} className='mt-0.5 shrink-0' />
                        <span>{identify.message}</span>
                      </p>
                    )}
                    {showSummary && <RegistrationSummaryCard />}
                  </>
                )
              }
            />
          ))}
        </div>
      </SectionCard>
    </>
  );
}

interface DocRowProps {
  title: string;
  fileName?: string;
  /** 辨識中：檔名位置改顯示進度，按鈕暫時停用 */
  recognizing?: boolean;
  onPick: (file: File) => void;
  onClear: () => void;
  /** 接在這一列下方的內容（如登記事項表的辨識摘要卡） */
  extra?: ReactNode;
}

function DocRow({ title, fileName, recognizing, onPick, onClear, extra }: DocRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className='flex flex-col gap-3 py-4 first:pt-0 last:pb-0'>
      <div className='flex flex-col gap-2 nav:flex-row nav:items-center nav:justify-between'>
        <div className='flex min-w-0 items-center gap-3'>
          {recognizing ? (
            <Loader2 size={20} className='shrink-0 animate-spin text-brand-blue' />
          ) : fileName ? (
            <CircleCheck size={20} className='shrink-0 text-semantic-success' />
          ) : (
            <FileText size={20} className='shrink-0 text-neutral-mid' />
          )}
          <div className='flex min-w-0 flex-col'>
            <span className='text-sm font-medium text-neutral-dark'>{title}</span>
            <span className='truncate text-xs text-neutral-mid'>{recognizing ? `辨識中…${fileName ?? ''}` : fileName ?? '尚未上傳'}</span>
          </div>
        </div>
        <div className='flex shrink-0 gap-2'>
          {fileName && (
            <Button variant='ghost' size='sm' icon={X} disabled={recognizing} onClick={onClear} className='min-h-11 nav:min-h-0'>
              移除
            </Button>
          )}
          <Button variant='outline' size='sm' icon={Upload} disabled={recognizing} onClick={() => inputRef.current?.click()} className='min-h-11 nav:min-h-0'>
            {fileName ? '更換檔案' : '選擇檔案'}
          </Button>
        </div>
        <input
          ref={inputRef}
          type='file'
          accept='.pdf,image/*'
          className='hidden'
          disabled={recognizing}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file && file.size <= MAX_SIZE_MB * 1024 * 1024) onPick(file);
            e.target.value = '';
          }}
        />
      </div>
      {extra}
    </div>
  );
}
