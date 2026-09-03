'use client';

import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { Plus, Upload } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import LockedBanner from '../components/LockedBanner';
import { useLock } from '../components/LockContext';
import WithholdingTabs from '../components/WithholdingTabs';
import LaborCards from './components/LaborCards';
import LaborFilterBar, { type SignFilter } from './components/LaborFilterBar';
import LaborImportDialog from './components/LaborImportDialog';
import LaborTable from './components/LaborTable';
import { availableYears } from './data';
import { listLaborRecords } from './mockStore';

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function LaborListView() {
  const { isLocked } = useLock();
  const [signFilter, setSignFilter] = useState<SignFilter>('all');
  const [query, setQuery] = useState('');
  const [year, setYear] = useState(availableYears()[0]);
  const [month, setMonth] = useState(0); // 0 = 全部月份
  const [importOpen, setImportOpen] = useState(false);

  const records = listLaborRecords();

  const rows = useMemo(() => {
    return records
      .filter(r => r.paymentYear === year)
      .filter(r => month === 0 || r.paymentMonth === month)
      .filter(r => signFilter === 'all' || (signFilter === 'signed' ? r.signStatus === 1 : r.signStatus === 0))
      .filter(r => !query.trim() || r.name.includes(query.trim()) || r.serviceName.includes(query.trim()));
  }, [records, year, month, signFilter, query]);

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6 flex flex-col gap-4 nav:flex-row nav:items-start nav:justify-between">
          <div>
            <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">勞報單</h1>
            <p className="mt-1 text-sm text-neutral-mid">資料尚未串接後端，重新整理頁面會重置</p>
          </div>
          <WithholdingTabs active="labor" />
        </div>

        <LockedBanner className="mb-5" />

        <div className="mb-5 flex flex-col gap-3 nav:flex-row nav:items-center nav:justify-between">
          <div className="flex gap-2">
            <div className="w-32">
              <Select widthClassName="w-full" value={String(year)} onValueChange={v => setYear(Number(v))}>
                {availableYears().map(y => (
                  <option key={y} value={String(y)}>
                    {y - 1911} 年
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-32">
              <Select widthClassName="w-full" value={String(month)} onValueChange={v => setMonth(Number(v))}>
                <option value="0">全部月份</option>
                {MONTH_OPTIONS.map(m => (
                  <option key={m} value={String(m)}>
                    {m} 月
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" icon={Upload} disabled={isLocked} onClick={() => setImportOpen(true)}>
              批次匯入
            </Button>
            <Link href="/withholding/labor/create" className="inline-flex">
              <Button icon={Plus} disabled={isLocked}>
                新增勞報單
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-4">
          <LaborFilterBar signFilter={signFilter} onSignFilterChange={setSignFilter} query={query} onQueryChange={setQuery} />
        </div>

        <LaborTable rows={rows} />
        <LaborCards rows={rows} />
      </div>

      <LaborImportDialog open={importOpen} onClose={() => setImportOpen(false)} disabled={isLocked} />
    </div>
  );
}
