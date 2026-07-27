'use client';

import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import MoneyInput from '@/components/ui/MoneyInput';
import TextInput from '@/components/ui/TextInput';
import { fmtCurrency } from '@/lib/utils';
import { useState } from 'react';
import { ALLOWANCE_LINE_ITEMS } from '../data';
import type { AllowanceLineItem } from '../types';

interface AllowanceInvoiceDetailProps {
  lineItems?: AllowanceLineItem[];
}

interface LineDraft {
  selected: boolean;
  quantity: number;
  amount: number;
}

function initDrafts(items: AllowanceLineItem[]): Record<string, LineDraft> {
  return Object.fromEntries(items.map(item => [item.id, { selected: true, quantity: 1, amount: 0 }]));
}

/** 依含稅折讓金額換算稅額（稅率 5%），僅供畫面唯讀顯示 */
function calcTax(amountWithTax: number): number {
  return Math.round((amountWithTax * 5) / 105);
}

/** 銷貨折讓退回單的「發票明細」區塊：勾選商品逐項填寫折讓數量／金額，視覺模擬不接後端。
 *  帳簿列表折讓彈窗與銷項交易編輯頁的折讓卡皆共用此元件。 */
export default function AllowanceInvoiceDetail({ lineItems = ALLOWANCE_LINE_ITEMS }: AllowanceInvoiceDetailProps) {
  const [drafts, setDrafts] = useState<Record<string, LineDraft>>(() => initDrafts(lineItems));
  const [recordCount, setRecordCount] = useState(0);

  const updateDraft = (id: string, patch: Partial<LineDraft>) => setDrafts(d => ({ ...d, [id]: { ...d[id], ...patch } }));

  const handleGenerate = () => setRecordCount(c => c + 1);

  return (
    <div>
      <h2 className="mb-2 text-base font-semibold text-neutral-dark">發票明細</h2>
      <p className="mb-4 text-sm leading-relaxed text-neutral-mid">
        為避免產生交易糾紛，若交易對象為公司行號，折讓後所產出之證明聯請提供給對方蓋發票章，若為個人則請對方簽收。
      </p>

      <div className="flex flex-col gap-4 rounded-md bg-surface-cream p-4">
        {lineItems.map((item, i) => {
          const draft = drafts[item.id];
          return (
            <div key={item.id} className={i > 0 ? 'border-t border-neutral-blue-gray/20 pt-4' : ''}>
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  <Checkbox
                    checked={draft.selected}
                    onChange={() => updateDraft(item.id, { selected: !draft.selected })}
                    aria-label={`選取 ${item.productName}`}
                  />
                </div>
                <div className="grid flex-1 grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-neutral-mid">商品名稱</p>
                    <p className="mt-1 font-semibold text-neutral-dark">{item.productName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-mid">可折讓餘額(未稅)</p>
                    <p className="mt-1 font-semibold text-neutral-dark">{fmtCurrency(item.allowableNet)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-mid">可折讓稅額</p>
                    <p className="mt-1 font-semibold text-neutral-dark">{fmtCurrency(item.allowableTax)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">折讓數量</label>
                  <TextInput
                    type="number"
                    min={0}
                    disabled={!draft.selected}
                    value={draft.quantity}
                    onChange={e => updateDraft(item.id, { quantity: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">折讓金額(含稅)</label>
                  <MoneyInput disabled={!draft.selected} value={draft.amount} onChange={v => updateDraft(item.id, { amount: v })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">折讓稅額</label>
                  <MoneyInput disabled readOnly value={calcTax(draft.amount)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="primary" onClick={handleGenerate}>
          產生銷貨折讓退回單
        </Button>
      </div>

      <div className="mt-5 border-t border-neutral-blue-gray/20 pt-4">
        <p className="text-sm font-semibold text-neutral-dark">銷貨折讓/退回紀錄：{recordCount} 張</p>
      </div>
    </div>
  );
}
