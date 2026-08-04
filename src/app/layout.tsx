import './globals.css';
import AppShell from '@/components/AppShell';
import type { Metadata, Viewport } from 'next';
import { Noto_Sans_TC, Noto_Serif_TC } from 'next/font/google';

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-noto-sans-tc',
});

const notoSerifTC = Noto_Serif_TC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-noto-serif-tc',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Easytax Lite',
  description: 'Easytax Lite',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='zh-TW'>
      <body
        className={`${notoSansTC.variable} ${notoSerifTC.variable} font-notoSans`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
