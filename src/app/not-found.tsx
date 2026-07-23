import { SearchX } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className='flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center'>
      <SearchX size={40} strokeWidth={1.5} className='text-brand-tan' />
      <p className='mt-6 font-display-en text-7xl font-semibold text-neutral-dark'>
        404
      </p>
      <h1 className='heading-card mt-2'>找不到頁面</h1>
      <p className='mt-2 text-neutral-mid'>您要找的頁面不存在，或已被移除。</p>
      <Link
        href='/'
        className='mt-8 rounded-md bg-brand-primary px-7 py-3 text-white transition-colors hover:bg-brand-blue-dark'
      >
        返回首頁
      </Link>
    </main>
  );
}
