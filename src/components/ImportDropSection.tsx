'use client';

import Button from '@/components/ui/Button';
import { FileCheck2, Loader2, Search, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, ReactNode } from 'react';

export type ImportDropStatus = 'idle' | 'busy' | 'done' | 'error';

interface ImportDropSectionProps {
  title: string;
  hint?: ReactNode;
  accept?: string;
  /** 檔案大小上限（MB），不傳則不檢查 */
  maxSizeMB?: number;
  /** 傳入時顯示底部取消／確認操作列 */
  onCancel?: () => void;
  /** 傳入時「確認匯入」在已選檔案時啟用，點擊後帶出選取的 File；不傳則維持停用（尚未串接後端） */
  onConfirm?: (file: File) => void;
  /** 選到合法檔案時立即觸發（早於 onConfirm），供呼叫端提前拿到 File 物件 */
  onFileSelect?: (file: File) => void;
  /** 清除已選檔案時觸發；傳入時檔名旁會顯示可移除的 X 按鈕 */
  onRemove?: () => void;
  /** 停用「確認匯入」時顯示的提示文字，預設「匯入功能尚未串接後端 API」 */
  disabledHint?: string;
  /** 外部狀態覆蓋：busy 顯示辨識中、error 顯示錯誤樣式（需搭配 errorMessage） */
  status?: ImportDropStatus;
  errorMessage?: string;
}

export default function ImportDropSection({
  title,
  hint,
  accept = '.xlsx',
  maxSizeMB,
  onCancel,
  onConfirm,
  onFileSelect,
  onRemove,
  disabledHint = '匯入功能尚未串接後端 API',
  status = 'idle',
  errorMessage,
}: ImportDropSectionProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);

  const acceptFile = (file: File | undefined) => {
    if (!file) return;
    setLocalError(null);
    // 僅接受符合 accept 副檔名的檔案（純前端檢查，不接後端）
    const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
    if (!accept.split(',').map(a => a.trim().toLowerCase()).includes(ext)) {
      setLocalError(`不支援的檔案格式，請上傳 ${accept}`);
      return;
    }
    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`檔案大小超過 ${maxSizeMB}MB 上限`);
      return;
    }
    selectedFileRef.current = file;
    setFileName(file.name);
    onFileSelect?.(file);
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => acceptFile(e.target.files?.[0]);

  const handleDragOver = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragActive(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectedFileRef.current = null;
    setFileName(null);
    if (inputRef.current) inputRef.current.value = '';
    onRemove?.();
  };

  const isBusy = status === 'busy';
  const isError = status === 'error' || !!localError;
  const displayErrorMessage = localError ?? errorMessage;

  return (
    <div>
      {title && <h3 className="font-notoSerif text-base font-semibold text-neutral-dark">{title}</h3>}
      {hint && <p className="mt-1.5 text-sm leading-relaxed text-neutral-mid">{hint}</p>}

      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} disabled={isBusy} />
      <button
        type="button"
        onClick={() => !isBusy && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        disabled={isBusy}
        className={`mt-3 flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-white px-4 py-8 transition-colors ${
          isError
            ? 'border-semantic-error text-semantic-error'
            : dragActive
              ? 'border-brand-blue bg-brand-blue/5 text-brand-blue'
              : 'border-neutral-blue-gray/50 text-neutral-dark hover:border-brand-blue hover:text-brand-blue'
        }`}
      >
        {isBusy ? (
          <>
            <Loader2 size={24} className="animate-spin text-brand-blue" strokeWidth={1.5} />
            <span className="text-sm text-brand-blue">辨識中…</span>
          </>
        ) : fileName ? (
          <>
            <FileCheck2 size={24} className={isError ? 'text-semantic-error' : 'text-semantic-success'} strokeWidth={1.5} />
            <span className="flex items-center gap-1.5 text-sm text-neutral-dark">
              {fileName}
              {onRemove && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleRemove}
                  className="rounded-full p-0.5 text-neutral-mid hover:bg-surface-cream hover:text-neutral-dark"
                  aria-label="移除檔案"
                >
                  <X size={14} />
                </span>
              )}
            </span>
          </>
        ) : (
          <>
            <Search size={24} strokeWidth={1.5} />
            <span className="text-sm font-semibold">瀏覽檔案</span>
          </>
        )}
      </button>

      {displayErrorMessage && <p className="mt-2 text-xs text-semantic-error">{displayErrorMessage}</p>}
      {!onConfirm && !displayErrorMessage && <p className="mt-2 text-xs text-neutral-mid">{disabledHint}</p>}

      {onCancel && (
        <div className="mt-4 flex gap-4">
          <Button variant="ghost" onClick={onCancel}>
            取消
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            disabled={!onConfirm || !fileName || isBusy}
            title={onConfirm ? undefined : disabledHint}
            onClick={() => {
              if (onConfirm && selectedFileRef.current) onConfirm(selectedFileRef.current);
            }}
          >
            確認匯入
          </Button>
        </div>
      )}
    </div>
  );
}
