'use client';

import { listBankAccounts } from '@/api/bankAccounts';
import { reverseManualSettle, settlePayable, settleReceivable } from '@/api/ledger';
import type { BankAccountDto, EntryDetailSettleEventDto, SettleSummaryFee } from '@/api/types';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import Label from '@/components/ui/Label';
import Modal from '@/components/ui/Modal';
import MoneyInput from '@/components/ui/MoneyInput';
import OtherDeductionsEditor, { type OtherDeductionRow } from '@/components/ui/OtherDeductionsEditor';
import Select from '@/components/ui/Select';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { useEffect, useRef, useState } from 'react';
import type { Side } from '../../types';
import { formatYmd } from '../data';

interface SettlementEditDialogProps {
  open: boolean;
  event: EntryDetailSettleEventDto | null;
  side: Side;
  /** 該筆應收/應付帳款（原單）uuid，重新沖帳時作為 ledgerUuid 送出 */
  ledgerUuid: string;
  onClose: () => void;
  /** 恢復或重新沖帳成功（含「已恢復但重新沖帳失敗」的情況）後觸發，讓父層重新取得交易明細 */
  onSaved: () => void;
}

/** YYYYMMDD → Date；供 DatePicker 預設帶入原沖帳日期 */
function parseYyyymmdd(value: string): Date | undefined {
  if (!/^\d{8}$/.test(value)) return undefined;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  return new Date(year, month - 1, day);
}

export default function SettlementEditDialog({ open, event, side, ledgerUuid, onClose, onSaved }: SettlementEditDialogProps) {
  if (!open || !event) return null;
  return <SettlementEditDialogContent key={event.settleEventUuid} event={event} side={side} ledgerUuid={ledgerUuid} onClose={onClose} onSaved={onSaved} />;
}

/**
 * 編輯沖帳金額（僅手動沖帳提供）：後端沒有「修改沖帳」API，送出時先呼叫
 * POST /ael/ledger/settle/reverse 恢復原沖帳紀錄，成功後再依 side 呼叫
 * /ael/ledger/receivables/settle 或 /ael/ledger/payables/settle 重新沖帳一次。
 * 兩步驟是各自獨立的請求：若恢復成功但重新沖帳失敗，資料已實際變動，
 * 故不重試（避免重複恢復），改為顯示錯誤並提示使用者自行再沖一次。
 */
