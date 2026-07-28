'use client';

import Button from '@/components/ui/Button';
import ExportRangeDialog from '@/components/ui/ExportRangeDialog';
import Pagination from '@/components/ui/Pagination';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { fmtCurrency, sortRows } from '@/lib/utils';
import { Download } from 'lucide-react';
import { Fragment, useState } from 'react';
import FilterBar from './components/FilterBar';
import LedgerCards from './components/LedgerCards';
import LedgerTable from './components/LedgerTable';
import SummaryCards from './components/SummaryCards';
import { PURCHASE_PAID, PURCHASE_PAYABLE, SALES_RECEIVABLE, SALES_RECEIVED } from './data';
import type { AdvancedFilter, PurchaseSubTab, PurchaseRow, QuickSearchField, SalesRow, SalesSubTab, Side, SortKey, SortState } from './types';

const EMPTY_ADVANCED_FILTER: AdvancedFilter = {
  status: 'all',
  minAmount: '',
  maxAmount: '',
  dateFrom: '',
  dateTo: '',
  counterparty: '',
  channel: '',
  category: '',
  project: '',
};

const getCounterparty = (row: SalesRow | PurchaseRow) => ('counterparty' in row ? row.counterparty : row.party);

const DEFAULT_SORT: SortState = { key: null, dir: 'none' };

/** 各排序欄位對應的取值方式，供 sortRows 共用；counterparty 統一取買受人/賣家名稱/交易敘述 */
const SORT_KEY_FN: Record<SortKey, (row: SalesRow | PurchaseRow) => string | number> = {
  id: row => row.id,
  amount: row => row.amount,
  counterparty: row => getCounterparty(row),
  date: row => row.date,
};

