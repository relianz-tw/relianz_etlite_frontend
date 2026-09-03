'use client';

import Modal from '@/components/ui/Modal';
import type { MockFile } from './mockFile';

interface MockFilePreviewModalProps {
  file: MockFile | null;
  onClose: () => void;
}

/** 模擬檔案的「查看」預覽彈窗：無真實 PDF，改以摘要列表呈現內容 */
export default function MockFilePreviewModal({ file, onClose }: MockFilePreviewModalProps) {
  if (!file) return null;

  return (
    <Modal open onClose={onClose} title={file.name} widthClassName="max-w-[480px]">
      <p className="mb-4 text-xs text-neutral-mid">產生時間：{file.timeLabel}</p>
      <dl className="divide-y divide-neutral-blue-gray/20 rounded-md border border-neutral-blue-gray/20">
        {file.summary.map(row => (
          <div key={row.label} className="flex items-center justify-between px-3 py-2 text-sm">
            <dt className="text-neutral-mid">{row.label}</dt>
            <dd className="font-mono font-medium text-neutral-dark">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-neutral-mid">尚未串接後端，此為示意內容，非真實文件。</p>
    </Modal>
  );
}
