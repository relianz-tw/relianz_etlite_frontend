'use client';

import { saveInvoiceBook } from '@/api/invoiceBook';
import ImportInvoiceDialog from '@/components/ImportInvoiceDialog';
import NewTransactionDialog from '@/components/NewTransactionDialog';
import Badge from '@/components/ui/Badge';
import type { BadgeTone } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { appendReturnQuery, buildLedgerPeriodQuery } from '@/features/ledger/urlState';
import InvoiceBookDialog from '@/features/settings/components/InvoiceBookDialog';
import { formatInvoicePeriodLabel, parseInvoicePeriodValue, toInvoicePeriodOption } from '@/lib/invoicePeriod';
import { BookPlus, CircleCheck, FileUp, Info, Plus, RefreshCw, Upload } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import CompareFormView from './CompareFormView';
import CompletionNextStepDialog from './CompletionNextStepDialog';
import { VAT_PHASES, phaseRangeLabel } from './derive';
import type { PeriodStatus, ReconcileTask } from './derive';
import TaskFigures from './TaskFigures';
import { markReconcileStale, useVatReconcile } from './VatReconcileContext';
import type { PeriodState } from './VatReconcileContext';

const STATUS_BADGE: Record<PeriodStatus, { tone: BadgeTone; variant: 'solid' | 'muted'; text: string }> = {
  matched: { tone: 'success', variant: 'muted', text: '已符合' },
  pending: { tone: 'neutral', variant: 'solid', text: '待處理' },
  notFiled: { tone: 'neutral', variant: 'muted', text: '未上傳申報' },
};

/** 期別格與詳情標題共用的狀態徽章；待處理另帶項目數 */
function PeriodBadge({ period }: { period: PeriodState }) {
  if (period.error) return <Badge tone="error">讀取失敗</Badge>;
  if (!period.data) return <Badge tone="neutral">載入中</Badge>;
  const { tone, variant, text } = STATUS_BADGE[period.data.status];
  return (
    <Badge tone={tone} variant={variant}>
      {text}
      {period.data.status === 'pending' ? ` ${period.data.tasks.length}` : ''}
    </Badge>
  );
}

