'use client';

import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DatePicker from '@/components/ui/DatePicker';
import MoneyInput from '@/components/ui/MoneyInput';
import SectionCard from '@/components/ui/SectionCard';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import TextInput from '@/components/ui/TextInput';
import { fmtCurrency } from '@/lib/utils';
import { Backpack, Briefcase, ChevronLeft, MessageSquare, Pencil, User, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Field from '../../components/Field';
import LockedBanner from '../../components/LockedBanner';
import { useLock } from '../../components/LockContext';
import { availableYears, calculateNetPayment, calculateNhiAmount, calculateWithholdingAmount, categoryLabel, PRACTICE_TYPE_OPTIONS, showsNhi } from '../data';
import { addWithholdingRecord, deleteWithholdingRecord, getWithholdingRecord, updateWithholdingRecord } from '../mockStore';
import type { WithholdingInput } from '../mockStore';
import type { CategoryCode, EarnerType } from '../types';
import WithholdingPdfManager from './WithholdingPdfManager';

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const PROFESSIONAL_CODES: CategoryCode[] = ['9A', '9B'];

function toDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

interface GeneralFormFieldsProps {
  categoryCode: CategoryCode;
  disabled: boolean;
  isEdit: boolean;
  initial: {
    earnerType: EarnerType;
    practiceTypeCode: string;
    paymentDate: Date;
    incomeYear: number;
    incomeMonth: number;
    recipientName: string;
    recipientAddress: string;
    recipientIdNumber: string;
    grossIncome: number;
    withholdingAmount: number;
    nhiAmount: number;
    remarks: string;
  };
  onSubmit: (data: WithholdingInput) => void;
}

/** 通用扣繳表單欄位；new 模式與 disabled 切換為 false 的編輯模式共用，key 由外層依 record/resetKey 控制重新掛載以還原初始值 */
function GeneralFormFields({ categoryCode: initialCategoryCode, disabled, isEdit, initial, onSubmit }: GeneralFormFieldsProps) {
  const [categoryCode, setCategoryCode] = useState<CategoryCode>(initialCategoryCode);
  const [earnerType, setEarnerType] = useState<EarnerType>(initial.earnerType);
  const [practiceTypeCode, setPracticeTypeCode] = useState(initial.practiceTypeCode);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(initial.paymentDate);
  const [incomeYear, setIncomeYear] = useState(initial.incomeYear);
  const [incomeMonth, setIncomeMonth] = useState(initial.incomeMonth);
  const [incomeTouched, setIncomeTouched] = useState(false);
  const [recipientName, setRecipientName] = useState(initial.recipientName);
  const [recipientAddress, setRecipientAddress] = useState(initial.recipientAddress);
  const [recipientIdNumber, setRecipientIdNumber] = useState(initial.recipientIdNumber);
  const [grossIncome, setGrossIncome] = useState(initial.grossIncome);
  const [manualWithholding, setManualWithholding] = useState<number | null>(isEdit ? initial.withholdingAmount : null);
  const [manualNhi, setManualNhi] = useState<number | null>(isEdit ? initial.nhiAmount : null);
  const [remarks, setRemarks] = useState(initial.remarks);
  const [error, setError] = useState('');

  const isProfessional = PROFESSIONAL_CODES.includes(categoryCode);
  const earnerOptions: { value: EarnerType; label: string }[] = isProfessional
    ? [
        { value: 'individual', label: '個人' },
        { value: 'firm', label: '事務所' },
        { value: 'company', label: '公司' },
      ]
    : [
        { value: 'individual', label: '個人' },
        { value: 'company', label: '公司' },
      ];

  const nhiVisible = showsNhi(categoryCode, earnerType);
  const withholdingVisible = categoryCode !== '92';
  const withholdingAmount = withholdingVisible ? (manualWithholding ?? calculateWithholdingAmount(categoryCode, grossIncome)) : 0;
  const nhiAmount = nhiVisible ? (manualNhi ?? calculateNhiAmount(categoryCode, grossIncome, earnerType)) : 0;
  const netPayment = calculateNetPayment(grossIncome, withholdingAmount, nhiAmount);
  const hideOtherFields = earnerType === 'company';
  const grossIncomeLabel = categoryCode === '97' ? '贈與金額' : '給付金額';

  const handlePaymentDateChange = (date: Date | undefined) => {
    setPaymentDate(date);
    if (date && !incomeTouched) {
      setIncomeYear(date.getFullYear());
      setIncomeMonth(date.getMonth() + 1);
    }
  };

  const handleCategoryToggle = (next: CategoryCode) => {
    setCategoryCode(next);
    setPracticeTypeCode('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientIdNumber.trim() || !paymentDate || grossIncome <= 0) {
      setError('請填寫所有必填欄位');
      return;
    }
    if (isProfessional && !practiceTypeCode) {
      setError('請選擇業別代號');
      return;
    }
    onSubmit({
      categoryCode,
      earnerType,
      residency: 'domestic',
      incomeCategory: isProfessional ? (categoryCode as '9A' | '9B') : undefined,
      practiceTypeCode: isProfessional ? practiceTypeCode : undefined,
      recipientName: recipientName.trim(),
      recipientIdNumber: recipientIdNumber.trim(),
      recipientAddress: recipientAddress.trim(),
      landlords: [],
      rentalAddress: '',
      rentalAddressTaxId: '',
      burden: 'tenant',
      rentalFiles: [],
      paymentYear: paymentDate.getFullYear(),
      paymentMonth: paymentDate.getMonth() + 1,
      paymentDay: paymentDate.getDate(),
      incomeYear,
      incomeMonth,
      grossIncome,
      withholdingAmount,
      nhiAmount,
      netPayment,
      remarks: remarks.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <fieldset disabled={disabled} className="flex flex-col gap-5">
        <SectionCard title="基本資訊" icon={User}>
          <div className="grid grid-cols-1 gap-4 nav:grid-cols-2">
            <Field label="所得人身份" required className="nav:col-span-2">
              <SegmentedControl options={earnerOptions} value={earnerType} onChange={setEarnerType} fit />
            </Field>
            <Field label="給付日期" required>
              <DatePicker value={paymentDate} onChange={handlePaymentDateChange} />
            </Field>
            <div />
            <Field label="所得所屬年份" required>
              <Select
                widthClassName="w-full"
                value={String(incomeYear)}
                onValueChange={v => {
                  setIncomeTouched(true);
                  setIncomeYear(Number(v));
                }}
                aiFilled={!incomeTouched}
              >
                {availableYears().map(y => (
                  <option key={y} value={String(y)}>
                    {y - 1911} 年
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="所得所屬月份" required>
              <Select
                widthClassName="w-full"
                value={String(incomeMonth)}
                onValueChange={v => {
                  setIncomeTouched(true);
                  setIncomeMonth(Number(v));
                }}
                aiFilled={!incomeTouched}
              >
                {MONTH_OPTIONS.map(m => (
                  <option key={m} value={String(m)}>
                    {m} 月
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </SectionCard>

        {hideOtherFields ? (
          <div className="rounded-md border border-brand-blue/20 bg-brand-blue/5 px-4 py-3 text-sm text-neutral-dark">
            所得人為公司行號時請到{' '}
            <Link href="/ledger" className="font-semibold text-brand-blue hover:underline">
              帳簿
            </Link>{' '}
            選擇新增進項憑證即可。
          </div>
        ) : (
          <>
            {isProfessional && (
              <SectionCard title="業務類別" icon={Briefcase}>
                <div className="grid grid-cols-1 gap-4 nav:grid-cols-2">
                  <Field label="所得類別" required>
                    <SegmentedControl
                      options={[
                        { value: '9A', label: '9A 執行業務' },
                        { value: '9B', label: '9B 稿費' },
                      ]}
                      value={categoryCode}
                      onChange={handleCategoryToggle}
                    />
                  </Field>
                  <Field label="業別代號" required>
                    <Select widthClassName="w-full" value={practiceTypeCode} onValueChange={setPracticeTypeCode}>
                      <option value="">請選擇業別代號</option>
                      {PRACTICE_TYPE_OPTIONS[categoryCode as '9A' | '9B'].map(o => (
                        <option key={o.code} value={o.code}>
                          {o.code} - {o.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </SectionCard>
            )}

            <SectionCard title="所得人資訊" icon={User}>
              <div className="grid grid-cols-1 gap-4 nav:grid-cols-2">
                <Field label="所得人名稱" required>
                  <TextInput value={recipientName} onChange={e => setRecipientName(e.target.value)} />
                </Field>
                <Field label={earnerType === 'individual' ? '身分證字號' : '統一編號'} required>
                  <TextInput
                    value={recipientIdNumber}
                    maxLength={earnerType === 'individual' ? 10 : 8}
                    onChange={e =>
                      setRecipientIdNumber(earnerType === 'individual' ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, ''))
                    }
                  />
                </Field>
                <Field label="所得人地址" className="nav:col-span-2">
                  <TextInput value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)} />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="金額資訊" icon={Backpack}>
              <div className="flex flex-col gap-4">
                <Field label={grossIncomeLabel} required>
                  <MoneyInput value={grossIncome} onChange={setGrossIncome} />
                </Field>
                {withholdingVisible && (
                  <Field label="扣繳金額">
                    <MoneyInput value={withholdingAmount} onChange={v => setManualWithholding(v)} />
                  </Field>
                )}
                {nhiVisible && (
                  <Field label="二代健保">
                    <MoneyInput value={nhiAmount} onChange={v => setManualNhi(v)} />
                  </Field>
                )}
                <Field label="實付金額">
                  <TextInput disabled value={fmtCurrency(netPayment)} />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="備註" icon={MessageSquare}>
              <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="輸入備註說明..." />
            </SectionCard>
          </>
        )}
      </fieldset>

      {!disabled && (
        <div className="flex flex-col gap-3">
          {error && <p className="text-sm text-semantic-error">{error}</p>}
          <Button type="submit" className="w-full">
            {isEdit ? '更新' : '儲存'}
          </Button>
        </div>
      )}
    </form>
  );
}

export default function GeneralForm({ recordId }: { recordId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLocked } = useLock();
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);
  void tick;

  const record = recordId ? getWithholdingRecord(recordId) : undefined;
  const isEdit = Boolean(recordId);

  const icParam = searchParams.get('ic') as CategoryCode | null;
  const initialCategory: CategoryCode = record?.categoryCode ?? (icParam && icParam !== '51' ? icParam : '9A');

  const [isEditing, setIsEditing] = useState(!isEdit);
  const [resetKey, setResetKey] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (recordId && !record) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-off-white text-sm text-neutral-mid">找不到此扣繳資料</div>;
  }

  const initial = record
    ? {
        earnerType: record.earnerType,
        practiceTypeCode: record.practiceTypeCode ?? '',
        paymentDate: toDate(record.paymentYear, record.paymentMonth, record.paymentDay),
        incomeYear: record.incomeYear,
        incomeMonth: record.incomeMonth,
        recipientName: record.recipientName,
        recipientAddress: record.recipientAddress,
        recipientIdNumber: record.recipientIdNumber,
        grossIncome: record.grossIncome,
        withholdingAmount: record.withholdingAmount,
        nhiAmount: record.nhiAmount,
        remarks: record.remarks,
      }
    : {
        earnerType: 'individual' as EarnerType,
        practiceTypeCode: '',
        paymentDate: new Date(),
        incomeYear: availableYears()[0],
        incomeMonth: new Date().getMonth() + 1,
        recipientName: '',
        recipientAddress: '',
        recipientIdNumber: '',
        grossIncome: 0,
        withholdingAmount: 0,
        nhiAmount: 0,
        remarks: '',
      };

  const handleSubmit = (data: WithholdingInput) => {
    if (record) {
      updateWithholdingRecord(record.uuid, data);
      setIsEditing(false);
      refresh();
    } else {
      const created = addWithholdingRecord(data);
      router.push(`/withholding/other/${created.uuid}`);
    }
  };

  const handleDelete = () => {
    if (!record) return;
    deleteWithholdingRecord(record.uuid);
    router.push('/withholding/other');
  };

  const title = isEdit ? `${categoryLabel(initialCategory)}扣繳詳細` : `新增${categoryLabel(initialCategory)}扣繳資料`;

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[760px] px-4 pt-4 pb-10 nav:px-7 nav:pt-7">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/withholding/other" className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-mid hover:bg-surface-cream hover:text-neutral-dark">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="flex-1 font-notoSerif text-[22px] font-semibold tracking-tight text-neutral-dark">{title}</h1>
          {isEdit &&
            (isEditing ? (
              <Button
                variant="outline"
                size="sm"
                icon={X}
                onClick={() => {
                  setIsEditing(false);
                  setResetKey(k => k + 1);
                }}
              >
                取消
              </Button>
            ) : (
              <Button variant="outline" size="sm" icon={Pencil} onClick={() => setIsEditing(true)} disabled={isLocked}>
                編輯
              </Button>
            ))}
        </div>

        <LockedBanner className="mb-5" />

        <GeneralFormFields
          key={`${record?.uuid ?? 'new'}-${resetKey}`}
          categoryCode={initialCategory}
          disabled={isEdit && !isEditing}
          isEdit={isEdit}
          initial={initial}
          onSubmit={handleSubmit}
        />

        {record && !isEditing && (
          <div className="mt-5 flex flex-col gap-5">
            <WithholdingPdfManager record={record} onChange={refresh} />
            <Button variant="danger" className="w-full" onClick={() => setDeleteOpen(true)} disabled={isLocked}>
              刪除此筆扣繳資料
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="確認刪除此筆扣繳資料？" message="此操作無法復原。" />
    </div>
  );
}
