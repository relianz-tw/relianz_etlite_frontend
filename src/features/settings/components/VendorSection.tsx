'use client';

import { createVendor, initDefaultOtherVendor, listVendors, updateVendor } from '@/api/vendors';
import type { UpdateVendorBody, VendorDto } from '@/api/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { CirclePlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { VendorRecord } from '../data';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import VendorDialog from './VendorDialog';

/**
 * 後端 VendorDto 轉為畫面用的 VendorRecord。
 * 未填寫的選填欄位（如分行、帳號）後端會回傳 null，畫面一律以空字串顯示，避免出現字面上的 "null"。
 */
function toVendorRecord(dto: VendorDto): VendorRecord {
  return {
    id: dto.uuid,
    taxId: dto.taxId ?? '',
    name: dto.name ?? '',
    address: dto.registeredAddress ?? '',
    bankAccountName: dto.bankAccountName ?? '',
    bankCode: dto.bankCode ?? '',
    bankName: dto.bankName ?? '',
    bankBranch: dto.branchName ?? '',
    bankAccountNumber: dto.accountNo ?? '',
    remark: dto.remark ?? '',
    isActive: dto.isActive,
    balance: dto.balance ?? 0,
  };
}

/** VendorRecord 轉為 updateVendor() 所需的 PATCH body（不含 companyUuid，由 API 層補上） */
function toUpdateVendorBody(record: VendorRecord): Omit<UpdateVendorBody, 'companyUuid'> {
  return {
    uuid: record.id,
    taxId: record.taxId,
    name: record.name,
    registeredAddress: record.address,
    bankAccountName: record.bankAccountName,
    bankCode: record.bankCode,
    bankName: record.bankName,
    branchName: record.bankBranch,
    accountNo: record.bankAccountNumber,
    remark: record.remark,
    isActive: record.isActive,
    balance: record.balance,
  };
}

