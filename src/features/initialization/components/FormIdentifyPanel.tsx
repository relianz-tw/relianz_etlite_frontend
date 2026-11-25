'use client';

import { useReference } from '../reference/ReferenceContext';
import { useInitialization } from '../state/InitializationContext';
import type { FieldLocation } from '../state/initializationReducer';
import { FORM_LIST, formatPeriodLabel, getCurrentOpenYear, getVatReportKey, resolveToday } from '../reports';
import { identifiedImageUrl, identifyCit, pickIdentifiedValue, toFieldBBox, type IdentifiedField, type IdentifiedForm, type IdentifiedRow } from '@/api/peit';
import Button from '@/components/ui/Button';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { toJpegFile } from '@/lib/imageToJpeg';
import { Loader2, Plus, TriangleAlert, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { OverwriteConfirmDialog, type OverwriteConflict } from './OverwriteConfirmDialog';
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
  /** 還沒有檔案時畫整行虛線上傳框；已經有檔案時只畫一顆「新增檔案」按鈕（檔案本身由 SourceUploadSection 呈現） */
  variant?: 'dropzone' | 'button';
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'heic', 'heif'];

function getExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

/**
 * 辨識回傳的可重複列轉成畫面的列。財產目錄的列有明細（rowKind 省略）與小計（rowKind=SUBTOTAL），可能另有類別標題列（ROW_LINE_TYPE=category，後端不保證有）；
 * 類別編號取列自己的 ROW_CATEGORY_CODE、groupKey，都沒有就沿用上一列。畫面每一列自己帶類別編號、名稱，類別列本身不當成一列明細。
 */
