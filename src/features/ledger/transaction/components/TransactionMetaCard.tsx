'use client';

import DatePicker from '@/components/ui/DatePicker';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import type { ReactNode } from 'react';
import { PROJECT_NAMES, SALES_CHANNELS } from '../../data';
import type { Side } from '../../types';
import {
  DECLARE_PERIOD_OPTIONS,
  INVOICE_PERIOD_OPTIONS,
  PROJECT_PLACEHOLDER,
  PURCHASE_INVOICE_NUMBER_OPTIONS,
  SALES_INVOICE_BOOK_OPTIONS,
  SELLER_OPTIONS,
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

export default function TransactionMetaCard({ side, mode, form, onChange }: TransactionMetaCardProps) {
  const handleSellerSelect = (name: string) => {
    const seller = SELLER_OPTIONS.find(s => s.name === name);
    onChange({ sellerName: name, sellerTaxId: seller?.taxId ?? form.sellerTaxId });
  };

  const issueDateField = (
    <Field label="開立日期">
      <DatePicker value={form.issueDate} onChange={d => onChange({ issueDate: d })} />
    </Field>
  );

  const sellerTaxIdField = (
    <Field label="賣家統一編號">
      <TextInput placeholder="請輸入賣家統一編號" value={form.sellerTaxId} onChange={e => onChange({ sellerTaxId: e.target.value })} />
    </Field>
  );

  const sellerNameField = (
    <Field label="賣家名稱">
      <Select widthClassName="w-full" value={form.sellerName} onValueChange={handleSellerSelect}>
        <option value="">請選擇賣家</option>
        {SELLER_OPTIONS.map(s => (
          <option key={s.name} value={s.name}>
            {s.name}
          </option>
        ))}
      </Select>
    </Field>
  );

  const channelField = (
    <Field label="銷售管道" helper="系統會依照銷售管道設定之付款週期自動入帳，如不選擇，後續會需要自行逐筆手動入帳">
      <Select widthClassName="w-full" value={form.channel} onValueChange={v => onChange({ channel: v })}>
        {SALES_CHANNELS.map(v => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </Select>
    </Field>
  );

  const tagField = (
    <Field label="標籤">
      <Select widthClassName="w-full" value={form.tag} onValueChange={v => onChange({ tag: v })}>
        <option value={TAG_PLACEHOLDER}>{TAG_PLACEHOLDER}</option>
      </Select>
    </Field>
  );

  const projectField = (
    <Field label="專案">
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
        <Field
          key="invoiceNumber"
          label="發票號碼"
          helper="發票號碼為系統自動帶入，請直接選擇發票簿；如需作廢發票請選退下一順號，系統會自動選擇下一順號，發票日期不得停在上一張發票之前"
        >
          <Select widthClassName="w-full" value={form.invoiceNumber} onValueChange={v => onChange({ invoiceNumber: v })}>
            {SALES_INVOICE_BOOK_OPTIONS.map(v => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>
        </Field>,
      ],
      [
        issueDateField,
        <Field key="buyerTaxId" label="買家統一編號">
          <TextInput placeholder="請輸入買家統一編號" value={form.buyerTaxId} onChange={e => onChange({ buyerTaxId: e.target.value })} />
        </Field>,
      ],
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
          <div className="grid grid-cols-2 gap-2">
            <TextInput
              placeholder="字軌"
              maxLength={2}
              value={form.invoiceTrack}
              onChange={e => onChange({ invoiceTrack: e.target.value })}
            />
            <TextInput
              placeholder="流水號"
              maxLength={8}
              value={form.invoiceSerial}
              onChange={e => onChange({ invoiceSerial: e.target.value })}
            />
          </div>
        </Field>,
      ],
      [
        issueDateField,
        <Field key="payDate" label="付款日期" helper="系統會依照付款日期自動入帳，如希望後續手動入帳請留空">
          <DatePicker value={form.payDate} onChange={d => onChange({ payDate: d })} />
        </Field>,
      ],
      [sellerTaxIdField, sellerNameField],
      [tagField, projectField],
    ];
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
            {DECLARE_PERIOD_OPTIONS.map(v => (
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

        <Field label="是否為折讓？" helper="如要一部或全部退款/退貨請選是">
          <SegmentedControl
            options={[...ALLOWANCE_OPTIONS]}
            value={form.isAllowance ? 'yes' : 'no'}
            onChange={v => onChange({ isAllowance: v === 'yes' })}
          />
        </Field>

        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-1 gap-x-8 gap-y-4 nav:grid-cols-2">
            {row[0]}
            {row[1]}
          </div>
        ))}
      </div>
    </div>
  );
}
