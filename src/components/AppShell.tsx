'use client';

import Sidebar from '@/components/sideBar';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const isDesktop = () =>
  typeof window !== 'undefined' && window.matchMedia('(min-width: 1000px)').matches;

// 側邊欄殼層：持有開關狀態，桌面採 Push（推移主內容）、手機採 Overlay（浮層）
const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 掛載時依螢幕寬度決定預設開關：桌面預設展開、手機預設收合
  useEffect(() => {
    setOpen(isDesktop());
  }, []);

  // 手機（Overlay 模式）下切換路由時自動收合側邊欄
  useEffect(() => {
    if (!isDesktop()) {
      setOpen(false);
    }
  }, [pathname]);

  return (
    <>
      {/* 手機版固定頂部列：logo 與選單鈕同列呈現，取代桌機用的浮動開關鈕 */}
      <header className='fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-surface-cream bg-white px-4 nav:hidden'>
        <picture>
          <img
            src='/logo.png'
            alt='logo'
            className='w-[100px]'
            fetchPriority='high'
          />
        </picture>
        <button
          type='button'
          aria-label='開啟選單'
          onClick={() => setOpen(true)}
          className='text-neutral-dark hover:text-brand-primary'
        >
          <Menu size={22} />
        </button>
      </header>

      <Sidebar open={open} onToggle={() => setOpen(o => !o)} />

      {/* 桌機收合時顯示浮動開關鈕（手機版由固定頂部列取代） */}
      {!open && (
        <button
          type='button'
          aria-label='開啟選單'
          onClick={() => setOpen(true)}
          className='fixed left-4 top-4 z-40 hidden rounded-md border border-surface-cream bg-white p-2 text-neutral-dark shadow-level1 transition-colors hover:text-brand-primary nav:block'
        >
          <Menu size={20} />
        </button>
      )}

      {/* 手機版固定頂部列高度需保留淨空；桌機則依展開狀態推移版面 */}
      <div
        className={`pt-14 transition-[margin] duration-200 nav:pt-0 ${
          open ? 'nav:ml-64' : 'nav:ml-0'
        }`}
      >
        {children}
      </div>
    </>
  );
};

export default AppShell;
