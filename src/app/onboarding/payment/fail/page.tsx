'use client';

import { CircleX } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function FailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uuid = searchParams.get('uuid');
  const rtnCode = searchParams.get('rtnCode');

  const handleBack = () => {
    const dest = uuid ? `/onboarding?uuid=${uuid}&pay=1` : '/onboarding';
    router.push(dest);
  };

  return (
    <div className='h-svh bg-surface-off-white overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] flex items-center justify-center px-4'>
      <div className='w-full max-w-md -mt-20'>
        {/* 圖示區 */}
        <div className='flex justify-center mb-8'>
          <div className='w-20 h-20 rounded-full bg-semantic-error/10 flex items-center justify-center'>
            <CircleX size={36} className='text-semantic-error' strokeWidth={1.5} />
          </div>
        </div>

        {/* 標題 */}
        <h1 className='text-2xl font-bold text-center text-neutral-dark mb-3 font-notoSerif'>
          信用卡驗證失敗
        </h1>
        <p className='text-sm text-center text-neutral-dark/60 leading-relaxed mb-6'>
          請重新試一次或是聯繫發卡銀行。
        </p>

        {/* 按鈕 */}
        <button
          onClick={handleBack}
          className='w-full py-3 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue-dark transition-colors'
        >
          返回
        </button>

        <p className='text-xs text-center text-neutral-dark/40 mt-6 leading-relaxed'>
          如持續遇到問題，請聯繫客服
        </p>

        {/* 綠界交易錯誤代碼 */}
        {rtnCode && (
          <p className='text-xs text-center text-neutral-dark/30 mt-3'>
            綠界交易錯誤代碼：{rtnCode}
          </p>
        )}
      </div>
    </div>
  );
}

export default function FailPage() {
  return (
    <Suspense>
      <FailContent />
    </Suspense>
  );
}
