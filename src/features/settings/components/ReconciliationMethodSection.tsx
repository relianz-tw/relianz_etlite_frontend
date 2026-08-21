'use client';

import { getBasicSetting, updateBasicSetting } from '@/api/basicSettings';
import type { BasicSettingDto } from '@/api/types';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { Check, Pencil, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type MethodOption = 'manual' | 'auto';

const SELL_OPTIONS: { value: MethodOption; label: string }[] = [
  { value: 'manual', label: '手動對帳' },
  { value: 'auto', label: '發票開立即收款' },
];

const BUY_OPTIONS: { value: MethodOption; label: string }[] = [
  { value: 'manual', label: '手動對帳' },
  { value: 'auto', label: '發票上傳即付款' },
];

function toMethodOption(value: number): MethodOption {
  return value === 1 ? 'auto' : 'manual';
}

function toMethodValue(option: MethodOption): number {
  return option === 'auto' ? 1 : 0;
}

interface EditableFields {
  sellMethod: MethodOption;
  buyMethod: MethodOption;
}

function toEditableFields(dto: BasicSettingDto): EditableFields {
  return {
    sellMethod: toMethodOption(dto.sellReconciliationMethod),
    buyMethod: toMethodOption(dto.buyReconciliationMethod),
  };
}

export default function ReconciliationMethodSection() {
  const [fields, setFields] = useState<EditableFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [editing, setEditing] = useState(false);
  const [snapshot, setSnapshot] = useState<EditableFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setLoading(true);
    setLoadError('');
    getBasicSetting()
      .then(dto => setFields(toEditableFields(dto)))
      .catch(err => setLoadError(getFriendlyErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const updateFields = (patch: Partial<EditableFields>) => setFields(f => (f ? { ...f, ...patch } : f));

  const startEdit = () => {
    if (!fields) return;
    setSnapshot(fields);
    setSaveError('');
    setEditing(true);
  };
  const cancelEdit = () => {
    if (snapshot) setFields(snapshot);
    setEditing(false);
  };
  const saveEdit = async () => {
    if (!fields) return;
    setSaving(true);
    setSaveError('');
    try {
      await updateBasicSetting({
        sellReconciliationMethod: toMethodValue(fields.sellMethod),
        buyReconciliationMethod: toMethodValue(fields.buyMethod),
      });
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

  if (loadError || !fields) {
    return (
      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{loadError || '操作失敗'}</div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-neutral-dark">對帳方式設定</h2>
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
            <button type="button" onClick={startEdit} className="flex items-center gap-1.5 text-brand-blue">
              <Pencil size={14} />
              編輯對帳方式
            </button>
          )}
        </div>
      </div>

      {saveError && <p className="mb-4 text-sm text-semantic-error">{saveError}</p>}

      <div className="grid grid-cols-1 gap-x-8 gap-y-5 nav:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">銷項對帳方式</label>
          <SegmentedControl
            options={SELL_OPTIONS}
            value={fields.sellMethod}
            onChange={v => updateFields({ sellMethod: v })}
            disabled={!editing}
            fit
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">進項對帳方式</label>
          <SegmentedControl
            options={BUY_OPTIONS}
            value={fields.buyMethod}
            onChange={v => updateFields({ buyMethod: v })}
            disabled={!editing}
            fit
          />
        </div>
      </div>
    </div>
  );
}
