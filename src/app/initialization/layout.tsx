import { InitializationLayout } from '@/components/initialization/InitializationLayout';
import { ReferenceProvider } from '@/features/initialization/reference/ReferenceContext';
import { InitializationProvider } from '@/features/initialization/state/InitializationContext';
import { Toaster } from 'sonner';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InitializationProvider>
        <ReferenceProvider>
          <InitializationLayout>{children}</InitializationLayout>
        </ReferenceProvider>
      </InitializationProvider>
      <Toaster position='top-center' />
    </>
  );
}
