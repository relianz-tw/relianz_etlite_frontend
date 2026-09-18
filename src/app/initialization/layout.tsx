import { InitializationLayout } from '@/components/initialization/InitializationLayout';
import { InitializationProvider } from '@/features/initialization/state/InitializationContext';
import { Toaster } from 'sonner';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InitializationProvider>
        <InitializationLayout>{children}</InitializationLayout>
      </InitializationProvider>
      <Toaster position='top-center' />
    </>
  );
}
