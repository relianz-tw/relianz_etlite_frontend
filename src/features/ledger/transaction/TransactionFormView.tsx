'use client';

import {
  createPayable,
  createPayableAllowance,
  createReceivable,
  createReceivableAllowance,
  fetchDailyDetail,
  fetchEntryDetail,
  reverseSummarySettle,
} from '@/api/ledger';
import type {
  CreateAllowanceBody,
  CreatePayableBody,
  CreateReceivableBody,
  DailyDetailLineDto,
  EntryDetailAllowanceDto,
  EntryDetailEntryDto,
  EntryDetailSettleEventDto,
} from '@/api/types';
import Button from '@/components/ui/Button';
import JournalCard from '@/components/ui/JournalCard';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import VoidConfirmDialog from '../components/VoidConfirmDialog';
import type { Side } from '../types';
import { appendReturnQuery, resolveLedgerBackHref } from '../urlState';
import AllowanceCreateDialog from './components/AllowanceCreateDialog';
import SettlementEditDialog from './components/SettlementEditDialog';
import SettlementReverseConfirmModal from './components/SettlementReverseConfirmModal';
import TransactionAllowanceListCard from './components/TransactionAllowanceListCard';
import TransactionMetaCard from './components/TransactionMetaCard';
import TransactionOriginCard from './components/TransactionOriginCard';
import TransactionSettlementStatus from './components/TransactionSettlementStatus';
import VoucherUpload from './components/VoucherUpload';
import { useSettleEventOrigins } from './settleEventOrigins';
import { EMPTY_TRANSACTION_FORM, formatYmd, mapInvoiceDetailToForm, resolveExpenseCategory, VOUCHER_KIND_MAP, VOUCHER_TYPES } from './data';
import type { TransactionFormState, TransactionMode } from './types';

interface TransactionFormViewProps {
  mode: TransactionMode;
  side: Side;
  transactionId?: string;
  returnQuery?: string;
}

const SIDE_LABEL: Record<Side, string> = { sales: '銷項', purchase: '進項' };
const IMPORT_VOUCHER_TYPE = VOUCHER_TYPES[3]; // 進口稅單

/** 送出前檢查必填欄位，回傳第一個錯誤訊息；全部通過回傳 null */
function validateForm(side: Side, form: TransactionFormState): string | null {
  // 折讓單欄位大幅收斂，驗證邏輯與一般交易分開處理
  if (form.isAllowance) {
    if (!form.originLedgerUuid) return '請先輸入可查得原始憑證的發票號碼';
    if (!form.issueDate) return '請選擇開立日期';
    if (!form.expenseCategory?.id) return side === 'purchase' ? '請選擇費用類別' : '請選擇收入科目';
    if (form.salesAmount + form.taxAmount <= 0) return '請輸入折讓金額';
    return null;
  }
  if (side === 'purchase') {
    // 進項：廠商必須指定（至少選「其他」）；賣家名稱隨廠商選擇帶入為必填，統編僅「其他」以外的廠商需要（其他無真實統編，可自由輸入非必填）
    if (!form.sellerVendorUuid) return '請選擇廠商';
    if (!form.sellerName.trim()) return '請輸入賣家名稱';
  } else {
    // 銷項：買家統編、名稱皆為選填，但填了其中一項就需要一併填另一項
    if (form.buyerTaxId.trim() && !form.buyerName.trim()) return '請輸入買家名稱';
    if (form.buyerName.trim() && !form.buyerTaxId.trim()) return '請輸入買家統一編號';
  }
  if (!form.issueDate) return '請選擇開立日期';
  if (!form.expenseCategory?.id) return side === 'purchase' ? '請選擇費用類別' : '請選擇收入科目';
  if (side === 'sales' && !form.channel) return '請選擇銷售管道';
  if (side === 'purchase') {
    const isImport = form.voucherType === IMPORT_VOUCHER_TYPE;
    const invoiceNum = form.voucherType === VOUCHER_TYPES[0] ? form.invoiceSerial : form.invoiceNumber;
    if (!isImport && !invoiceNum.trim()) return '請輸入發票號碼';
  } else if (!form.invoiceSerial.trim()) {
    return '請輸入發票號碼';
  }
  return null;
}

