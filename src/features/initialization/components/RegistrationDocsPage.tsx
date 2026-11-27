'use client';

import { useRef, type ReactNode } from 'react';
import { useInitialization } from '../state/InitializationContext';
import { useRegistrationIdentify } from '../hooks/useRegistrationIdentify';
import { PARTNERSHIP_AGREEMENT_CODE, classifyEntity, inferOrgType, registrationDocsFor } from '../reports/registrationDocs';
import { COMPANY_REGISTRATION_KEY, IDENTIFY_MAX_SIZE_MB, ORG_TYPE_LABEL, hasRegistrationData } from '../reports';
import { RegistrationMismatchDialog } from './RegistrationMismatchDialog';
import { RegistrationSummaryCard } from './RegistrationSummaryCard';
import { StepPageHeader } from '@/components/initialization/StepPageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import SectionCard from '@/components/ui/SectionCard';
import { CircleCheck, FileText, Loader2, Trash2, TriangleAlert, Upload } from 'lucide-react';

/** 與辨識 API 的上限一致（IDENTIFY_MAX_SIZE_MB），登記事項表才不會傳得進來卻辨識不了 */
const MAX_SIZE_MB = IDENTIFY_MAX_SIZE_MB;

const KIND_LABEL = { company: '公司', business: '商號' } as const;

