'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SectionCard from '@/components/ui/SectionCard';
import TextInput from '@/components/ui/TextInput';
import { fmtCurrency } from '@/lib/utils';
import { Backpack, BookOpen, ChevronLeft, FileText, Trash2, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Field from '../components/Field';
import LockedBanner from '../components/LockedBanner';
import { useLock } from '../components/LockContext';
import LaborPdfManager from './components/LaborPdfManager';
import TagChipsField from './components/TagChipsField';
import { serviceTypeLabel, signLinkFor } from './data';
import { addProject, addTag, deleteLaborRecord, getLaborRecord, listAllProjects, listAllTags, updateLaborRecord } from './mockStore';

function rocDate(year: number, month: number, day: number): string {
  return `${year - 1911}/${month}/${day}`;
}

export default function LaborDetailView({ uuid }: { uuid: string }) {
  const router = useRouter();
  const { isLocked } = useLock();
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);
  void tick;

  const record = getLaborRecord(uuid);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!record) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-off-white text-sm text-neutral-mid">找不到此勞報單資料</div>;
  }

  const handleDelete = () => {
    deleteLaborRecord(record.uuid);
    router.push('/withholding/labor');
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(signLinkFor(record.uuid));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[720px] px-4 pt-4 pb-10 nav:px-7 nav:pt-7">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/withholding/labor" className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-mid hover:bg-surface-cream hover:text-neutral-dark">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex flex-1 items-center justify-between">
            <h1 className="font-notoSerif text-[22px] font-semibold tracking-tight text-neutral-dark">勞報單詳細</h1>
            <Badge tone={record.signStatus === 1 ? 'success' : 'neutral'}>{record.signStatus === 1 ? '已簽署' : '未簽署'}</Badge>
          </div>
        </div>

        <LockedBanner className="mb-5" />

        {record.signStatus === 0 && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-md border border-brand-blue/20 bg-brand-blue/5 px-4 py-3">
            <p className="text-sm text-neutral-dark">尚未簽署，請將簽署連結提供給勞務提供者本人</p>
            <Button size="sm" onClick={handleCopyLink} disabled={isLocked}>
              {copied ? '已複製連結' : '複製簽署連結'}
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-5">
          <SectionCard title="勞務提供者資料" icon={User}>
            <div className="grid grid-cols-1 gap-4 nav:grid-cols-2">
              <Field label="姓名">
                <TextInput disabled value={record.name} />
              </Field>
              <Field label="身分證字號 / 居留證號碼">
                <TextInput disabled value={record.idNumber || '-'} />
              </Field>
              <Field label="國籍">
                <TextInput disabled value={record.nationality} />
              </Field>
              <Field label="有無投保於工會">
                <TextInput disabled value={record.isUnionInsured ? '有' : '沒有'} />
              </Field>
              <Field label="手機號碼">
                <TextInput disabled value={record.phone} />
              </Field>
              <Field label="聯絡地址">
                <TextInput disabled value={record.address || '（待簽署頁填寫）'} />
              </Field>
            </div>
          </SectionCard>

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
              <TagChipsField
                label="標籤"
                prefix="#"
                value={record.tags}
                onChange={next => {
                  updateLaborRecord(record.uuid, { tags: next });
                  refresh();
                }}
                options={listAllTags()}
                onCreateNew={addTag}
              />
              <TagChipsField
                label="專案"
                prefix="@"
                value={record.projects}
                onChange={next => {
                  updateLaborRecord(record.uuid, { projects: next });
                  refresh();
                }}
                options={listAllProjects()}
                onCreateNew={addProject}
              />
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

          <LaborPdfManager record={record} onChange={refresh} />

          <div className="flex items-center justify-between">
            <Button variant="danger" icon={Trash2} onClick={() => setDeleteOpen(true)} disabled={isLocked}>
              刪除
            </Button>
            <Link href={`/withholding/labor/${record.uuid}/doc`} className="inline-flex">
              <Button variant="outline" icon={FileText}>
                檢視勞報單
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="確認刪除此勞報單？"
        message="此操作無法復原。"
      />
    </div>
  );
}