export default function ReconcileView() {
  const { rocYear, periods, initialLoading, reload } = useVatReconcile();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  // 發票簿建立完成後詢問下一步；記下剛建立的期別，避免 reload 後預設選中期別改變而帶錯區間
  const [nextStepPeriod, setNextStepPeriod] = useState<{ rocYear: number; phase: number } | null>(null);
  // null＝未開啟；'sales'／'purchase' 對應 /ledger/new 的 side 參數
  const [txSide, setTxSide] = useState<'sales' | 'purchase' | null>(null);

  // 預設選第一個待處理期別，沒有則選最後一個有申報資料的期別，再沒有選第一期
  const defaultPhase = useMemo(() => {
    const pending = periods.find(p => p.data?.status === 'pending');
    if (pending) return pending.phase;
    const filed = [...periods].reverse().find(p => p.data && p.data.status !== 'notFiled');
    return filed?.phase ?? VAT_PHASES[0];
  }, [periods]);

  const phaseParam = Number(searchParams.get('phase'));
  const selectedPhase = (VAT_PHASES as readonly number[]).includes(phaseParam) ? phaseParam : defaultPhase;
  const selected = periods.find(p => p.phase === selectedPhase) ?? periods[0];

  const selectPhase = (phase: number) => router.replace(`${pathname}?phase=${phase}`, { scroll: false });

  // 發票簿對話框只給該期一個選項，等同鎖定期別
  const periodOption = toInvoicePeriodOption({ year: rocYear, phase: selectedPhase });

  const handleBookSubmit = async (form: { name: string; period: string; aphabeticLetter: string; startNum: string }) => {
    const parsed = parseInvoicePeriodValue(form.period);
    if (!parsed) return;
    await saveInvoiceBook({
      name: form.name,
      year: parsed.rocYear,
      phase: parsed.phase,
      aphabeticLetter: form.aphabeticLetter,
      startNum: form.startNum,
    });
    reload();
    setNextStepPeriod(parsed);
  };

  const handleImportClose = () => {
    setImportDialogOpen(false);
    // 匯入後留在本頁，立即重查
    reload();
  };

  const handleTxClose = () => {
    setTxSide(null);
    // 使用者可能已去補交易（換頁）或匯入發票（留在本頁）：前者離開表單頁時由 Context 重查，後者在此立即重查
    markReconcileStale();
    reload();
  };

  return (
    <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-6 px-4 py-8 nav:px-8 nav:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-display-zh text-2xl font-semibold text-neutral-dark nav:text-[32px] nav:leading-tight">任務中心</h1>
        <p className="text-sm text-neutral-mid">
          比對 {rocYear} 年帳簿發票試算結果與已寫入的 401／403 申報值，找出缺少的項目並即時補齊。
        </p>
      </header>

      <section aria-label="各期對帳狀態" className="grid grid-cols-3 gap-2 nav:grid-cols-6 nav:gap-3">
        {periods.map(p => {
          const active = p.phase === selectedPhase && !initialLoading;
          return (
            <button
              key={p.phase}
              type="button"
              aria-pressed={active}
              onClick={() => selectPhase(p.phase)}
              className={`flex min-h-[88px] flex-col items-start gap-1.5 rounded-lg border-2 bg-white px-3 py-3 text-left transition-colors nav:px-4 ${
                active ? 'border-brand-primary' : 'border-neutral-blue-gray/30 hover:border-neutral-blue-gray'
              }`}
            >
              <span className="text-xs text-neutral-mid">{p.data?.formKind ?? '—'}</span>
              <span className="font-display-zh text-base font-semibold leading-tight text-neutral-dark">
                {phaseRangeLabel(p.phase)}
              </span>
              <PeriodBadge period={p} />
            </button>
          );
        })}
      </section>

      <section className="flex flex-col gap-6">
        {initialLoading || !selected ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
        ) : (
          <PeriodDetail
            rocYear={rocYear}
            period={selected}
            onReload={reload}
            onCreateBook={() => setBookDialogOpen(true)}
            onImportInvoice={() => setImportDialogOpen(true)}
            onAddTransaction={side => setTxSide(side === 'in' ? 'purchase' : 'sales')}
          />
        )}
      </section>

      <InvoiceBookDialog
        open={bookDialogOpen}
        onClose={() => setBookDialogOpen(false)}
        onSubmit={handleBookSubmit}
        periods={[periodOption]}
        defaultPeriod={periodOption.value}
      />
      <ImportInvoiceDialog
        open={importDialogOpen}
        onClose={handleImportClose}
        periodLabel={formatInvoicePeriodLabel(rocYear, selectedPhase)}
      />
      {nextStepPeriod && (
        <CompletionNextStepDialog
          open
          onClose={() => setNextStepPeriod(null)}
          rocYear={nextStepPeriod.rocYear}
          phase={nextStepPeriod.phase}
        />
      )}
      <NewTransactionDialog
        open={txSide !== null}
        onClose={handleTxClose}
        // 帶 from 讓存檔或返回後回到帳簿時，日期區間自動設為目前選的這一期
        manualHref={appendReturnQuery(
          `/ledger/new?side=${txSide ?? 'sales'}`,
          buildLedgerPeriodQuery(rocYear, selectedPhase, txSide ?? 'sales'),
        )}
      />
    </div>
  );
}

interface PeriodDetailProps {
  rocYear: number;
  period: PeriodState;
  onReload: () => void;
  onCreateBook: () => void;
  onImportInvoice: () => void;
  onAddTransaction: (side: 'out' | 'in') => void;
}

