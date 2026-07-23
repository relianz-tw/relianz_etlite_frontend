'use client';

import { navLinks } from '@/data/navLinks';
import { ArrowRight, ChevronDown, Menu, SquarePlus, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const isActive = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`);

const navItemClass = (active: boolean) =>
  `flex items-center gap-1 rounded-md px-3 py-1.5 transition-colors ${
    active
      ? 'font-medium text-brand-primary bg-surface-cream'
      : 'text-neutral-dark hover:font-medium hover:text-brand-primary hover:bg-surface-cream'
  }`;

const Navbar = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setDesktopDropdownOpen(false);
    setMobileDropdownOpen(false);
  }, [pathname]);

  return (
    <div className='fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between bg-surface-off-white border-b border-surface-cream px-4'>
      <picture>
        <img
          src='/logo.png'
          alt='logo'
          className='mb-2 w-[100px] nav:w-[140px]'
          fetchPriority='high'
        />
      </picture>

      {/* 桌面選單 */}
      <ul className='hidden items-center gap-1 text-sm nav:flex'>
        {navLinks.map(link => {
          const active = isActive(pathname, link.path);

          if (link.children) {
            return (
              <li key={link.name} className='relative'>
                <button
                  type='button'
                  onClick={() => setDesktopDropdownOpen(open => !open)}
                  className={navItemClass(active)}
                >
                  {link.name}
                  <ChevronDown
                    size={14}
                    className={
                      desktopDropdownOpen ? 'rotate-180 transition-transform' : 'transition-transform'
                    }
                  />
                </button>
                {desktopDropdownOpen && (
                  <>
                    <div
                      className='fixed inset-0 z-40'
                      onClick={() => setDesktopDropdownOpen(false)}
                    />
                    <ul className='absolute left-0 top-full z-50 mt-1 w-36 rounded-md border border-surface-cream bg-white py-1 shadow-level1'>
                      {link.children.map(child => (
                        <li key={child.path}>
                          <Link href={child.path} className='block px-3 py-1.5 text-neutral-dark hover:text-brand-primary hover:bg-surface-cream'>
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
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
        <li>
          <button
            type='button'
            className='flex items-center gap-1 rounded-md border border-surface-cream px-3 py-1.5 text-neutral-dark transition-colors hover:text-brand-primary hover:bg-surface-cream'
          >
            <ArrowRight size={14} />
            登出
          </button>
        </li>
      </ul>

      {/* 手機版 hamburger 按鈕 */}
      <button
        type='button'
        aria-label={mobileOpen ? '關閉選單' : '開啟選單'}
        onClick={() => setMobileOpen(open => !open)}
        className='text-neutral-dark hover:text-brand-primary nav:hidden'
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* 手機版抽屜選單 */}
      {mobileOpen && (
        <>
          <div
            className='fixed inset-0 top-16 z-40 bg-neutral-dark/40 nav:hidden'
            onClick={() => setMobileOpen(false)}
          />
          <div className='fixed inset-y-0 right-0 top-16 z-50 w-72 overflow-y-auto bg-white p-4 shadow-level1 nav:hidden'>
            <ul className='flex flex-col gap-1 text-sm'>
              {navLinks.map(link => {
                const active = isActive(pathname, link.path);

                if (link.children) {
                  return (
                    <li key={link.name}>
                      <button
                        type='button'
                        onClick={() => setMobileDropdownOpen(open => !open)}
                        className={`flex w-full items-center justify-between ${navItemClass(active)}`}
                      >
                        {link.name}
                        <ChevronDown
                          size={14}
                          className={
                            mobileDropdownOpen ? 'rotate-180 transition-transform' : 'transition-transform'
                          }
                        />
                      </button>
                      {mobileDropdownOpen && (
                        <ul className='ml-3 mt-1 flex flex-col gap-1 border-l border-surface-cream pl-3'>
                          {link.children.map(child => (
                            <li key={child.path}>
                              <Link href={child.path} className='block rounded-md px-3 py-2 text-neutral-dark hover:text-brand-primary hover:bg-surface-cream'>
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
              <li>
                <button
                  type='button'
                  className='flex w-full items-center gap-1 rounded-md border border-surface-cream px-3 py-2 text-neutral-dark transition-colors hover:text-brand-primary hover:bg-surface-cream'
                >
                  <ArrowRight size={14} />
                  登出
                </button>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default Navbar;
