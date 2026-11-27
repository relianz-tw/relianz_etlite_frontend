'use client';

import { StepPageHeader } from '@/components/initialization/StepPageHeader';
import Label from '@/components/ui/Label';
import SectionCard from '@/components/ui/SectionCard';
import Select from '@/components/ui/Select';
import BankAccountCard from '@/features/settings/components/BankAccountCard';
import BankAccountCreateForm from '@/features/settings/components/BankAccountCreateForm';
import ConfirmDeleteDialog from '@/features/settings/components/ConfirmDeleteDialog';
import type { BankAccountRecord } from '@/features/settings/data';
import { useBankAccounts } from '@/features/settings/useBankAccounts';
import { fmtCurrency, formatYyyymmddRoc, numberToChineseNumeral } from '@/lib/utils';
import { CirclePlus, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BANK_DEPOSIT_KEY } from '../reports/balanceSheetLayout';
import { useInitialization } from '../state/InitializationContext';

/**
 * 開帳精靈「銀行帳戶」頁（確認開帳的前一步）。
 * 這裡填的是**開帳基準日的期初餘額**，不是現在戶頭裡的錢；有資產負債表的銀行存款金額時，
 * 各啟用帳戶的餘額合計必須等於它才能繼續，否則帳務起點會跟申報書對不起來。
 */