function PeriodDetail({ rocYear, period, onReload, onCreateBook, onImportInvoice, onAddTransaction }: PeriodDetailProps) {
  const { data } = period;

  const heading = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display-zh text-xl font-semibold text-neutral-dark nav:text-2xl">
          {rocYear} 年 {phaseRangeLabel(period.phase)}
          {data ? ` · ${data.formKind}` : ''}
        </h2>
        <PeriodBadge period={period} />
      </div>
      <Button variant="ghost" size="sm" icon={RefreshCw} onClick={onReload} disabled={period.loading}>
        重新比對
      </Button>
    </div>
  );

  if (!data) {
    return (
      <div className="flex flex-col gap-6 rounded-lg border border-neutral-blue-gray/30 bg-white p-4 nav:p-8">
        {heading}
        <div
          className={`rounded-md bg-surface-cream p-6 text-center text-sm ${period.error ? 'text-semantic-error' : 'text-neutral-mid'}`}
        >
          {period.error || '載入中…'}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6 rounded-lg border border-neutral-blue-gray/30 bg-white p-4 nav:p-8">
      {heading}

      {data.status === 'pending' && (
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold text-neutral-dark">待完成項目</h3>
          <ol className="flex flex-col gap-3">
            {data.tasks.map((task, i) => (
              <TaskItem
                key={task.id}
                index={i + 1}
                task={task}
                onCreateBook={onCreateBook}
                onImportInvoice={onImportInvoice}
                onAddTransaction={onAddTransaction}
              />
            ))}
          </ol>
          <p className="flex items-start gap-2 rounded-md border border-brand-tan/40 bg-brand-tan/10 p-3 text-[13px] leading-relaxed text-semantic-warm-dark">
            <Info size={16} className="mt-0.5 shrink-0" />
            完成交易新增或發票簿建立後，回到本頁會自動重新比對。
          </p>
        </div>
      )}

      {data.status === 'matched' && (
        <div className="flex items-center gap-4 rounded-lg bg-semantic-success-muted/35 p-5">
          <CircleCheck size={32} className="shrink-0 text-semantic-success" />
          <div className="flex flex-col">
            <span className="font-semibold text-semantic-success">本期帳簿已與申報書一致</span>
            <span className="text-[13px] text-neutral-dark">所有可對照欄位的差額皆為 0，無需處理。</span>
          </div>
        </div>
      )}

      {data.status === 'notFiled' && (
        <div className="flex items-center gap-4 rounded-lg bg-surface-off-white p-5">
          <FileUp size={32} className="shrink-0 text-neutral-mid" />
          <div className="flex flex-col">
            <span className="font-semibold text-neutral-dark">尚未上傳本期 401／403 申報書</span>
            <span className="text-[13px] text-neutral-mid">上傳後即可比對；下方先列出帳簿依發票試算的結果供參考。</span>
          </div>
        </div>
      )}

      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-neutral-dark">對帳明細</h3>
        <CompareFormView formKind={data.formKind} taxYear={rocYear} diffs={data.diffs} />
        <p className="text-xs text-neutral-mid">差額＝帳簿試算 − 已申報。負數代表帳簿少於申報值，需補登。</p>
      </div>
    </>
  );
}

interface TaskItemProps {
  index: number;
  task: ReconcileTask;
  onCreateBook: () => void;
  onImportInvoice: () => void;
  onAddTransaction: (side: 'out' | 'in') => void;
}

function TaskItem({ index, task, onCreateBook, onImportInvoice, onAddTransaction }: TaskItemProps) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg bg-surface-off-white px-4 py-4 nav:px-5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-[13px] font-semibold text-white">
        {index}
      </span>
      <div className="flex min-w-0 flex-1 basis-60 flex-col">
        <span className="text-[15px] font-semibold text-neutral-dark">{task.title}</span>
        <span className="text-[13px] leading-relaxed text-neutral-mid">{task.description}</span>
      </div>
      <TaskFigures amount={task.amount} tax={task.tax} />
      {task.kind === 'invoiceBook' && (
        <div className="flex w-full flex-col gap-2 nav:w-auto nav:flex-row">
          <Button icon={BookPlus} onClick={onCreateBook} className="w-full nav:w-auto">
            一鍵新增發票簿
          </Button>
          <Button variant="outline" icon={Upload} onClick={onImportInvoice} className="w-full nav:w-auto">
            匯入電子發票
          </Button>
        </div>
      )}
      {task.kind === 'shortfall' && task.side && (
        <Button variant="outline" icon={Plus} onClick={() => onAddTransaction(task.side as 'out' | 'in')} className="w-full nav:w-auto">
          新增交易
        </Button>
      )}
    </li>
  );
}