/** 廠商管理：應付帳款依廠商分類，維護廠商資料以利帳簿頁「匯總沖帳」選擇廠商與繳費管理 */
export default function VendorSection() {
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VendorRecord | undefined>(undefined);
  const [actionError, setActionError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pendingDeactivate, setPendingDeactivate] = useState<VendorRecord | null>(null);
  // 整個 mount 週期只嘗試自動開通一次「其他」廠商，避免開通失敗時反覆重試造成無限迴圈
  const initOtherAttempted = useRef(false);

  const loadVendors = () => {
    setLoading(true);
    setLoadError('');
    listVendors()
      .then(async list => {
        // 清單完全沒有「其他」時自動開通一筆；失敗不影響既有清單顯示，錯誤走 actionError
        if (!initOtherAttempted.current && !list.some(v => v.name === '其他')) {
          initOtherAttempted.current = true;
          try {
            await initDefaultOtherVendor();
            list = await listVendors();
          } catch (err) {
            setActionError(getFriendlyErrorMessage(err));
          }
        }
        setVendors(list.map(toVendorRecord));
      })
      .catch(err => setLoadError(getFriendlyErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const openNew = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };
  const openEdit = (vendor: VendorRecord) => {
    setEditing(vendor);
    setDialogOpen(true);
  };
  const handleSubmit = async (data: Omit<VendorRecord, 'id'>) => {
    if (editing) {
      await updateVendor(toUpdateVendorBody({ ...data, id: editing.id }));
    } else {
      await createVendor({
        taxId: data.taxId,
        name: data.name,
        registeredAddress: data.address,
        bankAccountName: data.bankAccountName,
        bankCode: data.bankCode,
        bankName: data.bankName,
        branchName: data.bankBranch,
        accountNo: data.bankAccountNumber,
        remark: data.remark,
      });
    }
    loadVendors();
  };

  const deactivateVendor = async (vendor: VendorRecord) => {
    setSavingId(vendor.id);
    setActionError('');
    try {
      await updateVendor(toUpdateVendorBody({ ...vendor, isActive: false }));
      loadVendors();
    } catch (err) {
      setActionError(getFriendlyErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const activateVendor = async (vendor: VendorRecord) => {
    setSavingId(vendor.id);
    setActionError('');
    try {
      await updateVendor(toUpdateVendorBody({ ...vendor, isActive: true }));
      loadVendors();
    } catch (err) {
      setActionError(getFriendlyErrorMessage(err));
    } finally {
      setSavingId(null);
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

      {actionError && <p className="mb-4 text-sm text-semantic-error">{actionError}</p>}

      {loading ? (
        <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
      ) : loadError ? (
        <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{loadError}</div>
      ) : vendors.length === 0 ? (
        <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">目前沒有廠商資料</div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-md border border-neutral-blue-gray/30 nav:block">
            <table className="w-full table-fixed border-collapse text-sm">
              <colgroup>
                <col className="w-[120px]" />
                <col />
                <col className="w-[280px]" />
                <col className="w-[300px]" />
                <col className="w-[96px]" />
                <col className="w-[168px]" />
              </colgroup>
              <thead className="bg-surface-off-white">
                <tr className="border-b border-neutral-blue-gray/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-mid">統編</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-mid">名稱</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-mid">地址</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-mid">銀行資訊</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-mid">狀態</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-mid">操作</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor, i) => {
                  const isOtherVendor = vendor.name === '其他';
                  return (
                  <tr
                    key={vendor.id}
                    className={`border-b border-neutral-blue-gray/20 last:border-0 ${i % 2 === 1 ? 'bg-surface-warm/30' : ''}`}
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-neutral-dark">{vendor.taxId || '—'}</td>
                    <td className="whitespace-normal break-words px-4 py-3.5 text-neutral-dark">{vendor.name || '—'}</td>
                    <td className="truncate px-4 py-3.5 text-neutral-mid" title={vendor.address}>
                      {vendor.address || '—'}
                    </td>
                    <td className="truncate px-4 py-3.5 text-neutral-mid">
                      {vendor.bankName ? `${vendor.bankName} ${vendor.bankBranch}（${vendor.bankAccountNumber}）` : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      {vendor.isActive ? (
                        <Badge tone="success" variant="muted">
                          啟用中
                        </Badge>
                      ) : (
                        <Badge tone="neutral" variant="muted">
                          已停用
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" disabled={isOtherVendor} onClick={() => openEdit(vendor)}>
                          編輯
                        </Button>
                        {vendor.isActive ? (
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={isOtherVendor || savingId === vendor.id}
                            onClick={() => setPendingDeactivate(vendor)}
                          >
                            停用
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled={savingId === vendor.id} onClick={() => activateVendor(vendor)}>
                            啟用
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2.5 nav:hidden">
            {vendors.map(vendor => {
              const isOtherVendor = vendor.name === '其他';
              return (
              <div key={vendor.id} className="flex flex-col gap-1.5 rounded-lg border border-neutral-blue-gray/30 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-neutral-dark" title={vendor.name || vendor.taxId}>
                      {vendor.name || vendor.taxId}
                    </span>
                    {vendor.isActive ? (
                      <Badge tone="success" variant="muted">
                        啟用中
                      </Badge>
                    ) : (
                      <Badge tone="neutral" variant="muted">
                        已停用
                      </Badge>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button size="sm" variant="ghost" disabled={isOtherVendor} onClick={() => openEdit(vendor)}>
                      編輯
                    </Button>
                    {vendor.isActive ? (
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={isOtherVendor || savingId === vendor.id}
                        onClick={() => setPendingDeactivate(vendor)}
                      >
                        停用
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled={savingId === vendor.id} onClick={() => activateVendor(vendor)}>
                        啟用
                      </Button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-neutral-mid">統編　{vendor.taxId || '—'}</div>
                <div className="truncate text-xs text-neutral-mid">{vendor.address || '地址未填寫'}</div>
                <div className="truncate text-xs text-neutral-mid">
                  {vendor.bankName ? `${vendor.bankName} ${vendor.bankBranch}（${vendor.bankAccountNumber}）` : '尚未填寫銀行資訊'}
                </div>
              </div>
              );
            })}
          </div>
        </>
      )}

      <VendorDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleSubmit} initial={editing} />

      <ConfirmDeleteDialog
        open={!!pendingDeactivate}
        onClose={() => setPendingDeactivate(null)}
        onConfirm={() => {
          if (pendingDeactivate) deactivateVendor(pendingDeactivate);
        }}
        title="停用廠商"
        message={`確定要停用「${pendingDeactivate?.name || pendingDeactivate?.taxId}」嗎？停用後可於清單重新啟用。`}
        confirmLabel="確定停用"
      />
    </div>
  );
}
