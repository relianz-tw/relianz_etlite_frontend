import { parseSideParam } from '@/features/ledger/transaction/data';
import VatInvoiceDetailView from '@/features/business-tax/invoice/VatInvoiceDetailView';
import { parseReturnQueryParam } from '@/features/business-tax/urlState';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '憑證細節 | Easytax Lite',
};

/** 網址參數 void：列表連結帶入的作廢狀態，因 GET /ael/ledger/entries/detail 回應未提供此欄位（見
 *  InvoiceDeclareStatusCard 說明），暫以此權宜傳遞；直接輸入網址進入時無此參數，一律視為正常 */
function parseVoidParam(value: string | string[] | undefined): boolean {
  const first = Array.isArray(value) ? value[0] : value;
  return first === '1';
}

export default function VatInvoiceDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { side?: string | string[]; void?: string | string[]; from?: string | string[] };
}) {
  const side = parseSideParam(searchParams.side);
  const isVoid = parseVoidParam(searchParams.void);
  const returnQuery = parseReturnQueryParam(searchParams.from);
  return <VatInvoiceDetailView side={side} ledgerUuid={params.id} isVoid={isVoid} returnQuery={returnQuery} />;
}
