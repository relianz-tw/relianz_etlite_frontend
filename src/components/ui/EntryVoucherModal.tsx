'use client';

import { fetchEntryDetail } from '@/api/ledger';
import type { EntryDetailResult } from '@/api/types';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { fmtCurrency } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Modal from './Modal';
import VoucherPreviewCard from './VoucherPreviewCard';

interface EntryVoucherModalProps {
  open: boolean;
  onClose: () => void;
  ledgerUuid: string;
  /** 決定買家／賣家標籤與統編來源，並帶入「查看原發票」連結的 side 參數 */
  side: 'sales' | 'purchase';
  /** 呼叫端已載入過同一筆的憑證明細時傳入，直接沿用不重打 API（如沖帳中心展開列已懶載入過） */
  preloadedDetail?: EntryDetailResult | null;
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
 * 憑證明細彈窗：查到指定交易後顯示完整憑證照片與資訊，供使用者確認這就是要折的那張發票／要查看的那筆交易。
 * 新增折讓單畫面（AllowanceOriginField）與沖帳中心（ReconTxnList）的「查看憑證明細」共用此彈窗，確保兩處
 * 呈現的資料與樣式完全一致。開新分頁導向原發票詳情，避免蓋掉正在填寫的表單或進行中的沖帳操作。
 * 有傳入 preloadedDetail 時直接沿用，不重打 GET /ael/ledger/entries/detail。
 */
export default function EntryVoucherModal({ open, onClose, ledgerUuid, side, preloadedDetail }: EntryVoucherModalProps) {
  const [fetchedDetail, setFetchedDetail] = useState<EntryDetailResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 已有呼叫端預載的資料時，開啟不重打 API；否則開啟後才查詢
  useEffect(() => {
    if (!open || preloadedDetail !== undefined) return;
    setFetchedDetail(null);
    setError('');
    setLoading(true);
    let cancelled = false;
    fetchEntryDetail({ ledgerUuid })
      .then(result => {
        if (!cancelled) setFetchedDetail(result);
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
  }, [open, ledgerUuid, preloadedDetail]);

  const detail = preloadedDetail !== undefined ? preloadedDetail : fetchedDetail;
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
            <VoucherPreviewCard voucherImage={invoice?.invoicePicUrl || null} minHeightClassName="min-h-[220px] nav:min-h-[480px]" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            {rows.map(row => (
              <div key={row.label} className="flex flex-col items-start gap-0.5 text-sm nav:flex-row nav:items-center nav:justify-between nav:gap-3">
                <span className="text-neutral-mid">{row.label}</span>
                <span className="break-all font-mono font-semibold tabular-nums text-neutral-dark">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
