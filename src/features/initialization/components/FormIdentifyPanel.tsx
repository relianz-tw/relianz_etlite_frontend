'use client';

import { useInitialization } from '../state/InitializationContext';
import { FORM_LIST, formatPeriodLabel, getCurrentOpenYear, getVatReportKey, resolveToday } from '../reports';
import { identifyCit, pickIdentifiedValue, type IdentifiedField, type IdentifiedForm } from '@/api/peit';
import Button from '@/components/ui/Button';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { Loader2, TriangleAlert, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

type PanelStatus = 'idle' | 'recognizing' | 'done' | 'error';

interface FormIdentifyPanelProps {
  /** 目前頁面的文件名稱，僅用於提示文案 */
  formTitle: string;
  /** 該頁必填（如必須上傳的 401 期別）時，文案不再寫「選填」 */
  required?: boolean;
}

function toValueMap(fields: IdentifiedField[]): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  for (const field of fields) {
    const value = pickIdentifiedValue(field);
    if (value !== undefined) result[field.fieldCode] = value;
  }
  return result;
}

/**
 * 逐頁表單上方的「上傳辨識」區（選填）：上傳一份 PDF 後呼叫 cit/identify，
 * 回傳中所有 present 的表都會一併套用（含其他頁），使用者也可略過直接手動輸入。
 */
export function FormIdentifyPanel({ formTitle, required = false }: FormIdentifyPanelProps) {
  const { state, dispatch } = useInitialization();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<PanelStatus>('idle');
  const [message, setMessage] = useState('');
  const [fileName, setFileName] = useState('');

  /**
   * 套用一張辨識結果。營所稅各表以 formCode 為 key；401／403 要依「民國年＋期別起始月」對到這次需要的期別頁，
   * 並把該期的申報書選擇切到辨識到的那一種；對不到（不在需上傳範圍）就略過。回傳是否有套用，以及略過時給使用者看的原因。
   */
  const applyForm = (form: IdentifiedForm): { applied: boolean; skipped?: string } => {
    const values = toValueMap(form.fields);
    const rows = form.rows.map(row => toValueMap(row.fields));

    if (form.formCode === 'VAT_401' || form.formCode === 'VAT_403') {
      const code = form.formCode === 'VAT_401' ? '401' : '403';
      const page = state.reportPages.find(p => p.period?.rocYear === form.taxYear && p.period.phase === form.periodStartMonth);
      if (!page) {
        const label = form.periodStartMonth ? formatPeriodLabel(form.taxYear, form.periodStartMonth) : `民國 ${form.taxYear} 年（無法判斷期別）`;
        return { applied: false, skipped: `辨識到 ${label} 的 ${code}，不在這次需要的期別內，未帶入` };
      }
      dispatch({ type: 'SET_VAT_CHOICE', payload: { pageKey: page.key, formCode: form.formCode } });
      dispatch({ type: 'APPLY_IDENTIFIED_FORM', payload: { reportId: getVatReportKey(form.formCode, page.period!), fields: values, rows } });
      return { applied: true };
    }

    dispatch({ type: 'APPLY_IDENTIFIED_FORM', payload: { reportId: form.formCode, taxYear: form.taxYear, fields: values, rows } });
    return { applied: true };
  };

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error(`「${file.name}」不是 PDF 檔案`);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error(`「${file.name}」超過 ${MAX_SIZE_MB}MB 上限`);
      return;
    }

    setFileName(file.name);
    setStatus('recognizing');
    setMessage('');
    try {
      // 辨識需帶開帳民國年（未選時退回依日期推算的當期年度）
      const openingYear = state.openYear ?? getCurrentOpenYear(resolveToday(state.simulatedDate));
      const result = await identifyCit(file, openingYear);
      const knownCodes = new Set<string>(FORM_LIST.map(f => f.formCode));
      const presentForms = result.forms.filter(f => f.present && !f.errorCode && knownCodes.has(f.formCode));
      const failedForms = result.forms.filter(f => f.errorCode && knownCodes.has(f.formCode));

      const outcomes = presentForms.map(applyForm);
      const appliedCount = outcomes.filter(o => o.applied).length;
      const notes = [
        ...outcomes.flatMap(o => (o.skipped ? [o.skipped] : [])),
        ...(failedForms.length > 0 ? [`${failedForms.length} 份文件辨識失敗，請手動輸入`] : []),
      ];

      if (appliedCount === 0) {
        setStatus('error');
        setMessage(notes.length > 0 ? notes.join('；') : '未在檔案中辨識到可用的文件，請確認檔案內容或改用手動輸入');
        return;
      }
      setStatus('done');
      // 成功不另顯示文字；只有部分略過或失敗時才提醒使用者
      setMessage(notes.join('；'));
      toast.success('辨識完畢');
    } catch (err) {
      setStatus('error');
      setMessage(getFriendlyErrorMessage(err, '辨識失敗，請重試或改用手動輸入'));
    }
  };

  const recognizing = status === 'recognizing';

  return (
    <div className='flex flex-col gap-2 border-t border-neutral-blue-gray/30 pt-5'>
      <div
        onDragOver={e => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file && !recognizing) handleFile(file);
        }}
        className={`flex flex-col gap-3 rounded-lg border-[1.5px] border-dashed px-4 py-3 transition-colors md:flex-row md:items-center md:justify-between ${
          dragging ? 'border-brand-blue bg-brand-blue/5' : 'border-neutral-blue-gray bg-surface-off-white'
        }`}
      >
        <div className='flex min-w-0 items-start gap-3'>
          {recognizing ? (
            <Loader2 size={22} className='mt-0.5 shrink-0 animate-spin text-brand-blue' />
          ) : (
            <Upload size={22} strokeWidth={1.75} className='mt-0.5 shrink-0 text-brand-blue' />
          )}
          <div className='flex min-w-0 flex-col'>
            <span className='text-sm font-medium text-neutral-dark'>{recognizing ? `辨識中…${fileName}` : `上傳「${formTitle}」快速帶入${required ? '' : '（選填）'}`}</span>
            <span className='text-xs text-neutral-mid'>
              {required ? '上傳文件或在下方手動輸入皆可' : '不上傳也可以直接在下方手動輸入'}，PDF {MAX_SIZE_MB}MB 以內
            </span>
          </div>
        </div>
        <Button variant='outline' size='sm' disabled={recognizing} onClick={() => inputRef.current?.click()} className='shrink-0'>
          選擇檔案
        </Button>
      </div>
      <input
        ref={inputRef}
        type='file'
        accept='.pdf'
        className='hidden'
        disabled={recognizing}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      {(status === 'error' || (status === 'done' && message)) && (
        <p className='flex items-start gap-1.5 text-xs text-semantic-error'>
          <TriangleAlert size={14} className='mt-0.5 shrink-0' />
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}
