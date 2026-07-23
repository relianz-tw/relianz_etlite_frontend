import LedgerView from '@/features/ledger/LedgerView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '帳簿 | Easytax Lite',
};

export default function LedgerPage() {
  return <LedgerView />;
}
