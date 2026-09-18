'use client';

import type { RentalFileDto } from '@/api/types';
import Button from '@/components/ui/Button';
import { Download, Eye, FileText, Trash2 } from 'lucide-react';
import { Fragment } from 'react';

// ⚠️ .env.production 目前尚未設定此值，正式環境上線前需補上（比照 SalaryPdfManager 的既有註記）
const IMG_BASE_URL = process.env.NEXT_PUBLIC_IMG_URL ?? '';

function fileUrl(url: string): string {
  return url.startsWith('http') ? url : `${IMG_BASE_URL}/${url}`;
}

interface FileListSectionProps {
  title: string;
  files: RentalFileDto[];
  emptyText: string;
  onDelete?: (file: RentalFileDto) => void;
}

/** 租金附件清單區塊；查看／下載為指向 GCP 檔案 URL 的真實連結，非模擬 */
export default function FileListSection({ title, files, emptyText, onDelete }: FileListSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-medium text-neutral-mid">{title}</h4>
      {files.length === 0 ? (
        <div className="rounded-md border border-neutral-blue-gray/20 bg-surface-cream py-6 text-center text-sm text-neutral-mid">{emptyText}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {files.map(file => (
            <div
              key={file.uuid}
              className="flex flex-col gap-3 rounded-md border border-neutral-blue-gray/20 bg-surface-cream p-3 nav:flex-row nav:items-center nav:justify-between"
            >
              <div className="flex flex-1 items-center gap-3 text-left">
                <FileText size={22} className="shrink-0 text-brand-blue" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-dark">{file.originalFilename}</p>
                  <p className="mt-0.5 text-xs text-neutral-mid">上傳時間：{file.createTime}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {IMG_BASE_URL && (
                  <Fragment>
                    <a
                      href={fileUrl(file.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-neutral-blue-gray/40 px-3 text-xs font-medium text-neutral-dark hover:bg-surface-off-white"
                    >
                      <Eye size={14} /> 查看
                    </a>
                    <a
                      href={fileUrl(file.fileUrl)}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-neutral-blue-gray/40 px-3 text-xs font-medium text-neutral-dark hover:bg-surface-off-white"
                    >
                      <Download size={14} /> 下載
                    </a>
                  </Fragment>
                )}
                {onDelete && <Button size="sm" variant="ghost" icon={Trash2} onClick={() => onDelete(file)} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
