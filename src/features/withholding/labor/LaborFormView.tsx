'use client';

import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import DatePicker from '@/components/ui/DatePicker';
import MoneyInput from '@/components/ui/MoneyInput';
import SectionCard from '@/components/ui/SectionCard';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { fmtCurrency } from '@/lib/utils';
import { Backpack, BookOpen, ChevronLeft, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import Field from '../components/Field';
import LockedBanner from '../components/LockedBanner';
import { useLock } from '../components/LockContext';
import TagChipsField from './components/TagChipsField';
import { calculateActualPayment, calculateSecondHealthInsuranceFee, calculateWithholdingTax, NATIONALITY_OPTIONS, SERVICE_TYPE_OPTIONS } from './data';
import { addLaborRecord, addProject, addTag, listAllProjects, listAllTags, saveProvider, searchSavedProviders } from './mockStore';
import type { LaborServiceType } from './types';

function todayParts(): { year: number; month: number; day: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

function toDate(year: number, month: number, day: number): Date | undefined {
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

export default function LaborFormView() {
  const router = useRouter();
  const { isLocked } = useLock();
  const today = todayParts();

  const [name, setName] = useState('');
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState(NATIONALITY_OPTIONS[0]);
  const [isUnionInsured, setIsUnionInsured] = useState(false);
  const [serviceType, setServiceType] = useState<LaborServiceType>('9A');
  const [serviceName, setServiceName] = useState('');
  const [serviceDate, setServiceDate] = useState<Date | undefined>(undefined);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(toDate(today.year, today.month, today.day));
  const [payableAmount, setPayableAmount] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [rememberProvider, setRememberProvider] = useState(false);
  const [error, setError] = useState('');

  const nameMatches = showNameDropdown ? searchSavedProviders(name) : [];

  const withholdingTax = useMemo(() => calculateWithholdingTax(serviceType, payableAmount), [serviceType, payableAmount]);
  const secondHealthInsuranceFee = useMemo(() => calculateSecondHealthInsuranceFee(payableAmount), [payableAmount]);
  const actualPaymentAmount = useMemo(
    () => calculateActualPayment(payableAmount, withholdingTax, secondHealthInsuranceFee),
    [payableAmount, withholdingTax, secondHealthInsuranceFee],
  );

  const selectedHint = SERVICE_TYPE_OPTIONS.find(o => o.value === serviceType)?.hint;

  const handlePickProvider = (provider: ReturnType<typeof searchSavedProviders>[number]) => {
    setName(provider.name);
    setIdNumber(provider.idNumber);
    setPhone(provider.phone);
    setNationality(provider.nationality);
    setIsUnionInsured(provider.isUnionInsured);
    setShowNameDropdown(false);
  };

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim() || !serviceName.trim() || !serviceDate || !paymentDate || payableAmount === 0) {
      setError('請填寫所有必填欄位');
      return;
    }
    addLaborRecord({
      name: name.trim(),
      idNumber: idNumber.trim(),
      phone: phone.trim(),
      address: '',
      nationality,
      isUnionInsured,
      serviceType,
      serviceName: serviceName.trim(),
      serviceYear: serviceDate.getFullYear(),
      serviceMonth: serviceDate.getMonth() + 1,
      serviceDay: serviceDate.getDate(),
      paymentYear: paymentDate.getFullYear(),
      paymentMonth: paymentDate.getMonth() + 1,
      paymentDay: paymentDate.getDate(),
      payableAmount,
      withholdingTax,
      secondHealthInsuranceFee,
      actualPaymentAmount,
    });
    if (rememberProvider) {
      saveProvider({ name: name.trim(), idNumber: idNumber.trim(), phone: phone.trim(), nationality, isUnionInsured });
    }
    router.push('/withholding/labor');
  };

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[720px] px-4 pt-4 pb-10 nav:px-7 nav:pt-7">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/withholding/labor" className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-mid hover:bg-surface-cream hover:text-neutral-dark">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="font-notoSerif text-[22px] font-semibold tracking-tight text-neutral-dark">新增勞報單</h1>
        </div>

        <LockedBanner className="mb-5" />

        <div className="flex flex-col gap-5">
          <SectionCard title="勞務提供者資料" icon={User}>
            <div className="grid grid-cols-1 gap-4 nav:grid-cols-2">
              <div className="relative">
                <Field label="姓名" required>
                  <TextInput
                    value={name}
                    onChange={e => {
                      setName(e.target.value);
                      setShowNameDropdown(true);
                    }}
                    onFocus={() => setShowNameDropdown(true)}
                    onBlur={() => setTimeout(() => setShowNameDropdown(false), 150)}
                  />
                </Field>
                {nameMatches.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-neutral-blue-gray/30 bg-white py-1 shadow-level1">
                    {nameMatches.map(provider => (
                      <button
                        key={provider.idNumber || provider.name}
                        type="button"
                        onMouseDown={() => handlePickProvider(provider)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-surface-cream"
                      >
                        <span className="font-medium text-neutral-dark">{provider.name}</span>
                        <span className="font-mono text-xs text-neutral-mid">{provider.idNumber || '無身分證字號'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Field label="國籍" required>
                <Select widthClassName="w-full" value={nationality} onValueChange={setNationality}>
                  {NATIONALITY_OPTIONS.map(n => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="有無投保於工會" required>
                <SegmentedControl
                  options={[
                    { value: 'no', label: '沒有' },
                    { value: 'yes', label: '有' },
                  ]}
                  value={isUnionInsured ? 'yes' : 'no'}
                  onChange={v => setIsUnionInsured(v === 'yes')}
                />
              </Field>
              <Field label="身分證字號 / 居留證號碼">
                <TextInput value={idNumber} onChange={e => setIdNumber(e.target.value.toUpperCase())} />
              </Field>
              <Field label="手機號碼" required className="nav:col-span-2">
                <TextInput type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="勞務內容" icon={BookOpen}>
            <div className="flex flex-col gap-4">
              <Field label="工作類型" required helper={selectedHint}>
                <Select widthClassName="w-full" value={serviceType} onValueChange={v => setServiceType(v as LaborServiceType)}>
                  {SERVICE_TYPE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="專案名稱 / 勞務內容" required>
                <TextInput value={serviceName} onChange={e => setServiceName(e.target.value)} />
              </Field>
              <div className="grid grid-cols-1 gap-4 nav:grid-cols-2">
                <Field label="勞務提供日期" required helper="若勞務提供唯一段期間，請選擇勞務提供終止日期即可">
                  <DatePicker value={serviceDate} onChange={setServiceDate} />
                </Field>
                <Field label="付款日期" required>
                  <DatePicker value={paymentDate} onChange={setPaymentDate} />
                </Field>
              </div>
              <TagChipsField label="標籤" prefix="#" value={tags} onChange={setTags} options={listAllTags()} onCreateNew={addTag} />
              <TagChipsField label="專案" prefix="@" value={projects} onChange={setProjects} options={listAllProjects()} onCreateNew={addProject} />
            </div>
          </SectionCard>

          <SectionCard title="應付及扣繳金額" icon={Backpack}>
            <div className="flex flex-col gap-4">
              <Field label="應付金額" required>
                <MoneyInput value={payableAmount} onChange={setPayableAmount} />
              </Field>
              <Field label="扣繳稅額">
                <TextInput disabled value={fmtCurrency(withholdingTax)} />
              </Field>
              <Field label="二代健保費">
                <TextInput disabled value={fmtCurrency(secondHealthInsuranceFee)} />
              </Field>
              <Field label="實際給付金額">
                <TextInput disabled value={fmtCurrency(actualPaymentAmount)} />
              </Field>
            </div>
          </SectionCard>

          <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-5">
            <label className="flex cursor-pointer items-center gap-3">
              <Checkbox checked={rememberProvider} onChange={() => setRememberProvider(v => !v)} />
              <span className="text-sm text-neutral-dark">記住這位勞務者資料（下次搜尋名字後帶入資料）</span>
            </label>
          </div>

          {error && <p className="text-sm text-semantic-error">{error}</p>}

          <Button className="w-full" onClick={handleSubmit} disabled={isLocked}>
            確認新增
          </Button>
        </div>
      </div>
    </div>
  );
}
