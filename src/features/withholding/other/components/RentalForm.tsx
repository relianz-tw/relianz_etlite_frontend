'use client';

import { createRental, deleteRental, listLatestRentals, updateRental } from '@/api/withholding';
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
import { Backpack, ChevronLeft, MessageSquare, Paperclip, Pencil, Plus, Trash2, User, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Field from '../../components/Field';
import LockedBanner from '../../components/LockedBanner';
import { useLock } from '../../components/LockContext';
import { availableYears, calculateRentalFromActual, calculateRentalFromDeclared, VOUCHER_TYPE_OPTIONS } from '../data';
import { buildCreateRentalBody, mapRentalDtoToRecord } from '../mapper';
import type { Burden, EarnerType, Landlord, VoucherType, WithholdingRecord } from '../types';
import RentalFileManager from './RentalFileManager';
import WithholdingPdfManager from './WithholdingPdfManager';

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

function toDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

function emptyLandlord(seed: number): Landlord {
  return { id: `ld-${Date.now()}-${seed}`, name: '', idNumber: '', address: '' };
}

interface RentalFormFieldsProps {
  disabled: boolean;
  isEdit: boolean;
  initial: {
    landlordIdentity: 'individual' | 'company';
    voucherType: VoucherType;
    paymentDate: Date;
    incomeYear: number;
    incomeMonth: number;
    rentalAddress: string;
    rentalAddressTaxId: string;
    landlords: Landlord[];
    burden: Burden;
    primaryAmount: number;
    remarks: string;
  };
  onSubmit: (body: ReturnType<typeof buildCreateRentalBody>) => void;
}

function RentalFormFields({ disabled, isEdit, initial, onSubmit }: RentalFormFieldsProps) {
  const [landlordIdentity, setLandlordIdentity] = useState(initial.landlordIdentity);
  const [voucherType, setVoucherType] = useState<VoucherType>(initial.voucherType);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(initial.paymentDate);
  const [incomeYear, setIncomeYear] = useState(initial.incomeYear);
  const [incomeMonth, setIncomeMonth] = useState(initial.incomeMonth);
  const [incomeTouched, setIncomeTouched] = useState(false);
  const [rentalAddress, setRentalAddress] = useState(initial.rentalAddress);
  const [rentalAddressTaxId, setRentalAddressTaxId] = useState(initial.rentalAddressTaxId);
  const [landlords, setLandlords] = useState<Landlord[]>(initial.landlords.length > 0 ? initial.landlords : [emptyLandlord(0)]);
  const [burden, setBurden] = useState<Burden>(initial.burden);
  const [primaryAmount, setPrimaryAmount] = useState(initial.primaryAmount);
  const [manualDeclared, setManualDeclared] = useState<number | null>(null);
  const [manualWithholding, setManualWithholding] = useState<number | null>(null);
  const [manualNhi, setManualNhi] = useState<number | null>(null);
  const [remarks, setRemarks] = useState(initial.remarks);
  const [recentAddress, setRecentAddress] = useState('');
  const [recentRecords, setRecentRecords] = useState<WithholdingRecord[]>([]);
  const [error, setError] = useState('');

  // 「快速帶入上期資料」僅新增模式需要，改串真實 API（GET /ael/withholding/rental/latest）
  useEffect(() => {
    if (isEdit) return;
    let cancelled = false;
    listLatestRentals()
      .then(list => {
        if (!cancelled) setRecentRecords(list.map(mapRentalDtoToRecord));
      })
      .catch(() => {
        // 帶入上期資料查詢失敗僅影響此便利功能，不特別呈現錯誤訊息
      });
    return () => {
      cancelled = true;
    };
  }, [isEdit]);

  const showsFields = landlordIdentity === 'individual';

  let declaredAmount: number;
  let withholdingAmount: number;
  let nhiAmount: number;
  let actualPayment: number;
  if (burden === 'landlord') {
    declaredAmount = primaryAmount;
    const calc = calculateRentalFromDeclared(primaryAmount);
    withholdingAmount = manualWithholding ?? calc.withholdingAmount;
    nhiAmount = manualNhi ?? calc.nhiAmount;
    actualPayment = declaredAmount - withholdingAmount - nhiAmount;
  } else {
    actualPayment = primaryAmount;
    const calc = calculateRentalFromActual(primaryAmount);
    declaredAmount = manualDeclared ?? calc.declaredAmount;
    withholdingAmount = manualWithholding ?? calc.withholdingAmount;
    nhiAmount = manualNhi ?? declaredAmount - withholdingAmount - actualPayment;
  }

  const handlePaymentDateChange = (date: Date | undefined) => {
    setPaymentDate(date);
    if (date && !incomeTouched) {
      setIncomeYear(date.getFullYear());
      setIncomeMonth(date.getMonth() + 1);
    }
  };

  const handleApplyRecent = () => {
    const record = recentRecords.find(r => r.rentalAddress === recentAddress);
    if (!record) return;
    setRentalAddress(record.rentalAddress);
    setRentalAddressTaxId(record.rentalAddressTaxId);
    setLandlords(record.landlords.length > 0 ? record.landlords.map((l, i) => ({ ...l, id: `ld-${Date.now()}-${i}` })) : [emptyLandlord(0)]);
  };

  const handleAddLandlord = () => setLandlords(prev => [...prev, emptyLandlord(prev.length)]);
  const handleRemoveLandlord = (id: string) => setLandlords(prev => prev.filter(l => l.id !== id));
  const handleUpdateLandlord = (id: string, patch: Partial<Landlord>) =>
    setLandlords(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDate) {
      setError('請填寫所有必填欄位');
      return;
    }
    if (showsFields) {
      const validLandlords = landlords.filter(l => l.name.trim() && l.idNumber.trim() && l.address.trim());
      if (validLandlords.length === 0 || !rentalAddress.trim() || !rentalAddressTaxId.trim() || primaryAmount <= 0) {
        setError('請填寫所有必填欄位');
        return;
      }
    }

    const body = buildCreateRentalBody({
      earnerType: landlordIdentity as EarnerType,
      voucherType,
      landlords: showsFields ? landlords.filter(l => l.name.trim()) : [],
      rentalAddress: showsFields ? rentalAddress.trim() : '',
      rentalAddressTaxId: showsFields ? rentalAddressTaxId.trim() : '',
      burden,
      // 畫面未提供「是否月繳」切換，一律預設為否；待有實際 UI 需求（如月繳分期）再擴充
      isMonthlyPayment: false,
      declaredAmount: showsFields ? declaredAmount : 0,
      withholdingAmount: showsFields ? withholdingAmount : 0,
      nhiAmount: showsFields ? nhiAmount : 0,
      actualPayment: showsFields ? actualPayment : 0,
      remarks: remarks.trim(),
      incomeYear,
      incomeMonth,
      paymentDate,
    });
    onSubmit(body);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <fieldset disabled={disabled} className="flex flex-col gap-5">
        {!isEdit && recentRecords.length > 0 && (
          <SectionCard title="快速帶入上期資料" icon={Paperclip}>
            <div className="flex items-center gap-2">
              <Select widthClassName="flex-1" value={recentAddress} onValueChange={setRecentAddress}>
                <option value="">請選擇歷史租賃地址</option>
                {recentRecords.map(r => (
                  <option key={r.uuid} value={r.rentalAddress}>
                    {r.rentalAddress}
                  </option>
                ))}
              </Select>
              <Button type="button" variant="outline" disabled={!recentAddress} onClick={handleApplyRecent}>
                帶入
              </Button>
            </div>
          </SectionCard>
        )}

        <SectionCard title="基本資訊" icon={User}>
          <div className="grid grid-cols-1 gap-4 nav:grid-cols-2">
            <Field label="房東身份" required>
              <SegmentedControl
                options={[
                  { value: 'individual', label: '個人' },
                  { value: 'company', label: '公司行號' },
                ]}
                value={landlordIdentity}
                onChange={setLandlordIdentity}
              />
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

        {!showsFields ? (
          <div className="rounded-md border border-brand-blue/20 bg-brand-blue/5 px-4 py-3 text-sm text-neutral-dark">
            房東為公司行號時請到{' '}
            <Link href="/ledger" className="font-semibold text-brand-blue hover:underline">
              帳簿
            </Link>{' '}
            選擇新增進項憑證即可。
          </div>
        ) : (
          <>
            <SectionCard title="租賃資訊" icon={User}>
              <div className="flex flex-col gap-4">
                <Field label="租賃地址稅籍編號" required helper="請輸入 12 碼租賃地址稅籍編號">
                  <TextInput value={rentalAddressTaxId} maxLength={12} onChange={e => setRentalAddressTaxId(e.target.value.toUpperCase())} />
                </Field>
                <Field label="租賃地址" required>
                  <TextInput value={rentalAddress} onChange={e => setRentalAddress(e.target.value)} />
                </Field>
              </div>
            </SectionCard>

            <SectionCard
              title="房東資訊"
              icon={User}
              action={
                <Button type="button" size="sm" variant="outline" icon={Plus} onClick={handleAddLandlord}>
                  新增房東
                </Button>
              }
            >
              <div className="flex flex-col gap-4">
                {landlords.map((landlord, i) => (
                  <div key={landlord.id} className="flex flex-col gap-3 rounded-md border border-neutral-blue-gray/20 bg-surface-cream p-3">
                    {landlords.length > 1 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-neutral-dark">房東 {i + 1}</span>
                        <Button type="button" size="sm" variant="ghost" icon={Trash2} onClick={() => handleRemoveLandlord(landlord.id)} />
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-3 nav:grid-cols-2">
                      <Field label="姓名" required>
                        <TextInput value={landlord.name} onChange={e => handleUpdateLandlord(landlord.id, { name: e.target.value })} />
                      </Field>
                      <Field label="身分證字號" required>
                        <TextInput
                          value={landlord.idNumber}
                          maxLength={10}
                          onChange={e => handleUpdateLandlord(landlord.id, { idNumber: e.target.value.toUpperCase() })}
                        />
                      </Field>
                      <Field label="戶籍地址" required className="nav:col-span-2">
                        <TextInput value={landlord.address} onChange={e => handleUpdateLandlord(landlord.id, { address: e.target.value })} />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="租金扣繳及二代健保" icon={Backpack}>
              <div className="flex flex-col gap-4">
                <Field label="稅費負擔方" required>
                  <SegmentedControl
                    options={[
                      { value: 'tenant', label: '承租人負擔（不含稅費）' },
                      { value: 'landlord', label: '房東負擔（含稅費）' },
                    ]}
                    value={burden}
                    onChange={v => {
                      setBurden(v);
                      setManualDeclared(null);
                      setManualWithholding(null);
                      setManualNhi(null);
                    }}
                    fit
                  />
                </Field>
                {burden === 'landlord' ? (
                  <>
                    <Field label="申報金額" required>
                      <MoneyInput value={primaryAmount} onChange={setPrimaryAmount} />
                    </Field>
                    <Field label="租金扣繳">
                      <MoneyInput value={withholdingAmount} onChange={setManualWithholding} />
                    </Field>
                    <Field label="二代健保">
                      <MoneyInput value={nhiAmount} onChange={setManualNhi} />
                    </Field>
                    <Field label="實際支付金額">
                      <TextInput disabled value={fmtCurrency(actualPayment)} />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="實際支付金額" required>
                      <MoneyInput value={primaryAmount} onChange={setPrimaryAmount} />
                    </Field>
                    <Field label="申報金額">
                      <MoneyInput value={declaredAmount} onChange={setManualDeclared} />
                    </Field>
                    <Field label="租金扣繳">
                      <MoneyInput value={withholdingAmount} onChange={setManualWithholding} />
                    </Field>
                    <Field label="二代健保">
                      <MoneyInput value={nhiAmount} onChange={setManualNhi} />
                    </Field>
                  </>
                )}
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

function buildInitial(record: WithholdingRecord | undefined) {
  if (!record) {
    return {
      landlordIdentity: 'individual' as const,
      voucherType: '0' as VoucherType,
      paymentDate: new Date(),
      incomeYear: availableYears()[0],
      incomeMonth: new Date().getMonth() + 1,
      rentalAddress: '',
      rentalAddressTaxId: '',
      landlords: [],
      burden: 'tenant' as Burden,
      primaryAmount: 0,
      remarks: '',
    };
  }
  return {
    landlordIdentity: record.earnerType === 'company' ? ('company' as const) : ('individual' as const),
    voucherType: record.voucherType,
    paymentDate: toDate(record.paymentYear, record.paymentMonth, record.paymentDay),
    incomeYear: record.incomeYear,
    incomeMonth: record.incomeMonth,
    rentalAddress: record.rentalAddress,
    rentalAddressTaxId: record.rentalAddressTaxId,
    landlords: record.landlords,
    burden: record.burden,
    primaryAmount: record.burden === 'landlord' ? record.grossIncome : record.netPayment,
    remarks: record.remarks,
  };
}

interface RentalFormProps {
  recordId?: string;
  record?: WithholdingRecord;
  onReload: () => void;
  /** 返回鍵目的地；來源可能是彙總列表（L1）或群組明細（L2），由 WithholdingFormView 依 ?from= 算出 */
  backHref: string;
}

export default function RentalForm({ recordId, record, onReload, backHref }: RentalFormProps) {
  const router = useRouter();
  const { isLocked } = useLock();
  const isEdit = Boolean(recordId);

  const [isEditing, setIsEditing] = useState(!isEdit);
  const [resetKey, setResetKey] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const initial = buildInitial(record);

  const handleSubmit = async (body: ReturnType<typeof buildCreateRentalBody>) => {
    setSubmitError('');
    setSubmitting(true);
    try {
      if (record) {
        await updateRental({ ...body, withholdingSummaryUuid: record.uuid });
        setIsEditing(false);
        onReload();
      } else {
        const created = await createRental(body);
        router.push(`/withholding/other/${created.summaryUuid}?ic=51`);
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
      await deleteRental(record.uuid);
      router.push(backHref);
    } catch (err) {
      setDeleteOpen(false);
      setSubmitError(getFriendlyErrorMessage(err, '刪除失敗'));
    }
  };

  const title = isEdit ? '租金扣繳詳細' : '新增租金扣繳資料';

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[760px] px-4 pt-4 pb-10 nav:px-7 nav:pt-7">
        <div className="mb-6 flex items-center gap-3">
          <Link href={backHref} className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-mid hover:bg-surface-cream hover:text-neutral-dark">
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

        <RentalFormFields
          key={`${record?.uuid ?? 'new'}-${resetKey}`}
          disabled={(isEdit && !isEditing) || submitting}
          isEdit={isEdit}
          initial={initial}
          onSubmit={handleSubmit}
        />

        {record && !isEditing && (
          <div className="mt-5 flex flex-col gap-5">
            <RentalFileManager withholdingSummaryUuid={record.uuid} files={record.rentalFiles} />
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
