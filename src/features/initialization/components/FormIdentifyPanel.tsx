'use client';

import { useReference } from '../reference/ReferenceContext';
import { useInitialization } from '../state/InitializationContext';
import { FORM_LIST, buildRequiredDocs, formatPeriodLabel, getCurrentOpenYear, getVatReportKey, resolveToday } from '../reports';
import { hasValue, sameValue, toLocations, toRowValues, toValueMap } from '../reports/identifiedValues';
import { identifiedImageUrl, identifyCit, type IdentifiedForm } from '@/api/peit';
import Button from '@/components/ui/Button';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { toJpegFile } from '@/lib/imageToJpeg';
import { Loader2, Plus, TriangleAlert, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ImportOverwriteDialog } from './ImportOverwriteDialog';
import { toast } from 'sonner';

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/** 辨識只有一個轉圈時使用者會以為當掉（實測單張約 20 秒、整份營所稅 PDF 約 40 秒），給個預期 */
const IDENTIFY_WAIT_NOTE = '約需 20–60 秒，請先別關閉頁面';

// empty：辨識成功但文件上沒抓到任何可用資訊，只提醒不阻擋，使用者仍可手動輸入
type PanelStatus = 'idle' | 'recognizing' | 'done' | 'error' | 'empty';

interface FormIdentifyPanelProps {
  /** 該頁必填（如必須上傳的 401 期別）時，文案不再寫「選填」 */
  required?: boolean;
  /** 是否為 401／403 期別頁，用於切換說明文案 */
  vatPeriod?: boolean;
  /** 目前頁面的 key；401／403 上傳的檔案一律掛在這一頁供預覽 */
  pageKey?: string;
  /** 還沒有檔案時畫整行虛線上傳框；已經有檔案時只畫一顆「新增檔案」按鈕（檔案本身由 SourceUploadSection 呈現） */
  variant?: 'dropzone' | 'button';
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'heic', 'heif'];

function getExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

/** 401／403 的原件另外存在各期別頁（vatUploads），欄位位置的 sourceId 用這個固定值，對照面板會改用該期自己的檔案 */
const VAT_SOURCE_ID = 'vat-upload';

/**
 * 逐頁表單的「上傳辨識」入口（選填），由 SourceUploadSection 擺在頁首卡片下方：上傳一份 PDF 或圖片（JPG／PNG／HEIC，PNG、HEIC 先轉成 JPG）後呼叫 cit/identify，
 * 回傳中所有 present 的表都會一併套用（含其他頁），使用者也可略過直接手動輸入。
 */
