import type { DailyDetailLineDto } from '@/api/types';
import { formatYyyymmddRoc } from '@/lib/utils';

export interface JournalVoucher {
  voucherNo: string;
  ledgerUuid: string;
  lines: DailyDetailLineDto[];
}

export interface JournalDateGroup {
  /** 傳票日期 YYYMMDD */
  dateKey: string;
  /** 民國 YYY/MM/DD，供分組標頭顯示 */
  label: string;
  vouchers: JournalVoucher[];
}

/**
 * 依傳票日期（rocDate）分組；同日期內依 voucherNo 升冪再依 sortOrder 升冪，日期組間由新到舊。
 * rocDate 為民國 YYYMMDD，formatYyyymmddRoc 可正確處理 7 位格式。
 */
export function groupJournalLinesByDate(lines: DailyDetailLineDto[]): JournalDateGroup[] {
  const sorted = [...lines].sort((a, b) => {
    if (a.rocDate !== b.rocDate) return b.rocDate.localeCompare(a.rocDate);
    if (a.voucherNo !== b.voucherNo) return a.voucherNo.localeCompare(b.voucherNo);
    return a.sortOrder - b.sortOrder;
  });

  const dateMap = new Map<string, Map<string, JournalVoucher>>();
  for (const line of sorted) {
    let voucherMap = dateMap.get(line.rocDate);
    if (!voucherMap) {
      voucherMap = new Map();
      dateMap.set(line.rocDate, voucherMap);
    }
    let voucher = voucherMap.get(line.voucherNo);
    if (!voucher) {
      voucher = { voucherNo: line.voucherNo, ledgerUuid: line.ledgerUuid, lines: [] };
      voucherMap.set(line.voucherNo, voucher);
    }
    voucher.lines.push(line);
  }

  return Array.from(dateMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dateKey, voucherMap]) => ({
      dateKey,
      label: formatYyyymmddRoc(dateKey),
      vouchers: Array.from(voucherMap.values()),
    }));
}
