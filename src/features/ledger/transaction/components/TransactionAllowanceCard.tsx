'use client';

import AllowanceInvoiceDetail from '../../components/AllowanceInvoiceDetail';

/** 銷項編輯頁的折讓區塊：內嵌「發票明細」逐商品折讓退回單，視覺模擬不接後端 */
export default function TransactionAllowanceCard() {
  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <AllowanceInvoiceDetail />
    </div>
  );
}
