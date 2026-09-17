'use client';

import { step1Schema } from '../../schemas';
import { useOnboarding } from '../../state/OnboardingContext';
import Field from '../Field';
import { lookupCompany } from '@/api/onboarding/companyLookup';
import Button from '@/components/ui/Button';
import { MobileFixedBottom } from '@/components/onboarding/MobileFixedBottom';
import { useState } from 'react';

const mediaList = ['/etlite/moneyudn_logo.png', '/etlite/MNEWS_logo.png'];

export function Step1Landing() {
  const { state, dispatch } = useOnboarding();
  const [taxId, setTaxId] = useState(state.taxId ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setError('');

    // 驗證統編格式（選填）
    const result = step1Schema.safeParse({ taxId: taxId || undefined });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      // 無論統編是否填寫都先同步狀態，確保 getNextStep 拿到正確的 taxId
      dispatch({ type: 'SET_TAX_ID', payload: taxId });
      if (taxId) {
        const data = await lookupCompany(taxId);
        // 無論查詢結果為何都更新，避免回上一步後殘留前次公司資料
        dispatch({
          type: 'SET_COMPANY',
          payload: {
            name: data.companyName ?? '',
            representative: data.representative ?? '',
            address: data.address ?? '',
          },
        });
      }
      dispatch({ type: 'NEXT_STEP' });
    } catch {
      // 查無資料仍允許進入步驟 2（空白填寫），同時清空舊資料
      if (taxId) {
        dispatch({
          type: 'SET_COMPANY',
          payload: { name: '', representative: '', address: '' },
        });
      }
      dispatch({ type: 'NEXT_STEP' });
    } finally {
      setLoading(false);
    }
  };

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
      </div>

      {/* 右欄：操作區（手機排序在上）*/}
      <div className='md:order-2 w-full md:w-3/5 bg-white flex flex-col flex-1 p-5 md:p-12 md:overflow-y-auto'>
        <div className='flex flex-col gap-6 md:mt-8'>
          <div>
            <h1 className='text-xl md:text-2xl font-bold text-neutral-dark mb-2 font-notoSerif'>
              太強了！
              <br />
              原本要花我好幾個小時的才能完成的稅務申報，Easytax
              只要不到五分鐘就完成！
            </h1>
          </div>
          <p className='text-base md:text-lg font-bold'>
            立刻動動手指讓報稅變簡單
          </p>

          <Field
            label='請輸入您的統一編號（尚未設立完畢請留空）'
            placeholder='輸入您的統一編號'
            value={taxId}
            onChange={e => {
              setTaxId(e.target.value.replace(/\D/g, '').slice(0, 8));
              setError('');
            }}
            maxLength={8}
            inputMode='numeric'
            error={!!error}
            errorMessage={error}
          />
        </div>

        {/* 手機版媒體報導（桌面版由 OnboardingFooter 顯示） */}
        <div className='md:hidden flex items-center justify-center gap-4 mt-6'>
          <p className='text-xs font-bold text-neutral-dark/50 shrink-0'>
            媒體報導
          </p>
          {mediaList.map(pic => (
            <div key={pic} className='relative w-[72px] h-6 shrink-0'>
              <img
                src={pic}
                alt='媒體 logo'
                className='absolute inset-0 w-full h-full object-contain'
              />
            </div>
          ))}
        </div>

        <MobileFixedBottom>
          <Button onClick={handleStart} disabled={loading} className='w-full'>
            {loading ? '查詢中...' : '立即開始免費 7 天試用'}
          </Button>
        </MobileFixedBottom>
      </div>
    </div>
  );
}
