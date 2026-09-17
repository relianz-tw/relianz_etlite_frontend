'use client';

import { useOnboarding } from '../../state/OnboardingContext';
import Button from '@/components/ui/Button';
import { MobileFixedBottom } from '@/components/onboarding/MobileFixedBottom';
import { ChevronLeft } from 'lucide-react';

export function Step5AEstimator() {
  const { dispatch } = useOnboarding();

  return (
    <div className='flex flex-col md:flex-row min-h-full md:flex-1 md:min-h-0'>
      {/* 左欄：宣傳圖片 */}
      <div className='md:order-1 h-[45svh] md:h-auto w-full md:w-2/5 md:flex-none relative overflow-hidden bg-semantic-success-deep'>
        {/* 全站慣例用原生 img，不使用 next/image */}
        <img
          src='/etlite/promotional2.webp'
          alt='Easytax 服務宣傳圖'
          className='absolute inset-0 w-full h-full object-cover object-center'
        />
        <div className='absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent pointer-events-none' />
        <button
          onClick={() => dispatch({ type: 'PREV_STEP' })}
          className='flex items-center gap-1 text-sm text-white hover:text-white/80 transition-colors absolute top-6 left-6 bg-black/30 backdrop-blur-sm rounded px-2 py-1'
        >
          <ChevronLeft size={16} /> 上一頁
        </button>
      </div>

      {/* 右欄：介紹文案 */}
      <div className='flex-1 md:order-2 w-full md:w-3/5 bg-white flex flex-col px-6 pt-4 pb-6 md:p-12 md:overflow-y-auto'>
        <div className='flex flex-col gap-5 mt-2 md:mt-8'>
          <div>
            <h2 className='text-xl md:text-2xl font-semibold text-neutral-dark mb-3 font-notoSerif'>
              預估稅金
            </h2>
            <p className='text-sm md:text-base'>
              如果每期營業稅以及營所稅，可以隨時預估該有多好？
            </p>
            <p className='mt-4 text-sm md:text-base'>
              EasyTax
              滿足老闆的控制欲「隨時」都可以看到最新預估，請輸入您的營業額跟選擇您的業態，來看看
              Easytax 如何為您節稅。
            </p>
          </div>
        </div>

        <MobileFixedBottom>
          <Button
            onClick={() => dispatch({ type: 'NEXT_STEP' })}
            className='w-full'
          >
            開始試算
          </Button>
        </MobileFixedBottom>
      </div>
    </div>
  );
}
