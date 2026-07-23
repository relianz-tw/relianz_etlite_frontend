'use client';

import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  valueClassName?: string;
  chart?: ReactNode;
  caption?: string;
}

export default function StatCard({ label, value, valueClassName = 'text-neutral-dark', chart, caption }: StatCardProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-lg border border-neutral-blue-gray/30 bg-white p-5">
      <div className="mb-2.5 text-[13px] font-semibold text-neutral-mid">{label}</div>
      <div className={`whitespace-nowrap font-mono text-2xl font-semibold tabular-nums ${valueClassName}`}>
        {value}
      </div>
      {chart && <div className="mt-3">{chart}</div>}
      {caption && <div className="mt-auto pt-3 text-xs leading-relaxed text-neutral-mid">{caption}</div>}
    </div>
  );
}
