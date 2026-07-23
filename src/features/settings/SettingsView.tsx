'use client';

import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import { useState } from 'react';
import type { ReactNode } from 'react';
import BasicInfoTab from './components/BasicInfoTab';
import BillingTab from './components/BillingTab';
import InvoiceBookTab from './components/InvoiceBookTab';
import OperatingStatusTab from './components/OperatingStatusTab';
import PaymentSettingsTab from './components/PaymentSettingsTab';
import PlanDetailTab from './components/PlanDetailTab';
import TagsProjectsTab from './components/TagsProjectsTab';
import type { SettingsTab } from './types';

const SETTINGS_TABS: { value: SettingsTab; label: string }[] = [
  { value: 'basic', label: '基本設定' },
  { value: 'tagsProjects', label: '標籤與專案' },
  { value: 'invoiceBook', label: '發票簿' },
  { value: 'planDetail', label: '方案細節' },
  { value: 'billing', label: '帳單' },
  { value: 'operatingStatus', label: '營業狀態紀錄' },
  { value: 'paymentSettings', label: '收款設定' },
];

function renderActiveTab(tab: SettingsTab): ReactNode {
  switch (tab) {
    case 'basic':
      return <BasicInfoTab />;
    case 'tagsProjects':
      return <TagsProjectsTab />;
    case 'invoiceBook':
      return <InvoiceBookTab />;
    case 'planDetail':
      return <PlanDetailTab />;
    case 'billing':
      return <BillingTab />;
    case 'operatingStatus':
      return <OperatingStatusTab />;
    case 'paymentSettings':
      return <PaymentSettingsTab />;
  }
}

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('basic');

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 py-7 nav:px-7">
        <div className="mb-6 flex flex-col gap-4 nav:flex-row nav:items-center nav:justify-between">
          <h1 className="font-notoSerif text-[26px] font-semibold tracking-tight text-neutral-dark nav:text-[28px]">
            設定
          </h1>
          <div className="w-full nav:w-auto">
            <div className="hidden nav:block">
              <SegmentedControl options={SETTINGS_TABS} value={activeTab} onChange={setActiveTab} size="md" fit />
            </div>
            <div className="nav:hidden">
              <Select widthClassName="w-full" value={activeTab} onValueChange={v => setActiveTab(v as SettingsTab)}>
                {SETTINGS_TABS.map(tab => (
                  <option key={tab.value} value={tab.value}>
                    {tab.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {renderActiveTab(activeTab)}
      </div>
    </div>
  );
}
