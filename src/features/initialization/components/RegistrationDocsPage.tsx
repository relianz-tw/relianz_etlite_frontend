'use client';

import { useRef } from 'react';
import { useInitialization } from '../state/InitializationContext';
import { getRegistrationDocs } from '../reports/registrationDocs';
import { StepPageHeader } from '@/components/initialization/StepPageHeader';
import type { StepNavProps } from '@/components/initialization/StepPageHeader';
import { StepProgress, type StepProgressValue } from '@/components/initialization/StepProgress';
import Button from '@/components/ui/Button';
import SectionCard from '@/components/ui/SectionCard';
import { CircleCheck, FileText, Upload, X } from 'lucide-react';

const MAX_SIZE_MB = 10;

/** 登記文件上傳頁：依組織型態列出文件，每項可上傳 PDF 或圖片。TODO：後端上傳 API 上線後改為實際上傳，目前只記錄檔名 */
export function RegistrationDocsPage({ kicker, nav, progress }: { kicker: string; nav: StepNavProps; progress: StepProgressValue }) {
  const { state, dispatch } = useInitialization();
  const docs = getRegistrationDocs(state.orgType);

  return (
    <>
      <StepPageHeader kicker={kicker} title='登記資料' badges={['給客戶上傳']} nav={nav}>
        <p className='text-sm text-neutral-mid'>請上傳最新的登記文件，供事務所核對公司（行號）資料。檔案格式 PDF 或圖片，{MAX_SIZE_MB}MB 以內。</p>
        <StepProgress {...progress} />
      </StepPageHeader>
      <SectionCard>
        <div className='flex flex-col divide-y divide-neutral-blue-gray/30'>
          {docs.map(doc => (
            <DocRow
              key={doc.code}
              title={doc.title}
              fileName={state.registrationFiles[doc.code]}
              onPick={file => dispatch({ type: 'SET_REGISTRATION_FILE', payload: { docType: doc.code, fileName: file.name } })}
              onClear={() => dispatch({ type: 'SET_REGISTRATION_FILE', payload: { docType: doc.code, fileName: null } })}
            />
          ))}
        </div>
      </SectionCard>
    </>
  );
}

function DocRow({ title, fileName, onPick, onClear }: { title: string; fileName?: string; onPick: (file: File) => void; onClear: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className='flex flex-col gap-2 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between'>
      <div className='flex min-w-0 items-center gap-3'>
        {fileName ? <CircleCheck size={20} className='shrink-0 text-semantic-success' /> : <FileText size={20} className='shrink-0 text-neutral-mid' />}
        <div className='flex min-w-0 flex-col'>
          <span className='text-sm font-medium text-neutral-dark'>{title}</span>
          <span className='truncate text-xs text-neutral-mid'>{fileName ?? '尚未上傳'}</span>
        </div>
      </div>
      <div className='flex shrink-0 gap-2'>
        {fileName && (
          <Button variant='ghost' size='sm' icon={X} onClick={onClear}>
            移除
          </Button>
        )}
        <Button variant='outline' size='sm' icon={Upload} onClick={() => inputRef.current?.click()}>
          {fileName ? '更換檔案' : '選擇檔案'}
        </Button>
      </div>
      <input
        ref={inputRef}
        type='file'
        accept='.pdf,image/*'
        className='hidden'
        onChange={e => {
          const file = e.target.files?.[0];
          if (file && file.size <= MAX_SIZE_MB * 1024 * 1024) onPick(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