export function toRowValues(rows: IdentifiedRow[]): Record<string, string | number>[] {
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

function hasValue(value: string | number | undefined): value is string | number {
  return value !== undefined && value !== '';
}

/** 值是否相同：文字比對去頭尾空白，兩邊都是數字時以數值比（"1000" 與 1000 視為相同） */
function sameValue(a: string | number, b: string | number): boolean {
  const x = String(a).trim();
  const y = String(b).trim();
  if (x === y) return true;
  const nx = Number(x);
  const ny = Number(y);
  return x !== '' && y !== '' && !Number.isNaN(nx) && !Number.isNaN(ny) && nx === ny;
}

/** 401／403 的原件另外存在各期別頁（vatUploads），欄位位置的 sourceId 用這個固定值，對照面板會改用該期自己的檔案 */
const VAT_SOURCE_ID = 'vat-upload';

/**
 * 辨識欄位的座標轉成各欄位在原件上的位置；沒有座標的欄位不收（表格列規格上也沒有座標）。
 *
 * pageOverride：改用後端回的頁面圖時，那張圖就是這張表唯一的一頁，欄位的 page 不該再參與比對。
 * 後端各表回的 page 不一致（損益表回 1，基本稅額表回原件頁次 3），照收會讓對不到 1 的表全部畫不出框。
 */
function toLocations(fields: IdentifiedField[], sourceId: string, pageOverride?: number): Record<string, FieldLocation> {
  const result: Record<string, FieldLocation> = {};
  for (const field of fields) {
    const box = toFieldBBox(field);
    if (box) result[field.fieldCode] = { ...box, page: pageOverride ?? box.page, sourceId };
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
 * 逐頁表單的「上傳辨識」入口（選填），由 SourceUploadSection 擺在頁首卡片下方：上傳一份 PDF 或圖片（JPG／PNG／HEIC，PNG、HEIC 先轉成 JPG）後呼叫 cit/identify，
 * 回傳中所有 present 的表都會一併套用（含其他頁），使用者也可略過直接手動輸入。
 */
export function FormIdentifyPanel({ required = false, vatPeriod = false, pageKey, variant = 'dropzone' }: FormIdentifyPanelProps) {
  const { state, dispatch, setVatUpload } = useInitialization();
  const { addSourceFile } = useReference();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<PanelStatus>('idle');
  const [message, setMessage] = useState('');
  const [fileName, setFileName] = useState('');
  // 辨識結果會蓋到已有資料時，等使用者選覆蓋或保留；resolve 把選擇交回 handleFile
  const [overwriteAsk, setOverwriteAsk] = useState<{ conflicts: OverwriteConflict[]; resolve: (overwrite: boolean) => void } | null>(null);
  const askOverwrite = (conflicts: OverwriteConflict[]) => new Promise<boolean>(resolve => setOverwriteAsk({ conflicts, resolve }));
  const answerOverwrite = (overwrite: boolean) => {
    overwriteAsk?.resolve(overwrite);
    setOverwriteAsk(null);
  };

  /** 這張辨識結果對應的資料 key：營所稅是 formCode，401／403 要對到需要的期別頁；對不到回 null */
  const findVatPage = (form: IdentifiedForm) => state.reportPages.find(p => p.period?.rocYear === form.taxYear && p.period.phase === form.periodStartMonth);
  const reportIdOf = (form: IdentifiedForm): string | null => {
    if (form.formCode !== 'VAT_401' && form.formCode !== 'VAT_403') return form.formCode;
    const page = findVatPage(form);
    return page ? getVatReportKey(form.formCode, page.period!) : null;
  };

  /** 找出辨識結果會蓋掉「已有資料、且值不同」的欄位（現有為空白或值相同的不算）；表格列整批取代，有資料且不同算一筆 */
  const findConflicts = (forms: IdentifiedForm[]): OverwriteConflict[] =>
    forms.flatMap(form => {
      const reportId = reportIdOf(form);
      if (!reportId) return [];
      const current = state.reports[reportId];
      const values = toValueMap(form.fields);
      const conflicts: OverwriteConflict[] = form.fields.flatMap(f => {
        const next = values[f.fieldCode];
        const existing = current?.fields[f.fieldCode]?.value;
        return next !== undefined && hasValue(existing) && !sameValue(existing, next) ? [{ fieldName: f.fieldName, current: existing, next }] : [];
      });
      const newRows = toRowValues(form.rows);
      const oldRows = current?.rows ?? [];
      const oldRowsHaveData = oldRows.some(row => Object.values(row).some(field => hasValue(field.value)));
      const rowsDiffer = oldRows.length !== newRows.length || newRows.some((row, i) => Object.entries(row).some(([key, value]) => key !== '__kind' && !sameValue(oldRows[i]?.[key]?.value ?? '', value)));
      if (newRows.length > 0 && oldRowsHaveData && rowsDiffer) conflicts.push({ fieldName: `${form.formName}的表格明細`, current: `${oldRows.length} 列`, next: `${newRows.length} 列` });
      return conflicts;
    });

  /**
   * 套用一張辨識結果。營所稅各表以 formCode 為 key；401／403 要依「民國年＋期別起始月」對到這次需要的期別頁，
   * 並把該期的申報書選擇切到辨識到的那一種；對不到（不在需上傳範圍）就略過。回傳是否有套用，以及略過時給使用者看的原因。
   * file 為實際送出辨識的檔案（圖片已轉 JPG），401／403 套用成功時一併記到該期別頁供預覽。
   */
  const applyForm = (form: IdentifiedForm, file: File, sourceId: string, overwrite: boolean): { applied: boolean; skipped?: string; vatPageIndex?: number } => {
    let values = toValueMap(form.fields);
    let rows = toRowValues(form.rows);
    // 後端有回該表的頁面圖時，對照面板顯示的就是那張圖，欄位位置統一歸到第 1 頁
    const imageUrl = identifiedImageUrl(form.image);
    const locations = toLocations(form.fields, sourceId, imageUrl ? 1 : undefined);
    // 使用者選「保留現有資料」：只填目前空白（或值相同）的欄位；已有資料的表格列不動。
    // 原件位置照記不過濾：使用者正是要對照原件上的值和現有資料有什麼不同，沒填入的欄位也要能框出來
    const targetId = reportIdOf(form);
    if (!overwrite && targetId) {
      const current = state.reports[targetId];
      values = Object.fromEntries(Object.entries(values).filter(([key, next]) => !hasValue(current?.fields[key]?.value) || sameValue(current!.fields[key].value, next)));
      if ((current?.rows ?? []).some(row => Object.values(row).some(field => hasValue(field.value)))) rows = [];
    }
    // 後端回這張表出現在原件的哪幾頁；沒回就不記，面板退回顯示整份原件
    const source = form.pages && form.pages.length > 0 ? { sourceId, pages: form.pages, imageUrl } : undefined;

    if (form.formCode === 'VAT_401' || form.formCode === 'VAT_403') {
      const code = form.formCode === 'VAT_401' ? '401' : '403';
      const page = findVatPage(form);
      if (!page) {
        const label = form.periodStartMonth ? formatPeriodLabel(form.taxYear, form.periodStartMonth) : `民國 ${form.taxYear} 年（無法判斷期別）`;
        return { applied: false, skipped: `辨識到 ${label} 的 ${code}，不在這次需要的期別內，未帶入` };
      }
      dispatch({ type: 'SET_VAT_CHOICE', payload: { pageKey: page.key, formCode: form.formCode } });
      dispatch({ type: 'APPLY_IDENTIFIED_FORM', payload: { reportId: getVatReportKey(form.formCode, page.period!), fields: values, rows, locations, source } });
      // 辨識到的是別期時，該期頁面也留一份供預覽
      setVatUpload(page.key, file);
      return { applied: true, vatPageIndex: state.reportPages.indexOf(page) };
    }

    dispatch({ type: 'APPLY_IDENTIFIED_FORM', payload: { reportId: form.formCode, taxYear: form.taxYear, fields: values, rows, locations, source } });
    return { applied: true };
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
      // 辨識結果會蓋到已有資料的欄位時，先問使用者要覆蓋還是保留（不直接覆蓋）
      const conflicts = findConflicts(presentForms);
      const overwrite = conflicts.length > 0 ? await askOverwrite(conflicts) : true;
      // 新一份原件：先清掉所有欄位的 AI 閃電標記，下面套用時只標記這次有辨識到、有帶入的欄位
      dispatch({ type: 'CLEAR_AI_FLAGS' });
      const outcomes = presentForms.map(form => applyForm(form, file, source?.id ?? VAT_SOURCE_ID, overwrite));
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
      // 帶入了哪幾份由下方的文件備齊清單（RequiredDocsChecklist）呈現，這裡只留部分略過或失敗的紅字提醒
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
      {variant === 'button' ? (
        // 已經有檔案：檔案本身是主角，這裡只留一顆再上傳的按鈕（辨識中改顯示進度，按鈕暫時收起）
        recognizing ? (
          <span className='flex items-center justify-end gap-2 text-sm text-neutral-mid'>
            <Loader2 size={16} className='shrink-0 animate-spin text-brand-blue' />
            <span className='truncate'>辨識中…{fileName}</span>
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
            {/* 營業稅申報書的檔案會留存於系統，說明手機也要看得到；其餘文件的格式提示只在桌機顯示 */}
            <span className={`text-xs text-neutral-mid ${vatPeriod ? '' : 'hidden nav:block'}`}>
              {vatPeriod ? `上傳後會記錄在系統中・PDF、JPG、PNG、HEIC，${MAX_SIZE_MB}MB 以內` : `PDF、JPG、PNG、HEIC，${MAX_SIZE_MB}MB 以內`}
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
      <OverwriteConfirmDialog open={overwriteAsk !== null} conflicts={overwriteAsk?.conflicts ?? []} onOverwrite={() => answerOverwrite(true)} onKeep={() => answerOverwrite(false)} />
    </div>
  );
}
