import type { DocumentSlot } from '../state/initializationReducer';
import ImportDropSection, { type ImportDropStatus } from '@/components/ImportDropSection';
import Badge from '@/components/ui/Badge';

interface DocumentCardProps {
  label: string;
  hint?: string;
  accept: string;
  maxSizeMB?: number;
  slot: DocumentSlot;
  primary?: boolean;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}

const STATUS_MAP: Record<DocumentSlot['status'], ImportDropStatus> = {
  empty: 'idle',
  uploading: 'busy',
  recognizing: 'busy',
  done: 'done',
  error: 'error',
};

/** 3A 上傳頁單張文件分類卡片，包裝 ImportDropSection（僅用其拖放區，不含 modal 專用的取消/確認列） */
export function DocumentCard({ label, hint, accept, maxSizeMB = 5, slot, primary, onFileSelect, onRemove }: DocumentCardProps) {
  return (
    <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm font-semibold text-neutral-dark">{label}</span>
        {primary && (
          <Badge tone="info" variant="muted">
            主來源
          </Badge>
        )}
        {slot.status === 'done' && (
          <Badge tone="success" variant="muted">
            已辨識
          </Badge>
        )}
      </div>
      <ImportDropSection
        title=""
        hint={hint}
        accept={accept}
        maxSizeMB={maxSizeMB}
        status={STATUS_MAP[slot.status]}
        errorMessage={slot.errorMessage ?? undefined}
        onFileSelect={onFileSelect}
        onRemove={slot.fileName ? onRemove : undefined}
      />
    </div>
  );
}
