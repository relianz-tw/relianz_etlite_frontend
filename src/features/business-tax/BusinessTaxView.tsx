'use client';

import Button from '@/components/ui/Button';
import ExportRangeDialog from '@/components/ui/ExportRangeDialog';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { fmtCurrency } from '@/lib/utils';
import { Download } from 'lucide-react';
import { useState } from 'react';
import FilterBar from './components/FilterBar';
import InvoiceCards from './components/InvoiceCards';
import InvoiceTable from './components/InvoiceTable';
import SummaryCards from './components/SummaryCards';
import TaxReportDialog from './components/TaxReportDialog';
import { FILING_PERIODS, PURCHASE_INVOICES, REPORT_SUMMARY, SALES_INVOICES } from './data';
import type { AdvancedFilter, TaxInvoiceRow, TaxSide } from './types';

const SIDE_TABS: { value: TaxSide; label: string }[] = [
  { value: 'purchase', label: '進項（含折讓）' },
  { value: 'sales', label: '銷項（含折讓）' },
];

const TOTAL_PAGES = 20;
const EMPTY_ADVANCED_FILTER: AdvancedFilter = { status: 'all', minAmount: '', maxAmount: '' };

/** 依關鍵字與進階條件過濾發票列：關鍵字比對發票號碼／往來對象／金額 */
function filterRows(rows: TaxInvoiceRow[], query: string, advanced: AdvancedFilter): TaxInvoiceRow[] {
  const keyword = query.trim().toLowerCase();
  const min = advanced.minAmount ? Number(advanced.minAmount) : undefined;
  const max = advanced.maxAmount ? Number(advanced.maxAmount) : undefined;

  return rows.filter(row => {
    if (keyword) {
      const haystack = `${row.id} ${row.counterparty} ${row.total}`.toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    if (min !== undefined && row.total < min) return false;
    if (max !== undefined && row.total > max) return false;
    if (advanced.status !== 'all' && row.status !== advanced.status) return false;
    return true;
  });
}

export default function BusinessTaxView() {
  const [side, setSide] = useState<TaxSide>('sales');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // 搜尋關鍵字：query 是輸入框當下內容，appliedQuery 是按下「搜尋」後才套用的條件
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [advanced, setAdvanced] = useState<AdvancedFilter>(EMPTY_ADVANCED_FILTER);
  const [appliedAdvanced, setAppliedAdvanced] = useState<AdvancedFilter>(EMPTY_ADVANCED_FILTER);

  const handleSearch = () => {
    setAppliedQuery(query);
    setPage(1);
  };
  // next 供「清除」按鈕使用：避免 onAdvancedChange 與 onAdvancedApply 連續呼叫時讀到尚未更新的 state
  const handleAdvancedApply = (next?: AdvancedFilter) => {
    setAppliedAdvanced(next ?? advanced);
    setPage(1);
  };

  const rawRows = side === 'sales' ? SALES_INVOICES : PURCHASE_INVOICES;
  const rows = filterRows(rawRows, appliedQuery, appliedAdvanced);
  const totalAmount = fmtCurrency(rows.reduce((sum, r) => sum + r.total, 0));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 py-7 nav:px-7">
        <div className="mb-6">
          <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">營業稅中心</h1>
          <p className="mt-1 text-sm text-neutral-mid">營業稅申報</p>
        </div>

        <div className="mb-5 w-64">
          <Select widthClassName="w-full">
            {FILING_PERIODS.map(p => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="mb-5">
          <SummaryCards />
        </div>

        <div className="mb-5">
          <FilterBar
            onOpenReport={() => setReportDialogOpen(true)}
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            advanced={advanced}
            onAdvancedChange={setAdvanced}
            onAdvancedApply={handleAdvancedApply}
          />
        </div>

        <div className="mb-3 w-64">
          <SegmentedControl options={SIDE_TABS} value={side} onChange={setSide} size="md" />
        </div>

        <InvoiceTable side={side} rows={rows} totalCount={rows.length} totalAmount={totalAmount} />
        <InvoiceCards side={side} rows={rows} totalCount={rows.length} totalAmount={totalAmount} />

        <Pagination
          page={page}
          totalPages={TOTAL_PAGES}
          onPageChange={setPage}
          rightSlot={
            <>
              <Button variant="ghost" icon={Download} onClick={() => setExportDialogOpen(true)}>
                匯出總表
              </Button>
              <ExportRangeDialog
                open={exportDialogOpen}
                onClose={() => setExportDialogOpen(false)}
                onExport={() => setExportDialogOpen(false)}
              />
            </>
          }
        />
      </div>

      <TaxReportDialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} summary={REPORT_SUMMARY} />
    </div>
  );
}