/** 折讓單建立（POST /ael/ledger/{payables,receivables}/allowance）body 組裝；銷折/進折欄位完全相同 */
function buildAllowanceBody(form: TransactionFormState): Omit<CreateAllowanceBody, 'companyUuid'> {
  return {
    originLedgerUuid: form.originLedgerUuid,
    datetime: formatYmd(form.issueDate)!,
    netAmount: form.salesAmount,
    taxAmount: form.taxAmount,
    totalAmount: form.salesAmount + form.taxAmount,
    officialAccountingSubjectId: form.expenseCategory!.id!,
    memo: form.note || undefined,
  };
}

/** 進項發票號碼組裝：一般發票拆為字軌+流水號，其他憑證種類以憑證編號當純號碼 */
function buildPayableInvoice(form: TransactionFormState): Pick<CreatePayableBody, 'alphabeticLetter' | 'invoiceNum'> {
  if (form.voucherType === VOUCHER_TYPES[0]) {
    return { alphabeticLetter: form.invoiceTrack || undefined, invoiceNum: form.invoiceSerial || undefined };
  }
  return { invoiceNum: form.invoiceNumber || undefined };
}

function buildPayableBody(form: TransactionFormState): Omit<CreatePayableBody, 'companyUuid'> {
  const isImport = form.voucherType === IMPORT_VOUCHER_TYPE;
  return {
    ...buildPayableInvoice(form),
    counterpartyName: form.sellerName,
    counterpartyTaxId: form.sellerTaxId || undefined,
    // 有填統編視為廠商(0)，否則視為個人(1)
    counterpartyType: form.sellerTaxId ? 0 : 1,
    // 選自既有廠商清單時帶入 uuid，供帳簿「匯總沖帳」頁依廠商分組；手動輸入未對應廠商時為 undefined
    counterpartyUuid: form.sellerVendorUuid || undefined,
    datetime: formatYmd(form.issueDate)!,
    deductible: form.deductible,
    importTaxNumber: isImport ? form.importTaxNumber || undefined : undefined,
    invoiceDate: formatYmd(form.issueDate)!,
    isReturnGoods: isImport ? false : undefined,
    memo: form.note || undefined,
    netAmount: form.salesAmount,
    officialAccountingSubjectId: form.expenseCategory!.id!,
    others: isImport ? form.others : undefined,
    taxAmount: form.taxAmount,
    taxFreeAmount: form.exemptSalesAmount,
    totalAmount: form.salesAmount + form.exemptSalesAmount + form.taxAmount,
    unreportedReason: form.deductible ? undefined : form.unreportedReason || undefined,
    voucherKind: VOUCHER_KIND_MAP[form.voucherType] ?? 1,
  };
}

/** 銷項發票號碼組裝：字軌（invoiceTrack）+ 流水號（invoiceSerial），與進項一般發票輸入模式一致 */
function buildReceivableInvoice(form: TransactionFormState): Pick<CreateReceivableBody, 'alphabeticLetter' | 'invoiceNum'> {
  return { alphabeticLetter: form.invoiceTrack || undefined, invoiceNum: form.invoiceSerial };
}

function buildReceivableBody(form: TransactionFormState): Omit<CreateReceivableBody, 'companyUuid'> {
  return {
    ...buildReceivableInvoice(form),
    counterpartyName: form.buyerName,
    counterpartyTaxId: form.buyerTaxId || undefined,
    counterpartyType: form.buyerTaxId ? 0 : 1,
    datetime: formatYmd(form.issueDate)!,
    invoiceDate: formatYmd(form.issueDate)!,
    memo: form.note || undefined,
    netAmount: form.salesAmount,
    officialAccountingSubjectId: form.expenseCategory!.id!,
    paymentChannelUuid: form.channel || undefined,
    taxAmount: form.taxAmount,
    taxFreeAmount: form.exemptSalesAmount,
    totalAmount: form.salesAmount + form.exemptSalesAmount + form.taxAmount,
    voucherKind: 1,
  };
}

