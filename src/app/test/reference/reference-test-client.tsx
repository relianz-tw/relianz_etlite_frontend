'use client';

import { pickIdentifiedValue, toFieldBBox, type FieldBBox, type IdentifiedField } from '@/api/peit';
import Button from '@/components/ui/Button';
import SegmentedControl from '@/components/ui/SegmentedControl';
import TextInput from '@/components/ui/TextInput';
import { SourceViewer } from '@/features/initialization/components/SourceViewer';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { toJpegFile } from '@/lib/imageToJpeg';
import { FileUp, Info, Loader2, ScanSearch, TriangleAlert } from 'lucide-react';
import { useRef, useState } from 'react';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'heic', 'heif'];

/** Go 座標定位 PoC（~/Desktop/cit-locator-poc，cmd/server）的位址，測試頁專用 */
const POC_URL = 'http://localhost:6700/identify';

/** 右側顯示哪一張圖：使用者上傳的原始檔案，或後端轉正、渲染後的圖（框的座標是相對於這張圖的） */
type ViewSource = 'original' | 'processed';

/** Go PoC 的欄位：形狀對齊 IdentifiedField，另有 source（定位框的算法來源）；AI 只讀值，不回框 */
interface PocField extends IdentifiedField {
  source?: string;
}

interface PocResult {
  formCode: string;
  page: number;
  /** 校正後的頁面圖片；框的座標都是相對這張圖，不能用使用者上傳的原檔顯示 */
  image: { width: number; height: number; url: string };
  method: string;
  /** 對頁面做了什麼校正：none 原圖是正的；rotate 單純旋轉；perspective 透視校正（手機翻拍的梯形變形）。顯示與框都是校正後的圖 */
  correction: 'none' | 'rotate' | 'perspective';
  /** rotate 時轉正前頁面的傾斜角度（順時針為正） */
  skewDegrees: number;
  align?: { matches: number; inliers: number; ratio: number; accepted: boolean };
  fields: PocField[];
  missing: string[];
  warnings?: string[];
  aiError?: string;
  timing: Record<string, number>;
}

function isImageFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return file.type.startsWith('image/') || IMAGE_EXTENSIONS.includes(ext);
}

/** 原始座標顯示到小數 3 位；後端沒回框時顯示「-」 */
function formatRawBBox(bbox: IdentifiedField['bbox']): string {
  if (!bbox) return '-';
  return [bbox.x1, bbox.y1, bbox.x2, bbox.y2].map(n => n.toFixed(3)).join(', ');
}

function formatValue(field: IdentifiedField): string {
  const value = pickIdentifiedValue(field);
  return value === undefined ? '' : String(value);
}

/** 下載 Go PoC 回傳的頁面圖片轉成 File，交給 SourceViewer 顯示；框的座標是相對這張圖的 */
async function fetchPageFile(url: string, name: string): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`取頁面圖片失敗（${response.status}）`);
  const blob = await response.blob();
  return new File([blob], name, { type: blob.type });
}

/** PoC 回傳的框（x1,y1,x2,y2）轉成 SourceViewer 用的相對座標；超出頁面或過小的框回 null */
function pocBox(bbox: PocField['bbox']): FieldBBox | null {
  if (!bbox) return null;
  return toFieldBBox({ page: 1, bbox } as IdentifiedField);
}