export function FormIdentifyPanel({ required = false, vatPeriod = false, pageKey, variant = 'dropzone' }: FormIdentifyPanelProps) {
  const { state, dispatch, setVatUpload, vatUploads, pendingVatForms, setPendingVatForm, clearPendingVatForm } = useInitialization();
  const { addSourceFile, sourceFiles } = useReference();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<PanelStatus>('idle');
  const [message, setMessage] = useState('');
  const [fileName, setFileName] = useState('');
  // 辨識結果會蓋到已有資料時，等使用者逐份勾選要匯入哪些；resolve 回傳勾選的文件 key，null 代表取消
  const [importAsk, setImportAsk] = useState<{ keys: string[]; resolve: (keys: string[] | null) => void } | null>(null);
  const askImport = (keys: string[]) => new Promise<string[] | null>(resolve => setImportAsk({ keys, resolve }));
  const answerImport = (keys: string[] | null) => {
    importAsk?.resolve(keys);
    setImportAsk(null);
  };

  /** 這張辨識結果對應的資料 key：營所稅是 formCode，401／403 要對到需要的期別頁；對不到回 null */
  const findVatPage = (form: IdentifiedForm) => state.reportPages.find(p => p.period?.rocYear === form.taxYear && p.period.phase === form.periodStartMonth);
  const reportIdOf = (form: IdentifiedForm): string | null => {
    if (form.formCode !== 'VAT_401' && form.formCode !== 'VAT_403') return form.formCode;
    const page = findVatPage(form);
    return page ? getVatReportKey(form.formCode, page.period!) : null;
  };

  /** 辨識結果對應到文件清單的哪一份：營所稅就是 formCode，401／403 要對到這次需要的期別頁；對不到回 null */
  const docKeyOf = (form: IdentifiedForm): string | null => {
    if (form.formCode !== 'VAT_401' && form.formCode !== 'VAT_403') return form.formCode;
    return findVatPage(form)?.key ?? null;
  };

  /** 這次辨識會不會蓋掉「已有資料、且值不同」的欄位（現有為空白或值相同的不算）；表格列整批取代，現有列有資料且不同也算 */
  const willOverwrite = (forms: IdentifiedForm[]): boolean =>
    forms.some(form => {
      const reportId = reportIdOf(form);
      if (!reportId) return false;
      const current = state.reports[reportId];
      const values = toValueMap(form.fields);
      const fieldConflict = form.fields.some(f => {
        const next = values[f.fieldCode];
        const existing = current?.fields[f.fieldCode]?.value;
        return next !== undefined && hasValue(existing) && !sameValue(existing, next);
      });
      if (fieldConflict) return true;
      const newRows = toRowValues(form.rows);
      const oldRows = current?.rows ?? [];
      const oldRowsHaveData = oldRows.some(row => Object.values(row).some(field => hasValue(field.value)));
      const rowsDiffer = oldRows.length !== newRows.length || newRows.some((row, i) => Object.entries(row).some(([key, value]) => key !== '__kind' && !sameValue(oldRows[i]?.[key]?.value ?? '', value)));
      return newRows.length > 0 && oldRowsHaveData && rowsDiffer;
    });

  /**
   * 套用一張辨識結果。營所稅各表以 formCode 為 key；401／403 要依「民國年＋期別起始月」對到這次需要的期別頁，
   * 並把該期的申報書選擇切到辨識到的那一種；對不到（不在需上傳範圍）就略過，對到的不是目前這一頁則先暫存。
   * 回傳是否有套用，以及略過時給使用者看的原因。
   * file 為實際送出辨識的檔案（圖片已轉 JPG），401／403 套用成功時一併記到該期別頁供預覽。
   * 要不要蓋掉現有資料在上一層（匯入覆蓋確認視窗）就決定了，走到這裡的都是使用者要匯入的文件，整份以辨識結果為準。
   */
  const applyForm = (form: IdentifiedForm, file: File, sourceId: string): { applied: boolean; skipped?: string; deferred?: true } => {
    const values = toValueMap(form.fields);
    const rows = toRowValues(form.rows);
    // 後端有回該表的頁面圖時，對照面板顯示的就是那張圖，欄位位置統一歸到第 1 頁
    const imageUrl = identifiedImageUrl(form.image);
    const locations = toLocations(form.fields, sourceId, imageUrl ? 1 : undefined);
    // 後端回這張表出現在原件的哪幾頁；沒回就不記，面板退回顯示整份原件
    const source = form.pages && form.pages.length > 0 ? { sourceId, pages: form.pages, imageUrl, importedAt: new Date().toISOString() } : undefined;

    if (form.formCode === 'VAT_401' || form.formCode === 'VAT_403') {
      const code = form.formCode === 'VAT_401' ? '401' : '403';
      const page = findVatPage(form);
      if (!page) {
        const label = form.periodStartMonth ? formatPeriodLabel(form.taxYear, form.periodStartMonth) : `民國 ${form.taxYear} 年（無法判斷期別）`;
        return { applied: false, skipped: `辨識到 ${label} 的 ${code}，不在這次需要的期別內，未帶入` };
      }
      // 辨識出來的是別一期：這一期什麼都不存（檔案也不掛），先暫存起來，
      // 等使用者自己切到那一期時才帶入（見下方 useEffect）。
      // 否則會變成「在 A 期上傳、資料卻跑到 B 期，A 期還顯示已上傳但不給過」。
      if (page.key !== pageKey) {
        setPendingVatForm(page.key, { file, form, sourceId });
        const label = formatPeriodLabel(page.period!.rocYear, page.period!.phase);
        return { applied: false, deferred: true, skipped: `這份是 ${label} 的 ${code}，與目前期別不同，資料未帶入；請切換到 ${label} 再繼續，屆時會自動帶入` };
      }
      dispatch({ type: 'SET_VAT_CHOICE', payload: { pageKey: page.key, formCode: form.formCode } });
      dispatch({ type: 'APPLY_IDENTIFIED_FORM', payload: { reportId: getVatReportKey(form.formCode, page.period!), fields: values, rows, locations, source } });
      setVatUpload(page.key, file);
      return { applied: true };
    }

    dispatch({ type: 'APPLY_IDENTIFIED_FORM', payload: { reportId: form.formCode, taxYear: form.taxYear, fields: values, rows, locations, source } });
    return { applied: true };
  };

  /**
   * 之前在別期上傳、暫存下來的辨識結果：使用者自己切到這一期時才帶入。
   * 這時 applyForm 的期別判斷已經相符，會照一般流程套用資料並把檔案掛上來。
   */
  const pending = pageKey ? pendingVatForms[pageKey] : undefined;
  useEffect(() => {
    if (!pageKey || !pending) return;
    clearPendingVatForm(pageKey);
    dispatch({ type: 'CLEAR_AI_FLAGS' });
    const outcome = applyForm(pending.form, pending.file, pending.sourceId);
    if (outcome.applied) toast.success('已帶入先前上傳的申報書');
    // 只在 pending 出現時套用一次；applyForm 讀的是當頁 state，不放進 deps 以免重跑
  }, [pageKey, pending]);

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
    // 401／403 辨識中途失敗時，檔案仍要留在這一頁讓使用者自己核對後手填（見 catch）
    let uploaded: File | null = null;
    try {
      // PNG、HEIC 先轉成 JPG 再送；大小上限檢查轉檔後實際上傳的檔案
      const file = isImage ? await toJpegFile(originalFile) : originalFile;
      if (file.size > MAX_SIZE_BYTES) {
        setStatus('idle');
        toast.error(`「${originalFile.name}」超過 ${MAX_SIZE_MB}MB 上限`);
        return;
      }
      uploaded = file;

      // 營所稅上傳的原件存到後端並列在頁面上（401／403 走 setVatUpload），與辨識同時進行；辨識失敗檔案也保留
      const sourcePromise = vatPeriod ? null : addSourceFile(file);

      // 辨識需帶開帳民國年（未選時退回依日期推算的當期年度）
      const openingYear = state.openYear ?? getCurrentOpenYear(resolveToday(state.simulatedDate));
      const result = await identifyCit(file, openingYear);
      const knownCodes = new Set<string>(FORM_LIST.map(f => f.formCode));
      const presentForms = result.forms.filter(f => f.present && !f.errorCode && knownCodes.has(f.formCode));
      const failedForms = result.forms.filter(f => f.errorCode && knownCodes.has(f.formCode));

      // 欄位位置要記下它屬於哪份原件（fileId），所以等上傳也完成再套用
      const source = sourcePromise ? await sourcePromise : null;
      if (source?.error) toast.error(`${getFriendlyErrorMessage(source.error, '原件上傳失敗')}，原件未存到雲端，重新整理後需重新上傳`);
      // 辨識結果會蓋到已有資料時，先讓使用者逐份勾選要匯入哪些；不會蓋到任何東西就全部帶入，不打擾
      const importingKeys = presentForms.flatMap(f => {
        const key = docKeyOf(f);
        return key ? [key] : [];
      });
      const selectedKeys = willOverwrite(presentForms) ? await askImport(importingKeys) : importingKeys;
      if (selectedKeys === null) {
        setStatus('idle');
        setMessage('');
        toast('已取消匯入，資料未變更');
        return;
      }
      const selected = new Set(selectedKeys);
      // 新一份原件：先清掉所有欄位的 AI 閃電標記，下面套用時只標記這次有辨識到、有帶入的欄位
      dispatch({ type: 'CLEAR_AI_FLAGS' });
      const outcomes: { applied: boolean; skipped?: string; deferred?: true }[] = presentForms.map(form => {
        // 使用者沒勾的文件整份不動（對不到文件清單的仍交給 applyForm，由它給略過原因）
        const key = docKeyOf(form);
        if (key && !selected.has(key)) return { applied: false };
        return applyForm(form, file, source?.id ?? VAT_SOURCE_ID);
      });
      const appliedCount = outcomes.filter(o => o.applied).length;
      // 確定是別期的檔案不留在這一頁（資料與檔案一起等使用者切過去），其餘情形
      // ——辨識成功、判不出期別、辨識失敗——都掛著讓使用者自己核對，防辨識失誤
      if (vatPeriod && pageKey && !outcomes.some(o => o.deferred)) setVatUpload(pageKey, file);
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
      // 帶入了哪幾份由下方的文件備齊清單（RequiredDocsChecklist）呈現，這裡只留部分略過或失敗的紅字提醒
      setMessage(notes.join('；'));
      toast.success(`辨識完畢，已帶入 ${appliedCount} 份文件`);
    } catch (err) {
      // 辨識失敗時檔案照樣留在這一頁，使用者可以對著它手動輸入
      if (vatPeriod && pageKey && uploaded) setVatUpload(pageKey, uploaded);
      setStatus('error');
      setMessage(getFriendlyErrorMessage(err, '辨識失敗，請重試或改用手動輸入'));
    }
  };

  const recognizing = status === 'recognizing';

  return (
    <div className='flex min-w-0 flex-col gap-1'>
      {variant === 'button' ? (
        // 已經有檔案：檔案本身是主角，這裡只留一顆再上傳的按鈕（辨識中改顯示進度，按鈕暫時收起）
        recognizing ? (
          <span className='flex flex-col items-end gap-0.5'>
            <span className='flex items-center gap-2 text-sm text-neutral-mid'>
              <Loader2 size={16} className='shrink-0 animate-spin text-brand-blue' />
              <span className='truncate'>辨識中…{fileName}</span>
            </span>
            <span className='text-xs text-neutral-mid'>{IDENTIFY_WAIT_NOTE}</span>
          </span>
        ) : (
          <Button variant='outline' size='sm' icon={Plus} onClick={() => inputRef.current?.click()} className='min-h-11 self-end nav:min-h-0'>
            {vatPeriod ? '重新上傳' : '新增檔案'}
          </Button>
        )
      ) : (
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
          className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border-[1.5px] border-dashed px-3 py-2 transition-colors ${
            dragging ? 'border-brand-blue bg-brand-blue/5' : 'border-neutral-blue-gray bg-surface-off-white'
          }`}
        >
          {recognizing ? (
            <Loader2 size={20} className='shrink-0 animate-spin text-brand-blue' />
          ) : (
            <Upload size={20} strokeWidth={1.75} className='shrink-0 text-brand-blue' />
          )}
          <div className='flex min-w-0 flex-1 basis-40 flex-col'>
            {/* 手機文字可換行（辨識中的檔名、「上傳申報書快速帶入（選填）」要看得到全文），桌機單行截斷 */}
            <span className='break-words text-sm font-medium text-neutral-dark nav:truncate'>
              {recognizing ? `辨識中…${fileName}` : vatPeriod ? `上傳申報書檔案${required ? '' : '（選填）'}` : `上傳申報書快速帶入${required ? '' : '（選填）'}`}
            </span>
            {/* 辨識中改顯示預估等待時間（只有轉圈的話使用者會以為當掉）；
                營業稅申報書的檔案會留存於系統，說明手機也要看得到；其餘文件的格式提示只在桌機顯示 */}
            <span className={`text-xs text-neutral-mid ${vatPeriod || recognizing ? '' : 'hidden nav:block'}`}>
              {recognizing
                ? IDENTIFY_WAIT_NOTE
                : vatPeriod
                  ? `上傳後會記錄在系統中・PDF、JPG、PNG、HEIC，${MAX_SIZE_MB}MB 以內`
                  : `PDF、JPG、PNG、HEIC，${MAX_SIZE_MB}MB 以內`}
            </span>
          </div>
          <Button variant='outline' size='sm' disabled={recognizing} onClick={() => inputRef.current?.click()} className='min-h-11 w-full shrink-0 nav:min-h-0 nav:w-auto'>
            {vatPeriod ? '上傳檔案' : '選擇檔案'}
          </Button>
        </div>
      )}
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
      {(status === 'error' || (status === 'done' && message)) && (
        <p className='flex items-start gap-1.5 text-xs text-semantic-error'>
          <TriangleAlert size={14} className='mt-0.5 shrink-0' />
          <span>{message}</span>
        </p>
      )}
      <ImportOverwriteDialog
        open={importAsk !== null}
        docs={buildRequiredDocs(state, { vatUploads, sourceFiles })}
        importingKeys={importAsk?.keys ?? []}
        onCancel={() => answerImport(null)}
        onConfirm={keys => answerImport(keys)}
      />
    </div>
  );
}
