import Button from '@/components/ui/Button';
import { CircleCheck, CreditCard } from 'lucide-react';
import {
  PLAN_CARD_EXPIRY,
  PLAN_CARD_LAST4,
  PLAN_NEXT_CHARGE_DATE,
  PLAN_PRICE,
  PLAN_QUANTITY_LABEL,
  PLAN_SERVICE_ITEMS,
} from '../data';

export default function PlanDetailTab() {
  return (
    <div className="grid grid-cols-1 gap-5 nav:grid-cols-2">
      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-dark">購買服務內容</h2>
        <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">憑證數量</label>
        <div className="mb-4 flex h-10 items-center rounded-lg border-[1.5px] border-neutral-blue-gray/50 bg-surface-cream px-3 text-sm text-neutral-mid">
          {PLAN_QUANTITY_LABEL}
        </div>
        <div className="flex flex-col gap-2.5">
          {PLAN_SERVICE_ITEMS.map(item => (
            <div key={item.id} className="flex items-center gap-2 text-sm text-neutral-dark">
              <CircleCheck size={18} className="shrink-0 text-brand-blue" />
              {item.label}
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-neutral-blue-gray/20 pt-4">
          <p className="text-lg font-semibold text-neutral-dark">
            ${PLAN_PRICE.toLocaleString('en-US')} / 月
          </p>
          <p className="mt-1 text-xs text-neutral-mid">下次扣款日期：{PLAN_NEXT_CHARGE_DATE}</p>
        </div>
      </div>

      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-dark">付款方式</h2>
        <div className="flex items-center gap-4 rounded-md border border-neutral-blue-gray/30 p-4">
          <span className="grid h-9 w-14 shrink-0 place-items-center rounded-sm bg-brand-blue/10 text-xs font-bold text-brand-blue">
            VISA
          </span>
          <div className="text-sm text-neutral-dark">
            <p>**** **** **** {PLAN_CARD_LAST4}</p>
            <p className="mt-1 text-xs text-neutral-mid">到期日期 {PLAN_CARD_EXPIRY}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="outline" icon={CreditCard}>
            變更付款信用卡
          </Button>
        </div>
      </div>
    </div>
  );
}
