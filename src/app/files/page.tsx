import CloudFilesView from '@/features/cloud-files/CloudFilesView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '雲端資料夾 | Easytax Lite',
};

export default function FilesPage() {
  return <CloudFilesView />;
}
