'use client';

import { updateChannelRule } from '@/api/channelRules';
import { updateVendor } from '@/api/vendors';
import type { ChannelRuleDto, VendorDto } from '@/api/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import MoneyInput from '@/components/ui/MoneyInput';
import { useEffect, useState } from 'react';
import type { ReconSide } from '../types';

interface ReconBalanceEditModalProps {
  open: boolean;
  side: ReconSide;
  /** 銷項時帶入對應銷售管道；進項時帶入對應廠商。PATCH 需要完整既有欄位，故直接沿用列表取得的完整 DTO */
  channelRule?: ChannelRuleDto;
  vendor?: VendorDto;
  onClose: () => void;
  /** 儲存成功後通知呼叫端重新拉取列表，讓側邊欄餘額與後續預覽/沖帳沿用最新值 */
  onSaved: () => void;
}

/**
 * 編輯銷售管道／廠商的「當前餘額」（新版 PATCH channelRules／vendors 支援）。
 * 後端 PATCH 為整批覆寫（非 partial patch），故沿用現有完整 DTO 帶出全部既有欄位，僅覆寫 balance。
 */
export default function ReconBalanceEditModal({ open, side, channelRule, vendor, onClose, onSaved }: ReconBalanceEditModalProps) {
  const record = side === 'receivable' ? channelRule : vendor;
  const [balance, setBalance] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setBalance(record?.balance ?? 0);
      setError('');
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record]);

  if (!open || !record) return null;

  const label = side === 'receivable' ? (channelRule as ChannelRuleDto).channelName : (vendor as VendorDto).name;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      if (side === 'receivable' && channelRule) {
        await updateChannelRule({
          uuid: channelRule.uuid,
          channelName: channelRule.channelName,
          settlementStyle: channelRule.settlementStyle,
          settlementAmount: channelRule.settlementAmount,
          receivingAccountUuid: channelRule.receivingAccountUuid,
          isActive: channelRule.isActive,
          remark: channelRule.remark,
          balance,
        });
      } else if (vendor) {
        await updateVendor({
          uuid: vendor.uuid,
          taxId: vendor.taxId,
          name: vendor.name,
          registeredAddress: vendor.registeredAddress,
          bankAccountName: vendor.bankAccountName,
          bankCode: vendor.bankCode,
          bankName: vendor.bankName,
          branchName: vendor.branchName,
          accountNo: vendor.accountNo,
          remark: vendor.remark,
          isActive: vendor.isActive,
          balance,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失敗');
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`編輯餘額－${label}`} widthClassName="max-w-[400px]">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-semibold text-neutral-dark">當前餘額</label>
        <MoneyInput widthClassName="w-40" value={balance} onChange={setBalance} />
      </div>
      {error && <p className="mt-3 text-sm text-semantic-error">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? '儲存中…' : '儲存'}
        </Button>
      </div>
    </Modal>
  );
}
