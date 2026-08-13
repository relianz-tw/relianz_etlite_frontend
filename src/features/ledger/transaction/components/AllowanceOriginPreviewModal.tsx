'use client';

import { fetchEntryDetail } from '@/api/ledger';
import type { EntryDetailResult } from '@/api/types';
import Modal from '@/components/ui/Modal';
import VoucherPreviewCard from '@/components/ui/VoucherPreviewCard';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { fmtCurrency } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Side } from '../../types';

interface AllowanceOriginPreviewModalProps {
  open: boolean;
  onClose: () => void;
  ledgerUuid: string;
  side: Side;
}

interface DetailRow {
  label: string;
  value: string;
}

/** 民國年月日（各自獨立欄位）→ 'YYY/MM/DD' 字串；缺值時回傳 '—' */
function formatInvoiceDate(year: number, month: number, day: number): string {
  if (!year || !month || !day) return '—';
  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
}

/**
 * 新增折讓單畫面「查看憑證明細」彈窗：查到原單後顯示完整憑證照片與資訊，供使用者確認這就是要折的那張發票。
 * 開新分頁導向原發票詳情，避免蓋掉正在填寫的折讓表單（表單狀態僅存於 useState，離開頁面即遺失）。
 */
export default function AllowanceOriginPreviewModal({ open, onClose, ledgerUuid, side }: AllowanceOriginPreviewModalProps) {
  const [detail, setDetail] = useState<EntryDetailResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 開啟後才查詢，且同一筆 ledgerUuid 查過後不重打；ledgerUuid 變動（切換憑證號碼後重新打開）時需要重新查詢
  useEffect(() => {
    if (!open) return;
    setDetail(null);
    setError('');
    setLoading(true);
    let cancelled = false;
    fetchEntryDetail({ ledgerUuid })
      .then(result => {
        if (!cancelled) setDetail(result);
      })
      .catch(err => {
        if (!cancelled) setError(getFriendlyErrorMessage(err, '載入憑證明細失敗'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, ledgerUuid]);

  const entry = detail?.entry;
  const invoice = detail?.invoice ?? null;

  // 銷項的交易對象是買家、進項是賣家；統編緊接在名稱旁（見 TransactionMetaCard.tsx 的
  // [sellerTaxIdField, sellerNameField] 欄位配對慣例，統編在前、名稱在後）
  const counterpartyLabel = side === 'sales' ? '買家' : '賣家';
  const counterpartyTaxId = side === 'sales' ? invoice?.buyerTaxIdNumber : invoice?.sellerTaxIdNumber;

  // 欄位順序對齊交易細節頁「交易資訊」卡片（見 TransactionMetaCard.tsx 編輯模式）：
  // 發票號碼／開立日期／收入科目／銷售額／稅額／總金額／備註；交易編號、已沖／未沖金額為該頁沒有的
  // 補充資訊，穿插在對應欄位後方，查無憑證時個別欄位退回 '—'
  const rows: DetailRow[] = entry
    ? [
        { label: '交易編號', value: entry.orderCode },
        { label: `${counterpartyLabel}統一編號`, value: counterpartyTaxId || '—' },
        { label: `${counterpartyLabel}名稱`, value: entry.counterpartyName || '—' },
        { label: '憑證號碼', value: invoice ? `${invoice.invoiceTrack}${invoice.invoiceNumber}` : '—' },
        { label: '開立日期', value: invoice ? formatInvoiceDate(invoice.year, invoice.month, invoice.day) : '—' },
        { label: '科目', value: entry.subjectName },
        { label: '未稅', value: fmtCurrency(entry.netAmount) },
        { label: '稅額', value: fmtCurrency(entry.taxAmount) },
        { label: '總金額', value: fmtCurrency(entry.totalAmount) },
        { label: '已沖金額', value: fmtCurrency(entry.settledAmount) },
        { label: '未沖金額', value: fmtCurrency(entry.remainingAmount) },
        { label: '備註', value: invoice?.remark || '—' },
      ]
    : [];

  return (
    <Modal open={open} onClose={onClose} title="原始憑證" widthClassName="max-w-[840px]">
      <Link
        href={`/ledger/${ledgerUuid}?side=${side}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:underline"
      >
        查看原發票
        <ExternalLink size={14} />
      </Link>

      {loading ? (
        <p className="text-sm text-neutral-mid">載入中…</p>
      ) : error ? (
        <p className="text-sm text-semantic-error">{error}</p>
      ) : (
        <div className="flex flex-col gap-5 nav:flex-row">
          <div className="nav:w-[340px] nav:shrink-0">
            <VoucherPreviewCard voucherImage={invoice?.invoicePicUrl || null} />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            {rows.map(row => (
              <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-neutral-mid">{row.label}</span>
                <span className="font-mono font-semibold tabular-nums text-neutral-dark">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
