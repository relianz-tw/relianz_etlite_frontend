'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useEffect, useState } from 'react';
import ImportDropSection from './ImportDropSection';

interface ImportInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
}

// 目前為期間佔位字串，尚未串接當期營業稅申報期間資料
const PERIOD = '115 年 5 - 6 月份';

type Step = 'notice' | 'form';

export default function ImportInvoiceDialog({ open, onClose }: ImportInvoiceDialogProps) {
  const [step, setStep] = useState<Step>('notice');

  // 每次開啟 dialog 都從提醒步驟開始
  useEffect(() => {
    if (open) setStep('notice');
  }, [open]);

  if (step === 'notice') {
    return (
      <Modal open={open} onClose={onClose} title="財政部電子發票平台檔案下載提醒" widthClassName="max-w-[560px]">
        <div className="flex flex-col gap-4 text-sm leading-relaxed text-neutral-mid">
          <p>當期營業稅申報截止前，若您有：</p>

          <ol className="flex flex-col gap-2 pl-5">
            <li className="list-decimal">
              <span className="font-semibold text-neutral-dark">開立電子發票折讓單（銷項折讓）</span>
            </li>
            <li className="list-decimal">
              <span className="font-semibold text-neutral-dark">取得電子發票折讓單（進項折讓）</span>
            </li>
            <li className="list-decimal">
              <span className="font-semibold text-neutral-dark">作廢銷項電子發票</span>
            </li>
          </ol>

          <p>請注意：以上資料根據目前的規定，可能需 48 小時至 7 日才會從開立方上傳至財政部電子發票平台。</p>

          <p>您目前財政部電子發票平台所下載的資料，可能不會包括以上作廢銷項發票或是折讓單。</p>

          <p className="font-semibold text-neutral-dark">
            建議您務必自行保存作廢及折讓等相關證據。並自行檢查上傳至 Easy Tax 平台資料是否完整無誤。
          </p>

          <p className="font-semibold text-semantic-error">提醒您：進項折讓單及銷項作廢發票必須當期申報，以免受罰。</p>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={() => setStep('form')}>
            我知道了
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="匯入電子發票" widthClassName="max-w-[560px]">
      <div className="flex flex-col gap-5">
        <ImportDropSection
          title={`${PERIOD}電子發票匯入`}
          hint={
            <>
              匯入電子發票紀錄檔案格式必須是 Excel (.XLSX) 檔且符合【財政部電子發票整合服務平台】規範（
              <a href="#" className="text-brand-blue underline">
                說明
              </a>
              ）
            </>
          }
          onCancel={onClose}
        />

        <div className="border-t border-neutral-blue-gray/30" />

        <ImportDropSection title={`${PERIOD}折讓單匯入`} onCancel={onClose} />
      </div>
    </Modal>
  );
}
