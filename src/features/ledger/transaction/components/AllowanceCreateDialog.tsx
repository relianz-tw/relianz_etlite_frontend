'use client';

import { createPayableAllowance, createReceivableAllowance } from '@/api/ledger';
import type { EntryDetailEntryDto } from '@/api/types';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import Label from '@/components/ui/Label';
import Modal from '@/components/ui/Modal';
import MoneyInput from '@/components/ui/MoneyInput';
import SubjectSelect, { type SubjectOption } from '@/components/ui/SubjectSelect';
import Textarea from '@/components/ui/Textarea';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { fmtCurrency } from '@/lib/utils';
import { useState } from 'react';
import type { Side } from '../../types';
import { formatYmd } from '../data';

interface AllowanceCreateDialogProps {
  open: boolean;
  onClose: () => void;
  side: Side;
  /** 交易詳細頁目前這筆交易，即折讓單的原單 */
  entry: EntryDetailEntryDto;
  /** 原單交易 uuid，即目前交易詳細頁的 transactionId */
  originLedgerUuid: string;
  /** 建立成功後觸發，供父層重新載入交易明細（折讓紀錄／沖帳狀態一併更新） */
  onCreated: () => void;
}

export default function AllowanceCreateDialog({ open, onClose, side, entry, originLedgerUuid, onCreated }: AllowanceCreateDialogProps) {
  if (!open) return null;
  return (
    <AllowanceCreateDialogContent
      key={originLedgerUuid}
      side={side}
      entry={entry}
      originLedgerUuid={originLedgerUuid}
      onClose={onClose}
      onCreated={onCreated}
    />
  );
}

/**
 * 交易詳細頁「開立折讓單」對話框：原單即當前交易，故不需 AllowanceOriginField 的字軌／流水號查詢，
 * 直接以唯讀摘要顯示原單資訊供使用者確認；可編輯欄位對齊新增交易「是否為折讓＝是」時的欄位
 * （見 TransactionMetaCard.tsx 的 isAllowanceCreate 分支）。
 */
function AllowanceCreateDialogContent({
  side,
  entry,
  originLedgerUuid,
  onClose,
  onCreated,
}: Omit<AllowanceCreateDialogProps, 'open'>) {
  const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
  const [subject, setSubject] = useState<SubjectOption | null>(
    entry.officialAccountingSubjectId ? { id: entry.officialAccountingSubjectId, subjectCode: '', name: entry.subjectName } : null,
  );
  const [netAmount, setNetAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalAmount = netAmount + taxAmount;

  const handleSubmit = async () => {
    if (!issueDate) {
      setError('請選擇開立日期');
      return;
    }
    if (!subject?.id) {
      setError('請選擇會計科目');
      return;
    }
    if (totalAmount <= 0) {
      setError('請輸入折讓金額');
      return;
    }
    setSubmitting(true);
    setError('');
    const body = {
      originLedgerUuid,
      datetime: formatYmd(issueDate)!,
      netAmount,
      taxAmount,
      totalAmount,
      officialAccountingSubjectId: subject.id,
      memo: memo || undefined,
    };
    try {
      if (side === 'purchase') {
        await createPayableAllowance(body);
      } else {
        await createReceivableAllowance(body);
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="開立折讓單" widthClassName="max-w-[420px]">
      <div className="flex flex-col gap-4">
        <div className="rounded-md bg-surface-cream p-3 text-xs text-neutral-mid">
          <p className="font-semibold text-neutral-dark">
            原始憑證：{entry.orderCode}
            {entry.counterpartyName ? ` · ${entry.counterpartyName}` : ''}
          </p>
          <p className="mt-1">總金額 {fmtCurrency(entry.totalAmount)}</p>
        </div>

        <div>
          <Label required>開立日期</Label>
          <DatePicker value={issueDate} onChange={setIssueDate} disabled={submitting} />
        </div>

        <div>
          <Label required>會計科目</Label>
          <SubjectSelect value={subject} onChange={setSubject} disabled={submitting} />
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-neutral-dark">
            未稅金額
            <span aria-hidden="true" className="ml-0.5 text-semantic-error">
              *
            </span>
          </span>
          <MoneyInput widthClassName="w-36" value={netAmount} onChange={setNetAmount} disabled={submitting} />
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-neutral-dark">稅額</span>
          <MoneyInput widthClassName="w-36" value={taxAmount} onChange={setTaxAmount} disabled={submitting} />
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-neutral-dark">折讓總額</span>
          <MoneyInput widthClassName="w-36" value={totalAmount} disabled readOnly />
        </div>

        <div>
          <Label>備註</Label>
          <Textarea value={memo} onChange={e => setMemo(e.target.value)} disabled={submitting} />
        </div>

        {error && <p className="text-xs text-semantic-error">{error}</p>}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? '建立中…' : '建立折讓單'}
        </Button>
      </div>
    </Modal>
  );
}
