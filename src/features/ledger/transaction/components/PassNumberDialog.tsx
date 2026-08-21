'use client';

import { passInvoiceBookNumber } from '@/api/invoiceBook';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { FileCheck2, Search } from 'lucide-react';
import { useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

const ACCEPT = '.png,.jpg,.jpeg,.heic,.pdf';
const ACCEPT_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.heic', '.pdf'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

interface PassNumberDialogProps {
  open: boolean;
  onClose: () => void;
  /** 欲跳號的發票簿 uuid */
  invoiceBookId: string;
  /** 跳號成功後回呼，供父層重新載入發票簿清單並更新表單帶入的號碼 */
  onSuccess: () => void;
}

/**
 * 發票本跳號（POST /ael/invoiceBook/passNumber）；api.md 目前此端點 body 僅有 uuid／invoiceBookId，
 * 未提供上傳檔案參數。作廢憑證照片依需求僅在前端驗證格式與大小，暫不隨請求送出，待後端補齊規格後再串接。
 */
export default function PassNumberDialog({ open, onClose, invoiceBookId, onSuccess }: PassNumberDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const reset = () => {
    setFile(null);
    setFileError('');
    setSubmitError('');
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const acceptFile = (candidate: File | undefined) => {
    if (!candidate) return;
    const ext = `.${candidate.name.split('.').pop()?.toLowerCase() ?? ''}`;
    if (!ACCEPT_EXTENSIONS.includes(ext)) {
      setFileError('不支援的檔案格式，請上傳 PNG、JPG、JPEG、HEIC 或 PDF');
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setFileError('檔案大小超過 20MB 限制');
      return;
    }
    setFile(candidate);
    setFileError('');
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => acceptFile(e.target.files?.[0]);
  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
  };
  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const handleConfirm = async () => {
    if (!file) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await passInvoiceBookNumber({ invoiceBookId });
      onSuccess();
      handleClose();
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open onClose={handleClose} title="上傳作廢憑證照片" widthClassName="max-w-[480px]">
      <div className="flex flex-col gap-3">
        <input id="pass-number-file-input" type="file" accept={ACCEPT} className="hidden" onChange={handleFileInput} />
        <label
          htmlFor="pass-number-file-input"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex min-h-[160px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-white px-4 py-8 transition-colors ${
            dragActive
              ? 'border-brand-blue bg-brand-blue/5 text-brand-blue'
              : 'border-neutral-blue-gray/50 text-neutral-dark hover:border-brand-blue hover:text-brand-blue'
          }`}
        >
          {file ? (
            <>
              <FileCheck2 size={24} className="text-semantic-success" strokeWidth={1.5} />
              <span className="text-sm text-neutral-dark">{file.name}</span>
            </>
          ) : (
            <>
              <Search size={24} strokeWidth={1.5} />
              <span className="text-sm font-semibold">瀏覽照片</span>
            </>
          )}
        </label>
        <p className="text-center text-xs text-neutral-mid">
          支援格式：PNG、JPG、JPEG、HEIC、PDF
          <br />
          檔案大小限制：20MB
        </p>
        {fileError && <p className="text-xs text-semantic-error">{fileError}</p>}
        {submitError && <p className="text-xs text-semantic-error">{submitError}</p>}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={handleClose} disabled={submitting}>
          取消
        </Button>
        <Button variant="primary" onClick={handleConfirm} disabled={!file || submitting}>
          {submitting ? '處理中…' : '上傳照片後跳號'}
        </Button>
      </div>
    </Modal>
  );
}
