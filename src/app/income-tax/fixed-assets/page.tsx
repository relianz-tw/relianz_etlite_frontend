import FixedAssetsView from '@/features/income-tax/fixed-assets/FixedAssetsView';
import { Suspense } from 'react';

export default function FixedAssetsPage() {
  return (
    <Suspense>
      <FixedAssetsView />
    </Suspense>
  );
}
