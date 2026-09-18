'use client';

import { createWithholdingOther, deleteWithholdingOther, updateWithholdingOther } from '@/api/withholding';
import type { OtherWithholdingCategoryCode } from '@/api/withholding';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DatePicker from '@/components/ui/DatePicker';
import MoneyInput from '@/components/ui/MoneyInput';
import SectionCard from '@/components/ui/SectionCard';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import TextInput from '@/components/ui/TextInput';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { fmtCurrency } from '@/lib/utils';
import { Backpack, Briefcase, ChevronLeft, MessageSquare, Pencil, User, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Field from '../../components/Field';
import LockedBanner from '../../components/LockedBanner';
import { useLock } from '../../components/LockContext';
import { availableYears, calculateNetPayment, calculateNhiAmount, calculateWithholdingAmount, categoryLabel, showsNhi, VOUCHER_TYPE_OPTIONS } from '../data';
import { buildWithholdingOtherSaveBody } from '../mapper';
import type { CategoryCode, EarnerType, VoucherType, WithholdingRecord } from '../types';
import { useWithholdingCodes } from '../useWithholdingCodes';
import WithholdingPdfManager from './WithholdingPdfManager';

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const PROFESSIONAL_CODES: CategoryCode[] = ['9A', '9B'];

function toDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

interface GeneralFormFieldsProps {
  categoryCode: CategoryCode;
  /** 新增模式才允許切換 9A/9B；編輯模式類別固定（各類別各自獨立表，PATCH 無法跨表移動資料） */
  allowCategoryToggle: boolean;
  disabled: boolean;
  isEdit: boolean;
  initial: {
    earnerType: EarnerType;
    voucherType: VoucherType;
    practiceTypeCode: string;
    royaltyExpenseCode: string;
    otherIncomeTypeCode: string;
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
  onSubmit: (categoryCode: CategoryCode, body: ReturnType<typeof buildWithholdingOtherSaveBody>) => void;
}

/** 通用扣繳表單欄位；new 模式與 disabled 切換為 false 的編輯模式共用，key 由外層依 record/resetKey 控制重新掛載以還原初始值 */
function GeneralFormFields({ categoryCode: initialCategoryCode, allowCategoryToggle, disabled, isEdit, initial, onSubmit }: GeneralFormFieldsProps) {
  const [categoryCode, setCategoryCode] = useState<CategoryCode>(initialCategoryCode);
  const [earnerType, setEarnerType] = useState<EarnerType>(initial.earnerType);
  const [voucherType, setVoucherType] = useState<VoucherType>(initial.voucherType);
  const [practiceTypeCode, setPracticeTypeCode] = useState(initial.practiceTypeCode);
  const [royaltyExpenseCode, setRoyaltyExpenseCode] = useState(initial.royaltyExpenseCode);
  const [otherIncomeTypeCode, setOtherIncomeTypeCode] = useState(initial.otherIncomeTypeCode);
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

  const { codes: practiceCodes } = useWithholdingCodes(1);
  const { codes: royaltyCodes } = useWithholdingCodes(2);
  const { codes: otherIncomeCodes } = useWithholdingCodes(3);

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
    setRoyaltyExpenseCode('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientIdNumber.trim() || !paymentDate || grossIncome <= 0) {
      setError('請填寫所有必填欄位');
      return;
    }
    if (isProfessional && categoryCode === '9A' && !practiceTypeCode) {
      setError('請選擇業別代號');
      return;
    }
    if (isProfessional && categoryCode === '9B' && !royaltyExpenseCode) {
      setError('請選擇必要費用別');
      return;
    }
    if (categoryCode === '92' && !otherIncomeTypeCode) {
      setError('請選擇給付項目代號');
      return;
    }

    const body = buildWithholdingOtherSaveBody({
      category: categoryCode as OtherWithholdingCategoryCode,
      earnerType,
      voucherType,
      recipientName: recipientName.trim(),
      recipientIdNumber: recipientIdNumber.trim(),
      recipientAddress: recipientAddress.trim(),
      grossIncome,
      withholdingAmount,
      nhiAmount,
      netPayment,
      remarks: remarks.trim(),
      incomeYear,
      incomeMonth,
      paymentDate,
      practiceTypeCode: categoryCode === '9A' ? practiceTypeCode : undefined,
      royaltyExpenseCode: categoryCode === '9B' ? royaltyExpenseCode : undefined,
      otherIncomeTypeCode: categoryCode === '92' ? otherIncomeTypeCode : undefined,
    });
    onSubmit(categoryCode, body);
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
            <Field label="憑證類別" required>
              <Select widthClassName="w-full" value={voucherType} onValueChange={v => setVoucherType(v as VoucherType)}>
                {VOUCHER_TYPE_OPTIONS.map(o => (
                  <option key={o.code} value={o.code}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
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
                      disabled={!allowCategoryToggle}
                    />
                  </Field>
                  {categoryCode === '9A' ? (
                    <Field label="業別代號" required>
                      <Select widthClassName="w-full" value={practiceTypeCode} onValueChange={setPracticeTypeCode}>
                        <option value="">請選擇業別代號</option>
                        {practiceCodes.map(o => (
                          <option key={o.code} value={o.code}>
                            {o.code} - {o.categoryName}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  ) : (
                    <Field label="必要費用別" required>
                      <Select widthClassName="w-full" value={royaltyExpenseCode} onValueChange={setRoyaltyExpenseCode}>
                        <option value="">請選擇必要費用別</option>
                        {royaltyCodes.map(o => (
                          <option key={o.code} value={o.code}>
                            {o.code} - {o.categoryName}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  )}
                </div>
              </SectionCard>
            )}

            {categoryCode === '92' && (
              <SectionCard title="給付項目" icon={Briefcase}>
                <Field label="給付項目代號" required>
                  <Select widthClassName="w-full" value={otherIncomeTypeCode} onValueChange={setOtherIncomeTypeCode}>
                    <option value="">請選擇給付項目代號</option>
                    {otherIncomeCodes.map(o => (
                      <option key={o.code} value={o.code}>
                        {o.code} - {o.categoryName}
                      </option>
                    ))}
                  </Select>
                </Field>
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

interface GeneralFormProps {
  /** 提供時為編輯模式 */
  recordId?: string;
  categoryCode: CategoryCode;
  /** 編輯模式下由 WithholdingFormView 讀取好傳入；新增模式為 undefined */
  record?: WithholdingRecord;
  onReload: () => void;
}

export default function GeneralForm({ recordId, categoryCode, record, onReload }: GeneralFormProps) {
  const router = useRouter();
  const { isLocked } = useLock();
  const isEdit = Boolean(recordId);

  const [isEditing, setIsEditing] = useState(!isEdit);
  const [resetKey, setResetKey] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const initial = record
    ? {
        earnerType: record.earnerType,
        voucherType: record.voucherType,
        practiceTypeCode: record.practiceTypeCode ?? '',
        royaltyExpenseCode: record.royaltyExpenseCode ?? '',
        otherIncomeTypeCode: record.otherIncomeTypeCode ?? '',
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
        voucherType: '0' as VoucherType,
        practiceTypeCode: '',
        royaltyExpenseCode: '',
        otherIncomeTypeCode: '',
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

  const handleSubmit = async (category: CategoryCode, body: ReturnType<typeof buildWithholdingOtherSaveBody>) => {
    setSubmitError('');
    setSubmitting(true);
    try {
      if (record) {
        await updateWithholdingOther(category as OtherWithholdingCategoryCode, { ...body, withholdingSummaryUuid: record.uuid });
        setIsEditing(false);
        onReload();
      } else {
        const created = await createWithholdingOther(category as OtherWithholdingCategoryCode, body);
        router.push(`/withholding/other/${created.summaryUuid}?ic=${category}`);
      }
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err, '儲存失敗'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!record) return;
    try {
      await deleteWithholdingOther(categoryCode as OtherWithholdingCategoryCode, record.uuid);
      router.push('/withholding/other');
    } catch (err) {
      setDeleteOpen(false);
      setSubmitError(getFriendlyErrorMessage(err, '刪除失敗'));
    }
  };

  const title = isEdit ? `${categoryLabel(categoryCode)}扣繳詳細` : `新增${categoryLabel(categoryCode)}扣繳資料`;

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
        {submitError && <p className="mb-4 text-sm text-semantic-error">{submitError}</p>}

        <GeneralFormFields
          key={`${record?.uuid ?? 'new'}-${resetKey}`}
          categoryCode={categoryCode}
          allowCategoryToggle={!isEdit}
          disabled={(isEdit && !isEditing) || submitting}
          isEdit={isEdit}
          initial={initial}
          onSubmit={handleSubmit}
        />

        {record && !isEditing && (
          <div className="mt-5 flex flex-col gap-5">
            <WithholdingPdfManager record={record} />
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
