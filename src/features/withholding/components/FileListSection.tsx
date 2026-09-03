'use client';

import Button from '@/components/ui/Button';
import { Eye, Download, FileText, Trash2 } from 'lucide-react';
import { downloadMockFile, type MockFile } from './mockFile';

interface FileListSectionProps {
  title: string;
  files: MockFile[];
  emptyText: string;
  onView: (file: MockFile) => void;
  onDelete?: (file: MockFile) => void;
}

/** 繳款書／繳款證明／申報明細等檔案清單區塊，查看/下載/刪除操作皆為前端模擬 */
export default function FileListSection({ title, files, emptyText, onView, onDelete }: FileListSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-medium text-neutral-mid">{title}</h4>
      {files.length === 0 ? (
        <div className="rounded-md border border-neutral-blue-gray/20 bg-surface-cream py-6 text-center text-sm text-neutral-mid">{emptyText}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {files.map(file => (
            <div
              key={file.id}
              className="flex flex-col gap-3 rounded-md border border-neutral-blue-gray/20 bg-surface-cream p-3 nav:flex-row nav:items-center nav:justify-between"
            >
              <button type="button" onClick={() => onView(file)} className="flex flex-1 items-center gap-3 text-left">
                <FileText size={22} className="shrink-0 text-brand-blue" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-dark">{file.name}</p>
                  <p className="mt-0.5 text-xs text-neutral-mid">產生時間：{file.timeLabel}</p>
                </div>
              </button>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" icon={Eye} onClick={() => onView(file)}>
                  查看
                </Button>
                <Button size="sm" variant="outline" icon={Download} onClick={() => downloadMockFile(file)}>
                  下載
                </Button>
                {onDelete && (
                  <Button size="sm" variant="ghost" icon={Trash2} onClick={() => onDelete(file)} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
