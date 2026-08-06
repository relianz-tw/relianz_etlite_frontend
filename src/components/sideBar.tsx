'use client';

import { navLinks } from '@/data/navLinks';
import { ArrowRight, ChevronDown, PanelLeftClose, SquarePlus, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const isActive = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`);

const navItemClass = (active: boolean) =>
  `flex items-center gap-1 rounded-md px-3 py-2 transition-colors ${
    active
      ? 'font-medium text-brand-primary bg-surface-cream'
      : 'text-neutral-dark hover:font-medium hover:text-brand-primary hover:bg-surface-cream'
  }`;

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const Sidebar = ({ open, onToggle }: SidebarProps) => {
  const pathname = usePathname();
  // 以項目名稱作為 key，讓多個下拉選單能各自獨立開合
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname]);

  return (
    <>
      {/* 手機版遮罩：側邊欄以浮層形式蓋在內容上方，點擊遮罩可收合 */}
      {open && (
        <div
          className='fixed inset-0 z-40 bg-neutral-dark/40 nav:hidden'
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex h-full w-64 flex-col border-l border-surface-cream bg-white shadow-level1 transition-transform duration-200 nav:left-0 nav:right-auto nav:border-l-0 nav:border-r nav:shadow-none ${
          open ? 'translate-x-0' : 'translate-x-full nav:-translate-x-full'
        }`}
      >
        {/* 手機版頁首：選單標題 + 關閉鈕（logo 已顯示於固定頂部列，此處不重複） */}
        <div className='flex h-14 shrink-0 items-center justify-between border-b border-surface-cream px-4 nav:hidden'>
          <span className='font-medium text-neutral-dark'>選單</span>
          <button
            type='button'
            aria-label='關閉選單'
            onClick={onToggle}
            className='text-neutral-dark hover:text-brand-primary'
          >
            <X size={20} />
          </button>
        </div>

        {/* 桌機頁首：logo + 收合鈕 */}
        <div className='hidden h-16 shrink-0 items-center justify-between border-b border-surface-cream px-4 nav:flex'>
          <picture>
            <img
              src='/logo.png'
              alt='logo'
              className='w-[120px]'
              fetchPriority='high'
            />
          </picture>
          <button
            type='button'
            aria-label='收合選單'
            onClick={onToggle}
            className='text-neutral-dark hover:text-brand-primary'
          >
            <PanelLeftClose size={20} />
          </button>
        </div>

        {/* 導覽項目 */}
        <ul className='flex flex-1 flex-col gap-1 overflow-y-auto p-3 text-sm'>
          {navLinks.map(link => {
            const active = isActive(pathname, link.path);

            if (link.children) {
              const dropdownOpen = openDropdown === link.name;
              return (
                <li key={link.name}>
                  <button
                    type='button'
                    onClick={() =>
                      setOpenDropdown(cur => (cur === link.name ? null : link.name))
                    }
                    className={`flex w-full items-center justify-between ${navItemClass(active)}`}
                  >
                    {link.name}
                    <ChevronDown
                      size={14}
                      className={
                        dropdownOpen ? 'rotate-180 transition-transform' : 'transition-transform'
                      }
                    />
                  </button>
                  {dropdownOpen && (
                    <ul className='ml-3 mt-1 flex flex-col gap-1 border-l border-surface-cream pl-3'>
                      {link.children.map(child => (
                        <li key={child.path}>
                          <Link
                            href={child.path}
                            className='block rounded-md px-3 py-2 text-neutral-dark hover:bg-surface-cream hover:text-brand-primary'
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={link.path}>
                <Link href={link.path} className={navItemClass(active)}>
                  {link.icon === 'plus' && <SquarePlus size={16} />}
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* 頁尾：登出 */}
        <div className='shrink-0 border-t border-surface-cream p-3'>
          <button
            type='button'
            className='flex w-full items-center gap-1 rounded-md border border-surface-cream px-3 py-2 text-neutral-dark transition-colors hover:bg-surface-cream hover:text-brand-primary'
          >
            <ArrowRight size={14} />
            登出
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
