'use client';

import Button from '@/components/ui/Button';
import ExportRangeDialog from '@/components/ui/ExportRangeDialog';
import Pagination from '@/components/ui/Pagination';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { fmtCurrency } from '@/lib/utils';
import { Download } from 'lucide-react';
import { Fragment, useState } from 'react';
import FilterBar from './components/FilterBar';
import LedgerCards from './components/LedgerCards';
import LedgerTable from './components/LedgerTable';
import SummaryCards from './components/SummaryCards';
import { PURCHASE_PAID, PURCHASE_PAYABLE, SALES_RECEIVABLE, SALES_RECEIVED } from './data';
import type { AdvancedFilter, PurchaseSubTab, PurchaseRow, SalesRow, SalesSubTab, Side } from './types';

const EMPTY_ADVANCED_FILTER: AdvancedFilter = { status: 'all', minAmount: '', maxAmount: '' };

/** 依關鍵字與進階條件過濾帳簿列：關鍵字比對交易編號／往來對象／金額，狀態與金額區間僅套用於銷項 */
function filterRows<T extends SalesRow | PurchaseRow>(rows: T[], query: string, advanced: AdvancedFilter): T[] {
  const keyword = query.trim().toLowerCase();
  const min = advanced.minAmount ? Number(advanced.minAmount) : undefined;
  const max = advanced.maxAmount ? Number(advanced.maxAmount) : undefined;

  return rows.filter(row => {
    if (keyword) {
      const counterparty = 'counterparty' in row ? row.counterparty : row.party;
      const haystack = `${row.id} ${counterparty} ${row.amount}`.toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    if (min !== undefined && row.amount < min) return false;
    if (max !== undefined && row.amount > max) return false;
    if (advanced.status !== 'all' && 'voided' in row) {
      const isVoided = row.voided;
      if (advanced.status === 'voided' && !isVoided) return false;
      if (advanced.status === 'normal' && isVoided) return false;
    }
    return true;
  });
}

const SALES_SUB_TABS: { value: SalesSubTab; label: string }[] = [
  { value: 'receivable', label: '應收帳款' },
  { value: 'received', label: '已收款' },
];
const PURCHASE_SUB_TABS: { value: PurchaseSubTab; label: string }[] = [
  { value: 'payable', label: '應付帳款' },
  { value: 'paid', label: '已付款' },
];

const TOTAL_PAGES = 20;

export default function LedgerView() {
  const [side, setSide] = useState<Side>('sales');
  const [salesSubTab, setSalesSubTab] = useState<SalesSubTab>('received');
  const [purchaseSubTab, setPurchaseSubTab] = useState<PurchaseSubTab>('paid');
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

  const handleSideChange = (v: Side) => {
    setSide(v);
    setPage(1);
  };
  const handleSalesSubTabChange = (v: SalesSubTab) => {
    setSalesSubTab(v);
    setPage(1);
  };
  const handlePurchaseSubTabChange = (v: PurchaseSubTab) => {
    setPurchaseSubTab(v);
    setPage(1);
  };

  const rawSalesRows = salesSubTab === 'received' ? SALES_RECEIVED : SALES_RECEIVABLE;
  const rawPurchaseRows = purchaseSubTab === 'paid' ? PURCHASE_PAID : PURCHASE_PAYABLE;
  const salesRows = filterRows(rawSalesRows, appliedQuery, appliedAdvanced);
  // 進項無 voided 欄位，狀態條件對進項無效果，僅套用關鍵字與金額區間
  const purchaseRows = filterRows(rawPurchaseRows, appliedQuery, appliedAdvanced);
  const rows = side === 'sales' ? salesRows : purchaseRows;
  const totalAmount = fmtCurrency(rows.reduce((sum, r) => sum + r.amount, 0));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 py-7 nav:px-7">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">帳簿</h1>
            <p className="mt-1 text-sm text-neutral-mid">有開立發票或收據的交易</p>
          </div>
          <div className="w-64 shrink-0">
            <SegmentedControl
              options={[
                { value: 'sales', label: '銷項' },
                { value: 'purchase', label: '進項' },
              ]}
              value={side}
              onChange={handleSideChange}
              size="md"
            />
          </div>
        </div>

        <div className="mb-5">
          <SummaryCards side={side} />
        </div>

        <div className="mb-5">
          <FilterBar
            side={side}
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            advanced={advanced}
            onAdvancedChange={setAdvanced}
            onAdvancedApply={handleAdvancedApply}
          />
        </div>

        <div className="mb-3 w-64">
          <SegmentedControl
            options={side === 'sales' ? SALES_SUB_TABS : PURCHASE_SUB_TABS}
            value={side === 'sales' ? salesSubTab : purchaseSubTab}
            onChange={v => (side === 'sales' ? handleSalesSubTabChange(v as SalesSubTab) : handlePurchaseSubTabChange(v as PurchaseSubTab))}
            size="md"
          />
        </div>

        {side === 'sales' ? (
          <Fragment key={`sales-${salesSubTab}`}>
            <LedgerTable side="sales" subTab={salesSubTab} rows={salesRows} totalCount={rows.length} totalAmount={totalAmount} />
            <LedgerCards side="sales" subTab={salesSubTab} rows={salesRows} totalCount={rows.length} totalAmount={totalAmount} />
          </Fragment>
        ) : (
          <Fragment key={`purchase-${purchaseSubTab}`}>
            <LedgerTable side="purchase" subTab={purchaseSubTab} rows={purchaseRows} totalCount={rows.length} totalAmount={totalAmount} />
            <LedgerCards side="purchase" subTab={purchaseSubTab} rows={purchaseRows} totalCount={rows.length} totalAmount={totalAmount} />
          </Fragment>
        )}

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
    </div>
  );
}
