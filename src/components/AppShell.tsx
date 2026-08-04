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
      <Sidebar open={open} onToggle={() => setOpen(o => !o)} />

      {/* 收合時顯示浮動開關鈕 */}
      {!open && (
        <button
          type='button'
          aria-label='開啟選單'
          onClick={() => setOpen(true)}
          className='fixed left-4 top-4 z-40 rounded-md border border-surface-cream bg-white p-2 text-neutral-dark shadow-level1 transition-colors hover:text-brand-primary'
        >
          <Menu size={20} />
        </button>
      )}

      {/* 收合時保留頂部淨空，避免浮動開關鈕蓋住各頁面左上角標題 */}
      <div
        className={`transition-[margin,padding] duration-200 ${
          open ? 'nav:ml-64' : 'pt-16'
        }`}
      >
        {children}
      </div>
    </>
  );
};

export default AppShell;
