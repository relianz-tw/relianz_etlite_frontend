'use client';

import { fetchInvoiceOrigin } from '@/api/ledger';
import type { InvoiceOriginEntryDto } from '@/api/types';
import TextInput from '@/components/ui/TextInput';
import { formatRocDate } from '@/components/ui/DatePicker';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { fmtCurrency } from '@/lib/utils';
import { useEffect, useState } from 'react';
import Field from './Field';

interface AllowanceOriginFieldProps {
  invoiceTrack: string;
  invoiceSerial: string;
  /** 查詢結果變動時回報：ledgerUuid 供 originLedgerUuid 使用，origin 供帶入預設科目 */
  onResolve: (ledgerUuid: string, origin: InvoiceOriginEntryDto | null) => void;
  onInvoiceChange: (patch: { invoiceTrack?: string; invoiceSerial?: string }) => void;
}

/** 查無原始憑證時顯示的說明文字；後端對查無資料的情境是直接丟出錯誤（非 200 + invoice:null），
 *  訊息內容為「查無符合發票」，這裡統一改用較完整的說明取代，讓使用者知道下一步該做什麼 */
const NOT_FOUND_MESSAGE = '查無符合的原始憑證，請確認發票字軌與流水號是否正確；若該筆進項/銷項尚未建立，請先新增該筆原始憑證的交易後再回來開立折讓單。';

/** 折讓建立畫面的「憑證號碼」輸入＋原單反查：輸入字軌＋流水號後 debounce 呼叫
 *  GET /ael/ledger/invoices/origin，查到才顯示原單摘要並開放送出，查無則提示先新增原始憑證。 */
export default function AllowanceOriginField({ invoiceTrack, invoiceSerial, onResolve, onInvoiceChange }: AllowanceOriginFieldProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [origin, setOrigin] = useState<InvoiceOriginEntryDto | null>(null);

  useEffect(() => {
    const track = invoiceTrack.trim();
    const serial = invoiceSerial.trim();
    if (!track || !serial) {
      setOrigin(null);
      setError('');
      setLoading(false);
      onResolve('', null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    const timer = setTimeout(() => {
      fetchInvoiceOrigin({ invoiceTrack: track, invoiceNumber: serial })
        .then(result => {
          if (cancelled) return;
          if (result.invoice && result.entry) {
            setOrigin(result.entry);
            setError('');
            onResolve(result.entry.ledgerUuid, result.entry);
          } else {
            setOrigin(null);
            setError(NOT_FOUND_MESSAGE);
            onResolve('', null);
          }
        })
        .catch(err => {
          if (cancelled) return;
          setOrigin(null);
          // 後端查無資料時是直接丟出錯誤（訊息含「查無」），非成功回應搭配 null 資料；
          // 統一改用較完整的說明取代原始後端訊息，其餘技術性錯誤（如網路逾時）才顯示一般錯誤訊息
          const message = err instanceof Error ? err.message : '';
          setError(/查無|找不到/.test(message) ? NOT_FOUND_MESSAGE : getFriendlyErrorMessage(err, '查詢原始憑證失敗'));
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
        </div>
      )}
    </Field>
  );
}
