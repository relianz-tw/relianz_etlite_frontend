/**
 * Onboarding Header：左上角顯示 RELIANZ Logo
 */
export function OnboardingHeader() {
  return (
    <header className='flex items-center px-4 py-2 md:px-6 md:py-3 bg-surface-off-white'>
      {/* Logo 全站慣例用原生 img（見 AppShell.tsx），對齊來源專案不使用 next/image */}
      <img
        src='/etlite/logo.png'
        alt='RELIANZ'
        width={140}
        height={30}
        className='object-contain w-[100px] md:w-[140px]'
        fetchPriority='high'
      />
    </header>
  );
}
