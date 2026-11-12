'use client';

import { useInitialization } from '../../state/InitializationContext';
import { listBankAccounts } from '@/api/bankAccounts';
import { completeInitialization } from '@/api/initialization';
import Button from '@/components/ui/Button';
import SectionCard from '@/components/ui/SectionCard';
import BankAccountCreateForm from '@/features/settings/components/BankAccountCreateForm';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { ChevronRight, CircleCheck, TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Step6Done() {
  const { state, dispatch, clearSession } = useInitialization();
  const router = useRouter();
  const isUnderOneYear = state.operatingStatus === 'under_one_year';
  const [bankLoading, setBankLoading] = useState(true);
  const [bankLoadError, setBankLoadError] = useState('');
  const [hasActiveAccount, setHasActiveAccount] = useState(false);

  // 新增銷項交易需要收款銀行帳戶，故完成頁要求至少有一個啟用中帳戶才能開始使用
  const loadBankAccounts = () => {
    setBankLoading(true);
    setBankLoadError('');
    listBankAccounts()
      .then(list => setHasActiveAccount(list.some(a => a.isActive)))
      .catch(err => setBankLoadError(getFriendlyErrorMessage(err)))
      .finally(() => setBankLoading(false));
  };

  useEffect(() => {
    loadBankAccounts();
  }, []);

  useEffect(() => {
    if (state.completed) return;
    completeInitialization()
      .then(() => dispatch({ type: 'COMPLETE' }))
      .catch(() => {
        // 標記完成失敗不影響使用者體驗（已可進系統），僅後端統計會晚一點才更新
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = () => {
    clearSession();
    router.push('/ledger');
  };

  // 查詢帳戶失敗時不卡死使用者，仍允許進系統（/ledger/new 仍會提示新增帳戶）
  const canStart = hasActiveAccount || !!bankLoadError;

  return (
    <SectionCard className='items-center gap-4 py-12 text-center nav:py-16'>
      <CircleCheck size={48} className='text-semantic-success' />
      <div className='flex flex-col gap-1.5'>
        <span className='text-xs font-semibold text-brand-blue'>開帳設定完成</span>
        <h1 className='text-2xl font-semibold text-neutral-dark nav:text-3xl'>歡迎使用 Easytax Lite</h1>
      </div>
      <p className='max-w-md text-sm text-neutral-mid'>公司資料與期初餘額已設定完成，接著新增收款銀行帳戶就可以開始記帳。</p>

      {isUnderOneYear && (
        <div className='flex max-w-md flex-col items-center gap-2'>
          <TriangleAlert size={24} className='text-brand-tan' />
          <p className='text-sm text-neutral-mid'>
            您尚未有結算申報書可供核對，帳務起點暫以 0 計算。日後結算申報完成，建議儘快補上申報書讓報表數字更準確。
          </p>
        </div>
      )}

      <div className='flex w-full max-w-2xl flex-col gap-3 text-left'>
        {bankLoading ? (
          <p className='text-center text-sm text-neutral-mid'>載入中…</p>
        ) : bankLoadError ? (
          <p className='text-center text-sm text-semantic-error'>{bankLoadError}</p>
        ) : hasActiveAccount ? (
          <div className='flex items-center justify-center gap-2 text-sm text-neutral-mid'>
            <CircleCheck size={16} className='text-semantic-success' />
            已新增銀行帳戶，日後可於「設定 / 收款設定」管理
          </div>
        ) : (
          <>
            <div>
              <h2 className='text-base font-semibold text-neutral-dark'>新增收款銀行帳戶</h2>
              <p className='mt-1 text-sm text-neutral-mid'>記錄銷售收款前，需要至少一個公司名下的銀行帳戶。</p>
            </div>
            <BankAccountCreateForm onCreated={loadBankAccounts} />
          </>
        )}
      </div>

      <div className='mt-2 flex flex-col gap-3 sm:flex-row'>
        {isUnderOneYear && (
          <Button variant='outline' onClick={() => dispatch({ type: 'GO_TO_STEP', payload: { step: 2 } })}>
            前往上傳結算申報書
          </Button>
        )}
        <Button icon={ChevronRight} iconPosition='right' onClick={handleStart} disabled={!canStart}>
          開始使用
        </Button>
      </div>
      {!bankLoading && !canStart && <p className='text-xs text-neutral-mid'>請先新增銀行帳戶</p>}
    </SectionCard>
  );
}
