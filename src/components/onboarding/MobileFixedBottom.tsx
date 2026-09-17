interface Props {
  children: React.ReactNode;
  className?: string;
}

/**
 * 手機版：固定於螢幕底部的操作列
 * 桌面版：維持原本 mt-auto pt-6 的靜態佈局
 */
export function MobileFixedBottom({ children, className = '' }: Props) {
  return (
    <>
      {/* fixed 元素不佔流位，用佔位 div 預留等高空間避免內容被遮蓋 */}
      <div className='h-6 shrink-0 md:hidden' aria-hidden='true' />
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-surface-cream px-6 pt-2
                    pb-[max(0.5rem,env(safe-area-inset-bottom))]
                    md:static md:bottom-auto md:left-auto md:right-auto md:z-auto md:border-0
                    md:mt-auto md:pt-6 md:px-0 md:pb-0 md:bg-transparent
                    ${className}`}
      >
        {children}
      </div>
    </>
  );
}
