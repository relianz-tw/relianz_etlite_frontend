'use client';

import { fetchReconciliationPayables } from '@/api/ledger';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { cn, fmtCurrency } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { payableGroupsToCandidates, type ReconCandidate } from '../data';
import type { ReconTxnRef } from '../types';

const ALL_VENDOR_KEY = '__ALL__';

interface ReconVoucherPickerDialogProps {
  open: boolean;
  onClose: () => void;
  /** 需選滿的目標金額（電商平台扣款輸入金額的絕對值） */
  targetAmount: number;
  /** 目前已選的憑證（開啟對話框時帶入，供使用者調整） */
  selected: ReconTxnRef[];
  onConfirm: (rows: ReconTxnRef[]) => void;
}

function toTxnRef(c: ReconCandidate): ReconTxnRef {
  return {
    uuid: c.uuid,
    orderCode: c.orderCode,
    amount: c.amount,
    date: c.date,
    counterparty: c.counterparty,
    voucherNumber: c.voucherNumber,
    channelUuid: c.groupUuid,
    remainingAmount: c.remainingAmount,
  };
}

/**
 * 電商平台扣款的憑證選擇彈窗：從未結清應付交易（GET /ael/ledger/reconciliation/payables?settled=false，
 * 與沖帳中心同一支 API，一次全撈不分頁）挑選單張或多張，供使用者佐證處理費金額。
 * 選擇結果除了前端強制驗證「金額須等值」外，主沖帳送出成功後會逐張呼叫手動沖帳應付 API 全額沖銷
 * （見 ReconciliationView 的 platformFeeVouchers、settle.ts 的 submitPlatformFeeVoucherSettles）。
 * 左下角「新增進項交易」供使用者尚無對應應付憑證時直接跳去新增（/ledger/new?side=purchase）。
 */
export default function ReconVoucherPickerDialog({ open, onClose, targetAmount, selected, onConfirm }: ReconVoucherPickerDialogProps) {
  const router = useRouter();
  const [candidates, setCandidates] = useState<ReconCandidate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [vendorKey, setVendorKey] = useState(ALL_VENDOR_KEY);
  const [pickedUuids, setPickedUuids] = useState<Set<string>>(new Set());
  // 已勾選交易的完整資料快照：候選清單重新載入或被搜尋條件濾掉時，已勾選列仍要能算入合計，
  // 故另外保留一份不受目前 candidates／篩選影響的查找表
  const [rowsByUuid, setRowsByUuid] = useState<Map<string, ReconTxnRef>>(new Map());

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setVendorKey(ALL_VENDOR_KEY);
    setPickedUuids(new Set(selected.map(r => r.uuid)));
    setRowsByUuid(new Map(selected.map(r => [r.uuid, r])));
    setError('');
    let cancelled = false;
    setLoading(true);
    fetchReconciliationPayables({ settled: 'false' })
      .then(groups => {
        if (cancelled) return;
        const list = payableGroupsToCandidates(groups);
        setCandidates(list);
        setRowsByUuid(prev => {
          const next = new Map(prev);
          list.forEach(c => next.set(c.uuid, toTxnRef(c)));
          return next;
        });
      })
      .catch(err => {
        if (!cancelled) setError(getFriendlyErrorMessage(err, '載入應付交易失敗'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const vendorOptions = useMemo(() => {
    const names = new Map<string, string>();
    (candidates ?? []).forEach(c => {
      if (c.groupUuid) names.set(c.groupUuid, c.counterparty);
    });
    return Array.from(names.entries());
  }, [candidates]);

  const filteredRows = useMemo(() => {
    const value = query.trim();
    return (candidates ?? [])
      .filter(c => vendorKey === ALL_VENDOR_KEY || c.groupUuid === vendorKey)
      .filter(c => !value || c.counterparty.includes(value) || c.orderCode.includes(value) || c.voucherNumber.includes(value))
      .map(toTxnRef);
  }, [candidates, query, vendorKey]);

  const pickedRows = useMemo(() => Array.from(pickedUuids).map(uuid => rowsByUuid.get(uuid)).filter((r): r is ReconTxnRef => !!r), [pickedUuids, rowsByUuid]);
  const pickedTotal = pickedRows.reduce((sum, r) => sum + r.amount, 0);
  const diff = targetAmount - pickedTotal;

  if (!open) return null;

  const toggleRow = (uuid: string) => {
    setPickedUuids(prev => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
  };

  const handleConfirm = () => {
    if (diff !== 0) return;
    onConfirm(pickedRows);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="選擇應付憑證" widthClassName="max-w-[720px]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 min-[1300px]:flex-row">
          <TextInput
            widthClassName="w-full flex-1"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜尋廠商、憑證號碼或交易編號"
          />
          <Select widthClassName="w-full min-[1300px]:w-44" value={vendorKey} onValueChange={setVendorKey}>
            <option value={ALL_VENDOR_KEY}>全部廠商</option>
            {vendorOptions.map(([uuid, name]) => (
              <option key={uuid} value={uuid}>
                {name}
              </option>
            ))}
          </Select>
        </div>

        {error && <p className="text-xs text-semantic-error">{error}</p>}

        <div className="max-h-[45vh] overflow-y-auto rounded-lg border border-neutral-blue-gray/30">
          {loading && <p className="p-4 text-center text-sm text-neutral-mid">載入中…</p>}
          {!loading && filteredRows.length === 0 && <p className="p-4 text-center text-sm text-neutral-mid">查無符合條件的應付交易</p>}
          {!loading &&
            filteredRows.map(row => {
              const checked = pickedUuids.has(row.uuid);
              return (
                <button
                  key={row.uuid}
                  type="button"
                  onClick={() => toggleRow(row.uuid)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-neutral-blue-gray/20 px-3 py-2.5 text-left text-sm transition-colors last:border-b-0 hover:bg-surface-cream',
                    checked && 'bg-brand-blue/5',
                  )}
                >
                  <Checkbox checked={checked} onChange={() => toggleRow(row.uuid)} aria-label={`選擇 ${row.orderCode}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-neutral-dark">
                      {row.date} · {row.voucherNumber || '無憑證號碼'} · {row.counterparty}
                    </p>
                    <p className="truncate text-xs text-neutral-mid">{row.orderCode}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono font-medium tabular-nums text-neutral-dark">{fmtCurrency(row.amount)}</p>
                    <p className="text-xs text-neutral-mid">待付 {fmtCurrency(row.remainingAmount ?? row.amount)}</p>
                  </div>
                </button>
              );
            })}
        </div>

        <div className="flex flex-col items-stretch gap-2 rounded-md bg-surface-cream p-3 text-sm min-[1300px]:flex-row min-[1300px]:items-center min-[1300px]:justify-between">
          <span className="text-neutral-dark">
            已選 {pickedRows.length} 筆 · 合計 {fmtCurrency(pickedTotal)} ／ 應等於 {fmtCurrency(targetAmount)}
          </span>
          <span className={cn('font-semibold', diff === 0 ? 'text-semantic-success' : 'text-semantic-error')}>
            差額 {fmtCurrency(Math.abs(diff))}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 min-[1300px]:flex-row min-[1300px]:items-center min-[1300px]:justify-between">
        <Button variant="outline" icon={Plus} onClick={() => router.push('/ledger/new?side=purchase')}>
          新增進項交易
        </Button>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={diff !== 0}>
            確認
          </Button>
        </div>
      </div>
    </Modal>
  );
}
