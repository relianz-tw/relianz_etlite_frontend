import SettingsView from '@/features/settings/SettingsView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '設定 | Easytax Lite',
};

export default function SettingsPage() {
  return <SettingsView />;
}