/** 登記文件上傳頁（付款資料的下一步）：每項可上傳 PDF 或圖片。TODO：後端上傳 API 上線後改為實際上傳，目前只記錄檔名 */
export function RegistrationDocsPage() {
  const { state, dispatch } = useInitialization();
  const identify = useRegistrationIdentify();
  const nav = { onPrev: () => dispatch({ type: 'PREV_STEP' }), onNext: () => dispatch({ type: 'NEXT_STEP' }), nextLabel: '下一頁' };
  const recognizing = identify.status === 'recognizing';

  // 公司或商號由付款資料的公司名稱判斷；判斷不出來就列全部
  const kind = classifyEntity(state.payment.companyName);
  // 股東名簿只有股份有限公司要，判準與 inferOrgType 一樣看公司名稱
  const docs = registrationDocsFor(kind, state.registrationFiles, state.payment.companyName.includes('股份有限公司'));
  const showSummary = !!state.registrationFiles.REGISTRATION_ITEMS && hasRegistrationData(state.reports);

  // 還判斷不出公司或商號時列的是兩類文件的聯集，標必填會誤導（公司不需要商業抄本），所以只有判定出來才標
  const showMarks = !!kind;
  const requiredDocs = docs.filter(doc => !doc.optional);
  const requiredReady = requiredDocs.filter(doc => state.registrationFiles[doc.code]).length;
  const optionalPending = docs.filter(doc => doc.optional && !state.registrationFiles[doc.code]).length;
  // 必填與選填分開數，與步驟 4 的文件備齊清單同一套講法
  const countText =
    requiredReady === requiredDocs.length && optionalPending === 0
      ? '文件已全部備齊'
      : optionalPending > 0
        ? `必填 ${requiredReady} / ${requiredDocs.length} 份已上傳・另有 ${optionalPending} 份選填未傳`
        : `必填 ${requiredReady} / ${requiredDocs.length} 份已上傳`;

  /** 合夥契約有沒有上傳會改變商號的組織型態預選（公司名稱判得出公司時，推論結果與它無關） */
  const inferFromFiles = (hasPartnershipAgreement: boolean) =>
    dispatch({ type: 'INFER_ORG_TYPE', payload: inferOrgType(state.payment.companyName, hasPartnershipAgreement) });

  return (
    <>
      <StepPageHeader kicker='登記資料' title='上傳登記文件' badges={['客戶提供']} nav={nav}>
        <p className='text-sm text-neutral-mid'>
          請上傳您有的最新登記文件，供事務所核對公司（行號）資料。檔案格式 PDF 或圖片，{MAX_SIZE_MB}MB 以內。
          其中「最新設立或變更登記事項表」上傳後會自動辨識，公司資料與董監事名單會帶入後面的頁面。
        </p>
        {/* 依公司名稱判定公司或商號，決定下面列哪幾份文件；判定結果與修正入口收在同一塊，見 DESIGN.md「情境摘要區塊」 */}
        {kind && (
          <div className='flex flex-col gap-3 rounded-md bg-surface-cream p-3'>
            <p className='text-[13px] text-neutral-mid'>
              依公司名稱<span className='font-bold text-neutral-dark'>「{state.payment.companyName}」</span>
              列出<span className='font-bold text-neutral-dark'>{KIND_LABEL[kind]}</span>需要的文件。名稱有誤請回上一頁修改。
            </p>
            {/* 獨資與合夥從名稱分不出來，唯一的判準是最下面那份合夥契約 */}
            {kind === 'business' && (
              <p className='text-[13px] text-neutral-mid'>
                目前視為<span className='font-bold text-neutral-dark'>{ORG_TYPE_LABEL[state.orgType === 'partnership' ? 'partnership' : 'sole']}</span>
                。合夥請上傳最下方的「最新合夥契約」，上傳後會改為合夥商號。
              </p>
            )}
          </div>
        )}
        {showMarks && <p className='text-[13px] font-medium text-neutral-dark'>{countText}</p>}
      </StepPageHeader>
      <SectionCard>
        <div className='flex flex-col divide-y divide-neutral-blue-gray/30'>
          {docs.map(doc => (
            <DocRow
              key={doc.code}
              title={doc.title}
              hint={doc.hint ?? (showMarks && doc.optional ? '沒有這份文件可以不傳。' : undefined)}
              required={showMarks ? !doc.optional : undefined}
              fileName={state.registrationFiles[doc.code]}
              recognizing={doc.identifiable && recognizing}
              onPick={file => {
                dispatch({ type: 'SET_REGISTRATION_FILE', payload: { docType: doc.code, fileName: file.name } });
                if (doc.identifiable) identify.run(file);
                if (doc.code === PARTNERSHIP_AGREEMENT_CODE) inferFromFiles(true);
              }}
              onClear={() => {
                dispatch({ type: 'SET_REGISTRATION_FILE', payload: { docType: doc.code, fileName: null } });
                // 連同辨識結果一併丟棄，卡片才不會留著一份沒有來源的資料；已帶到後面頁面的值不回收
                if (doc.identifiable) dispatch({ type: 'CLEAR_REPORT', payload: { reportId: COMPANY_REGISTRATION_KEY } });
                if (doc.code === PARTNERSHIP_AGREEMENT_CODE) inferFromFiles(false);
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

      <RegistrationMismatchDialog mismatch={identify.mismatch} onResolve={identify.resolveMismatch} />
    </>
  );
}

interface DocRowProps {
  title: string;
  /** 標題下方的補充說明（如合夥契約只有合夥才要傳） */
  hint?: string;
  /** 必填／選填徽章；還判斷不出公司或商號時不給，不顯示徽章 */
  required?: boolean;
  fileName?: string;
  /** 辨識中：檔名位置改顯示進度，按鈕暫時停用 */
  recognizing?: boolean;
  onPick: (file: File) => void;
  onClear: () => void;
  /** 接在這一列下方的內容（如登記事項表的辨識摘要卡） */
  extra?: ReactNode;
}

function DocRow({ title, hint, required, fileName, recognizing, onPick, onClear, extra }: DocRowProps) {
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
            {/* 必填／選填徽章與期別卡片同一套（Badge tone info／neutral） */}
            <span className='flex flex-wrap items-center gap-2'>
              <span className='text-sm font-medium text-neutral-dark'>{title}</span>
              {required !== undefined && <Badge tone={required ? 'info' : 'neutral'}>{required ? '必填' : '選填'}</Badge>}
            </span>
            {hint && <span className='text-xs text-neutral-mid'>{hint}</span>}
            <span className={`truncate text-xs ${fileName ? 'text-neutral-dark' : 'text-neutral-mid'}`}>
              {recognizing ? `辨識中…${fileName ?? ''}` : fileName ?? '尚未上傳'}
            </span>
          </div>
        </div>
        <div className='flex shrink-0 gap-2'>
          {fileName && (
            <Button variant='ghost' size='sm' icon={Trash2} disabled={recognizing} onClick={onClear} className='min-h-11 nav:min-h-0'>
              刪除
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
