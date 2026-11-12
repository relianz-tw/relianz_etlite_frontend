'use client';

import { useInitialization } from '../state/InitializationContext';
import { FORM_LIST, formatPeriodLabel, getCurrentOpenYear, getVatReportKey, resolveToday } from '../reports';
import { identifyCit, pickIdentifiedValue, type IdentifiedField, type IdentifiedForm, type IdentifiedRow } from '@/api/peit';
import Button from '@/components/ui/Button';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { toJpegFile } from '@/lib/imageToJpeg';
import { CircleCheck, Loader2, TriangleAlert, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// empty：辨識成功但文件上沒抓到任何可用資訊，只提醒不阻擋，使用者仍可手動輸入
type PanelStatus = 'idle' | 'recognizing' | 'done' | 'error' | 'empty';

interface FormIdentifyPanelProps {
  /** 該頁必填（如必須上傳的 401 期別）時，文案不再寫「選填」 */
  required?: boolean;
  /** 是否為 401／403 期別頁，用於切換說明文案 */
  vatPeriod?: boolean;
  /** 目前頁面的 key；401／403 上傳的檔案一律掛在這一頁供預覽 */
  pageKey?: string;
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'heic', 'heif'];

function getExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

/**
 * 辨識回傳的可重複列轉成畫面的列。財產目錄的列有明細（rowKind 省略）與小計（rowKind=SUBTOTAL），可能另有類別標題列（ROW_LINE_TYPE=category，後端不保證有）；
 * 類別編號取列自己的 ROW_CATEGORY_CODE、groupKey，都沒有就沿用上一列。畫面每一列自己帶類別編號、名稱，類別列本身不當成一列明細。
 */
function toRowValues(rows: IdentifiedRow[]): Record<string, string | number>[] {
  const maps = rows.map(row => ({ row, values: toValueMap(row.fields) }));
  // 類別名稱：同一個類別編號的任一列（類別列或小計列）有帶就沿用到整組
  const names = new Map<string, string | number>();
  for (const { row, values } of maps) {
    const code = values.ROW_CATEGORY_CODE ?? row.groupKey ?? undefined;
    if (code !== undefined && values.ROW_CATEGORY_NAME !== undefined) names.set(String(code), values.ROW_CATEGORY_NAME);
  }
  const result: Record<string, string | number>[] = [];
  let code: string | number | undefined;
  for (const { row, values } of maps) {
    const lineType = values.ROW_LINE_TYPE;
    // 類別編號：列自己帶的 > groupKey > 沿用上一列（後端不保證有獨立類別列）
    code = values.ROW_CATEGORY_CODE ?? row.groupKey ?? code;
    // 類別列只用來更新目前類別，不當成一列明細
    if (lineType === 'category') continue;
    delete values.ROW_LINE_TYPE;
    if (code !== undefined) {
      values.ROW_CATEGORY_CODE = code;
      const name = names.get(String(code));
      if (name !== undefined) values.ROW_CATEGORY_NAME = name;
    }
    // 小計列帶 __kind 標記，畫面才知道它是哪一組的小計格
    result.push(row.rowKind === 'SUBTOTAL' || lineType === 'subtotal' ? { ...values, __kind: 'SUBTOTAL' } : values);
  }
  return result;
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
 * 逐頁表單的「上傳辨識」區（選填），放在固定底部操作列左側：上傳一份 PDF 或圖片（JPG／PNG／HEIC，PNG、HEIC 先轉成 JPG）後呼叫 cit/identify，
 * 回傳中所有 present 的表都會一併套用（含其他頁），使用者也可略過直接手動輸入。
 */
export function FormIdentifyPanel({ required = false, vatPeriod = false, pageKey }: FormIdentifyPanelProps) {
  const { state, dispatch, setVatUpload } = useInitialization();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<PanelStatus>('idle');
  const [message, setMessage] = useState('');
  const [fileName, setFileName] = useState('');
  // 這次辨識實際帶入的文件名稱，成功後列給使用者看
  const [appliedLabels, setAppliedLabels] = useState<string[]>([]);

  /**
   * 套用一張辨識結果。營所稅各表以 formCode 為 key；401／403 要依「民國年＋期別起始月」對到這次需要的期別頁，
   * 並把該期的申報書選擇切到辨識到的那一種；對不到（不在需上傳範圍）就略過。回傳是否有套用，以及略過時給使用者看的原因。
   * file 為實際送出辨識的檔案（圖片已轉 JPG），401／403 套用成功時一併記到該期別頁供預覽。
   */
  const applyForm = (form: IdentifiedForm, file: File): { applied: boolean; label?: string; skipped?: string; vatPageIndex?: number } => {
    const values = toValueMap(form.fields);
    const rows = toRowValues(form.rows);

    if (form.formCode === 'VAT_401' || form.formCode === 'VAT_403') {
      const code = form.formCode === 'VAT_401' ? '401' : '403';
      const page = state.reportPages.find(p => p.period?.rocYear === form.taxYear && p.period.phase === form.periodStartMonth);
      if (!page) {
        const label = form.periodStartMonth ? formatPeriodLabel(form.taxYear, form.periodStartMonth) : `民國 ${form.taxYear} 年（無法判斷期別）`;
        return { applied: false, skipped: `辨識到 ${label} 的 ${code}，不在這次需要的期別內，未帶入` };
      }
      dispatch({ type: 'SET_VAT_CHOICE', payload: { pageKey: page.key, formCode: form.formCode } });
      dispatch({ type: 'APPLY_IDENTIFIED_FORM', payload: { reportId: getVatReportKey(form.formCode, page.period!), fields: values, rows } });
      // 辨識到的是別期時，該期頁面也留一份供預覽
      setVatUpload(page.key, file);
      return { applied: true, label: `${code}・${formatPeriodLabel(form.taxYear, form.periodStartMonth!)}`, vatPageIndex: state.reportPages.indexOf(page) };
    }

    dispatch({ type: 'APPLY_IDENTIFIED_FORM', payload: { reportId: form.formCode, taxYear: form.taxYear, fields: values, rows } });
    return { applied: true, label: FORM_LIST.find(f => f.formCode === form.formCode)?.title ?? form.formName };
  };

  const handleFile = async (originalFile: File) => {
    const isPdf = originalFile.type === 'application/pdf';
    // HEIC 常拿到空的 file.type，圖片一律以副檔名判斷
    const isImage = IMAGE_EXTENSIONS.includes(getExtension(originalFile.name));
    if (!isPdf && !isImage) {
      toast.error(`「${originalFile.name}」格式不支援，請上傳 PDF、JPG、PNG 或 HEIC`);
      return;
    }

    setFileName(originalFile.name);
    setStatus('recognizing');
    setMessage('');
    setAppliedLabels([]);
    try {
      // PNG、HEIC 先轉成 JPG 再送；大小上限檢查轉檔後實際上傳的檔案
      const file = isImage ? await toJpegFile(originalFile) : originalFile;
      if (file.size > MAX_SIZE_BYTES) {
        setStatus('idle');
        toast.error(`「${originalFile.name}」超過 ${MAX_SIZE_MB}MB 上限`);
        return;
      }

      // 不論辨識結果如何，檔案都掛在使用者上傳的這一頁，讓使用者自己確認（防辨識失誤），之後也要存後端
      // TODO：後端存檔 API 上線後，在這裡把 file 上傳保存
      if (vatPeriod && pageKey) setVatUpload(pageKey, file);

      // 辨識需帶開帳民國年（未選時退回依日期推算的當期年度）
      const openingYear = state.openYear ?? getCurrentOpenYear(resolveToday(state.simulatedDate));
      const result = await identifyCit(file, openingYear);
      const knownCodes = new Set<string>(FORM_LIST.map(f => f.formCode));
      const presentForms = result.forms.filter(f => f.present && !f.errorCode && knownCodes.has(f.formCode));
      const failedForms = result.forms.filter(f => f.errorCode && knownCodes.has(f.formCode));

      const outcomes = presentForms.map(form => applyForm(form, file));
      const appliedCount = outcomes.filter(o => o.applied).length;
      // 401／403 實際帶入的是別一期時，跳到那一期，申報書種類（401／403）與帶入的資料才會顯示出來
      const targetIndex = outcomes.find(o => o.vatPageIndex !== undefined && o.vatPageIndex >= 0)?.vatPageIndex;
      if (targetIndex !== undefined && targetIndex !== state.currentReportIndex) dispatch({ type: 'GO_TO_STEP', payload: { step: 4, reportIndex: targetIndex } });
      const notes = [
        ...outcomes.flatMap(o => (o.skipped ? [o.skipped] : [])),
        ...(failedForms.length > 0 ? [`${failedForms.length} 份文件辨識失敗，請手動輸入`] : []),
      ];

      if (appliedCount === 0) {
        // 有略過／失敗原因就照實顯示；完全沒抓到東西則用提醒樣式（非錯誤）
        setStatus(notes.length > 0 ? 'error' : 'empty');
        setMessage(notes.join('；'));
        return;
      }
      setStatus('done');
      // 列出帶入了哪些文件；有部分略過或失敗時另以紅字提醒
      setAppliedLabels(outcomes.flatMap(o => (o.label ? [o.label] : [])));
      setMessage(notes.join('；'));
      toast.success(`辨識完畢，已帶入 ${appliedCount} 份文件`);
    } catch (err) {
      setStatus('error');
      setMessage(getFriendlyErrorMessage(err, '辨識失敗，請重試或改用手動輸入'));
    }
  };

  const recognizing = status === 'recognizing';

  return (
    <div className='flex min-w-0 flex-col gap-1'>
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
        className={`flex items-center gap-3 rounded-lg border-[1.5px] border-dashed px-3 py-2 transition-colors ${
          dragging ? 'border-brand-blue bg-brand-blue/5' : 'border-neutral-blue-gray bg-surface-off-white'
        }`}
      >
        {recognizing ? (
          <Loader2 size={20} className='shrink-0 animate-spin text-brand-blue' />
        ) : (
          <Upload size={20} strokeWidth={1.75} className='shrink-0 text-brand-blue' />
        )}
        <div className='flex min-w-0 flex-1 flex-col'>
          <span className='truncate text-sm font-medium text-neutral-dark'>
            {recognizing ? `辨識中…${fileName}` : vatPeriod ? `上傳申報書檔案${required ? '' : '（選填）'}` : `上傳申報書快速帶入${required ? '' : '（選填）'}`}
          </span>
          {/* 營業稅申報書的檔案會留存於系統，說明手機也要看得到；其餘文件的格式提示只在桌機顯示 */}
          <span className={`text-xs text-neutral-mid ${vatPeriod ? '' : 'hidden md:block'}`}>
            {vatPeriod ? `上傳後會記錄在系統中・PDF、JPG、PNG、HEIC，${MAX_SIZE_MB}MB 以內` : `PDF、JPG、PNG、HEIC，${MAX_SIZE_MB}MB 以內`}
          </span>
        </div>
        <Button variant='outline' size='sm' disabled={recognizing} onClick={() => inputRef.current?.click()} className='shrink-0'>
          {vatPeriod ? '上傳檔案' : '選擇檔案'}
        </Button>
      </div>
      <input
        ref={inputRef}
        type='file'
        accept='.pdf,.jpg,.jpeg,.png,.heic,.heif'
        className='hidden'
        disabled={recognizing}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      {status === 'empty' && (
        <p className='flex items-start gap-1.5 text-xs text-semantic-warm-dark'>
          <TriangleAlert size={14} className='mt-0.5 shrink-0' />
          <span>未辨識到文件資訊，請確認檔案內容，或直接手動輸入</span>
        </p>
      )}
      {status === 'done' && appliedLabels.length > 0 && (
        <p className='flex items-start gap-1.5 text-xs text-semantic-success'>
          <CircleCheck size={14} className='mt-0.5 shrink-0' />
          <span>已帶入：{appliedLabels.join('、')}</span>
        </p>
      )}
      {(status === 'error' || (status === 'done' && message)) && (
        <p className='flex items-start gap-1.5 text-xs text-semantic-error'>
          <TriangleAlert size={14} className='mt-0.5 shrink-0' />
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}
