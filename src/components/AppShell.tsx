'use client';

import Sidebar from '@/components/sideBar';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// 側邊欄殼層：桌機固定展開（不可收合），手機採 Overlay（浮層，由頂部列選單鈕開合）
const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 手機（Overlay 模式）下切換路由時自動收合側邊欄
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* 手機版固定頂部列：logo 與選單鈕同列呈現 */}
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

      {/* 手機版固定頂部列高度需保留淨空；桌機側邊欄固定展開，版面固定留出寬度 */}
      <div className='pt-14 nav:ml-64 nav:pt-0'>{children}</div>
    </>
  );
};

export default AppShell;
