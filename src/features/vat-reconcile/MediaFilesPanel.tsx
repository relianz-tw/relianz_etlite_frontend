'use client';

import { downloadVatMedia, generateVatMedia, getVatMediaStatus } from '@/api/peit';
import type { VatMediaFile, VatMediaKind } from '@/api/peit';
import Button from '@/components/ui/Button';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { Download, FilePlus, RefreshCw } from 'lucide-react';
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

/** 某期申報媒體檔：四種檔各自「產生／重新產生」與「下載」；切換期別時由呼叫端以 key 重掛 */
export default function MediaFilesPanel({ rocYear, phase }: MediaFilesPanelProps) {
  const params = { taxYear: rocYear, cmsPhase: phase };

  const [files, setFiles] = useState<Partial<Record<VatMediaKind, VatMediaFile>>>({});
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState('');
  // 每列各自的進行中動作與錯誤，一列失敗不影響其他列
  const [busy, setBusy] = useState<Partial<Record<VatMediaKind, 'generate' | 'download'>>>({});
  const [errors, setErrors] = useState<Partial<Record<VatMediaKind, string>>>({});

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

  const run = async (kind: VatMediaKind, action: 'generate' | 'download') => {
    setBusy(b => ({ ...b, [kind]: action }));
    setErrors(e => ({ ...e, [kind]: '' }));
    try {
      if (action === 'generate') {
        const file = await generateVatMedia(kind, params);
        setFiles(f => ({ ...f, [kind]: file }));
      } else {
        const blob = await downloadVatMedia(kind, params);
        saveBlob(blob, files[kind]?.fileName ?? `${kind}.txt`);
      }
    } catch (err) {
      setErrors(e => ({ ...e, [kind]: getFriendlyErrorMessage(err, action === 'generate' ? '產生失敗' : '下載失敗') }));
    } finally {
      setBusy(b => ({ ...b, [kind]: undefined }));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-semibold text-neutral-dark">申報檔</h3>
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
                      : `尚未產生・${hint}`}
                </span>
                {errors[kind] && <span className="text-[13px] text-semantic-error">{errors[kind]}</span>}
              </div>
              <div className="flex w-full flex-col gap-2 nav:w-auto nav:flex-row">
                <Button
                  variant="outline"
                  icon={file ? RefreshCw : FilePlus}
                  onClick={() => run(kind, 'generate')}
                  disabled={statusLoading || !!action}
                  className="w-full nav:w-auto"
                >
                  {action === 'generate' ? '產生中…' : file ? '重新產生' : '產生'}
                </Button>
                <Button
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
