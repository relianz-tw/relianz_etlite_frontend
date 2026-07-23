'use client';

import { Maximize2 } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  valueClassName?: string;
  chart?: ReactNode;
  caption?: string;
  /** 有值時卡片右上角顯示展開圖示，點擊導向該路由查看完整趨勢圖與明細資料 */
  detailHref?: string;
}

export default function StatCard({ label, value, valueClassName = 'text-neutral-dark', chart, caption, detailHref }: StatCardProps) {
  return (
    <div className="relative flex min-w-0 flex-1 flex-col rounded-lg border border-neutral-blue-gray/30 bg-white p-5">
      {detailHref && (
        <Link
          href={detailHref}
          aria-label={`查看${label}詳情`}
          className="absolute right-4 top-4 text-neutral-mid hover:text-brand-blue"
        >
          <Maximize2 size={16} />
        </Link>
      )}
      <div className="mb-2.5 text-[13px] font-semibold text-neutral-mid">{label}</div>
      <div className={`whitespace-nowrap font-mono text-2xl font-semibold tabular-nums ${valueClassName}`}>
        {value}
      </div>
      {chart && <div className="mt-3">{chart}</div>}
      {caption && <div className="mt-auto pt-3 text-xs leading-relaxed text-neutral-mid">{caption}</div>}
    </div>
  );
}
