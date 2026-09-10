'use client';

import { deleteSalaryDocument, fetchSalaryDocuments, generateHealthInsuranceDocument, generateParttimeDocument, generateWithholdingDocument } from '@/api/salary';
import type { SalaryDocumentDto } from '@/api/types';
import Button from '@/components/ui/Button';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { Eye, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { isNhiUninsured } from '../data';
import type { PayrollItem } from '../types';
import { useInsuranceGrades } from '../useEmployees';

interface SalaryPdfManagerProps {
  /** 所得歸屬年（西元，來自 URL） */
  year: number;
  month: number;
  items: PayrollItem[];
  readOnly: boolean;
}

// ⚠️ .env.production 目前尚未設定此值（見 .env.dev／.env.development／.env.staging），正式環境上線前需補上
const IMG_BASE_URL = process.env.NEXT_PUBLIC_IMG_URL ?? '';

function documentUrl(pdfFileUrl: string): string {
  return pdfFileUrl.startsWith('http') ? pdfFileUrl : `${IMG_BASE_URL}/${pdfFileUrl}`;
}

/**
 * 挑出最多員工共用的給薪日期，供產生扣繳繳款書使用（後端此端點一次只收一組給薪日期，
 * 不支援依日期分組各產一份）。給薪日期不一致時，少數人員的日期不會反映在繳款書上，
 * 這是刻意簡化的範圍：多組給薪日期各自產生對應繳款書屬於較大的功能擴充，本期未做。
 */
function pickPaymentDate(items: PayrollItem[]): { year: number; month: number; day: number } | null {
  const counts = new Map<string, { year: number; month: number; day: number; count: number }>();
  items.forEach(item => {
    if (!item.paymentYear || !item.paymentMonth || !item.paymentDay) return;
    const key = `${item.paymentYear}-${item.paymentMonth}-${item.paymentDay}`;
    const entry = counts.get(key) ?? { year: item.paymentYear, month: item.paymentMonth, day: item.paymentDay, count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  });
  let best: { year: number; month: number; day: number; count: number } | null = null;
  counts.forEach(entry => {
    if (!best || entry.count > best.count) best = entry;
  });
  return best;
}

/** 是否已超過扣繳稅款繳納期限（發薪日次月 10 日 23:59，比照畫面下方提醒文案） */
function isPastWithholdingDeadline(paymentYear: number, paymentMonth: number, paymentDay: number): boolean {
  const deadline = new Date(paymentYear, paymentMonth, 10, 23, 59, 59);
  return new Date() > deadline;
}

function DocumentList({
  docs,
  onDelete,
  deletingUuid,
  readOnly,
}: {
  docs: SalaryDocumentDto[];
  onDelete: (uuid: string) => void;
  deletingUuid: string | null;
  readOnly: boolean;
}) {
  if (docs.length === 0) return <p className="text-xs text-neutral-mid">尚未產生</p>;
  return (
    <ul className="flex flex-col gap-2">
      {docs.map(doc => (
        <li key={doc.uuid} className="flex items-center justify-between gap-3 rounded-md border border-neutral-blue-gray/20 bg-surface-cream px-3 py-2 text-xs">
          <span className="text-neutral-mid">產生時間：{doc.updateTime}</span>
          <div className="flex gap-1.5">
            {doc.pdfFileUrl && IMG_BASE_URL && (
              <a
                href={documentUrl(doc.pdfFileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded px-2 py-1 font-medium text-brand-blue hover:bg-brand-blue/10"
              >
                <Eye size={14} /> 查看
              </a>
            )}
            <button
              type="button"
              onClick={() => onDelete(doc.uuid)}
              disabled={readOnly || deletingUuid === doc.uuid}
              className="inline-flex items-center gap-1 rounded px-2 py-1 font-medium text-semantic-error hover:bg-semantic-error/10 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Trash2 size={14} /> {deletingUuid === doc.uuid ? '刪除中…' : '刪除'}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * 扣繳／二代健保繳款書產製與清單。
 * ⚠️ 後端目前只有「產生」「查詢」「刪除」三種端點，沒有標記已繳款／已申報／上傳繳款證明的寫入端點，
 * 這三個按鈕維持停用，待後端提供對應 API 後再串接。
 * ⚠️ 後端產生端點本身沒有防重複產生的機制，前端靠「本月已有一份時停用產生按鈕」自行把關。
 * ⚠️ 二代健保依員工健保是否「無投保」（見 data.ts isNhiUninsured）分成正職／兼職兩份繳款書，
 * 兩者金額互斥加總，避免同一筆二代健保金額被重複申報（比對姊妹專案 EASYTAX 邏輯確認）。
 */
export default function SalaryPdfManager({ year, month, items, readOnly }: SalaryPdfManagerProps) {
  const totalWithholding = items.reduce((sum, i) => sum + i.withholding, 0);
  const { nhiGrades, loading: gradesLoading } = useInsuranceGrades(year);
  const parttimeItems = items.filter(i => isNhiUninsured(i.nhiLevelId, nhiGrades));
  const regularItems = items.filter(i => !isNhiUninsured(i.nhiLevelId, nhiGrades));
  const totalNhiRegular = regularItems.reduce((sum, i) => sum + i.secondHealthInsuranceFee, 0);
  const totalNhiParttime = parttimeItems.reduce((sum, i) => sum + i.secondHealthInsuranceFee, 0);

  const [withholdingDocs, setWithholdingDocs] = useState<SalaryDocumentDto[]>([]);
  const [nhiDocs, setNhiDocs] = useState<SalaryDocumentDto[]>([]);
  const [parttimeDocs, setParttimeDocs] = useState<SalaryDocumentDto[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [generatingWithholding, setGeneratingWithholding] = useState(false);
  const [generatingNhi, setGeneratingNhi] = useState(false);
  const [generatingParttime, setGeneratingParttime] = useState(false);
  const [withholdingError, setWithholdingError] = useState('');
  const [nhiError, setNhiError] = useState('');
  const [parttimeError, setParttimeError] = useState('');
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);

  const reloadDocs = async () => {
    setLoadingDocs(true);
    const [w, n, p] = await Promise.allSettled([
      fetchSalaryDocuments({ type: 1, year, month }),
      fetchSalaryDocuments({ type: 2, year, month }),
      fetchSalaryDocuments({ type: 8, year, month }),
    ]);
    setWithholdingDocs(w.status === 'fulfilled' ? w.value : []);
    setNhiDocs(n.status === 'fulfilled' ? n.value : []);
    setParttimeDocs(p.status === 'fulfilled' ? p.value : []);
    setLoadingDocs(false);
  };

  useEffect(() => {
    void reloadDocs();
    // 僅在切換年月時重新查詢
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const paymentDate = pickPaymentDate(items);

  const handleGenerateWithholding = async () => {
    if (!paymentDate) return;
    setGeneratingWithholding(true);
    setWithholdingError('');
    try {
      await generateWithholdingDocument({
        incomeYear: year,
        incomeMonth: month,
        paymentYear: paymentDate.year,
        paymentMonth: paymentDate.month,
        paymentDay: paymentDate.day,
        isOverDeadline: isPastWithholdingDeadline(paymentDate.year, paymentDate.month, paymentDate.day),
      });
      await reloadDocs();
    } catch (err) {
      setWithholdingError(getFriendlyErrorMessage(err, '產生扣繳繳款書失敗'));
    } finally {
      setGeneratingWithholding(false);
    }
  };

  const handleGenerateNhi = async () => {
    setGeneratingNhi(true);
    setNhiError('');
    try {
      await generateHealthInsuranceDocument({ supplementaryInsuranceFee: totalNhiRegular, year, month });
      await reloadDocs();
    } catch (err) {
      setNhiError(getFriendlyErrorMessage(err, '產生二代健保繳款書失敗'));
    } finally {
      setGeneratingNhi(false);
    }
  };

  const handleGenerateParttime = async () => {
    setGeneratingParttime(true);
    setParttimeError('');
    try {
      await generateParttimeDocument({ salary: totalNhiParttime, year, month });
      await reloadDocs();
    } catch (err) {
      setParttimeError(getFriendlyErrorMessage(err, '產生兼職二代健保繳款書失敗'));
    } finally {
      setGeneratingParttime(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    setDeletingUuid(uuid);
    try {
      await deleteSalaryDocument(uuid);
      await reloadDocs();
    } finally {
      setDeletingUuid(null);
    }
  };

  return (
    <div className="mt-5 flex flex-col gap-5">
      <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-5">
        <div className="mb-2 flex flex-col gap-3 nav:flex-row nav:items-center nav:justify-between">
          <h3 className="text-lg font-semibold text-neutral-dark">扣繳繳款書</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={handleGenerateWithholding}
              disabled={readOnly || generatingWithholding || withholdingDocs.length > 0 || !paymentDate}
              title={withholdingDocs.length > 0 ? '本月已產生過，請先刪除再重新產生' : !paymentDate ? '尚無給薪日期資料，無法產生' : undefined}
            >
              {generatingWithholding ? '產生中，請稍候…' : '產生扣繳繳款書'}
            </Button>
            <Button size="sm" variant="outline" disabled title="繳款狀態登記尚未串接後端 API">
              繳款狀態
            </Button>
          </div>
        </div>
        <p className="mb-3 text-xs text-neutral-mid">本月扣繳稅額總計：{totalWithholding.toLocaleString('en-US')} 元</p>
        {withholdingError && <p className="mb-3 text-xs text-semantic-error">{withholdingError}</p>}
        {loadingDocs ? <p className="text-xs text-neutral-mid">載入中…</p> : <DocumentList docs={withholdingDocs} onDelete={handleDelete} deletingUuid={deletingUuid} readOnly={readOnly} />}
      </div>

      <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-5">
        <div className="mb-2 flex flex-col gap-3 nav:flex-row nav:items-center nav:justify-between">
          <h3 className="text-lg font-semibold text-neutral-dark">二代健保繳款書（正職）</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={handleGenerateNhi}
              disabled={readOnly || generatingNhi || gradesLoading || nhiDocs.length > 0 || totalNhiRegular <= 0}
              title={nhiDocs.length > 0 ? '本月已產生過，請先刪除再重新產生' : totalNhiRegular <= 0 ? '本月無二代健保金額，無需產生' : undefined}
            >
              {generatingNhi ? '產生中，請稍候…' : '產生二代健保繳款書'}
            </Button>
            <Button size="sm" variant="outline" disabled title="繳款狀態登記尚未串接後端 API">
              繳款狀態
            </Button>
            <Button size="sm" variant="outline" disabled title="申報登記尚未串接後端 API">
              申報
            </Button>
          </div>
        </div>
        <p className="mb-3 text-xs text-neutral-mid">本月正職員工二代健保金額總計：{totalNhiRegular.toLocaleString('en-US')} 元</p>
        {nhiError && <p className="mb-3 text-xs text-semantic-error">{nhiError}</p>}
        {loadingDocs ? <p className="text-xs text-neutral-mid">載入中…</p> : <DocumentList docs={nhiDocs} onDelete={handleDelete} deletingUuid={deletingUuid} readOnly={readOnly} />}
      </div>

      <div className="rounded-lg border border-neutral-blue-gray/30 bg-white p-5">
        <div className="mb-2 flex flex-col gap-3 nav:flex-row nav:items-center nav:justify-between">
          <h3 className="text-lg font-semibold text-neutral-dark">二代健保繳款書（兼職）</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={handleGenerateParttime}
              disabled={readOnly || generatingParttime || gradesLoading || parttimeDocs.length > 0 || totalNhiParttime <= 0}
              title={parttimeDocs.length > 0 ? '本月已產生過，請先刪除再重新產生' : totalNhiParttime <= 0 ? '本月無兼職員工二代健保金額，無需產生' : undefined}
            >
              {generatingParttime ? '產生中，請稍候…' : '產生兼職二代健保繳款書'}
            </Button>
          </div>
        </div>
        <p className="mb-3 text-xs text-neutral-mid">本月兼職（健保無投保）員工二代健保金額總計：{totalNhiParttime.toLocaleString('en-US')} 元</p>
        {parttimeError && <p className="mb-3 text-xs text-semantic-error">{parttimeError}</p>}
        {loadingDocs ? <p className="text-xs text-neutral-mid">載入中…</p> : <DocumentList docs={parttimeDocs} onDelete={handleDelete} deletingUuid={deletingUuid} readOnly={readOnly} />}
      </div>
    </div>
  );
}