/** 依簡易搜尋（單一欄位）與進階條件（可組合套用）過濾帳簿列；side 專屬欄位（銷售管道／費用類別／專案）僅在對應資料上生效 */
function filterRows<T extends SalesRow | PurchaseRow>(rows: T[], quickField: QuickSearchField, quickValue: string, advanced: AdvancedFilter): T[] {
  const keyword = quickValue.trim().toLowerCase();
  const min = advanced.minAmount ? Number(advanced.minAmount) : undefined;
  const max = advanced.maxAmount ? Number(advanced.maxAmount) : undefined;
  const counterpartyKeyword = advanced.counterparty.trim().toLowerCase();

  return rows.filter(row => {
    if (keyword) {
      let value = '';
      if (quickField === 'id') value = row.id;
      else if (quickField === 'counterparty') value = getCounterparty(row);
      else if (quickField === 'channel' && 'channel' in row) value = row.channel;
      else if (quickField === 'category' && 'category' in row) value = row.category;
      else if (quickField === 'project' && 'project' in row) value = row.project;
      if (!value.toLowerCase().includes(keyword)) return false;
    }
    if (min !== undefined && row.amount < min) return false;
    if (max !== undefined && row.amount > max) return false;
    if (advanced.dateFrom && row.date < advanced.dateFrom) return false;
    if (advanced.dateTo && row.date > advanced.dateTo) return false;
    if (counterpartyKeyword && !getCounterparty(row).toLowerCase().includes(counterpartyKeyword)) return false;
    if (advanced.channel && 'channel' in row && row.channel !== advanced.channel) return false;
    if (advanced.category && 'category' in row && row.category !== advanced.category) return false;
    if (advanced.project && 'project' in row && row.project !== advanced.project) return false;
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

  // 簡易搜尋：quickField/query 是輸入框當下內容，appliedQuickField/appliedQuery 是按下「搜尋」後才套用的條件
  const [quickField, setQuickField] = useState<QuickSearchField>('id');
  const [query, setQuery] = useState('');
  const [appliedQuickField, setAppliedQuickField] = useState<QuickSearchField>('id');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [advanced, setAdvanced] = useState<AdvancedFilter>(EMPTY_ADVANCED_FILTER);
  const [appliedAdvanced, setAppliedAdvanced] = useState<AdvancedFilter>(EMPTY_ADVANCED_FILTER);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);

  // 桌機表頭三態循環：none → asc → desc → none；切換到不同欄位時重新從 asc 開始
  const handleSortToggle = (key: SortKey) => {
    setSort(prev => {
      if (prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return DEFAULT_SORT;
    });
  };
  // 手機排序入口：下拉直接指定欄位（預設 asc），方向鈕只切換 asc/desc（選「不排序」才回到 none）
  const handleSortFieldChange = (key: SortKey | null) => setSort(key ? { key, dir: 'asc' } : DEFAULT_SORT);
  const handleSortDirToggle = () => setSort(prev => (prev.key ? { key: prev.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : prev));

  const handleSearch = () => {
    setAppliedQuickField(quickField);
    setAppliedQuery(query);
    setPage(1);
  };
  const handleClearQuick = () => {
    setQuery('');
    setAppliedQuery('');
    setPage(1);
  };
  // next 供「清除」按鈕使用：避免 onAdvancedChange 與 onAdvancedApply 連續呼叫時讀到尚未更新的 state
  const handleAdvancedApply = (next?: AdvancedFilter) => {
    setAppliedAdvanced(next ?? advanced);
    setPage(1);
  };

  // 銷售管道／費用類別／專案為身分別專屬欄位，切換銷項／進項時重設簡易搜尋，避免帶著不相干欄位查詢
  const handleSideChange = (v: Side) => {
    setSide(v);
    setQuickField('id');
    setQuery('');
    setAppliedQuickField('id');
    setAppliedQuery('');
    setSort(DEFAULT_SORT);
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
  const filteredSalesRows = filterRows(rawSalesRows, appliedQuickField, appliedQuery, appliedAdvanced);
  // 進項無 voided 欄位，狀態條件對進項無效果
  const filteredPurchaseRows = filterRows(rawPurchaseRows, appliedQuickField, appliedQuery, appliedAdvanced);
  // 排序接在過濾之後：桌機表格與手機卡片共用同一份已排序資料，展開子列 (children) 只排父列、不受影響
  const sortKeyFn = sort.key ? SORT_KEY_FN[sort.key] : null;
  const salesRows = sortKeyFn ? sortRows(filteredSalesRows, sortKeyFn, sort.dir) : filteredSalesRows;
  const purchaseRows = sortKeyFn ? sortRows(filteredPurchaseRows, sortKeyFn, sort.dir) : filteredPurchaseRows;
  const rows = side === 'sales' ? salesRows : purchaseRows;
  const totalAmount = fmtCurrency(rows.reduce((sum, r) => sum + r.amount, 0));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 py-7 nav:px-7">
        <div className="mb-6">
          <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">帳簿</h1>
          <p className="mt-1 text-sm text-neutral-mid">有開立發票或收據的交易</p>
        </div>

        <div className="mb-5">
          <SummaryCards side={side} />
        </div>

        <div className="mb-5">
          <FilterBar
            side={side}
            quickField={quickField}
            onQuickFieldChange={setQuickField}
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            onClearQuick={handleClearQuick}
            advanced={advanced}
            onAdvancedChange={setAdvanced}
            onAdvancedApply={handleAdvancedApply}
          />
        </div>

        <div className="mb-3 flex flex-col gap-2 nav:flex-row nav:gap-3">
          <div className="w-full nav:w-56">
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
          <div className="w-full nav:w-56">
            <SegmentedControl
              options={side === 'sales' ? SALES_SUB_TABS : PURCHASE_SUB_TABS}
              value={side === 'sales' ? salesSubTab : purchaseSubTab}
              onChange={v => (side === 'sales' ? handleSalesSubTabChange(v as SalesSubTab) : handlePurchaseSubTabChange(v as PurchaseSubTab))}
              size="md"
            />
          </div>
        </div>

        {side === 'sales' ? (
          <Fragment key={`sales-${salesSubTab}`}>
            <LedgerTable
              side="sales"
              subTab={salesSubTab}
              rows={salesRows}
              totalCount={rows.length}
              totalAmount={totalAmount}
              sort={sort}
              onSortToggle={handleSortToggle}
            />
            <LedgerCards
              side="sales"
              subTab={salesSubTab}
              rows={salesRows}
              totalCount={rows.length}
              totalAmount={totalAmount}
              sort={sort}
              onSortFieldChange={handleSortFieldChange}
              onSortDirToggle={handleSortDirToggle}
            />
          </Fragment>
        ) : (
          <Fragment key={`purchase-${purchaseSubTab}`}>
            <LedgerTable
              side="purchase"
              subTab={purchaseSubTab}
              rows={purchaseRows}
              totalCount={rows.length}
              totalAmount={totalAmount}
              sort={sort}
              onSortToggle={handleSortToggle}
            />
            <LedgerCards
              side="purchase"
              subTab={purchaseSubTab}
              rows={purchaseRows}
              totalCount={rows.length}
              totalAmount={totalAmount}
              sort={sort}
              onSortFieldChange={handleSortFieldChange}
              onSortDirToggle={handleSortDirToggle}
            />
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
