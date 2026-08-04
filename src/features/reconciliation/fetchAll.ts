import { fetchPayables, fetchReceivables } from '@/api/ledger';
import type { PayableListItemDto, ReceivableListItemDto } from '@/api/types';

/** 帳簿列表頁分頁瀏覽用 10 筆／頁；匯總沖帳需要一次拿到全部尚未沖帳的交易，故用較大頁面逐頁抓完 */
const PAGE_SIZE = 200;

/** 逐頁抓完 /ael/ledger/receivables/filter 全部尚未收款的應收帳款（無日期區間篩選＝全部） */
export async function fetchAllReceivables(): Promise<ReceivableListItemDto[]> {
  const items: ReceivableListItemDto[] = [];
  let page = 1;
  let total = Infinity;
  while (items.length < total) {
    const result = await fetchReceivables({ page, limit: PAGE_SIZE });
    total = result.total;
    if (result.items.length === 0) break;
    items.push(...result.items);
    page += 1;
  }
  return items;
}

/** 逐頁抓完 /ael/ledger/payables/filter 全部尚未付款的應付帳款（無日期區間篩選＝全部） */
export async function fetchAllPayables(): Promise<PayableListItemDto[]> {
  const items: PayableListItemDto[] = [];
  let page = 1;
  let total = Infinity;
  while (items.length < total) {
    const result = await fetchPayables({ page, limit: PAGE_SIZE });
    total = result.total;
    if (result.items.length === 0) break;
    items.push(...result.items);
    page += 1;
  }
  return items;
}
