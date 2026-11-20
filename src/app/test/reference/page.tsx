import { ReferenceTestClient } from './reference-test-client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '原件座標測試 | Easytax Lite' };

export default function ReferenceTestPage() {
  return <ReferenceTestClient />;
}
