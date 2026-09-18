'use client';

import {
  checkNhiDeclareStatus,
  declareNhi,
  deleteWithholdingPdf,
  generateWithholdingPdf,
  listWithholdingPdfDocs,
  updateNhiPaidStatus,
  updateWithholdingPaidStatus,
  uploadWithholdingProof,
} from '@/api/withholdingPdf';
import type { WithholdingPdfDto } from '@/api/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { Download, Eye, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLock } from '../../components/LockContext';
import PaymentProofDialog from '../../components/PaymentProofDialog';
import { nhiDeclareStatusText } from '../data';
import type { NhiDeclareStatus, WithholdingRecord } from '../types';

// ⚠️ .env.production 目前尚未設定此值，正式環境上線前需補上（比照 SalaryPdfManager 的既有註記）
const IMG_BASE_URL = process.env.NEXT_PUBLIC_IMG_URL ?? '';

function documentUrl(pdfFileUrl: string): string {
  return pdfFileUrl.startsWith('http') ? pdfFileUrl : `${IMG_BASE_URL}/${pdfFileUrl}`;
}

/** 是否已超過扣繳／二代健保繳納期限（給付日次月 10 日 23:59，比照畫面下方提醒文案） */
function isPastDeadline(year: number, month: number): boolean {
  const deadline = new Date(year, month, 10, 23, 59, 59);
  return new Date() > deadline;
}

/** 只支援 50／51／9A／9B／5B 申報二代健保（後端 declare 端點 incomeCode 限制） */
const NHI_DECLARE_SUPPORTED = new Set(['51', '9A', '9B', '5B']);

interface DocListProps {
  title: string;
  docs: WithholdingPdfDto[];
  emptyText: string;
  loading: boolean;
  onDelete?: (uuid: string) => void;
}

