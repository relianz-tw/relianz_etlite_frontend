'use client';

import { fetchInvoiceOrigin } from '@/api/ledger';
import type { InvoiceOriginEntryDto } from '@/api/types';
import Button from '@/components/ui/Button';
import TextInput from '@/components/ui/TextInput';
import { formatRocDate } from '@/components/ui/DatePicker';
import EntryVoucherModal from '@/components/ui/EntryVoucherModal';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { fmtCurrency } from '@/lib/utils';
import { FileSearch, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Side } from '../../types';
import Field from './Field';

interface AllowanceOriginFieldProps {
  side: Side;
  invoiceTrack: string;
  invoiceSerial: string;
  /** 查詢結果變動時回報：ledgerUuid 供 originLedgerUuid 使用，origin 供帶入預設科目 */
  onResolve: (ledgerUuid: string, origin: InvoiceOriginEntryDto | null) => void;
  onInvoiceChange: (patch: { invoiceTrack?: string; invoiceSerial?: string }) => void;
  /** 查無原始憑證時使用者點「建立原始發票」：呼叫端切回「是否為折讓＝否」，讓使用者接續新增該筆發票 */
  onCreateOriginal: () => void;
}

/** 查無原始憑證時顯示的說明文字；後端對查無資料的情境是直接丟出錯誤（非 200 + invoice:null），
 *  訊息內容為「查無符合發票」，這裡統一改用較簡短的說明，下一步動作交由「建立原始發票」按鈕承擔 */
const NOT_FOUND_MESSAGE = '查無此發票，可能尚未建立該筆交易。';

/** 折讓建立畫面的「憑證號碼」輸入＋原單反查：輸入字軌＋流水號後 debounce 呼叫
 *  GET /ael/ledger/invoices/origin，查到則顯示原單摘要並可開啟憑證明細彈窗確認，查無則提供建立原始發票的動線。 */
export default function AllowanceOriginField({ side, invoiceTrack, invoiceSerial, onResolve, onInvoiceChange, onCreateOriginal }: AllowanceOriginFieldProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [origin, setOrigin] = useState<InvoiceOriginEntryDto | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const track = invoiceTrack.trim();
    const serial = invoiceSerial.trim();
    if (!track || !serial) {
      setOrigin(null);
      setError('');
      setNotFound(false);
      setLoading(false);
      onResolve('', null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    setNotFound(false);
    const timer = setTimeout(() => {
      fetchInvoiceOrigin({ invoiceTrack: track, invoiceNumber: serial })
        .then(result => {
          if (cancelled) return;
          if (result.invoice && result.entry) {
            setOrigin(result.entry);
            onResolve(result.entry.ledgerUuid, result.entry);
          } else {
            setOrigin(null);
            setNotFound(true);
            onResolve('', null);
          }
        })
        .catch(err => {
          if (cancelled) return;
          setOrigin(null);
          // 後端查無資料時是直接丟出錯誤（訊息含「查無」），非成功回應搭配 null 資料；
          // 這種情況一律視為「查無」呈現建立原始發票的動線，其餘技術性錯誤（如網路逾時）才顯示一般錯誤訊息
          const message = err instanceof Error ? err.message : '';
          if (/查無|找不到/.test(message)) {
            setNotFound(true);
          } else {
            setError(getFriendlyErrorMessage(err, '查詢原始憑證失敗'));
          }
          onResolve('', null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceTrack, invoiceSerial]);

  return (
    <Field label="憑證號碼" required helper="請輸入欲折讓之原始憑證的發票字軌與流水號">
      <div className="flex gap-2">
        <TextInput
          widthClassName="w-16"
          placeholder="字軌"
          maxLength={2}
          value={invoiceTrack}
          onChange={e => onInvoiceChange({ invoiceTrack: e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase() })}
        />
        <TextInput
          widthClassName="flex-1"
          placeholder="流水號"
          maxLength={8}
          value={invoiceSerial}
          onChange={e => onInvoiceChange({ invoiceSerial: e.target.value })}
        />
      </div>
      {loading && <p className="mt-1.5 text-xs text-neutral-mid">查詢原始憑證中…</p>}
      {!loading && error && <p className="mt-1.5 text-xs text-semantic-error">{error}</p>}
      {!loading && !error && origin && (
        <div className="mt-1.5 rounded-md bg-surface-cream p-3 text-xs text-neutral-mid">
          <p className="font-semibold text-neutral-dark">
            原始憑證：{origin.orderCode}
            {origin.counterpartyName ? ` · ${origin.counterpartyName}` : ''}
          </p>
          <p className="mt-1">
            {formatRocDate(origin.transactionDate ? new Date(origin.transactionDate) : undefined)}　{fmtCurrency(origin.totalAmount)}
            （可折讓 {fmtCurrency(origin.remainingAmount)}）
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={FileSearch}
            className="mt-2"
            onClick={() => setPreviewOpen(true)}
          >
            查看憑證明細
          </Button>
          <EntryVoucherModal open={previewOpen} onClose={() => setPreviewOpen(false)} ledgerUuid={origin.ledgerUuid} side={side} />
        </div>
      )}
      {!loading && !error && notFound && (
        <div className="mt-1.5 rounded-md bg-surface-cream p-3 text-xs text-neutral-mid">
          <p>{NOT_FOUND_MESSAGE}</p>
          <Button type="button" variant="outline" size="sm" icon={Plus} className="mt-2" onClick={onCreateOriginal}>
            建立原始發票
          </Button>
        </div>
      )}
    </Field>
  );
}
