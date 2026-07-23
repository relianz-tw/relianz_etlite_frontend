'use client';

import SegmentedControl from '@/components/ui/SegmentedControl';
import { Fragment, useState } from 'react';
import FilterBar from './components/FilterBar';
import LedgerCards from './components/LedgerCards';
import LedgerTable from './components/LedgerTable';
import Pagination from './components/Pagination';
import SummaryCards from './components/SummaryCards';
import { PURCHASE_PAID, PURCHASE_PAYABLE, SALES_RECEIVABLE, SALES_RECEIVED, fmtCurrency } from './data';
import type { PurchaseSubTab, SalesSubTab, Side } from './types';

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

  const salesRows = salesSubTab === 'received' ? SALES_RECEIVED : SALES_RECEIVABLE;
  const purchaseRows = purchaseSubTab === 'paid' ? PURCHASE_PAID : PURCHASE_PAYABLE;
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
          <FilterBar side={side} />
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

        <Pagination page={page} totalPages={TOTAL_PAGES} onPageChange={setPage} />
      </div>
    </div>
  );
}
