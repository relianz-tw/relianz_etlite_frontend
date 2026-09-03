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
import { Backpack, ChevronLeft, MessageSquare, Paperclip, Pencil, Plus, Trash2, User, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Field from '../../components/Field';
import FileListSection from '../../components/FileListSection';
import LockedBanner from '../../components/LockedBanner';
import { useLock } from '../../components/LockContext';
import MockFilePreviewModal from '../../components/MockFilePreviewModal';
import { createMockFile, type MockFile } from '../../components/mockFile';
import { availableYears, calculateRentalFromActual, calculateRentalFromDeclared } from '../data';
import { addWithholdingRecord, deleteWithholdingRecord, getWithholdingRecord, listRecentRentalRecords, updateWithholdingRecord } from '../mockStore';
import type { WithholdingInput } from '../mockStore';
import type { Burden, Landlord, Residency, WithholdingRecord } from '../types';
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
    residency: Residency;
    paymentDate: Date;
    incomeYear: number;
    incomeMonth: number;
    rentalAddress: string;
    rentalAddressTaxId: string;
    landlords: Landlord[];
    burden: Burden;
    primaryAmount: number;
    rentalFiles: MockFile[];
    remarks: string;
  };
  onSubmit: (data: WithholdingInput) => void;
}

function RentalFormFields({ disabled, isEdit, initial, onSubmit }: RentalFormFieldsProps) {
  const [landlordIdentity, setLandlordIdentity] = useState(initial.landlordIdentity);
  const [residency, setResidency] = useState(initial.residency);
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
  const [rentalFiles, setRentalFiles] = useState<MockFile[]>(initial.rentalFiles);
  const [previewFile, setPreviewFile] = useState<MockFile | null>(null);
  const [remarks, setRemarks] = useState(initial.remarks);
  const [recentAddress, setRecentAddress] = useState('');
  const [error, setError] = useState('');

  const recentRecords = listRecentRentalRecords();
  const showsFields = landlordIdentity === 'individual' && residency === 'domestic';

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mockFile = createMockFile(file.name, [{ label: '租賃地址', value: rentalAddress || '（尚未填寫）' }]);
    setRentalFiles(prev => [...prev, mockFile]);
    e.target.value = '';
  };

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

    onSubmit({
      categoryCode: '51',
      earnerType: landlordIdentity,
      residency,
      recipientName: showsFields ? landlords.map(l => l.name.trim()).filter(Boolean).join('、') : '',
      recipientIdNumber: showsFields ? (landlords[0]?.idNumber.trim() ?? '') : '',
      recipientAddress: showsFields ? (landlords[0]?.address.trim() ?? '') : '',
      landlords: showsFields ? landlords.filter(l => l.name.trim()) : [],
      rentalAddress: showsFields ? rentalAddress.trim() : '',
      rentalAddressTaxId: showsFields ? rentalAddressTaxId.trim() : '',
      burden,
      rentalFiles,
      paymentYear: paymentDate.getFullYear(),
      paymentMonth: paymentDate.getMonth() + 1,
      paymentDay: paymentDate.getDate(),
      incomeYear,
      incomeMonth,
      grossIncome: showsFields ? declaredAmount : 0,
      withholdingAmount: showsFields ? withholdingAmount : 0,
      nhiAmount: showsFields ? nhiAmount : 0,
      netPayment: showsFields ? actualPayment : 0,
      remarks: remarks.trim(),
    });
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
            <Field label="居住狀態" required className="nav:col-span-2">
              <SegmentedControl
                options={[
                  { value: 'domestic', label: '本國人並居住滿 183 天' },
                  { value: 'foreign', label: '外國人或居住未滿 183 天' },
                ]}
                value={residency}
                onChange={setResidency}
              />
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
            {landlordIdentity === 'company' ? (
              <>
                房東為公司行號時請到{' '}
                <Link href="/ledger" className="font-semibold text-brand-blue hover:underline">
                  帳簿
                </Link>{' '}
                選擇新增進項憑證即可。
              </>
            ) : (
              '系統不支援非稅籍居民申報，請自行在支付後 10 天內完成扣繳跟申報。'
            )}
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

            <SectionCard title="附件上傳" icon={Paperclip}>
              <div className="flex flex-col gap-3">
                <FileListSection title="租賃附件" files={rentalFiles} emptyText="尚未上傳附件" onView={setPreviewFile} onDelete={file => setRentalFiles(prev => prev.filter(f => f.id !== file.id))} />
                <label className="flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-neutral-blue-gray/50 bg-white text-center hover:border-brand-blue">
                  <span className="text-xs text-neutral-mid">點擊上傳附件（如租賃契約）</span>
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
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

      <MockFilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </form>
  );
}

function buildInitial(record: WithholdingRecord | undefined) {
  if (!record) {
    return {
      landlordIdentity: 'individual' as const,
      residency: 'domestic' as Residency,
      paymentDate: new Date(),
      incomeYear: availableYears()[0],
      incomeMonth: new Date().getMonth() + 1,
      rentalAddress: '',
      rentalAddressTaxId: '',
      landlords: [],
      burden: 'tenant' as Burden,
      primaryAmount: 0,
      rentalFiles: [],
      remarks: '',
    };
  }
  return {
    landlordIdentity: record.earnerType === 'company' ? ('company' as const) : ('individual' as const),
    residency: record.residency,
    paymentDate: toDate(record.paymentYear, record.paymentMonth, record.paymentDay),
    incomeYear: record.incomeYear,
    incomeMonth: record.incomeMonth,
    rentalAddress: record.rentalAddress,
    rentalAddressTaxId: record.rentalAddressTaxId,
    landlords: record.landlords,
    burden: record.burden,
    primaryAmount: record.burden === 'landlord' ? record.grossIncome : record.netPayment,
    rentalFiles: record.rentalFiles,
    remarks: record.remarks,
  };
}

export default function RentalForm({ recordId }: { recordId?: string }) {
  const router = useRouter();
  const { isLocked } = useLock();
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);
  void tick;

  const record = recordId ? getWithholdingRecord(recordId) : undefined;
  const isEdit = Boolean(recordId);

  const [isEditing, setIsEditing] = useState(!isEdit);
  const [resetKey, setResetKey] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (recordId && !record) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-off-white text-sm text-neutral-mid">找不到此扣繳資料</div>;
  }

  const initial = buildInitial(record);

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

  const title = isEdit ? '租金扣繳詳細' : '新增租金扣繳資料';

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

        <RentalFormFields key={`${record?.uuid ?? 'new'}-${resetKey}`} disabled={isEdit && !isEditing} isEdit={isEdit} initial={initial} onSubmit={handleSubmit} />

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
