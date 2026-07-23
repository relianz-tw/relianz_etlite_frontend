import TextInput from '@/components/ui/TextInput';
import { KeyRound, Pencil } from 'lucide-react';
import {
  BASIC_INFO_ADDRESS,
  BASIC_INFO_CONTACT,
  BASIC_INFO_EMAIL,
  BASIC_INFO_FIELDS,
  BASIC_INFO_LABOR_RISK,
  BASIC_INFO_ZIP,
} from '../data';

export default function BasicInfoTab() {
  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-neutral-dark">基本資料</h2>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-brand-blue">
            <Pencil size={14} />
            編輯基本資料
          </span>
          <span className="flex items-center gap-1.5 text-brand-blue">
            <KeyRound size={14} />
            變更密碼
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-5 nav:grid-cols-2">
        {BASIC_INFO_FIELDS.map(field => (
          <div key={field.label}>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">{field.label}</label>
            <TextInput value={field.value} disabled readOnly />
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 nav:grid-cols-[120px_1fr]">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">郵遞區號</label>
          <TextInput value={BASIC_INFO_ZIP} disabled readOnly />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">登記地址</label>
          <TextInput value={BASIC_INFO_ADDRESS} disabled readOnly />
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">職災費率類別</label>
        <TextInput value={BASIC_INFO_LABOR_RISK} disabled readOnly />
      </div>

      <div className="mt-6 rounded-md bg-surface-cream p-4">
        <h3 className="mb-4 text-sm font-semibold text-neutral-dark">聯絡資訊</h3>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 nav:grid-cols-2">
          {BASIC_INFO_CONTACT.map(field => (
            <div key={field.label}>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">{field.label}</label>
              <TextInput value={field.value} disabled readOnly />
            </div>
          ))}
        </div>
        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">電子郵件信箱</label>
          <TextInput value={BASIC_INFO_EMAIL} disabled readOnly />
        </div>
      </div>
    </div>
  );
}
