/**
 * Onboarding Footer：媒體報導 Logo 列
 * 顯示經濟日報、mnews 鏡新聞、理財周刊
 */
const mediaList = ['/etlite/moneyudn_logo.png', '/etlite/MNEWS_logo.png'];

export function OnboardingFooter() {
  return (
    <footer className='hidden md:block py-3 px-4 md:px-8'>
      <div className='flex items-center justify-center gap-3 md:gap-8'>
        <p className='text-sm font-bold text-neutral-dark/60 shrink-0'>
          媒體報導
        </p>
        {mediaList.map(pic => (
          <div
            key={pic}
            className='relative w-[72px] h-6 md:w-[110px] md:h-8 shrink-0'
          >
            {/* 全站慣例用原生 img，不使用 next/image */}
            <img
              src={pic}
              alt='媒體 logo'
              className='absolute inset-0 w-full h-full object-contain'
            />
          </div>
        ))}
      </div>
    </footer>
  );
}
