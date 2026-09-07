'use client';

import { getLabourDetail } from '@/api/labour';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import MoneyInput from '@/components/ui/MoneyInput';
import SectionCard from '@/components/ui/SectionCard';
import TextInput from '@/components/ui/TextInput';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { Backpack, BookOpen, ChevronLeft, FileText, Trash2, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Field from '../components/Field';
import LockedBanner from '../components/LockedBanner';
import { useLock } from '../components/LockContext';
import LaborPdfManager from './components/LaborPdfManager';
import TagChipsField from './components/TagChipsField';
import { mapLabourDtoToRecord, nationalityLabel, serviceTypeLabel, signLinkFor } from './data';
import { addProject, addTag, getLaborLocalExtras, listAllProjects, listAllTags, updateLaborLocalExtras } from './localExtras';
import type { LaborRecord } from './types';

function rocDate(year: number, month: number, day: number): string {
  return `${year - 1911}/${month}/${day}`;
}

interface LaborDetailViewProps {
  uuid: string;
  incomeCode?: string;
}

export default function LaborDetailView({ uuid, incomeCode }: LaborDetailViewProps) {
  const { isLocked } = useLock();
  const [record, setRecord] = useState<LaborRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getLabourDetail({ labourUuid: uuid, incomeCode })
      .then(dto => {
        if (cancelled) return;
        setRecord(mapLabourDtoToRecord(dto, getLaborLocalExtras(dto.labourUuid)));
      })
      .catch(err => {
        if (!cancelled) setError(getFriendlyErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uuid, incomeCode, reloadKey]);

  const refresh = () => setReloadKey(k => k + 1);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-off-white text-sm text-neutral-mid">載入中…</div>;
  }
  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-off-white text-sm text-semantic-error">{error}</div>;
  }
  if (!record) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-off-white text-sm text-neutral-mid">找不到此勞報單資料</div>;
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(signLinkFor(record.uuid, record.serviceType));
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
                <TextInput disabled value={nationalityLabel(record.nationality)} />
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
                  updateLaborLocalExtras(record.uuid, { tags: next });
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
                  updateLaborLocalExtras(record.uuid, { projects: next });
                  refresh();
                }}
                options={listAllProjects()}
                onCreateNew={addProject}
              />
              <p className="text-xs text-neutral-mid">標籤／專案尚未串接後端 API，暫存於瀏覽器記憶體，重新整理頁面會重置。</p>
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

          <LaborPdfManager record={record} onChange={refresh} />

          <div className="flex items-center justify-between">
            <Button variant="danger" icon={Trash2} disabled title="刪除功能尚未串接後端 API">
              刪除
            </Button>
            <Link href={`/withholding/labor/${record.uuid}/doc?ic=${record.serviceType}`} className="inline-flex">
              <Button variant="outline" icon={FileText}>
                檢視勞報單
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
