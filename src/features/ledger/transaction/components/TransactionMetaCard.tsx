'use client';

import { listBankAccounts } from '@/api/bankAccounts';
import { createChannelRule, listChannelRules } from '@/api/channelRules';
import { createVendor, listVendors } from '@/api/vendors';
import type { BankAccountDto, ChannelRuleDto, VendorDto } from '@/api/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import MoneyInput from '@/components/ui/MoneyInput';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import SubjectSelect from '@/components/ui/SubjectSelect';
import TextInput from '@/components/ui/TextInput';
import Textarea from '@/components/ui/Textarea';
import ChannelRuleDialog from '@/features/settings/components/ChannelRuleDialog';
import InitOtherChannelDialog from '@/features/settings/components/InitOtherChannelDialog';
import VendorDialog from '@/features/settings/components/VendorDialog';
import type { BankAccountRecord, ChannelRuleRecord, VendorRecord } from '@/features/settings/data';
import { SETTLEMENT_STYLE } from '@/features/settings/data';
import { getFriendlyErrorMessage } from '@/lib/errors';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { PROJECT_NAMES } from '../../data';
import type { Side } from '../../types';
import {
  DECLARE_PERIOD_OPTIONS,
  INVOICE_PERIOD_OPTIONS,
  PROJECT_PLACEHOLDER,
  PURCHASE_INVOICE_NUMBER_OPTIONS,
  SALES_INVOICE_BOOK_OPTIONS,
  TAG_PLACEHOLDER,
  VOUCHER_TYPES,
} from '../data';
import type { TransactionFormState, TransactionMode } from '../types';
import AllowanceOriginField from './AllowanceOriginField';
import Field from './Field';

interface TransactionMetaCardProps {
  side: Side;
  mode: TransactionMode;
  form: TransactionFormState;
  onChange: (patch: Partial<TransactionFormState>) => void;
  /** 編輯畫面預設唯讀，需按「修改交易資訊」才開放編輯；新增畫面不適用 */
  readOnly?: boolean;
  /** 以下皆僅編輯畫面使用：是否已進入可編輯狀態，及卡片標題列／底部操作按鈕的對應動作 */
  editing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onVoidOrDelete?: () => void;
  onUpdate?: () => void;
  /** 底部危險按鈕文字，銷項為「作廢」、進項為「刪除」 */
  voidLabel?: string;
}

const ALLOWANCE_OPTIONS = [
  { value: 'no', label: '否' },
  { value: 'yes', label: '是' },
] as const;

// 新增進項「發票號碼」欄位依憑證種類顯示不同 label／helper，格式提示統一放 helper（收據不顯示此欄位，故無對應項目）
const INVOICE_NUMBER_LABELS: Record<string, string> = {
  [VOUCHER_TYPES[1]]: '高鐵 / 台鐵 / 國內班機票號',
  [VOUCHER_TYPES[2]]: '變動載具號碼',
  [VOUCHER_TYPES[3]]: '海關代徵營業稅繳納證號碼',
};

const INVOICE_NUMBER_HELPERS: Record<string, string> = {
  [VOUCHER_TYPES[0]]: '發票範本：電子發票、手開發票、收銀機發票',
  [VOUCHER_TYPES[1]]: '末10碼',
  [VOUCHER_TYPES[2]]: '中間粗體號碼共10碼',
  [VOUCHER_TYPES[3]]: '前三碼英文',
};

/** 交易明細 API（invoice 區塊）尚未提供對應資料的欄位，統一標記提醒目前仍是假資料 */
const NOT_WIRED_BADGE = (
  <Badge tone="neutral" variant="muted">
    尚未串接
  </Badge>
);

/** BankAccountDto → BankAccountRecord，比照 PaymentSettingsTab 既有的轉換方式，供 ChannelRuleDialog 使用 */
function toBankAccountRecord(dto: BankAccountDto): BankAccountRecord {
  return {
    id: dto.bankAccountUuid,
    nickname: dto.accountName ?? '',
    bankCode: dto.bankCode ?? '',
    bankName: dto.bankName ?? '',
    bankBranch: dto.branchName ?? '',
    accountNumber: dto.accountNo ?? '',
    balance: dto.currentBalance,
    lastBalanceUpdateDate: dto.lastBalanceUpdateDate ?? '',
    remark: dto.remark ?? '',
    isActive: dto.isActive,
    isDefaultReceivingAccount: dto.isDefaultReceivingAccount,
    isDefaultPaymentAccount: dto.isDefaultPaymentAccount,
  };
}