function SettlementEditDialogContent({
  event,
  side,
  ledgerUuid,
  onClose,
  onSaved,
}: {
  event: EntryDetailSettleEventDto;
  side: Side;
  ledgerUuid: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isSales = side === 'sales';
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(parseYyyymmdd(event.paymentDate));
  const [amount, setAmount] = useState(event.settleAmount);
  // 原沖帳事件僅回傳帳面金額與實際收付金額的合計差額（手續費＋額外金額合計），無法拆分回各項目，
  // 故初始帶入單一手續費欄位，額外金額列表預設為空，使用者可視需要重新拆分
  const [fee, setFee] = useState(Math.max(event.settleAmount - event.cashAmount, 0));
  const [otherDeductions, setOtherDeductions] = useState<OtherDeductionRow[]>([]);
  const otherDeductionIdRef = useRef(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // 恢復步驟已成功但重新沖帳失敗：資料已變動，僅能關閉並重新整理，不可重試（避免重複恢復）
  const [reverted, setReverted] = useState(false);

  const handleAddOtherDeduction = () => {
    otherDeductionIdRef.current += 1;
    setOtherDeductions(prev => [...prev, { id: `OD-${otherDeductionIdRef.current}`, subject: null, name: '', amount: 0 }]);
  };
  const handleRemoveOtherDeduction = (id: string) => setOtherDeductions(prev => prev.filter(r => r.id !== id));
  const handleChangeOtherDeduction = (id: string, patch: Partial<Omit<OtherDeductionRow, 'id'>>) =>
    setOtherDeductions(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));

  // 收/付款戶頭：同 ManualEntryDialog，銷項預設收款帳戶、進項預設付款帳戶
  const [accounts, setAccounts] = useState<BankAccountDto[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState('');
  const [bankAccountUuid, setBankAccountUuid] = useState('');

  useEffect(() => {
    let cancelled = false;
    listBankAccounts()
      .then(list => {
        if (cancelled) return;
        const activeList = list.filter(account => account.isActive);
        setAccounts(activeList);
        const defaultAccount = activeList.find(account => (isSales ? account.isDefaultReceivingAccount : account.isDefaultPaymentAccount)) ?? activeList[0];
        if (defaultAccount) setBankAccountUuid(defaultAccount.uuid);
      })
      .catch(err => {
        if (cancelled) return;
        setAccountsError(getFriendlyErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setAccountsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSales]);

  const otherDeductionsTotal = otherDeductions.reduce((sum, r) => sum + r.amount, 0);
  const depositAmount = amount - fee - otherDeductionsTotal;

  const handleClose = () => {
    // 已恢復但重新沖帳失敗時，關閉前一併通知父層重新載入，讓畫面反映已恢復的最新狀態
    if (reverted) onSaved();
    onClose();
  };

  const handleSubmit = async () => {
    if (amount <= 0) {
      setError('請輸入有效的沖帳金額');
      return;
    }
    if (!bankAccountUuid) {
      setError(isSales ? '請選擇收款戶頭' : '找不到可用的付款戶頭，請確認銀行帳戶設定');
      return;
    }
    if (depositAmount < 0) {
      setError('手續費與額外金額總和不可超過沖帳金額');
      return;
    }
    if (otherDeductions.some(r => !r.subject?.id || !r.name.trim() || r.amount <= 0)) {
      setError('請完整填寫額外金額的科目、名稱與金額');
      return;
    }
    const formattedDate = formatYmd(paymentDate);
    if (!formattedDate) {
      setError('請選擇沖帳日期');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await reverseManualSettle({ settleEventUuid: event.settleEventUuid });
    } catch (err) {
      // 步驟一失敗：原沖帳紀錄未變動，維持表單讓使用者可重試
      setSubmitting(false);
      setError(getFriendlyErrorMessage(err));
      return;
    }
    const allocations: SettleSummaryFee[] = fee > 0 ? [{ name: '手續費', feeAmount: fee }] : [];
    const otherDeductionsBody =
      otherDeductions.length > 0 ? otherDeductions.map(r => ({ name: r.name, amount: r.amount, officialAccountingSubjectId: r.subject!.id! })) : undefined;
    try {
      if (isSales) {
        await settleReceivable({
          ledgerUuid,
          paymentDate: formattedDate,
          bankAccountUuid,
          settleAmount: amount,
          depositAmount,
          memo: '',
          allocations,
          otherDeductions: otherDeductionsBody,
        });
      } else {
        await settlePayable({
          ledgerUuid,
          paymentDate: formattedDate,
          bankAccountUuid,
          settleAmount: amount,
          paymentAmount: depositAmount,
          memo: '',
          allocations,
          otherDeductions: otherDeductionsBody,
        });
      }
    } catch (err) {
      // 步驟二失敗：原紀錄已恢復，不可重試，改為提示使用者關閉後重新沖帳
      setSubmitting(false);
      setReverted(true);
      setError(`原沖帳紀錄已恢復，但新沖帳建立失敗，請重新沖帳。${getFriendlyErrorMessage(err, '')}`);
      return;
    }
    setSubmitting(false);
    onSaved();
    onClose();
  };

  return (
    <Modal open onClose={handleClose} title="編輯沖帳金額" widthClassName="max-w-[420px]">
      <div className="flex flex-col gap-4">
        <div>
          <Label required>沖帳日期</Label>
          <DatePicker value={paymentDate} onChange={setPaymentDate} disabled={reverted} />
        </div>
        {isSales && (
          <div>
            <Label required>收款戶頭</Label>
            {accountsLoading ? (
              <p className="text-xs text-neutral-mid">載入中…</p>
            ) : accountsError ? (
              <p className="text-xs text-semantic-error">{accountsError}</p>
            ) : accounts.length === 0 ? (
              <p className="text-xs text-semantic-error">尚無啟用中的銀行帳戶，請先於設定新增銀行帳戶</p>
            ) : (
              <Select widthClassName="w-full" value={bankAccountUuid} onValueChange={setBankAccountUuid} disabled={reverted}>
                {accounts.map(account => (
                  <option key={account.uuid} value={account.uuid}>
                    {account.accountName}（{account.bankName} {account.accountNo}）
                  </option>
                ))}
              </Select>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-neutral-dark">
            沖帳金額
            <span aria-hidden="true" className="ml-0.5 text-semantic-error">
              *
            </span>
          </span>
          <MoneyInput widthClassName="w-36" value={amount} onChange={setAmount} disabled={reverted} />
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-neutral-dark">各項手續費</span>
          <MoneyInput widthClassName="w-36" value={fee} onChange={setFee} disabled={reverted} />
        </div>

        {!reverted && (
          <OtherDeductionsEditor
            rows={otherDeductions}
            onAdd={handleAddOtherDeduction}
            onRemove={handleRemoveOtherDeduction}
            onChange={handleChangeOtherDeduction}
          />
        )}

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-neutral-dark">{isSales ? '存入金額' : '實際付款金額'}</span>
          <MoneyInput widthClassName="w-36" value={depositAmount} disabled readOnly />
        </div>
        {depositAmount < 0 && <p className="text-xs text-semantic-error">手續費與額外金額總和不可超過沖帳金額</p>}

        {error && <p className="text-xs text-semantic-error">{error}</p>}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        {reverted ? (
          <Button variant="primary" onClick={handleClose}>
            關閉
          </Button>
        ) : (
          <>
            <Button variant="danger" onClick={onClose} disabled={submitting}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '處理中…' : '儲存並重新沖帳'}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
