'use client';

import Button from '@/components/ui/Button';
import { CirclePlus, Pencil } from 'lucide-react';
import { useState } from 'react';
import { SETTINGS_VENDORS } from '../data';
import type { VendorRecord } from '../data';
import VendorDialog from './VendorDialog';

/** 廠商管理：應付帳款依廠商分類，維護廠商資料以利帳簿頁「匯總沖帳」選擇廠商與繳費管理 */
export default function VendorSection() {
  const [vendors, setVendors] = useState<VendorRecord[]>(SETTINGS_VENDORS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VendorRecord | undefined>(undefined);

  const openNew = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };
  const openEdit = (vendor: VendorRecord) => {
    setEditing(vendor);
    setDialogOpen(true);
  };
  const handleSubmit = (data: Omit<VendorRecord, 'id'>) => {
    if (editing) {
      setVendors(list => list.map(v => (v.id === editing.id ? { ...editing, ...data } : v)));
    } else {
      setVendors(list => [...list, { ...data, id: `V${String(list.length + 1).padStart(3, '0')}` }]);
    }
  };

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-dark">廠商管理</h2>
          <p className="mt-1 text-xs text-neutral-mid">應付帳款依廠商分類，維護廠商資料以利帳簿頁「匯總沖帳」選擇廠商</p>
        </div>
        <Button size="sm" icon={CirclePlus} onClick={openNew}>
          新增廠商
        </Button>
      </div>

      {vendors.length === 0 ? (
        <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">目前沒有廠商資料</div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-md border border-neutral-blue-gray/30 nav:block">
            <table className="w-full table-fixed border-collapse text-sm">
              <colgroup>
                <col className="w-[120px]" />
                <col />
                <col className="w-[220px]" />
                <col className="w-[240px]" />
                <col className="w-16" />
              </colgroup>
              <thead className="bg-surface-off-white">
                <tr className="border-b border-neutral-blue-gray/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-mid">統編</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-mid">名稱</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-mid">登記地址</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-mid">銀行資訊</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-mid">操作</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor, i) => (
                  <tr
                    key={vendor.id}
                    className={`border-b border-neutral-blue-gray/20 last:border-0 ${i % 2 === 1 ? 'bg-surface-warm/30' : ''}`}
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-neutral-dark">{vendor.taxId || '—'}</td>
                    <td className="truncate px-4 py-3.5 text-neutral-dark" title={vendor.name}>
                      {vendor.name || '—'}
                    </td>
                    <td className="truncate px-4 py-3.5 text-neutral-mid" title={vendor.address}>
                      {vendor.address || '—'}
                    </td>
                    <td className="truncate px-4 py-3.5 text-neutral-mid">
                      {vendor.bankName ? `${vendor.bankName} ${vendor.bankBranch}（${vendor.bankAccountNumber}）` : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(vendor)}
                        aria-label={`編輯廠商 ${vendor.name || vendor.taxId}`}
                        className="text-neutral-mid hover:text-brand-blue"
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2.5 nav:hidden">
            {vendors.map(vendor => (
              <div key={vendor.id} className="flex flex-col gap-1.5 rounded-lg border border-neutral-blue-gray/30 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-neutral-dark">{vendor.name || vendor.taxId}</span>
                  <button type="button" onClick={() => openEdit(vendor)} aria-label="編輯廠商" className="shrink-0 text-neutral-mid">
                    <Pencil size={14} />
                  </button>
                </div>
                <div className="text-xs text-neutral-mid">統編　{vendor.taxId || '—'}</div>
                <div className="truncate text-xs text-neutral-mid">{vendor.address || '登記地址未填寫'}</div>
                <div className="truncate text-xs text-neutral-mid">
                  {vendor.bankName ? `${vendor.bankName} ${vendor.bankBranch}（${vendor.bankAccountNumber}）` : '尚未填寫銀行資訊'}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <VendorDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleSubmit} initial={editing} />
    </div>
  );
}