export default function TransactionFormView({ mode, side, transactionId, returnQuery }: TransactionFormViewProps) {
  const router = useRouter();
  const [form, setForm] = useState<TransactionFormState>(EMPTY_TRANSACTION_FORM);
  // 編輯畫面載入完成後的表單快照，供「修改交易資訊」後按「取消」還原用
  const [savedForm, setSavedForm] = useState<TransactionFormState>(EMPTY_TRANSACTION_FORM);
  // 編輯畫面預設唯讀，需按「修改交易資訊」才開放欄位編輯
  const [editing, setEditing] = useState(false);
  const [voidConfirmOpen, setVoidConfirmOpen] = useState(false);
  const [allowanceCreateOpen, setAllowanceCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const backHref = resolveLedgerBackHref(returnQuery);

  // 編輯畫面掛載時向 GET /ael/ledger/entries/detail 取得真實資料；新增畫面不需要，維持 EMPTY_TRANSACTION_FORM
  const [detailLoading, setDetailLoading] = useState(mode === 'edit');
  const [detailError, setDetailError] = useState('');
  const [entryDetail, setEntryDetail] = useState<EntryDetailEntryDto | null>(null);
  const [settleEvents, setSettleEvents] = useState<EntryDetailSettleEventDto[]>([]);
  // 1 銷項／2 進項，決定沖帳狀態卡的名詞（已收/已付、待收/待付）；invoice 為 null 時以 side 作為 fallback
  const [buyOrSell, setBuyOrSell] = useState<number>(side === 'sales' ? 1 : 2);
  // 恢復／編輯沖帳成功後遞增，觸發下方 useEffect 重新載入交易明細
  const [reloadKey, setReloadKey] = useState(0);
  // 日記帳分錄；與主流程並行載入，失敗不阻擋主流程
  const [dailyLines, setDailyLines] = useState<DailyDetailLineDto[]>([]);

  // 沖帳紀錄操作：恢復確認、編輯金額（僅手動沖帳）共用同一組送出中／錯誤狀態
  const [reverseTarget, setReverseTarget] = useState<EntryDetailSettleEventDto | null>(null);
  // 恢復確認彈窗開啟時，懶載入此沖帳事件關聯的業務原單憑證清單（見 useSettleEventOrigins 說明）
  const { origins: reverseOrigins, loading: reverseOriginsLoading, error: reverseOriginsError } = useSettleEventOrigins(
    reverseTarget?.settleEventUuid ?? null,
  );
  const [editTarget, setEditTarget] = useState<EntryDetailSettleEventDto | null>(null);
  const [reverseSubmitting, setReverseSubmitting] = useState(false);
  const [reverseError, setReverseError] = useState('');

  // 折讓相關：是否為折讓單、（原單）已開立的折讓單清單、（折讓單）原單交易 uuid；
  // isAllowance／allowances／originLedgerUuid 為選填欄位，皆搭配 fallback 讀取（見 api/types.ts 註解）
  const [isAllowance, setIsAllowance] = useState(false);
  const [allowances, setAllowances] = useState<EntryDetailAllowanceDto[]>([]);
  // invoice.ourInvoiceType（憑證種類代號，值域 1~7）：僅此範圍內才顯示「折讓紀錄」區塊
  const [ourInvoiceType, setOurInvoiceType] = useState<number | null>(null);
  const [originLedgerUuid, setOriginLedgerUuid] = useState('');
  const [originEntry, setOriginEntry] = useState<EntryDetailEntryDto | null>(null);
  const [originLoading, setOriginLoading] = useState(false);
  const [originError, setOriginError] = useState('');

  const loadDetail = useCallback(() => {
    if (mode !== 'edit' || !transactionId) return () => {};
    let cancelled = false;
    setDetailLoading(true);
    setDetailError('');
    Promise.all([
      fetchEntryDetail({ ledgerUuid: transactionId }),
      fetchDailyDetail({ ledgerUuid: transactionId }),
    ])
      .then(async ([result, daily]) => {
        if (cancelled) return;
        // 費用類別／收入科目來自 entry.officialAccountingSubjectId，比照帳簿列表反查科目名稱的方式處理
        const expenseCategory = await resolveExpenseCategory(result.entry.officialAccountingSubjectId);
        if (cancelled) return;
        // 是否為折讓：優先看頂層 isAllowance，api.md 200 範例 JSON 未含此欄位時退回 invoice.isAllowance
        const allowanceFlag = result.isAllowance ?? result.invoice?.isAllowance ?? false;
        const nextForm: TransactionFormState = {
          ...mapInvoiceDetailToForm(side, result.invoice),
          expenseCategory,
          // 銷售管道對應 entry.paymentChannelUuid，直接帶入即可對應 channelField 下拉選項的 uuid
          channel: result.entry.paymentChannelUuid ?? '',
          isAllowance: allowanceFlag,
          // 買家名稱：invoice 明細無此欄位（EntryInvoiceDetailDto 僅有 companyName 供賣家使用），改取 entry.counterpartyName
          ...(side === 'sales' ? { buyerName: result.entry.counterpartyName ?? '' } : {}),
        };
        setForm(nextForm);
        setSavedForm(nextForm);
        setEditing(false);
        setEntryDetail(result.entry);
        setSettleEvents(result.settleEvents);
        setBuyOrSell(result.invoice?.buyOrSell ?? (side === 'sales' ? 1 : 2));
        setDailyLines(daily.lines);
        setIsAllowance(allowanceFlag);
        setAllowances(result.allowances ?? []);
        setOurInvoiceType(result.invoice?.ourInvoiceType ?? null);
        // 折讓單才查原單 uuid；非折讓單一律清空，避免殘留上一筆交易的原單卡片
        setOriginLedgerUuid(allowanceFlag ? result.originLedgerUuid ?? '' : '');
      })
      .catch(err => {
        if (cancelled) return;
        setDetailError(getFriendlyErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, side, transactionId]);

  useEffect(() => loadDetail(), [loadDetail, reloadKey]);

  // 折讓單追加查詢一次原單完整資訊，供「原始交易憑證」卡片顯示；失敗僅記錄錯誤，不阻擋主畫面
  useEffect(() => {
    if (!originLedgerUuid) {
      setOriginEntry(null);
      setOriginError('');
      return;
    }
    let cancelled = false;
    setOriginLoading(true);
    setOriginError('');
    fetchEntryDetail({ ledgerUuid: originLedgerUuid })
      .then(result => {
        if (cancelled) return;
        setOriginEntry(result.entry);
      })
      .catch(err => {
        if (cancelled) return;
        setOriginEntry(null);
        setOriginError(getFriendlyErrorMessage(err, '載入原始交易憑證失敗'));
      })
      .finally(() => {
        if (!cancelled) setOriginLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [originLedgerUuid]);

  const reloadDetail = () => setReloadKey(k => k + 1);

  // 沖帳金額編輯（僅手動沖帳）：由 TransactionSettlementHistory 觸發，開啟 SettlementEditDialog
  const handleEditSettlement = (event: EntryDetailSettleEventDto) => setEditTarget(event);

  // 恢復沖帳紀錄：僅多筆沖帳（reconMethod=2）提供此操作，先跳確認彈窗提示會一併恢復同批所有交易；
  // 單筆沖帳改由「編輯金額」填 0 達成同等效果
  const handleReverseSettlement = (event: EntryDetailSettleEventDto) => {
    setReverseError('');
    setReverseTarget(event);
  };

  const handleConfirmReverse = async () => {
    if (!reverseTarget) return;
    setReverseSubmitting(true);
    setReverseError('');
    try {
      await reverseSummarySettle({ settleEventUuid: reverseTarget.settleEventUuid });
      setReverseTarget(null);
      reloadDetail();
    } catch (err) {
      setReverseError(getFriendlyErrorMessage(err));
    } finally {
      setReverseSubmitting(false);
    }
  };

  const handleChange = (patch: Partial<TransactionFormState>) => setForm(f => ({ ...f, ...patch }));
  const handleFileChange = (fileName: string, previewUrl: string) =>
    handleChange({ voucherFileName: fileName, voucherPreviewUrl: previewUrl });

  const handleSideChange = (next: Side) => router.push(appendReturnQuery(`/ledger/new?side=${next}`, returnQuery));

  // 編輯畫面（更新/作廢/刪除）本次未串接後端，維持既有視覺模擬
  const backToLedger = () => router.push(backHref);
  const totalAmount = form.salesAmount + form.exemptSalesAmount + form.taxAmount;

  const handleCreate = async () => {
    const error = validateForm(side, form);
    if (error) {
      setSubmitError(error);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      if (form.isAllowance) {
        if (side === 'purchase') {
          await createPayableAllowance(buildAllowanceBody(form));
        } else {
          await createReceivableAllowance(buildAllowanceBody(form));
        }
      } else if (side === 'purchase') {
        await createPayable(buildPayableBody(form));
      } else {
        await createReceivable(buildReceivableBody(form));
      }
      router.push(backHref);
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumb = mode === 'create' ? `帳簿 / 新增${SIDE_LABEL[side]}交易` : `帳簿 / ${SIDE_LABEL[side]}交易細節`;

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6 flex flex-col gap-4 nav:flex-row nav:items-start nav:justify-between">
          <div>
            <Link href={backHref} className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue">
              <ChevronLeft size={16} />
              返回帳簿
            </Link>
            <p className="text-sm text-neutral-mid">{breadcrumb}</p>
          </div>
          {mode === 'create' && (
            <div className="w-full nav:w-64">
              <SegmentedControl
                options={[
                  { value: 'sales', label: '銷項' },
                  { value: 'purchase', label: '進項' },
                ]}
                value={side}
                onChange={handleSideChange}
                size="md"
              />
            </div>
          )}
        </div>

        {detailLoading ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
        ) : detailError ? (
          <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{detailError}</div>
        ) : (
          <div className="nav:grid nav:grid-cols-[380px_1fr] nav:items-start nav:gap-8">
            <div className="mb-5 flex flex-col gap-4 nav:sticky nav:top-20 nav:mb-0">
              <VoucherUpload mode={mode} fileName={form.voucherFileName} previewUrl={form.voucherPreviewUrl} onFileChange={handleFileChange} />
            </div>

            <div className="flex flex-col gap-5">
              {mode === 'edit' && entryDetail && (
                <TransactionSettlementStatus
                  entry={entryDetail}
                  buyOrSell={buyOrSell}
                  settleEvents={settleEvents}
                  onEdit={handleEditSettlement}
                  onReverse={handleReverseSettlement}
                />
              )}
              <TransactionMetaCard
                side={side}
                mode={mode}
                form={form}
                onChange={handleChange}
                readOnly={mode === 'edit' && !editing}
                editing={editing}
                onStartEdit={() => setEditing(true)}
                onCancelEdit={() => {
                  setForm(savedForm);
                  setEditing(false);
                }}
                onVoidOrDelete={side === 'sales' ? () => setVoidConfirmOpen(true) : backToLedger}
                onUpdate={backToLedger}
                voidLabel={side === 'sales' ? '作廢' : '刪除'}
              />
              {mode === 'edit' && isAllowance && (
                <TransactionOriginCard
                  side={side}
                  originLedgerUuid={originLedgerUuid}
                  returnQuery={returnQuery}
                  loading={originLoading}
                  error={originError}
                  entry={originEntry}
                />
              )}
              {mode === 'edit' && entryDetail && (
                <JournalCard lines={dailyLines} onRetry={reloadDetail} />
              )}
              {/* 折讓單本身不能再被折讓，故僅原單顯示此卡片；常駐顯示（無折讓紀錄時卡片內顯示「尚無折讓紀錄」），
                  讓使用者能在交易詳細頁直接發現並開立折讓單；僅 invoice.ourInvoiceType 落在 1~7 範圍才顯示 */}
              {mode === 'edit' &&
                !isAllowance &&
                entryDetail &&
                ourInvoiceType !== null &&
                ourInvoiceType >= 1 &&
                ourInvoiceType <= 7 && (
                <TransactionAllowanceListCard
                  side={side}
                  returnQuery={returnQuery}
                  entry={entryDetail}
                  allowances={allowances}
                  onCreate={() => setAllowanceCreateOpen(true)}
                />
              )}

              {mode === 'create' && submitError && <p className="text-sm text-semantic-error">{submitError}</p>}

              {mode === 'create' && (
                <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-neutral-blue-gray/20 bg-surface-off-white px-4 py-4 nav:static nav:mx-0 nav:border-0 nav:bg-transparent nav:px-0 nav:py-0">
                  <Button
                    variant="primary"
                    className="w-full nav:w-auto"
                    onClick={handleCreate}
                    disabled={submitting || (form.isAllowance && !form.originLedgerUuid)}
                  >
                    {submitting ? '建立中…' : '建立交易'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {mode === 'edit' && side === 'sales' && (
        <VoidConfirmDialog
          open={voidConfirmOpen}
          onClose={() => setVoidConfirmOpen(false)}
          onConfirm={backToLedger}
          transactionId={form.invoiceNumber}
          amount={totalAmount}
        />
      )}

      {mode === 'edit' && transactionId && entryDetail && (
        <AllowanceCreateDialog
          open={allowanceCreateOpen}
          onClose={() => setAllowanceCreateOpen(false)}
          side={side}
          entry={entryDetail}
          originLedgerUuid={transactionId}
          onCreated={reloadDetail}
        />
      )}

      {mode === 'edit' && transactionId && (
        <>
          <SettlementReverseConfirmModal
            open={reverseTarget !== null}
            event={reverseTarget}
            origins={reverseOrigins}
            originsLoading={reverseOriginsLoading}
            originsError={reverseOriginsError}
            submitting={reverseSubmitting}
            submitError={reverseError}
            onClose={() => setReverseTarget(null)}
            onConfirm={handleConfirmReverse}
          />
          <SettlementEditDialog
            open={editTarget !== null}
            event={editTarget}
            side={side}
            ledgerUuid={transactionId}
            onClose={() => setEditTarget(null)}
            onSaved={reloadDetail}
          />
        </>
      )}
    </div>
  );
}
