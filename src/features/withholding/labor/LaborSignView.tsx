'use client';

import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SectionCard from '@/components/ui/SectionCard';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { fmtCurrency } from '@/lib/utils';
import { Backpack, BookOpen, CircleCheck, User } from 'lucide-react';
import { useState } from 'react';
import Field from '../components/Field';
import { NATIONALITY_OPTIONS, serviceTypeLabel } from './data';
import { getLaborRecord, signLaborRecord } from './mockStore';
import SignImageUpload from './components/SignImageUpload';

function rocDate(year: number, month: number, day: number): string {
  return `${year - 1911}/${month}/${day}`;
}

function rocDateTime(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear() - 1911;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 勞報單對外免登入簽署頁：無側欄／導覽（見 AppShell 的 /withholding/labor/sign 例外），
 *  簡化自原版（不做真實簽名板與 OCR 辨識，一鍵標記已簽署即完成流程） */
export default function LaborSignView({ uuid }: { uuid: string }) {
  const [tick, setTick] = useState(0);
  const record = getLaborRecord(uuid);

  const [idNumber, setIdNumber] = useState(record?.idNumber ?? '');
  const [address, setAddress] = useState(record?.address ?? '');
  const [nationality, setNationality] = useState(record?.nationality ?? NATIONALITY_OPTIONS[0]);
  const [remember, setRemember] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  if (!record) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-off-white px-4 text-center text-sm text-neutral-mid">找不到此勞報單資料，請確認連結是否正確。</div>;
  }

  void tick;
  void remember;

  if (record.signStatus === 1) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-off-white px-4 text-center">
        <CircleCheck size={48} className="text-semantic-success" />
        <h1 className="font-notoSerif text-xl font-semibold text-neutral-dark">完成簽署</h1>
        <p className="text-sm text-neutral-mid">您已於 {rocDateTime(record.signTime)} 簽署完成此份勞報單。</p>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!idNumber.trim() || !address.trim()) {
      setError('請填寫身分證字號與聯絡地址');
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmSign = () => {
    signLaborRecord(uuid, { idNumber: idNumber.trim(), address: address.trim(), nationality });
    setTick(t => t + 1);
  };

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[560px] px-4 py-8">
        <h1 className="mb-6 font-notoSerif text-xl font-semibold text-neutral-dark">簽署勞報單</h1>

        <div className="flex flex-col gap-5">
          <SectionCard title="勞務內容" icon={BookOpen}>
            <div className="flex flex-col gap-4">
              <Field label="工作類型">
                <TextInput disabled value={serviceTypeLabel(record.serviceType)} />
              </Field>
              <Field label="專案名稱 / 勞務內容">
                <TextInput disabled value={record.serviceName} />
              </Field>
              <div className="grid grid-cols-1 gap-4 nav:grid-cols-2">
                <Field label="勞務提供日期">
                  <TextInput disabled value={rocDate(record.serviceYear, record.serviceMonth, record.serviceDay)} />
                </Field>
                <Field label="付款日期">
                  <TextInput disabled value={rocDate(record.paymentYear, record.paymentMonth, record.paymentDay)} />
                </Field>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="應付及扣繳金額" icon={Backpack}>
            <div className="flex flex-col gap-4">
              <Field label="應付金額">
                <TextInput disabled value={fmtCurrency(record.payableAmount)} />
              </Field>
              <Field label="扣繳稅額">
                <TextInput disabled value={fmtCurrency(record.withholdingTax)} />
              </Field>
              <Field label="二代健保費">
                <TextInput disabled value={fmtCurrency(record.secondHealthInsuranceFee)} />
              </Field>
              <Field label="實際給付金額">
                <TextInput disabled value={fmtCurrency(record.actualPaymentAmount)} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="基本資料" icon={User}>
            <div className="flex flex-col gap-4">
              <Field label="姓名">
                <TextInput disabled value={record.name} />
              </Field>
              <Field label="手機號碼">
                <TextInput disabled value={record.phone} />
              </Field>
              <Field label="身分證字號 / 居留證號碼 / 護照號碼" required>
                <TextInput value={idNumber} onChange={e => setIdNumber(e.target.value.toUpperCase())} />
              </Field>
              <Field label="聯絡地址" required>
                <TextInput value={address} onChange={e => setAddress(e.target.value)} />
              </Field>
              <Field label="國籍" required>
                <Select widthClassName="w-full" value={nationality} onValueChange={setNationality}>
                  {NATIONALITY_OPTIONS.map(n => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 nav:grid-cols-2">
            <SignImageUpload title={nationality === '本國籍' ? '身分證正面' : '居留證正面或護照照片全頁'} />
            <SignImageUpload title={nationality === '本國籍' ? '身分證反面' : '居留證反面'} />
          </div>

          <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-5">
            <label className="flex cursor-pointer items-center gap-3">
              <Checkbox checked={remember} onChange={() => setRemember(v => !v)} />
              <span className="text-sm text-neutral-dark">記住我的資料（下次自動帶入）</span>
            </label>
          </div>

          {error && <p className="text-sm text-semantic-error">{error}</p>}

          <Button className="w-full" onClick={handleSubmit}>
            簽署
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSign}
        title="簽署"
        message="簽署送出後，填入的資料將會產生一份勞報單，且資料將無法修改。"
        confirmLabel="送出"
        cancelLabel="取消"
      />
    </div>
  );
}
