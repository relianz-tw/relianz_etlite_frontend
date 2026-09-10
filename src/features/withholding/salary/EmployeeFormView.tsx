'use client';

import { createEmployee, deleteEmployee, updateEmployee, uploadEmployeeIdCard } from '@/api/employee';
import type { InsuranceGradeDto } from '@/api/types';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DatePicker from '@/components/ui/DatePicker';
import SectionCard from '@/components/ui/SectionCard';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { ApiError, getFriendlyErrorMessage } from '@/lib/errors';
import { ChevronLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Field from '../components/Field';
import SignImageUpload from '../labor/components/SignImageUpload';
import { findGradeByAmount, gradeLabel, isGradeBelowMinAmount, toSaveEmployeeBody, VOLUNTARY_PENSION_RATES } from './data';
import type { Employee, EmploymentStatus } from './types';
import { useEmployee, useInsuranceGrades, useNhiHeadMinGrade } from './useEmployees';

const EMPTY: Omit<Employee, 'id'> = {
  name: '',
  idNumber: '',
  jobTitle: '',
  phoneNumber: '',
  email: '',
  idCardFront: '',
  idCardBack: '',
  householdAddress: '',
  contactAddress: '',
  nhiLevelId: null,
  nhiDependents: 0,
  laborLevelId: null,
  laborInsuranceStartDate: '',
  voluntaryPensionRate: 0,
  laborPensionLevelId: null,
  onboardDate: '',
  status: 'active',
  quitDate: '',
  isHead: false,
};

interface EmployeeFormViewProps {
  /** 提供時為編輯模式，內部依此 id 呼叫 API 讀取員工資料 */
  employeeId?: string;
}

function toDate(value: string): Date | undefined {
  return value ? new Date(value) : undefined;
}

function fromDate(date: Date | undefined): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function gradeOptions(grades: InsuranceGradeDto[]) {
  return grades.map(g => (
    <option key={g.id} value={String(g.id)}>
      {gradeLabel(g)}
    </option>
  ));
}

export default function EmployeeFormView({ employeeId }: EmployeeFormViewProps) {
  const router = useRouter();
  const numericId = employeeId ? Number(employeeId) : undefined;
  const { employee, loading, error: loadError } = useEmployee(numericId);
  const isEdit = Boolean(numericId);
  const year = employee?.onboardDate ? Number(employee.onboardDate.slice(0, 4)) : new Date().getFullYear();
  const { laborGrades, laborPensionGrades, nhiGrades, loading: gradesLoading } = useInsuranceGrades(year);

  const [form, setForm] = useState<Omit<Employee, 'id'>>(EMPTY);
  // 負責人健保投保最低金額（法規：不得低於已投保員工中的最高投保金額），只在勾選負責人時查詢
  const { minAmount: nhiHeadMinAmount } = useNhiHeadMinGrade(year, form.isHead);
  const nhiHeadMinCompliantGrade = form.isHead && nhiHeadMinAmount !== null ? findGradeByAmount(nhiGrades, nhiHeadMinAmount) : undefined;
  const nhiGradeOptionsSource =
    form.isHead && nhiHeadMinAmount !== null ? nhiGrades.filter(g => g.grade === 0 || !isGradeBelowMinAmount(g, nhiHeadMinAmount)) : nhiGrades;

  // 負責人最低金額載入完成、或使用者切換為負責人時：若目前健保級距低於門檻，自動跳轉到最低合規級距
  useEffect(() => {
    if (!form.isHead || nhiHeadMinAmount === null || nhiGrades.length === 0) return;
    const current = nhiGrades.find(g => g.id === form.nhiLevelId);
    if (current && current.grade !== 0 && isGradeBelowMinAmount(current, nhiHeadMinAmount)) {
      const compliant = findGradeByAmount(nhiGrades, nhiHeadMinAmount);
      if (compliant) setForm(prev => ({ ...prev, nhiLevelId: compliant.id }));
    }
  }, [form.isHead, form.nhiLevelId, nhiHeadMinAmount, nhiGrades]);

  const [initialized, setInitialized] = useState(false);
  const [sameAddress, setSameAddress] = useState(false);
  const [hasDependents, setHasDependents] = useState(false);
  const [hasVoluntaryPension, setHasVoluntaryPension] = useState(false);
  const [idCardFrontFile, setIdCardFrontFile] = useState<File | null>(null);
  const [idCardBackFile, setIdCardBackFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 編輯模式資料載入完成後，用實際員工資料初始化表單 local state（僅執行一次，避免覆蓋使用者輸入）
  useEffect(() => {
    if (!isEdit || !employee || initialized) return;
    setForm({ ...employee });
    setSameAddress(employee.householdAddress === employee.contactAddress);
    setHasDependents(employee.nhiDependents > 0);
    setHasVoluntaryPension(employee.voluntaryPensionRate > 0);
    setInitialized(true);
  }, [isEdit, employee, initialized]);

  if (isEdit && loading) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-off-white text-sm text-neutral-mid">載入中…</div>;
  }

  if (isEdit && (loadError || !employee)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-off-white text-sm text-neutral-mid">
        {loadError || '找不到此員工資料'}
      </div>
    );
  }

  const update = <K extends keyof Employee>(key: K, value: Employee[K]) => setForm(prev => ({ ...prev, [key]: value }));

  // 級距表本身含「無投保」選項（grade === 0，非固定 id），故用查表判斷而非直接比對 null
  const laborUninsured = form.laborLevelId === null || laborGrades.find(g => g.id === form.laborLevelId)?.grade === 0;

  const handleSubmit = async () => {
    if (
      !form.name.trim() ||
      !form.idNumber.trim() ||
      !form.jobTitle.trim() ||
      !form.householdAddress.trim() ||
      !form.onboardDate ||
      !form.idCardFront ||
      !form.idCardBack
    ) {
      setError('請填寫所有必填欄位');
      return;
    }
    if (hasDependents && form.nhiDependents < 1) {
      setError('眷屬人數至少為 1');
      return;
    }
    if (form.status === 'inactive' && !form.quitDate) {
      setError('請填寫離職日期');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const body = toSaveEmployeeBody(form, { laborGrades, laborPensionGrades, nhiGrades });
      if (isEdit && numericId) {
        await updateEmployee({ ...body, id: numericId });
      } else {
        await createEmployee(body);
      }
      router.push('/withholding/salary/employee');
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

  const handleDelete = async () => {
    if (!numericId) return;
    setDeleting(true);
    try {
      await deleteEmployee(numericId);
      router.push('/withholding/salary/employee');
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
      setDeleting(false);
    }
  };

  const handleIdCardFrontChange = async (file: File | null) => {
    setIdCardFrontFile(file);
    if (!file) {
      update('idCardFront', '');
      return;
    }
    try {
      const result = await uploadEmployeeIdCard(file);
      update('idCardFront', result.img);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, '身分證正面上傳失敗'));
    }
  };

  const handleIdCardBackChange = async (file: File | null) => {
    setIdCardBackFile(file);
    if (!file) {
      update('idCardBack', '');
      return;
    }
    try {
      const result = await uploadEmployeeIdCard(file);
      update('idCardBack', result.img);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, '身分證反面上傳失敗'));
    }
  };

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[880px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/withholding/salary/employee" className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-mid hover:bg-surface-cream hover:text-neutral-dark">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="font-notoSerif text-[22px] font-semibold tracking-tight text-neutral-dark">{isEdit ? '編輯員工' : '新增員工'}</h1>
        </div>

        <div className="flex flex-col gap-5">
          <SectionCard title="基本資料">
            <div className="grid grid-cols-1 gap-4 nav:grid-cols-3">
              <Field label="姓名" required>
                <TextInput value={form.name} onChange={e => update('name', e.target.value)} />
              </Field>
              <Field label="身分證字號" required>
                <TextInput value={form.idNumber} onChange={e => update('idNumber', e.target.value.toUpperCase())} />
              </Field>
              <Field label="職稱" required>
                <TextInput value={form.jobTitle} onChange={e => update('jobTitle', e.target.value)} />
              </Field>
              <Field label="電話號碼">
                <TextInput type="tel" value={form.phoneNumber} onChange={e => update('phoneNumber', e.target.value)} />
              </Field>
              <Field label="Email" className="nav:col-span-2">
                <TextInput type="email" value={form.email} onChange={e => update('email', e.target.value)} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="身分證影本">
            <div className="grid grid-cols-1 gap-4 nav:grid-cols-2">
              <SignImageUpload
                title="身分證正面"
                onFileChange={handleIdCardFrontChange}
                hasExistingFile={isEdit && Boolean(employee?.idCardFront) && !idCardFrontFile}
              />
              <SignImageUpload
                title="身分證反面"
                onFileChange={handleIdCardBackChange}
                hasExistingFile={isEdit && Boolean(employee?.idCardBack) && !idCardBackFile}
              />
            </div>
          </SectionCard>

          <SectionCard title="地址">
            <div className="grid grid-cols-1 gap-4 nav:grid-cols-2">
              <Field label="戶籍地址" required>
                <TextInput value={form.householdAddress} onChange={e => update('householdAddress', e.target.value)} />
              </Field>
              <Field label="聯絡地址">
                <TextInput
                  value={form.contactAddress}
                  disabled={sameAddress}
                  onChange={e => update('contactAddress', e.target.value)}
                />
                <label className="mt-1.5 flex items-center gap-2 text-xs text-neutral-mid">
                  <Checkbox
                    checked={sameAddress}
                    onChange={() => {
                      const next = !sameAddress;
                      setSameAddress(next);
                      if (next) update('contactAddress', form.householdAddress);
                    }}
                  />
                  同戶籍地址
                </label>
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="保險投保設定" action={gradesLoading ? <span className="text-xs font-normal text-neutral-mid">級距載入中…</span> : undefined}>
            <div className="grid grid-cols-1 gap-4 nav:grid-cols-2">
              <Field label="健保投保金額" required>
                <Select
                  widthClassName="w-full"
                  value={form.nhiLevelId === null ? '' : String(form.nhiLevelId)}
                  onValueChange={v => update('nhiLevelId', v === '' ? null : Number(v))}
                >
                  {gradeOptions(nhiGradeOptionsSource)}
                </Select>
                {form.isHead && (
                  <p className="mt-1.5 text-xs text-neutral-mid">
                    負責人之健保投保金額，不得低於已投保員工中的最高投保金額
                    {nhiHeadMinCompliantGrade &&
                      `，目前最低必須為 ${nhiHeadMinCompliantGrade.salaryMax === null ? `$${nhiHeadMinCompliantGrade.salaryMin.toLocaleString('en-US')} 以上` : `$${nhiHeadMinCompliantGrade.salaryMax.toLocaleString('en-US')}`}`}
                  </p>
                )}
              </Field>
              <Field label="有無健保投保眷屬" required>
                <SegmentedControl
                  options={[
                    { value: 'yes', label: '有扶養親屬' },
                    { value: 'no', label: '無扶養親屬' },
                  ]}
                  value={hasDependents ? 'yes' : 'no'}
                  onChange={v => {
                    const next = v === 'yes';
                    setHasDependents(next);
                    if (!next) update('nhiDependents', 0);
                  }}
                />
              </Field>
              {hasDependents && (
                <Field label="眷屬人數" required>
                  <TextInput
                    type="number"
                    min={1}
                    value={String(form.nhiDependents)}
                    onChange={e => update('nhiDependents', Number(e.target.value))}
                  />
                </Field>
              )}

              <Field label="勞保投保金額" required>
                <Select
                  widthClassName="w-full"
                  value={form.laborLevelId === null ? '' : String(form.laborLevelId)}
                  onValueChange={v => update('laborLevelId', v === '' ? null : Number(v))}
                >
                  {gradeOptions(laborGrades)}
                </Select>
              </Field>
              {!laborUninsured && (
                <Field label="勞保開始投保日期" required>
                  <DatePicker value={toDate(form.laborInsuranceStartDate)} onChange={date => update('laborInsuranceStartDate', fromDate(date))} />
                </Field>
              )}
            </div>
          </SectionCard>

          <SectionCard title="勞退自提">
            <div className="grid grid-cols-1 gap-4 nav:grid-cols-3">
              <Field label="勞退自提" required>
                <SegmentedControl
                  options={[
                    { value: 'yes', label: '有自提' },
                    { value: 'no', label: '無自提' },
                  ]}
                  value={hasVoluntaryPension ? 'yes' : 'no'}
                  onChange={v => {
                    const has = v === 'yes';
                    setHasVoluntaryPension(has);
                    update('voluntaryPensionRate', has ? 1 : 0);
                    if (!has) update('laborPensionLevelId', null);
                  }}
                />
              </Field>
              {hasVoluntaryPension && (
                <>
                  <Field label="自提比例" required>
                    <Select widthClassName="w-full" value={String(form.voluntaryPensionRate)} onValueChange={v => update('voluntaryPensionRate', Number(v))}>
                      {VOLUNTARY_PENSION_RATES.map(rate => (
                        <option key={rate} value={String(rate)}>
                          {rate}%
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="勞工退休金月提投保金額" required helper="勞退投保金額不得低於其勞保投保金額">
                    <Select
                      widthClassName="w-full"
                      value={form.laborPensionLevelId === null ? '' : String(form.laborPensionLevelId)}
                      onValueChange={v => update('laborPensionLevelId', v === '' ? null : Number(v))}
                    >
                      {gradeOptions(laborPensionGrades.filter(g => g.grade !== 0))}
                    </Select>
                  </Field>
                </>
              )}
            </div>
          </SectionCard>

          <SectionCard title="到職狀態">
            <div className="grid grid-cols-1 gap-4 nav:grid-cols-3">
              <Field label="到職時間" required>
                <DatePicker value={toDate(form.onboardDate)} onChange={date => update('onboardDate', fromDate(date))} />
              </Field>
              <Field label="狀態" required>
                <SegmentedControl
                  options={[
                    { value: 'active', label: '在職' },
                    { value: 'inactive', label: '離職' },
                  ]}
                  value={form.status}
                  onChange={v => update('status', v as EmploymentStatus)}
                />
              </Field>
              {form.status === 'inactive' && (
                <Field label="離職日期" required>
                  <DatePicker value={toDate(form.quitDate)} onChange={date => update('quitDate', fromDate(date))} />
                </Field>
              )}
            </div>

            <label className="mt-2 flex items-center gap-2 text-sm text-neutral-dark">
              <Checkbox checked={form.isHead} onChange={() => update('isHead', !form.isHead)} />
              此人為公司負責人
            </label>
          </SectionCard>

          {error && <p className="text-sm text-semantic-error">{error}</p>}

          <div className="flex items-center justify-between">
            {isEdit ? (
              <Button variant="danger" icon={Trash2} onClick={() => setDeleteOpen(true)} disabled={submitting || deleting}>
                {deleting ? '刪除中…' : '刪除員工'}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <Link href="/withholding/salary/employee" className="inline-flex">
                <Button variant="outline">取消</Button>
              </Link>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? '送出中…' : isEdit ? '更新員工' : '新增員工'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="確認刪除此員工？"
        message="此操作無法復原。"
      />
    </div>
  );
}
