import PaymentCheckPage from './payment-check';
import { Suspense } from 'react';

export default function CheckPage() {
  return (
    <Suspense>
      <PaymentCheckPage />
    </Suspense>
  );
}
