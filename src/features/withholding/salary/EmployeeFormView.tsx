'use client';

import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DatePicker from '@/components/ui/DatePicker';
import SectionCard from '@/components/ui/SectionCard';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { ChevronLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Field from '../components/Field';
import { LABOR_GRADES, LABOR_PENSION_GRADES, NHI_GRADES, VOLUNTARY_PENSION_RATES } from './data';
import { addEmployee, deleteEmployee, getEmployee, updateEmployee } from './mockStore';
import type { Employee, EmploymentStatus } from './types';

const EMPTY: Omit<Employee, 'id'> = {
  name: '',
  idNumber: '',
  jobTitle: '',
  phoneNumber: '',
  email: '',
  householdAddress: '',
  contactAddress: '',
  nhiGradeId: NHI_GRADES[1].id,
  hasDependents: false,
  nhiDependents: 0,
  laborGradeId: LABOR_GRADES[1].id,
  laborInsuranceStartDate: '',
  hasVoluntaryPension: false,
  voluntaryPensionRate: 0,
  laborPensionGradeId: LABOR_PENSION_GRADES[0].id,
  onboardDate: '',
  status: 'active',
  quitDate: '',
  isHead: false,
};

interface EmployeeFormViewProps {
  /** 提供時為編輯模式，內部依此 id 從 mockStore 讀取員工資料（不由外層 Server Component 傳入完整物件，
   *  因假資料僅存於瀏覽器端記憶體，伺服器端永遠只會讀到初始種子資料） */
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

export default function EmployeeFormView({ employeeId }: EmployeeFormViewProps) {
  const router = useRouter();
  const employee = employeeId ? getEmployee(employeeId) : undefined;
  const isEdit = Boolean(employee);
  const [form, setForm] = useState<Omit<Employee, 'id'>>(employee ? { ...employee } : EMPTY);
  const [sameAddress, setSameAddress] = useState(employee ? employee.householdAddress === employee.contactAddress : false);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (employeeId && !employee) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-off-white text-sm text-neutral-mid">
        找不到此員工資料
      </div>
    );
  }

  const update = <K extends keyof Employee>(key: K, value: Employee[K]) => setForm(prev => ({ ...prev, [key]: value }));

  const laborUninsured = LABOR_GRADES.find(g => g.id === form.laborGradeId)?.grade === 0;

  const handleSubmit = () => {
    if (!form.name.trim() || !form.idNumber.trim() || !form.jobTitle.trim() || !form.householdAddress.trim() || !form.onboardDate) {
      setError('請填寫所有必填欄位');
      return;
    }
    if (form.hasDependents && form.nhiDependents < 1) {
      setError('眷屬人數至少為 1');
      return;
    }
    if (form.status === 'inactive' && !form.quitDate) {
      setError('請填寫離職日期');
      return;
    }
    if (isEdit && employee) {
      updateEmployee(employee.id, form);
    } else {
      addEmployee(form);
    }
    router.push('/withholding/salary/employee');
  };

  const handleDelete = () => {
    if (!employee) return;
    deleteEmployee(employee.id);
    router.push('/withholding/salary/employee');
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

          <SectionCard title="保險投保設定">
            <div className="grid grid-cols-1 gap-4 nav:grid-cols-2">
              <Field label="健保投保金額" required>
                <Select widthClassName="w-full" value={String(form.nhiGradeId)} onValueChange={v => update('nhiGradeId', Number(v))}>
                  {NHI_GRADES.map(g => (
                    <option key={g.id} value={String(g.id)}>
                      {g.grade === 0 ? '無投保' : `$${g.salaryMax?.toLocaleString('en-US')}`}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="有無健保投保眷屬" required>
                <SegmentedControl
                  options={[
                    { value: 'yes', label: '有扶養親屬' },
                    { value: 'no', label: '無扶養親屬' },
                  ]}
                  value={form.hasDependents ? 'yes' : 'no'}
                  onChange={v => update('hasDependents', v === 'yes')}
                />
              </Field>
              {form.hasDependents && (
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
                <Select widthClassName="w-full" value={String(form.laborGradeId)} onValueChange={v => update('laborGradeId', Number(v))}>
                  {LABOR_GRADES.map(g => (
                    <option key={g.id} value={String(g.id)}>
                      {g.grade === 0 ? '無投保' : `$${g.salaryMax?.toLocaleString('en-US')}`}
                    </option>
                  ))}
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
                  value={form.hasVoluntaryPension ? 'yes' : 'no'}
                  onChange={v => {
                    const has = v === 'yes';
                    update('hasVoluntaryPension', has);
                    update('voluntaryPensionRate', has ? 1 : 0);
                  }}
                />
              </Field>
              {form.hasVoluntaryPension && (
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
                    <Select widthClassName="w-full" value={String(form.laborPensionGradeId)} onValueChange={v => update('laborPensionGradeId', Number(v))}>
                      {LABOR_PENSION_GRADES.map(g => (
                        <option key={g.id} value={String(g.id)}>
                          {`$${g.salaryMax?.toLocaleString('en-US')}`}
                        </option>
                      ))}
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
              <Button variant="danger" icon={Trash2} onClick={() => setDeleteOpen(true)}>
                刪除員工
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <Link href="/withholding/salary/employee" className="inline-flex">
                <Button variant="outline">取消</Button>
              </Link>
              <Button onClick={handleSubmit}>{isEdit ? '更新員工' : '新增員工'}</Button>
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
