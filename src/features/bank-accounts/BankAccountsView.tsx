'use client';

import { listBankAccounts } from '@/api/bankAccounts';
import type { BankAccountDto } from '@/api/types';
import Button from '@/components/ui/Button';
import ExportRangeDialog from '@/components/ui/ExportRangeDialog';
import Pagination from '@/components/ui/Pagination';
import PeriodFilterBar from '@/components/ui/PeriodFilterBar';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { subMonths } from 'date-fns';
import { Download, Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import AccountSelector from './components/AccountSelector';
import AccountSummaryCard from './components/AccountSummaryCard';
import AddTransactionDialog from './components/AddTransactionDialog';
import TransactionCards from './components/TransactionCards';
import TransactionTable from './components/TransactionTable';
import { createBankCashMovement, loadBankTransactions } from './data';
import type { BankTxnRow, NewBankTransactionInput } from './types';
import { buildBankQueryString, parseBankFilters, withReturnParam } from './urlState';
import type { BankFilterState } from './urlState';

/** 交易列表每頁筆數，比照帳簿頁面固定 10 筆 */
const PAGE_LIMIT = 10;

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/** 「近一個月」預設查詢區間：今天往前推一個月為起始日，今天為結束日 */
function defaultRange(): { from: string; to: string } {
  const today = new Date();
  return { from: toYmd(subMonths(today, 1)), to: toYmd(today) };
}

export default function BankAccountsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 帳戶/期間篩選狀態的唯一事實來源是網址查詢字串；searchParams 字串沒變時 filters 維持同一物件參照
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filters = useMemo(() => parseBankFilters(searchParams), [searchParams.toString()]);

  const [accounts, setAccounts] = useState<BankAccountDto[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState('');

  const [transactions, setTransactions] = useState<BankTxnRow[]>([]);
  const [subjectNameById, setSubjectNameById] = useState<Map<number, string>>(new Map());
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnError, setTxnError] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  // 目前 inline 展開中的交易 id；換頁／換帳戶／套用期間時歸零，避免展開狀態對應到已不在畫面上的列
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const updateFilters = (patch: Partial<BankFilterState>) => {
    const next: BankFilterState = { ...filters, ...patch };
    const qs = buildBankQueryString(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  // 載入啟用中的銀行帳戶清單（僅顯示啟用帳戶，比照設定頁付款設定的作法）
  useEffect(() => {
    let cancelled = false;
    setAccountsLoading(true);
    setAccountsError('');
    listBankAccounts()
      .then(list => {
        if (cancelled) return;
        setAccounts(list.filter(a => a.isActive));
      })
      .catch(err => {
        if (cancelled) return;
        setAccountsError(getFriendlyErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setAccountsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedAccount = accounts.find(a => a.bankAccountUuid === filters.account) ?? accounts[0] ?? null;

  // 網址上的 account 參數缺少或指向不存在／已停用的帳戶時，補上目前選定帳戶，維持網址可分享、可重新整理
  useEffect(() => {
    if (!accountsLoading && selectedAccount && filters.account !== selectedAccount.bankAccountUuid) {
      updateFilters({ account: selectedAccount.bankAccountUuid });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountsLoading, selectedAccount?.bankAccountUuid]);

  const { from: defaultFrom, to: defaultTo } = defaultRange();
  const effectiveDateFrom = filters.dateFrom || defaultFrom;
  const effectiveDateTo = filters.dateTo || defaultTo;

  const reloadTransactions = async (bankAccountUuid: string) => {
    setTxnLoading(true);
    setTxnError('');
    try {
      const { rows, subjectNameById } = await loadBankTransactions(bankAccountUuid, effectiveDateFrom, effectiveDateTo);
      setTransactions(rows);
      setSubjectNameById(subjectNameById);
    } catch (err) {
      setTxnError(getFriendlyErrorMessage(err));
    } finally {
      setTxnLoading(false);
    }
  };

  // 切換帳戶或查詢期間時重新載入沖帳事件（期間篩選交給後端，一次取回全期資料供前端分頁與合計）
  useEffect(() => {
    if (!selectedAccount) return;
    let cancelled = false;
    setTxnLoading(true);
    setTxnError('');
    loadBankTransactions(selectedAccount.bankAccountUuid, effectiveDateFrom, effectiveDateTo)
      .then(({ rows, subjectNameById }) => {
        if (cancelled) return;
        setTransactions(rows);
        setSubjectNameById(subjectNameById);
      })
      .catch(err => {
        if (cancelled) return;
        setTxnError(getFriendlyErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setTxnLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount?.bankAccountUuid, effectiveDateFrom, effectiveDateTo]);

  // 存入／支出合計僅計入未恢復（撤銷）的事件，比照帳戶餘額的實際意義
  const depositTotal = useMemo(() => transactions.filter(r => !r.isReverse).reduce((sum, r) => sum + (r.deposit ?? 0), 0), [transactions]);
  const expenseTotal = useMemo(() => transactions.filter(r => !r.isReverse).reduce((sum, r) => sum + (r.expense ?? 0), 0), [transactions]);

  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_LIMIT));
  const pagedRows = transactions.slice((filters.page - 1) * PAGE_LIMIT, filters.page * PAGE_LIMIT);

  const handlePageChange = (page: number) => {
    setExpandedId(null);
    updateFilters({ page });
  };
  const handleApplyPeriod = (dateFrom: string, dateTo: string) => {
    setExpandedId(null);
    updateFilters({ dateFrom, dateTo, page: 1 });
  };
  const handleAccountChange = (uuid: string) => {
    setExpandedId(null);
    updateFilters({ account: uuid, page: 1 });
  };

  const handleCreate = async (input: NewBankTransactionInput) => {
    if (!selectedAccount) return;
    await createBankCashMovement(selectedAccount.bankAccountUuid, input);
    await reloadTransactions(selectedAccount.bankAccountUuid);
  };

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6">
          <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">銀行帳戶總覽</h1>
          <p className="mt-1 text-sm text-neutral-mid">檢視銀行帳戶進出帳交易紀錄</p>
        </div>

        {accountsLoading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
        ) : accountsError ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{accountsError}</div>
        ) : !selectedAccount ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">尚未設定銀行帳戶，請先至設定頁新增</div>
        ) : (
          <>
            <div className="mb-5 flex flex-col gap-3 nav:flex-row nav:items-end nav:justify-between">
              <div className="w-full nav:w-96">
                <label className="mb-1.5 block text-xs font-semibold text-neutral-mid">選擇帳戶</label>
                <AccountSelector accounts={accounts} value={selectedAccount.bankAccountUuid} onChange={handleAccountChange} />
              </div>
              <div className="flex gap-2.5">
                <Button variant="outline" icon={Download} disabled onClick={() => setExportOpen(true)}>
                  下載交易紀錄
                </Button>
                <Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>
                  新增交易
                </Button>
              </div>
            </div>

            <div className="mb-5">
              <AccountSummaryCard account={selectedAccount} depositTotal={depositTotal} expenseTotal={expenseTotal} />
            </div>

            <div className="mb-5">
              <PeriodFilterBar
                dateFrom={effectiveDateFrom}
                dateTo={effectiveDateTo}
                defaultDateFrom={defaultFrom}
                defaultDateTo={defaultTo}
                onApply={handleApplyPeriod}
              />
            </div>

            {txnLoading ? (
              <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入交易紀錄中…</div>
            ) : txnError ? (
              <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{txnError}</div>
            ) : (
              <>
                <TransactionTable
                  rows={pagedRows}
                  totalCount={transactions.length}
                  expandedId={expandedId}
                  onToggle={id => setExpandedId(prev => (prev === id ? null : id))}
                  detailHref={row => withReturnParam(`/bank-accounts/${row.settleEventUuid}?account=${selectedAccount.bankAccountUuid}`, searchParams)}
                  subjectNameById={subjectNameById}
                />
                <TransactionCards
                  rows={pagedRows}
                  expandedId={expandedId}
                  onToggle={id => setExpandedId(prev => (prev === id ? null : id))}
                  detailHref={row => withReturnParam(`/bank-accounts/${row.settleEventUuid}?account=${selectedAccount.bankAccountUuid}`, searchParams)}
                  subjectNameById={subjectNameById}
                />
                <Pagination page={filters.page} totalPages={totalPages} onPageChange={handlePageChange} />
              </>
            )}

            <AddTransactionDialog open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleCreate} />
            {/*
              下載交易紀錄：本階段僅示意，沿用既有的 ExportRangeDialog（尚未接上實際產檔邏輯，見其原始 stub 說明）。
              TODO: 待確認匯出格式（CSV/Excel）與欄位順序後，接上依目前查詢帳戶/期間產出檔案的實際邏輯。
            */}
            <ExportRangeDialog open={exportOpen} onClose={() => setExportOpen(false)} onExport={() => setExportOpen(false)} />
          </>
        )}
      </div>
    </div>
  );
}