export function BankAccountsPage() {
  const { state, dispatch } = useInitialization();
  const {
    accounts,
    loading,
    loadError,
    actionError,
    saving,
    editingId,
    draft,
    loadAccounts,
    startEdit,
    cancelEdit,
    updateDraft,
    saveEdit,
    deactivateAccount,
    activateAccount,
    setDefaultAccount,
  } = useBankAccounts();
  const [adding, setAdding] = useState(false);
  const [pendingDeactivate, setPendingDeactivate] = useState<BankAccountRecord | null>(null);

  const bankDeposit = Number(state.reports.CIT_BALANCE_SHEET?.fields[BANK_DEPOSIT_KEY]?.value) || 0;
  const activeAccounts = accounts.filter(a => a.isActive);
  const total = activeAccounts.reduce((sum, a) => sum + a.balance, 0);
  const mismatch = bankDeposit !== 0 && total !== bankDeposit;

  const balanceYear = state.reportYears.CIT_BALANCE_SHEET;
  const baseDateLabel = state.openingBalance.baseDate ? formatYyyymmddRoc(state.openingBalance.baseDate) : '';

  // 選定的收款帳戶被停用或刪掉時會指向不存在的帳戶，自動退回第一個啟用帳戶（同 InitOtherChannelDialog 的預選作法）
  const receivingAccountUuid = state.receivingAccountUuid;
  useEffect(() => {
    if (activeAccounts.length === 0) return;
    if (activeAccounts.some(a => a.id === receivingAccountUuid)) return;
    dispatch({ type: 'SET_RECEIVING_ACCOUNT', payload: activeAccounts[0].id });
    // 帳戶清單或選定值變動時才需重算
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, receivingAccountUuid]);

  // 載入失敗時不卡死使用者（比照完成頁的處理），其餘情形缺一項就擋下一頁
  const blockedHint = (): string | undefined => {
    if (loading || loadError) return undefined;
    if (activeAccounts.length === 0) return '請先新增至少一個銀行帳戶';
    if (mismatch) return `帳戶餘額合計 ${fmtCurrency(total)} 與資產負債表銀行存款 ${fmtCurrency(bankDeposit)} 不符，請調整後再前往下一頁`;
    if (!receivingAccountUuid) return '請選擇「其他」銷售管道的收款帳戶';
    return undefined;
  };
  const hint = blockedHint();
  const nextDisabled = loading || (!loadError && (activeAccounts.length === 0 || mismatch || !receivingAccountUuid));

  return (
    <>
      <StepPageHeader
        kicker='銀行帳戶'
        title='確認銀行帳戶期初餘額'
        badges={['客戶填寫']}
        nav={{ onPrev: () => dispatch({ type: 'PREV_STEP' }), onNext: () => dispatch({ type: 'NEXT_STEP' }), nextLabel: '下一頁', nextDisabled, hint }}
      >
        <p className='text-sm text-neutral-mid'>請確認公司名下的銀行帳戶，日後登錄銷售收款與銀行進出都以這些帳戶為準。</p>
        <div className='flex items-start gap-2 rounded-md border border-brand-tan/40 bg-brand-tan/10 p-3 text-semantic-warm-dark'>
          <TriangleAlert size={16} className='mt-0.5 shrink-0' />
          <div className='flex flex-col gap-1.5'>
            <span className='text-sm font-bold'>這裡填的是開帳當時的期初餘額</span>
            <span className='text-[13px] leading-relaxed'>
              {bankDeposit !== 0
                ? `各帳戶的存款餘額請填${balanceYear ? `民國 ${balanceYear} 年度` : ''}開帳基準日${baseDateLabel ? `（${baseDateLabel}）` : ''}當天的金額，不是目前銀行帳戶的實際餘額。合計須等於資產負債表的銀行存款 ${fmtCurrency(bankDeposit)}。`
                : `各帳戶的存款餘額請填開帳基準日${baseDateLabel ? `（${baseDateLabel}）` : ''}當天的金額，不是目前銀行帳戶的實際餘額。資產負債表沒有銀行存款金額可對照，請自行確認填入的數字。`}
            </span>
          </div>
        </div>
      </StepPageHeader>

      {actionError && <p className='text-sm text-semantic-error'>{actionError}</p>}

      {loading ? (
        <div className='rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid'>載入中…</div>
      ) : loadError ? (
        <div className='rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error'>{loadError}</div>
      ) : (
        <>
          {accounts.map((account, i) => (
            <div key={account.id}>
              <h2 className='mb-2 text-sm font-semibold text-neutral-dark'>帳戶{numberToChineseNumeral(i + 1)}</h2>
              <BankAccountCard
                account={editingId === account.id && draft ? draft : account}
                editing={editingId === account.id}
                saving={saving}
                onStartEdit={() => startEdit(account)}
                onCancelEdit={cancelEdit}
                onChange={updateDraft}
                onSave={saveEdit}
                onDeactivate={() => setPendingDeactivate(account)}
                onActivate={() => activateAccount(account)}
                onSetDefaultPayment={() => setDefaultAccount(account, 'payment')}
                onSetDefaultReceiving={() => setDefaultAccount(account, 'receiving')}
              />
            </div>
          ))}

          {adding || accounts.length === 0 ? (
            <BankAccountCreateForm
              onCreated={() => {
                setAdding(false);
                loadAccounts();
              }}
              // 第一個帳戶才預填資產負債表的銀行存款；已經有帳戶時再預填全額會讓合計爆掉
              defaultBalance={accounts.length === 0 ? bankDeposit : undefined}
              balanceHint={`${balanceYear ? `民國 ${balanceYear} 年度` : ''}開帳基準日的期初餘額，不是目前實際餘額`}
              onCancel={accounts.length === 0 ? undefined : () => setAdding(false)}
            />
          ) : (
            <button
              type='button'
              onClick={() => setAdding(true)}
              className='flex min-h-11 items-center justify-center gap-2 rounded-md border border-dashed border-neutral-blue-gray/50 py-3 text-sm font-semibold text-brand-blue hover:bg-surface-cream'
            >
              <CirclePlus size={16} />
              再加一個銀行帳戶
            </button>
          )}

          <SectionCard>
            <div className='flex flex-wrap items-center justify-between gap-2 text-sm'>
              <span>
                啟用中帳戶餘額合計 <strong className='font-bold'>{fmtCurrency(total)}</strong>
              </span>
              {bankDeposit !== 0 && (
                <span className={mismatch ? 'flex items-center gap-1.5 font-bold text-semantic-error' : 'font-bold text-semantic-success'}>
                  {mismatch && <TriangleAlert size={16} />}
                  {mismatch ? `與資產負債表銀行存款 ${fmtCurrency(bankDeposit)} 不符` : '與資產負債表銀行存款相符'}
                </span>
              )}
            </div>
          </SectionCard>

          <SectionCard title='預設銷售管道的收款帳戶'>
            <Label required>收款帳戶</Label>
            {activeAccounts.length === 0 ? (
              <p className='text-xs text-semantic-error'>尚無啟用中的銀行帳戶，請先於上方新增</p>
            ) : (
              <Select widthClassName='w-full nav:w-80' value={receivingAccountUuid} onValueChange={v => dispatch({ type: 'SET_RECEIVING_ACCOUNT', payload: v })}>
                {activeAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.nickname}（{account.bankName} {account.accountNumber}）
                  </option>
                ))}
              </Select>
            )}
            <p className='text-[13px] text-neutral-mid'>
              確認開帳後，系統會建立一個名為「其他」的預設銷售管道，用來歸類沒有特別指定管道的銷售款項，收款就記在這個帳戶。
              日後可於「設定 / 收款設定」調整，或新增其他銷售管道。
            </p>
          </SectionCard>
        </>
      )}

      <ConfirmDeleteDialog
        open={!!pendingDeactivate}
        onClose={() => setPendingDeactivate(null)}
        onConfirm={() => {
          if (pendingDeactivate) deactivateAccount(pendingDeactivate);
        }}
        title='停用銀行帳戶'
        message={`確定要停用「${pendingDeactivate?.nickname}」嗎？停用的帳戶不計入餘額合計，之後可於帳戶清單重新啟用。`}
        confirmLabel='確定停用'
      />
    </>
  );
}