export default function TransactionMetaCard({
  side,
  mode,
  form,
  onChange,
  readOnly = false,
  editing = false,
  onStartEdit,
  onCancelEdit,
  onVoidOrDelete,
  onUpdate,
  voidLabel,
}: TransactionMetaCardProps) {
  const [channelRules, setChannelRules] = useState<ChannelRuleDto[]>([]);
  const [channelError, setChannelError] = useState('');
  const [newChannelOpen, setNewChannelOpen] = useState(false);
  const [initOtherOpen, setInitOtherOpen] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>([]);
  const [bankAccountsLoaded, setBankAccountsLoaded] = useState(false);
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [vendorError, setVendorError] = useState('');
  const [newVendorOpen, setNewVendorOpen] = useState(false);

  // 銷售管道改為串接真實「銷售管道規則」清單，取代原本的假資料選單；僅銷項需要，只載入一次
  // 「其他」管道（各公司 uuid 不同，但固定名稱為「其他」）固定排在清單最末，讓使用者優先看到具體管道
  useEffect(() => {
    if (side !== 'sales') return;
    listChannelRules()
      .then(list => {
        const active = list.filter(c => c.isActive);
        const sorted = [...active.filter(c => c.channelName !== '其他'), ...active.filter(c => c.channelName === '其他')];
        setChannelRules(sorted);
      })
      .catch(err => setChannelError(getFriendlyErrorMessage(err)));
  }, [side]);

  // 廠商改為串接真實廠商名單（與設定頁「廠商管理」同一份 API），取代純文字輸入；僅進項新增需要，只載入一次
  useEffect(() => {
    if (side !== 'purchase') return;
    listVendors()
      .then(list => setVendors(list.filter(v => v.isActive)))
      .catch(err => setVendorError(getFriendlyErrorMessage(err)));
  }, [side]);

  // 開啟「新增管道」或「開通其他管道」對話框且尚未載入過收款帳戶時才抓取，避免每次開關都重打 API
  useEffect(() => {
    if ((!newChannelOpen && !initOtherOpen) || bankAccountsLoaded) return;
    listBankAccounts()
      .then(list => {
        setBankAccounts(list.filter(a => a.isActive).map(toBankAccountRecord));
        setBankAccountsLoaded(true);
      })
      .catch(err => setChannelError(getFriendlyErrorMessage(err)));
  }, [newChannelOpen, initOtherOpen, bankAccountsLoaded]);

  // 新增管道成功後直接加入清單並選取，沿用設定頁 ChannelRuleDialog／createChannelRule 的表單與驗證邏輯
  const handleCreateChannel = async (rule: Omit<ChannelRuleRecord, 'id'>) => {
    const created = await createChannelRule(rule);
    setChannelRules(list => [...list, created]);
    onChange({ channel: created.channelUuid });
  };

  // 各公司「其他」管道的 uuid 不同，但名稱固定為「其他」；尚未開通前強制先完成此步驟才能新增其他管道
  const hasOtherChannel = channelRules.some(c => c.channelName === '其他');
  const handleInitOtherChannel = async (receivingAccountUuid: string) => {
    const created = await createChannelRule({
      channelName: '其他',
      settlementStyle: SETTLEMENT_STYLE.WEEKLY,
      settlementAmount: 1,
      receivingAccountUuid,
      remark: '',
      isActive: true,
      initDefaultOther: true,
    });
    setChannelRules(list => [...list, created]);
    onChange({ channel: created.channelUuid });
  };

  // 新增廠商成功後直接加入清單並選取，沿用設定頁 VendorDialog／createVendor 的表單與驗證邏輯
  const handleCreateVendor = async (vendor: Omit<VendorRecord, 'id'>) => {
    const created = await createVendor({
      taxId: vendor.taxId,
      name: vendor.name,
      registeredAddress: vendor.address,
      bankAccountName: vendor.bankAccountName,
      bankCode: vendor.bankCode,
      bankName: vendor.bankName,
      branchName: vendor.bankBranch,
      accountNo: vendor.bankAccountNumber,
      remark: vendor.remark,
    });
    setVendors(list => [...list, created]);
    onChange({ sellerVendorUuid: created.uuid, sellerName: created.name, sellerTaxId: created.taxId });
  };

  // 送出前驗證（validateForm）僅在新增（create）模式生效，故必填星號只在新增模式顯示
  const isCreate = mode === 'create';

  const issueDateField = (
    <Field label="開立日期" required={isCreate}>
      <DatePicker value={form.issueDate} onChange={d => onChange({ issueDate: d })} disabled={readOnly} />
    </Field>
  );

  const sellerTaxIdField = (
    <Field label="賣家統一編號">
      {/* 手動編輯統編視為與下方「廠商」選擇的既有廠商脫鉤，清空 sellerVendorUuid 避免誤送舊廠商 uuid */}
      {/* 已選擇既有廠商時統編由廠商資料帶入，鎖定不可編輯，避免與廠商資料不一致 */}
      <TextInput
        placeholder="請輸入賣家統一編號"
        value={form.sellerTaxId}
        maxLength={8}
        disabled={readOnly || !!form.sellerVendorUuid}
        onChange={e => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 8);
          onChange({ sellerTaxId: v, sellerVendorUuid: '' });
        }}
      />
    </Field>
  );

  const sellerNameField = (
    <Field label="賣家名稱" required={isCreate}>
      {/* 已選擇既有廠商時名稱由廠商資料帶入，鎖定不可編輯，避免與廠商資料不一致 */}
      <TextInput
        placeholder="請輸入賣家名稱"
        value={form.sellerName}
        disabled={readOnly || !!form.sellerVendorUuid}
        onChange={e => onChange({ sellerName: e.target.value, sellerVendorUuid: '' })}
      />
    </Field>
  );

  // 廠商選單串接真實廠商名單（與設定頁「廠商管理」同一份 API），選擇後自動帶入統編／名稱與 uuid，
  // 供建立進項交易時設定 counterpartyUuid，讓帳簿「匯總沖帳」頁能依廠商正確分組；
  // 找不到對應廠商時仍可維持「不指定」，直接於下方統編/名稱欄位手動輸入（視為個人賣家，不關聯廠商）
  const sellerVendorField = (
    <Field
      label="廠商"
      helper="選擇既有廠商可自動帶入統編與名稱（帶入後下方欄位鎖定不可編輯）；找不到對應廠商時可選「不指定」於下方欄位直接手動輸入，或點擊「新增」建立新廠商"
    >
      <Select
        widthClassName="w-full"
        value={form.sellerVendorUuid}
        disabled={readOnly}
        onValueChange={v => {
          const vendor = vendors.find(x => x.uuid === v);
          onChange({ sellerVendorUuid: v, ...(vendor ? { sellerName: vendor.name, sellerTaxId: vendor.taxId } : {}) });
        }}
        onAddNew={() => setNewVendorOpen(true)}
      >
        <option value="">不指定（手動輸入）</option>
        {vendors.map(v => (
          <option key={v.uuid} value={v.uuid}>
            {v.name}
          </option>
        ))}
      </Select>
      {vendorError && <p className="mt-1 text-xs text-semantic-error">{vendorError}</p>}
    </Field>
  );

  const buyerTaxIdField = (
    <Field label="買家統一編號">
      <TextInput
        placeholder="請輸入買家統一編號"
        value={form.buyerTaxId}
        maxLength={8}
        disabled={readOnly}
        onChange={e => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 8);
          onChange({ buyerTaxId: v });
        }}
      />
    </Field>
  );

  const buyerNameField = (
    <Field label="買家名稱" required={isCreate}>
      <TextInput
        placeholder="請輸入交易對象名稱"
        value={form.buyerName}
        disabled={readOnly}
        onChange={e => onChange({ buyerName: e.target.value })}
      />
    </Field>
  );

  // tagField/projectField 為新增與編輯共用欄位；兩者皆為純前端本地 state，未串接任何後端欄位
  // （新增送出時不會一併送出，交易明細亦無對應資料可回填），新增與編輯畫面皆停用並標示提示

  const channelField = (
    <Field label="銷售管道" required={isCreate} helper="系統會依照銷售管道設定之付款週期自動入帳；若無對應管道，請選擇「其他」或點擊「新增」建立新管道">
      <Select
        widthClassName="w-full"
        value={form.channel}
        disabled={readOnly}
        onValueChange={v => onChange({ channel: v })}
        onAddNew={() => (hasOtherChannel ? setNewChannelOpen(true) : setInitOtherOpen(true))}
      >
        <option value="" disabled>請選擇銷售管道</option>
        {channelRules.map(c => (
          <option key={c.channelUuid} value={c.channelUuid}>
            {c.channelName}
          </option>
        ))}
      </Select>
      {channelError && <p className="mt-1 text-xs text-semantic-error">{channelError}</p>}
    </Field>
  );

  // 可否扣抵；選擇不可扣抵時才顯示「不可扣抵原因」輸入框，對應 API deductible/unreportedReason
  const deductibleField = (
    <Field label="可否扣抵">
      <SegmentedControl
        options={[
          { value: 'yes', label: '可扣抵' },
          { value: 'no', label: '不可扣抵' },
        ]}
        value={form.deductible ? 'yes' : 'no'}
        onChange={v => onChange({ deductible: v === 'yes' })}
        disabled={readOnly}
      />
      {!form.deductible && (
        <div className="mt-3">
          <TextInput
            placeholder="請輸入不可扣抵原因"
            value={form.unreportedReason}
            disabled={readOnly}
            onChange={e => onChange({ unreportedReason: e.target.value })}
          />
        </div>
      )}
    </Field>
  );

  // 進口專用欄位，僅憑證種類為「進口稅單」時顯示，對應 API importTaxNumber/others
  const importFields: [ReactNode, ReactNode] = [
    <Field key="importTaxNumber" label="海關證號" helper="海關代徵營業稅繳納證號碼">
      <TextInput
        placeholder="請輸入海關代徵營業稅繳納證號碼"
        value={form.importTaxNumber}
        disabled={readOnly}
        onChange={e => onChange({ importTaxNumber: e.target.value })}
      />
    </Field>,
    <Field key="others" label="其他稅費">
      <MoneyInput value={form.others} onChange={v => onChange({ others: v })} disabled={readOnly} />
    </Field>,
  ];

  const tagField = (
    <Field label="標籤" badge={NOT_WIRED_BADGE}>
      <Select widthClassName="w-full" value={form.tag} onValueChange={v => onChange({ tag: v })} disabled>
        <option value={TAG_PLACEHOLDER}>{TAG_PLACEHOLDER}</option>
      </Select>
    </Field>
  );

  const projectField = (
    <Field label="專案" badge={NOT_WIRED_BADGE}>
      <Select widthClassName="w-full" value={form.project} onValueChange={v => onChange({ project: v })} disabled>
        <option value={PROJECT_PLACEHOLDER}>{PROJECT_PLACEHOLDER}</option>
        {PROJECT_NAMES.filter(Boolean).map(v => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </Select>
    </Field>
  );

  const totalAmount = form.salesAmount + form.exemptSalesAmount + form.taxAmount;

  // 新增折讓單：欄位大幅收斂，僅保留 API 需要的憑證號碼（查原單）／開立日期／科目／金額／備註
  const isAllowanceCreate = isCreate && form.isAllowance;

  const allowanceOriginField = (
    <AllowanceOriginField
      side={side}
      invoiceTrack={form.invoiceTrack}
      invoiceSerial={form.invoiceSerial}
      onInvoiceChange={patch => onChange(patch)}
      onResolve={(ledgerUuid, origin) =>
        onChange({
          originLedgerUuid: ledgerUuid,
          ...(origin ? { expenseCategory: { id: origin.officialAccountingSubjectId, subjectCode: '', name: origin.subjectName } } : {}),
        })
      }
      // 查無原始憑證時使用者可直接建立：切回「是否為折讓＝否」，比照上方 SegmentedControl 選「否」的 patch，
      // 但刻意不清空 invoiceTrack／invoiceSerial，讓已輸入的發票號碼沿用到新增發票流程
      onCreateOriginal={() => onChange({ isAllowance: false, originLedgerUuid: '', exemptSalesAmount: 0 })}
    />
  );

  // 依 side/mode 排出成對列（每列各自獨立成一個 2 欄 grid），避免不同列的說明文字行數互相影響高度
  let rows: [ReactNode, ReactNode?][] = [];

  if (isAllowanceCreate) {
    rows = [[allowanceOriginField], [issueDateField]];
  } else if (mode === 'create' && side === 'sales') {
    rows = [
      [
        <Field key="invoicePeriod" label="發票期間">
          <Select widthClassName="w-full" value={form.invoicePeriod} onValueChange={v => onChange({ invoicePeriod: v })}>
            {INVOICE_PERIOD_OPTIONS.map(v => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>
        </Field>,
        <Field key="invoiceNumber" label="發票號碼" required={isCreate}>
          <div className="flex gap-2">
            <TextInput
              widthClassName="w-16"
              placeholder="字軌"
              maxLength={2}
              value={form.invoiceTrack}
              onChange={e => onChange({ invoiceTrack: e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase() })}
            />
            <TextInput
              widthClassName="flex-1"
              placeholder="流水號"
              maxLength={8}
              value={form.invoiceSerial}
              onChange={e => onChange({ invoiceSerial: e.target.value })}
            />
          </div>
        </Field>,
      ],
      [buyerTaxIdField, buyerNameField],
      // 收款日期欄位暫時隱藏（需求方要求），僅保留開立日期
      [issueDateField],
      [channelField, tagField],
      [projectField],
    ];
  } else if (mode === 'create' && side === 'purchase') {
    rows = [
      [
        <Field key="voucherType" label="憑證種類">
          <Select widthClassName="w-full" value={form.voucherType} onValueChange={v => onChange({ voucherType: v })}>
            {VOUCHER_TYPES.map(v => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>
        </Field>,
        form.voucherType === VOUCHER_TYPES[4] ? undefined : (
          <Field
            key="invoiceNumber"
            label={INVOICE_NUMBER_LABELS[form.voucherType] ?? '發票號碼'}
            required={isCreate && form.voucherType !== VOUCHER_TYPES[3]}
            helper={INVOICE_NUMBER_HELPERS[form.voucherType]}
          >
            {form.voucherType === VOUCHER_TYPES[0] ? (
              <div className="flex gap-2">
                <TextInput
                  widthClassName="w-16"
                  placeholder="字軌"
                  maxLength={2}
                  value={form.invoiceTrack}
                  onChange={e => onChange({ invoiceTrack: e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase() })}
                />
                <TextInput
                  widthClassName="flex-1"
                  placeholder="流水號"
                  maxLength={8}
                  value={form.invoiceSerial}
                  onChange={e => onChange({ invoiceSerial: e.target.value })}
                />
              </div>
            ) : (
              <TextInput placeholder="憑證編號" value={form.invoiceNumber} onChange={e => onChange({ invoiceNumber: e.target.value })} />
            )}
          </Field>
        ),
      ],
      [issueDateField],
      [sellerVendorField],
      [sellerTaxIdField, sellerNameField],
      [tagField, projectField],
      [deductibleField],
    ];
    // 進口稅單需另外填寫海關證號與其他稅費，其他憑證種類不顯示
    if (form.voucherType === VOUCHER_TYPES[3]) {
      rows.push(importFields);
    }
  } else if (mode === 'edit' && side === 'sales') {
    rows = [
      [issueDateField, channelField],
      [tagField, projectField],
    ];
  } else {
    // edit + purchase
    rows = [
      [
        <Field key="declarePeriod" label="申報期間">
          <Select widthClassName="w-full" value={form.declarePeriod} disabled={readOnly} onValueChange={v => onChange({ declarePeriod: v })}>
            {/* 交易明細 API 帶出的真實申報期間不一定在假選單內，確保它一定被列為可顯示/選取的選項 */}
            {Array.from(new Set([form.declarePeriod, ...DECLARE_PERIOD_OPTIONS])).map(v => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>
        </Field>,
        issueDateField,
      ],
      [sellerTaxIdField, sellerNameField],
      [tagField, projectField],
    ];
  }

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <ChannelRuleDialog open={newChannelOpen} onClose={() => setNewChannelOpen(false)} onSubmit={handleCreateChannel} accounts={bankAccounts} />
      <InitOtherChannelDialog
        open={initOtherOpen}
        onClose={() => setInitOtherOpen(false)}
        onSubmit={handleInitOtherChannel}
        accounts={bankAccounts}
      />
      <VendorDialog open={newVendorOpen} onClose={() => setNewVendorOpen(false)} onSubmit={handleCreateVendor} />
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-dark">交易資訊</h2>
        {mode === 'edit' && !editing && (
          <Button variant="primary" size="sm" onClick={onStartEdit}>
            修改交易資訊
          </Button>
        )}
        {mode === 'edit' && editing && (
          <Button variant="outline" size="sm" onClick={onCancelEdit}>
            取消
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-4">
        {mode === 'edit' && (
          <Field label="發票號碼" badge={form.isAllowance ? <Badge tone="info">折讓退款</Badge> : undefined}>
            <Select
              widthClassName="w-full"
              value={form.invoiceNumber}
              disabled={side === 'sales' || readOnly}
              onValueChange={v => onChange({ invoiceNumber: v })}
            >
              {/* 進入編輯畫面的交易編碼本身不一定在假資料選單內，確保它一定被列為可顯示/選取的選項 */}
              {Array.from(new Set([form.invoiceNumber, ...(side === 'sales' ? SALES_INVOICE_BOOK_OPTIONS : PURCHASE_INVOICE_NUMBER_OPTIONS)])).map(
                v => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ),
              )}
            </Select>
          </Field>
        )}

        {/* 折讓與否僅新增時可選擇；編輯畫面改於上方發票號碼旁以唯讀標記呈現，不得再變更 */}
        {mode === 'create' && (
          <Field label="是否為折讓？" helper="如要一部或全部退款/退貨請選是">
            <SegmentedControl
              options={[...ALLOWANCE_OPTIONS]}
              value={form.isAllowance ? 'yes' : 'no'}
              // 切換折讓與否時清空原單查詢結果，避免切換前殘留的 originLedgerUuid 誤送出；
              // 切為「是」同時歸零免稅銷售額（該欄位切換後隱藏，避免殘留值計入唯讀總金額）
              onChange={v => onChange({ isAllowance: v === 'yes', originLedgerUuid: '', exemptSalesAmount: 0 })}
            />
          </Field>
        )}

        {rows.map((row, i) => (
          <div key={i} className="flex flex-col gap-4">
            {row[0]}
            {row[1]}
          </div>
        ))}

        <div className="flex flex-col gap-4 border-t border-neutral-blue-gray/20 pt-4">
          <Field label={side === 'purchase' ? '費用類別' : '收入科目'} required={mode === 'create'}>
            <SubjectSelect value={form.expenseCategory} onChange={s => onChange({ expenseCategory: s })} disabled={readOnly} />
          </Field>

          <Field label="銷售額">
            <MoneyInput value={form.salesAmount} onChange={v => onChange({ salesAmount: v })} disabled={readOnly} />
          </Field>

          {!isAllowanceCreate && (
            <Field label="免稅銷售額">
              <MoneyInput value={form.exemptSalesAmount} onChange={v => onChange({ exemptSalesAmount: v })} disabled={readOnly} />
            </Field>
          )}

          <Field label="稅額">
            <MoneyInput value={form.taxAmount} onChange={v => onChange({ taxAmount: v })} disabled={readOnly} />
          </Field>

          <Field label="總金額">
            <MoneyInput value={totalAmount} disabled readOnly />
          </Field>

          <Field label="備註">
            <Textarea value={form.note} onChange={e => onChange({ note: e.target.value })} placeholder="備註（選填）" disabled={readOnly} />
          </Field>
        </div>

        {mode === 'edit' && editing && (
          <div className="flex justify-end gap-3 border-t border-neutral-blue-gray/20 pt-4">
            <Button variant="danger" onClick={onVoidOrDelete}>
              {voidLabel}
            </Button>
            <Button variant="primary" onClick={onUpdate}>
              更新
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
