'use client';

import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import SlotList from './components/SlotList';
import { fetchCloudFiles, MOCK_YEARS, uploadCloudFile, type CloudFileMap } from './mockCloudFiles';
import { BUSINESS_TAX_SLOTS, INCOME_TAX_SLOTS, REGISTRATION_SLOTS, VAT_PERIODS } from './slots';

type Tab = 'registration' | 'vat' | 'cit';

const TAB_OPTIONS: { value: Tab; label: string }[] = [
  { value: 'registration', label: '登記資料' },
  { value: 'vat', label: '營業稅' },
  { value: 'cit', label: '營所稅' },
];

const MAX_SIZE_MB = 10;

export default function CloudFilesView() {
  const [tab, setTab] = useState<Tab>('registration');
  const [year, setYear] = useState(MOCK_YEARS[0]);
  const [files, setFiles] = useState<CloudFileMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCloudFiles()
      .then(setFiles)
      .catch(error => toast.error(error instanceof Error ? error.message : '讀取檔案失敗'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (slotKey: string, file: File) => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`「${file.name}」超過 ${MAX_SIZE_MB}MB 上限`);
      return;
    }
    try {
      const uploaded = await uploadCloudFile(slotKey, file);
      setFiles(prev => ({ ...prev, [slotKey]: uploaded }));
      toast.success('已上傳');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '上傳失敗');
    }
  };

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="flex flex-col gap-4 nav:flex-row nav:items-start nav:justify-between">
          <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">雲端資料夾</h1>
          <SegmentedControl className="w-full nav:w-80" options={TAB_OPTIONS} value={tab} onChange={setTab} />
        </div>

        {tab !== 'registration' && (
          <div className="w-32">
            <Select widthClassName="w-full" value={String(year)} onValueChange={v => setYear(Number(v))}>
              {MOCK_YEARS.map(y => (
                <option key={y} value={String(y)}>
                  {y - 1911} 年
                </option>
              ))}
            </Select>
          </div>
        )}

        {loading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
        ) : (
          <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-4 nav:p-8">
            {tab === 'registration' && <SlotList slots={REGISTRATION_SLOTS} files={files} keyPrefix="reg" onUpload={handleUpload} />}
            {tab === 'vat' && (
              <div className="flex flex-col gap-6">
                {VAT_PERIODS.map((period, index) => (
                  <section key={period.phase} className={`flex flex-col gap-4 ${index > 0 ? 'border-t border-neutral-blue-gray/30 pt-6' : ''}`}>
                    <h3 className="flex items-center gap-2 text-[15px] font-semibold text-neutral-dark">
                      <span className="h-4 w-[3px] rounded-full bg-brand-blue" />
                      {period.label}
                    </h3>
                    <SlotList slots={BUSINESS_TAX_SLOTS} files={files} keyPrefix={`vat:${year}:${period.phase}`} onUpload={handleUpload} />
                  </section>
                ))}
              </div>
            )}
            {tab === 'cit' && <SlotList slots={INCOME_TAX_SLOTS} files={files} keyPrefix={`cit:${year}`} onUpload={handleUpload} />}
          </div>
        )}
      </div>
    </div>
  );
}
