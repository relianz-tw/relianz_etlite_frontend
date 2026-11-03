'use client';

import { useInitialization } from '../../state/InitializationContext';
import { completeInitialization } from '@/api/initialization';
import Button from '@/components/ui/Button';
import SectionCard from '@/components/ui/SectionCard';
import { ChevronRight, CircleCheck, TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function Step6Done() {
  const { state, dispatch, clearSession } = useInitialization();
  const router = useRouter();
  const isUnderOneYear = state.operatingStatus === 'under_one_year';

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

  return (
    <SectionCard className='items-center gap-4 py-12 text-center md:py-16'>
      <CircleCheck size={48} className='text-semantic-success' />
      <div className='flex flex-col gap-1.5'>
        <span className='text-xs font-semibold text-brand-blue'>開帳設定完成</span>
        <h1 className='text-2xl font-semibold text-neutral-dark md:text-3xl'>歡迎使用 Easytax Lite</h1>
      </div>
      <p className='max-w-md text-sm text-neutral-mid'>公司資料與期初餘額已設定完成，現在就可以開始記帳。</p>

      {isUnderOneYear && (
        <div className='flex max-w-md flex-col items-center gap-2'>
          <TriangleAlert size={24} className='text-brand-tan' />
          <p className='text-sm text-neutral-mid'>
            您尚未有結算申報書可供核對，帳務起點暫以 0 計算。日後結算申報完成，建議儘快補上申報書讓報表數字更準確。
          </p>
        </div>
      )}

      <div className='mt-2 flex flex-col gap-3 sm:flex-row'>
        {isUnderOneYear && (
          <Button variant='outline' onClick={() => dispatch({ type: 'GO_TO_STEP', payload: { step: 2 } })}>
            前往上傳結算申報書
          </Button>
        )}
        <Button icon={ChevronRight} iconPosition='right' onClick={handleStart}>
          開始使用
        </Button>
      </div>
    </SectionCard>
  );
}