/** 原件座標測試頁：上傳原件，由 Go 定位 PoC 辨識，逐欄位檢視紅框落點 */
export function ReferenceTestClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [pdfPage, setPdfPage] = useState('');
  const [poc, setPoc] = useState<PocResult | null>(null);
  const [pocImage, setPocImage] = useState<File>();
  const [viewSource, setViewSource] = useState<ViewSource>('processed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldCode, setFieldCode] = useState<string | null>(null);

  const field = poc?.fields.find(f => f.fieldCode === fieldCode) ?? null;
  // 框是相對於「辨識用的圖」（轉正後）的，看原始檔案時不畫
  const showingProcessed = pocImage !== undefined && viewSource === 'processed';
  const focusBox = showingProcessed ? pocBox(field?.bbox) : null;

  const handleSelectFile = async (selected: File | undefined) => {
    if (!selected) return;
    setError('');
    setPoc(null);
    setPocImage(undefined);
    setFieldCode(null);
    try {
      // 與正式流程一致：PNG、HEIC 先轉成 JPG
      setFile(isImageFile(selected) ? await toJpegFile(selected) : selected);
    } catch (e) {
      setError(getFriendlyErrorMessage(e, '檔案讀取失敗'));
    }
  };

  const handleIdentify = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      if (pdfPage) body.append('page', pdfPage);
      const response = await fetch(POC_URL, { method: 'POST', body });
      const data = (await response.json()) as PocResult & { message?: string };
      if (!response.ok) throw new Error(data.message ?? `Go PoC 回應 ${response.status}`);
      setPoc(data);
      setPocImage(await fetchPageFile(data.image.url, `page-${data.page}.png`));
      setViewSource('processed');
      setFieldCode(null);
    } catch (e) {
      // 連不上 PoC 時 fetch 只會丟 TypeError，補上要怎麼啟動的提示
      setError(e instanceof TypeError ? `連不上 ${POC_URL}，請先在 cit-locator-poc 執行 make server` : e instanceof Error ? e.message : '辨識失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen flex-col gap-4 bg-surface-off-white p-4 nav:p-6'>
      <h1 className='font-notoSerif text-xl font-bold text-neutral-dark'>原件座標測試</h1>

      <div className='grid items-start gap-4 nav:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
        <section className='flex flex-col gap-3 rounded-lg border border-neutral-blue-gray/30 bg-white p-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <input
              ref={inputRef}
              type='file'
              accept='.pdf,.jpg,.jpeg,.png,.heic,.heif'
              className='hidden'
              onChange={e => {
                handleSelectFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <Button variant='outline' size='sm' icon={FileUp} onClick={() => inputRef.current?.click()}>
              選擇原件
            </Button>
            <span className='min-w-0 flex-1 truncate text-sm text-neutral-mid'>{file?.name ?? '尚未選擇檔案'}</span>
            <TextInput widthClassName='w-28' inputMode='numeric' aria-label='PDF 頁碼' placeholder='頁碼（選填）' value={pdfPage} onChange={e => setPdfPage(e.target.value.replace(/\D/g, ''))} />
            <Button size='sm' icon={loading ? Loader2 : ScanSearch} disabled={!file || loading} onClick={handleIdentify}>
              {loading ? '辨識中…' : '辨識'}
            </Button>
          </div>

          <p className='flex items-start gap-1.5 text-xs text-neutral-mid'>
            <Info size={14} className='mt-0.5 shrink-0' />
            拍照上傳時請把紙壓平、相機正對紙面，讓整張表格都在畫面內；紙面捲曲或摺痕會讓定位失準。
          </p>

          {error && (
            <p className='flex items-start gap-1.5 rounded-md bg-semantic-error/10 p-2 text-sm text-semantic-error'>
              <TriangleAlert size={16} className='mt-0.5 shrink-0' />
              {error}
            </p>
          )}

          {poc && <PocSummary poc={poc} />}

          {poc && (
            <FieldTable
              rows={poc.fields.map(f => ({
                key: f.fieldCode,
                name: f.fieldName,
                value: formatValue(f),
                source: f.source ?? '-',
                locator: f.bbox ? formatRawBBox(f.bbox) : '無定位框',
                hasBox: f.bbox !== null,
              }))}
              selected={fieldCode}
              onSelect={setFieldCode}
            />
          )}
        </section>

        <aside className='sticky top-4 flex h-[85svh] flex-col overflow-hidden rounded-lg border border-neutral-blue-gray/30 bg-white'>
          {pocImage && (
            <div className='flex flex-wrap items-center gap-2 border-b border-neutral-blue-gray/30 px-3 py-2'>
              <SegmentedControl
                value={viewSource}
                onChange={setViewSource}
                size='sm'
                fit
                options={[
                  { value: 'processed', label: '辨識用的圖（有框）' },
                  { value: 'original', label: '原始檔案' },
                ]}
              />
              {viewSource === 'original' && <span className='text-xs text-neutral-mid'>原始檔案不畫框；框是相對於辨識用的圖</span>}
            </div>
          )}
          <SourceViewer file={showingProcessed ? pocImage : file} bbox={focusBox} emptyText='選擇原件後，可在這裡檢視' />
        </aside>
      </div>
    </div>
  );
}

/** Go PoC 的辨識概況：採用的定位方式、對位統計、耗時、未定位欄位與警告 */
function PocSummary({ poc }: { poc: PocResult }) {
  const align = poc.align;
  return (
    <div className='flex flex-col gap-1 rounded-md bg-surface-off-white p-3 text-xs text-neutral-dark'>
      <p>
        第 {poc.page} 頁，{poc.image.width}×{poc.image.height}，定位方式：{poc.method === 'template' ? '官方版面投影' : '表格線＋OCR'}
        {poc.correction === 'rotate' && `；原圖傾斜 ${poc.skewDegrees.toFixed(2)}°，已轉正（辨識用的圖是轉正後的）`}
        {poc.correction === 'perspective' && '；原圖有透視變形（拍照角度），已校正（辨識用的圖是校正後的）'}
        {align && `（官方版面對位 inliers ${align.inliers}／${align.matches}，比例 ${align.ratio.toFixed(2)}，${align.accepted ? '採用' : '不採用'}）`}
      </p>
      <p>
        耗時：定位 {poc.timing.locateMs} ms、AI 讀值 {poc.timing.aiMs} ms；未定位 {poc.missing.length} 欄
      </p>
      {poc.aiError && <p className='text-semantic-error'>AI 讀值失敗：{poc.aiError}</p>}
      {poc.warnings?.map(w => (
        <p key={w} className='flex items-start gap-1.5 text-semantic-error'>
          <TriangleAlert size={13} className='mt-0.5 shrink-0' />
          {w}
        </p>
      ))}
    </div>
  );
}

interface FieldRow {
  key: string;
  name: string;
  value: string;
  source: string;
  locator: string;
  hasBox: boolean;
}

/** 欄位清單：點列即聚焦該欄位；沒有框的列用錯誤色標示 */
function FieldTable({ rows, selected, onSelect }: { rows: FieldRow[]; selected: string | null; onSelect: (key: string) => void }) {
  return (
    <div className='max-h-[60svh] overflow-auto rounded-md border border-neutral-blue-gray/30'>
      <table className='w-full text-left text-xs'>
        <thead className='sticky top-0 bg-surface-cream text-neutral-dark'>
          <tr>
            <th className='px-2 py-1.5 font-semibold'>欄位</th>
            <th className='px-2 py-1.5 font-semibold'>值</th>
            <th className='px-2 py-1.5 font-semibold'>來源</th>
            <th className='px-2 py-1.5 font-semibold'>x1, y1, x2, y2</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr
              key={row.key}
              onClick={() => onSelect(row.key)}
              className={`cursor-pointer border-t border-neutral-blue-gray/20 hover:bg-brand-primary/5 ${row.key === selected ? 'bg-brand-primary/10' : ''}`}
            >
              <td className='px-2 py-1.5 text-neutral-dark'>
                {row.name}
                <span className='block text-neutral-mid'>{row.key}</span>
              </td>
              <td className='px-2 py-1.5 text-neutral-dark'>{row.value}</td>
              <td className='px-2 py-1.5 text-neutral-mid'>{row.source}</td>
              <td className={`px-2 py-1.5 ${row.hasBox ? 'text-neutral-mid' : 'text-semantic-error'}`}>{row.locator}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
