'use client';

import { getBasicSetting } from '@/api/basicSettings';
import { isDemoMode, isDemoModeAvailable, setDemoMode } from '@/api/config';
import { navLinks } from '@/data/navLinks';
import { ArrowRight, Building2, Check, ChevronDown, SquarePlus, X } from 'lucide-react';
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
  onWidthChange: (width: number) => void;
  minWidth: number;
  maxWidth: number;
}

const Sidebar = ({ open, onToggle, onWidthChange, minWidth, maxWidth }: SidebarProps) => {
  const pathname = usePathname();
  // 父項目展開狀態預設依目前路徑自動判斷（見下方 render），此處僅記錄使用者手動覆蓋的項目
  const [openOverride, setOpenOverride] = useState<Record<string, boolean>>({});
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  // isDemoMode 讀取 localStorage，SSR 階段一律視為 false；掛載後才校正，避免 hydration 內容不一致
  const [demoActive, setDemoActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setDemoActive(isDemoMode);
  }, []);

  // 路由切換時清除手動覆蓋，讓展開狀態回到「依目前路徑自動展開」的預設值；公司切換選單也一併收合
  useEffect(() => {
    setOpenOverride({});
    setCompanyMenuOpen(false);
  }, [pathname]);

  // 拖曳分隔線調整側欄寬度：滑鼠 X 座標即為側欄目前寬度（側欄固定於畫面左側）
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      onWidthChange(Math.min(maxWidth, Math.max(minWidth, e.clientX)));
    };
    const handleMouseUp = () => setIsDragging(false);

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minWidth, maxWidth, onWidthChange]);

  // 登出按鈕上方顯示目前公司名稱；查詢失敗時不影響選單其餘功能，靜默忽略即可
  useEffect(() => {
    let cancelled = false;
    getBasicSetting()
      .then(result => {
        if (!cancelled) setCompanyName(result.companyName);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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
        className={`fixed inset-y-0 right-0 z-50 flex h-full w-64 flex-col border-l border-surface-cream bg-white shadow-level1 transition-transform duration-200 nav:left-0 nav:right-auto nav:w-[var(--sidebar-w)] nav:translate-x-0 nav:border-l-0 nav:border-r nav:shadow-none ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 拖曳分隔線：僅桌機顯示，拖曳時調整側欄寬度 */}
        <div
          role='separator'
          aria-orientation='vertical'
          aria-label='調整側欄寬度'
          onMouseDown={() => setIsDragging(true)}
          className={`absolute inset-y-0 right-0 hidden w-1 -translate-x-1/2 cursor-col-resize nav:block ${
            isDragging ? 'bg-brand-primary/60' : 'bg-transparent hover:bg-brand-primary/40'
          }`}
        />
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

        {/* 桌機頁首：固定顯示 logo，側邊欄不提供收合功能 */}
        <div className='hidden h-16 shrink-0 items-center border-b border-surface-cream px-4 nav:flex'>
          <picture>
            <img
              src='/logo.png'
              alt='logo'
              className='w-[120px]'
              fetchPriority='high'
            />
          </picture>
        </div>

        {/* 導覽項目 */}
        <ul className='flex flex-1 flex-col gap-1 overflow-y-auto p-3 text-sm'>
          {navLinks.map(link => {
            const active = isActive(pathname, link.path);

            if (link.children) {
              // 未手動覆蓋時，依目前路徑是否落在此項目底下決定預設展開狀態
              const dropdownOpen = openOverride[link.name] ?? active;
              const toggleDropdown = () =>
                setOpenOverride(cur => ({ ...cur, [link.name]: !dropdownOpen }));
              // 只有當父項目路徑本身就是某個子項目（總覽頁）時，標題才可直接點擊導覽；
              // 否則父項目路徑沒有對應頁面（如各類扣繳中心 /withholding），點擊僅切換展開
              const hasOverviewPage = link.children.some(child => child.path === link.path);

              return (
                <li key={link.name}>
                  <div className={`flex w-full items-center justify-between ${navItemClass(active)}`}>
                    {hasOverviewPage ? (
                      <Link href={link.path} className='flex-1'>
                        {link.name}
                      </Link>
                    ) : (
                      <button type='button' onClick={toggleDropdown} className='flex-1 text-left'>
                        {link.name}
                      </button>
                    )}
                    <button
                      type='button'
                      aria-label={dropdownOpen ? `收合${link.name}` : `展開${link.name}`}
                      onClick={toggleDropdown}
                      className='shrink-0 p-1 -m-1'
                    >
                      <ChevronDown
                        size={14}
                        className={
                          dropdownOpen ? 'rotate-180 transition-transform' : 'transition-transform'
                        }
                      />
                    </button>
                  </div>
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

        {/* 頁尾：目前公司名稱（有 demo uuid 時可切換）+ 登出 */}
        <div className='shrink-0 border-t border-surface-cream p-3'>
          {isDemoModeAvailable ? (
            <div className='relative mb-2'>
              <button
                type='button'
                onClick={() => setCompanyMenuOpen(o => !o)}
                className='flex w-full items-center gap-1.5 rounded-md px-3 py-1 text-xs text-neutral-mid transition-colors hover:bg-surface-cream hover:text-brand-primary'
              >
                <Building2 size={14} className='shrink-0' />
                <span className='truncate'>{demoActive ? 'Demo 有限公司' : companyName}</span>
                <ChevronDown
                  size={12}
                  className={`ml-auto shrink-0 ${
                    companyMenuOpen ? 'rotate-180 transition-transform' : 'transition-transform'
                  }`}
                />
              </button>
              {companyMenuOpen && (
                <ul className='absolute bottom-full left-0 mb-1 w-full rounded-lg border border-neutral-blue-gray/30 bg-white py-1 text-xs shadow-level1'>
                  <li>
                    <button
                      type='button'
                      onClick={() => (demoActive ? setDemoMode(false) : setCompanyMenuOpen(false))}
                      className={`flex w-full items-center justify-between gap-2 truncate px-3 py-2 text-left transition-colors ${
                        !demoActive ? 'bg-brand-blue/10 font-semibold text-brand-blue' : 'text-neutral-dark hover:bg-surface-cream'
                      }`}
                    >
                      <span className='truncate'>{companyName || '正式公司'}</span>
                      {!demoActive && <Check size={14} className='shrink-0' />}
                    </button>
                  </li>
                  <li>
                    <button
                      type='button'
                      onClick={() => (demoActive ? setCompanyMenuOpen(false) : setDemoMode(true))}
                      className={`flex w-full items-center justify-between gap-2 truncate px-3 py-2 text-left transition-colors ${
                        demoActive ? 'bg-brand-blue/10 font-semibold text-brand-blue' : 'text-neutral-dark hover:bg-surface-cream'
                      }`}
                    >
                      <span className='truncate'>Demo 有限公司</span>
                      {demoActive && <Check size={14} className='shrink-0' />}
                    </button>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            companyName && (
              <div className='mb-2 flex items-center gap-1.5 px-3 text-xs text-neutral-mid'>
                <Building2 size={14} className='shrink-0' />
                <span className='truncate'>{companyName}</span>
              </div>
            )
          )}
          <button
            type='button'
            className='flex w-full items-center gap-1.5 rounded-md border border-surface-cream px-3 py-1.5 text-[13px] text-neutral-dark transition-colors hover:bg-surface-cream hover:text-brand-primary'
          >
            <ArrowRight size={13} />
            登出
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