function DocList({ title, docs, emptyText, loading, onDelete }: DocListProps) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-medium text-neutral-mid">{title}</h4>
      {loading ? (
        <p className="text-xs text-neutral-mid">載入中...</p>
      ) : docs.length === 0 ? (
        <div className="rounded-md border border-neutral-blue-gray/20 bg-surface-cream py-6 text-center text-sm text-neutral-mid">{emptyText}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {docs.map(doc => (
            <div
              key={doc.uuid}
              className="flex flex-col gap-2 rounded-md border border-neutral-blue-gray/20 bg-surface-cream p-3 nav:flex-row nav:items-center nav:justify-between"
            >
              <span className="text-xs text-neutral-mid">產生時間：{doc.updateTime}</span>
              <div className="flex shrink-0 gap-1.5">
                {doc.pdfFileUrl && IMG_BASE_URL && (
                  <a
                    href={documentUrl(doc.pdfFileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-brand-blue hover:bg-brand-blue/10"
                  >
                    <Eye size={13} /> 查看
                  </a>
                )}
                {doc.pdfFileUrl && IMG_BASE_URL && (
                  <a
                    href={documentUrl(doc.pdfFileUrl)}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-brand-blue hover:bg-brand-blue/10"
                  >
                    <Download size={13} /> 下載
                  </a>
                )}
                {onDelete && (
                  <Button size="sm" variant="ghost" icon={Trash2} onClick={() => onDelete(doc.uuid)} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface WithholdingPdfManagerProps {
  record: WithholdingRecord;
}

/**
 * 各類扣繳的扣繳繳款書／二代健保繳款書管理，串接真實 API（GET/POST/DELETE /ael/withholding/{...}），
 * 比照已串好的 SalaryPdfManager 樣式；不再使用 MockFile 模擬檔案。
 * 每個動作成功後只更新本元件內的本地狀態（isLabourForm 固定 false：這批紀錄一律非勞報單來源）。
 */
export default function WithholdingPdfManager({ record }: WithholdingPdfManagerProps) {
  const { isLocked } = useLock();
  const incomeCode = record.categoryCode;
  const isLabourForm = false;

  const [withholdingDocs, setWithholdingDocs] = useState<WithholdingPdfDto[]>([]);
  const [withholdingProofs, setWithholdingProofs] = useState<WithholdingPdfDto[]>([]);
  const [nhiDocs, setNhiDocs] = useState<WithholdingPdfDto[]>([]);
  const [nhiProofs, setNhiProofs] = useState<WithholdingPdfDto[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);

  const [withholdingPaid, setWithholdingPaid] = useState(record.withholdingPaid);
  const [nhiPaid, setNhiPaid] = useState(record.nhiPaid);
  const [isNhiDeclared, setIsNhiDeclared] = useState(record.isNhiDeclared);
  const [nhiDeclareStatus, setNhiDeclareStatus] = useState<NhiDeclareStatus>(record.nhiDeclareStatus);
  // 本次申報流程取得的申報記錄 uuid／查詢代碼；跨工作階段重新載入的既有申報紀錄沒有這組值，無法重新查詢狀態
  const [declareRecordUuid, setDeclareRecordUuid] = useState<string | null>(null);
  const [declareCode, setDeclareCode] = useState<string | null>(record.nhiDeclareCode ?? null);

  const [taxProofOpen, setTaxProofOpen] = useState(false);
  const [nhiProofOpen, setNhiProofOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ uuid: string; refresh: 'withholding' | 'nhi' } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadDocs = () => {
    setDocsLoading(true);
    Promise.all([
      listWithholdingPdfDocs('withholding', { incomeCode, withholdingSummaryUuid: record.uuid, isPaymentProofDoc: false }),
      listWithholdingPdfDocs('withholding', { incomeCode, withholdingSummaryUuid: record.uuid, isPaymentProofDoc: true }),
      listWithholdingPdfDocs('healthInsurance', { incomeCode, withholdingSummaryUuid: record.uuid, isPaymentProofDoc: false }),
      listWithholdingPdfDocs('healthInsurance', { incomeCode, withholdingSummaryUuid: record.uuid, isPaymentProofDoc: true }),
    ])
      .then(([docs, proofs, nDocs, nProofs]) => {
        setWithholdingDocs(docs);
        setWithholdingProofs(proofs);
        setNhiDocs(nDocs);
        setNhiProofs(nProofs);
      })
      .catch(err => setError(getFriendlyErrorMessage(err, '查詢繳款書失敗')))
      .finally(() => setDocsLoading(false));
  };

  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record.uuid]);

  const runAction = async (action: () => Promise<void>, fallback: string) => {
    setError('');
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const handleGenerateWithholding = () =>
    runAction(async () => {
      await generateWithholdingPdf('withholding', {
        incomeCode,
        withholdingSummaryUuid: record.uuid,
        year: record.incomeYear,
        month: record.incomeMonth,
        paymentYear: record.paymentYear,
        paymentMonth: record.paymentMonth,
        paymentDay: record.paymentDay,
        totalAmount: record.grossIncome,
        isOverDeadline: isPastDeadline(record.paymentYear, record.paymentMonth),
      });
      loadDocs();
    }, '產生扣繳繳款書失敗');

  const handleGenerateNhi = () =>
    runAction(async () => {
      await generateWithholdingPdf('healthInsurance', {
        incomeCode,
        withholdingSummaryUuid: record.uuid,
        year: record.incomeYear,
        month: record.incomeMonth,
        paymentYear: record.paymentYear,
        paymentMonth: record.paymentMonth,
        paymentDay: record.paymentDay,
        totalAmount: record.nhiAmount,
        isOverDeadline: isPastDeadline(record.paymentYear, record.paymentMonth),
      });
      loadDocs();
    }, '產生二代健保繳款書失敗');

  const handleDeleteDoc = () =>
    runAction(async () => {
      if (!deleteTarget) return;
      await deleteWithholdingPdf(deleteTarget.uuid);
      setDeleteTarget(null);
      loadDocs();
    }, '刪除失敗');

  const handleUploadWithholdingProof = (file: File) =>
    runAction(async () => {
      await uploadWithholdingProof('withholding', {
        incomeCode,
        withholdingSummaryUuid: record.uuid,
        year: record.paymentYear,
        month: record.paymentMonth,
        day: record.paymentDay,
        isLabourForm,
        file,
      });
      await updateWithholdingPaidStatus({ uuid: record.uuid, incomeCode, isLabourForm, status: true });
      setWithholdingPaid(true);
      setTaxProofOpen(false);
      loadDocs();
    }, '上傳扣繳繳稅證明失敗');

  const handleUploadNhiProof = (file: File) =>
    runAction(async () => {
      await uploadWithholdingProof('healthInsurance', {
        incomeCode,
        withholdingSummaryUuid: record.uuid,
        year: record.paymentYear,
        month: record.paymentMonth,
        day: record.paymentDay,
        isLabourForm,
        file,
      });
      await updateNhiPaidStatus({ uuid: record.uuid, incomeCode, isLabourForm, status: true });
      setNhiPaid(true);
      setNhiProofOpen(false);
      loadDocs();
    }, '上傳二代健保繳費證明失敗');

  const handleDeclare = () =>
    runAction(async () => {
      if (isNhiDeclared && declareRecordUuid && declareCode) {
        const result = await checkNhiDeclareStatus({ nhiDeclareRecordUuid: declareRecordUuid, code: declareCode });
        setNhiDeclareStatus(result.status as NhiDeclareStatus);
        return;
      }
      if (isNhiDeclared) return; // 既有申報但缺申報記錄 uuid（跨工作階段），無法重新查詢，見上方狀態說明
      const result = await declareNhi({
        incomeCode,
        isLabourForm,
        isPartTime: false,
        nhiAmount: record.nhiAmount,
        paymentDay: record.paymentDay,
        paymentMonth: record.paymentMonth,
        paymentYear: record.paymentYear,
        withholdingSummaryUuid: record.uuid,
      });
      setIsNhiDeclared(true);
      setDeclareRecordUuid(result.uuid);
      setDeclareCode(result.code);
      const status = await checkNhiDeclareStatus({ nhiDeclareRecordUuid: result.uuid, code: result.code });
      setNhiDeclareStatus(status.status as NhiDeclareStatus);
    }, '二代健保申報失敗');

  const canRefreshDeclareStatus = isNhiDeclared && Boolean(declareRecordUuid && declareCode);

  return (
    <div className="flex flex-col gap-5">
      {error && <p className="text-sm text-semantic-error">{error}</p>}

      {record.withholdingAmount > 0 && (
        <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-5">
          <div className="mb-4 flex flex-col gap-3 nav:flex-row nav:items-center nav:justify-between">
            <h3 className="text-lg font-semibold text-neutral-dark">扣繳繳款書</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={handleGenerateWithholding}
                disabled={isLocked || busy || withholdingDocs.length > 0 || withholdingPaid}
                title={withholdingDocs.length > 0 ? '繳款書已存在，如需重新產生請先刪除' : withholdingPaid ? '已繳納，無需產生繳款書' : undefined}
              >
                產生扣繳繳款書
              </Button>
              <Button size="sm" variant={withholdingPaid ? 'primary' : 'outline'} disabled={withholdingPaid || isLocked || busy} onClick={() => setTaxProofOpen(true)}>
                {withholdingPaid ? '繳款狀態 - 已繳納' : '繳款狀態 - 未繳納'}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <DocList
              title="扣繳繳款書"
              docs={withholdingDocs}
              loading={docsLoading}
              emptyText={withholdingProofs.length > 0 ? '您已繳款完畢！' : '尚未產生扣繳繳款書'}
              onDelete={uuid => setDeleteTarget({ uuid, refresh: 'withholding' })}
            />
            <DocList title="扣繳繳款證明" docs={withholdingProofs} loading={docsLoading} emptyText="尚未上傳繳款證明" />
          </div>
        </div>
      )}

      {record.nhiAmount > 0 && (
        <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-5">
          <div className="mb-4 flex flex-col gap-3 nav:flex-row nav:items-center nav:justify-between">
            <h3 className="text-lg font-semibold text-neutral-dark">二代健保繳款書</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={handleGenerateNhi}
                disabled={isLocked || busy || nhiDocs.length > 0 || nhiPaid}
                title={nhiDocs.length > 0 ? '繳款書已存在，如需重新產生請先刪除' : nhiPaid ? '已繳納，無需產生繳款書' : undefined}
              >
                產生二代健保繳款書
              </Button>
              <Button size="sm" variant={nhiPaid ? 'primary' : 'outline'} disabled={nhiPaid || isLocked || busy} onClick={() => setNhiProofOpen(true)}>
                {nhiPaid ? '繳款狀態 - 已繳納' : '繳款狀態 - 未繳納'}
              </Button>
              {nhiPaid && NHI_DECLARE_SUPPORTED.has(incomeCode) && (
                <Button
                  size="sm"
                  variant={isNhiDeclared ? 'primary' : 'outline'}
                  onClick={handleDeclare}
                  disabled={isLocked || busy || (isNhiDeclared && !canRefreshDeclareStatus)}
                  title={isNhiDeclared && !canRefreshDeclareStatus ? '此筆為先前工作階段已申報之紀錄，暫無法重新查詢最新狀態' : undefined}
                >
                  {isNhiDeclared ? nhiDeclareStatusText(nhiDeclareStatus) : '申報'}
                </Button>
              )}
            </div>
          </div>

          {isNhiDeclared && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-brand-blue/20 bg-brand-blue/5 px-3 py-2 text-xs text-brand-blue">
              <Badge tone="info">{nhiDeclareStatusText(nhiDeclareStatus)}</Badge>
              二代健保申報已送出，如需查詢狀態或取消申報，請使用健保署二代健保申報狀態查詢頁面。
            </div>
          )}

          <div className="flex flex-col gap-4">
            <DocList
              title="二代健保繳款書"
              docs={nhiDocs}
              loading={docsLoading}
              emptyText={nhiProofs.length > 0 ? '您已繳款完畢！' : '尚未產生二代健保繳款書'}
              onDelete={uuid => setDeleteTarget({ uuid, refresh: 'nhi' })}
            />
            <DocList title="二代健保繳款證明" docs={nhiProofs} loading={docsLoading} emptyText="尚未上傳繳款證明" />
          </div>
        </div>
      )}

      <PaymentProofDialog open={taxProofOpen} onClose={() => setTaxProofOpen(false)} title="扣繳繳稅證明上傳" onConfirm={(_date, file) => handleUploadWithholdingProof(file)} />
      <PaymentProofDialog open={nhiProofOpen} onClose={() => setNhiProofOpen(false)} title="二代健保繳費證明上傳" onConfirm={(_date, file) => handleUploadNhiProof(file)} />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteDoc}
        title="確定要刪除此繳款書嗎？"
        message="此動作無法復原。"
      />
    </div>
  );
}
