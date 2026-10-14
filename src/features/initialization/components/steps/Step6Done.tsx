'use client';

import { useInitialization } from '../../state/InitializationContext';
import { completeInitialization } from '@/api/initialization';
import { StepPageHeader } from '@/components/initialization/StepPageHeader';
import Button from '@/components/ui/Button';
import SectionCard from '@/components/ui/SectionCard';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function Step6Done() {
  const { state, dispatch, clearSession } = useInitialization();
  const router = useRouter();
  const isUnderOneYear = state.operatingStatus === 'under_one_year';

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
    <>
      <StepPageHeader kicker='完成' title={isUnderOneYear ? '已可開始使用' : '開帳設定完成'} nav={{ onNext: handleStart, nextLabel: '開始使用' }} />

      <SectionCard className='items-center gap-4 py-10 text-center'>
        {isUnderOneYear ? (
          <>
            <TriangleAlert size={40} className='text-brand-tan' />
            <p className='max-w-md text-sm text-neutral-mid'>
              您尚未有結算申報書可供核對，帳務起點暫以 0 計算。日後結算申報完成，建議儘快補上申報書讓報表數字更準確。
            </p>
            <Button variant='outline' onClick={() => dispatch({ type: 'GO_TO_STEP', payload: { step: 2 } })}>
              前往上傳結算申報書
            </Button>
          </>
        ) : (
          <>
            <CircleCheck size={40} className='text-semantic-success' />
            <p className='max-w-md text-sm text-neutral-mid'>公司資料與期初餘額已設定完成，即可開始使用 Easytax Lite 記帳。</p>
          </>
        )}
      </SectionCard>
    </>
  );
}
