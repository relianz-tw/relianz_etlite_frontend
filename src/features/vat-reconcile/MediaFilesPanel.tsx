'use client';

import { downloadVatMedia, getVatMediaStatus } from '@/api/peit';
import type { VatMediaFile, VatMediaKind } from '@/api/peit';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { ArrowLeft, Download, Eye, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

const MEDIA_KINDS: { kind: VatMediaKind; label: string; hint: string }[] = [
  { kind: 'txt', label: 'TXT 申報檔', hint: '401／403 媒體申報檔' },
  { kind: 'tetu', label: 'TET_U 申報檔', hint: '401／403 媒體申報檔（TET_U 格式）' },
  { kind: 't07', label: 'T07 檔', hint: '兼營營業人營業稅額調整計算表' },
  { kind: 't07s', label: 'T07 補申報檔', hint: '開業第一年未滿 9 個月之期別補申報' },
];

/** 2026-10-28T10:00:00+08:00 → 2026/10/28 10:00（本地時區） */
function formatGeneratedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * 將媒體檔 Blob 轉成可顯示的文字。
 * 先以 UTF-8 嚴格解碼；若檔案是 Big5 編碼（財政部媒體檔常見）會解碼失敗，改以 Big5 重解，避免中文變亂碼。
 */
async function blobToText(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder('big5').decode(buf);
  }
}

/** 以暫時的 <a download> 觸發瀏覽器下載 */
function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

interface MediaFilesPanelProps {
  rocYear: number;
  phase: number;
}

/** 申報檔入口：收納成一顆按鈕，點擊才開彈窗列出檔案；切換期別時由呼叫端以 key 重掛 */
export default function MediaFilesPanel({ rocYear, phase }: MediaFilesPanelProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" icon={FileText} onClick={() => setOpen(true)}>
        查看申報檔
      </Button>
      {/* Modal 關閉時不掛載內容，所以狀態查詢會等到使用者開啟彈窗才送出 */}
      <Modal open={open} onClose={() => setOpen(false)} title="申報檔" widthClassName="max-w-[560px]">
        <MediaFilesList rocYear={rocYear} phase={phase} />
      </Modal>
    </>
  );
}

/** 某期申報媒體檔：四種檔各自「查看」「下載」（檔案由後端產生，前端不提供產生） */
function MediaFilesList({ rocYear, phase }: MediaFilesPanelProps) {
  const params = { taxYear: rocYear, cmsPhase: phase };

  const [files, setFiles] = useState<Partial<Record<VatMediaKind, VatMediaFile>>>({});
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState('');
  // 每列各自的進行中動作與錯誤，一列失敗不影響其他列
  const [busy, setBusy] = useState<Partial<Record<VatMediaKind, 'view' | 'download'>>>({});
  const [errors, setErrors] = useState<Partial<Record<VatMediaKind, string>>>({});
  // 正在查看的檔案內容；有值時彈窗內以預覽取代清單
  const [preview, setPreview] = useState<{ kind: VatMediaKind; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getVatMediaStatus(params)
      .then(list => {
        if (cancelled) return;
        setFiles(Object.fromEntries(list.map(f => [f.kind, f])));
      })
      .catch(err => {
        if (!cancelled) setStatusError(getFriendlyErrorMessage(err, '讀取申報檔狀態失敗'));
      })
      .finally(() => {
        if (!cancelled) setStatusLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // 期別變動時由呼叫端 key 重掛，這裡只需掛載時查一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (kind: VatMediaKind, action: 'view' | 'download') => {
    setBusy(b => ({ ...b, [kind]: action }));
    setErrors(e => ({ ...e, [kind]: '' }));
    try {
      const blob = await downloadVatMedia(kind, params);
      if (action === 'view') setPreview({ kind, text: await blobToText(blob) });
      else saveBlob(blob, files[kind]?.fileName ?? `${kind}.txt`);
    } catch (err) {
      setErrors(e => ({ ...e, [kind]: getFriendlyErrorMessage(err, action === 'view' ? '查看失敗' : '下載失敗') }));
    } finally {
      setBusy(b => ({ ...b, [kind]: undefined }));
    }
  };

  if (preview) {
    const meta = MEDIA_KINDS.find(m => m.kind === preview.kind);
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-[15px] font-semibold text-neutral-dark">{meta?.label}</span>
            <span className="truncate text-[13px] text-neutral-mid">{files[preview.kind]?.fileName}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setPreview(null)}>
              返回
            </Button>
            <Button variant="outline" size="sm" icon={Download} onClick={() => run(preview.kind, 'download')}>
              下載
            </Button>
          </div>
        </div>
        {errors[preview.kind] && <span className="text-[13px] text-semantic-error">{errors[preview.kind]}</span>}
        <pre className="max-h-[60vh] overflow-auto whitespace-pre rounded-md bg-surface-off-white p-4 font-mono text-xs text-neutral-dark">
          {preview.text}
        </pre>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {statusError && <p className="text-[13px] text-semantic-error">{statusError}</p>}
      <ul className="flex flex-col gap-3">
        {MEDIA_KINDS.map(({ kind, label, hint }) => {
          const file = files[kind];
          const action = busy[kind];
          return (
            <li key={kind} className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg bg-surface-off-white px-4 py-4 nav:px-5">
              <div className="flex min-w-0 flex-1 basis-60 flex-col">
                <span className="text-[15px] font-semibold text-neutral-dark">{label}</span>
                <span className="text-[13px] leading-relaxed text-neutral-mid">
                  {statusLoading
                    ? '讀取中…'
                    : file
                      ? `${file.fileName}・產生於 ${formatGeneratedAt(file.generatedAt)}`
                      : `尚無檔案・${hint}`}
                </span>
                {errors[kind] && <span className="text-[13px] text-semantic-error">{errors[kind]}</span>}
              </div>
              <div className="flex w-full flex-col gap-2 nav:w-auto nav:flex-row">
                <Button
                  icon={Eye}
                  onClick={() => run(kind, 'view')}
                  disabled={!file || !!action}
                  className="w-full nav:w-auto"
                >
                  {action === 'view' ? '讀取中…' : '查看'}
                </Button>
                <Button
                  variant="outline"
                  icon={Download}
                  onClick={() => run(kind, 'download')}
                  disabled={!file || !!action}
                  className="w-full nav:w-auto"
                >
                  {action === 'download' ? '下載中…' : '下載'}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
