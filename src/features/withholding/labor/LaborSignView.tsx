'use client';

import { findLabourProvider, getLabourDetail, listLabourCountries, signLabour, updateLabourBasicInfo } from '@/api/labour';
import type { LabourCountryDto, LabourFormDto } from '@/api/types';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import MoneyInput from '@/components/ui/MoneyInput';
import SectionCard from '@/components/ui/SectionCard';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { Backpack, BookOpen, CircleCheck, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import Field from '../components/Field';
import { nationalityLabel, serviceTypeLabel } from './data';
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

interface LaborSignViewProps {
  uuid: string;
  incomeCode?: string;
}

/** 勞報單對外免登入簽署頁：無側欄／導覽（見 AppShell 的 /withholding/labor/sign 例外），
 *  簡化自原版（不做真實簽名板，僅上傳證件照片＋填寫基本資料後即完成簽署流程） */
export default function LaborSignView({ uuid, incomeCode }: LaborSignViewProps) {
  const [record, setRecord] = useState<LabourFormDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [countries, setCountries] = useState<LabourCountryDto[]>([]);
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');
  const [addressPostal, setAddressPostal] = useState('');
  const [countryId, setCountryId] = useState<number | null>(null);
  const [idPicFront, setIdPicFront] = useState<File | null>(null);
  const [idPicBack, setIdPicBack] = useState<File | null>(null);
  const [passportPic, setPassportPic] = useState<File | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    getLabourDetail({ labourUuid: uuid, incomeCode })
      .then(dto => {
        if (cancelled) return;
        setRecord(dto);
        setIdNumber(dto.identifyNumber ?? '');
        setAddress(dto.address ?? '');
        setAddressPostal(dto.addressPostal ?? '');
        if (dto.countryCode) setCountryId(dto.countryCode);
      })
      .catch(err => {
        if (!cancelled) setLoadError(getFriendlyErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uuid, incomeCode, reloadKey]);

  useEffect(() => {
    listLabourCountries()
      .then(setCountries)
      .catch(() => {
        // 國籍碼表查詢失敗僅影響下拉選單，不特別呈現錯誤訊息
      });
  }, []);

  // 資料載入完成後查詢是否為既有勞務提供者（比照 cashflow /labor/sign 邏輯）：
  // 帶入 name；本國籍用 identifyNumber，外國籍依證件格式判斷用 residencePermitNumber 或 passportNumber。
  // 僅在剛載入時查一次（依當時的證件號碼），使用者手動修改證件號碼不會重新觸發。
  useEffect(() => {
    if (!record) return;
    const trimmed = (record.identifyNumber ?? '').trim().toUpperCase();
    if (!trimmed) return;
    const name = record.name?.trim() || '';
    const isResidentCertFormat = /^[A-Z][89ABCD]\d{8}$/i.test(trimmed);
    const params =
      record.nationality === '1'
        ? { name, identifyNumber: trimmed }
        : isResidentCertFormat
          ? { name, residencePermitNumber: trimmed }
          : { name, passportNumber: trimmed };
    findLabourProvider(params)
      .then(list => {
        const provider = list[0];
        if (!provider) return;
        setAddress(prev => prev || provider.address || '');
        if (provider.countryCode) setCountryId(prev => prev ?? provider.countryCode);
      })
      .catch(() => {
        // 既有勞務提供者查詢失敗僅影響自動帶入，不阻擋簽署流程
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record]);

  // 本國籍且尚未選擇國家時，預設帶入台灣（找不到則不預設，改由使用者自行選擇）
  useEffect(() => {
    if (countryId !== null || countries.length === 0 || record?.nationality !== '1') return;
    const tw = countries.find(c => c.abbreviation === 'TW');
    if (tw) setCountryId(tw.id);
  }, [countries, record, countryId]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-off-white text-sm text-neutral-mid">載入中…</div>;
  }
  if (loadError) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-off-white px-4 text-center text-sm text-semantic-error">{loadError}</div>;
  }
  if (!record) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-off-white px-4 text-center text-sm text-neutral-mid">找不到此勞報單資料，請確認連結是否正確。</div>;
  }

  if (record.signStatus === 1) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-off-white px-4 text-center">
        <CircleCheck size={48} className="text-semantic-success" />
        <h1 className="font-notoSerif text-xl font-semibold text-neutral-dark">完成簽署</h1>
        <p className="text-sm text-neutral-mid">您已於 {rocDateTime(record.signTime)} 簽署完成此份勞報單。</p>
      </div>
    );
  }

  const isDomestic = record.nationality === '1';
  const isForeignUnder183 = record.nationality === '3';

  const handleSubmit = () => {
    if (!idNumber.trim() || !address.trim() || !addressPostal.trim() || (!isDomestic && countryId === null)) {
      setError('請填寫身分證字號、聯絡地址、郵遞區號' + (isDomestic ? '' : '並選擇國籍'));
      return;
    }
    setError('');
    setConfirmOpen(true);
  };

  const handleConfirmSign = async () => {
    setSubmitting(true);
    setError('');
    try {
      await signLabour({
        labourUuid: uuid,
        idPicFront: idPicFront ?? undefined,
        idPicBack: idPicBack ?? undefined,
        passportPic: passportPic ?? undefined,
      });
      await updateLabourBasicInfo({
        labourUuid: uuid,
        identifyNumber: idNumber.trim(),
        address: address.trim(),
        addressPostal: addressPostal.trim(),
        countryId: countryId as number,
        incomeTypeCode: record.code ?? 0,
      });
      setReloadKey(k => k + 1);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
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
                  <TextInput disabled value={rocDate(record.year, record.month, record.day)} />
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
                <MoneyInput disabled readOnly value={record.payableAmount} />
              </Field>
              <Field label="扣繳稅額">
                <MoneyInput disabled readOnly value={record.withholdingTax} />
              </Field>
              <Field label="二代健保費">
                <MoneyInput disabled readOnly value={record.secondHealthInsuranceFee} />
              </Field>
              <Field label="實際給付金額">
                <MoneyInput disabled readOnly value={record.actualPaymentAmount} />
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
              <Field label="國籍類別">
                <TextInput disabled value={nationalityLabel(record.nationality)} />
              </Field>
              <Field label={isDomestic ? '身分證字號' : '居留證或護照號碼'} required>
                <TextInput value={idNumber} onChange={e => setIdNumber(e.target.value.toUpperCase())} />
              </Field>
              <Field label="郵遞區號" required>
                <TextInput value={addressPostal} onChange={e => setAddressPostal(e.target.value)} />
              </Field>
              <Field label="聯絡地址" required>
                <TextInput value={address} onChange={e => setAddress(e.target.value)} />
              </Field>
              {!isDomestic && (
                <Field label="國籍（國家）" required>
                  <Select widthClassName="w-full" value={countryId !== null ? String(countryId) : ''} onValueChange={v => setCountryId(Number(v))}>
                    <option value="" disabled>
                      請選擇國籍
                    </option>
                    {countries.map(c => (
                      <option key={c.id} value={String(c.id)}>
                        {c.nameZh}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <SignImageUpload title={isDomestic ? '身分證正面' : '居留證正面'} onFileChange={setIdPicFront} />
            <SignImageUpload title={isDomestic ? '身分證反面' : '居留證反面'} onFileChange={setIdPicBack} />
            {isForeignUnder183 && <SignImageUpload title="護照照片全頁" onFileChange={setPassportPic} />}
          </div>

          {error && <p className="text-sm text-semantic-error">{error}</p>}

          <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
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
