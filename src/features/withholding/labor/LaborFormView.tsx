'use client';

import { calculateLabour, createLabour, saveLabourProvider, searchLabourProvidersByName } from '@/api/labour';
import type { LabourProviderDto } from '@/api/types';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import DatePicker from '@/components/ui/DatePicker';
import MoneyInput from '@/components/ui/MoneyInput';
import SectionCard from '@/components/ui/SectionCard';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { ApiError, getFriendlyErrorMessage } from '@/lib/errors';
import { Backpack, BookOpen, ChevronLeft, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Field from '../components/Field';
import LockedBanner from '../components/LockedBanner';
import { useLock } from '../components/LockContext';
import { NATIONALITY_OPTIONS, parseNationality, SERVICE_TYPE_OPTIONS } from './data';
import type { LaborNationalityCode, LaborServiceType } from './types';

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
  const [nameMatches, setNameMatches] = useState<LabourProviderDto[]>([]);
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [addressPostal, setAddressPostal] = useState('');
  const [nationality, setNationality] = useState<LaborNationalityCode>(0);
  const [isUnionInsured, setIsUnionInsured] = useState(false);
  const [serviceType, setServiceType] = useState<LaborServiceType>('9A');
  const [serviceName, setServiceName] = useState('');
  const [serviceDate, setServiceDate] = useState<Date | undefined>(undefined);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(toDate(today.year, today.month, today.day));
  const [payableAmount, setPayableAmount] = useState(0);
  const [withholdingTax, setWithholdingTax] = useState(0);
  const [secondHealthInsuranceFee, setSecondHealthInsuranceFee] = useState(0);
  const [actualPaymentAmount, setActualPaymentAmount] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [rememberProvider, setRememberProvider] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 姓名自動完成：debounce 300ms 後查詢，calcIdRef 相同機制避免舊查詢結果覆蓋新輸入
  const nameQueryIdRef = useRef(0);
  useEffect(() => {
    if (!showNameDropdown || !name.trim()) {
      setNameMatches([]);
      return;
    }
    const id = ++nameQueryIdRef.current;
    const timer = setTimeout(() => {
      searchLabourProvidersByName(name.trim())
        .then(list => {
          if (nameQueryIdRef.current === id) setNameMatches(list);
        })
        .catch(() => {
          // 自動完成查詢失敗僅影響下拉建議，不特別呈現錯誤訊息
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [name, showNameDropdown]);

  // 扣繳稅額／二代健保／實付試算：國籍、工作類型、工會投保、應付金額變動時 debounce 呼叫試算 API
  const calcIdRef = useRef(0);
  useEffect(() => {
    if (payableAmount <= 0) {
      setWithholdingTax(0);
      setSecondHealthInsuranceFee(0);
      setActualPaymentAmount(0);
      return;
    }
    const id = ++calcIdRef.current;
    setCalculating(true);
    const timer = setTimeout(() => {
      calculateLabour({ nationality, serviceType, sghi: isUnionInsured, amount: payableAmount })
        .then(result => {
          if (calcIdRef.current !== id) return;
          setWithholdingTax(result.tax);
          setSecondHealthInsuranceFee(result.ghi);
          setActualPaymentAmount(result.apa);
        })
        .catch(() => {
          // 試算失敗不阻擋填表，維持原數值
        })
        .finally(() => {
          if (calcIdRef.current === id) setCalculating(false);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [nationality, serviceType, isUnionInsured, payableAmount]);

  const selectedHint = SERVICE_TYPE_OPTIONS.find(o => o.value === serviceType)?.hint;

  // 勞務者資料無工會投保欄位，選取時不覆寫 isUnionInsured
  const handlePickProvider = (provider: LabourProviderDto) => {
    setName(provider.name);
    setIdNumber(provider.identifyNumber || provider.residencePermitNumber || provider.passportNumber || '');
    setPhone(provider.phone ?? '');
    setAddress(provider.address ?? '');
    if (provider.nationality !== null && provider.nationality !== undefined) setNationality(parseNationality(provider.nationality));
    setShowNameDropdown(false);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !serviceName.trim() || !serviceDate || !paymentDate || payableAmount === 0) {
      setError('請填寫所有必填欄位');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const result = await createLabour({
        name: name.trim(),
        nationality,
        isUnionInsured,
        phone: phone.trim(),
        serviceType,
        serviceName: serviceName.trim(),
        year: serviceDate.getFullYear(),
        month: serviceDate.getMonth() + 1,
        day: serviceDate.getDate(),
        identifyNumber: idNumber.trim(),
        address: address.trim(),
        addressPostal: addressPostal.trim(),
        payableAmount,
        withholdingTax,
        secondHealthInsuranceFee,
        actualPaymentAmount,
        paymentYear: paymentDate.getFullYear(),
        paymentMonth: paymentDate.getMonth() + 1,
        paymentDay: paymentDate.getDate(),
      });
      if (rememberProvider) {
        await saveLabourProvider({
          name: name.trim(),
          phone: phone.trim(),
          identifyNumber: idNumber.trim(),
          address: address.trim(),
          nationality,
        }).catch(() => {
          // 記住勞務者資料失敗不影響勞報單已建立成功，僅靜默失敗
        });
      }
      router.push('/withholding/labor');
    } catch (err) {
      // 後端「XXX 必填」的驗證錯誤會夾帶欄位英文名稱，統一改顯示通用訊息避免技術字眼外洩
      if (err instanceof ApiError && /必填/.test(err.message)) {
        setError('有欄位尚未填寫');
      } else {
        setError(getFriendlyErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
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
                        key={provider.providerUuid}
                        type="button"
                        onMouseDown={() => handlePickProvider(provider)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-surface-cream"
                      >
                        <span className="font-medium text-neutral-dark">{provider.name}</span>
                        <span className="font-mono text-xs text-neutral-mid">{provider.identifyNumber || provider.residencePermitNumber || provider.passportNumber || '無證件號碼'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Field label="國籍" required>
                <Select widthClassName="w-full" value={String(nationality)} onValueChange={v => setNationality(Number(v) as LaborNationalityCode)}>
                  {NATIONALITY_OPTIONS.map(o => (
                    <option key={o.value} value={String(o.value)}>
                      {o.label}
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
              <div className="nav:col-span-2">
                <div className="flex flex-col gap-4 nav:flex-row">
                  <Field label="郵遞區號" className="nav:w-32">
                    <TextInput value={addressPostal} onChange={e => setAddressPostal(e.target.value)} />
                  </Field>
                  <Field label="聯絡地址" className="flex-1">
                    <TextInput value={address} onChange={e => setAddress(e.target.value)} />
                  </Field>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-neutral-mid">留空時將於簽署頁由勞務提供者本人填寫</p>
              </div>
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
            </div>
          </SectionCard>

          <SectionCard title="應付及扣繳金額" icon={Backpack}>
            <div className="flex flex-col gap-4">
              <Field label="應付金額" required>
                <MoneyInput value={payableAmount} onChange={setPayableAmount} />
              </Field>
              <Field label="扣繳稅額" helper={calculating ? '試算中…' : '依國籍與工作類型自動試算'}>
                <MoneyInput disabled readOnly value={withholdingTax} />
              </Field>
              <Field label="二代健保費">
                <MoneyInput disabled readOnly value={secondHealthInsuranceFee} />
              </Field>
              <Field label="實際給付金額">
                <MoneyInput disabled readOnly value={actualPaymentAmount} />
              </Field>
            </div>
          </SectionCard>

          <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-5">
            <label className="flex cursor-pointer items-center gap-3">
              <Checkbox checked={rememberProvider} onChange={() => setRememberProvider(v => !v)} />
              <span className="text-sm text-neutral-dark">記住這位勞務者資料（下次搜尋名字後帶入資料）</span>
            </label>
          </div>

          {error && <p className="text-right text-sm text-semantic-error">{error}</p>}

          <Button className="w-full" onClick={handleSubmit} disabled={isLocked || submitting}>
            {submitting ? '送出中…' : '確認新增'}
          </Button>
        </div>
      </div>
    </div>
  );
}
