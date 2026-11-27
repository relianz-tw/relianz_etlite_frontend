'use client';

import { isFillingStep, useInitialization } from '@/features/initialization/state/InitializationContext';
import { STEP } from '@/features/initialization/state/initializationReducer';
import { PartnersPage } from '@/features/initialization/components/PartnersPage';
import { RegistrationDocsPage } from '@/features/initialization/components/RegistrationDocsPage';
import { PaymentInfoPage } from '@/features/initialization/components/steps/PaymentInfoPage';
import { Step1Terms } from '@/features/initialization/components/steps/Step1Terms';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

function StepLoading() {
  return (
    <div className='flex justify-center py-16'>
      <Loader2 size={24} className='animate-spin text-brand-blue' />
    </div>
  );
}

const Step2Operating = dynamic(
  () => import('@/features/initialization/components/steps/Step2Operating').then(m => ({ default: m.Step2Operating })),
  { loading: StepLoading }
);
const Step3Cover = dynamic(
  () => import('@/features/initialization/components/steps/Step3Cover').then(m => ({ default: m.Step3Cover })),
  { loading: StepLoading }
);
const Step3CompanyInfo = dynamic(
  () => import('@/features/initialization/components/steps/Step3CompanyInfo').then(m => ({ default: m.Step3CompanyInfo })),
  { loading: StepLoading }
);
const Step4Reports = dynamic(
  () => import('@/features/initialization/components/steps/Step4Reports').then(m => ({ default: m.Step4Reports })),
  { loading: StepLoading }
);
const BankAccountsPage = dynamic(
  () => import('@/features/initialization/components/BankAccountsPage').then(m => ({ default: m.BankAccountsPage })),
  { loading: StepLoading }
);
const Step5Confirm = dynamic(
  () => import('@/features/initialization/components/steps/Step5Confirm').then(m => ({ default: m.Step5Confirm })),
  { loading: StepLoading }
);
const Step6Done = dynamic(
  () => import('@/features/initialization/components/steps/Step6Done').then(m => ({ default: m.Step6Done })),
  { loading: StepLoading }
);

export function InitializationClient() {
  const { state, dispatch, ready, hasUnsavedChanges } = useInitialization();
  const { currentStep, currentReportIndex } = state;
  const searchParams = useSearchParams();
  const uuid = searchParams.get('uuid');

  // 登入機制上線前，userUuid 由 URL ?uuid= 帶入（見 /onboarding/payment/success 的「前往開帳設定」按鈕）
  useEffect(() => {
    if (uuid && uuid !== state.userUuid) {
      dispatch({ type: 'SET_USER_UUID', payload: uuid });
    }
  }, [uuid]); // eslint-disable-line react-hooks/exhaustive-deps

  // 步驟切換時捲回頂部（InitializationLayout 的捲動層）
  useEffect(() => {
    const scroller = document.getElementById('initialization-scroll');
    if (scroller) scroller.scrollTop = 0;
  }, [currentStep, currentReportIndex]);

  // 正在填資料、且真的有還沒存上雲端的修改時，關閉分頁或重新整理前讓瀏覽器跳出「確定要離開」確認；
  // 合約與完成頁沒有待保存的內容，不攔。瀏覽器只會顯示內建文字，無法自訂。
  // 有沒有未儲存修改要在事件當下才算（剛按過儲存就不該再攔），所以在 handler 裡呼叫而不是放進 deps
  const hasUnsavedProgress = isFillingStep(currentStep);
  useEffect(() => {
    if (!hasUnsavedProgress) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges()) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedProgress, hasUnsavedChanges]);

  // 新分頁／換裝置要先等雲端草稿回來，避免先閃出第一步再跳到上次的進度
  if (!ready) return <StepLoading />;
  // 步驟順序的權威定義見 initializationReducer 的「步驟導航邏輯」註解
  if (currentStep === STEP.TERMS) return <Step1Terms />;
  if (currentStep === STEP.PAYMENT) return <PaymentInfoPage />;
  if (currentStep === STEP.REGISTRATION_DOCS) return <RegistrationDocsPage />;
  if (currentStep === STEP.OPERATING) return <Step2Operating />;
  if (currentStep === STEP.PARTNERS) return <PartnersPage />;
  // 尚未結算申報過沒有申報書，改填固定的公司資料表單；穩定經營一年以上沿用封面頁
  if (currentStep === STEP.COMPANY) return state.operatingStatus === 'over_one_year' ? <Step3Cover /> : <Step3CompanyInfo />;
  if (currentStep === STEP.REPORTS) return <Step4Reports />;
  if (currentStep === STEP.BANK_ACCOUNTS) return <BankAccountsPage />;
  if (currentStep === STEP.CONFIRM) return <Step5Confirm />;
  if (currentStep === STEP.DONE) return <Step6Done />;

  return <Step1Terms />;
}
