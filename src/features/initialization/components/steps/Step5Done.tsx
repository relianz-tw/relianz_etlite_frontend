'use client';

import { useInitialization } from '../../state/InitializationContext';
import { completeInitialization } from '@/api/initialization';
import { MobileFixedBottom } from '@/components/onboarding/MobileFixedBottom';
import Button from '@/components/ui/Button';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function Step5Done() {
  const { state, dispatch, clearSession } = useInitialization();
  const router = useRouter();

  useEffect(() => {
    if (state.completed) return;
    completeInitialization(state.userUuid)
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

  return (
    <div className='flex flex-col items-center flex-1 min-h-0 p-5 md:p-12 md:overflow-y-auto text-center'>
      <div className='flex flex-1 flex-col items-center justify-center gap-4 max-w-md'>
        {state.openingBalanceSkipped ? (
          <>
            <TriangleAlert size={40} className='text-brand-tan' />
            <h1 className='text-xl md:text-2xl font-bold text-neutral-dark font-notoSerif'>已可開始使用</h1>
            <p className='text-sm text-neutral-mid'>
              您尚未設定期初資料，帳務起點暫以 0 計算。建議儘快補上申報書或報表，讓報表數字更準確。
            </p>
            <Button
              variant='outline'
              onClick={() => dispatch({ type: 'GO_TO_STEP', payload: { step: 3, subStep: 'A' } })}
              className='w-full'
            >
              前往設定期初資料
            </Button>
          </>
        ) : (
          <>
            <CircleCheck size={40} className='text-semantic-success' />
            <h1 className='text-xl md:text-2xl font-bold text-neutral-dark font-notoSerif'>開帳設定完成</h1>
            <p className='text-sm text-neutral-mid'>公司資料與期初餘額已設定完成，即可開始使用 Easytax Lite 記帳。</p>
          </>
        )}
      </div>

      <MobileFixedBottom>
        <Button onClick={handleStart} className='w-full'>
          開始使用
        </Button>
      </MobileFixedBottom>
    </div>
  );
}
