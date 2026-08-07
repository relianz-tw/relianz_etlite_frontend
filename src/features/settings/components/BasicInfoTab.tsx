'use client';

import { getBasicSetting, updateBasicSetting } from '@/api/basicSettings';
import type { BasicSettingDto } from '@/api/types';
import TextInput from '@/components/ui/TextInput';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { Check, KeyRound, Pencil, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BASIC_INFO_LABOR_RISK } from '../data';
import ChangePasswordDialog from './ChangePasswordDialog';

/** 後端唯讀欄位（僅在 GET 回應出現、PATCH 不接受），介面一律唯讀顯示 */
interface ReadonlyFields {
  orgType: string;
  taxIdNumber: string; // 統一編號
  taxId: string; // 稅籍編號
  companyName: string;
  companyAddrPostal: string;
  companyAddr: string;
}

/** 後端可透過 PATCH /basic/companySetting/reconciliationMethod 更新的欄位 */
interface EditableFields {
  headName: string;
  nhiInsuranceCode: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}

function toReadonlyFields(dto: BasicSettingDto): ReadonlyFields {
  return {
    orgType: dto.orgType ?? '',
    taxIdNumber: dto.taxIdNumber ?? '',
    taxId: dto.taxId ?? '',
    companyName: dto.companyName ?? '',
    companyAddrPostal: dto.companyAddrPostal ?? '',
    companyAddr: dto.companyAddr ?? '',
  };
}

function toEditableFields(dto: BasicSettingDto): EditableFields {
  return {
    headName: dto.headName ?? '',
    nhiInsuranceCode: dto.nhiInsuranceCode ?? '',
    contactName: dto.contactName ?? '',
    contactPhone: dto.contactPhone ?? '',
    contactEmail: dto.contactEmail ?? '',
  };
}

export default function BasicInfoTab() {
  const [readonlyFields, setReadonlyFields] = useState<ReadonlyFields | null>(null);
  const [editableFields, setEditableFields] = useState<EditableFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // 職災費率類別後端無對應欄位，維持唯讀 mock，不隨表單送出
  const [laborRisk] = useState(BASIC_INFO_LABOR_RISK);

  const [editing, setEditing] = useState(false);
  const [snapshot, setSnapshot] = useState<EditableFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setLoadError('');
    getBasicSetting()
      .then(dto => {
        setReadonlyFields(toReadonlyFields(dto));
        setEditableFields(toEditableFields(dto));
      })
      .catch(err => setLoadError(getFriendlyErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const updateEditable = (patch: Partial<EditableFields>) => setEditableFields(f => (f ? { ...f, ...patch } : f));

  const startEdit = () => {
    if (!editableFields) return;
    setSnapshot(editableFields);
    setSaveError('');
    setEditing(true);
  };
  const cancelEdit = () => {
    if (snapshot) setEditableFields(snapshot);
    setEditing(false);
  };
  const saveEdit = async () => {
    if (!editableFields) return;
    setSaving(true);
    setSaveError('');
    try {
      await updateBasicSetting(editableFields);
      setEditing(false);
    } catch (err) {
      setSaveError(getFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
      </div>
    );
  }

  if (loadError || !readonlyFields || !editableFields) {
    return (
      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{loadError || '操作失敗'}</div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-neutral-dark">基本資料</h2>
        <div className="flex items-center gap-4 text-sm">
          {editing ? (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="flex items-center gap-1.5 text-neutral-mid hover:text-neutral-dark disabled:opacity-50"
              >
                <X size={14} />
                取消
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="flex items-center gap-1.5 font-semibold text-brand-blue disabled:opacity-50"
              >
                <Check size={14} />
                {saving ? '儲存中…' : '儲存'}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={startEdit} className="flex items-center gap-1.5 text-brand-blue">
                <Pencil size={14} />
                編輯基本資料
              </button>
              <button type="button" onClick={() => setPasswordDialogOpen(true)} className="flex items-center gap-1.5 text-brand-blue">
                <KeyRound size={14} />
                變更密碼
              </button>
            </>
          )}
        </div>
      </div>

      {saveError && <p className="mb-4 text-sm text-semantic-error">{saveError}</p>}

      <div className="grid grid-cols-1 gap-x-8 gap-y-5 nav:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">組織型態</label>
          <TextInput value={readonlyFields.orgType} disabled readOnly />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">統一編號</label>
          <TextInput value={readonlyFields.taxIdNumber} disabled readOnly />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">稅籍編號</label>
          <TextInput value={readonlyFields.taxId} disabled readOnly />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">登記名稱</label>
          <TextInput value={readonlyFields.companyName} disabled readOnly />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">負責人姓名</label>
          <TextInput value={editableFields.headName} onChange={e => updateEditable({ headName: e.target.value })} disabled={!editing} readOnly={!editing} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">健保投保單位代號</label>
          <TextInput
            value={editableFields.nhiInsuranceCode}
            onChange={e => updateEditable({ nhiInsuranceCode: e.target.value })}
            disabled={!editing}
            readOnly={!editing}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 nav:grid-cols-[120px_1fr]">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">郵遞區號</label>
          <TextInput value={readonlyFields.companyAddrPostal} disabled readOnly />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">登記地址</label>
          <TextInput value={readonlyFields.companyAddr} disabled readOnly />
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">職災費率類別</label>
        <TextInput value={laborRisk} disabled readOnly />
      </div>

      <div className="mt-6 rounded-md bg-surface-cream p-4">
        <h3 className="mb-4 text-sm font-semibold text-neutral-dark">聯絡資訊</h3>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 nav:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">聯絡人全名</label>
            <TextInput
              value={editableFields.contactName}
              onChange={e => updateEditable({ contactName: e.target.value })}
              disabled={!editing}
              readOnly={!editing}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">聯絡人電話</label>
            <TextInput
              value={editableFields.contactPhone}
              onChange={e => updateEditable({ contactPhone: e.target.value })}
              disabled={!editing}
              readOnly={!editing}
            />
          </div>
        </div>
        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">電子郵件信箱</label>
          <TextInput
            value={editableFields.contactEmail}
            onChange={e => updateEditable({ contactEmail: e.target.value })}
            disabled={!editing}
            readOnly={!editing}
          />
        </div>
      </div>

      <ChangePasswordDialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} />
    </div>
  );
}
