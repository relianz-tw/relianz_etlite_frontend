'use client';

import { listChannelRules } from '@/api/channelRules';
import type { ChannelRuleDto } from '@/api/types';
import Badge from '@/components/ui/Badge';
import DatePicker from '@/components/ui/DatePicker';
import MoneyInput from '@/components/ui/MoneyInput';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
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
import Field from './Field';

interface TransactionMetaCardProps {
  side: Side;
  mode: TransactionMode;
  form: TransactionFormState;
  onChange: (patch: Partial<TransactionFormState>) => void;
}

const ALLOWANCE_OPTIONS = [
  { value: 'no', label: '否' },
  { value: 'yes', label: '是' },
] as const;

/** 交易明細 API（invoice 區塊）尚未提供對應資料的欄位，統一標記提醒目前仍是假資料 */
const NOT_WIRED_BADGE = (
  <Badge tone="neutral" variant="muted">
    尚未串接
  </Badge>
);

export default function TransactionMetaCard({ side, mode, form, onChange }: TransactionMetaCardProps) {
  const [channelRules, setChannelRules] = useState<ChannelRuleDto[]>([]);
  const [channelError, setChannelError] = useState('');

  // 銷售管道改為串接真實「銷售管道規則」清單，取代原本的假資料選單；僅銷項需要，只載入一次
  useEffect(() => {
    if (side !== 'sales') return;
    listChannelRules()
      .then(list => setChannelRules(list.filter(c => c.isActive)))
      .catch(err => setChannelError(err instanceof Error ? err.message : '操作失敗'));
  }, [side]);

  const issueDateField = (
    <Field label="開立日期">
      <DatePicker value={form.issueDate} onChange={d => onChange({ issueDate: d })} />
    </Field>
  );

  // 交易付款日/收款日對應 API entryDate：兩側皆選填，開放使用者輸入或留空由系統依設定自動入帳
  const entryDateField = (
    <Field
      key="payDate"
      label={side === 'sales' ? '收款日期' : '付款日期'}
      helper={`系統會依照${side === 'sales' ? '收款' : '付款'}日期自動入帳，如希望後續手動入帳請留空`}
    >
      <DatePicker value={form.payDate} onChange={d => onChange({ payDate: d })} />
    </Field>
  );

  const sellerTaxIdField = (
    <Field label="賣家統一編號">
      <TextInput placeholder="請輸入賣家統一編號" value={form.sellerTaxId} onChange={e => onChange({ sellerTaxId: e.target.value })} />
    </Field>
  );

  const sellerNameField = (
    <Field label="賣家名稱">
      <TextInput placeholder="請輸入賣家名稱" value={form.sellerName} onChange={e => onChange({ sellerName: e.target.value })} />
    </Field>
  );

  const buyerTaxIdField = (
    <Field label="買家統一編號">
      <TextInput placeholder="請輸入買家統一編號" value={form.buyerTaxId} onChange={e => onChange({ buyerTaxId: e.target.value })} />
    </Field>
  );

  const buyerNameField = (
    <Field label="交易對象名稱">
      <TextInput placeholder="請輸入交易對象名稱" value={form.buyerName} onChange={e => onChange({ buyerName: e.target.value })} />
    </Field>
  );

  // channelField/tagField/projectField 為新增與編輯共用欄位；「尚未串接」標記只在編輯（交易明細）畫面顯示，
  // 因為只有編輯頁的資料來自 invoice（目前沒有對應欄位），新增頁這幾個欄位本來就是使用者自行輸入、非未串接狀態
  const editBadge = mode === 'edit' ? NOT_WIRED_BADGE : undefined;

  const channelField = (
    <Field label="銷售管道" badge={editBadge} helper="系統會依照銷售管道設定之付款週期自動入帳，如不選擇，後續會需要自行逐筆手動入帳">
      <Select widthClassName="w-full" value={form.channel} onValueChange={v => onChange({ channel: v })}>
        <option value="">不指定</option>
        {channelRules.map(c => (
          <option key={c.uuid} value={c.uuid}>
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
      />
      {!form.deductible && (
        <div className="mt-3">
          <TextInput
            placeholder="請輸入不可扣抵原因"
            value={form.unreportedReason}
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
        onChange={e => onChange({ importTaxNumber: e.target.value })}
      />
    </Field>,
    <Field key="others" label="其他稅費">
      <MoneyInput value={form.others} onChange={v => onChange({ others: v })} />
    </Field>,
  ];

  const tagField = (
    <Field label="標籤" badge={editBadge}>
      <Select widthClassName="w-full" value={form.tag} onValueChange={v => onChange({ tag: v })}>
        <option value={TAG_PLACEHOLDER}>{TAG_PLACEHOLDER}</option>
      </Select>
    </Field>
  );

  const projectField = (
    <Field label="專案" badge={editBadge}>
      <Select widthClassName="w-full" value={form.project} onValueChange={v => onChange({ project: v })}>
        <option value={PROJECT_PLACEHOLDER}>{PROJECT_PLACEHOLDER}</option>
        {PROJECT_NAMES.filter(Boolean).map(v => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </Select>
    </Field>
  );

  // 依 side/mode 排出成對列（每列各自獨立成一個 2 欄 grid），避免不同列的說明文字行數互相影響高度
  let rows: [ReactNode, ReactNode?][] = [];

  if (mode === 'create' && side === 'sales') {
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
        <Field key="invoiceNumber" label="發票號碼">
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
      [buyerNameField, buyerTaxIdField],
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
        <Field key="invoiceNumber" label="發票號碼" helper="發票範本：電子發票、手開發票、收銀機發票">
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
        </Field>,
      ],
      [issueDateField, entryDateField],
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
          <Select widthClassName="w-full" value={form.declarePeriod} onValueChange={v => onChange({ declarePeriod: v })}>
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
      <h2 className="mb-5 text-base font-semibold text-neutral-dark">交易資訊</h2>
      <div className="flex flex-col gap-4">
        {mode === 'edit' && (
          <Field label="發票號碼">
            <Select
              widthClassName="w-full"
              value={form.invoiceNumber}
              disabled={side === 'sales'}
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

        <Field label="是否為折讓？" badge={editBadge} helper="如要一部或全部退款/退貨請選是">
          <SegmentedControl
            options={[...ALLOWANCE_OPTIONS]}
            value={form.isAllowance ? 'yes' : 'no'}
            onChange={v => onChange({ isAllowance: v === 'yes' })}
          />
        </Field>

        {rows.map((row, i) => (
          <div key={i} className="flex flex-col gap-4">
            {row[0]}
            {row[1]}
          </div>
        ))}
      </div>
    </div>
  );
}
