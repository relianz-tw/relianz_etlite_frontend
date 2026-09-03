import { LockProvider } from '@/features/withholding/components/LockContext';
import type { ReactNode } from 'react';

export default function WithholdingLayout({ children }: { children: ReactNode }) {
  return <LockProvider>{children}</LockProvider>;
}
