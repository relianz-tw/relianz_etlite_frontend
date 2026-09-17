'use client';

import { NhiSlipPreview } from './NhiSlipPreview';
import { WithholdingSlipPreview } from './WithholdingSlipPreview';
import type {
  NhiPreviewData,
  WithholdingPreviewData,
} from '@/api/onboarding/preview';
import {
  checkNhiNeeded,
  checkWithholdingNeeded,
  previewNhi,
  previewWithholding,
} from '@/api/onboarding/preview';
import { formatLocalDate } from '@/lib/utils';
import { Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface SalaryDocumentPreviewProps {
  salary: {
    fixedSalary: number | null;
    variableSalary: number | null;
    payDate: string;
    nhiGradeId: number | null;
  };
  company: {
    name: string;
    representative: string;
    address: string;
  };
  contact: {
    phone: string;
  };
  taxId: string;
  variant?: 'green' | 'white';
}

const DOCUMENT_TYPES = [
  {
    type: 'withholding' as const,
    label: '薪資扣繳繳款書',
    deadline: '應於發薪日後次月 10 日前繳納',
  },
  {
    type: 'nhi' as const,
    label: '二代健保繳款書',
    deadline: '應於發薪日後次月月底前繳納',
  },
];

export function SalaryDocumentPreview({
  salary,
  company,
  contact,
  taxId,
  variant = 'white',
}: SalaryDocumentPreviewProps) {
  const [openDialog, setOpenDialog] = useState<'withholding' | 'nhi' | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [withholdingData, setWithholdingData] =
    useState<WithholdingPreviewData | null>(null);
  const [nhiData, setNhiData] = useState<NhiPreviewData | null>(null);
  const [nhiNotRequired, setNhiNotRequired] = useState(false);
  const [withholdingNotRequired, setWithholdingNotRequired] = useState(false);

  const isGreen = variant === 'green';
  const hasResult = !!(salary.fixedSalary != null);

  useEffect(() => {
    if (!hasResult) return;
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const payDate = (salary.payDate || formatLocalDate(today)).replace(
      /-/g,
      ''
    );

    checkWithholdingNeeded({
      fixedSalary: salary.fixedSalary ?? 0,
      variableSalary: salary.variableSalary ?? 0,
      incomeCode: '50',
      month,
      payDate,
      year,
    }).then(needed => setWithholdingNotRequired(!needed));

    checkNhiNeeded({
      fixedSalary: salary.fixedSalary ?? 0,
      variableSalary: salary.variableSalary ?? 0,
      incomeCode: '50',
      isNhi: true,
      month,
      nhiGradeId: salary.nhiGradeId ?? 1,
      year,
    }).then(needed => setNhiNotRequired(!needed));
  }, [
    salary.fixedSalary,
    salary.variableSalary,
    salary.payDate,
    salary.nhiGradeId,
    hasResult,
  ]);

  useEffect(() => {
    if (!openDialog) return;

    const today = new Date();
    const fixedSalary = salary.fixedSalary ?? 0;
    const variableSalary = salary.variableSalary ?? 0;
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const payDate = (salary.payDate || formatLocalDate(today)).replace(
      /-/g,
      ''
    );

    setLoading(true);

    if (openDialog === 'withholding') {
      previewWithholding({
        fixedSalary,
        variableSalary,
        incomeCode: '50',
        month,
        payDate,
        year,
      })
        .then(data => setWithholdingData(data))
        .catch(err => {
          toast.error(
            err instanceof Error ? err.message : '扣繳試算失敗，請重試'
          );
        })
        .finally(() => setLoading(false));
    } else {
      const nhiGradeId = salary.nhiGradeId ?? 1;
      previewNhi({
        fixedSalary,
        variableSalary,
        incomeCode: '50',
        isNhi: true,
        month,
        nhiGradeId,
        year,
      })
        .then(data => setNhiData(data))
        .catch(err => {
          toast.error(
            err instanceof Error ? err.message : '健保試算失敗，請重試'
          );
        })
        .finally(() => setLoading(false));
    }
  }, [openDialog]);

  return (
    <>
      <div className='flex flex-col gap-3'>
        <h2
          className={`text-sm font-semibold ${
            isGreen ? 'text-white' : 'text-neutral-dark'
          }`}
        >
          繳款書預覽
        </h2>

        {DOCUMENT_TYPES.map(({ type, label, deadline }) => (
          <div
            key={type}
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
              isGreen
                ? 'border border-dashed border-white/30'
                : 'border border-dashed border-neutral-blue-gray/50 bg-surface-off-white'
            }`}
          >
            <div className='flex flex-col min-w-0'>
              <span
                className={`text-xs font-medium ${
                  isGreen ? 'text-white/80' : 'text-neutral-dark/70'
                }`}
              >
                {label}
              </span>
              <span
                className={`text-xs mt-0.5 ${
                  isGreen ? 'text-white/40' : 'text-neutral-dark/40'
                }`}
              >
                {deadline}
              </span>
              {hasResult &&
                ((type === 'nhi' && nhiNotRequired) ||
                  (type === 'withholding' && withholdingNotRequired)) && (
                  <span
                    className={`text-[11px] mt-1 ${
                      isGreen ? 'text-white/40' : 'text-neutral-dark/40'
                    }`}
                  >
                    無需繳納
                  </span>
                )}
            </div>
            <button
              type='button'
              onClick={() => setOpenDialog(type)}
              disabled={
                !hasResult ||
                (type === 'nhi' && nhiNotRequired) ||
                (type === 'withholding' && withholdingNotRequired)
              }
              className={`ml-3 shrink-0 flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                isGreen
                  ? 'border border-white/50 text-white hover:bg-white/20'
                  : 'border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white'
              }`}
            >
              產出並預覽
            </button>
          </div>
        ))}

        {!hasResult && (
          <p
            className={`text-xs ${
              isGreen ? 'text-white/50' : 'text-neutral-dark/40'
            }`}
          >
            請先完成薪資計算後再查看繳款書
          </p>
        )}
      </div>

      {/* Dialog */}
      {openDialog && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
          onClick={() => setOpenDialog(null)}
        >
          <div
            className='relative bg-white rounded-xl shadow-level1 flex flex-col'
            style={{ width: '920px', maxWidth: '95vw', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Dialog 標題列 */}
            <div className='flex items-center justify-between px-6 py-4 border-b border-surface-cream shrink-0'>
              <h3 className='text-base font-semibold text-neutral-dark'>
                {DOCUMENT_TYPES.find(d => d.type === openDialog)?.label}
              </h3>
              <button
                type='button'
                onClick={() => setOpenDialog(null)}
                className='text-neutral-mid hover:text-neutral-dark transition-colors'
              >
                <X size={20} />
              </button>
            </div>

            {/* 繳款書內容（可捲動） */}
            <div className='overflow-auto flex-1 p-6'>
              {loading ? (
                <div className='flex items-center justify-center h-48'>
                  <Loader2 size={24} className='text-brand-blue animate-spin' />
                </div>
              ) : openDialog === 'withholding' && withholdingData ? (
                <WithholdingSlipPreview
                  companyName={company.name}
                  taxId={taxId}
                  representative={company.representative}
                  address={company.address}
                  phone={contact.phone}
                  data={withholdingData}
                />
              ) : openDialog === 'nhi' && nhiData ? (
                <NhiSlipPreview
                  taxId={taxId}
                  companyName={company.name}
                  data={nhiData}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
